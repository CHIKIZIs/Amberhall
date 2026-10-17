class_name UI
extends CanvasLayer
## Интерфейс поверх 3D-сцены.

signal shop_buy(key: String)
signal boat_action(what: String)
signal result_closed
signal sound_toggled
signal view_toggled

const AMBER := Color("#ffb85c")
const UPS := [
	{"k": "rod", "n": "Удочка", "d": "Шире зелёная зона при вываживании"},
	{"k": "bait", "n": "Наживка", "d": "Быстрее клюёт, чаще редкая рыба"},
	{"k": "line", "n": "Леска", "d": "Рыба срывается медленнее, дольше окно подсечки"},
]

var font := SystemFont.new()
var coins_l: Label
var zone_l: Label
var hint_l: RichTextLabel
var charge: Control
var charge_v := 0.0
var bite_mark: Control
var reel_panel: Control
var reel_fish: TextureRect
var reel_state := {}
var fight: Fight
var fight_hud: Control
var view_btn: Button
var boat_box: VBoxContainer
var result_layer: Control
var result_view: SubViewport
var result_labels: VBoxContainer
var shop_layer: Control
var dex_layer: Control
var toast_l: Label
var sound_btn: Button
var thumbs := {}
var _toast_t := 0.0
var _boat_key := ""


func _ready() -> void:
	font.font_names = PackedStringArray(["Roboto", "Noto Sans", "DejaVu Sans", "sans-serif"])
	font.font_weight = 700
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.theme = _theme()
	add_child(root)
	# монеты и зона
	var tl := VBoxContainer.new()
	tl.position = Vector2(24, 18)
	tl.add_theme_constant_override("separation", 8)
	root.add_child(tl)
	var cp := _pill()
	tl.add_child(cp)
	var hb := HBoxContainer.new()
	hb.add_theme_constant_override("separation", 10)
	cp.add_child(hb)
	var coin := Coin.new()
	coin.custom_minimum_size = Vector2(30, 30)
	hb.add_child(coin)
	coins_l = _label("0", 26, AMBER)
	hb.add_child(coins_l)
	var zp := _pill(0.6)
	tl.add_child(zp)
	zone_l = _label("", 17, Color("#e6f3f1"))
	zp.add_child(zone_l)
	# кнопки справа
	var tr := HBoxContainer.new()
	_place(tr, Vector2(1, 0), Vector2(-640, 18), Vector2(616, 60))
	tr.alignment = BoxContainer.ALIGNMENT_END
	tr.add_theme_constant_override("separation", 10)
	root.add_child(tr)
	var b1 := _button("Лавка")
	b1.pressed.connect(func(): open_shop())
	tr.add_child(b1)
	var b2 := _button("Улов")
	b2.pressed.connect(func(): open_dex())
	tr.add_child(b2)
	view_btn = _button("Вид: глаза")
	view_btn.pressed.connect(func(): view_toggled.emit())
	tr.add_child(view_btn)
	sound_btn = _button("Звук: вкл")
	sound_btn.pressed.connect(func(): sound_toggled.emit())
	tr.add_child(sound_btn)
	# кнопки лодки
	boat_box = VBoxContainer.new()
	_place(boat_box, Vector2(0, 1), Vector2(24, -210), Vector2(260, 180))
	boat_box.alignment = BoxContainer.ALIGNMENT_END
	boat_box.add_theme_constant_override("separation", 10)
	root.add_child(boat_box)
	# подсказка
	hint_l = RichTextLabel.new()
	hint_l.bbcode_enabled = true
	hint_l.fit_content = true
	hint_l.scroll_active = false
	_place(hint_l, Vector2(0.5, 1), Vector2(-420, -58), Vector2(840, 40))
	hint_l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hint_l.add_theme_font_override("normal_font", font)
	hint_l.add_theme_font_override("bold_font", font)
	hint_l.add_theme_font_size_override("normal_font_size", 22)
	hint_l.add_theme_font_size_override("bold_font_size", 22)
	hint_l.add_theme_constant_override("outline_size", 8)
	hint_l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.75))
	root.add_child(hint_l)
	# сила заброса
	charge = Charge.new()
	_place(charge, Vector2(0.5, 1), Vector2(-170, -110), Vector2(340, 26))
	charge.visible = false
	charge.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(charge)
	# метка поклёвки
	bite_mark = Bite.new()
	bite_mark.size = Vector2(70, 70)
	bite_mark.visible = false
	bite_mark.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(bite_mark)
	# вываживание
	fight_hud = FightHud.new()
	_place(fight_hud, Vector2(0.5, 1), Vector2(-330, -200), Vector2(660, 130))
	fight_hud.visible = false
	fight_hud.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(fight_hud)
	reel_panel = Control.new()
	_place(reel_panel, Vector2(1, 0.5), Vector2(-150, -190), Vector2(120, 380))
	reel_panel.visible = false
	reel_panel.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(reel_panel)
	reel_fish = TextureRect.new()
	reel_fish.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	reel_fish.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	reel_fish.size = Vector2(90, 56)
	reel_fish.mouse_filter = Control.MOUSE_FILTER_IGNORE
	reel_panel.add_child(reel_fish)
	# всплывающее сообщение
	toast_l = _label("", 28, Color.WHITE)
	_place(toast_l, Vector2(0.5, 0), Vector2(-400, 120), Vector2(800, 40))
	toast_l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	toast_l.add_theme_constant_override("outline_size", 10)
	toast_l.add_theme_color_override("font_outline_color", Color(0, 0, 0, 0.7))
	toast_l.modulate.a = 0.0
	root.add_child(toast_l)
	_build_result(root)
	shop_layer = _overlay(root)
	dex_layer = _overlay(root)


