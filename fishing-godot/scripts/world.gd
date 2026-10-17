class_name World
extends Node3D
## Гавань: двухъярусный пирс на сваях, хижина, лестница, подвесной мостик,
## бочки, ящики, фонари, дно с камнями и водорослями.

const DY := 1.6
const UY := 4.2
const WOOD := Color("#a8693d")
const WOOD_D := Color("#6e3f22")
const DECK := Color("#dca46c")

var water: Water
var gull_list: Array[Node3D] = []
var _rng := RandomNumberGenerator.new()


func build(w: Water) -> void:
	water = w
	_rng.seed = 7
	_deck()
	_posts_and_beams()
	_bridge()
	_upper_and_stairs()
	_hut()
	_props()
	_lamps()
	_seabed()
	_islands()


# ───────── настил ─────────
var _planks := {}

func _plank(center: Vector3, length: float, width: float, along_x: bool) -> void:
	var key := "%.2f_%.2f" % [length, width]
	if not _planks.has(key):
		_planks[key] = {"len": length, "w": width, "items": []}
	_planks[key].items.append([center, along_x])


func _panel(x0: float, z0: float, sx: float, sz: float, along_x: bool, y: float) -> void:
	if along_x:
		var n := int(round(sz / 0.5))
		for i in n:
			_plank(Vector3(x0 + sx / 2, y, z0 + 0.25 + i * 0.5), sx - 0.05, 0.45, true)
	else:
		var n := int(round(sx / 0.5))
		for i in n:
			_plank(Vector3(x0 + 0.25 + i * 0.5, y, z0 + sz / 2), sz - 0.05, 0.45, false)


func _deck() -> void:
	for i in 4:
		for j in 6:
			_panel(-14 + i * 3, -10 + j * 3, 3, 3, (i + j) % 2 == 0, DY)
	_panel(-14, -10, 6.5, 3.5, false, UY)
	_panel(-14, -6.5, 6.5, 3.5, true, UY)
	for i in 64:
		var t := i / 63.0
		_plank(Vector3(-4.4, DY - 0.05 - sin(t * PI) * 0.45, -10.35 - i * 0.5), 2.3, 0.42, true)
	var mat := Mats.wood(DECK, 0, {"use_color": true, "grain_strength": 0.45})
	for key in _planks:
		var d: Dictionary = _planks[key]
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.use_colors = true
		mm.mesh = Geo.bevel_box(Vector3(d.len, 0.14, d.w), 0.035)
		mm.instance_count = d.items.size()
		for i in d.items.size():
			var it: Array = d.items[i]
			var b := Basis()
			if not it[1]:
				b = Basis(Vector3.UP, PI / 2)
			b = b * Basis.from_euler(Vector3(_rng.randf_range(-0.012, 0.012), 0, _rng.randf_range(-0.01, 0.01)))
			var c: Vector3 = it[0]
			mm.set_instance_transform(i, Transform3D(b, c + Vector3(0, -0.07 + _rng.randf_range(-0.012, 0.012), 0)))
			var v := _rng.randf_range(0.82, 1.1)
			mm.set_instance_color(i, Color(v, v * _rng.randf_range(0.95, 1.0), v * _rng.randf_range(0.9, 1.0)))
		var inst := MultiMeshInstance3D.new()
		inst.multimesh = mm
		inst.material_override = mat
		add_child(inst)


# ───────── сваи и балки ─────────
func _post(x: float, z: float, top: float, bottom: float = -2.8, r: float = 0.19) -> void:
	var h := top - bottom
	Mats.mi(Geo.bevel_box(Vector3(r * 2, h, r * 2), 0.04), Mats.wood(WOOD, 1, {"wet_level": 0.25}), self, Vector3(x, bottom + h / 2, z))


func _beam(a: Vector3, size: Vector3, axis: int) -> void:
	Mats.mi(Geo.bevel_box(size, 0.03), Mats.wood(WOOD, axis), self, a)


