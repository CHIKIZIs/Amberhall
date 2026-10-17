class_name Fishes
## Каталог рыб (47 видов) и построение их 3D-моделей.
## tier: 0 обычная · 1 необычная · 2 редкая · 3 эпическая · 4 легендарная
## zone: битовая маска — 1 у пирса, 2 залив, 4 открытое море

const TIER_NAMES := ["Обычная", "Необычная", "Редкая", "Эпическая", "Легендарная"]
const TIER_COLORS := ["#c9d3d6", "#7fd66a", "#5fb2ff", "#c27bff", "#ffb84a"]
const TIER_WEIGHT := [30.0, 12.0, 4.5, 1.4, 0.35]
const PIER := 1
const BAY := 2
const SEA := 4

static var LIST: Array = []


static func _s(id: String, n: String, tier: int, zone: int, v: int, wmin: float, wmax: float, m: Dictionary) -> void:
	var len_m: float = m.get("len", 0.6)
	var f := {
		"id": id, "n": n, "tier": tier, "zone": zone, "v": v, "min": wmin, "max": wmax, "m": m,
		"wt": TIER_WEIGHT[tier] * m.get("wt_k", 1.0),
		"d": clampf(0.18 + tier * 0.17 + clampf(wmax / 60.0, 0.0, 0.15), 0.1, 1.0),
		"vs": m.get("vs", clampf(0.95 / len_m + 0.45, 0.9, 2.4)),
		"junk": m.get("junk", false),
	}
	LIST.append(f)