func _place(c: Control, anchor: Vector2, pos: Vector2, sz: Vector2) -> void:
	c.anchor_left = anchor.x
	c.anchor_right = anchor.x
	c.anchor_top = anchor.y
	c.anchor_bottom = anchor.y
	c.offset_left = pos.x
	c.offset_top = pos.y
	c.offset_right = pos.x + sz.x
	c.offset_bottom = pos.y + sz.y


# ───────── стили ─────────
func _theme() -> Theme:
	var th := Theme.new()
	th.default_font = font
	th.default_font_size = 20
	var sb := _box(Color(0.07, 0.12, 0.13, 0.82), 16, AMBER * Color(1, 1, 1, 0.45))
	sb.content_margin_left = 20
	sb.content_margin_right = 20
	sb.content_margin_top = 12
	sb.content_margin_bottom = 12
	th.set_stylebox("normal", "Button", sb)
	var hov := sb.duplicate()
	hov.bg_color = Color(0.12, 0.2, 0.21, 0.9)
	th.set_stylebox("hover", "Button", hov)
	var pr := sb.duplicate()
	pr.bg_color = Color(0.2, 0.15, 0.08, 0.95)
	th.set_stylebox("pressed", "Button", pr)
	var dis := sb.duplicate()
	dis.bg_color = Color(0.2, 0.2, 0.2, 0.6)
	dis.border_color = Color(1, 1, 1, 0.1)
	th.set_stylebox("disabled", "Button", dis)
	th.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	th.set_color("font_color", "Button", Color.WHITE)
	th.set_color("font_disabled_color", "Button", Color(1, 1, 1, 0.4))
	th.set_font_size("font_size", "Button", 21)
	return th


func _box(bg: Color, r: int, border := Color(0, 0, 0, 0)) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(r)
	if border.a > 0:
		sb.set_border_width_all(2)
		sb.border_color = border
	sb.shadow_color = Color(0, 0, 0, 0.3)
	sb.shadow_size = 6
	sb.anti_aliasing = true
	return sb


func _pill(alpha := 0.82) -> PanelContainer:
	var p := PanelContainer.new()
	var sb := _box(Color(0.07, 0.12, 0.13, alpha), 30, AMBER * Color(1, 1, 1, 0.4))
	sb.content_margin_left = 16
	sb.content_margin_right = 18
	sb.content_margin_top = 6
	sb.content_margin_bottom = 6
	p.add_theme_stylebox_override("panel", sb)
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p


func _label(text: String, size: int, col: Color) -> Label:
	var l := Label.new()
	l.text = text
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", col)
	l.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return l


func _button(text: String, accent := false) -> Button:
	var b := Button.new()
	b.text = text
	b.focus_mode = Control.FOCUS_NONE
	if accent:
		var sb := _box(AMBER, 16)
		sb.bg_color = Color("#f2a548")
		sb.content_margin_left = 20
		sb.content_margin_right = 20
		sb.content_margin_top = 12
		sb.content_margin_bottom = 12
		b.add_theme_stylebox_override("normal", sb)
		b.add_theme_stylebox_override("hover", sb)
		b.add_theme_color_override("font_color", Color("#2a1408"))
		b.add_theme_color_override("font_hover_color", Color("#2a1408"))
	return b


