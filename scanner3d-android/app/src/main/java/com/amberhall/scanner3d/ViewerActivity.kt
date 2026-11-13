package com.amberhall.scanner3d

import android.annotation.SuppressLint
import android.content.Intent
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.os.Bundle
import android.view.GestureDetector
import android.view.MotionEvent
import android.view.ScaleGestureDetector
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import com.amberhall.scanner3d.io.MeshIO
import com.amberhall.scanner3d.io.ScanInfo
import com.amberhall.scanner3d.io.ScanStore
import com.amberhall.scanner3d.recon.Mesh
import com.amberhall.scanner3d.render.MeshRenderer
import com.amberhall.scanner3d.render.OrbitCamera
import com.google.android.material.button.MaterialButtonToggleGroup
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import java.io.File
import java.util.Locale
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.concurrent.thread

/** Просмотр готовой 3D-модели с вращением, масштабом и экспортом. */
class ViewerActivity : AppCompatActivity(), GLSurfaceView.Renderer {

    private lateinit var surface: GLSurfaceView
    private lateinit var info: ScanInfo
    private val renderer = MeshRenderer()
    private val camera = OrbitCamera()

    @Volatile private var pendingMesh: Mesh? = null
    @Volatile private var mode = 0
    private var width = 1
    private var height = 1

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_viewer)
        findViewById<View>(R.id.uiRoot).padForSystemBars()

        val dir = File(intent.getStringExtra(EXTRA_DIR) ?: run { finish(); return })
        info = ScanStore.read(dir) ?: run { finish(); return }
        findViewById<TextView>(R.id.title).text = info.name

        surface = findViewById(R.id.surface)
        surface.setEGLContextClientVersion(3)
        surface.setEGLConfigChooser(8, 8, 8, 8, 24, 0)
        surface.setRenderer(this)
        surface.renderMode = GLSurfaceView.RENDERMODE_WHEN_DIRTY

        findViewById<MaterialButtonToggleGroup>(R.id.shadeGroup).addOnButtonCheckedListener { _, id, checked ->
            if (!checked) return@addOnButtonCheckedListener
            mode = when (id) {
                R.id.shadeClay -> 1
                R.id.shadeNormals -> 2
                else -> 0
            }
            surface.requestRender()
        }
        findViewById<View>(R.id.btnShare).setOnClickListener { chooseFormat(share = true) }
        findViewById<View>(R.id.btnSave).setOnClickListener { chooseFormat(share = false) }

        setupGestures()

        thread(name = "load-mesh") {
            try {
                val mesh = MeshIO.readPly(File(dir, ScanStore.PLY))
                val b = mesh.bounds()
                val sizeText = String.format(
                    Locale.US, "%.2f × %.2f × %.2f м", b[3] - b[0], b[4] - b[1], b[5] - b[2]
                ).replace('.', ',')
                runOnUiThread {
                    findViewById<TextView>(R.id.info).text =
                        "${formatCount(mesh.triangleCount)} треугольников · $sizeText" +
                            if (info.voxelMm > 0) " · детализация ${info.voxelMm} мм" else ""
                }
                camera.frame(b)
                pendingMesh = mesh
                surface.requestRender()
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this, "Не удалось открыть модель: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        surface.onResume()
    }

    override fun onPause() {
        super.onPause()
        surface.onPause()
    }

    // ------------------------------------------------------------------ жесты

    @SuppressLint("ClickableViewAccessibility")
    private fun setupGestures() {
        var lastX = 0f
        var lastY = 0f
        var lastFocusX = 0f
        var lastFocusY = 0f
        var pointers = 0

        val scale = ScaleGestureDetector(this, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(d: ScaleGestureDetector): Boolean {
                camera.zoom(d.scaleFactor)
                surface.requestRender()
                return true
            }
        })
        val taps = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDoubleTap(e: MotionEvent): Boolean {
                camera.reset()
                surface.requestRender()
                return true
            }
        })

        surface.setOnTouchListener { _, e ->
            scale.onTouchEvent(e)
            taps.onTouchEvent(e)
            var fx = 0f; var fy = 0f
            for (i in 0 until e.pointerCount) { fx += e.getX(i); fy += e.getY(i) }
            fx /= e.pointerCount; fy /= e.pointerCount

            when (e.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    pointers = 1; lastX = e.x; lastY = e.y
                }
                MotionEvent.ACTION_POINTER_DOWN, MotionEvent.ACTION_POINTER_UP -> {
                    pointers = if (e.actionMasked == MotionEvent.ACTION_POINTER_UP) e.pointerCount - 1 else e.pointerCount
                    // Пересчитываем фокус без уходящего пальца.
                    var sx = 0f; var sy = 0f; var n = 0
                    for (i in 0 until e.pointerCount) {
                        if (e.actionMasked == MotionEvent.ACTION_POINTER_UP && i == e.actionIndex) continue
                        sx += e.getX(i); sy += e.getY(i); n++
                    }
                    if (n > 0) { lastFocusX = sx / n; lastFocusY = sy / n; lastX = lastFocusX; lastY = lastFocusY }
                }
                MotionEvent.ACTION_MOVE -> {
                    if (pointers == 1 && !scale.isInProgress) {
                        camera.rotate(e.x - lastX, e.y - lastY)
                        lastX = e.x; lastY = e.y
                    } else if (pointers >= 2) {
                        camera.pan(fx - lastFocusX, fy - lastFocusY, height)
                        lastFocusX = fx; lastFocusY = fy
                    }
                    surface.requestRender()
                }
                MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> pointers = 0
            }
            true
        }
    }

    // ------------------------------------------------------------------ экспорт

    private fun chooseFormat(share: Boolean) {
        val labels = arrayOf(
            "GLB — для Android/Windows, сайтов, Blender",
            "OBJ — универсальный (цвет в вершинах)",
            "PLY — для MeshLab, CloudCompare",
        )
        val files = arrayOf(ScanStore.GLB, ScanStore.OBJ, ScanStore.PLY)
        MaterialAlertDialogBuilder(this)
            .setTitle(if (share) "Поделиться в формате" else "Сохранить в Загрузки")
            .setItems(labels) { _, which ->
                val f = File(info.dir, files[which])
                if (!f.exists()) {
                    Toast.makeText(this, "Файл не найден", Toast.LENGTH_SHORT).show()
                    return@setItems
                }
                val niceName = info.name.replace(Regex("[^\\p{L}\\p{N}_ -]"), "_") + "." + f.extension
                if (share) share(f, niceName) else saveToDownloads(f, niceName)
            }
            .show()
    }

    private fun share(file: File, niceName: String) {
        val uri = FileProvider.getUriForFile(this, "$packageName.files", file)
        val send = Intent(Intent.ACTION_SEND).apply {
            type = ScanStore.mimeFor(file)
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(Intent.EXTRA_SUBJECT, niceName)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(send, "Отправить 3D-модель"))
    }

    private fun saveToDownloads(file: File, niceName: String) {
        thread {
            val uri = try { ScanStore.copyToDownloads(this, file, niceName) } catch (e: Exception) { null }
            runOnUiThread {
                if (uri != null) {
                    Toast.makeText(this, "Сохранено: Загрузки/3D Scanner/$niceName", Toast.LENGTH_LONG).show()
                } else {
                    Toast.makeText(this, "Не удалось сохранить. Используйте «Поделиться».", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    // ------------------------------------------------------------------ GL

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glClearColor(0.055f, 0.067f, 0.086f, 1f)
        GLES20.glEnable(GLES20.GL_DEPTH_TEST)
        renderer.create()
        // Контекст мог пересоздаться — загрузим сетку заново.
        lastUploaded = null
    }

    private var lastUploaded: Mesh? = null

    override fun onSurfaceChanged(gl: GL10?, w: Int, h: Int) {
        GLES20.glViewport(0, 0, w, h)
        width = w; height = h
    }

    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        val mesh = pendingMesh ?: return
        if (mesh !== lastUploaded) {
            renderer.upload(mesh)
            lastUploaded = mesh
        }
        val view = camera.viewMatrix()
        val proj = camera.projectionMatrix(width.toFloat() / height)
        val mvp = FloatArray(16)
        Matrix.multiplyMM(mvp, 0, proj, 0, view, 0)
        renderer.draw(mvp, view, mode)
    }

    companion object {
        const val EXTRA_DIR = "dir"
    }
}
