package com.amberhall.scanner3d

import com.amberhall.scanner3d.io.MeshIO
import com.amberhall.scanner3d.recon.DepthFrame
import com.amberhall.scanner3d.recon.Mesh
import com.amberhall.scanner3d.recon.PreviewCloud
import com.amberhall.scanner3d.recon.TsdfVolume
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Синтетический тест: «снимаем» сферу камерой, облетающей её по кругу,
 * и проверяем, что восстановленная сетка лежит на сфере и смотрит наружу.
 */
class ReconstructionTest {

    private val r = 0.25f
    private val center = floatArrayOf(0.1f, 0.05f, -0.2f)

    private fun lookAt(eye: FloatArray, target: FloatArray): FloatArray {
        var fx = target[0] - eye[0]; var fy = target[1] - eye[1]; var fz = target[2] - eye[2]
        val fl = sqrt(fx * fx + fy * fy + fz * fz); fx /= fl; fy /= fl; fz /= fl
        // right = forward × up(0,1,0)
        var rx = -fz; var ry = 0f; var rz = fx
        val rl = sqrt(rx * rx + rz * rz); rx /= rl; rz /= rl
        // up = right × forward
        val ux = ry * fz - rz * fy; val uy = rz * fx - rx * fz; val uz = rx * fy - ry * fx
        // столбцы: right, up, back(-forward), позиция
        return floatArrayOf(rx, ry, rz, 0f, ux, uy, uz, 0f, -fx, -fy, -fz, 0f, eye[0], eye[1], eye[2], 1f)
    }

    private fun renderFrame(m: FloatArray): DepthFrame {
        val w = 160; val h = 120
        val fxp = 130f; val fyp = 130f; val cx = 80f; val cy = 60f
        val depth = FloatArray(w * h)
        val ox = m[12]; val oy = m[13]; val oz = m[14]
        for (v in 0 until h) for (u in 0 until w) {
            val dx = (u - cx) / fxp; val dy = (cy - v) / fyp; val dz = -1f
            val wx = m[0] * dx + m[4] * dy + m[8] * dz
            val wy = m[1] * dx + m[5] * dy + m[9] * dz
            val wz = m[2] * dx + m[6] * dy + m[10] * dz
            // пересечение луча o + t*d со сферой; глубина по оси камеры = t (|dz| = 1)
            val lx = ox - center[0]; val ly = oy - center[1]; val lz = oz - center[2]
            val a = wx * wx + wy * wy + wz * wz
            val b = 2 * (wx * lx + wy * ly + wz * lz)
            val c = lx * lx + ly * ly + lz * lz - r * r
            val disc = b * b - 4 * a * c
            if (disc >= 0) {
                val t = (-b - sqrt(disc)) / (2 * a)
                if (t > 0) depth[v * w + u] = t
            }
        }
        val cw = 320; val ch = 240
        val yP = ByteArray(cw * ch) { 150.toByte() }
        val uP = ByteArray(cw * ch / 4) { 100.toByte() }
        val vP = ByteArray(cw * ch / 4) { 170.toByte() }
        return DepthFrame(
            w, h, depth, null, fxp, fyp, cx, cy,
            cw, ch, yP, cw, 1, uP, vP, cw / 2, 1,
            fxp * 2, fyp * 2, cx * 2, cy * 2, m,
        )
    }