static func init() -> void:
	if not LIST.is_empty():
		return
	# ── у пирса ──
	_s("sprat", "Килька", 0, PIER | BAY, 6, 0.05, 0.15, {"len": 0.5, "h": 0.11, "w": 0.07, "top": "#4c7690", "belly": "#e6eef2", "fin": "#a9bcc6", "metal": 0.55})
	_s("anchovy", "Анчоус", 0, PIER | BAY, 7, 0.03, 0.08, {"len": 0.45, "h": 0.09, "w": 0.06, "top": "#3f6f86", "belly": "#eef3f5", "fin": "#a0b4bc", "pattern": 4, "pat": "#d6e2e6", "metal": 0.6, "peak": 0.6})
	_s("herring", "Сельдь", 0, PIER | BAY, 9, 0.2, 0.6, {"len": 0.7, "h": 0.17, "w": 0.08, "top": "#2f5f7c", "belly": "#eef3f5", "fin": "#8aa4b2", "metal": 0.65})
	_s("smelt", "Корюшка", 0, PIER, 8, 0.05, 0.2, {"len": 0.55, "h": 0.1, "w": 0.07, "top": "#6a8f8a", "belly": "#e9f1ec", "fin": "#a8c4bc", "pattern": 4, "pat": "#b8e0d4", "metal": 0.5})
	_s("goby", "Бычок", 0, PIER, 7, 0.05, 0.3, {"len": 0.45, "h": 0.16, "w": 0.15, "top": "#6b5a3c", "belly": "#d8c9a2", "fin": "#8a7650", "pattern": 3, "pat": "#3a2d1a", "blunt": 0.45, "peak": 0.95, "metal": 0.05})
	_s("scad", "Ставрида", 0, PIER | BAY, 10, 0.1, 0.5, {"len": 0.65, "h": 0.18, "w": 0.09, "top": "#4d7383", "belly": "#e7ecec", "fin": "#d8c46a", "pattern": 4, "pat": "#e8d27a", "metal": 0.6})
	_s("capelin", "Мойва", 0, PIER, 6, 0.03, 0.06, {"len": 0.45, "h": 0.09, "w": 0.06, "top": "#5a7d6a", "belly": "#e9efe8", "fin": "#b4c8b8", "metal": 0.5})
	_s("shrimp", "Креветка", 0, PIER, 9, 0.02, 0.06, {"kind": "lobster", "col": "#e88a6a", "small": true, "len": 0.4})
	_s("boot", "Старый сапог", 0, PIER | BAY, 1, 0.4, 0.9, {"kind": "boot", "junk": true, "wt_k": 0.25, "len": 0.6})
	_s("bottle", "Бутылка с запиской", 0, PIER | BAY | SEA, 15, 0.3, 0.6, {"kind": "bottle", "junk": true, "wt_k": 0.15, "len": 0.5})
	_s("can", "Ржавая банка", 0, PIER, 1, 0.1, 0.3, {"kind": "can", "junk": true, "wt_k": 0.2, "len": 0.3})
	_s("crab", "Краб", 1, PIER | BAY, 48, 0.3, 1.5, {"kind": "crab", "len": 0.7})
	# ── залив ──
	_s("redfish", "Морской окунь", 1, PIER | BAY, 26, 0.4, 1.6, {"len": 0.7, "h": 0.28, "w": 0.13, "top": "#c4442c", "belly": "#f0b090", "fin": "#e0603a", "spiky": true, "hump": 0.3, "metal": 0.2})
	_s("flounder", "Камбала", 1, PIER | BAY, 28, 0.5, 2.5, {"kind": "flat", "len": 0.9, "h": 0.1, "w": 0.6, "top": "#836b4c", "belly": "#f2ece0", "fin": "#93795a", "pattern": 3, "pat": "#c26a2e"})
	_s("mackerel", "Скумбрия", 1, BAY | SEA, 38, 0.4, 1.8, {"len": 0.95, "h": 0.19, "w": 0.14, "top": "#2a6d8c", "belly": "#e3ebee", "fin": "#6d8fa0", "pattern": 2, "pat": "#10293a", "metal": 0.55, "finlets": true})
	_s("mullet", "Кефаль", 1, PIER | BAY, 30, 0.5, 3.0, {"len": 0.8, "h": 0.2, "w": 0.14, "top": "#50636e", "belly": "#e3e7e8", "fin": "#8a9aa2", "pattern": 4, "pat": "#7a8b94", "blunt": 0.55, "metal": 0.45})
	_s("saury", "Сайра", 1, BAY | SEA, 32, 0.1, 0.4, {"len": 0.75, "h": 0.1, "w": 0.07, "top": "#2b4d7a", "belly": "#e8eef4", "fin": "#7a90aa", "bill": 0.08, "peak": 0.55, "metal": 0.6, "finlets": true})
	_s("cod", "Треска", 1, BAY | SEA, 40, 1.0, 12.0, {"len": 1.0, "h": 0.26, "w": 0.18, "top": "#8c7a52", "belly": "#efe9da", "fin": "#8c7a52", "pattern": 3, "pat": "#5a4a2a", "barbels": 1, "blunt": 0.6})
	_s("haddock", "Пикша", 1, BAY | SEA, 36, 0.8, 5.0, {"len": 0.9, "h": 0.24, "w": 0.15, "top": "#5b5f66", "belly": "#e8e8ea", "fin": "#5b5f66", "pattern": 4, "pat": "#26282c", "barbels": 1})
	_s("navaga", "Навага", 1, PIER | BAY, 22, 0.1, 0.5, {"len": 0.5, "h": 0.12, "w": 0.09, "top": "#6f6a50", "belly": "#ece6d0", "fin": "#8a8462", "barbels": 1})
	_s("seabream", "Дорада", 1, BAY, 44, 0.4, 2.5, {"len": 0.6, "h": 0.32, "w": 0.12, "top": "#8c9aa6", "belly": "#eef0f2", "fin": "#7c8a98", "pattern": 4, "pat": "#e8c050", "hump": 0.35, "blunt": 0.55, "metal": 0.55})
	_s("wrasse", "Зеленушка", 1, PIER | BAY, 24, 0.1, 0.6, {"len": 0.5, "h": 0.2, "w": 0.1, "top": "#3e7f4a", "belly": "#c9d98a", "fin": "#5aa060", "pattern": 2, "pat": "#1f4a2a"})
	_s("squid", "Кальмар", 2, BAY | SEA, 70, 0.5, 3.0, {"kind": "squid", "len": 1.0})
	_s("eel", "Угорь", 2, PIER | BAY, 75, 0.5, 3.0, {"len": 1.3, "h": 0.09, "w": 0.08, "top": "#3a3a2a", "belly": "#c9c09a", "fin": "#4a4a34", "eel": true, "peak": 0.5, "blunt": 0.3, "vs": 1.3})
	_s("halibut", "Палтус", 2, BAY | SEA, 90, 3.0, 40.0, {"kind": "flat", "len": 1.6, "h": 0.16, "w": 0.95, "top": "#5a5040", "belly": "#f4f1ea", "fin": "#5a5040", "pattern": 3, "pat": "#3a3226"})
	_s("seabass", "Сибас", 2, PIER | BAY, 80, 1.0, 6.0, {"len": 0.9, "h": 0.25, "w": 0.13, "top": "#5d7280", "belly": "#eef1f2", "fin": "#7a8a94", "spiky": true, "metal": 0.5})
	_s("salmon", "Лосось", 2, BAY | SEA, 110, 2.0, 15.0, {"len": 1.0, "h": 0.25, "w": 0.15, "top": "#3d5568", "belly": "#f2ece6", "fin": "#566a78", "pattern": 3, "pat": "#1a1e24", "metal": 0.5})
	_s("trout", "Радужная форель", 2, PIER | BAY, 85, 0.5, 4.0, {"len": 0.75, "h": 0.2, "w": 0.12, "top": "#5a6e48", "belly": "#f0e8dc", "fin": "#7a8a5a", "pattern": 4, "pat": "#e0708a", "metal": 0.35})
	_s("ray", "Скат", 2, BAY | SEA, 120, 3.0, 25.0, {"kind": "ray", "len": 1.6, "top": "#6a6052", "belly": "#f0ece4"})
	_s("octopus", "Осьминог", 2, BAY | SEA, 115, 1.0, 9.0, {"kind": "octopus", "len": 1.0})
	_s("puffer", "Фугу", 2, BAY, 110, 0.4, 2.0, {"len": 0.6, "h": 0.46, "w": 0.44, "top": "#c4ad5e", "belly": "#f6f1dd", "fin": "#d8c27a", "pattern": 3, "pat": "#4d3f1a", "spikes": true, "tail": "round", "round": true})
	_s("clown", "Рыба-клоун", 2, BAY, 95, 0.05, 0.2, {"len": 0.35, "h": 0.17, "w": 0.08, "top": "#f07a1a", "belly": "#f6a040", "fin": "#f08a2a", "pattern": 1, "pat": "#ffffff", "freq": 1.55, "tail": "round", "blunt": 0.5})
	_s("lobster", "Омар", 2, PIER | BAY, 130, 0.5, 4.0, {"kind": "lobster", "col": "#2e4a7a", "len": 0.9})
	_s("lionfish", "Крылатка", 3, BAY, 170, 0.3, 1.2, {"len": 0.45, "h": 0.24, "w": 0.1, "top": "#b8442e", "belly": "#f2d6c8", "fin": "#d86a4a", "pattern": 1, "pat": "#f6ece2", "freq": 6.0, "lion": true})
	_s("barracuda", "Барракуда", 3, BAY | SEA, 180, 3.0, 25.0, {"len": 1.5, "h": 0.2, "w": 0.15, "top": "#4a5a68", "belly": "#e8ecee", "fin": "#5a6a78", "pattern": 1, "pat": "#2a3440", "freq": 5.0, "jaw": true, "peak": 0.55, "metal": 0.5, "vs": 1.1})
	# ── открытое море ──
	_s("tuna", "Тунец", 3, SEA, 220, 8.0, 60.0, {"len": 2.1, "h": 0.55, "w": 0.42, "top": "#1a2f4e", "belly": "#d3dbe2", "fin": "#f2c94c", "tail": "crescent", "metal": 0.6, "finlets": true, "vs": 1.1})
	_s("mahi", "Махи-махи", 3, SEA, 210, 4.0, 18.0, {"len": 1.4, "h": 0.38, "w": 0.16, "top": "#2a8a5a", "belly": "#f2d23a", "fin": "#2a7aa8", "pattern": 3, "pat": "#1a5a8a", "sail": true, "blunt": 0.85, "peak": 0.95, "tail": "crescent", "metal": 0.45, "vs": 1.1})
	_s("swordfish", "Меч-рыба", 3, SEA, 300, 40.0, 200.0, {"len": 2.4, "h": 0.5, "w": 0.38, "top": "#2c3e5a", "belly": "#c8d0d8", "fin": "#2c3e5a", "bill": 0.38, "tail": "crescent", "dorsal": 1.6, "metal": 0.4, "vs": 0.95})
	_s("sunfish", "Луна-рыба", 3, SEA, 260, 50.0, 400.0, {"len": 1.4, "h": 1.25, "w": 0.32, "top": "#7a8a96", "belly": "#d8dee2", "fin": "#6a7a86", "sunfish": true, "round": true, "blunt": 0.7, "metal": 0.15, "vs": 1.0})
	_s("angler", "Морской чёрт", 3, BAY | SEA, 240, 2.0, 20.0, {"len": 0.85, "h": 0.5, "w": 0.55, "top": "#5a4a3a", "belly": "#8a7a60", "fin": "#6a5a44", "pattern": 3, "pat": "#2e241a", "lure": true, "blunt": 0.9, "peak": 0.9, "jaw": true, "tail": "round", "metal": 0.05})
	_s("moray", "Мурена", 3, BAY, 230, 2.0, 15.0, {"len": 1.6, "h": 0.15, "w": 0.12, "top": "#6a7a2a", "belly": "#b8b050", "fin": "#6a7a2a", "pattern": 3, "pat": "#2a3010", "eel": true, "peak": 0.5, "blunt": 0.35, "jaw": true, "vs": 1.1})
	_s("shark", "Акула", 4, SEA, 450, 30.0, 300.0, {"len": 3.0, "h": 0.6, "w": 0.55, "top": "#66788a", "belly": "#eef1f3", "fin": "#5d6d7c", "tail": "shark", "dorsal": 2.2, "gills": true, "metal": 0.1, "vs": 0.95})
	_s("hammer", "Рыба-молот", 4, SEA, 520, 80.0, 400.0, {"len": 3.0, "h": 0.55, "w": 0.5, "top": "#7c8a7a", "belly": "#eef1ec", "fin": "#6c7a6a", "tail": "shark", "dorsal": 2.4, "gills": true, "hammer": true, "vs": 0.95})
	_s("marlin", "Марлин", 4, SEA, 600, 60.0, 500.0, {"len": 2.8, "h": 0.5, "w": 0.35, "top": "#1d3a6a", "belly": "#d8e0e8", "fin": "#2a5aa0", "pattern": 1, "pat": "#6aa0e0", "freq": 4.0, "bill": 0.45, "sail": true, "tail": "crescent", "metal": 0.5, "vs": 0.95})
	_s("coelacanth", "Целакант", 4, SEA, 700, 30.0, 90.0, {"len": 1.6, "h": 0.45, "w": 0.32, "top": "#3a4a6a", "belly": "#5a6a8a", "fin": "#3a4a6a", "pattern": 3, "pat": "#e8eef4", "lobed": true, "tail": "round", "blunt": 0.6, "vs": 1.1})
	_s("gold", "Золотая рыбка", 4, PIER | BAY | SEA, 900, 0.2, 0.6, {"len": 0.55, "h": 0.3, "w": 0.15, "top": "#ff7d0a", "belly": "#ffd86e", "fin": "#ffb02e", "tail": "fancy", "hump": 0.4, "glow": 0.35, "metal": 0.7, "wt_k": 0.6})
	_s("chest", "Сундук с сокровищами", 4, BAY | SEA, 1500, 8.0, 25.0, {"kind": "chest", "junk": true, "wt_k": 0.5, "len": 0.8})


