package com.amberhall.scanner3d.render

import android.opengl.GLES20
import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Рисует каркас коробки (область сканирования) в AR. */
class BoxRenderer {
    private var program = 0
    private var aPos = 0
    private var uMvp = 0
    private var uColor = 0
    private val verts = ByteBuffer.allocateDirect(24 * 3 * 4).order(ByteOrder.nativeOrder()).asFloatBuffer()

    fun create() {
        program = GlUtil.program(VS, FS)
        aPos = GLES20.glGetAttribLocation(program, "a_Position")
        uMvp = GLES20.glGetUniformLocation(program, "u_MVP")
        uColor = GLES20.glGetUniformLocation(program, "u_Color")
    }

    /** box = (minX, minY, minZ, maxX, maxY, maxZ) */
    fun draw(box: FloatArray, mvp: FloatArray, r: Float, g: Float, b: Float, a: Float) {
        val x = floatArrayOf(box[0], box[3]); val y = floatArrayOf(box[1], box[4]); val z = floatArrayOf(box[2], box[5])
        verts.position(0)
        // 12 рёбер: по 4 вдоль каждой оси.
        for (j in 0..1) for (k in 0..1) { verts.put(x[0]).put(y[j]).put(z[k]); verts.put(x[1]).put(y[j]).put(z[k]) }
        for (i in 0..1) for (k in 0..1) { verts.put(x[i]).put(y[0]).put(z[k]); verts.put(x[i]).put(y[1]).put(z[k]) }
        for (i in 0..1) for (j in 0..1) { verts.put(x[i]).put(y[j]).put(z[0]); verts.put(x[i]).put(y[j]).put(z[1]) }
        verts.position(0)

        GLES20.glUseProgram(program)
        GLES20.glUniformMatrix4fv(uMvp, 1, false, mvp, 0)
        GLES20.glUniform4f(uColor, r, g, b, a)
        GLES20.glEnable(GLES20.GL_BLEND)
        GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA, GLES20.GL_ONE_MINUS_SRC_ALPHA)
        GLES20.glDisable(GLES20.GL_DEPTH_TEST)
        GLES20.glLineWidth(4f)
        GLES20.glEnableVertexAttribArray(aPos)
        GLES20.glVertexAttribPointer(aPos, 3, GLES20.GL_FLOAT, false, 0, verts)
        GLES20.glDrawArrays(GLES20.GL_LINES, 0, 24)
        GLES20.glDisableVertexAttribArray(aPos)
        GLES20.glEnable(GLES20.GL_DEPTH_TEST)
        GLES20.glDisable(GLES20.GL_BLEND)
    }

    companion object {
        private const val VS = """
            uniform mat4 u_MVP;
            attribute vec3 a_Position;
            void main() { gl_Position = u_MVP * vec4(a_Position, 1.0); }
        """
        private const val FS = """
            precision mediump float;
            uniform vec4 u_Color;
            void main() { gl_FragColor = u_Color; }
        """
    }
}