func _posts_and_beams() -> void:
	_beam(Vector3(-2.1, DY - 0.3, -1), Vector3(0.3, 0.36, 18.3), 2)
	_beam(Vector3(-8, DY - 0.3, 8.1), Vector3(12.3, 0.36, 0.3), 0)
	_beam(Vector3(-8, DY - 0.3, -10.1), Vector3(12.3, 0.36, 0.3), 0)
	_beam(Vector3(-14.1, DY - 0.3, -1), Vector3(0.3, 0.36, 18.3), 2)
	for z in [-9.8, -6.5, -3.2, 0.1, 3.4, 6.7, 8.1]:
		_post(-2.15, z, DY - 0.12)
	for x in [-5.4, -8.7, -12.0, -14.1]:
		_post(x, 8.15, DY - 0.12)
		_post(x, -10.1, DY - 0.12)
	# диагональные связи под настилом
	for z in [-8.2, -1.6, 5.0]:
		var br := Mats.mi(Geo.bevel_box(Vector3(0.12, 2.2, 0.12), 0.02), Mats.wood(WOOD_D, 1, {"wet_level": 0.2}), self, Vector3(-2.2, 0.5, z))
		br.rotation.x = 0.9
	# покрышки-отбойники
	for z in [-4.8, 1.8, 5.2]:
		_tire(self, Vector3(-2.42, DY - 0.62, z), Vector3(0, PI / 2, 0))


func _tire(parent: Node3D, pos: Vector3, rot: Vector3) -> MeshInstance3D:
	var t := Mats.mi(Geo.torus(0.34, 0.15, 20, 10), Mats.std(Color("#1e1c1d"), 0.85), parent, pos, rot)
	t.rotation = rot + Vector3(PI / 2, 0, 0)
	return t


# ───────── подвесной мостик ─────────
func _bridge() -> void:
	var rope := Mats.std(Color("#8c7350"), 0.95)
	for i in 9:
		var z := -10.4 - i * 4.0
		var s := sin(i / 8.0 * PI) * 0.45
		for x in [-5.6, -3.2]:
			_post(x, z, DY + 1.0 - s, -2.8, 0.1)
	for x in [-5.6, -3.2]:
		for i in 8:
			var z0 := -10.4 - i * 4.0
			var s0 := sin(i / 8.0 * PI) * 0.45
			var s1 := sin((i + 1) / 8.0 * PI) * 0.45
			var pts := Geo.catenary(Vector3(x, DY + 0.95 - s0, z0), Vector3(x, DY + 0.95 - s1, z0 - 4), 0.25, 10)
			Mats.mi(Geo.tube(pts, 0.035, 5), rope, self, Vector3.ZERO, Vector3.ZERO, false)
			# вертикальные стропы
			for k in 4:
				var t := (k + 0.5) / 4.0
				var top := pts[int(t * 10)]
				var bot := Vector3(x, DY - 0.05 - sin(((i + t) / 8.0) * PI) * 0.45, top.z)
				Mats.mi(Geo.tube(PackedVector3Array([top, bot]), 0.015, 4), rope, self, Vector3.ZERO, Vector3.ZERO, false)


# ───────── верхний ярус и лестница ─────────
func _upper_and_stairs() -> void:
	for p in [[-7.65, -3.05], [-7.65, -9.9], [-11.0, -3.05], [-13.9, -3.05], [-13.9, -9.9]]:
		_post(p[0], p[1], UY - 0.12, DY - 0.1, 0.17)
	_beam(Vector3(-7.6, UY - 0.28, -6.5), Vector3(0.3, 0.3, 7.2), 2)
	_beam(Vector3(-10.8, UY - 0.28, -3.1), Vector3(6.6, 0.3, 0.3), 0)
	var rail := Mats.wood(WOOD_D, 1)
	for x in [-9.0, -10.4, -11.8, -13.2]:
		Mats.mi(Geo.bevel_box(Vector3(0.12, 1.0, 0.12), 0.02), rail, self, Vector3(x, UY + 0.5, -3.1))
	Mats.mi(Geo.bevel_box(Vector3(5.3, 0.1, 0.14), 0.02), Mats.wood(WOOD_D, 0), self, Vector3(-11.1, UY + 1.0, -3.1))
	Mats.mi(Geo.bevel_box(Vector3(5.3, 0.08, 0.1), 0.02), Mats.wood(WOOD_D, 0), self, Vector3(-11.1, UY + 0.55, -3.1))
	for z in [-9.4, -7.8, -6.2]:
		Mats.mi(Geo.bevel_box(Vector3(0.12, 1.0, 0.12), 0.02), rail, self, Vector3(-7.6, UY + 0.5, z))
	Mats.mi(Geo.bevel_box(Vector3(0.14, 0.1, 6.1), 0.02), Mats.wood(WOOD_D, 2), self, Vector3(-7.6, UY + 1.0, -6.85))
	# лестница
	var step := Geo.bevel_box(Vector3(0.36, 0.08, 1.4), 0.02)
	for i in 7:
		Mats.mi(step, Mats.wood(DECK, 2), self, Vector3(-5.55 - i * 0.32, DY + 0.37 * (i + 1), -3.9))
	for z in [-4.65, -3.15]:
		var s := Mats.mi(Geo.bevel_box(Vector3(3.1, 0.2, 0.08), 0.02), Mats.wood(WOOD, 0), self, Vector3(-6.55, DY + 1.45, z))
		s.rotation.z = -0.86
		var hr := Mats.mi(Geo.bevel_box(Vector3(3.1, 0.07, 0.07), 0.015), rail, self, Vector3(-6.55, DY + 2.35, z))
		hr.rotation.z = -0.86


