package com.amberhall.scanner3d

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.format.DateFormat
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.amberhall.scanner3d.io.ScanInfo
import com.amberhall.scanner3d.io.ScanStore
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.ar.core.ArCoreApk
import java.util.Date

class MainActivity : AppCompatActivity() {

    private lateinit var adapter: ScanAdapter
    private lateinit var empty: TextView
    private lateinit var support: TextView
    private lateinit var btnNew: MaterialButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        findViewById<View>(R.id.root).padForSystemBars()

        empty = findViewById(R.id.empty)
        support = findViewById(R.id.support)
        btnNew = findViewById(R.id.btnNewScan)
        btnNew.setOnClickListener { startActivity(Intent(this, ScanActivity::class.java)) }

        findViewById<TextView>(R.id.tips).text =
            "Как сканировать:\n" +
                "1. Выберите режим: «Предмет», «Обычный», «Комната» или «Улица».\n" +
                "2. Нажмите красную кнопку и медленно обходите объект, снимая его со всех сторон.\n" +
                "3. Нажмите «Готово» — телефон соберёт 3D-модель.\n" +
                "4. Модель можно вращать, отправить или сохранить (GLB, OBJ, PLY)."

        adapter = ScanAdapter(
            onClick = { info ->
                startActivity(Intent(this, ViewerActivity::class.java).putExtra(ViewerActivity.EXTRA_DIR, info.dir.absolutePath))
            },
            onLongClick = { info -> showItemMenu(info) },
        )
        findViewById<RecyclerView>(R.id.list).apply {
            layoutManager = LinearLayoutManager(this@MainActivity)
            adapter = this@MainActivity.adapter
        }
        checkArSupport()
    }

    override fun onResume() {
        super.onResume()
        refresh()
    }

    private fun refresh() {
        val items = ScanStore.list(this)
        adapter.submit(items)
        empty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
    }

    private fun checkArSupport(attempt: Int = 0) {
        val availability = ArCoreApk.getInstance().checkAvailability(this)
        if (availability.isTransient && attempt < 20) {
            Handler(Looper.getMainLooper()).postDelayed({ checkArSupport(attempt + 1) }, 250)
            return
        }
        if (availability == ArCoreApk.Availability.UNSUPPORTED_DEVICE_NOT_CAPABLE) {
            support.visibility = View.VISIBLE
            support.text = "Этот телефон не поддерживает ARCore (Google Play Services для AR), " +
                "поэтому сканирование недоступно. Просматривать сохранённые модели можно."
            btnNew.isEnabled = false
        }
    }

    private fun showItemMenu(info: ScanInfo) {
        MaterialAlertDialogBuilder(this)
            .setTitle(info.name)
            .setItems(arrayOf("Переименовать", "Удалить")) { _, which ->
                when (which) {
                    0 -> rename(info)
                    1 -> MaterialAlertDialogBuilder(this)
                        .setTitle("Удалить скан?")
                        .setMessage(info.name)
                        .setPositiveButton("Удалить") { _, _ -> ScanStore.delete(info); refresh() }
                        .setNegativeButton("Отмена", null)
                        .show()
                }
            }
            .show()
    }

    private fun rename(info: ScanInfo) {
        val input = EditText(this).apply { setText(info.name); setSelection(text.length) }
        MaterialAlertDialogBuilder(this)
            .setTitle("Название")
            .setView(input)
            .setPositiveButton("OK") { _, _ ->
                val n = input.text.toString().trim()
                if (n.isNotEmpty()) { ScanStore.rename(info, n); refresh() }
            }
            .setNegativeButton("Отмена", null)
            .show()
    }

    private class ScanAdapter(
        val onClick: (ScanInfo) -> Unit,
        val onLongClick: (ScanInfo) -> Unit,
    ) : RecyclerView.Adapter<ScanAdapter.VH>() {
        private var items: List<ScanInfo> = emptyList()

        class VH(v: View) : RecyclerView.ViewHolder(v) {
            val title: TextView = v.findViewById(R.id.title)
            val subtitle: TextView = v.findViewById(R.id.subtitle)
        }

        @android.annotation.SuppressLint("NotifyDataSetChanged")
        fun submit(list: List<ScanInfo>) { items = list; notifyDataSetChanged() }

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
            VH(LayoutInflater.from(parent.context).inflate(R.layout.item_scan, parent, false))

        override fun getItemCount() = items.size

        override fun onBindViewHolder(h: VH, position: Int) {
            val it = items[position]
            val ctx = h.itemView.context
            val date = DateFormat.getMediumDateFormat(ctx).format(Date(it.createdAt)) + " " +
                DateFormat.getTimeFormat(ctx).format(Date(it.createdAt))
            h.title.text = it.name
            h.subtitle.text = "$date · ${formatCount(it.triangles)} треугольников"
            h.itemView.setOnClickListener { _ -> onClick(it) }
            h.itemView.setOnLongClickListener { _ -> onLongClick(it); true }
        }
    }
}

fun formatCount(n: Int): String = when {
    n >= 1_000_000 -> String.format(java.util.Locale.US, "%.1f млн", n / 1e6)
    n >= 1_000 -> "${n / 1000} тыс."
    else -> n.toString()
}