func _overlay(root: Control) -> Control:
	var o := ColorRect.new()
	o.color = Color(0.02, 0.06, 0.07, 0.7)
	o.set_anchors_preset(Control.PRESET_FULL_RECT)
	o.visible = false
	o.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed:
			o.visible = false)
	root.add_child(o)
	return o


# ───────── обновление ─────────
func set_coins(n: int) -> void:
	coins_l.text = str(n)


func set_zone(text: String) -> void:
	zone_l.text = text


func set_hint(text: String) -> void:
	if hint_l.text != text:
		hint_l.text = "[center]" + text + "[/center]"


func set_view(fp: bool) -> void:
	view_btn.text = "Вид: глаза" if fp else "Вид: сверху"


func set_sound(on: bool) -> void:
	sound_btn.text = "Звук: вкл" if on else "Звук: выкл"


func toast(text: String) -> void:
	toast_l.text = text
	_toast_t = 2.0


func _process(dt: float) -> void:
	if _toast_t > 0.0:
		_toast_t -= dt
		toast_l.modulate.a = clampf(_toast_t * 2.0, 0.0, 1.0)
	charge.set_meta("v", charge_v)
	charge.queue_redraw()
	if fight_hud.visible and fight:
		fight_hud.set_meta("f", fight)
		fight_hud.set_meta("font", font)
		fight_hud.queue_redraw()
	if bite_mark.visible:
		bite_mark.queue_redraw()


func show_bite(pos: Vector2, k: float) -> void:
	bite_mark.visible = true
	bite_mark.position = pos - Vector2(35, 110)
	bite_mark.set_meta("k", k)


func set_boat_buttons(key: String, buttons: Array) -> void:
	if key == _boat_key:
		return
	_boat_key = key
	for c in boat_box.get_children():
		c.queue_free()
	for b in buttons:
		var btn := _button(b[1], b[2])
		var what: String = b[0]
		btn.pressed.connect(func(): boat_action.emit(what))
		boat_box.add_child(btn)


# ───────── окно улова ─────────
func _build_result(root: Control) -> void:
	result_layer = ColorRect.new()
	(result_layer as ColorRect).color = Color(0.02, 0.06, 0.07, 0.55)
	result_layer.set_anchors_preset(Control.PRESET_FULL_RECT)
	result_layer.visible = false
	result_layer.gui_input.connect(func(e):
		if e is InputEventMouseButton and e.pressed:
			result_layer.visible = false
			result_closed.emit())
	root.add_child(result_layer)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", _box(Color(0.1, 0.17, 0.18, 0.96), 26, AMBER))
	_place(card, Vector2(0.5, 0.5), Vector2(-230, -250), Vector2(460, 500))
	card.mouse_filter = Control.MOUSE_FILTER_IGNORE
	result_layer.add_child(card)
	var vb := VBoxContainer.new()
	vb.alignment = BoxContainer.ALIGNMENT_CENTER
	vb.mouse_filter = Control.MOUSE_FILTER_IGNORE
	card.add_child(vb)
	var svc := SubViewportContainer.new()
	svc.stretch = true
	svc.custom_minimum_size = Vector2(420, 250)
	svc.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_child(svc)
	result_view = SubViewport.new()
	result_view.own_world_3d = true
	result_view.transparent_bg = true
	result_view.msaa_3d = Viewport.MSAA_4X
	svc.add_child(result_view)
	result_labels = VBoxContainer.new()
	result_labels.mouse_filter = Control.MOUSE_FILTER_IGNORE
	vb.add_child(result_labels)