# ───────── хижина ─────────
func _corrugated(w: float, d: float, waves: int) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var n := waves * 6
	for i in n:
		var x0 := -w / 2 + w * i / n
		var x1 := -w / 2 + w * (i + 1) / n
		var y0 := sin(TAU * waves * i / n) * 0.035
		var y1 := sin(TAU * waves * (i + 1) / n) * 0.035
		Geo.quad(st, Vector3(x0, y0, -d / 2), Vector3(x1, y1, -d / 2), Vector3(x1, y1, d / 2), Vector3(x0, y0, d / 2), Vector3.UP)
	st.index()
	st.generate_normals()
	return st.commit()


func _hut() -> void:
	var x0 := -13.6
	var x1 := -8.4
	var z0 := -9.6
	var z1 := -4.4
	var y0 := UY
	var hh := 3.1
	var cx := (x0 + x1) / 2
	var cz := (z0 + z1) / 2
	Mats.mi(Geo.bevel_box(Vector3(x1 - x0 - 0.1, hh, z1 - z0 - 0.1), 0.02), Mats.paint(Color("#6a8c7e")), self, Vector3(cx, y0 + hh / 2, cz))
	# обшивка внахлёст
	var green_a := Mats.paint(Color("#8fb3a2"), 0)
	var green_b := Mats.paint(Color("#82a796"), 2)
	var board_x := Geo.bevel_box(Vector3(x1 - x0, 0.3, 0.07), 0.02)
	var board_z := Geo.bevel_box(Vector3(0.07, 0.3, z1 - z0), 0.02)
	for k in 10:
		var y := y0 + 0.16 + k * 0.305
		var b1 := Mats.mi(board_x, green_a, self, Vector3(cx, y, z1 + 0.03))
		b1.rotation.x = -0.06
		var b2 := Mats.mi(board_z, green_b, self, Vector3(x1 + 0.03, y, cz))
		b2.rotation.z = 0.06
	var trim := Mats.paint(Color("#e9e2cf"), 1)
	for p in [Vector3(x1 + 0.06, 0, z1 + 0.06), Vector3(x0 + 0.06, 0, z1 + 0.06), Vector3(x1 + 0.06, 0, z0 + 0.06)]:
		Mats.mi(Geo.bevel_box(Vector3(0.16, hh, 0.16), 0.02), trim, self, Vector3(p.x, y0 + hh / 2, p.z))
	# крыша из профнастила
	var roof := Mats.mi(_corrugated(x1 - x0 + 1.0, z1 - z0 + 1.4, 18), Mats.std(Color("#58668a"), 0.45, 0.45, {"cull_mode": BaseMaterial3D.CULL_DISABLED}), self, Vector3(cx, y0 + hh + 0.42, cz + 0.25))
	roof.rotation.x = 0.17
	Mats.mi(Geo.bevel_box(Vector3(x1 - x0 + 1.0, 0.1, 0.12), 0.02), trim, self, Vector3(cx, y0 + hh + 0.02, z1 + 0.93))
	# окна
	_window(Vector3(-11.7, y0 + 1.8, z1 + 0.07), 0.0)
	_window(Vector3(x1 + 0.07, y0 + 1.8, -6.6), PI / 2)
	var l := OmniLight3D.new()
	l.light_color = Color("#ffa04a")
	l.light_energy = 2.2
	l.omni_range = 9.0
	l.position = Vector3(-11.4, y0 + 1.8, z1 + 1.5)
	add_child(l)
	# дверь
	var door := Mats.paint(Color("#6b4a36"), 1)
	for i in 4:
		Mats.mi(Geo.bevel_box(Vector3(0.06, 2.1, 0.24), 0.015), door, self, Vector3(x1 + 0.09, y0 + 1.05, -5.3 + i * 0.25))
	Mats.mi(Geo.sphere(0.05, 8, 5), Mats.std(Color("#c9a24a"), 0.3, 0.9), self, Vector3(x1 + 0.15, y0 + 1.05, -4.95))
	# спасательный круг и фонарь на стене
	_buoy(self, Vector3(x1 + 0.16, y0 + 1.3, -8.6), Vector3(0, 0, PI / 2))
	_lantern(Vector3(x1 + 0.3, y0 + 2.6, -5.9), false)


