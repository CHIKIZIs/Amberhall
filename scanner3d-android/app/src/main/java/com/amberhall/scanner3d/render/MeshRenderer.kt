package com.amberhall.scanner3d.render

import android.opengl.GLES20
import android.opengl.GLES30
import com.amberhall.scanner3d.recon.Mesh
import java.nio.ByteBuffer
import java.nio.ByteOrder

/** Рисует сетку с цветами вершин и простым освещением. */
class MeshRenderer {
    private var program = 0
    private var vbo = 0
    private var ibo = 0
    private var indexCount = 0
    private var aPos = 0
    private var aNrm = 0
    private var aCol = 0
    private var uMvp = 0
    private var uModelView = 0
    private var uMode = 0

    fun create() {
        program = GlUtil.program(VS, FS)
        aPos = GLES20.glGetAttribLocation(program, "a_Position")
        aNrm = GLES20.glGetAttribLocation(program, "a_Normal")
        aCol = GLES20.glGetAttribLocation(program, "a_Color")
        uMvp = GLES20.glGetUniformLocation(program, "u_MVP")
        uModelView = GLES20.glGetUniformLocation(program, "u_ModelView")
        uMode = GLES20.glGetUniformLocation(program, "u_Mode")
        val b = IntArray(2)
        GLES20.glGenBuffers(2, b, 0)
        vbo = b[0]; ibo = b[1]
    }

    fun upload(mesh: Mesh) {
        val vc = mesh.vertexCount
        val vb = ByteBuffer.allocateDirect(vc * STRIDE).order(ByteOrder.nativeOrder())
        for (i in 0 until vc) {
            vb.putFloat(mesh.positions[i * 3]); vb.putFloat(mesh.positions[i * 3 + 1]); vb.putFloat(mesh.positions[i * 3 + 2])
            vb.putFloat(mesh.normals[i * 3]); vb.putFloat(mesh.normals[i * 3 + 1]); vb.putFloat(mesh.normals[i * 3 + 2])
            vb.put(mesh.colors[i * 3]); vb.put(mesh.colors[i * 3 + 1]); vb.put(mesh.colors[i * 3 + 2]); vb.put(0xFF.toByte())
        }
        vb.position(0)
        val ib = ByteBuffer.allocateDirect(mesh.indices.size * 4).order(ByteOrder.nativeOrder())
        ib.asIntBuffer().put(mesh.indices)
        ib.position(0)

        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo)
        GLES20.glBufferData(GLES20.GL_ARRAY_BUFFER, vc * STRIDE, vb, GLES20.GL_STATIC_DRAW)
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0)
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, ibo)
        GLES20.glBufferData(GLES20.GL_ELEMENT_ARRAY_BUFFER, mesh.indices.size * 4, ib, GLES20.GL_STATIC_DRAW)
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, 0)
        indexCount = mesh.indices.size
    }

    /** mode: 0 — цвета скана, 1 — «глина» (без цвета), 2 — нормали. */
    fun draw(mvp: FloatArray, modelView: FloatArray, mode: Int) {
        if (indexCount == 0) return
        GLES20.glUseProgram(program)
        GLES20.glUniformMatrix4fv(uMvp, 1, false, mvp, 0)
        GLES20.glUniformMatrix4fv(uModelView, 1, false, modelView, 0)
        GLES20.glUniform1i(uMode, mode)
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, vbo)
        GLES20.glEnableVertexAttribArray(aPos)
        GLES20.glEnableVertexAttribArray(aNrm)
        GLES20.glEnableVertexAttribArray(aCol)
        GLES20.glVertexAttribPointer(aPos, 3, GLES20.GL_FLOAT, false, STRIDE, 0)
        GLES20.glVertexAttribPointer(aNrm, 3, GLES20.GL_FLOAT, false, STRIDE, 12)
        GLES20.glVertexAttribPointer(aCol, 4, GLES20.GL_UNSIGNED_BYTE, true, STRIDE, 24)
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, ibo)
        GLES20.glDrawElements(GLES20.GL_TRIANGLES, indexCount, GLES30.GL_UNSIGNED_INT, 0)
        GLES20.glBindBuffer(GLES20.GL_ELEMENT_ARRAY_BUFFER, 0)
        GLES20.glDisableVertexAttribArray(aPos)
        GLES20.glDisableVertexAttribArray(aNrm)
        GLES20.glDisableVertexAttribArray(aCol)
        GLES20.glBindBuffer(GLES20.GL_ARRAY_BUFFER, 0)
    }

    companion object {
        const val STRIDE = 28

        private const val VS = """
            uniform mat4 u_MVP;
            uniform mat4 u_ModelView;
            attribute vec3 a_Position;
            attribute vec3 a_Normal;
            attribute vec4 a_Color;
            varying vec3 v_Normal;
            varying vec4 v_Color;
            void main() {
                gl_Position = u_MVP * vec4(a_Position, 1.0);
                v_Normal = (u_ModelView * vec4(a_Normal, 0.0)).xyz;
                v_Color = a_Color;
            }
        """
        private const val FS = """
            precision mediump float;
            uniform int u_Mode;
            varying vec3 v_Normal;
            varying vec4 v_Color;
            void main() {
                vec3 n = normalize(v_Normal);
                if (!gl_FrontFacing) n = -n;
                if (u_Mode == 2) {
                    gl_FragColor = vec4(n * 0.5 + 0.5, 1.0);
                    return;
                }
                // Свет «от камеры» + немного сверху.
                vec3 l = normalize(vec3(0.3, 0.6, 1.0));
                float diff = max(dot(n, l), 0.0);
                if (u_Mode == 1) {
                    vec3 base = vec3(0.78, 0.76, 0.72);
                    vec3 h = normalize(l + vec3(0.0, 0.0, 1.0));
                    float spec = pow(max(dot(n, h), 0.0), 24.0) * 0.25;
                    gl_FragColor = vec4(base * (0.25 + 0.75 * diff) + spec, 1.0);
                } else {
                    // Цвет из камеры уже содержит освещение — затеняем совсем немного.
                    gl_FragColor = vec4(v_Color.rgb * (0.75 + 0.3 * diff), 1.0);
                }
            }
        """
    }
}
