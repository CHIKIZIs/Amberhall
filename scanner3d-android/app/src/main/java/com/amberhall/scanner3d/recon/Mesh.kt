package com.amberhall.scanner3d.recon

import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/** Треугольная сетка с цветами вершин. Цвета — sRGB, по 3 байта на вершину. */
class Mesh(
    val positions: FloatArray,
    val normals: FloatArray,
    val colors: ByteArray,
    val indices: IntArray,
) {
    val vertexCount get() = positions.size / 3
    val triangleCount get() = indices.size / 3

    fun bounds(): FloatArray {
        val b = floatArrayOf(Float.MAX_VALUE, Float.MAX_VALUE, Float.MAX_VALUE, -Float.MAX_VALUE, -Float.MAX_VALUE, -Float.MAX_VALUE)
        for (i in 0 until vertexCount) {
            for (a in 0..2) {
                val v = positions[i * 3 + a]
                b[a] = min(b[a], v)
                b[a + 3] = max(b[a + 3], v)
            }
        }
        if (vertexCount == 0) b.fill(0f)
        return b
    }

    companion object {
        fun computeNormals(positions: FloatArray, indices: IntArray): FloatArray {
            val n = FloatArray(positions.size)
            var t = 0
            while (t < indices.size) {
                val a = indices[t] * 3; val b = indices[t + 1] * 3; val c = indices[t + 2] * 3
                val ux = positions[b] - positions[a]; val uy = positions[b + 1] - positions[a + 1]; val uz = positions[b + 2] - positions[a + 2]
                val vx = positions[c] - positions[a]; val vy = positions[c + 1] - positions[a + 1]; val vz = positions[c + 2] - positions[a + 2]
                val nx = uy * vz - uz * vy
                val ny = uz * vx - ux * vz
                val nz = ux * vy - uy * vx
                for (i in intArrayOf(a, b, c)) {
                    n[i] += nx; n[i + 1] += ny; n[i + 2] += nz
                }
                t += 3
            }
            for (i in 0 until n.size / 3) {
                val x = n[i * 3]; val y = n[i * 3 + 1]; val z = n[i * 3 + 2]
                val l = sqrt(x * x + y * y + z * z)
                if (l > 1e-12f) {
                    n[i * 3] = x / l; n[i * 3 + 1] = y / l; n[i * 3 + 2] = z / l
                } else {
                    n[i * 3 + 1] = 1f
                }
            }
            return n
        }

        /**
         * Удаляет мелкие несвязанные «островки» (шум), оставляя компоненты,
         * в которых не меньше [minFraction] треугольников от самой большой и не меньше [minTriangles].
         */
        fun removeSmallComponents(
            positions: FloatArray, colors: ByteArray, indices: IntArray,
            minTriangles: Int, minFraction: Float,
        ): Triple<FloatArray, ByteArray, IntArray> {
            val vc = positions.size / 3
            val parent = IntArray(vc) { it }
            fun find(x: Int): Int {
                var r = x
                while (parent[r] != r) r = parent[r]
                var c = x
                while (parent[c] != r) { val nx = parent[c]; parent[c] = r; c = nx }
                return r
            }
            fun union(a: Int, b: Int) {
                val ra = find(a); val rb = find(b)
                if (ra != rb) parent[ra] = rb
            }
            var t = 0
            while (t < indices.size) {
                union(indices[t], indices[t + 1]); union(indices[t], indices[t + 2]); t += 3
            }
            val triCount = HashMap<Int, Int>()
            t = 0
            while (t < indices.size) {
                val r = find(indices[t]); triCount[r] = (triCount[r] ?: 0) + 1; t += 3
            }
            val largest = triCount.values.maxOrNull() ?: 0
            val threshold = max(minTriangles, (largest * minFraction).toInt())
            val keepRoot = HashSet<Int>()
            for ((r, c) in triCount) if (c >= threshold) keepRoot.add(r)
            if (keepRoot.isEmpty() && largest > 0) {
                keepRoot.add(triCount.maxByOrNull { it.value }!!.key)
            }

            val remap = IntArray(vc) { -1 }
            var newVc = 0
            val newIdx = IntArray(indices.size)
            var ni = 0
            t = 0
            while (t < indices.size) {
                if (find(indices[t]) in keepRoot) {
                    for (k in 0..2) {
                        val v = indices[t + k]
                        if (remap[v] < 0) remap[v] = newVc++
                        newIdx[ni++] = remap[v]
                    }
                }
                t += 3
            }
            val p = FloatArray(newVc * 3)
            val c = ByteArray(newVc * 3)
            for (v in 0 until vc) {
                val r = remap[v]
                if (r >= 0) {
                    System.arraycopy(positions, v * 3, p, r * 3, 3)
                    System.arraycopy(colors, v * 3, c, r * 3, 3)
                }
            }
            return Triple(p, c, newIdx.copyOf(ni))
        }

        /**
         * Оставляет только треугольники, для которых [keep] вернул true,
         * и удаляет неиспользуемые вершины.
         */
        fun filterTriangles(
            positions: FloatArray, colors: ByteArray, indices: IntArray,
            keep: (Int, Int, Int) -> Boolean,
        ): Triple<FloatArray, ByteArray, IntArray> {
            val vc = positions.size / 3
            val remap = IntArray(vc) { -1 }
            var newVc = 0
            val newIdx = IntArray(indices.size)
            var ni = 0
            var t = 0
            while (t < indices.size) {
                val a = indices[t]; val b = indices[t + 1]; val c = indices[t + 2]
                if (keep(a, b, c)) {
                    for (v in intArrayOf(a, b, c)) {
                        if (remap[v] < 0) remap[v] = newVc++
                        newIdx[ni++] = remap[v]
                    }
                }
                t += 3
            }
            val p = FloatArray(newVc * 3)
            val col = ByteArray(newVc * 3)
            for (v in 0 until vc) {
                val r = remap[v]
                if (r >= 0) {
                    System.arraycopy(positions, v * 3, p, r * 3, 3)
                    System.arraycopy(colors, v * 3, col, r * 3, 3)
                }
            }
            return Triple(p, col, newIdx.copyOf(ni))
        }

        /** Обрезает сетку по коробке [box] = (minX, minY, minZ, maxX, maxY, maxZ). */
        fun cropToBox(
            positions: FloatArray, colors: ByteArray, indices: IntArray, box: FloatArray,
        ): Triple<FloatArray, ByteArray, IntArray> {
            fun inside(v: Int): Boolean {
                val x = positions[v * 3]; val y = positions[v * 3 + 1]; val z = positions[v * 3 + 2]
                return x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5]
            }
            return filterTriangles(positions, colors, indices) { a, b, c -> inside(a) && inside(b) && inside(c) }
        }

        /**
         * Ищет опорную горизонтальную поверхность (стол/пол) под предметом.
         * Ось Y в ARCore направлена строго вверх (по гравитации), поэтому ищем самый
         * низкий заметный пик высот среди «смотрящих вверх» вершин.
         * Возвращает высоту плоскости или null, если её нет.
         */
        fun findSupportPlane(positions: FloatArray, indices: IntArray): Float? {
            val normals = computeNormals(positions, indices)
            val vc = positions.size / 3
            var minY = Float.MAX_VALUE; var maxY = -Float.MAX_VALUE
            for (i in 0 until vc) if (normals[i * 3 + 1] > 0.9f) {
                minY = min(minY, positions[i * 3 + 1]); maxY = max(maxY, positions[i * 3 + 1])
            }
            if (minY > maxY) return null
            val bin = 0.004f
            val bins = ((maxY - minY) / bin).toInt() + 1
            val hist = IntArray(bins)
            for (i in 0 until vc) if (normals[i * 3 + 1] > 0.9f) {
                hist[((positions[i * 3 + 1] - minY) / bin).toInt()]++
            }
            // Сглаживаем гистограмму окном в 3 корзины.
            val sm = IntArray(bins) { b -> (if (b > 0) hist[b - 1] else 0) + hist[b] + (if (b < bins - 1) hist[b + 1] else 0) }
            val peak = sm.maxOrNull() ?: return null
            if (peak < 150) return null
            for (b in 0 until bins) {
                val isLocalMax = (b == 0 || sm[b] >= sm[b - 1]) && (b == bins - 1 || sm[b] >= sm[b + 1])
                if (isLocalMax && sm[b] >= peak * 0.3f) {
                    // Уточняем высоту средним по пику.
                    var sum = 0.0; var n = 0
                    for (i in 0 until vc) if (normals[i * 3 + 1] > 0.9f) {
                        val y = positions[i * 3 + 1]
                        if (abs(y - (minY + (b + 0.5f) * bin)) < bin * 2) { sum += y; n++ }
                    }
                    return if (n > 0) (sum / n).toFloat() else minY + (b + 0.5f) * bin
                }
            }
            return null
        }

        /** Сглаживание Таубина: убирает шум, почти не уменьшая объём. Меняет [positions] на месте. */
        fun taubinSmooth(positions: FloatArray, indices: IntArray, iterations: Int) {
            if (iterations <= 0) return
            val vc = positions.size / 3
            // Список соседей в формате CSR.
            val deg = IntArray(vc + 1)
            var t = 0
            while (t < indices.size) {
                for (k in 0..2) deg[indices[t + k]] += 2
                t += 3
            }
            val start = IntArray(vc + 1)
            for (i in 0 until vc) start[i + 1] = start[i] + deg[i]
            val fill = start.copyOf()
            val nb = IntArray(start[vc])
            t = 0
            while (t < indices.size) {
                val a = indices[t]; val b = indices[t + 1]; val c = indices[t + 2]
                nb[fill[a]++] = b; nb[fill[a]++] = c
                nb[fill[b]++] = a; nb[fill[b]++] = c
                nb[fill[c]++] = a; nb[fill[c]++] = b
                t += 3
            }
            val tmp = FloatArray(positions.size)
            fun step(f: Float) {
                for (i in 0 until vc) {
                    val s = start[i]; val e = start[i + 1]
                    if (e == s) {
                        tmp[i * 3] = positions[i * 3]; tmp[i * 3 + 1] = positions[i * 3 + 1]; tmp[i * 3 + 2] = positions[i * 3 + 2]
                        continue
                    }
                    var x = 0f; var y = 0f; var z = 0f
                    for (j in s until e) { val n = nb[j] * 3; x += positions[n]; y += positions[n + 1]; z += positions[n + 2] }
                    val inv = 1f / (e - s)
                    tmp[i * 3] = positions[i * 3] + f * (x * inv - positions[i * 3])
                    tmp[i * 3 + 1] = positions[i * 3 + 1] + f * (y * inv - positions[i * 3 + 1])
                    tmp[i * 3 + 2] = positions[i * 3 + 2] + f * (z * inv - positions[i * 3 + 2])
                }
                System.arraycopy(tmp, 0, positions, 0, positions.size)
            }
            repeat(iterations) {
                step(0.5f)
                step(-0.53f)
            }
        }

        /** Сдвигает модель так, чтобы её центр по X/Z был в нуле, а низ — на Y=0. */
        fun recenter(positions: FloatArray) {
            if (positions.isEmpty()) return
            var minX = Float.MAX_VALUE; var maxX = -Float.MAX_VALUE
            var minY = Float.MAX_VALUE
            var minZ = Float.MAX_VALUE; var maxZ = -Float.MAX_VALUE
            for (i in 0 until positions.size / 3) {
                minX = min(minX, positions[i * 3]); maxX = max(maxX, positions[i * 3])
                minY = min(minY, positions[i * 3 + 1])
                minZ = min(minZ, positions[i * 3 + 2]); maxZ = max(maxZ, positions[i * 3 + 2])
            }
            val cx = (minX + maxX) / 2; val cz = (minZ + maxZ) / 2
            for (i in 0 until positions.size / 3) {
                positions[i * 3] -= cx
                positions[i * 3 + 1] -= minY
                positions[i * 3 + 2] -= cz
            }
        }
    }
}