func _window(pos: Vector3, rot_y: float) -> void:
	var g := Node3D.new()
	g.position = pos
	g.rotation.y = rot_y
	add_child(g)
	var frame := Mats.paint(Color("#efe8d6"), 0)
	Mats.mi(Geo.bevel_box(Vector3(1.6, 0.12, 0.12), 0.02), frame, g, Vector3(0, 0.62, 0.02))
	Mats.mi(Geo.bevel_box(Vector3(1.7, 0.1, 0.22), 0.02), frame, g, Vector3(0, -0.63, 0.06))
	for x in [-0.74, 0.74]:
		Mats.mi(Geo.bevel_box(Vector3(0.12, 1.36, 0.12), 0.02), frame, g, Vector3(x, 0, 0.02))
	Mats.mi(Geo.bevel_box(Vector3(1.4, 1.1, 0.04), 0.0), Mats.glow(Color("#ffad55"), 2.6), g, Vector3(0, 0, -0.01), Vector3.ZERO, false)
	Mats.mi(Geo.bevel_box(Vector3(0.05, 1.1, 0.08), 0.01), frame, g, Vector3(0, 0, 0.02))
	Mats.mi(Geo.bevel_box(Vector3(1.4, 0.05, 0.08), 0.01), frame, g, Vector3(0, 0, 0.02))


func _buoy(parent: Node3D, pos: Vector3, rot: Vector3) -> MeshInstance3D:
	var m := ShaderMaterial.new()
	m.shader = Mats.shader("res://shaders/buoy.gdshader")
	m.set_shader_parameter("noise_tex", Mats.grain)
	var b := Mats.mi(Geo.torus(0.36, 0.11, 24, 10), m, parent, pos, rot)
	# верёвка по кругу
	var pts := PackedVector3Array()
	for i in 33:
		var a := TAU * i / 32
		pts.append(Vector3(cos(a) * 0.36, sin(a * 8) * 0.01 + 0.11, sin(a) * 0.36))
	Mats.mi(Geo.tube(pts, 0.012, 4), Mats.std(Color("#d8cba8"), 0.9), b)
	return b


# ───────── реквизит ─────────
func barrel(parent: Node3D, pos: Vector3, s: float = 1.0) -> Node3D:
	var g := Node3D.new()
	g.position = pos + Vector3(0, 0.5 * s, 0)
	g.scale = Vector3.ONE * s
	g.rotation.y = _rng.randf() * TAU
	parent.add_child(g)
	var prof := PackedVector2Array()
	for i in 9:
		var t := i / 8.0
		prof.append(Vector2(0.36 + 0.07 * sin(t * PI), t - 0.5))
	var stave := Mats.wood(Color("#8a4b26"), 1, {"grain_scale": 1.6})
	Mats.mi(Geo.lathe(prof, 20, true, true), stave, g)
	# стыки клёпок
	for i in 14:
		var a := TAU * i / 14
		var line := Mats.mi(Geo.bevel_box(Vector3(0.012, 0.98, 0.012), 0.0), Mats.std(Color("#3a1e0e"), 0.9), g, Vector3(cos(a) * 0.405, 0, sin(a) * 0.405), Vector3(0, -a, 0), false)
		line.scale = Vector3(1, 1, 1)
	for y in [-0.36, -0.12, 0.12, 0.36]:
		var r := 0.36 + 0.07 * sin((y + 0.5) * PI) + 0.012
		Mats.mi(Geo.torus(r, 0.022, 28, 5), Mats.std(Color("#2c2a28"), 0.45, 0.7), g, Vector3(0, y, 0))
	return g