static func by_id(id: String) -> Dictionary:
	for f in LIST:
		if f.id == id:
			return f
	return LIST[0]


# ───────── материалы ─────────
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


## Тело рыбы — лофт эллиптических сечений от хвоста (u=0) к носу (u=1).
static func _profile(m: Dictionary, u: float) -> float:
	if m.get("round", false):
		return pow(max(0.0, sin(PI * clampf(u * 0.9 + 0.08, 0.0, 1.0))), 0.55)
	var peak: float = m.get("peak", 0.75)
	var blunt: float = m.get("blunt", 0.7)
	return pow(max(0.0, sin(PI * pow(clampf(u * 0.94 + 0.03, 0.0, 1.0), peak))), blunt)


static func _body(m: Dictionary) -> ArrayMesh:
	var L: float = m.len
	var H: float = m.h * 0.5
	var W: float = m.w * 0.5
	var hump: float = m.get("hump", 0.0)
	var secs := []
	var ns := 28
	var nr := 18
	for i in ns + 1:
		var u := float(i) / ns
		var x := -L * 0.5 + u * L
		var f := _profile(m, u)
		f = max(f, 0.14 * (1.0 - u)) if u < 0.985 else 0.0
		var ring := []
		for k in nr:
			var a := TAU * k / nr
			var sy := sin(a)
			var hy := H * f * sy * (1.0 + (hump * sin(u * PI) if sy > 0.0 else -0.1))
			ring.append(Vector3(x, hy - (H * 0.08 * u * u if sy < 0.0 else 0.0), W * f * cos(a)))
		secs.append(ring)
	return Geo.loft(secs, true, true)