func show_result(model: Node3D, f: Dictionary, weight: float, coins: int, first: bool) -> void:
	for c in result_view.get_children():
		c.queue_free()
	for c in result_labels.get_children():
		c.queue_free()
	var stage := Node3D.new()
	result_view.add_child(stage)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("#9fc2c8")
	e.ambient_light_energy = 0.8
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.environment = e
	stage.add_child(env)
	var key := DirectionalLight3D.new()
	key.light_color = Color("#ffe2bf")
	key.light_energy = 1.6
	stage.add_child(key)
	key.look_at_from_position(Vector3(2, 3, 4), Vector3.ZERO)
	var rim := DirectionalLight3D.new()
	rim.light_color = Color("#7fd0ff")
	rim.light_energy = 1.0
	stage.add_child(rim)
	rim.look_at_from_position(Vector3(-3, 1, -3), Vector3.ZERO)
	var spin := Spinner.new()
	stage.add_child(spin)
	var tilt := Node3D.new()
	tilt.rotation.x = 0.8 if f.m.get("kind", "") in ["flat", "crab"] else 0.25
	spin.add_child(tilt)
	tilt.add_child(model)
	var aabb := Thumbs.aabb_of(model)
	model.position = -aabb.get_center()
	var cam := Camera3D.new()
	cam.fov = 30
	var r: float = max(aabb.size.x, max(aabb.size.y * 1.6, aabb.size.z)) * 0.5
	cam.position = Vector3(0, r * 0.3, r / tan(deg_to_rad(15)) * 0.95)
	stage.add_child(cam)
	cam.look_at(Vector3.ZERO)
	var tl := _label(Fishes.TIER_NAMES[f.tier], 18, Fishes.tier_color(f))
	tl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	result_labels.add_child(tl)
	if first:
		var nl := _label("НОВЫЙ ВИД!", 18, AMBER)
		nl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		result_labels.add_child(nl)
	for row in [[f.n, 32, Color.WHITE], [("%.2f кг" % weight) if weight < 10 else ("%.1f кг" % weight), 22, Color(1, 1, 1, 0.85)], ["+%d монет" % coins, 28, AMBER], ["Нажми, чтобы продолжить", 16, Color(1, 1, 1, 0.5)]]:
		var l := _label(row[0], row[1], row[2])
		l.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		result_labels.add_child(l)
	result_layer.visible = true


func any_open() -> bool:
	return result_layer.visible or shop_layer.visible or dex_layer.visible


# ───────── лавка ─────────
var save_ref: Dictionary
var cost_ref: Array


func open_shop() -> void:
	for c in shop_layer.get_children():
		c.queue_free()
	var card := _sheet(shop_layer, "Лавка рыбака", "Улучшай снасти — лови крупнее и реже теряй рыбу")
	for u in UPS:
		var lv: int = save_ref.up[u.k]
		var row := PanelContainer.new()
		row.add_theme_stylebox_override("panel", _box(Color(1, 1, 1, 0.06), 14))
		card.add_child(row)
		var hb := HBoxContainer.new()
		hb.add_theme_constant_override("separation", 16)
		row.add_child(hb)
		var vb := VBoxContainer.new()
		vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hb.add_child(vb)
		vb.add_child(_label(u.n, 22, Color.WHITE))
		vb.add_child(_label(u.d, 16, Color(1, 1, 1, 0.65)))
		var dots := _label("●".repeat(lv) + "○".repeat(5 - lv), 18, AMBER)
		vb.add_child(dots)
		var maxed := lv >= 5
		var b := _button("МАКС" if maxed else "%d монет" % cost_ref[lv], not maxed)
		b.disabled = maxed or save_ref.coins < cost_ref[lv]
		b.custom_minimum_size = Vector2(150, 0)
		var k: String = u.k
		b.pressed.connect(func(): shop_buy.emit(k))
		hb.add_child(b)
	shop_layer.visible = true


func open_dex() -> void:
	for c in dex_layer.get_children():
		c.queue_free()
	var got: int = save_ref.dex.size()
	var card := _sheet(dex_layer, "Коллекция", "Открыто видов: %d из %d" % [got, Fishes.LIST.size()])
	var grid := GridContainer.new()
	grid.columns = 7
	grid.add_theme_constant_override("h_separation", 10)
	grid.add_theme_constant_override("v_separation", 10)
	card.add_child(grid)
	for f in Fishes.LIST:
		var d = save_ref.dex.get(f.id)
		var cell := PanelContainer.new()
		cell.add_theme_stylebox_override("panel", _box(Color(1, 1, 1, 0.06), 14, Fishes.tier_color(f) * Color(1, 1, 1, 0.7 if d != null else 0.25)))
		cell.custom_minimum_size = Vector2(128, 0)
		grid.add_child(cell)
		var vb := VBoxContainer.new()
		cell.add_child(vb)
		var tr := TextureRect.new()
		tr.texture = thumbs.get(f.id)
		tr.custom_minimum_size = Vector2(118, 74)
		tr.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
		tr.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
		if d == null:
			tr.modulate = Color(0, 0, 0, 0.55)
		vb.add_child(tr)
		var nm := _label(f.n if d != null else "???", 17, Color.WHITE)
		nm.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(nm)
		var info := ("×%d · %.2f кг" % [d.n, d.best]) if d != null else "не поймана"
		var il := _label(info, 13, Color(1, 1, 1, 0.6))
		il.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vb.add_child(il)
	dex_layer.visible = true


