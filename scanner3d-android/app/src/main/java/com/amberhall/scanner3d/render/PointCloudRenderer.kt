package com.amberhall.scanner3d.render

import android.opengl.GLES20
import com.amberhall.scanner3d.recon.PreviewCloud

/** Рисует накопленное облако точек предпросмотра поверх изображения камеры. */
class PointCloudRenderer {
    private var program = 0
    private var vbo = 0
    private var aPos = 0
    private var aCol = 0
    private var uMvp = 0
    private var uSize = 0
    private var uploaded = 0
    private var uploadedGeneration = -1
    private var capacity = 0

    fun create() {
        program = GlUtil.program(VS, FS)
        aPos = GLES20.glGetAttribLocation(program, "a_Position")
        aCol = GLES20.glGetAttribLocation(program, "a_Color")
        uMvp = GLES20.glGetUniformLocation(program, "u_MVP")
        uSize = GLES20.glGetUniformLocation(program, "u_PointSize")
        val b = IntArray(1)
        GLES20.glGenBuffers(1, b, 0)
        vbo = b[0]
    }

    fun draw(cloud: PreviewCloud, mvp: FloatArray, pointSize: Float) {
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo)
        if (capacity != cloud.capacity || uploadedGeneration != cloud.generation) {
            if (capacity != cloud.capacity) {
                capacity = cloud.capacity
                GLES20.glBufferData(GLES20.GL_ARRAY_BUFFER, capacity * PreviewCloud.STRIDE, null, GLES20.GL_DYNAMIC_DRAW)
            }
            uploadedGeneration = cloud.generation
            uploaded = 0
        }
        val count = cloud.count
        if (count > uploaded) {
            val dup = cloud.buffer.duplicate()
            dup.position(uploaded * PreviewCloud.STRIDE)
            dup.limit(count * PreviewCloud.STRIDE)
            GLES20.glBufferSubData(
                GLES20.GL_ARRAY_BUFFER, uploaded * PreviewCloud.STRIDE,
                (count - uploaded) * PreviewCloud.STRIDE, dup.slice(),
            )
            uploaded = count
        }
        if (uploaded > 0) {
            GLES20.glUseProgram(program)
            GLES20.glUniformMatrix4fv(uMvp, 1, false, mvp, 0)
            GLES20.glUniform1f(uSize, pointSize)
            GLES20.glEnableVertexAttribArray(aPos)
            GLES20.glEnableVertexAttribArray(aCol)
            GLES20.glVertexAttribPointer(aPos, 3, GLES20.GL_FLOAT, false, PreviewCloud.STRIDE, 0)
            GLES20.glVertexAttribPointer(aCol, 4, GLES20.GL_UNSIGNED_BYTE, true, PreviewCloud.STRIDE, 12)
            GLES20.glDrawArrays(GLES20.GL_POINTS, 0, uploaded)
            GLES20.glDisableVertexAttribArray(aPos)
            GLES20.glDisableVertexAttribArray(aCol)
        }
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0)
    }

    companion object {
        private const val VS = """
            uniform mat4 u_MVP;
            uniform float u_PointSize;
            attribute vec4 a_Position;
            attribute vec4 a_Color;
            varying vec4 v_Color;
            void main() {
                gl_Position = u_MVP * vec4(a_Position.xyz, 1.0);
                gl_PointSize = u_PointSize / max(gl_Position.w, 0.3);
                // Лёгкий зелёный оттенок, чтобы отсканированное было заметно на фоне камеры.
                v_Color = vec4(mix(a_Color.rgb, vec3(0.24, 0.86, 0.59), 0.35), 1.0);
            }
        """
        private const val FS = """
            precision mediump float;
            varying vec4 v_Color;
            void main() {
                gl_FragColor = v_Color;
            }
        """
    }
}