func crate(parent: Node3D, pos: Vector3, s: float = 0.75, rot: float = 0.0) -> Node3D:
	var g := Node3D.new()
	g.position = pos + Vector3(0, s / 2, 0)
	g.rotation.y = rot
	parent.add_child(g)
	var w := Mats.wood(Color("#c98c55"), 0)
	var wz := Mats.wood(Color("#c98c55"), 2)
	var dark := Mats.wood(Color("#9b6236"), 1)
	Mats.mi(Geo.bevel_box(Vector3(s * 0.94, s * 0.94, s * 0.94), 0.0), Mats.std(Color("#2a1a10")), g)
	for i in 3:
		var y := -s * 0.33 + i * s * 0.33
		Mats.mi(Geo.bevel_box(Vector3(s, s * 0.26, 0.03), 0.01), w, g, Vector3(0, y, s / 2 - 0.015))
		Mats.mi(Geo.bevel_box(Vector3(s, s * 0.26, 0.03), 0.01), w, g, Vector3(0, y, -s / 2 + 0.015))
		Mats.mi(Geo.bevel_box(Vector3(0.03, s * 0.26, s), 0.01), wz, g, Vector3(s / 2 - 0.015, y, 0))
		Mats.mi(Geo.bevel_box(Vector3(0.03, s * 0.26, s), 0.01), wz, g, Vector3(-s / 2 + 0.015, y, 0))
	for x in [-1, 1]:
		for z in [-1, 1]:
			Mats.mi(Geo.bevel_box(Vector3(0.07, s, 0.07), 0.01), dark, g, Vector3(x * (s / 2 - 0.02), 0, z * (s / 2 - 0.02)))
	for i in 4:
		Mats.mi(Geo.bevel_box(Vector3(s, 0.03, s * 0.22), 0.01), w, g, Vector3(0, s / 2 - 0.015, -s * 0.36 + i * s * 0.24))
	return g


func _bucket(pos: Vector3, col: Color) -> void:
	var g := Node3D.new()
	g.position = pos
	add_child(g)
	var prof := PackedVector2Array([Vector2(0.0, 0.0), Vector2(0.17, 0.0), Vector2(0.22, 0.38), Vector2(0.235, 0.4), Vector2(0.2, 0.4), Vector2(0.16, 0.04)])
	Mats.mi(Geo.lathe(prof, 18, false, false), Mats.std(col, 0.5, 0.0, {"cull_mode": BaseMaterial3D.CULL_DISABLED}), g)
	var pts := PackedVector3Array()
	for i in 13:
		var a := PI * i / 12
		pts.append(Vector3(cos(a) * 0.22, 0.4 + sin(a) * 0.22, 0))
	Mats.mi(Geo.tube(pts, 0.01, 4), Mats.std(Color("#888888"), 0.4, 0.8), g)


func _jerrycan(pos: Vector3) -> void:
	var g := Node3D.new()
	g.position = pos
	g.rotation.y = 0.4
	add_child(g)
	var green := Mats.std(Color("#3b7d36"), 0.55)
	Mats.mi(Geo.bevel_box(Vector3(0.36, 0.5, 0.18), 0.04), green, g, Vector3(0, 0.25, 0))
	Mats.mi(Geo.bevel_box(Vector3(0.2, 0.06, 0.06), 0.015), green, g, Vector3(-0.05, 0.54, 0))
	Mats.mi(Geo.cylinder(0.035, 0.035, 0.08, 8), Mats.std(Color("#222222"), 0.5), g, Vector3(0.11, 0.54, 0))


func _coil(pos: Vector3) -> void:
	var pts := PackedVector3Array()
	for i in 120:
		var a := i * 0.32
		var r := 0.18 + i * 0.0018
		pts.append(pos + Vector3(cos(a) * r, 0.03 + (i % 40) * 0.0 + floor(i / 40.0) * 0.045, sin(a) * r))
	Mats.mi(Geo.tube(pts, 0.03, 5), Mats.std(Color("#cbb88f"), 0.95), self)


func _props() -> void:
	barrel(self, Vector3(-9.2, DY, -1.2))
	barrel(self, Vector3(-8.9, DY, -2.2), 0.95)
	barrel(self, Vector3(-10.1, DY, -1.8), 1.05)
	barrel(self, Vector3(-6.4, DY, -8.8))
	barrel(self, Vector3(-5.5, DY, -9.3), 0.9)
	barrel(self, Vector3(-12.6, DY, 1.2))
	var b := barrel(self, Vector3(-12.2, DY, 2.6))
	b.rotation = Vector3(PI / 2, 0.3, 0)
	b.position.y = DY + 0.42
	crate(self, Vector3(-4, DY, 1.2))
	crate(self, Vector3(-4.8, DY, 1.7), 0.7, 0.3)
	crate(self, Vector3(-4.3, DY + 0.75, 1.35), 0.6, 0.1)
	crate(self, Vector3(-3.3, DY, -6.2), 0.7, 0.2)
	crate(self, Vector3(-3.6, DY, -7.2), 0.65)
	crate(self, Vector3(-6.3, DY, 4.4), 0.7, 0.5)
	_bucket(Vector3(-6.9, DY, -0.4), Color("#b7a6d6"))
	_bucket(Vector3(-9.4, DY, 2.6 + 1.2), Color("#d0473a"))
	_jerrycan(Vector3(-5.8, DY, 5.6))
	_coil(Vector3(-3.0, DY, -1.5))
	_coil(Vector3(-11.5, DY, 6.8))
	_tire(self, Vector3(-7.8, DY + 0.15, 2.2), Vector3(-PI / 2, 0, 0))
	_buoy(self, Vector3(-12.2, DY + 0.45, 7.85), Vector3(PI / 2 - 0.25, 0, 0))
	# перевёрнутая лодочка
	var rb := Boat.make_hull(3.4, 0.7, 0.45, Color("#ece4d2"), Color("#8c5b3a"))
	rb.position = Vector3(-12.3, DY + 0.75, 4.6)
	rb.rotation = Vector3(0, 0.15, -1.2)
	add_child(rb)


