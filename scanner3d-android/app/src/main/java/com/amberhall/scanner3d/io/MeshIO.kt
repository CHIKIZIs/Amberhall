package com.amberhall.scanner3d.io

import com.amberhall.scanner3d.recon.Mesh
import java.io.BufferedOutputStream
import java.io.BufferedWriter
import java.io.DataInputStream
import java.io.File
import java.io.FileOutputStream
import java.io.OutputStreamWriter
import java.nio.ByteBuffer
import java.nio.ByteOrder
import kotlin.math.pow

/** Сохранение/загрузка сеток: PLY (основной формат), OBJ и GLB для экспорта. */
object MeshIO {

    // ------------------------------------------------------------------ PLY

    fun writePly(mesh: Mesh, file: File) {
        val vc = mesh.vertexCount
        val tc = mesh.triangleCount
        val header = buildString {
            append("ply\n")
            append("format binary_little_endian 1.0\n")
            append("comment Created by 3D Scanner (Android)\n")
            append("element vertex $vc\n")
            append("property float x\nproperty float y\nproperty float z\n")
            append("property float nx\nproperty float ny\nproperty float nz\n")
            append("property uchar red\nproperty uchar green\nproperty uchar blue\n")
            append("element face $tc\n")
            append("property list uchar int vertex_indices\n")
            append("end_header\n")
        }
        BufferedOutputStream(FileOutputStream(file), 1 shl 16).use { out ->
            out.write(header.toByteArray(Charsets.US_ASCII))
            val vb = ByteBuffer.allocate(vc * 27).order(ByteOrder.LITTLE_ENDIAN)
            for (i in 0 until vc) {
                vb.putFloat(mesh.positions[i * 3]); vb.putFloat(mesh.positions[i * 3 + 1]); vb.putFloat(mesh.positions[i * 3 + 2])
                vb.putFloat(mesh.normals[i * 3]); vb.putFloat(mesh.normals[i * 3 + 1]); vb.putFloat(mesh.normals[i * 3 + 2])
                vb.put(mesh.colors[i * 3]); vb.put(mesh.colors[i * 3 + 1]); vb.put(mesh.colors[i * 3 + 2])
            }
            out.write(vb.array())
            val fb = ByteBuffer.allocate(tc * 13).order(ByteOrder.LITTLE_ENDIAN)
            for (t in 0 until tc) {
                fb.put(3)
                fb.putInt(mesh.indices[t * 3]); fb.putInt(mesh.indices[t * 3 + 1]); fb.putInt(mesh.indices[t * 3 + 2])
            }
            out.write(fb.array())
        }
    }

    /** Читает PLY, записанный [writePly]. */
    fun readPly(file: File): Mesh {
        DataInputStream(file.inputStream().buffered(1 shl 16)).use { input ->
            var vc = 0
            var tc = 0
            while (true) {
                val line = readLine(input)
                when {
                    line.startsWith("element vertex") -> vc = line.substringAfterLast(' ').trim().toInt()
                    line.startsWith("element face") -> tc = line.substringAfterLast(' ').trim().toInt()
                    line == "end_header" -> break
                }
            }
            val vbytes = ByteArray(vc * 27)
            input.readFully(vbytes)
            val vb = ByteBuffer.wrap(vbytes).order(ByteOrder.LITTLE_ENDIAN)
            val pos = FloatArray(vc * 3)
            val nrm = FloatArray(vc * 3)
            val col = ByteArray(vc * 3)
            for (i in 0 until vc) {
                pos[i * 3] = vb.float; pos[i * 3 + 1] = vb.float; pos[i * 3 + 2] = vb.float
                nrm[i * 3] = vb.float; nrm[i * 3 + 1] = vb.float; nrm[i * 3 + 2] = vb.float
                col[i * 3] = vb.get(); col[i * 3 + 1] = vb.get(); col[i * 3 + 2] = vb.get()
            }
            val fbytes = ByteArray(tc * 13)
            input.readFully(fbytes)
            val fb = ByteBuffer.wrap(fbytes).order(ByteOrder.LITTLE_ENDIAN)
            val idx = IntArray(tc * 3)
            for (t in 0 until tc) {
                fb.get()
                idx[t * 3] = fb.int; idx[t * 3 + 1] = fb.int; idx[t * 3 + 2] = fb.int
            }
            return Mesh(pos, nrm, col, idx)
        }
    }

    private fun readLine(input: DataInputStream): String {
        val sb = StringBuilder()
        while (true) {
            val c = input.read()
            if (c < 0 || c == '\n'.code) break
            if (c != '\r'.code) sb.append(c.toChar())
        }
        return sb.toString()
    }

    // ------------------------------------------------------------------ OBJ

    /** OBJ с цветами вершин (расширение «v x y z r g b», понимают Blender, MeshLab и др.). */
    fun writeObj(mesh: Mesh, file: File) {
        BufferedWriter(OutputStreamWriter(FileOutputStream(file), Charsets.US_ASCII), 1 shl 16).use { w ->
            w.write("# 3D Scanner (Android)\n")
            w.write("# vertices: ${mesh.vertexCount}, triangles: ${mesh.triangleCount}\n")
            val sb = StringBuilder(128)
            for (i in 0 until mesh.vertexCount) {
                sb.setLength(0)
                sb.append("v ")
                fmt(sb, mesh.positions[i * 3]); sb.append(' ')
                fmt(sb, mesh.positions[i * 3 + 1]); sb.append(' ')
                fmt(sb, mesh.positions[i * 3 + 2]); sb.append(' ')
                fmt3(sb, (mesh.colors[i * 3].toInt() and 0xFF) / 255f); sb.append(' ')
                fmt3(sb, (mesh.colors[i * 3 + 1].toInt() and 0xFF) / 255f); sb.append(' ')
                fmt3(sb, (mesh.colors[i * 3 + 2].toInt() and 0xFF) / 255f)
                sb.append('\n')
                w.write(sb.toString())
            }
            for (i in 0 until mesh.vertexCount) {
                sb.setLength(0)
                sb.append("vn ")
                fmt3(sb, mesh.normals[i * 3]); sb.append(' ')
                fmt3(sb, mesh.normals[i * 3 + 1]); sb.append(' ')
                fmt3(sb, mesh.normals[i * 3 + 2])
                sb.append('\n')
                w.write(sb.toString())
            }
            for (t in 0 until mesh.triangleCount) {
                val a = mesh.indices[t * 3] + 1; val b = mesh.indices[t * 3 + 1] + 1; val c = mesh.indices[t * 3 + 2] + 1
                w.write("f $a//$a $b//$b $c//$c\n")
            }
        }
    }

