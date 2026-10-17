class_name Fishes
## Каталог рыб и построение их 3D-моделей.

const LIST := [
	{"id": "sprat", "n": "Килька", "v": 6, "d": 0.20, "wt": 40.0, "min": 0.05, "max": 0.15, "vs": 2.4,
		"m": {"len": 0.5, "h": 0.11, "w": 0.07, "top": "#4c7690", "belly": "#e6eef2", "fin": "#a9bcc6", "metal": 0.5}},
	{"id": "roach", "n": "Плотва", "v": 11, "d": 0.30, "wt": 32.0, "min": 0.2, "max": 0.7, "vs": 1.9,
		"m": {"len": 0.7, "h": 0.25, "w": 0.1, "top": "#465f52", "belly": "#ece4cf", "fin": "#d54d36", "hump": 0.25, "metal": 0.45}},
	{"id": "perch", "n": "Окунь", "v": 18, "d": 0.38, "wt": 24.0, "min": 0.3, "max": 1.2, "vs": 1.8,
		"m": {"len": 0.8, "h": 0.28, "w": 0.13, "top": "#56762a", "belly": "#efdc9c", "fin": "#e8682c", "pattern": 1, "pat": "#1f2c16", "freq": 3.2, "spiky": true, "hump": 0.35}},
	{"id": "boot", "n": "Старый сапог", "v": 1, "d": 0.10, "wt": 6.0, "min": 0.4, "max": 0.9, "vs": 1.7, "junk": true, "m": {"kind": "boot"}},
	{"id": "flounder", "n": "Камбала", "v": 28, "d": 0.48, "wt": 15.0, "min": 0.5, "max": 2.5, "vs": 1.6,
		"m": {"kind": "flat", "len": 0.9, "h": 0.1, "w": 0.6, "top": "#836b4c", "belly": "#f2ece0", "fin": "#93795a", "pattern": 3, "pat": "#c26a2e"}},
	{"id": "mackerel", "n": "Скумбрия", "v": 38, "d": 0.58, "wt": 10.0, "min": 0.4, "max": 1.8, "vs": 1.6,
		"m": {"len": 0.95, "h": 0.19, "w": 0.14, "top": "#2a6d8c", "belly": "#e3ebee", "fin": "#6d8fa0", "pattern": 2, "pat": "#10293a", "metal": 0.55, "finlets": true}},
	{"id": "crab", "n": "Краб", "v": 48, "d": 0.62, "wt": 8.0, "min": 0.3, "max": 1.5, "vs": 1.9, "m": {"kind": "crab"}},
	{"id": "squid", "n": "Кальмар", "v": 70, "d": 0.72, "wt": 5.0, "min": 0.5, "max": 3.0, "vs": 1.7, "m": {"kind": "squid"}},
	{"id": "puffer", "n": "Фугу", "v": 110, "d": 0.80, "wt": 3.0, "min": 0.4, "max": 2.0, "vs": 1.9,
		"m": {"len": 0.6, "h": 0.46, "w": 0.44, "top": "#c4ad5e", "belly": "#f6f1dd", "fin": "#d8c27a", "pattern": 3, "pat": "#4d3f1a", "spikes": true, "tail": "round", "round": true}},
	{"id": "tuna", "n": "Тунец", "v": 160, "d": 0.88, "wt": 2.0, "min": 8.0, "max": 40.0, "vs": 1.15,
		"m": {"len": 2.1, "h": 0.55, "w": 0.42, "top": "#1a2f4e", "belly": "#d3dbe2", "fin": "#f2c94c", "tail": "crescent", "metal": 0.6, "finlets": true}},
	{"id": "shark", "n": "Акула", "v": 260, "d": 0.95, "wt": 1.0, "min": 30.0, "max": 120.0, "vs": 0.95,
		"m": {"len": 3.0, "h": 0.6, "w": 0.55, "top": "#66788a", "belly": "#eef1f3", "fin": "#5d6d7c", "tail": "shark", "dorsal": 2.2, "gills": true, "metal": 0.1}},
	{"id": "gold", "n": "Золотая рыбка", "v": 400, "d": 1.0, "wt": 0.5, "min": 0.2, "max": 0.6, "vs": 2.2, "gold": true,
		"m": {"len": 0.55, "h": 0.3, "w": 0.15, "top": "#ff7d0a", "belly": "#ffd86e", "fin": "#ffb02e", "tail": "fancy", "hump": 0.4, "glow": 0.35, "metal": 0.7}},
]