    @Test
    fun sphereIsReconstructed() {
        val vol = TsdfVolume(voxelSize = 0.01f, minDepth = 0.1f, maxDepth = 3f)
        val preview = PreviewCloud(100_000)
        val n = 36
        for (i in 0 until n) {
            val ang = 2 * Math.PI * i / n
            for (height in floatArrayOf(-0.3f, 0.35f)) {
                val eye = floatArrayOf(
                    center[0] + (0.8 * cos(ang)).toFloat(), center[1] + height, center[2] + (0.8 * sin(ang)).toFloat()
                )
                vol.integrate(renderFrame(lookAt(eye, center)), preview)
            }
        }
        assertTrue("preview points", preview.count > 1000)

        val t0 = System.nanoTime()
        val mesh = vol.extractMesh()!!
        println("blocks=${vol.blockCount} verts=${mesh.vertexCount} tris=${mesh.triangleCount} t=${(System.nanoTime() - t0) / 1e6}ms")
        assertTrue(mesh.triangleCount > 5000)

        // После recenter сфера стоит на Y=0: центр (0, r, 0).
        val c = floatArrayOf(0f, r, 0f)
        var maxErr = 0f
        var sumErr = 0.0
        var signed = 0.0
        for (i in 0 until mesh.vertexCount) {
            val x = mesh.positions[i * 3] - c[0]; val y = mesh.positions[i * 3 + 1] - c[1]; val z = mesh.positions[i * 3 + 2] - c[2]
            val e = abs(sqrt(x * x + y * y + z * z) - r)
            maxErr = maxOf(maxErr, e); sumErr += e
            signed += sqrt(x * x + y * y + z * z) - r
        }
        println("signed mean err=${signed / mesh.vertexCount}")
        println("mean err=${sumErr / mesh.vertexCount} max err=$maxErr")
        assertTrue("mean error ${sumErr / mesh.vertexCount}", sumErr / mesh.vertexCount < 0.004)
        assertTrue("max error $maxErr", maxErr < 0.02f)

        // Треугольники должны смотреть наружу.
        var outward = 0
        for (t in 0 until mesh.triangleCount) {
            val a = mesh.indices[t * 3] * 3; val b = mesh.indices[t * 3 + 1] * 3; val cc = mesh.indices[t * 3 + 2] * 3
            val p = mesh.positions
            val ux = p[b] - p[a]; val uy = p[b + 1] - p[a + 1]; val uz = p[b + 2] - p[a + 2]
            val vx = p[cc] - p[a]; val vy = p[cc + 1] - p[a + 1]; val vz = p[cc + 2] - p[a + 2]
            val nx = uy * vz - uz * vy; val ny = uz * vx - ux * vz; val nz = ux * vy - uy * vx
            val mx = (p[a] + p[b] + p[cc]) / 3 - c[0]; val my = (p[a + 1] + p[b + 1] + p[cc + 1]) / 3 - c[1]; val mz = (p[a + 2] + p[b + 2] + p[cc + 2]) / 3 - c[2]
            if (nx * mx + ny * my + nz * mz > 0) outward++
        }
        println("outward ${outward}/${mesh.triangleCount}")
        assertTrue(outward > mesh.triangleCount * 0.99)

        // Цвет: YUV(150,100,170) ≈ RGB(~200,~140,~95)
        val r0 = mesh.colors[0].toInt() and 0xFF
        assertTrue("color r=$r0", r0 in 180..230)

        // Запись/чтение файлов.
        val out = File("build/test-out").apply { mkdirs() }
        MeshIO.writePly(mesh, File(out, "sphere.ply"))
        MeshIO.writeGlb(mesh, File(out, "sphere.glb"))
        MeshIO.writeObj(mesh, File(out, "sphere.obj"))
        val back = MeshIO.readPly(File(out, "sphere.ply"))
        assertEquals(mesh.vertexCount, back.vertexCount)
        assertEquals(mesh.triangleCount, back.triangleCount)
        assertEquals(mesh.positions[123], back.positions[123], 0f)
        assertEquals(mesh.indices.last(), back.indices.last())
    }


    /** Пересечение луча с коробкой (slab-метод), возвращает t или -1. */
    private fun rayBox(o: FloatArray, d: FloatArray, mn: FloatArray, mx: FloatArray): Float {
        var t0 = -Float.MAX_VALUE; var t1 = Float.MAX_VALUE
        for (a in 0..2) {
            if (abs(d[a]) < 1e-9f) { if (o[a] < mn[a] || o[a] > mx[a]) return -1f; continue }
            var ta = (mn[a] - o[a]) / d[a]; var tb = (mx[a] - o[a]) / d[a]
            if (ta > tb) { val x = ta; ta = tb; tb = x }
            t0 = maxOf(t0, ta); t1 = minOf(t1, tb)
        }
        return if (t0 <= t1 && t0 > 0) t0 else -1f
    }