# ───────── фонари ─────────
func _lantern(pos: Vector3, light: bool) -> Node3D:
	var g := Node3D.new()
	g.position = pos
	add_child(g)
	var metal := Mats.std(Color("#2b2522"), 0.45, 0.7)
	Mats.mi(Geo.bevel_box(Vector3(0.18, 0.24, 0.18), 0.0), Mats.glow(Color("#ffae5c"), 5.0), g, Vector3.ZERO, Vector3.ZERO, false)
	for x in [-1, 1]:
		for z in [-1, 1]:
			Mats.mi(Geo.bevel_box(Vector3(0.025, 0.28, 0.025), 0.0), metal, g, Vector3(x * 0.1, 0, z * 0.1))
	Mats.mi(Geo.cylinder(0.17, 0.02, 0.12, 4, false), metal, g, Vector3(0, 0.19, 0), Vector3(0, PI / 4, 0))
	Mats.mi(Geo.bevel_box(Vector3(0.24, 0.04, 0.24), 0.01), metal, g, Vector3(0, -0.14, 0))
	Mats.mi(Geo.torus(0.05, 0.01, 12, 4), metal, g, Vector3(0, 0.29, 0), Vector3(PI / 2, 0, 0))
	if light:
		var l := OmniLight3D.new()
		l.light_color = Color("#ff9d4d")
		l.light_energy = 1.8
		l.omni_range = 6.5
		l.omni_attenuation = 1.4
		g.add_child(l)
	return g


func _lamp_post(x: float, z: float, y0: float, light: bool) -> void:
	Mats.mi(Geo.bevel_box(Vector3(0.18, 1.5, 0.18), 0.02), Mats.wood(WOOD, 1), self, Vector3(x, y0 + 0.75, z))
	Mats.mi(Geo.bevel_box(Vector3(0.36, 0.06, 0.06), 0.01), Mats.wood(WOOD_D, 0), self, Vector3(x + 0.18, y0 + 1.42, z))
	_lantern(Vector3(x + 0.3, y0 + 1.15, z), light)


func _lamps() -> void:
	_lamp_post(-2.15, -9.8, DY, false)
	_lamp_post(-2.15, -3.2, DY, true)
	_lamp_post(-2.15, 3.4, DY, true)
	_lamp_post(-5.4, 8.15, DY, false)
	_lamp_post(-8.7, 8.15, DY, true)
	_lamp_post(-3.2, -10.4, DY + 0.3, false)
	_lamp_post(-7.65, -3.05, UY, false)
	_lantern(Vector3(-8.2, DY + 1.3, -1.6), false)


