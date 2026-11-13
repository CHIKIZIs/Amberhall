package com.amberhall.scanner3d.render

import android.opengl.Matrix
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

/** Камера, вращающаяся вокруг точки (для просмотра модели). */
class OrbitCamera {
    var yaw = 30f
    var pitch = 20f
    var distance = 2f
    val target = floatArrayOf(0f, 0f, 0f)
    private var minDist = 0.05f
    private var maxDist = 50f

    private var homeTarget = floatArrayOf(0f, 0f, 0f)
    private var homeDist = 2f

    fun frame(bounds: FloatArray) {
        val cx = (bounds[0] + bounds[3]) / 2; val cy = (bounds[1] + bounds[4]) / 2; val cz = (bounds[2] + bounds[5]) / 2
        val sx = bounds[3] - bounds[0]; val sy = bounds[4] - bounds[1]; val sz = bounds[5] - bounds[2]
        val radius = max(0.05f, kotlin.math.sqrt(sx * sx + sy * sy + sz * sz) / 2)
        homeTarget = floatArrayOf(cx, cy, cz)
        homeDist = radius * 2.4f
        minDist = radius * 0.05f
        maxDist = radius * 20f
        reset()
    }

    fun reset() {
        homeTarget.copyInto(target)
        distance = homeDist
        yaw = 30f
        pitch = 20f
    }

    fun rotate(dx: Float, dy: Float) {
        yaw -= dx * 0.3f
        pitch = (pitch + dy * 0.3f).coerceIn(-89f, 89f)
    }

    fun zoom(factor: Float) {
        distance = (distance / factor).coerceIn(minDist, maxDist)
    }

    /** Сдвиг цели в плоскости экрана; dx, dy — в пикселях, viewH — высота экрана. */
    fun pan(dx: Float, dy: Float, viewH: Int) {
        val scale = distance * 2f * 0.414f / max(1, viewH) // tan(45°/2) ≈ 0.414
        val view = viewMatrix()
        // Строки матрицы вида — оси камеры в мире.
        val rx = view[0]; val ry = view[4]; val rz = view[8]
        val ux = view[1]; val uy = view[5]; val uz = view[9]
        target[0] += (-dx * rx + dy * ux) * scale
        target[1] += (-dx * ry + dy * uy) * scale
        target[2] += (-dx * rz + dy * uz) * scale
    }

    fun viewMatrix(): FloatArray {
        val yr = Math.toRadians(yaw.toDouble()); val pr = Math.toRadians(pitch.toDouble())
        val ex = target[0] + (distance * cos(pr) * sin(yr)).toFloat()
        val ey = target[1] + (distance * sin(pr)).toFloat()
        val ez = target[2] + (distance * cos(pr) * cos(yr)).toFloat()
        val m = FloatArray(16)
        Matrix.setLookAtM(m, 0, ex, ey, ez, target[0], target[1], target[2], 0f, 1f, 0f)
        return m
    }

    fun projectionMatrix(aspect: Float): FloatArray {
        val m = FloatArray(16)
        Matrix.perspectiveM(m, 0, 45f, aspect, max(0.005f, distance * 0.01f), min(1000f, distance * 100f))
        return m
    }
}