func _sheet(layer: Control, title: String, sub: String) -> VBoxContainer:
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", _box(Color(0.1, 0.17, 0.18, 0.97), 24, AMBER * Color(1, 1, 1, 0.5)))
	card.set_anchors_preset(Control.PRESET_FULL_RECT)
	card.offset_left = 120
	card.offset_right = -120
	card.offset_top = 40
	card.offset_bottom = -40
	layer.add_child(card)
	var sc := ScrollContainer.new()
	sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	card.add_child(sc)
	var vb := VBoxContainer.new()
	vb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vb.add_theme_constant_override("separation", 10)
	sc.add_child(vb)
	var hb := HBoxContainer.new()
	vb.add_child(hb)
	var tv := VBoxContainer.new()
	tv.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hb.add_child(tv)
	tv.add_child(_label(title, 30, AMBER))
	tv.add_child(_label(sub, 17, Color(1, 1, 1, 0.65)))
	var close := _button("Закрыть")
	close.pressed.connect(func(): layer.visible = false)
	hb.add_child(close)
	return vb


# ───────── нарисованные элементы ─────────
class Coin:
	extends Control
	func _draw() -> void:
		var c := size / 2
		draw_circle(c, 14, Color("#b8801e"))
		draw_circle(c, 12, Color("#ffcf4d"))
		draw_circle(c, 8, Color("#f0b52f"))
		draw_arc(c, 8, 0, TAU, 24, Color("#ffe39a"), 1.5, true)


class Charge:
	extends Control
	func _draw() -> void:
		var v: float = get_meta("v", 0.0)
		var r := Rect2(Vector2.ZERO, size)
		draw_rect(r.grow(4), Color(0.05, 0.1, 0.11, 0.75))
		var n := 40
		for i in n:
			var t := float(i) / n
			if t > v:
				break
			var col := Color("#7fd66a").lerp(Color("#ffc24a"), clampf(t * 1.7, 0, 1)) if t < 0.6 else Color("#ffc24a").lerp(Color("#e8553a"), (t - 0.6) / 0.4)
			draw_rect(Rect2(Vector2(size.x * t, 0), Vector2(size.x / n + 1, size.y)), col)
		draw_rect(r, Color(1, 1, 1, 0.7), false, 2.0)


class Bite:
	extends Control
	func _draw() -> void:
		var k: float = get_meta("k", 0.0)
		var c := size / 2 + Vector2(0, sin(Time.get_ticks_msec() * 0.03) * 3)
		draw_circle(c, 32, Color.WHITE)
		draw_circle(c, 28, Color("#d8402f"))
		draw_arc(c, 32, -PI / 2, -PI / 2 + TAU * (1.0 - k), 40, Color("#ffd36a"), 5, true)
		var f := ThemeDB.fallback_font
		draw_string(f, c + Vector2(-8, 14), "!", HORIZONTAL_ALIGNMENT_CENTER, -1, 40, Color.WHITE)