# ───────── дно ─────────
func _seabed() -> void:
	var pm := PlaneMesh.new()
	pm.size = Vector2(700, 700)
	var m := ShaderMaterial.new()
	m.shader = Mats.shader("res://shaders/seabed.gdshader")
	m.set_shader_parameter("noise_tex", Mats.grain)
	var bed := Mats.mi(pm, m, self, Vector3(10, -2.8, 0), Vector3.ZERO, false)
	bed.set_meta("caustics", m)
	var rock_mat := Mats.std(Color("#3d4a44"), 0.9)
	var rock_mat2 := Mats.std(Color("#55605a"), 0.85)
	for i in 110:
		var r := _rng.randf_range(0.3, 1.5)
		var mesh := Geo.sphere(1.0, 9, 6)
		var arrays := mesh.surface_get_arrays(0)
		var verts: PackedVector3Array = arrays[Mesh.ARRAY_VERTEX]
		for k in verts.size():
			var v := verts[k]
			var n := sin(v.x * 3.1 + i) * cos(v.z * 2.7 + i * 0.3) * 0.22 + sin(v.y * 4.0 + i) * 0.1
			verts[k] = v * (1.0 + n)
		var st := SurfaceTool.new()
		st.begin(Mesh.PRIMITIVE_TRIANGLES)
		st.set_smooth_group(-1)
		var idx: PackedInt32Array = arrays[Mesh.ARRAY_INDEX]
		for k in idx:
			st.add_vertex(verts[k])
		st.generate_normals()
		var pos := Vector3(_rng.randf_range(-6, 64), -2.75, _rng.randf_range(-48, 64))
		if pos.x < -1 and pos.z < 9:
			pos.x += 8
		var rk := Mats.mi(st.commit(), rock_mat if i % 2 else rock_mat2, self, pos, Vector3(_rng.randf() * 3, _rng.randf() * 3, 0), false)
		rk.scale = Vector3(r, r * 0.6, r * _rng.randf_range(0.7, 1.3))
	# водоросли
	for i in 70:
		var c := Vector3(_rng.randf_range(-1, 40), -2.8, _rng.randf_range(-30, 40))
		if i < 20:
			c = Vector3(_rng.randf_range(-2.5, 0.5), -2.8, _rng.randf_range(-10, 9))
		for k in 4:
			var h := _rng.randf_range(0.8, 2.2)
			var blade := Geo.flat(PackedVector2Array([Vector2(-0.07, 0), Vector2(0.07, 0), Vector2(0.03, h * 0.6), Vector2(0.0, h), Vector2(-0.04, h * 0.6)]))
			var wm := ShaderMaterial.new()
			wm.shader = Mats.shader("res://shaders/weed.gdshader")
			wm.set_shader_parameter("phase", _rng.randf() * TAU)
			wm.set_shader_parameter("col", Color("#2e6b3a").lerp(Color("#7a8a3a"), _rng.randf()))
			Mats.mi(blade, wm, self, c + Vector3(_rng.randf_range(-0.3, 0.3), 0, _rng.randf_range(-0.3, 0.3)), Vector3(0, _rng.randf() * TAU, 0), false)


# ───────── острова на горизонте ─────────
func _island_mesh(radius: float, height: float, seed_v: int, flat_top: float) -> ArrayMesh:
	var prof := PackedVector2Array()
	for i in 9:
		var t := i / 8.0
		var r: float = radius * (1.0 - pow(t, 1.6) * (1.0 - flat_top))
		prof.append(Vector2(r, t * height))
	prof.append(Vector2(0, height))
	var m := Geo.lathe(prof, 22, false, false)
	var arr := m.surface_get_arrays(0)
	var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_smooth_group(-1)
	var idx = arr[Mesh.ARRAY_INDEX]
	var list: PackedInt32Array = idx if idx != null else PackedInt32Array(range(v.size()))
	for k in list:
		var p := v[k]
		var n := sin(p.x * 0.09 + seed_v) * cos(p.z * 0.07 + seed_v * 2.0) * 0.18 + sin(p.y * 0.3 + seed_v) * 0.06
		st.add_vertex(Vector3(p.x * (1.0 + n), p.y * (1.0 + n * 0.6), p.z * (1.0 + n)))
	st.generate_normals()
	return st.commit()