    /**
     * Реалистичная сцена: пенал 22×6×10 см на столе, сзади стена, глубина шумная (1,5%)
     * и с пропусками. С областью сканирования и удалением стола должен остаться только пенал.
     */
    @Test
    fun objectOnTableIsIsolated() {
        val boxMin = floatArrayOf(-0.11f, 0f, -0.05f); val boxMax = floatArrayOf(0.11f, 0.06f, 0.05f)
        val rnd = java.util.Random(42)
        val roi = floatArrayOf(-0.25f, -0.2f, -0.25f, 0.25f, 0.3f, 0.25f)
        val vol = TsdfVolume(voxelSize = 0.006f, minDepth = 0.15f, maxDepth = 1.2f, roi = roi)
        val target = floatArrayOf(0f, 0.03f, 0f)
        val w = 160; val h = 120; val f = 130f
        for (i in 0 until 60) {
            val ang = 2 * Math.PI * i / 60
            val eye = floatArrayOf((0.5 * cos(ang)).toFloat(), 0.35f + 0.1f * sin(ang * 3).toFloat(), (0.5 * sin(ang)).toFloat())
            val m = lookAt(eye, target)
            val depth = FloatArray(w * h); val conf = FloatArray(w * h)
            for (v in 0 until h) for (u in 0 until w) {
                if (rnd.nextFloat() < 0.4f) continue // пропуски сырой глубины
                val dx = (u - 80f) / f; val dy = (60f - v) / f
                val d = floatArrayOf(m[0] * dx + m[4] * dy - m[8], m[1] * dx + m[5] * dy - m[9], m[2] * dx + m[6] * dy - m[10])
                var t = Float.MAX_VALUE
                val tb = rayBox(eye, d, boxMin, boxMax); if (tb > 0) t = minOf(t, tb)
                if (d[1] < 0) { val tt = -eye[1] / d[1]; if (tt > 0) t = minOf(t, tt) }        // стол y=0
                if (d[2] < 0) { val tw = (-1.0f - eye[2]) / d[2]; if (tw > 0) t = minOf(t, tw) } // стена z=-1
                if (t == Float.MAX_VALUE) continue
                depth[v * w + u] = t * (1f + 0.015f * rnd.nextGaussian().toFloat())
                conf[v * w + u] = 0.5f + 0.5f * rnd.nextFloat()
            }
            val cw = 320; val ch = 240
            val frame = DepthFrame(
                w, h, depth, conf, f, f, 80f, 60f,
                cw, ch, ByteArray(cw * ch) { 40 }, cw, 1, ByteArray(cw * ch / 4) { 128.toByte() }, ByteArray(cw * ch / 4) { 128.toByte() }, cw / 2, 1,
                f * 2, f * 2, 160f, 120f, m,
            )
            vol.integrate(frame, null)
        }
        val mesh = vol.extractMesh(removeSupport = true, smoothIterations = 3)!!
        val b = mesh.bounds()
        println("object: tris=${mesh.triangleCount} size=${b[3] - b[0]} x ${b[4] - b[1]} x ${b[5] - b[2]}")
        MeshIO.writeGlb(mesh, File(File("build/test-out").apply { mkdirs() }, "object.glb"))
        assertEquals(0.22f, b[3] - b[0], 0.025f)
        assertEquals(0.10f, b[5] - b[2], 0.025f)
        // Высота: 6 см минус срезанные у стола ~1 см.
        assertTrue("height ${b[4] - b[1]}", (b[4] - b[1]) in 0.035f..0.07f)
    }

    @Test
    fun keyPacking() {
        for (x in intArrayOf(-1000, -1, 0, 1, 999)) for (y in intArrayOf(-7, 0, 5)) for (z in intArrayOf(-123456, 0, 77)) {
            val k = TsdfVolume.packKey(x, y, z)
            assertEquals(x, TsdfVolume.unpackX(k)); assertEquals(y, TsdfVolume.unpackY(k)); assertEquals(z, TsdfVolume.unpackZ(k))
        }
    }

    @Test
    fun smallComponentsRemoved() {
        // Два треугольника-«острова»: один большой кусок (из 200 треугольников) и один одиночный.
        val pos = ArrayList<Float>(); val idx = ArrayList<Int>()
        for (i in 0 until 201) { pos.addAll(listOf(i.toFloat(), 0f, 0f)) ; pos.addAll(listOf(i.toFloat(), 1f, 0f)) }
        for (i in 0 until 100) { val a = i * 2; idx.addAll(listOf(a, a + 2, a + 1, a + 1, a + 2, a + 3)) }
        val base = pos.size / 3
        pos.addAll(listOf(50f, 50f, 50f, 51f, 50f, 50f, 50f, 51f, 50f)); idx.addAll(listOf(base, base + 1, base + 2))
        val (p, _, i) = Mesh.removeSmallComponents(pos.toFloatArray(), ByteArray(pos.size), idx.toIntArray(), 10, 0.01f)
        assertEquals(200 * 3, i.size)
        assertEquals(202 * 3, p.size) // неиспользуемые вершины тоже удаляются
    }
}
