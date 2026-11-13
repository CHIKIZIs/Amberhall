package com.amberhall.scanner3d.io

import android.content.ContentValues
import android.content.Context
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import org.json.JSONObject
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class ScanInfo(
    val dir: File,
    val name: String,
    val createdAt: Long,
    val vertices: Int,
    val triangles: Int,
    val voxelMm: Int,
)

/** Хранилище сканов: каждый скан — папка с model.ply/.glb/.obj и meta.json. */
object ScanStore {
    const val PLY = "model.ply"
    const val GLB = "model.glb"
    const val OBJ = "model.obj"
    private const val META = "meta.json"

    fun root(ctx: Context) = File(ctx.filesDir, "scans").apply { mkdirs() }

    fun newScanDir(ctx: Context): File {
        val stamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())
        return File(root(ctx), "scan_$stamp").apply { mkdirs() }
    }

    fun list(ctx: Context): List<ScanInfo> =
        root(ctx).listFiles()?.filter { it.isDirectory && File(it, PLY).exists() }
            ?.mapNotNull { read(it) }
            ?.sortedByDescending { it.createdAt }
            ?: emptyList()

    fun read(dir: File): ScanInfo? = try {
        val metaFile = File(dir, META)
        if (metaFile.exists()) {
            val j = JSONObject(metaFile.readText())
            ScanInfo(dir, j.optString("name", dir.name), j.optLong("createdAt", dir.lastModified()),
                j.optInt("vertices"), j.optInt("triangles"), j.optInt("voxelMm"))
        } else {
            ScanInfo(dir, dir.name, dir.lastModified(), 0, 0, 0)
        }
    } catch (e: Exception) {
        null
    }

    fun writeMeta(info: ScanInfo) {
        val j = JSONObject()
            .put("name", info.name)
            .put("createdAt", info.createdAt)
            .put("vertices", info.vertices)
            .put("triangles", info.triangles)
            .put("voxelMm", info.voxelMm)
        File(info.dir, META).writeText(j.toString())
    }

    fun rename(info: ScanInfo, newName: String) = writeMeta(info.copy(name = newName))

    fun delete(info: ScanInfo) = info.dir.deleteRecursively()

    fun mimeFor(file: File) = when (file.extension.lowercase()) {
        "glb" -> "model/gltf-binary"
        "obj" -> "model/obj"
        "ply" -> "application/octet-stream"
        else -> "application/octet-stream"
    }

    /** Копирует файл в «Загрузки/3D Scanner». Возвращает Uri или null (Android < 10). */
    fun copyToDownloads(ctx: Context, file: File, displayName: String): Uri? {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return null
        val values = ContentValues().apply {
            put(MediaStore.Downloads.DISPLAY_NAME, displayName)
            put(MediaStore.Downloads.MIME_TYPE, mimeFor(file))
            put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/3D Scanner")
            put(MediaStore.Downloads.IS_PENDING, 1)
        }
        val resolver = ctx.contentResolver
        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
        resolver.openOutputStream(uri)?.use { out -> file.inputStream().use { it.copyTo(out) } }
        values.clear()
        values.put(MediaStore.Downloads.IS_PENDING, 0)
        resolver.update(uri, values, null, null)
        return uri
    }
}
