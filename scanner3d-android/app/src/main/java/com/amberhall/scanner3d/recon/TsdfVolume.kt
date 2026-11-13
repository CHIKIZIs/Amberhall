package com.amberhall.scanner3d.recon

import kotlin.math.abs
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Разреженный TSDF-объём (Truncated Signed Distance Field) — классический
 * способ слияния множества карт глубины в одну поверхность (как KinectFusion).
 *
 * Пространство разбито на блоки 8×8×8 вокселей, блоки создаются только рядом
 * с наблюдаемыми поверхностями. Положительные значения — свободное пространство
 * перед поверхностью, отрицательные — за поверхностью.
 */
class TsdfVolume(
    val voxelSize: Float,
    val minDepth: Float,
    val maxDepth: Float,
) {
    class Block {
        val tsdf = FloatArray(BLOCK_VOXELS) { 1f }
        val weight = ByteArray(BLOCK_VOXELS)
        val rgb = ByteArray(BLOCK_VOXELS * 3)
        val colorWeight = ByteArray(BLOCK_VOXELS)
    }

    val truncation = max(3.5f * voxelSize, 0.03f)
    private val blockSize = voxelSize * BLOCK
    private val blocks = HashMap<Long, Block>()

    val blockCount get() = blocks.size

    fun clear() = blocks.clear()

    // ------------------------------------------------------------------ интеграция

    fun integrate(f: DepthFrame, preview: PreviewCloud?) {
        val m = f.camToWorld
        val ox = m[12]; val oy = m[13]; val oz = m[14]
        val depth = filterDepth(f)
        val w = f.depthW; val h = f.depthH

        // 1. Выделяем блоки вдоль лучей в пределах усечения вокруг поверхности.
        val touched = HashSet<Long>()
        val stride = max(1, sqrt(w * h / 6000.0).toInt())
        val previewStride = max(1, sqrt(w * h / 2500.0).toInt())
        var v = 0
        while (v < h) {
            var u = 0
            while (u < w) {
                val z = depth[v * w + u]
                if (z > 0f) {
                    val xc = (u - f.dcx) / f.dfx * z
                    val yc = (f.dcy - v) / f.dfy * z
                    val zc = -z
                    val wx = m[0] * xc + m[4] * yc + m[8] * zc + ox
                    val wy = m[1] * xc + m[5] * yc + m[9] * zc + oy
                    val wz = m[2] * xc + m[6] * yc + m[10] * zc + oz
                    var dx = wx - ox; var dy = wy - oy; var dz = wz - oz
                    val len = sqrt(dx * dx + dy * dy + dz * dz)
                    if (len > 1e-6f) {
                        dx /= len; dy /= len; dz /= len
                        var s = -truncation
                        while (s <= truncation + 1e-6f) {
                            touched.add(
                                packKey(
                                    floor((wx + dx * s) / blockSize).toInt(),
                                    floor((wy + dy * s) / blockSize).toInt(),
                                    floor((wz + dz * s) / blockSize).toInt(),
                                )
                            )
                            s += truncation
                        }
                    }
                    if (preview != null && u % previewStride == 0 && v % previewStride == 0) {
                        val cu = (f.cfx * xc / z + f.ccx).toInt()
                        val cv = (f.ccy - f.cfy * yc / z).toInt()
                        val col = f.sampleColor(cu, cv)
                        if (col >= 0) preview.add(wx, wy, wz, col)
                    }
                }
                u += stride
            }
            v += stride
        }
        preview?.commit()

        // 2. Обновляем воксели затронутых блоков проекцией в карту глубины.
        for (key in touched) {
            val block = blocks.getOrPut(key) { Block() }
            integrateBlock(key, block, f, depth)
        }
    }

    private fun integrateBlock(key: Long, b: Block, f: DepthFrame, depth: FloatArray) {
        val m = f.camToWorld
        val bx = unpackX(key); val by = unpackY(key); val bz = unpackZ(key)
        // Центр вокселя (0,0,0) блока в мире относительно камеры.
        val px = (bx * BLOCK + 0.5f) * voxelSize - m[12]
        val py = (by * BLOCK + 0.5f) * voxelSize - m[13]
        val pz = (bz * BLOCK + 0.5f) * voxelSize - m[14]
        // Мир -> камера: R^T * (p - t). Столбцы R: (m0,m1,m2), (m4,m5,m6), (m8,m9,m10).
        val cx0 = m[0] * px + m[1] * py + m[2] * pz
        val cy0 = m[4] * px + m[5] * py + m[6] * pz
        val cz0 = m[8] * px + m[9] * py + m[10] * pz
        // Шаг вдоль мировых осей в координатах камеры.
        val vs = voxelSize
        val sxX = m[0] * vs; val sxY = m[4] * vs; val sxZ = m[8] * vs
        val syX = m[1] * vs; val syY = m[5] * vs; val syZ = m[9] * vs
        val szX = m[2] * vs; val szY = m[6] * vs; val szZ = m[10] * vs

        val w = f.depthW; val h = f.depthH
        val trunc = truncation
        val colorBand = trunc * 0.6f
        var idx = 0
        for (k in 0 until BLOCK) {
            for (j in 0 until BLOCK) {
                var cx = cx0 + syX * j + szX * k
                var cy = cy0 + syY * j + szY * k
                var cz = cz0 + syZ * j + szZ * k
                for (i in 0 until BLOCK) {
                    val z = -cz
                    if (z > minDepth * 0.5f) {
                        val uf = f.dfx * cx / z + f.dcx + 0.5f
                        val vf = f.dcy - f.dfy * cy / z + 0.5f
                        if (uf >= 0f && vf >= 0f && uf < w && vf < h) {
                            val d = depth[vf.toInt() * w + uf.toInt()]
                            if (d > 0f) {
                                val sdf = d - z
                                if (sdf >= -trunc) {
                                    val t = min(1f, sdf / trunc)
                                    val wOld = b.weight[idx].toInt()
                                    b.tsdf[idx] = (b.tsdf[idx] * wOld + t) / (wOld + 1)
                                    b.weight[idx] = min(wOld + 1, MAX_WEIGHT).toByte()
                                    if (abs(sdf) < colorBand) {
                                        val cu = (f.cfx * cx / z + f.ccx).toInt()
                                        val cv = (f.ccy - f.cfy * cy / z).toInt()
                                        val col = f.sampleColor(cu, cv)
                                        if (col >= 0) blendColor(b, idx, col)
                                    }
                                }
                            }
                        }
                    }
                    idx++
                    cx += sxX; cy += sxY; cz += sxZ
                }
            }
        }
    }

    private fun blendColor(b: Block, idx: Int, col: Int) {
        val cw = b.colorWeight[idx].toInt()
        val o = idx * 3
        val r = (col shr 16) and 0xFF; val g = (col shr 8) and 0xFF; val bl = col and 0xFF
        if (cw == 0) {
            b.rgb[o] = r.toByte(); b.rgb[o + 1] = g.toByte(); b.rgb[o + 2] = bl.toByte()
        } else {
            val n = cw + 1
            b.rgb[o] = (((b.rgb[o].toInt() and 0xFF) * cw + r) / n).toByte()
            b.rgb[o + 1] = (((b.rgb[o + 1].toInt() and 0xFF) * cw + g) / n).toByte()
            b.rgb[o + 2] = (((b.rgb[o + 2].toInt() and 0xFF) * cw + bl) / n).toByte()
        }
        b.colorWeight[idx] = min(cw + 1, MAX_COLOR_WEIGHT).toByte()
    }

    /** Отбрасывает глубину вне диапазона и «летающие» пиксели на перепадах глубины. */
    private fun filterDepth(f: DepthFrame): FloatArray {
        val w = f.depthW; val h = f.depthH
        val src = f.depth
        val out = FloatArray(w * h)
        for (y in 0 until h) {
            for (x in 0 until w) {
                val i = y * w + x
                val z = src[i]
                if (z < minDepth || z > maxDepth) continue
                val thr = max(0.03f, 0.05f * z)
                var ok = true
                if (x > 0 && src[i - 1] > 0f && abs(src[i - 1] - z) > thr) ok = false
                if (ok && x < w - 1 && src[i + 1] > 0f && abs(src[i + 1] - z) > thr) ok = false
                if (ok && y > 0 && src[i - w] > 0f && abs(src[i - w] - z) > thr) ok = false
                if (ok && y < h - 1 && src[i + w] > 0f && abs(src[i + w] - z) > thr) ok = false
                if (ok) out[i] = z
            }
        }
        return out
    }

    // ------------------------------------------------------------------ построение сетки

    /**
     * Строит треугольную сетку методом Surface Nets (двойственный контуринг
     * без таблиц): по одной вершине на ячейку, пересекаемую поверхностью,
     * и по квадрату на каждое ребро решётки со сменой знака.
     */
    fun extractMesh(minWeight: Int = 2, progress: (Float) -> Unit = {}): Mesh? {
        val keys = blocks.keys.toLongArray()
        if (keys.isEmpty()) return null

        val cellVerts = HashMap<Long, IntArray>(keys.size * 2)
        val cellFlags = HashMap<Long, ByteArray>(keys.size * 2)
        val pos = FloatList(1 shl 16)
        val col = ByteList(1 shl 16)

        val P = BLOCK + 1
        val pv = FloatArray(P * P * P)
        val pw = IntArray(P * P * P)
        val pc = IntArray(P * P * P)
        val neighbors = arrayOfNulls<Block>(8)
        val cv = FloatArray(8)
        val ccol = IntArray(8)

        // Рёбра ячейки: пары углов, отличающихся одним битом (угол = dx + 2dy + 4dz).
        val edges = ArrayList<IntArray>()
        for (c in 0 until 8) for (bit in intArrayOf(1, 2, 4)) if (c and bit == 0) edges.add(intArrayOf(c, c or bit))

        // Проход 1: вершины.
        for ((n, key) in keys.withIndex()) {
            if (n % 64 == 0) progress(0.6f * n / keys.size)
            val bx = unpackX(key); val by = unpackY(key); val bz = unpackZ(key)
            for (dz in 0..1) for (dy in 0..1) for (dx in 0..1) {
                neighbors[dx + 2 * dy + 4 * dz] =
                    if (dx == 0 && dy == 0 && dz == 0) blocks[key] else blocks[packKey(bx + dx, by + dy, bz + dz)]
            }
            for (k in 0 until P) for (j in 0 until P) for (i in 0 until P) {
                val nb = neighbors[(i / BLOCK) + 2 * (j / BLOCK) + 4 * (k / BLOCK)]
                val pi = i + P * (j + P * k)
                if (nb == null) { pw[pi] = 0; continue }
                val li = (i % BLOCK) + BLOCK * ((j % BLOCK) + BLOCK * (k % BLOCK))
                pv[pi] = nb.tsdf[li]
                pw[pi] = nb.weight[li].toInt()
                pc[pi] = if (nb.colorWeight[li].toInt() == 0) -1 else
                    ((nb.rgb[li * 3].toInt() and 0xFF) shl 16) or
                        ((nb.rgb[li * 3 + 1].toInt() and 0xFF) shl 8) or
                        (nb.rgb[li * 3 + 2].toInt() and 0xFF)
            }

            val verts = IntArray(BLOCK_VOXELS) { -1 }
            val flags = ByteArray(BLOCK_VOXELS)
            var any = false
            for (k in 0 until BLOCK) for (j in 0 until BLOCK) for (i in 0 until BLOCK) {
                var valid = true
                var mask = 0
                for (c in 0 until 8) {
                    val pi = (i + (c and 1)) + P * ((j + ((c shr 1) and 1)) + P * (k + ((c shr 2) and 1)))
                    if (pw[pi] < minWeight) { valid = false; break }
                    cv[c] = pv[pi]
                    ccol[c] = pc[pi]
                    if (cv[c] < 0f) mask = mask or (1 shl c)
                }
                if (!valid || mask == 0 || mask == 0xFF) continue

                var sx = 0f; var sy = 0f; var sz = 0f; var cnt = 0
                for (e in edges) {
                    val a = cv[e[0]]; val b = cv[e[1]]
                    if ((a < 0f) == (b < 0f) || abs(a - b) > MAX_JUMP) continue
                    val t = a / (a - b)
                    val c0 = e[0]; val c1 = e[1]
                    sx += (c0 and 1) + t * ((c1 and 1) - (c0 and 1))
                    sy += ((c0 shr 1) and 1) + t * (((c1 shr 1) and 1) - ((c0 shr 1) and 1))
                    sz += ((c0 shr 2) and 1) + t * (((c1 shr 2) and 1) - ((c0 shr 2) and 1))
                    cnt++
                }
                if (cnt == 0) continue
                sx /= cnt; sy /= cnt; sz /= cnt

                val li = i + BLOCK * (j + BLOCK * k)
                verts[li] = pos.size / 3
                pos.add(((bx * BLOCK + i) + 0.5f + sx) * voxelSize)
                pos.add(((by * BLOCK + j) + 0.5f + sy) * voxelSize)
                pos.add(((bz * BLOCK + k) + 0.5f + sz) * voxelSize)

                // Цвет: среднее по углам, ближе к поверхности — больший вес.
                var r = 0f; var g = 0f; var bl = 0f; var ws = 0f
                for (c in 0 until 8) {
                    val cc = ccol[c]
                    if (cc < 0) continue
                    val wt = 1.05f - min(1f, abs(cv[c]))
                    r += ((cc shr 16) and 0xFF) * wt; g += ((cc shr 8) and 0xFF) * wt; bl += (cc and 0xFF) * wt
                    ws += wt
                }
                if (ws > 0f) {
                    col.add((r / ws).toInt().toByte()); col.add((g / ws).toInt().toByte()); col.add((bl / ws).toInt().toByte())
                } else {
                    col.add(0xB4.toByte()); col.add(0xB4.toByte()); col.add(0xB4.toByte())
                }

                // Рёбра из начального угла ячейки вдоль +X, +Y, +Z.
                var fl = 0
                for ((ax, cEnd) in intArrayOf(1, 2, 4).withIndex()) {
                    val a = cv[0]; val b = cv[cEnd]
                    if ((a < 0f) != (b < 0f) && abs(a - b) <= MAX_JUMP) {
                        fl = fl or (1 shl ax)
                        if (a < 0f) fl = fl or (8 shl ax)
                    }
                }
                flags[li] = fl.toByte()
                any = true
            }
            if (any) {
                cellVerts[key] = verts
                cellFlags[key] = flags
            }
        }

        if (pos.size == 0) return null

        // Проход 2: квадраты.
        fun vertAt(gx: Int, gy: Int, gz: Int): Int {
            val bx = Math.floorDiv(gx, BLOCK); val by = Math.floorDiv(gy, BLOCK); val bz = Math.floorDiv(gz, BLOCK)
            val arr = cellVerts[packKey(bx, by, bz)] ?: return -1
            return arr[(gx - bx * BLOCK) + BLOCK * ((gy - by * BLOCK) + BLOCK * (gz - bz * BLOCK))]
        }

        val p = pos.data
        val idx = IntList(pos.size * 2)
        val q = IntArray(4)
        var done = 0
        for ((key, flags) in cellFlags) {
            if (done++ % 64 == 0) progress(0.6f + 0.3f * done / cellFlags.size)
            val verts = cellVerts[key]!!
            val bx = unpackX(key); val by = unpackY(key); val bz = unpackZ(key)
            for (li in 0 until BLOCK_VOXELS) {
                val fl = flags[li].toInt()
                if (fl == 0) continue
                val i = li % BLOCK; val j = (li / BLOCK) % BLOCK; val k = li / (BLOCK * BLOCK)
                val gx = bx * BLOCK + i; val gy = by * BLOCK + j; val gz = bz * BLOCK + k
                for (ax in 0..2) {
                    if (fl and (1 shl ax) == 0) continue
                    // Остальные две оси (циклически).
                    val b1 = (ax + 1) % 3; val b2 = (ax + 2) % 3
                    val e1 = intArrayOf(0, 0, 0).also { it[b1] = 1 }
                    val e2 = intArrayOf(0, 0, 0).also { it[b2] = 1 }
                    q[0] = verts[li]
                    q[1] = vertAt(gx - e1[0], gy - e1[1], gz - e1[2])
                    q[2] = vertAt(gx - e1[0] - e2[0], gy - e1[1] - e2[1], gz - e1[2] - e2[2])
                    q[3] = vertAt(gx - e2[0], gy - e2[1], gz - e2[2])
                    if (q[1] < 0 || q[2] < 0 || q[3] < 0) continue

                    // Наружу = в сторону положительных значений.
                    val outward = if (fl and (8 shl ax) != 0) 1f else -1f
                    // Нормаль квадрата через диагонали.
                    val d1x = p[q[2] * 3] - p[q[0] * 3]; val d1y = p[q[2] * 3 + 1] - p[q[0] * 3 + 1]; val d1z = p[q[2] * 3 + 2] - p[q[0] * 3 + 2]
                    val d2x = p[q[3] * 3] - p[q[1] * 3]; val d2y = p[q[3] * 3 + 1] - p[q[1] * 3 + 1]; val d2z = p[q[3] * 3 + 2] - p[q[1] * 3 + 2]
                    val nAx = when (ax) {
                        0 -> d1y * d2z - d1z * d2y
                        1 -> d1z * d2x - d1x * d2z
                        else -> d1x * d2y - d1y * d2x
                    }
                    if (nAx * outward >= 0f) {
                        idx.add(q[0]); idx.add(q[1]); idx.add(q[2])
                        idx.add(q[0]); idx.add(q[2]); idx.add(q[3])
                    } else {
                        idx.add(q[0]); idx.add(q[2]); idx.add(q[1])
                        idx.add(q[0]); idx.add(q[3]); idx.add(q[2])
                    }
                }
            }
        }
        if (idx.size == 0) return null
        progress(0.92f)

        val (cp, cc, ci) = Mesh.removeSmallComponents(
            pos.toArray(), col.toArray(), idx.toArray(),
            minTriangles = 80, minFraction = 0.004f,
        )
        if (ci.isEmpty()) return null
        Mesh.recenter(cp)
        val normals = Mesh.computeNormals(cp, ci)
        progress(1f)
        return Mesh(cp, normals, cc, ci)
    }

    companion object {
        const val BLOCK = 8
        const val BLOCK_VOXELS = BLOCK * BLOCK * BLOCK
        const val MAX_WEIGHT = 64
        const val MAX_COLOR_WEIGHT = 32
        /** Максимальный скачок TSDF на ребре, при котором пересечение считается настоящим. */
        const val MAX_JUMP = 1.0f

        private const val OFF = 1 shl 20
        private const val MASK = (1L shl 21) - 1

        fun packKey(x: Int, y: Int, z: Int): Long =
            ((x + OFF).toLong() and MASK shl 42) or ((y + OFF).toLong() and MASK shl 21) or ((z + OFF).toLong() and MASK)

        fun unpackX(k: Long) = ((k shr 42) and MASK).toInt() - OFF
        fun unpackY(k: Long) = ((k shr 21) and MASK).toInt() - OFF
        fun unpackZ(k: Long) = (k and MASK).toInt() - OFF
    }
}