static func by_id(id: String) -> Dictionary:
	for f in LIST:
		if f.id == id:
			return f
	return LIST[0]


static func _body_mat(m: Dictionary) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = Mats.shader("res://shaders/fish.gdshader")
	mat.set_shader_parameter("top_col", Color(m.get("top", "#888888")))
	mat.set_shader_parameter("belly_col", Color(m.get("belly", "#eeeeee")))
	mat.set_shader_parameter("pat_col", Color(m.get("pat", "#222222")))
	mat.set_shader_parameter("pattern", m.get("pattern", 0))
	mat.set_shader_parameter("pat_freq", m.get("freq", 6.0))
	mat.set_shader_parameter("body_len", m.get("len", 1.0))
	mat.set_shader_parameter("body_h", m.get("h", 0.2))
	mat.set_shader_parameter("metal", m.get("metal", 0.25))
	mat.set_shader_parameter("glow", m.get("glow", 0.0))
	mat.set_shader_parameter("noise_tex", Mats.noise)
	return mat


static func _fin_mat(m: Dictionary) -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = Mats.shader("res://shaders/fin.gdshader")
	mat.set_shader_parameter("fin_col", Color(m.get("fin", "#999999")))
	mat.set_shader_parameter("body_len", m.get("len", 1.0))
	mat.set_shader_parameter("glow", m.get("glow", 0.0))
	return mat


## Плоская фигура с «запечённым» преобразованием, чтобы изгиб в шейдере
## считался в координатах тела.
static func _fin(poly: PackedVector2Array, xf: Transform3D = Transform3D.IDENTITY) -> ArrayMesh:
	var base := Geo.flat(poly)
	var arr := base.surface_get_arrays(0)
	var v: PackedVector3Array = arr[Mesh.ARRAY_VERTEX]
	var nr: PackedVector3Array = arr[Mesh.ARRAY_NORMAL]
	for i in v.size():
		v[i] = xf * v[i]
		nr[i] = (xf.basis * nr[i]).normalized()
	arr[Mesh.ARRAY_VERTEX] = v
	arr[Mesh.ARRAY_NORMAL] = nr
	var out := ArrayMesh.new()
	out.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	return out


static func _body(m: Dictionary) -> ArrayMesh:
	var L: float = m.len
	var H: float = m.h * 0.5
	var W: float = m.w * 0.5
	var hump: float = m.get("hump", 0.0)
	var rnd: bool = m.get("round", false)
	var secs := []
	var ns := 24
	var nr := 16
	for i in ns + 1:
		var u := float(i) / ns  # 0 хвост … 1 нос
		var x := -L * 0.5 + u * L
		var f: float
		if rnd:
			f = pow(max(0.0, sin(PI * clamp(u * 0.9 + 0.08, 0.0, 1.0))), 0.55)
		else:
			f = pow(max(0.0, sin(PI * pow(clamp(u * 0.94 + 0.03, 0.0, 1.0), 0.75))), 0.7)
		f = max(f, 0.14 * (1.0 - u)) if u < 0.98 else 0.0
		var ring := []
		for k in nr:
			var a := TAU * k / nr
			var sy := sin(a)
			var hy := H * f * sy * (1.0 + (hump * sin(u * PI) if sy > 0.0 else -0.1))
			ring.append(Vector3(x, hy - (H * 0.08 * u * u if sy < 0.0 else 0.0), W * f * cos(a)))
		secs.append(ring)
	return Geo.loft(secs, true, true)


