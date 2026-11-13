package com.amberhall.scanner3d.recon

/**
 * Снимок данных одного кадра ARCore, скопированный из Image-объектов,
 * чтобы его можно было обработать в фоновом потоке.
 *
 * Все координаты изображений — в ориентации сенсора (как отдаёт ARCore),
 * поза камеры [camToWorld] — тоже в ориентации сенсора (Camera.getPose()):
 * +X вправо, +Y вверх, камера смотрит вдоль -Z.
 */
class DepthFrame(
    // Карта глубины в метрах (0 = нет данных)
    val depthW: Int,
    val depthH: Int,
    val depth: FloatArray,
    // Уверенность каждого пикселя глубины 0..1 (null — считать полной)
    val confidence: FloatArray?,
    val dfx: Float, val dfy: Float, val dcx: Float, val dcy: Float,
    // Цветное изображение YUV_420_888
    val colorW: Int,
    val colorH: Int,
    val yPlane: ByteArray, val yRowStride: Int, val yPixelStride: Int,
    val uPlane: ByteArray, val vPlane: ByteArray, val uvRowStride: Int, val uvPixelStride: Int,
    val cfx: Float, val cfy: Float, val ccx: Float, val ccy: Float,
    // Матрица камера -> мир (column-major, как Pose.toMatrix)
    val camToWorld: FloatArray,
) {
    /** Цвет пикселя цветного изображения в формате 0xRRGGBB, либо -1 если вне кадра. */
    fun sampleColor(x: Int, y: Int): Int {
        if (x < 0 || y < 0 || x >= colorW || y >= colorH) return -1
        val yy = (yPlane[y * yRowStride + x * yPixelStride].toInt() and 0xFF)
        val uvIndex = (y shr 1) * uvRowStride + (x shr 1) * uvPixelStride
        if (uvIndex >= uPlane.size || uvIndex >= vPlane.size) return -1
        val u = (uPlane[uvIndex].toInt() and 0xFF) - 128
        val v = (vPlane[uvIndex].toInt() and 0xFF) - 128
        val yf = 1.164f * (yy - 16).coerceAtLeast(0)
        val r = (yf + 1.596f * v).toInt().coerceIn(0, 255)
        val g = (yf - 0.392f * u - 0.813f * v).toInt().coerceIn(0, 255)
        val b = (yf + 2.017f * u).toInt().coerceIn(0, 255)
        return (r shl 16) or (g shl 8) or b
    }
}
