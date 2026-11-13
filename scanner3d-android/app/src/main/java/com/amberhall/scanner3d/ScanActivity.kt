package com.amberhall.scanner3d

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.Surface
import android.view.View
import android.view.WindowManager
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.amberhall.scanner3d.io.MeshIO
import com.amberhall.scanner3d.io.ScanInfo
import com.amberhall.scanner3d.io.ScanStore
import com.amberhall.scanner3d.recon.DepthFrame
import com.amberhall.scanner3d.recon.PreviewCloud
import com.amberhall.scanner3d.recon.TsdfVolume
import com.amberhall.scanner3d.render.BackgroundRenderer
import com.amberhall.scanner3d.render.PointCloudRenderer
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.progressindicator.LinearProgressIndicator
import com.google.ar.core.ArCoreApk
import com.google.ar.core.Camera
import com.google.ar.core.CameraConfig
import com.google.ar.core.CameraConfigFilter
import com.google.ar.core.Config
import com.google.ar.core.Frame
import com.google.ar.core.Session
import com.google.ar.core.TrackingFailureReason
import com.google.ar.core.TrackingState
import com.google.ar.core.exceptions.CameraNotAvailableException
import com.google.ar.core.exceptions.NotYetAvailableException
import com.google.ar.core.exceptions.UnavailableDeviceNotCompatibleException
import com.google.ar.core.exceptions.UnavailableUserDeclinedInstallationException
import java.io.File
import java.nio.ByteOrder
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.abs

/**
 * Экран сканирования: ARCore отслеживает положение телефона и строит карту глубины,
 * а мы сливаем все карты глубины в один TSDF-объём, из которого потом строится сетка.
 */
class ScanActivity : AppCompatActivity(), GLSurfaceView.Renderer {

    private enum class Preset(val title: String, val voxel: Float, val minDepth: Float, val maxDepth: Float, val hint: String) {
        OBJECT("Предмет", 0.007f, 0.15f, 1.5f, "Детализация 7 мм · до 1,5 м — для вещей на столе"),
        NORMAL("Обычный", 0.015f, 0.2f, 3.0f, "Детализация 1,5 см · до 3 м — мебель, люди, уголки"),
        ROOM("Комната", 0.03f, 0.3f, 5.0f, "Детализация 3 см · до 5 м — комнаты целиком"),
        OUTDOOR("Улица", 0.05f, 0.4f, 8.0f, "Детализация 5 см · до 8 м — двор, фасады, территория"),
    }

    private lateinit var surface: GLSurfaceView
    private lateinit var statusText: TextView
    private lateinit var statsText: TextView
    private lateinit var modeGroup: MaterialButtonToggleGroup
    private lateinit var modeHint: TextView
    private lateinit var btnRecord: ImageButton
    private lateinit var btnDone: MaterialButton
    private lateinit var btnReset: MaterialButton
    private lateinit var progressOverlay: View
    private lateinit var progressText: TextView
    private lateinit var progressBar: LinearProgressIndicator

    private var session: Session? = null
    private var installRequested = false
    private var textureSet = false

    private val background = BackgroundRenderer()
    private val pointRenderer = PointCloudRenderer()

    // Рабочий поток: интеграция кадров и построение сетки. TSDF-объём трогаем только из него.
    private val worker = Executors.newSingleThreadExecutor()
    private var volume: TsdfVolume? = null
    private val preview = PreviewCloud(450_000)
    private val busy = AtomicBoolean(false)
    private val framesIntegrated = AtomicInteger(0)
    @Volatile private var blockCount = 0

    @Volatile private var recording = false
    @Volatile private var processing = false
    private var preset = Preset.NORMAL

    // Состояние, обновляемое из GL-потока для UI.
    @Volatile private var trackingState = TrackingState.STOPPED
    @Volatile private var failureReason = TrackingFailureReason.NONE

    private var viewportW = 0
    private var viewportH = 0
    private var viewportChanged = false
    private var displayRotation = Surface.ROTATION_0
    private var lastIntegrateNs = 0L
    @Volatile private var lastPose: FloatArray? = null

    private val proj = FloatArray(16)
    private val view = FloatArray(16)
    private val mvp = FloatArray(16)