func _islands() -> void:
	var rock := Mats.std(Color("#6f6a5e"), 0.95)
	var grass := Mats.std(Color("#4f7a3c"), 0.9)
	var sand := Mats.std(Color("#d9c49a"), 0.95)
	var spots := [[Vector3(330, -2, -180), 70.0, 34.0, 1], [Vector3(420, -2, 120), 95.0, 52.0, 2], [Vector3(150, -2, -420), 60.0, 26.0, 3], [Vector3(-80, -2, 480), 110.0, 60.0, 4], [Vector3(560, -2, -20), 45.0, 18.0, 5]]
	for sp in spots:
		var c: Vector3 = sp[0]
		var r: float = sp[1]
		var h: float = sp[2]
		Mats.mi(_island_mesh(r, h, sp[3], 0.15), rock, self, c, Vector3.ZERO, false)
		Mats.mi(_island_mesh(r * 0.82, h * 1.04, sp[3] + 7, 0.25), grass, self, c + Vector3(0, h * 0.12, 0), Vector3.ZERO, false)
		Mats.mi(Geo.cylinder(r * 1.12, r * 1.0, 3.0, 24, false), sand, self, c + Vector3(0, 0.6, 0), Vector3.ZERO, false)
		# деревья-конусы
		for i in 8:
			var a: float = i * 2.4 + sp[3]
			var d := r * (0.15 + 0.4 * fmod(i * 0.37, 1.0))
			var tp := c + Vector3(cos(a) * d, h * 0.95 - d * 0.35, sin(a) * d)
			Mats.mi(Geo.cylinder(r * 0.07, 0.0, r * 0.25, 7, false), Mats.std(Color("#2f5a32"), 0.9), self, tp + Vector3(0, r * 0.12, 0), Vector3.ZERO, false)
	# маяк на ближнем острове
	var base: Vector3 = spots[0][0] + Vector3(-20, 30, 15)
	var white := Mats.std(Color("#f2efe6"), 0.6)
	var red := Mats.std(Color("#c8392c"), 0.6)
	for i in 6:
		Mats.mi(Geo.cylinder(3.0 - i * 0.25, 2.75 - i * 0.25, 3.0, 16), red if i % 2 else white, self, base + Vector3(0, 1.5 + i * 3.0, 0), Vector3.ZERO, false)
	Mats.mi(Geo.cylinder(1.6, 1.6, 2.2, 12), Mats.glow(Color("#fff0b0"), 6.0), self, base + Vector3(0, 19.0, 0), Vector3.ZERO, false)
	Mats.mi(Geo.cylinder(2.2, 0.2, 1.6, 12), Mats.std(Color("#2b2b2b"), 0.5, 0.5), self, base + Vector3(0, 20.9, 0), Vector3.ZERO, false)


# ───────── чайки ─────────
func make_gull() -> Node3D:
	var g := Node3D.new()
	var white := Mats.std(Color("#f2f2ee"), 0.8)
	var grey := Mats.std(Color("#a7b0b4"), 0.8)
	var black := Mats.std(Color("#1d1d1f"), 0.8)
	var prof := PackedVector2Array()
	for i in 9:
		var t := i / 8.0
		prof.append(Vector2(sin(t * PI) * 0.15 * (1.0 - t * 0.35), (t - 0.5) * 0.62))
	var body := Mats.mi(Geo.lathe(prof, 12), white, g, Vector3.ZERO, Vector3(0, 0, -PI / 2))
	body.scale = Vector3(1, 1, 0.9)
	Mats.mi(Geo.sphere(0.1, 10, 7), white, g, Vector3(0.3, 0.12, 0))
	Mats.mi(Geo.cylinder(0.03, 0.005, 0.14, 6), Mats.std(Color("#f2b33a"), 0.5), g, Vector3(0.44, 0.11, 0), Vector3(0, 0, -PI / 2))
	for s in [-1, 1]:
		Mats.mi(Geo.sphere(0.018, 6, 4), black, g, Vector3(0.36, 0.15, s * 0.07))
	Mats.mi(Geo.flat(PackedVector2Array([Vector2(0, -0.05), Vector2(-0.22, -0.08), Vector2(-0.24, 0.06), Vector2(0, 0.04)]), 0.01), grey, g, Vector3(-0.28, 0.02, 0), Vector3(PI / 2, 0, 0))
	var wings: Array[Node3D] = []
	for s in [-1, 1]:
		var w := Node3D.new()
		w.position = Vector3(0.0, 0.08, s * 0.08)
		g.add_child(w)
		var shape := PackedVector2Array([Vector2(0.12, 0), Vector2(-0.14, 0), Vector2(-0.22, 0.4), Vector2(-0.12, 0.62), Vector2(0.02, 0.45)])
		var wm := Mats.mi(Geo.flat(shape, 0.015), grey, w, Vector3.ZERO, Vector3(PI / 2 * s, 0, 0))
		var tip := Mats.mi(Geo.flat(PackedVector2Array([Vector2(-0.18, 0.5), Vector2(-0.12, 0.62), Vector2(-0.03, 0.52)]), 0.02), black, w, Vector3.ZERO, wm.rotation)
		tip.position.y = 0.002
		wings.append(w)
	for s in [-1, 1]:
		Mats.mi(Geo.cylinder(0.012, 0.012, 0.16, 4), Mats.std(Color("#e0a050")), g, Vector3(0.02, -0.2, s * 0.05))
	g.set_meta("wings", wings)
	add_child(g)
	return g


func fold_wings(g: Node3D) -> void:
	var w: Array = g.get_meta("wings")
	w[0].rotation.x = -1.35
	w[1].rotation.x = 1.35
	w[0].scale = Vector3(1, 0.5, 1)
	w[1].scale = Vector3(1, 0.5, 1)