# ───────── сборка ─────────
static func build(f: Dictionary) -> Node3D:
	var m: Dictionary = f.m
	var root := Node3D.new()
	root.set_meta("fish", f)
	var mats: Array = []
	match m.get("kind", "fish"):
		"boot":
			_boot(root)
		"bottle":
			_bottle(root)
		"can":
			_can(root)
		"chest":
			_chest(root)
		"crab":
			_crab(root, mats)
		"squid":
			_squid(root, mats)
		"octopus":
			_octopus(root, mats)
		"lobster":
			_lobster(root, m)
		"ray":
			_ray(root, m, mats)
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
	var white := Mats.std(Color("#f2efe4"), 0.15)
	var iris := Mats.std(Color("#b88a2a"), 0.2, 0.3)
	var black := Mats.std(Color("#060608"), 0.03, 0.2)
	for s in [-1.0, 1.0]:
		var p := pos
		p.z = s * abs(pos.z)
		Mats.mi(Geo.sphere(r, 12, 8), white, root, p)
		var out := (Vector3(0, 1, 0) if top else Vector3(0, 0, s))
		Mats.mi(Geo.sphere(r * 0.72, 12, 8), iris, root, p + out * r * 0.38)
		Mats.mi(Geo.sphere(r * 0.45, 10, 7), black, root, p + out * r * 0.66)