    private val ui = Handler(Looper.getMainLooper())
    private val uiTick = object : Runnable {
        override fun run() {
            updateUi()
            ui.postDelayed(this, 250)
        }
    }

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
            if (!granted) {
                Toast.makeText(this, "Без доступа к камере сканирование невозможно", Toast.LENGTH_LONG).show()
                finish()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_scan)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        findViewById<View>(R.id.uiRoot).padForSystemBars()

        surface = findViewById(R.id.surface)
        statusText = findViewById(R.id.status)
        statsText = findViewById(R.id.stats)
        modeGroup = findViewById(R.id.modeGroup)
        modeHint = findViewById(R.id.modeHint)
        btnRecord = findViewById(R.id.btnRecord)
        btnDone = findViewById(R.id.btnDone)
        btnReset = findViewById(R.id.btnReset)
        progressOverlay = findViewById(R.id.progressOverlay)
        progressText = findViewById(R.id.progressText)
        progressBar = findViewById(R.id.progressBar)

        surface.preserveEGLContextOnPause = true
        surface.setEGLContextClientVersion(3)
        surface.setEGLConfigChooser(8, 8, 8, 8, 16, 0)
        surface.setRenderer(this)
        surface.renderMode = GLSurfaceView.RENDERMODE_CONTINUOUSLY
        surface.setWillNotDraw(false)

        modeGroup.addOnButtonCheckedListener { _, id, checked ->
            if (!checked) return@addOnButtonCheckedListener
            preset = when (id) {
                R.id.modeObject -> Preset.OBJECT
                R.id.modeRoom -> Preset.ROOM
                R.id.modeOutdoor -> Preset.OUTDOOR
                else -> Preset.NORMAL
            }
            modeHint.text = preset.hint
        }
        modeHint.text = preset.hint