static func build(f: Dictionary) -> Node3D:
	var m: Dictionary = f.m
	var root := Node3D.new()
	root.set_meta("fish", f)
	var mats: Array = []
	match m.get("kind", "fish"):
		"boot":
			_boot(root)
		"crab":
			_crab(root, mats)
		"squid":
			_squid(root, mats)
		_:
			_fish(root, m, mats)
	root.set_meta("mats", mats)
	set_swim(root, 7.0, 0.07)
	return root


static func set_swim(root: Node3D, speed: float, amp: float) -> void:
	var ph := float(root.get_instance_id() % 997) * 0.37
	for mat in root.get_meta("mats", []):
		mat.set_shader_parameter("swim_speed", speed)
		mat.set_shader_parameter("swim_amp", amp)
		mat.set_shader_parameter("swim_phase", ph)


static func _eyes(root: Node3D, pos: Vector3, r: float, top: bool = false) -> void:
	var white := Mats.std(Color("#f2efe4"), 0.2)
	var black := Mats.std(Color("#0b0b0d"), 0.05, 0.2)
	for s in [-1.0, 1.0]:
		var p := pos
		if top:
			p.z = s * abs(pos.z)
		else:
			p.z = s * pos.z
		Mats.mi(Geo.sphere(r, 10, 7), white, root, p)
		var pupil := p + (Vector3(0, 1, 0) if top else Vector3(0, 0, s)) * r * 0.55
		Mats.mi(Geo.sphere(r * 0.6, 10, 7), black, root, pupil)