static func _fish(root: Node3D, m: Dictionary, mats: Array) -> void:
	var L: float = m.len
	var H: float = m.h * 0.5
	var W: float = m.w * 0.5
	var flatfish: bool = m.get("kind", "") == "flat"
	var bm := _body_mat(m)
	var fm := _fin_mat(m)
	mats.append(bm)
	mats.append(fm)
	Mats.mi(_body(m), bm, root)
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
	if m.get("sunfish", false):
		tail = PackedVector2Array([Vector2(0.05, H * 0.6), Vector2(-a * 0.25, H * 0.5), Vector2(-a * 0.35, 0), Vector2(-a * 0.25, -H * 0.5), Vector2(0.05, -H * 0.6)])
	var txf := Transform3D(Basis(), Vector3(tx, 0, 0))
	if flatfish:
		txf = Transform3D(Basis(Vector3.RIGHT, PI / 2), Vector3(tx, 0, 0))
	if not m.get("eel", false):
		Mats.mi(_fin(tail, txf), fm, root)
	if flatfish:
		for s in [-1.0, 1.0]:
			var edge := PackedVector2Array([Vector2(-L * 0.42, 0), Vector2(L * 0.38, 0), Vector2(L * 0.2, W * 0.32), Vector2(-L * 0.1, W * 0.38), Vector2(-L * 0.35, W * 0.22)])
			Mats.mi(_fin(edge, Transform3D(Basis(Vector3.RIGHT, -s * PI / 2), Vector3(0, 0, s * W * 0.82))), fm, root)
		_eyes(root, Vector3(L * 0.3, H * 0.85, W * 0.2), max(0.018, W * 0.07), true)
		return
	var dh: float = H * m.get("dorsal", 0.75)
	if m.get("eel", false):
		# сплошной плавник вдоль спины и брюха
		var top := PackedVector2Array()
		var bot := PackedVector2Array()
		for i in 13:
			var u := i / 12.0
			var x := -L * 0.5 + u * L * 0.72
			top.append(Vector2(x, H * _profile(m, u * 0.72 + 0.01) * 0.95))
			bot.append(Vector2(x, -H * _profile(m, u * 0.72 + 0.01) * 0.95))
		for i in range(12, -1, -1):
			var u := i / 12.0
			var x := -L * 0.5 + u * L * 0.72
			top.append(Vector2(x, H * _profile(m, u * 0.72 + 0.01) + H * 0.55 * (1.0 - u * 0.3)))
			bot.append(Vector2(x, -H * _profile(m, u * 0.72 + 0.01) - H * 0.4 * (1.0 - u * 0.5)))
		Mats.mi(_fin(top), fm, root)
		Mats.mi(_fin(bot), fm, root)
	elif m.get("spiky", false) or m.get("lion", false):
		var pts := PackedVector2Array([Vector2(-L * 0.3, H * 0.85)])
		var tall := 2.6 if m.get("lion", false) else 1.0
		for i in 7:
			var x := -L * 0.3 + i * L * 0.08
			pts.append(Vector2(x + L * 0.04, H * 0.95 + dh * tall * (1.0 - i * 0.05)))
			pts.append(Vector2(x + L * 0.08, H * 1.0))
		pts.append(Vector2(L * 0.28, H * 0.9))
		Mats.mi(_fin(pts), fm, root)
	elif m.get("sail", false):
		var sail := PackedVector2Array([Vector2(-L * 0.38, H * 0.7), Vector2(L * 0.3, H * 0.85), Vector2(L * 0.22, H * 2.4), Vector2(0.0, H * 2.2), Vector2(-L * 0.25, H * 1.4)])
		Mats.mi(_fin(sail), fm, root)
	elif m.get("sunfish", false):
		Mats.mi(_fin(PackedVector2Array([Vector2(-L * 0.3, H * 0.6), Vector2(-L * 0.05, H * 0.62), Vector2(-L * 0.22, H * 1.75)])), fm, root)
	else:
		var x0 := -L * 0.18
		Mats.mi(_fin(PackedVector2Array([Vector2(x0 - L * 0.12, H * 0.82), Vector2(x0 + L * 0.2, H * 0.92), Vector2(x0 + L * 0.06, H * 0.9 + dh * 0.5), Vector2(x0 - L * 0.04, H * 0.9 + dh)])), fm, root)
	if not m.get("eel", false):
		var an := 1.75 if m.get("sunfish", false) else 0.85
		Mats.mi(_fin(PackedVector2Array([Vector2(-L * 0.3, -H * 0.75), Vector2(-L * 0.08, -H * 0.85), Vector2(-L * 0.24, -H * an - dh * 0.45)])), fm, root)
	for s in [-1.0, 1.0]:
		var span := 2.4 if m.get("lion", false) else 1.0
		var pec := PackedVector2Array([Vector2(0, 0), Vector2(-L * 0.2 * span, H * 0.28 * span), Vector2(-L * 0.26 * span, -H * 0.05), Vector2(-L * 0.14 * span, -H * 0.3 * span)])
		var xf := Transform3D(Basis(Vector3.UP, s * 0.55) * Basis(Vector3.RIGHT, s * 0.35), Vector3(L * 0.2, -H * 0.3, s * W * 0.75))
		Mats.mi(_fin(pec, xf), fm, root)
		if not m.get("eel", false):
			var pel := PackedVector2Array([Vector2(0, 0), Vector2(-L * 0.12, -H * 0.1), Vector2(-L * 0.08, -H * 0.4)])
			Mats.mi(_fin(pel, Transform3D(Basis(Vector3.UP, s * 0.3), Vector3(L * 0.02, -H * 0.75, s * W * 0.35))), fm, root)
		if m.get("lobed", false):
			var lobe := Mats.mi(Geo.sphere(H * 0.35, 10, 7), bm, root, Vector3(L * 0.1, -H * 0.55, s * W * 0.7))
			lobe.scale = Vector3(1.6, 0.6, 0.5)
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
	if m.has("bill"):
		var bl: float = m.bill * L
		Mats.mi(Geo.cylinder(H * 0.12, 0.004, bl, 8), Mats.std(Color(m.top).darkened(0.2), 0.35, 0.2), root, Vector3(L * 0.48 + bl * 0.5, H * 0.05, 0), Vector3(0, 0, -PI / 2))
	if m.get("hammer", false):
		var hm := Mats.mi(Geo.bevel_box(Vector3(L * 0.07, H * 0.32, W * 3.4), 0.03), bm, root, Vector3(L * 0.45, H * 0.05, 0))
		hm.name = "hammer"
		for s in [-1.0, 1.0]:
			Mats.mi(Geo.sphere(H * 0.07, 8, 6), Mats.std(Color("#0a0a0a"), 0.1), root, Vector3(L * 0.45, H * 0.05, s * W * 1.72))
	if m.get("barbels", 0) > 0:
		var bmat := Mats.std(Color(m.belly).darkened(0.25), 0.6)
		for s in [-1.0, 0.0, 1.0]:
			var p0 := Vector3(L * 0.44, -H * 0.4, s * W * 0.2)
			Mats.mi(Geo.tube(PackedVector3Array([p0, p0 + Vector3(-L * 0.02, -H * 0.4, s * W * 0.2), p0 + Vector3(-L * 0.05, -H * 0.7, s * W * 0.3)]), H * 0.03, 4), bmat, root)
	if m.get("lure", false):
		var stalk := PackedVector3Array([Vector3(L * 0.3, H * 0.85, 0), Vector3(L * 0.42, H * 1.6, 0), Vector3(L * 0.62, H * 1.7, 0), Vector3(L * 0.7, H * 1.35, 0)])
		Mats.mi(Geo.tube(stalk, H * 0.04, 5), Mats.std(Color(m.fin), 0.6), root)
		Mats.mi(Geo.sphere(H * 0.14, 10, 7), Mats.glow(Color("#9ff7ff"), 6.0), root, Vector3(L * 0.7, H * 1.3, 0))
		var teeth := Mats.std(Color("#f2efe0"), 0.3)
		for i in 7:
			var z := -W * 0.6 + i * W * 0.2
			Mats.mi(Geo.cylinder(H * 0.03, 0.0, H * 0.22, 4), teeth, root, Vector3(L * 0.47, -H * 0.1, z), Vector3(0, 0, PI))
	if m.get("jaw", false) and not m.get("lure", false):
		Mats.mi(Geo.bevel_box(Vector3(L * 0.12, H * 0.14, W * 0.7), 0.01), bm, root, Vector3(L * 0.5, -H * 0.3, 0), Vector3(0, 0, 0.15))
	# глаза и рот
	_eyes(root, Vector3(L * 0.36, H * 0.22, W * 0.62), max(0.016, H * 0.16) * (0.6 if m.get("eel", false) else 1.0))
	Mats.mi(Geo.bevel_box(Vector3(L * 0.06, 0.006, W * 0.5), 0.0), Mats.std(Color("#2a1a1a"), 0.6), root, Vector3(L * 0.47, -H * 0.12, 0), Vector3(0, 0, -0.3))


