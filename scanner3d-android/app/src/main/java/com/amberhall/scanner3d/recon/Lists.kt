package com.amberhall.scanner3d.recon

/** Простые растущие массивы примитивов без боксинга. */
class FloatList(cap: Int = 1024) {
    var data = FloatArray(cap); private set
    var size = 0; private set
    fun add(v: Float) {
        if (size == data.size) data = data.copyOf(data.size * 2)
        data[size++] = v
    }
    fun toArray() = data.copyOf(size)
}

class IntList(cap: Int = 1024) {
    var data = IntArray(cap); private set
    var size = 0; private set
    fun add(v: Int) {
        if (size == data.size) data = data.copyOf(data.size * 2)
        data[size++] = v
    }
    fun toArray() = data.copyOf(size)
}

class ByteList(cap: Int = 1024) {
    var data = ByteArray(cap); private set
    var size = 0; private set
    fun add(v: Byte) {
        if (size == data.size) data = data.copyOf(data.size * 2)
        data[size++] = v
    }
    fun toArray() = data.copyOf(size)
}