static func _fish(root: Node3D, m: Dictionary, mats: Array) -> void:
	var L: float = m.len
	var H: float = m.h * 0.5
	var W: float = m.w * 0.5
	var flatfish: bool = m.get("kind", "") == "flat"
	var bm := _body_mat(m)
	var fm := _fin_mat(m)
	mats.append(bm)
	mats.append(fm)
	var body := Mats.mi(_body(m), bm, root)
	body.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON
	var tx := -L * 0.5 + L * 0.03
	# хвост
	var a := L * 0.26
	var b := H * 1.15
	var tail: PackedVector2Array
	match m.get("tail", "fork"):
		"crescent":
			tail = PackedVector2Array([Vector2(0.02, 0), Vector2(-a * 0.45, b * 1.0), Vector2(-a * 0.85, b * 1.55), Vector2(-a * 0.55, b * 0.5), Vector2(-a * 0.42, 0), Vector2(-a * 0.55, -b * 0.5), Vector2(-a * 0.85, -b * 1.5), Vector2(-a * 0.45, -b * 0.95)])
		"shark":
			tail = PackedVector2Array([Vector2(0.03, 0), Vector2(-a * 0.5, b * 0.9), Vector2(-a * 1.2, b * 2.2), Vector2(-a * 0.75, b * 0.6), Vector2(-a * 0.55, 0), Vector2(-a * 0.62, -b * 0.7), Vector2(-a * 0.35, -b * 0.4)])
		"round":
			tail = PackedVector2Array([Vector2(0.02, 0), Vector2(-a * 0.4, b * 0.7), Vector2(-a * 0.85, b * 0.6), Vector2(-a, 0), Vector2(-a * 0.85, -b * 0.6), Vector2(-a * 0.4, -b * 0.7)])
		"fancy":
			tail = PackedVector2Array([Vector2(0.02, 0), Vector2(-a * 0.7, b * 1.4), Vector2(-a * 1.7, b * 1.6), Vector2(-a * 1.3, b * 0.4), Vector2(-a * 1.05, 0), Vector2(-a * 1.3, -b * 0.4), Vector2(-a * 1.7, -b * 1.6), Vector2(-a * 0.7, -b * 1.4)])
		_:
			tail = PackedVector2Array([Vector2(0.02, 0), Vector2(-a * 0.55, b * 0.75), Vector2(-a, b * 1.15), Vector2(-a * 0.65, b * 0.25), Vector2(-a * 0.55, 0), Vector2(-a * 0.65, -b * 0.25), Vector2(-a, -b * 1.15), Vector2(-a * 0.55, -b * 0.75)])
	var txf := Transform3D(Basis(), Vector3(tx, 0, 0))
	if flatfish:
		txf = Transform3D(Basis(Vector3.RIGHT, PI / 2), Vector3(tx, 0, 0))
	Mats.mi(_fin(tail, txf), fm, root)
	if flatfish:
		# бахрома плавников по краю
		for s in [-1.0, 1.0]:
			var edge := PackedVector2Array([Vector2(-L * 0.42, 0), Vector2(L * 0.38, 0), Vector2(L * 0.2, W * 0.32), Vector2(-L * 0.1, W * 0.38), Vector2(-L * 0.35, W * 0.22)])
			Mats.mi(_fin(edge, Transform3D(Basis(Vector3.RIGHT, -s * PI / 2), Vector3(0, 0, s * W * 0.82))), fm, root)
		_eyes(root, Vector3(L * 0.3, H * 0.85, W * 0.2), max(0.018, W * 0.07), true)
		return
	# спинной плавник
	var dh: float = H * m.get("dorsal", 0.75)
	if m.get("spiky", false):
		var pts := PackedVector2Array([Vector2(-L * 0.3, H * 0.85)])
		for i in 6:
			var x := -L * 0.3 + i * L * 0.09
			pts.append(Vector2(x + L * 0.04, H * 0.95 + dh * (1.0 - i * 0.06)))
			pts.append(Vector2(x + L * 0.09, H * 1.0))
		pts.append(Vector2(L * 0.25, H * 0.9))
		Mats.mi(_fin(pts), fm, root)
	else:
		var x0 := -L * 0.18
		Mats.mi(_fin(PackedVector2Array([Vector2(x0 - L * 0.12, H * 0.82), Vector2(x0 + L * 0.2, H * 0.92), Vector2(x0 + L * 0.06, H * 0.9 + dh * 0.5), Vector2(x0 - L * 0.04, H * 0.9 + dh)])), fm, root)
	# анальный и брюшные
	Mats.mi(_fin(PackedVector2Array([Vector2(-L * 0.3, -H * 0.75), Vector2(-L * 0.08, -H * 0.85), Vector2(-L * 0.24, -H * 0.85 - dh * 0.45)])), fm, root)
	for s in [-1.0, 1.0]:
		var pec := PackedVector2Array([Vector2(0, 0), Vector2(-L * 0.2, H * 0.28), Vector2(-L * 0.26, -H * 0.05), Vector2(-L * 0.14, -H * 0.3)])
		var xf := Transform3D(Basis(Vector3.UP, s * 0.55) * Basis(Vector3.RIGHT, s * 0.35), Vector3(L * 0.2, -H * 0.3, s * W * 0.75))
		Mats.mi(_fin(pec, xf), fm, root)
		var pel := PackedVector2Array([Vector2(0, 0), Vector2(-L * 0.12, -H * 0.1), Vector2(-L * 0.08, -H * 0.4)])
		Mats.mi(_fin(pel, Transform3D(Basis(Vector3.UP, s * 0.3), Vector3(L * 0.02, -H * 0.75, s * W * 0.35))), fm, root)
	if m.get("finlets", false):
		for i in 5:
			var x := -L * 0.33 + i * L * 0.04
			for y in [H * 0.42, -H * 0.42]:
				var sy: float = sign(y)
				Mats.mi(_fin(PackedVector2Array([Vector2(x, y), Vector2(x + L * 0.025, y), Vector2(x - L * 0.01, y + sy * H * 0.22)])), fm, root)
	if m.get("gills", false):
		var gm := Mats.std(Color("#3e4a56"), 0.6)
		for s in [-1.0, 1.0]:
			for i in 5:
				var g := Mats.mi(Geo.bevel_box(Vector3(0.012, H * 0.7, 0.012), 0.0), gm, root, Vector3(L * 0.27 - i * L * 0.025, -H * 0.05, s * W * 0.92))
				g.rotation.x = s * 0.2
	if m.get("spikes", false):
		var cone := Geo.cylinder(0.022, 0.0, 0.1, 5, false)
		for i in 60:
			var y := 1.0 - 2.0 * (i + 0.5) / 60.0
			var r := sqrt(1.0 - y * y)
			var th := i * 2.39996
			var n := Vector3(cos(th) * r, y, sin(th) * r)
			if n.x < -0.7 or n.x > 0.75:
				continue
			var p := Vector3(n.x * L * 0.42, n.y * H * 0.9, n.z * W * 0.9)
			var sp := Mats.mi(cone, Mats.std(Color("#8c7a3c"), 0.6), root, p + n * 0.04)
			sp.basis = Basis(Quaternion(Vector3.UP, n.normalized()))
	# глаза и рот
	_eyes(root, Vector3(L * 0.36, H * 0.22, W * 0.62), max(0.018, H * 0.16))
	Mats.mi(Geo.bevel_box(Vector3(L * 0.06, 0.006, W * 0.5), 0.0), Mats.std(Color("#2a1a1a"), 0.6), root, Vector3(L * 0.47, -H * 0.12, 0), Vector3(0, 0, -0.3))