static func _ray(root: Node3D, m: Dictionary, mats: Array) -> void:
	var bm := _body_mat({"top": m.top, "belly": m.belly, "pattern": 3, "pat": "#3a3226", "len": 1.0, "h": 0.12, "metal": 0.1})
	mats.append(bm)
	var secs := []
	for i in 21:
		var u := i / 20.0
		var x := 0.5 - u * 1.0
		var half: float = sin(PI * clampf(u * 1.1, 0.0, 1.0)) * 0.65 * (1.0 - u * 0.25)
		var ring := []
		for k in 14:
			var a := TAU * k / 14
			ring.append(Vector3(x, sin(a) * 0.07 * max(0.15, 1.0 - abs(cos(a))) * (1.0 - u * 0.5), cos(a) * max(half, 0.02)))
		secs.append(ring)
	Mats.mi(Geo.loft(secs, true, true), bm, root)
	var tail := PackedVector3Array()
	for i in 9:
		var t := i / 8.0
		tail.append(Vector3(-0.5 - t * 0.9, sin(t * 3.0) * 0.03, 0))
	Mats.mi(Geo.tube(tail, 0.025, 5), Mats.std(Color(m.top), 0.5), root)
	_eyes(root, Vector3(0.28, 0.06, 0.1), 0.03, true)


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
	Mats.mi(Geo.flat(PackedVector2Array([Vector2(0, 0), Vector2(0.04, 0.0), Vector2(0.1, 0.25), Vector2(0.03, 0.3)]), 0.01), Mats.std(Color("#3d7a3a")), root, Vector3(-0.2, 0.45, 0.1), Vector3(0, 0, 0.8))


