package com.amberhall.scanner3d

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.media.Image
import android.opengl.GLES20
import android.opengl.GLSurfaceView
import android.opengl.Matrix
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.ScaleGestureDetector
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
import com.amberhall.scanner3d.render.BoxRenderer
import com.amberhall.scanner3d.render.PointCloudRenderer
import com.google.android.material.button.MaterialButton
import com.google.android.material.button.MaterialButtonToggleGroup
import com.google.android.material.checkbox.MaterialCheckBox
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
import java.util.Locale
import java.util.concurrent.Executors
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicInteger
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import kotlin.math.abs
import kotlin.math.sqrt

/**
 * Экран сканирования: ARCore отслеживает положение телефона и строит карту глубины,
 * а мы сливаем карты глубины в один TSDF-объём, из которого потом строится сетка.
 *
 * Используется «сырая» глубина ARCore с картой уверенности: она разреженнее
 * сглаженной, но не содержит выдуманных поверхностей.
 */
class ScanActivity : AppCompatActivity(), GLSurfaceView.Renderer {

    private enum class Preset(
        val title: String,
        val voxel: Float,
        val minDepth: Float,
        val maxDepth: Float,
        /** Половина стороны области сканирования по умолчанию (0 — без области). */
        val roiHalf: Float,
        val roiMin: Float,
        val roiMax: Float,
        val smooth: Int,
        val hint: String,
    ) {
        OBJECT("Предмет", 0.006f, 0.15f, 1.2f, 0.25f, 0.08f, 0.8f, 3,
            "Детализация 6 мм · держите телефон в 30–80 см от предмета"),
        NORMAL("Обычный", 0.012f, 0.2f, 3.0f, 0.8f, 0.3f, 2.5f, 2,
            "Детализация 1,2 см · мебель, люди, уголки"),
        ROOM("Комната", 0.03f, 0.3f, 5.0f, 0f, 0f, 0f, 1,
            "Детализация 3 см · до 5 м — комнаты целиком"),
        OUTDOOR("Улица", 0.05f, 0.4f, 8.0f, 0f, 0f, 0f, 1,
            "Детализация 5 см · до 8 м — двор, фасады, территория"),
    }

    private lateinit var surface: GLSurfaceView
    private lateinit var statusText: TextView
    private lateinit var statsText: TextView
    private lateinit var modeGroup: MaterialButtonToggleGroup
    private lateinit var modeHint: TextView
    private lateinit var removeTable: MaterialCheckBox
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
    private val boxRenderer = BoxRenderer()

    // Рабочий поток: интеграция кадров и построение сетки. TSDF-объём трогаем только из него.
    private val worker = Executors.newSingleThreadExecutor()
    private var volume: TsdfVolume? = null
    private val preview = PreviewCloud(450_000)
    private val busy = AtomicBoolean(false)
    private val framesIntegrated = AtomicInteger(0)
    @Volatile private var blockCount = 0

    @Volatile private var recording = false
    @Volatile private var processing = false
    @Volatile private var preset = Preset.NORMAL

    // Область сканирования.
    @Volatile private var roiHalf = Preset.NORMAL.roiHalf
    private var roiCenter: FloatArray? = null         // следует за центром экрана до начала записи
    @Volatile private var roiLocked: FloatArray? = null // зафиксирована при начале записи

    // Состояние, обновляемое из GL-потока для UI.
    @Volatile private var trackingState = TrackingState.STOPPED
    @Volatile private var failureReason = TrackingFailureReason.NONE
    @Volatile private var tooFast = false
    @Volatile private var targetDistance = 0f
    @Volatile private var lowDepth = false

    private var viewportW = 0
    private var viewportH = 0
    private var viewportChanged = false
    private var displayRotation = Surface.ROTATION_0
    private var lastIntegrateNs = 0L
    private var lastDepthTimestamp = -1L
    private var lastFramesWithoutDepth = 0
    private var prevPose: FloatArray? = null
    private var prevPoseTs = 0L

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

    @SuppressLint("ClickableViewAccessibility")
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
        removeTable = findViewById(R.id.removeTable)
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