        btnRecord.setOnClickListener { toggleRecording() }
        btnReset.setOnClickListener { resetScan() }
        btnDone.setOnClickListener { finishScan() }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (processing) return
                if (framesIntegrated.get() > 0) {
                    MaterialAlertDialogBuilder(this@ScanActivity)
                        .setTitle("Выйти без сохранения?")
                        .setMessage("Отсканированные данные будут потеряны.")
                        .setPositiveButton("Выйти") { _, _ -> finish() }
                        .setNegativeButton("Остаться", null)
                        .show()
                } else {
                    finish()
                }
            }
        })
    }

    // ------------------------------------------------------------------ жизненный цикл ARCore

    override fun onResume() {
        super.onResume()
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
            return
        }
        if (!createSessionIfNeeded()) return
        try {
            session?.resume()
        } catch (e: CameraNotAvailableException) {
            showFatal("Камера недоступна. Закройте другие приложения, использующие камеру, и попробуйте снова.")
            session = null
            return
        }
        surface.onResume()
        ui.post(uiTick)
    }

    override fun onPause() {
        super.onPause()
        ui.removeCallbacks(uiTick)
        if (session != null) {
            surface.onPause()
            session?.pause()
        }
        if (recording) {
            recording = false
            updateRecordButton()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        worker.shutdownNow()
        session?.close()
        session = null
    }

    private fun createSessionIfNeeded(): Boolean {
        if (session != null) return true
        try {
            when (ArCoreApk.getInstance().requestInstall(this, !installRequested)) {
                ArCoreApk.InstallStatus.INSTALL_REQUESTED -> {
                    installRequested = true
                    return false
                }
                ArCoreApk.InstallStatus.INSTALLED -> Unit
            }
            val s = Session(this)
            if (!s.isDepthModeSupported(Config.DepthMode.AUTOMATIC)) {
                s.close()
                showFatal(
                    "К сожалению, этот телефон не поддерживает ARCore Depth API — " +
                        "без него построить 3D-модель нельзя.\n\nСписок поддерживаемых устройств: " +
                        "developers.google.com/ar/devices (колонка «Supports Depth API»)."
                )
                return false
            }
            chooseCameraConfig(s)
            val config = Config(s).apply {
                depthMode = Config.DepthMode.AUTOMATIC
                focusMode = Config.FocusMode.AUTO
                planeFindingMode = Config.PlaneFindingMode.DISABLED
                lightEstimationMode = Config.LightEstimationMode.DISABLED
                instantPlacementMode = Config.InstantPlacementMode.DISABLED
            }
            s.configure(config)
            session = s
            return true
        } catch (e: UnavailableUserDeclinedInstallationException) {
            showFatal("Для сканирования нужно установить «Сервисы Google Play для AR».")
        } catch (e: UnavailableDeviceNotCompatibleException) {
            showFatal("Этот телефон не поддерживает ARCore.")
        } catch (e: Exception) {
            Log.e(TAG, "Session error", e)
            showFatal("Не удалось запустить AR: ${e.message}")
        }
        return false
    }

    /**
     * Выбираем конфигурацию камеры, где у GPU-текстуры и CPU-изображения одинаковые
     * пропорции — тогда карта глубины, цвет и экран точно совпадают. Если у телефона
     * есть ToF-датчик глубины — используем его.
     */
    private fun chooseCameraConfig(s: Session) {
        try {
            val filter = CameraConfigFilter(s).setFacingDirection(CameraConfig.FacingDirection.BACK)
            val configs = s.getSupportedCameraConfigs(filter)
            if (configs.isEmpty()) return
            val best = configs.maxByOrNull { c ->
                val img = c.imageSize; val tex = c.textureSize
                val aspectImg = img.width.toFloat() / img.height
                val aspectTex = tex.width.toFloat() / tex.height
                var score = 0f
                if (abs(aspectImg - aspectTex) < 0.02f) score += 100f
                if (c.depthSensorUsage == CameraConfig.DepthSensorUsage.REQUIRE_AND_USE) score += 50f
                score -= abs(img.width - 640) / 100f
                score += tex.width / 1000f
                score
            } ?: return
            s.cameraConfig = best
            Log.i(TAG, "Camera config: image=${best.imageSize} texture=${best.textureSize} depth=${best.depthSensorUsage}")
        } catch (e: Exception) {
            Log.w(TAG, "Camera config selection failed", e)
        }
    }

    private fun showFatal(message: String) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Сканирование недоступно")
            .setMessage(message)
            .setCancelable(false)
            .setPositiveButton("OK") { _, _ -> finish() }
            .show()
    }

    // ------------------------------------------------------------------ GL

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        GLES20.glClearColor(0f, 0f, 0f, 1f)
        background.create()
        pointRenderer.create()
        textureSet = false
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        GLES20.glViewport(0, 0, width, height)
        viewportW = width
        viewportH = height
        displayRotation = currentRotation()
        viewportChanged = true
    }

    @Suppress("DEPRECATION")
    private fun currentRotation(): Int =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) display?.rotation ?: Surface.ROTATION_0
        else windowManager.defaultDisplay.rotation

    override fun onDrawFrame(gl: GL10?) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT or GLES20.GL_DEPTH_BUFFER_BIT)
        val s = session ?: return
        if (viewportChanged) {
            s.setDisplayGeometry(displayRotation, viewportW, viewportH)
            viewportChanged = false
        }
        try {
            if (!textureSet) {
                s.setCameraTextureName(background.textureId)
                textureSet = true
            }
            val frame = s.update()
            val camera = frame.camera
            background.dim = if (recording) 0.3f else 0.1f
            background.draw(frame)

            trackingState = camera.trackingState
            failureReason = camera.trackingFailureReason
            if (camera.trackingState != TrackingState.TRACKING) return

            camera.getProjectionMatrix(proj, 0, 0.05f, 50f)
            camera.getViewMatrix(view, 0)
            Matrix.multiplyMM(mvp, 0, proj, 0, view, 0)
            // Размер точки ≈ размер ячейки на расстоянии 1 м в пикселях.
            val pointSize = (preset.voxel.coerceAtLeast(0.008f) * proj[5] * viewportH * 0.5f * 1.4f).coerceIn(2f, 24f)
            GLES20.glEnable(GLES20.GL_DEPTH_TEST)
            pointRenderer.draw(preview, mvp, pointSize)

            if (recording && !processing && !busy.get()) {
                val now = System.nanoTime()
                if (now - lastIntegrateNs > MIN_INTEGRATE_INTERVAL_NS && captureAndIntegrate(frame, camera)) {
                    lastIntegrateNs = now
                }
            }
        } catch (e: Throwable) {
            Log.e(TAG, "onDrawFrame", e)
        }
    }

    private fun captureAndIntegrate(frame: Frame, camera: Camera): Boolean {
        val pose = FloatArray(16)
        camera.pose.toMatrix(pose, 0)
        // Если телефон стоит неподвижно — интегрируем реже (данные всё равно те же).
        lastPose?.let { prev ->
            val moved = abs(prev[12] - pose[12]) + abs(prev[13] - pose[13]) + abs(prev[14] - pose[14])
            val turned = abs(prev[8] - pose[8]) + abs(prev[9] - pose[9]) + abs(prev[10] - pose[10])
            if (moved < 0.003f && turned < 0.005f && System.nanoTime() - lastIntegrateNs < 600_000_000L) return false
        }

        val df: DepthFrame = try {
            frame.acquireDepthImage16Bits().use { depthImage ->
                frame.acquireCameraImage().use { colorImage ->
                    val dw = depthImage.width
                    val dh = depthImage.height
                    val dPlane = depthImage.planes[0]
                    val dBuf = dPlane.buffer.order(ByteOrder.nativeOrder())
                    val dRow = dPlane.rowStride
                    val dPix = dPlane.pixelStride
                    val depth = FloatArray(dw * dh)
                    for (y in 0 until dh) {
                        val rowOff = y * dRow
                        for (x in 0 until dw) {
                            val mm = dBuf.getShort(rowOff + x * dPix).toInt() and 0xFFFF
                            depth[y * dw + x] = mm * 0.001f
                        }
                    }

                    // Внутренние параметры камеры для карты глубины (масштабированные из текстуры).
                    val ti = camera.textureIntrinsics
                    val tDims = ti.imageDimensions
                    val tf = ti.focalLength
                    val tp = ti.principalPoint
                    val sx = dw.toFloat() / tDims[0]
                    val sy = dh.toFloat() / tDims[1]

                    val ii = camera.imageIntrinsics
                    val iDims = ii.imageDimensions
                    val cw = colorImage.width
                    val ch = colorImage.height
                    val csx = cw.toFloat() / iDims[0]
                    val csy = ch.toFloat() / iDims[1]

                    val yP = colorImage.planes[0]
                    val uP = colorImage.planes[1]
                    val vP = colorImage.planes[2]
                    DepthFrame(
                        depthW = dw, depthH = dh, depth = depth,
                        dfx = tf[0] * sx, dfy = tf[1] * sy, dcx = tp[0] * sx, dcy = tp[1] * sy,
                        colorW = cw, colorH = ch,
                        yPlane = copy(yP.buffer), yRowStride = yP.rowStride, yPixelStride = yP.pixelStride,
                        uPlane = copy(uP.buffer), vPlane = copy(vP.buffer),
                        uvRowStride = uP.rowStride, uvPixelStride = uP.pixelStride,
                        cfx = ii.focalLength[0] * csx, cfy = ii.focalLength[1] * csy,
                        ccx = ii.principalPoint[0] * csx, ccy = ii.principalPoint[1] * csy,
                        camToWorld = pose,
                    )
                }
            }
        } catch (e: NotYetAvailableException) {
            return false
        }
        lastPose = pose

        val p = preset
        busy.set(true)
        worker.execute {
            try {
                val vol = volume ?: TsdfVolume(p.voxel, p.minDepth, p.maxDepth).also {
                    volume = it
                    preview.setCellSize(maxOf(p.voxel, 0.01f))
                }
                vol.integrate(df, preview)
                blockCount = vol.blockCount
                framesIntegrated.incrementAndGet()
            } catch (e: Throwable) {
                Log.e(TAG, "integrate", e)
            } finally {
                busy.set(false)
            }
        }
        return true
    }

    private fun copy(buf: java.nio.ByteBuffer): ByteArray {
        val b = buf.duplicate()
        b.rewind()
        val out = ByteArray(b.remaining())
        b.get(out)
        return out
    }

    // ------------------------------------------------------------------ управление

    private fun toggleRecording() {
        if (processing) return
        if (!recording && trackingState != TrackingState.TRACKING) {
            Toast.makeText(this, "Подождите, пока камера определит положение — плавно поводите телефоном", Toast.LENGTH_SHORT).show()
            return
        }
        recording = !recording
        updateRecordButton()
        updateUi()
    }

    private fun updateRecordButton() {
        btnRecord.setBackgroundResource(if (recording) R.drawable.btn_pause else R.drawable.btn_record)
        btnRecord.contentDescription = if (recording) "Пауза" else "Запись"
    }

    private fun resetScan() {
        if (processing) return
        recording = false
        updateRecordButton()
        worker.execute {
            volume = null
            preview.clear()
            blockCount = 0
            framesIntegrated.set(0)
            lastPose = null
        }
        updateUi()
    }

    private fun finishScan() {
        if (processing || framesIntegrated.get() == 0) return
        recording = false
        processing = true
        updateRecordButton()
        progressOverlay.visibility = View.VISIBLE
        progressText.text = "Строим 3D-модель…"
        progressBar.isIndeterminate = false
        progressBar.progress = 0
        val p = preset

        worker.execute {
            try {
                val vol = volume
                val mesh = vol?.extractMesh { f ->
                    ui.post { progressBar.setProgressCompat((f * 80).toInt(), true) }
                }
                if (mesh == null) {
                    ui.post {
                        processing = false
                        progressOverlay.visibility = View.GONE
                        MaterialAlertDialogBuilder(this)
                            .setTitle("Мало данных")
                            .setMessage("Не удалось построить поверхность. Сканируйте дольше, медленно обходя объект со всех сторон.")
                            .setPositiveButton("OK", null)
                            .show()
                    }
                    return@execute
                }
                ui.post { progressText.text = "Сохраняем…" }
                val dir = ScanStore.newScanDir(this)
                MeshIO.writePly(mesh, File(dir, ScanStore.PLY))
                ui.post { progressBar.setProgressCompat(87, true) }
                MeshIO.writeGlb(mesh, File(dir, ScanStore.GLB))
                ui.post { progressBar.setProgressCompat(93, true) }
                MeshIO.writeObj(mesh, File(dir, ScanStore.OBJ))
                val count = ScanStore.list(this).size
                val info = ScanInfo(
                    dir = dir,
                    name = "${p.title} №$count",
                    createdAt = System.currentTimeMillis(),
                    vertices = mesh.vertexCount,
                    triangles = mesh.triangleCount,
                    voxelMm = (p.voxel * 1000).toInt(),
                )
                ScanStore.writeMeta(info)
                ui.post {
                    progressBar.setProgressCompat(100, true)
                    startActivity(
                        Intent(this, ViewerActivity::class.java).putExtra(ViewerActivity.EXTRA_DIR, dir.absolutePath)
                    )
                    finish()
                }
            } catch (e: Throwable) {
                Log.e(TAG, "finish", e)
                ui.post {
                    processing = false
                    progressOverlay.visibility = View.GONE
                    Toast.makeText(this, "Ошибка: ${e.message}", Toast.LENGTH_LONG).show()
                }
            }
        }
    }

    private fun updateUi() {
        val frames = framesIntegrated.get()
        val hasData = frames > 0
        for (i in 0 until modeGroup.childCount) modeGroup.getChildAt(i).isEnabled = !hasData && !recording
        btnDone.isEnabled = hasData && !processing
        btnReset.isEnabled = hasData || recording

        statusText.text = when {
            processing -> "Обработка…"
            trackingState != TrackingState.TRACKING -> when (failureReason) {
                TrackingFailureReason.INSUFFICIENT_LIGHT -> "Слишком темно — добавьте света"
                TrackingFailureReason.EXCESSIVE_MOTION -> "Двигайте телефон медленнее"
                TrackingFailureReason.INSUFFICIENT_FEATURES -> "Наведите на поверхность с деталями"
                TrackingFailureReason.CAMERA_UNAVAILABLE -> "Камера недоступна"
                else -> "Плавно поводите телефоном, чтобы начать"
            }
            recording -> "Сканирование… медленно обходите объект"
            hasData -> "Пауза. Продолжите или нажмите «Готово»"
            else -> "Наведите камеру и нажмите красную кнопку"
        }
        val pts = preview.count
        statsText.text = if (hasData) {
            "Точек: ${formatCount(pts)} · кадров: $frames · блоков: $blockCount" +
                if (pts >= preview.capacity) " · предпросмотр заполнен" else ""
        } else {
            "Режим: ${preset.title}. Держите телефон в 0,3–${preset.maxDepth.toString().replace('.', ',')} м от объекта."
        }
    }

    companion object {
        private const val TAG = "ScanActivity"
        private const val MIN_INTEGRATE_INTERVAL_NS = 90_000_000L
    }
}