    /** Быстрое форматирование float с 5 знаками после запятой (без Locale). */
    private fun fmt(sb: StringBuilder, v: Float) = fixed(sb, v, 100000, 5)
    private fun fmt3(sb: StringBuilder, v: Float) = fixed(sb, v, 1000, 3)

    private fun fixed(sb: StringBuilder, v: Float, scale: Int, digits: Int) {
        var n = Math.round(v.toDouble() * scale)
        if (n < 0) { sb.append('-'); n = -n }
        sb.append(n / scale).append('.')
        val frac = (n % scale).toString()
        for (i in frac.length until digits) sb.append('0')
        sb.append(frac)
    }

    // ------------------------------------------------------------------ GLB (glTF 2.0)

    fun writeGlb(mesh: Mesh, file: File) {
        val vc = mesh.vertexCount
        val tc = mesh.triangleCount
        val posBytes = vc * 12
        val nrmBytes = vc * 12
        val colBytes = vc * 4
        val idxBytes = tc * 3 * 4
        val binLen = posBytes + nrmBytes + colBytes + idxBytes // всё кратно 4

        val b = mesh.bounds()
        // В glTF цвета вершин линейные, а камера даёт sRGB.
        val lut = ByteArray(256) { i ->
            val c = i / 255.0
            val lin = if (c <= 0.04045) c / 12.92 else ((c + 0.055) / 1.055).pow(2.4)
            Math.round(lin * 255).toInt().toByte()
        }

        val json = """
            {"asset":{"version":"2.0","generator":"3D Scanner (Android)"},
             "scene":0,"scenes":[{"nodes":[0]}],
             "nodes":[{"mesh":0,"name":"Scan"}],
             "meshes":[{"name":"Scan","primitives":[{"attributes":{"POSITION":0,"NORMAL":1,"COLOR_0":2},"indices":3,"material":0,"mode":4}]}],
             "materials":[{"name":"ScanMaterial","pbrMetallicRoughness":{"baseColorFactor":[1,1,1,1],"metallicFactor":0,"roughnessFactor":1},"doubleSided":true}],
             "buffers":[{"byteLength":$binLen}],
             "bufferViews":[
               {"buffer":0,"byteOffset":0,"byteLength":$posBytes,"target":34962},
               {"buffer":0,"byteOffset":$posBytes,"byteLength":$nrmBytes,"target":34962},
               {"buffer":0,"byteOffset":${posBytes + nrmBytes},"byteLength":$colBytes,"target":34962},
               {"buffer":0,"byteOffset":${posBytes + nrmBytes + colBytes},"byteLength":$idxBytes,"target":34963}],
             "accessors":[
               {"bufferView":0,"componentType":5126,"count":$vc,"type":"VEC3","min":[${b[0]},${b[1]},${b[2]}],"max":[${b[3]},${b[4]},${b[5]}]},
               {"bufferView":1,"componentType":5126,"count":$vc,"type":"VEC3"},
               {"bufferView":2,"componentType":5121,"normalized":true,"count":$vc,"type":"VEC4"},
               {"bufferView":3,"componentType":5125,"count":${tc * 3},"type":"SCALAR"}]}
        """.trimIndent().replace("\n", "")
        var jsonBytes = json.toByteArray(Charsets.UTF_8)
        val pad = (4 - jsonBytes.size % 4) % 4
        if (pad > 0) jsonBytes = jsonBytes + ByteArray(pad) { ' '.code.toByte() }

        val total = 12 + 8 + jsonBytes.size + 8 + binLen
        BufferedOutputStream(FileOutputStream(file), 1 shl 16).use { out ->
            val head = ByteBuffer.allocate(20).order(ByteOrder.LITTLE_ENDIAN)
            head.putInt(0x46546C67) // "glTF"
            head.putInt(2)
            head.putInt(total)
            head.putInt(jsonBytes.size)
            head.putInt(0x4E4F534A) // "JSON"
            out.write(head.array())
            out.write(jsonBytes)

            val bin = ByteBuffer.allocate(8 + binLen).order(ByteOrder.LITTLE_ENDIAN)
            bin.putInt(binLen)
            bin.putInt(0x004E4942) // "BIN\0"
            for (v in mesh.positions) bin.putFloat(v)
            for (v in mesh.normals) bin.putFloat(v)
            for (i in 0 until vc) {
                bin.put(lut[mesh.colors[i * 3].toInt() and 0xFF])
                bin.put(lut[mesh.colors[i * 3 + 1].toInt() and 0xFF])
                bin.put(lut[mesh.colors[i * 3 + 2].toInt() and 0xFF])
                bin.put(0xFF.toByte())
            }
            for (v in mesh.indices) bin.putInt(v)
            out.write(bin.array())
        }
    }
}