static func _bottle(root: Node3D) -> void:
	var prof := PackedVector2Array([Vector2(0, -0.22), Vector2(0.09, -0.22), Vector2(0.1, -0.18), Vector2(0.1, 0.08), Vector2(0.07, 0.14), Vector2(0.035, 0.18), Vector2(0.035, 0.3), Vector2(0, 0.3)])
	var glass := Mats.std(Color(0.25, 0.55, 0.32, 0.55), 0.05, 0.1, {"transparency": BaseMaterial3D.TRANSPARENCY_ALPHA})
	var b := Mats.mi(Geo.lathe(prof, 18), glass, root, Vector3.ZERO, Vector3(0, 0, -PI / 2))
	b.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	Mats.mi(Geo.cylinder(0.03, 0.032, 0.06, 10), Mats.wood(Color("#b98a5a"), 1), root, Vector3(0.3, 0, 0), Vector3(0, 0, -PI / 2))
	var note := Mats.mi(Geo.cylinder(0.045, 0.045, 0.18, 12), Mats.std(Color("#efe2bf"), 0.9), root, Vector3(-0.02, 0, 0), Vector3(0, 0, -PI / 2))
	note.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	Mats.mi(Geo.torus(0.047, 0.006, 16, 4), Mats.std(Color("#b03a2a"), 0.5), root, Vector3(-0.02, 0, 0), Vector3(0, 0, PI / 2))


static func _can(root: Node3D) -> void:
	var c := Mats.mi(Geo.cylinder(0.09, 0.09, 0.22, 16), Mats.std(Color("#8a5a3a"), 0.6, 0.6), root, Vector3.ZERO, Vector3(0, 0, PI / 2 - 0.2))
	c.scale = Vector3(1.0, 1.0, 0.85)
	Mats.mi(Geo.cylinder(0.092, 0.092, 0.12, 16), Mats.std(Color("#c84a3a"), 0.7, 0.1), root, Vector3.ZERO, Vector3(0, 0, PI / 2 - 0.2))
	Mats.mi(Geo.cylinder(0.02, 0.02, 0.02, 6), Mats.std(Color("#3a6a3a"), 0.8), root, Vector3(0.1, 0.06, 0.04))


static func _chest(root: Node3D) -> void:
	var wood := Mats.wood(Color("#7a4a26"), 0)
	var metal := Mats.std(Color("#c9a24a"), 0.3, 0.9)
	Mats.mi(Geo.bevel_box(Vector3(0.7, 0.36, 0.44), 0.02), wood, root, Vector3(0, 0, 0))
	var lid := Node3D.new()
	lid.position = Vector3(0, 0.18, -0.22)
	lid.rotation.x = -0.55
	root.add_child(lid)
	var arc := Mats.mi(Geo.cylinder(0.22, 0.22, 0.7, 14), wood, lid, Vector3(0, 0, 0.22), Vector3(0, 0, PI / 2))
	arc.scale = Vector3(1, 1, 0.7)
	for x in [-0.3, 0.0, 0.3]:
		Mats.mi(Geo.bevel_box(Vector3(0.04, 0.38, 0.46), 0.01), metal, root, Vector3(x, 0, 0))
	Mats.mi(Geo.bevel_box(Vector3(0.1, 0.12, 0.04), 0.01), metal, root, Vector3(0, 0.08, 0.23))
	var gold := Mats.std(Color("#ffcc3a"), 0.25, 1.0, {"emission_enabled": true, "emission": Color("#ff9a10"), "emission_energy_multiplier": 0.6})
	var rng := RandomNumberGenerator.new()
	rng.seed = 3
	for i in 26:
		var c := Mats.mi(Geo.cylinder(0.04, 0.04, 0.012, 10), gold, root, Vector3(rng.randf_range(-0.3, 0.3), 0.18 + rng.randf() * 0.07, rng.randf_range(-0.18, 0.18)))
		c.rotation = Vector3(rng.randf() * 0.8, 0, rng.randf() * 0.8)
	var gem := Mats.std(Color("#ff3a6a"), 0.1, 0.3, {"emission_enabled": true, "emission": Color("#ff2050"), "emission_energy_multiplier": 1.2})
	Mats.mi(Geo.sphere(0.05, 8, 6), gem, root, Vector3(0.1, 0.25, 0.05))


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
			Mats.mi(Geo.tube(PackedVector3Array([Vector3(x, -0.02, s * 0.33), Vector3(x - 0.05 + i * 0.02, 0.12, s * 0.6), Vector3(x - 0.1 + i * 0.03, -0.12, s * 0.78)]), 0.025, 6), red, root)
		Mats.mi(Geo.tube(PackedVector3Array([Vector3(0.22, 0.0, s * 0.25), Vector3(0.38, 0.05, s * 0.35), Vector3(0.48, 0.04, s * 0.3)]), 0.04, 6), red, root)
		var claw := Mats.mi(Geo.sphere(0.09, 12, 8), red, root, Vector3(0.56, 0.05, s * 0.28))
		claw.scale = Vector3(1.4, 0.8, 0.9)
		Mats.mi(Geo.cylinder(0.035, 0.005, 0.16, 6), dark, root, Vector3(0.68, 0.08, s * 0.25), Vector3(0, 0, -PI / 2 + 0.3))
		Mats.mi(Geo.cylinder(0.03, 0.005, 0.13, 6), dark, root, Vector3(0.66, 0.0, s * 0.27), Vector3(0, 0, -PI / 2 - 0.3))
		Mats.mi(Geo.cylinder(0.012, 0.012, 0.12, 5), red, root, Vector3(0.25, 0.14, s * 0.07))
		Mats.mi(Geo.sphere(0.028, 8, 6), Mats.std(Color("#111111"), 0.1), root, Vector3(0.25, 0.21, s * 0.07))