        // Щипок меняет размер области сканирования (пока запись не начата).
        val pinch = ScaleGestureDetector(this, object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(d: ScaleGestureDetector): Boolean {
                val p = preset
                if (p.roiHalf > 0f && roiLocked == null) {
                    roiHalf = (roiHalf * d.scaleFactor).coerceIn(p.roiMin, p.roiMax)
                }
                return true
            }
        })
        surface.setOnTouchListener { _, e -> pinch.onTouchEvent(e); true }

        modeGroup.addOnButtonCheckedListener { _, id, checked ->
            if (!checked) return@addOnButtonCheckedListener
            preset = when (id) {
                R.id.modeObject -> Preset.OBJECT
                R.id.modeRoom -> Preset.ROOM
                R.id.modeOutdoor -> Preset.OUTDOOR
                else -> Preset.NORMAL
            }
            roiHalf = preset.roiHalf
            applyPresetUi()
        }
        applyPresetUi()

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

    private fun applyPresetUi() {
        modeHint.text = if (preset.roiHalf > 0f)
            preset.hint + "\nНаведите центр экрана на объект. Щипком измените размер рамки."
        else preset.hint
        removeTable.visibility = if (preset == Preset.OBJECT) View.VISIBLE else View.GONE
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
        boxRenderer.create()
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
            if (camera.trackingState != TrackingState.TRACKING) {
                prevPose = null
                return
            }

            val pose = FloatArray(16)
            camera.pose.toMatrix(pose, 0)
            updateSpeed(pose, frame.timestamp)

            camera.getProjectionMatrix(proj, 0, 0.05f, 50f)
            camera.getViewMatrix(view, 0)
            Matrix.multiplyMM(mvp, 0, proj, 0, view, 0)

            val p = preset
            // Пока запись не начата — рамка следует за точкой в центре экрана.
            if (p.roiHalf > 0f && roiLocked == null) updateRoiTarget(frame, camera, pose)
            val box = roiLocked ?: currentRoiBox()

            // Размер точки ≈ размер ячейки на расстоянии 1 м в пикселях.
            val pointSize = (maxOf(p.voxel, 0.01f) * proj[5] * viewportH * 0.5f * 1.3f).coerceIn(2f, 24f)
            GLES20.glEnable(GLES20.GL_DEPTH_TEST)
            pointRenderer.draw(preview, mvp, pointSize)
            if (box != null) {
                if (roiLocked != null) boxRenderer.draw(box, mvp, 0.24f, 0.86f, 0.59f, 0.55f)
                else boxRenderer.draw(box, mvp, 1f, 1f, 1f, 0.9f)
            }

            if (recording && !processing && !busy.get() && !tooFast) {
                val now = System.nanoTime()
                if (now - lastIntegrateNs > MIN_INTEGRATE_INTERVAL_NS && captureAndIntegrate(frame, camera, pose)) {
                    lastIntegrateNs = now
                }
            }
        } catch (e: Throwable) {
            Log.e(TAG, "onDrawFrame", e)
        }
    }

    /** Оценка скорости движения телефона: при быстрых движениях кадры смазаны, а глубина неточна. */
    private fun updateSpeed(pose: FloatArray, ts: Long) {
        val prev = prevPose
        if (prev != null && ts > prevPoseTs) {
            val dt = (ts - prevPoseTs) / 1e9f
            if (dt > 0.001f) {
                val dx = pose[12] - prev[12]; val dy = pose[13] - prev[13]; val dz = pose[14] - prev[14]
                val v = sqrt(dx * dx + dy * dy + dz * dz) / dt
                // Угол поворота ≈ изменение направления взгляда и оси «вверх».
                val fz = sqrt(sq(pose[8] - prev[8]) + sq(pose[9] - prev[9]) + sq(pose[10] - prev[10]))
                val fy = sqrt(sq(pose[4] - prev[4]) + sq(pose[5] - prev[5]) + sq(pose[6] - prev[6]))
                val w = maxOf(fz, fy) / dt
                tooFast = v > 0.45f || w > 0.9f
            }
        }
        prevPose = pose
        prevPoseTs = ts
    }

    private fun sq(x: Float) = x * x

    private fun currentRoiBox(): FloatArray? {
        val c = roiCenter ?: return null
        val h = roiHalf
        return floatArrayOf(c[0] - h, c[1] - h, c[2] - h, c[0] + h, c[1] + h, c[2] + h)
    }

    /** Находит 3D-точку в центре экрана по (сглаженной) карте глубины. */
    private fun updateRoiTarget(frame: Frame, camera: Camera, pose: FloatArray) {
        try {
            frame.acquireDepthImage16Bits().use { img ->
                val w = img.width; val h = img.height
                val plane = img.planes[0]
                val buf = plane.buffer.order(ByteOrder.nativeOrder())
                val ti = camera.textureIntrinsics
                val dims = ti.imageDimensions
                val sx = w.toFloat() / dims[0]; val sy = h.toFloat() / dims[1]
                val fx = ti.focalLength[0] * sx; val fy = ti.focalLength[1] * sy
                val cx = ti.principalPoint[0] * sx; val cy = ti.principalPoint[1] * sy
                val u0 = w / 2; val v0 = h / 2
                // Медиана в окне вокруг центра.
                val vals = ArrayList<Float>(81)
                val rad = maxOf(2, w / 40)
                for (v in v0 - rad..v0 + rad) for (u in u0 - rad..u0 + rad) {
                    if (u < 0 || v < 0 || u >= w || v >= h) continue
                    val mm = buf.getShort(v * plane.rowStride + u * plane.pixelStride).toInt() and 0xFFFF
                    if (mm > 0) vals.add(mm * 0.001f)
                }
                if (vals.size < 3) return
                vals.sort()
                val d = vals[vals.size / 2]
                targetDistance = d
                if (d < 0.1f || d > preset.maxDepth * 1.5f) return
                val xc = (u0 - cx) / fx * d; val yc = (cy - v0) / fy * d; val zc = -d
                val wx = pose[0] * xc + pose[4] * yc + pose[8] * zc + pose[12]
                val wy = pose[1] * xc + pose[5] * yc + pose[9] * zc + pose[13]
                val wz = pose[2] * xc + pose[6] * yc + pose[10] * zc + pose[14]
                val prev = roiCenter
                roiCenter = if (prev == null) floatArrayOf(wx, wy, wz) else floatArrayOf(
                    prev[0] + (wx - prev[0]) * 0.2f, prev[1] + (wy - prev[1]) * 0.2f, prev[2] + (wz - prev[2]) * 0.2f,
                )
            }
        } catch (e: NotYetAvailableException) {
            // глубина ещё не готова
        }
    }

    /**
     * Берёт новую «сырую» карту глубины с картой уверенности и отправляет её в TSDF.
     * Каждая оценка глубины используется ровно один раз.
     */
    private fun captureAndIntegrate(frame: Frame, camera: Camera, pose: FloatArray): Boolean {
        val captured: DepthFrame? = try {
            frame.acquireRawDepthImage16Bits().use { depthImage ->
                if (depthImage.timestamp == lastDepthTimestamp) {
                    lastFramesWithoutDepth++
                    if (lastFramesWithoutDepth > 60) lowDepth = true
                    return false
                }
                frame.acquireRawDepthConfidenceImage().use { confImage ->
                    frame.acquireCameraImage().use { colorImage ->
                        lastDepthTimestamp = depthImage.timestamp
                        lastFramesWithoutDepth = 0
                        buildDepthFrame(camera, pose, depthImage, confImage, colorImage)
                    }
                }
            }
        } catch (e: NotYetAvailableException) {
            return false
        }
        val df = captured ?: return false

        val p = preset
        val roi = roiLocked
        busy.set(true)
        worker.execute {
            try {
                val vol = volume ?: TsdfVolume(p.voxel, p.minDepth, p.maxDepth, roi).also {
                    volume = it
                    preview.setCellSize(maxOf(p.voxel * 1.5f, 0.008f))
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

    private fun buildDepthFrame(camera: Camera, pose: FloatArray, depthImage: Image, confImage: Image, colorImage: Image): DepthFrame? {
        val dw = depthImage.width
        val dh = depthImage.height
        val dPlane = depthImage.planes[0]
        val dBuf = dPlane.buffer.order(ByteOrder.nativeOrder())
        val cPlane = confImage.planes[0]
        val cBuf = cPlane.buffer
        val depth = FloatArray(dw * dh)
        val conf = FloatArray(dw * dh)
        var valid = 0
        for (y in 0 until dh) {
            for (x in 0 until dw) {
                val mm = dBuf.getShort(y * dPlane.rowStride + x * dPlane.pixelStride).toInt() and 0xFFFF
                if (mm == 0) continue
                val c = (cBuf.get(y * cPlane.rowStride + x * cPlane.pixelStride).toInt() and 0xFF) / 255f
                if (c < MIN_CONFIDENCE) continue
                depth[y * dw + x] = mm * 0.001f
                conf[y * dw + x] = c
                valid++
            }
        }
        lowDepth = valid < dw * dh / 50
        if (valid < 30) return null

        // Внутренние параметры камеры для карты глубины (масштабированные из текстуры, как в примерах Google).
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
        return DepthFrame(
            depthW = dw, depthH = dh, depth = depth, confidence = conf,
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
        if (!recording && preset.roiHalf > 0f && roiLocked == null) {
            val box = currentRoiBox()
            if (box == null) {
                Toast.makeText(this, "Наведите центр экрана на объект — телефон должен увидеть до него расстояние", Toast.LENGTH_LONG).show()
                return
            }
            roiLocked = box
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
        roiLocked = null
        roiCenter = null
        updateRecordButton()
        worker.execute {
            volume = null
            preview.clear()
            blockCount = 0
            framesIntegrated.set(0)
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
        val cutTable = p == Preset.OBJECT && removeTable.isChecked

        worker.execute {
            try {
                val vol = volume
                val mesh = vol?.extractMesh(
                    removeSupport = cutTable,
                    smoothIterations = p.smooth,
                ) { f -> ui.post { progressBar.setProgressCompat((f * 80).toInt(), true) } }
                if (mesh == null) {
                    ui.post {
                        processing = false
                        progressOverlay.visibility = View.GONE
                        MaterialAlertDialogBuilder(this)
                            .setTitle("Мало данных")
                            .setMessage(
                                "Не удалось построить поверхность. Сканируйте дольше, медленно обходя объект " +
                                    "со всех сторон при хорошем освещении."
                            )
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
                    voxelMm = Math.round(p.voxel * 1000),
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
        val locked = hasData || recording || roiLocked != null
        for (i in 0 until modeGroup.childCount) modeGroup.getChildAt(i).isEnabled = !locked
        removeTable.isEnabled = !processing
        btnDone.isEnabled = hasData && !processing
        btnReset.isEnabled = hasData || recording || roiLocked != null

        val p = preset
        statusText.text = when {
            processing -> "Обработка…"
            trackingState != TrackingState.TRACKING -> when (failureReason) {
                TrackingFailureReason.INSUFFICIENT_LIGHT -> "Слишком темно — добавьте света"
                TrackingFailureReason.EXCESSIVE_MOTION -> "Двигайте телефон медленнее"
                TrackingFailureReason.INSUFFICIENT_FEATURES -> "Наведите на поверхность с деталями"
                TrackingFailureReason.CAMERA_UNAVAILABLE -> "Камера недоступна"
                else -> "Плавно поводите телефоном, чтобы начать"
            }
            recording && tooFast -> "Слишком быстро — двигайтесь медленнее"
            recording && lowDepth -> "Глубина не видна — больше света, медленнее, 0,4–1 м до объекта"
            recording -> "Сканирование… медленно обходите объект по кругу"
            hasData -> "Пауза. Продолжите или нажмите «Готово»"
            p.roiHalf > 0f && roiCenter == null -> "Наведите центр экрана на объект"
            p.roiHalf > 0f -> "Рамка на объекте? Нажмите красную кнопку"
            else -> "Наведите камеру и нажмите красную кнопку"
        }
        val pts = preview.count
        statsText.text = if (hasData) {
            "Точек: ${formatCount(pts)} · кадров глубины: $frames" +
                if (pts >= preview.capacity) " · предпросмотр заполнен" else ""
        } else if (p.roiHalf > 0f) {
            val side = String.format(Locale.US, "%.0f", roiHalf * 200).replace('.', ',')
            val dist = if (targetDistance > 0f) String.format(Locale.US, " · до объекта %.2f м", targetDistance).replace('.', ',') else ""
            "Рамка: $side см$dist"
        } else {
            "Режим: ${p.title}. Держите телефон в 0,5–${p.maxDepth.toString().replace('.', ',')} м от поверхностей."
        }
    }

    companion object {
        private const val TAG = "ScanActivity"
        private const val MIN_INTEGRATE_INTERVAL_NS = 60_000_000L
        /** Порог уверенности сырой глубины (Google рекомендует ~0,5). */
        private const val MIN_CONFIDENCE = 0.4f
    }
}