static func _boot(root: Node3D) -> void:
	var leather := Mats.std(Color("#5a3920"), 0.55)
	var sole := Mats.std(Color("#211812"), 0.8)
	var prof := PackedVector2Array([Vector2(0.14, 0), Vector2(0.15, 0.3), Vector2(0.16, 0.5), Vector2(0.17, 0.55)])
	Mats.mi(Geo.lathe(prof, 14, true, false), Mats.std(Color("#5a3920"), 0.55, 0.0, {"cull_mode": BaseMaterial3D.CULL_DISABLED}), root, Vector3(-0.12, 0.08, 0))
	var foot := Mats.mi(Geo.sphere(0.18, 12, 8), leather, root, Vector3(0.1, 0.1, 0))
	foot.scale = Vector3(1.8, 0.7, 0.85)
	Mats.mi(Geo.bevel_box(Vector3(0.62, 0.05, 0.3), 0.02), sole, root, Vector3(0.03, 0.0, 0))
	for i in 4:
		Mats.mi(Geo.tube(PackedVector3Array([Vector3(0.0 + i * 0.05, 0.2 + i * 0.02, -0.11), Vector3(0.02 + i * 0.05, 0.24 + i * 0.02, 0.0), Vector3(0.0 + i * 0.05, 0.2 + i * 0.02, 0.11)]), 0.008, 4), Mats.std(Color("#d9c9a0")), root)
	# водоросль, прилипшая к сапогу
	Mats.mi(Geo.flat(PackedVector2Array([Vector2(0, 0), Vector2(0.04, 0.0), Vector2(0.1, 0.25), Vector2(0.03, 0.3)]), 0.01), Mats.std(Color("#3d7a3a")), root, Vector3(-0.2, 0.45, 0.1), Vector3(0, 0, 0.8))