class FightHud:
	extends Control
	func _draw() -> void:
		var fi: Fight = get_meta("f", null)
		if fi == null:
			return
		var fnt: Font = get_meta("font", ThemeDB.fallback_font)
		var w := size.x
		# метры лески
		var txt := "%.1f м" % fi.line
		draw_string(fnt, Vector2(0, 34), txt, HORIZONTAL_ALIGNMENT_CENTER, w, 36, Color.WHITE)
		# натяжение
		var bar := Rect2(Vector2(40, 52), Vector2(w - 80, 26))
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.04, 0.09, 0.1, 0.8)
		sb.set_corner_radius_all(13)
		draw_style_box(sb, bar.grow(5))
		var zones := [[0.0, 0.3, Color(0.35, 0.55, 0.7, 0.55)], [0.3, 0.82, Color(0.35, 0.85, 0.45, 0.7)], [0.82, 0.94, Color(0.95, 0.75, 0.25, 0.75)], [0.94, 1.0, Color(0.95, 0.3, 0.2, 0.85)]]
		for z in zones:
			draw_rect(Rect2(bar.position + Vector2(bar.size.x * z[0], 0), Vector2(bar.size.x * (z[1] - z[0]), bar.size.y)), z[2])
		var tx := bar.position.x + bar.size.x * clampf(fi.tension, 0.0, 1.0)
		var shake := sin(Time.get_ticks_msec() * 0.06) * 3.0 * clampf(fi.overload() * 2.0, 0.0, 1.0)
		draw_rect(Rect2(Vector2(tx - 3 + shake, bar.position.y - 8), Vector2(6, bar.size.y + 16)), Color.WHITE)
		draw_string(fnt, bar.position + Vector2(0, bar.size.y + 26), "слабо", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color(1, 1, 1, 0.55))
		draw_string(fnt, bar.position + Vector2(0, bar.size.y + 26), "натяжение", HORIZONTAL_ALIGNMENT_CENTER, bar.size.x, 15, Color(1, 1, 1, 0.75))
		draw_string(fnt, bar.position + Vector2(0, bar.size.y + 26), "обрыв!", HORIZONTAL_ALIGNMENT_RIGHT, bar.size.x, 15, Color(1, 0.5, 0.4, 0.8))
		# силы рыбы
		var st := Rect2(Vector2(w * 0.5 + 70, 12), Vector2(w * 0.5 - 110, 10))
		draw_rect(st, Color(1, 1, 1, 0.15))
		draw_rect(Rect2(st.position, Vector2(st.size.x * fi.stamina, st.size.y)), Color("#ff8a5a").lerp(Color("#ffd36a"), 1.0 - fi.stamina))
		draw_string(fnt, st.position + Vector2(0, -4), "силы рыбы", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(1, 1, 1, 0.6))
		# рывок: подсказка вести удилище
		if fi.running and abs(fi.run_dir) > 0.5:
			var left: bool = fi.run_dir < 0
			var c := Color("#ffb85c")
			var cx := 18.0 if left else w - 18.0
			var d := -1.0 if left else 1.0
			draw_colored_polygon(PackedVector2Array([Vector2(cx + d * 14, 65), Vector2(cx - d * 8, 50), Vector2(cx - d * 8, 80)]), c)
			var hint := "Рывок! Веди удочку " + ("вправо" if left else "влево") + " (тяни пальцем)"
			draw_string(fnt, Vector2(0, -8), hint, HORIZONTAL_ALIGNMENT_CENTER, w, 19, c)


class Reel:
	extends Control
	func track_rect() -> Rect2:
		return Rect2(Vector2(16, 16), Vector2(64, size.y - 32))
	func _draw() -> void:
		var s: Dictionary = get_meta("s", {})
		if s.is_empty():
			return
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color(0.05, 0.11, 0.12, 0.8)
		sb.set_corner_radius_all(18)
		sb.border_color = Color("#ffb85c") * Color(1, 1, 1, 0.4)
		sb.set_border_width_all(2)
		draw_style_box(sb, Rect2(Vector2.ZERO, size))
		var tr := track_rect()
		var n := 30
		for i in n:
			var t := float(i) / n
			draw_rect(Rect2(tr.position + Vector2(0, tr.size.y * t), Vector2(tr.size.x, tr.size.y / n + 1)), Color("#3f93a3").lerp(Color("#123c48"), t))
		var bh: float = s.bar_h * tr.size.y
		var by: float = tr.position.y + (1.0 - s.bar - s.bar_h) * tr.size.y
		var zone := StyleBoxFlat.new()
		zone.bg_color = Color(0.45, 0.92, 0.5, 0.85) if s.in_zone else Color(0.3, 0.7, 0.38, 0.6)
		zone.set_corner_radius_all(10)
		zone.border_color = Color(0.8, 1, 0.8, 0.9)
		zone.set_border_width_all(2)
		draw_style_box(zone, Rect2(Vector2(tr.position.x + 3, by), Vector2(tr.size.x - 6, bh)))
		var pr := Rect2(Vector2(tr.end.x + 10, tr.position.y), Vector2(14, tr.size.y))
		draw_rect(pr, Color(1, 1, 1, 0.12))
		var ph: float = s.prog * pr.size.y
		var col := Color("#e8553a").lerp(Color("#ffc24a"), clampf(s.prog * 2, 0, 1)).lerp(Color("#7fd66a"), clampf(s.prog * 2 - 1, 0, 1))
		draw_rect(Rect2(Vector2(pr.position.x, pr.end.y - ph), Vector2(pr.size.x, ph)), col)


class Spinner:
	extends Node3D
	func _process(dt: float) -> void:
		rotation.y += dt * 0.9
		rotation.z = sin(Time.get_ticks_msec() * 0.002) * 0.15