static func _lobster(root: Node3D, m: Dictionary) -> void:
	var col := Color(m.col)
	var shell := Mats.std(col, 0.35, 0.1)
	var dark := Mats.std(col.darkened(0.35), 0.4)
	var k := 0.45 if m.get("small", false) else 1.0
	var segs := 7
	for i in segs:
		var t := float(i) / segs
		var r := (0.11 - t * 0.05) * k
		var seg := Mats.mi(Geo.sphere(r, 12, 8), shell if i % 2 == 0 else dark, root, Vector3((0.35 - t * 0.75) * k, sin(t * 2.0) * 0.04 * k, 0))
		seg.scale = Vector3(1.3, 0.85, 1.0)
	var tail := PackedVector2Array([Vector2(0, 0), Vector2(-0.12, 0.1), Vector2(-0.16, 0), Vector2(-0.12, -0.1)])
	Mats.mi(Geo.flat(tail, 0.01), shell, root, Vector3(-0.42 * k, 0.05 * k, 0), Vector3(PI / 2, 0, 0)).scale = Vector3.ONE * k
	for s in [-1.0, 1.0]:
		for i in 4:
			var x := (0.2 - i * 0.08) * k
			Mats.mi(Geo.tube(PackedVector3Array([Vector3(x, -0.03 * k, s * 0.06 * k), Vector3(x, 0.02 * k, s * 0.18 * k), Vector3(x - 0.03 * k, -0.08 * k, s * 0.25 * k)]), 0.012 * k, 4), dark, root)
		Mats.mi(Geo.tube(PackedVector3Array([Vector3(0.45 * k, 0.04 * k, s * 0.03 * k), Vector3(0.75 * k, 0.15 * k, s * 0.2 * k), Vector3(1.0 * k, 0.05 * k, s * 0.35 * k)]), 0.006, 4), dark, root)
		if not m.get("small", false):
			Mats.mi(Geo.tube(PackedVector3Array([Vector3(0.38, 0, s * 0.08), Vector3(0.5, 0.02, s * 0.2), Vector3(0.62, 0.0, s * 0.22)]), 0.03, 6), shell, root)
			var claw := Mats.mi(Geo.sphere(0.08, 12, 8), shell, root, Vector3(0.74, 0.0, s * 0.22))
			claw.scale = Vector3(1.8, 0.7, 1.0)
		Mats.mi(Geo.sphere(0.022 * k, 8, 6), Mats.std(Color("#0a0a0a"), 0.1), root, Vector3(0.44 * k, 0.07 * k, s * 0.05 * k))


static func _squid(root: Node3D, mats: Array) -> void:
	var skin := _body_mat({"top": "#e59a8a", "belly": "#f6d6cc", "pattern": 3, "pat": "#b04a4a", "len": 1.0, "h": 0.3, "metal": 0.15})
	mats.append(skin)
	var prof := PackedVector2Array()
	for i in 13:
		var t := i / 12.0
		prof.append(Vector2(0.16 * sin(t * PI * 0.5 + 0.25) * (1.0 - t * 0.75) + 0.005, t * 0.85))
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


static func _octopus(root: Node3D, mats: Array) -> void:
	var skin := _body_mat({"top": "#b0503a", "belly": "#e8a088", "pattern": 3, "pat": "#6a2416", "len": 0.6, "h": 0.5, "metal": 0.1})
	mats.append(skin)
	var head := Mats.mi(Geo.sphere(0.25, 18, 12), skin, root, Vector3(-0.1, 0.18, 0))
	head.scale = Vector3(1.25, 1.0, 0.95)
	_eyes(root, Vector3(0.1, 0.12, 0.14), 0.045)
	var arm := Mats.std(Color("#c06048"), 0.45)
	var suck := Mats.std(Color("#f2c8b4"), 0.5)
	for i in 8:
		var a := TAU * i / 8 + 0.2
		var pts := PackedVector3Array()
		for k in 12:
			var t := k / 11.0
			var r := 0.12 + t * 0.7
			var curl := sin(t * 5.0 + i) * 0.25 * t
			pts.append(Vector3(cos(a + curl) * r + 0.05, -0.02 - t * 0.06 + sin(t * 6.0 + i) * 0.05, sin(a + curl) * r))
		var tb := Geo.tube(pts, 0.04, 6)
		Mats.mi(tb, arm, root)
		for k in range(2, 10, 2):
			Mats.mi(Geo.sphere(0.018, 6, 4), suck, root, pts[k] + Vector3(0, -0.03, 0))


# ───────── цвет класса редкости ─────────
static func tier_color(f: Dictionary) -> Color:
	return Color(TIER_COLORS[f.tier])
