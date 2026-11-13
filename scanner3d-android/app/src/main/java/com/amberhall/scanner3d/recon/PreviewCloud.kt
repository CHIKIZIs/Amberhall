package com.amberhall.scanner3d.recon

import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.floor

/**
 * Облако точек для предпросмотра во время сканирования.
 * Пишется только из рабочего потока, читается GL-потоком.
 * Формат точки: x, y, z (float) + r, g, b, a (байты) = 16 байт.
 */
class PreviewCloud(val capacity: Int) {
    val buffer: ByteBuffer = ByteBuffer.allocateDirect(capacity * STRIDE).order(ByteOrder.nativeOrder())

    /** Количество опубликованных точек (видимых для GL-потока). */
    @Volatile var count = 0
        private set
    /** Меняется при очистке, чтобы GL-поток перезалил буфер. */
    @Volatile var generation = 0
        private set

    private val cells = HashSet<Long>()
    private var pending = 0
    private var cell = 0.01f

    fun setCellSize(size: Float) { cell = size }

    fun add(x: Float, y: Float, z: Float, rgb: Int) {
        if (pending >= capacity) return
        val key = TsdfVolume.packKey(
            floor(x / cell).toInt(), floor(y / cell).toInt(), floor(z / cell).toInt()
        )
        if (!cells.add(key)) return
        val o = pending * STRIDE
        buffer.putFloat(o, x)
        buffer.putFloat(o + 4, y)
        buffer.putFloat(o + 8, z)
        buffer.put(o + 12, (rgb shr 16).toByte())
        buffer.put(o + 13, (rgb shr 8).toByte())
        buffer.put(o + 14, rgb.toByte())
        buffer.put(o + 15, 0xFF.toByte())
        pending++
    }

    fun commit() { count = pending }

    fun clear() {
        cells.clear()
        pending = 0
        count = 0
        generation++
    }

    companion object {
        const val STRIDE = 16
    }
}