static func _crab(root: Node3D, mats: Array) -> void:
	var shell := _body_mat({"top": "#cf4a24", "belly": "#f0b38a", "pattern": 3, "pat": "#8a2a12", "len": 0.6, "h": 0.25, "metal": 0.1})
	mats.append(shell)
	var red := Mats.std(Color("#c8461f"), 0.45)
	var dark := Mats.std(Color("#7d2510"), 0.5)
	var body := Mats.mi(Geo.sphere(0.3, 16, 10), shell, root)
	body.scale = Vector3(1.0, 0.42, 1.3)
	for s in [-1.0, 1.0]:
		for i in 4:
			var x := -0.18 + i * 0.1
			var a := Vector3(x, -0.02, s * 0.33)
			var k := Vector3(x - 0.05 + i * 0.02, 0.12, s * 0.6)
			var e := Vector3(x - 0.1 + i * 0.03, -0.12, s * 0.78)
			Mats.mi(Geo.tube(PackedVector3Array([a, k, e]), 0.025, 6), red, root)
		# клешни
		var arm := [Vector3(0.22, 0.0, s * 0.25), Vector3(0.38, 0.05, s * 0.35), Vector3(0.48, 0.04, s * 0.3)]
		Mats.mi(Geo.tube(PackedVector3Array(arm), 0.04, 6), red, root)
		var claw := Mats.mi(Geo.sphere(0.09, 12, 8), red, root, Vector3(0.56, 0.05, s * 0.28))
		claw.scale = Vector3(1.4, 0.8, 0.9)
		var pincer := Mats.mi(Geo.cylinder(0.035, 0.005, 0.16, 6), dark, root, Vector3(0.68, 0.08, s * 0.25), Vector3(0, 0, -PI / 2 + 0.3))
		pincer.scale = Vector3(1, 1, 0.8)
		Mats.mi(Geo.cylinder(0.03, 0.005, 0.13, 6), dark, root, Vector3(0.66, 0.0, s * 0.27), Vector3(0, 0, -PI / 2 - 0.3))
		Mats.mi(Geo.cylinder(0.012, 0.012, 0.12, 5), red, root, Vector3(0.25, 0.14, s * 0.07))
		Mats.mi(Geo.sphere(0.028, 8, 6), Mats.std(Color("#111111"), 0.1), root, Vector3(0.25, 0.21, s * 0.07))


static func _squid(root: Node3D, mats: Array) -> void:
	var skin := _body_mat({"top": "#e59a8a", "belly": "#f6d6cc", "pattern": 3, "pat": "#b04a4a", "len": 1.0, "h": 0.3, "metal": 0.15})
	mats.append(skin)
	var prof := PackedVector2Array()
	for i in 13:
		var t := i / 12.0
		prof.append(Vector2(0.16 * pow(sin(t * PI * 0.5 + 0.25), 1.0) * (1.0 - t * 0.75) + 0.005, t * 0.85))
	prof[12].x = 0.0
	Mats.mi(Geo.lathe(prof, 14, true, false), skin, root, Vector3(-0.05, 0, 0), Vector3(0, 0, -PI / 2))
	var fm := _fin_mat({"fin": "#e08a7c", "len": 1.0})
	mats.append(fm)
	for s in [-1.0, 1.0]:
		Mats.mi(_fin(PackedVector2Array([Vector2(0.55, 0), Vector2(0.82, 0), Vector2(0.62, 0.22)]), Transform3D(Basis(Vector3.RIGHT, s * PI / 2), Vector3.ZERO)), fm, root)
	var head := Mats.mi(Geo.sphere(0.14, 12, 8), skin, root, Vector3(-0.12, 0, 0))
	head.scale = Vector3(1.1, 0.9, 0.9)
	_eyes(root, Vector3(-0.12, 0.04, 0.12), 0.045)
	var tm := Mats.std(Color("#e8a090"), 0.5)
	for i in 10:
		var a := TAU * i / 10
		var pts := PackedVector3Array()
		var ln := 0.55 if i < 8 else 0.9
		for k in 8:
			var t := k / 7.0
			pts.append(Vector3(-0.22 - t * ln, sin(a) * 0.07 + sin(t * 4.0 + a) * 0.05 * t, cos(a) * 0.07 + cos(t * 3.0 + a) * 0.05 * t))
		Mats.mi(Geo.tube(pts, 0.018, 5), tm, root)
