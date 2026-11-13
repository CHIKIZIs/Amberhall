package com.amberhall.scanner3d.recon

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
