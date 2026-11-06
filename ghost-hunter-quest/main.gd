extends Node3D
## Призраки Эмберхолла: VR-охота на привидений для Meta Quest 3 (Godot 4 + OpenXR).
## Вся игра собирается кодом в этом файле: особняк, призраки, инструменты, интерфейс и звуки.
## Без шлема (на ПК) игра запускается в обычном окне: WASD, мышь, F, E, ЛКМ.

const CS := 1.5          # размер клетки карты, м
const WALL_H := 3.0
const DAWN := 540.0      # 9 минут до рассвета
const MR_R := 2.5        # радиус полёта призраков в смешанной реальности, м
const SR := 22050        # частота синтеза звуков
const BG := Color(0.02, 0.016, 0.03)

# # стена, W шкаф, T стол, B кровать, C свеча, G призрак, P старт
const MAP := [
	"########################",
	"#C.....#.....#........C#",
	"#..W...#..T..#...B.....#",
	"#......#.....#.........#",
	"#..G........G.....G....#",
	"#......#.....#.........#",
	"###.####.....######.####",
	"#......###.###.........#",
	"#..G...#.....#....T....#",
	"#......#..P..#.........#",
	"#..T.......C........G..#",
	"#......#.....#.........#",
	"#####.##.....###.#######",
	"#C.....#.....#.........#",
	"#...W......G......T...C#",
	"#......#.....#.........#",
	"########################",
]

const GHOST_TYPES := [
	{"name": "Шептун", "color": Color(0.66, 0.93, 1.0), "speed": 0.8, "flee": 1.7, "charge": 0.0, "stun_need": 1.3, "scare": 16.0, "aggro": 0.10, "blink": false},
	{"name": "Злыдень", "color": Color(1.0, 0.56, 0.56), "speed": 1.0, "flee": 0.0, "charge": 2.0, "stun_need": 0.9, "scare": 26.0, "aggro": 0.17, "blink": false},
	{"name": "Тень", "color": Color(0.78, 0.67, 1.0), "speed": 1.2, "flee": 2.6, "charge": 0.0, "stun_need": 1.8, "scare": 12.0, "aggro": 0.08, "blink": true},
]
const LED_COLORS := [Color("3dff6a"), Color("9dff3d"), Color("ffe23d"), Color("ff9a3d"), Color("ff3d3d")]
const BEEP_GAP := [0.0, 1.3, 0.9, 0.55, 0.3, 0.15]

class Ghost:
	var type: Dictionary
	var node: Node3D
	var mat: ShaderMaterial
	var eye_mat: StandardMaterial3D
	var mouth: MeshInstance3D
	var mouth_mat: StandardMaterial3D
	var glow_mat: StandardMaterial3D
	var snd: AudioStreamPlayer3D
	var state := "wander"
	var target := Vector3.ZERO
	var state_t := 0.0
	var reveal := 0.0
	var exposure := 0.0
	var stun := 0.0
	var cap := 0.0
	var captured := false
	var cap_anim := 0.0
	var phase := 0.0
	var whisper_t := 0.0
	var scare_cd := 3.0
	var dormant := false   # в смешанной реальности призраки приходят волнами

class Biquad:
	var b0 := 0.0
	var b1 := 0.0
	var b2 := 0.0
	var a1 := 0.0
	var a2 := 0.0
	var x1 := 0.0
	var x2 := 0.0
	var y1 := 0.0
	var y2 := 0.0
	func _coef(kind: String, f: float, q: float) -> void:
		var w := TAU * f / 22050.0
		var al := sin(w) / (2.0 * q)
		var c := cos(w)
		var a0 := 1.0 + al
		match kind:
			"bp":
				b0 = al / a0; b1 = 0.0; b2 = -al / a0
			"lp":
				b0 = (1.0 - c) / 2.0 / a0; b1 = (1.0 - c) / a0; b2 = b0
			"hp":
				b0 = (1.0 + c) / 2.0 / a0; b1 = -(1.0 + c) / a0; b2 = b0
		a1 = -2.0 * c / a0; a2 = (1.0 - al) / a0
	func bp(f: float, q: float) -> Biquad:
		_coef("bp", f, q); return self
	func lp(f: float, q := 0.707) -> Biquad:
		_coef("lp", f, q); return self
	func hp(f: float, q := 0.707) -> Biquad:
		_coef("hp", f, q); return self
	func run(x: float) -> float:
		var y := b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
		x2 = x1; x1 = x; y2 = y1; y1 = y
		return y

# ───────── Карта
var rows := 0
var cols := 0
var floor_cells: Array[Vector2i] = []
var ghost_cells: Array[Vector2i] = []
var candle_cells: Array[Vector2i] = []
var wall_cells: Array[Vector2i] = []
var start_cell := Vector2i(1, 1)

# ───────── Узлы
var xr: XRInterface
var vr := false
var mr := false
var mr_supported := false
var origin: XROrigin3D
var cam: XRCamera3D
var left: XRController3D
var right: XRController3D
var env: Environment
var house: Node3D
var flash_tool: Node3D
var spot: SpotLight3D
var cone: MeshInstance3D
var lens_mat: StandardMaterial3D
var trap_tool: Node3D
var muzzle: Node3D
var beam_pivot: Node3D
var beam_mat: StandardMaterial3D
var ring_mat: StandardMaterial3D
var led_mats: Array[StandardMaterial3D] = []
var wrist: Node3D
var wrist_label: Label3D
var toast: Label3D
var menu: Label3D
var vignette_mat: ShaderMaterial
var dim_sphere: MeshInstance3D
var dim_mat: ShaderMaterial
var ghost_mesh: ArrayMesh
var ghost_shader: Shader
var glow_tex: Texture2D
var candles: Array[Dictionary] = []
var ghosts: Array[Ghost] = []
var sfx := {}
var sfx_players: Array[AudioStreamPlayer] = []
var sfx_i := 0
var hum: AudioStreamPlayer
var ambient: AudioStreamPlayer

# ───────── Состояние
var state := "menu"   # menu | play | over
var t := 0.0
var game_time := 0.0
var fear := 0.0
var battery := 1.0
var flash_on := true
var caught := 0
var total := 0
var beaming := false
var beep_t := 0.0
var heart_t := 0.0
var noise_t := 0.0
var clap_cd := 0.0
var flash_fx := 0.0
var hud_t := 0.0
var hint := 0
var toast_t := 0.0
var snap_latch := false
var yaw := 0.0
var pitch := 0.0
var want_flash := false
var want_clap := false
var test_beam := false    # для автотеста
var last_level := 0


func _ready() -> void:
	randomize()
	_parse_map()
	_init_xr()
	_build_env()
	_build_rig()
	_build_house()
	_build_tools()
	_build_overlays()
	_build_ghost_assets()
	_build_audio()
	origin.position = _cell_center(start_cell)
	_show_menu("")
	if "--selftest" in OS.get_cmdline_user_args():
		_selftest()
	elif "--shot" in OS.get_cmdline_user_args():
		_shots()


# ═════════ Карта и геометрия
func _parse_map() -> void:
	rows = MAP.size()
	cols = MAP[0].length()
	for r in rows:
		for c in cols:
			var ch: String = MAP[r][c]
			var v := Vector2i(c, r)
			if ch == "#": wall_cells.append(v)
			if not "#WTB".contains(ch): floor_cells.append(v)
			if ch == "P": start_cell = v
			if ch == "G": ghost_cells.append(v)
			if ch == "C": candle_cells.append(v)

func _cell_center(v: Vector2i) -> Vector3:
	return Vector3((v.x + 0.5) * CS, 0.0, (v.y + 0.5) * CS)

func _cell_at(x: float, z: float) -> String:
	var c := floori(x / CS)
	var r := floori(z / CS)
	if r < 0 or r >= rows or c < 0 or c >= cols: return "#"
	return MAP[r][c]

func _is_wall(x: float, z: float) -> bool:
	return _cell_at(x, z) == "#"

func _is_solid(x: float, z: float) -> bool:
	return "#WTB".contains(_cell_at(x, z))

func _collides(x: float, z: float, r := 0.25) -> bool:
	return _is_solid(x - r, z - r) or _is_solid(x + r, z - r) or _is_solid(x - r, z + r) or _is_solid(x + r, z + r)

func _wall_between(a: Vector3, b: Vector3) -> bool:
	if mr: return false
	var dx := b.x - a.x
	var dz := b.z - a.z
	var n := ceili(sqrt(dx * dx + dz * dz) / 0.15)
	for i in range(1, n):
		if _is_wall(a.x + dx * i / n, a.z + dz * i / n): return true
	return false

func _random_point() -> Vector3:
	if mr:
		var a := randf() * TAU
		var r := sqrt(randf()) * MR_R
		return Vector3(cos(a) * r, 1.45, sin(a) * r)
	return _cell_center(floor_cells.pick_random()) + Vector3(0, 1.45, 0)


# ═════════ XR
func _init_xr() -> void:
	xr = XRServer.find_interface("OpenXR")
	if xr and xr.is_initialized():
		vr = true
		get_viewport().use_xr = true
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
		xr.session_begun.connect(_on_session_begun)

func _on_session_begun() -> void:
	# Quest 3 умеет 90 Гц
	var rates: Array = xr.get_available_display_refresh_rates()
	if 90.0 in rates: xr.display_refresh_rate = 90.0
	mr_supported = XRInterface.XR_ENV_BLEND_MODE_ALPHA_BLEND in xr.get_supported_environment_blend_modes()
	if state != "play": _show_menu("")

func _set_mr(on: bool) -> void:
	mr = on
	house.visible = not on
	dim_sphere.visible = on
	env.fog_enabled = not on
	get_viewport().transparent_bg = on
	env.background_color = Color(0, 0, 0, 0) if on else BG
	if vr:
		xr.environment_blend_mode = XRInterface.XR_ENV_BLEND_MODE_ALPHA_BLEND if on else XRInterface.XR_ENV_BLEND_MODE_OPAQUE


# ═════════ Построение сцены
func _build_env() -> void:
	env = Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = BG
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.34, 0.38, 0.58)
	env.ambient_light_energy = 0.22
	env.fog_enabled = true
	env.fog_light_color = BG
	env.fog_density = 0.07
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)

func _build_rig() -> void:
	origin = XROrigin3D.new()
	add_child(origin)
	cam = XRCamera3D.new()
	cam.near = 0.05
	cam.far = 60.0
	origin.add_child(cam)
	cam.current = true
	left = XRController3D.new()
	left.tracker = &"left_hand"
	left.pose = &"grip"
	origin.add_child(left)
	right = XRController3D.new()
	right.tracker = &"right_hand"
	right.pose = &"grip"
	origin.add_child(right)
	left.button_pressed.connect(_on_left_pressed)
	right.button_pressed.connect(_on_right_pressed)
	if not vr: cam.position = Vector3(0, 1.6, 0)

func _img_tex(img: Image) -> ImageTexture:
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)

func _mat(tex: Texture2D, color := Color.WHITE) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex
	m.albedo_color = color
	m.roughness = 1.0
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	return m

func _unshaded(color: Color, add := false) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = color
	if color.a < 1.0 or add:
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	if add:
		m.blend_mode = BaseMaterial3D.BLEND_MODE_ADD
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
	return m

func _wall_texture() -> ImageTexture:
	var w := 128
	var h := 256
	var img := Image.create(w, h, false, Image.FORMAT_RGBA8)
	img.fill(Color8(74, 38, 48))
	var low := int(h * 0.7)
	for x in range(0, w, 16): img.fill_rect(Rect2i(x, 0, 7, low), Color8(82, 44, 54))
	for y in range(10, low - 10, 24):
		for x in range((y / 24) % 2 * 16 + 8, w, 32):
			for k in 5:
				img.fill_rect(Rect2i(x - k, y - 6 + k, 1 + 2 * k, 1), Color8(104, 62, 64))
				img.fill_rect(Rect2i(x - k, y + 6 - k, 1 + 2 * k, 1), Color8(104, 62, 64))
	img.fill_rect(Rect2i(0, low, w, h - low), Color8(42, 26, 18))
	img.fill_rect(Rect2i(0, low, w, 5), Color8(74, 48, 32))
	for x in range(0, w, 32):
		img.fill_rect(Rect2i(x + 4, low + 12, 24, 2), Color8(24, 15, 10))
		img.fill_rect(Rect2i(x + 4, h - 10, 24, 2), Color8(24, 15, 10))
		img.fill_rect(Rect2i(x + 4, low + 12, 2, h - low - 20), Color8(24, 15, 10))
		img.fill_rect(Rect2i(x + 26, low + 12, 2, h - low - 20), Color8(24, 15, 10))
	for i in 4000:
		var px := randi() % w
		var py := randi() % h
		img.set_pixel(px, py, img.get_pixel(px, py).darkened(randf_range(0.05, 0.3)))
	return _img_tex(img)

func _floor_texture() -> ImageTexture:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	for y in range(0, 128, 16):
		img.fill_rect(Rect2i(0, y, 128, 16), Color.from_hsv(0.07, 0.45, randf_range(0.13, 0.2)))
		img.fill_rect(Rect2i(0, y, 128, 1), Color(0, 0, 0))
		img.fill_rect(Rect2i(randi() % 128, y, 1, 16), Color(0, 0, 0))
	for i in 3000:
		var px := randi() % 128
		var py := randi() % 128
		img.set_pixel(px, py, img.get_pixel(px, py).darkened(randf_range(0.05, 0.25)))
	return _img_tex(img)

func _plain_texture(base: Color, streaks: int) -> ImageTexture:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	img.fill(base)
	for i in streaks: img.fill_rect(Rect2i(0, randi() % 64, 64, 1 + randi() % 2), base.darkened(randf_range(0.1, 0.4)))
	return _img_tex(img)

func _quad(st: SurfaceTool, a: Vector3, b: Vector3, n: Vector3) -> void:
	var up := Vector3(0, WALL_H, 0)
	var verts := [a, b, b + up, a, b + up, a + up]
	var uvs := [Vector2(0, 1), Vector2(1, 1), Vector2(1, 0), Vector2(0, 1), Vector2(1, 0), Vector2(0, 0)]
	for i in 6:
		st.set_normal(n)
		st.set_uv(uvs[i])
		st.add_vertex(verts[i])

func _box(size: Vector3, pos: Vector3, mat: Material, parent: Node3D) -> MeshInstance3D:
	var m := BoxMesh.new()
	m.size = size
	var mi := MeshInstance3D.new()
	mi.mesh = m
	mi.material_override = mat
	mi.position = pos
	parent.add_child(mi)
	return mi

func _cyl(top: float, bottom: float, h: float, mat: Material, parent: Node3D, z: float) -> MeshInstance3D:
	# Цилиндр вдоль оси Z (как инструменты в руке: «вперёд» — это -Z)
	var m := CylinderMesh.new()
	m.top_radius = top
	m.bottom_radius = bottom
	m.height = h
	m.radial_segments = 16
	var mi := MeshInstance3D.new()
	mi.mesh = m
	mi.material_override = mat
	mi.rotation.x = PI / 2
	mi.position.z = z
	parent.add_child(mi)
	return mi

func _build_house() -> void:
	house = Node3D.new()
	add_child(house)
	var wall_mat := _mat(_wall_texture())
	wall_mat.cull_mode = BaseMaterial3D.CULL_DISABLED
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var is_wall_cell := func(c: int, r: int) -> bool:
		return r < 0 or r >= rows or c < 0 or c >= cols or MAP[r][c] == "#"
	for w in wall_cells:
		var x0 := w.x * CS
		var z0 := w.y * CS
		var x1 := x0 + CS
		var z1 := z0 + CS
		if not is_wall_cell.call(w.x, w.y - 1): _quad(st, Vector3(x1, 0, z0), Vector3(x0, 0, z0), Vector3(0, 0, -1))
		if not is_wall_cell.call(w.x, w.y + 1): _quad(st, Vector3(x0, 0, z1), Vector3(x1, 0, z1), Vector3(0, 0, 1))
		if not is_wall_cell.call(w.x - 1, w.y): _quad(st, Vector3(x0, 0, z0), Vector3(x0, 0, z1), Vector3(-1, 0, 0))
		if not is_wall_cell.call(w.x + 1, w.y): _quad(st, Vector3(x1, 0, z1), Vector3(x1, 0, z0), Vector3(1, 0, 0))
	var walls := MeshInstance3D.new()
	walls.mesh = st.commit()
	walls.material_override = wall_mat
	house.add_child(walls)

	var size := Vector2(cols * CS, rows * CS)
	var floor_mat := _mat(_floor_texture())
	floor_mat.uv1_scale = Vector3(size.x / 2.0, size.y / 2.0, 1)
	var fm := PlaneMesh.new()
	fm.size = size
	var fl := MeshInstance3D.new()
	fl.mesh = fm
	fl.material_override = floor_mat
	fl.position = Vector3(size.x / 2, 0, size.y / 2)
	house.add_child(fl)
	var cm := PlaneMesh.new()
	cm.size = size
	cm.flip_faces = true
	var ce := MeshInstance3D.new()
	ce.mesh = cm
	ce.material_override = _mat(_plain_texture(Color8(29, 26, 31), 6))
	ce.position = Vector3(size.x / 2, WALL_H, size.y / 2)
	house.add_child(ce)

	var wood := _mat(_plain_texture(Color8(58, 36, 22), 24))
	var cloth := _mat(null, Color8(140, 131, 120))
	for r in rows:
		for c in cols:
			var ch: String = MAP[r][c]
			var p := _cell_center(Vector2i(c, r))
			match ch:
				"T":
					_box(Vector3(1.25, 0.06, 0.85), p + Vector3(0, 0.76, 0), wood, house)
					for sx in [-1, 1]:
						for sz in [-1, 1]:
							_box(Vector3(0.06, 0.73, 0.06), p + Vector3(sx * 0.55, 0.365, sz * 0.36), wood, house)
					_box(Vector3(0.18, 0.05, 0.24), p + Vector3(0.2, 0.81, -0.1), _mat(null, Color8(90, 31, 31)), house)
				"W":
					_box(Vector3(1.3, 2.2, 0.7), p + Vector3(0, 1.1, 0), wood, house)
					_box(Vector3(0.02, 1.9, 0.02), p + Vector3(0, 1.1, 0.36), _mat(null, Color8(12, 8, 6)), house)
				"B":
					_box(Vector3(1.3, 0.45, 1.45), p + Vector3(0, 0.225, 0), wood, house)
					_box(Vector3(1.24, 0.14, 1.1), p + Vector3(0, 0.5, 0.14), cloth, house)
					_box(Vector3(0.9, 0.12, 0.3), p + Vector3(0, 0.55, -0.5), cloth, house)
					_box(Vector3(1.3, 1.1, 0.08), p + Vector3(0, 0.55, -0.7), wood, house)

	# Свечи
	var flame_tex := _radial_tex(Color(1, 0.94, 0.78), Color(1, 0.35, 0, 0))
	for v in candle_cells:
		var p := _cell_center(v)
		var stand := CylinderMesh.new()
		stand.top_radius = 0.05
		stand.bottom_radius = 0.12
		stand.height = 1.0
		var smi := MeshInstance3D.new()
		smi.mesh = stand
		smi.material_override = _mat(null, Color8(42, 36, 32))
		smi.position = p + Vector3(0, 0.5, 0)
		house.add_child(smi)
		var wax := CylinderMesh.new()
		wax.top_radius = 0.03
		wax.bottom_radius = 0.03
		wax.height = 0.16
		var wmi := MeshInstance3D.new()
		wmi.mesh = wax
		wmi.material_override = _mat(null, Color8(232, 220, 192))
		wmi.position = p + Vector3(0, 1.08, 0)
		house.add_child(wmi)
		var flame := MeshInstance3D.new()
		var q := QuadMesh.new()
		q.size = Vector2(0.12, 0.2)
		flame.mesh = q
		var fmat := _unshaded(Color.WHITE, true)
		fmat.albedo_texture = flame_tex
		fmat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
		flame.material_override = fmat
		flame.position = p + Vector3(0, 1.22, 0)
		house.add_child(flame)
		var light := OmniLight3D.new()
		light.light_color = Color(1, 0.6, 0.25)
		light.light_energy = 1.6
		light.omni_range = 7.0
		light.omni_attenuation = 1.5
		light.position = p + Vector3(0, 1.3, 0)
		house.add_child(light)
		candles.append({"pos": p + Vector3(0, 1.2, 0), "flame": flame, "light": light, "out": 0.0, "seed": randf() * 100.0})

func _radial_tex(inner: Color, outer: Color) -> GradientTexture2D:
	var g := Gradient.new()
	g.set_color(0, inner)
	g.set_color(1, outer)
	g.add_point(0.35, Color(inner.r, inner.g, inner.b, 0.4))
	var tex := GradientTexture2D.new()
	tex.gradient = g
	tex.fill = GradientTexture2D.FILL_RADIAL
	tex.fill_from = Vector2(0.5, 0.5)
	tex.fill_to = Vector2(0.5, 0.0)
	tex.width = 64
	tex.height = 64
	return tex

func _build_tools() -> void:
	var metal := _mat(null, Color8(52, 52, 58))
	# Фонарь
	flash_tool = Node3D.new()
	_cyl(0.022, 0.022, 0.2, metal, flash_tool, -0.02)
	_cyl(0.036, 0.026, 0.06, metal, flash_tool, -0.14)
	lens_mat = _unshaded(Color(1, 0.95, 0.82))
	_cyl(0.032, 0.032, 0.006, lens_mat, flash_tool, -0.172)
	spot = SpotLight3D.new()
	spot.light_color = Color(1, 0.94, 0.82)
	spot.light_energy = 8.0
	spot.spot_range = 18.0
	spot.spot_angle = 21.0
	spot.spot_attenuation = 1.2
	spot.spot_angle_attenuation = 0.6
	spot.position.z = -0.17
	flash_tool.add_child(spot)
	var cone_len := 5.0
	var cm := CylinderMesh.new()
	cm.top_radius = 0.0
	cm.bottom_radius = tan(deg_to_rad(20.0)) * cone_len
	cm.height = cone_len
	cm.cap_top = false
	cm.cap_bottom = false
	cone = MeshInstance3D.new()
	cone.mesh = cm
	var cs := Shader.new()
	cs.code = """shader_type spatial;
render_mode unshaded, blend_add, cull_disabled, depth_draw_never;
uniform float strength = 0.045;
void fragment() { ALBEDO = vec3(1.0, 0.95, 0.82); ALPHA = strength * UV.y * UV.y; }"""
	var cmat := ShaderMaterial.new()
	cmat.shader = cs
	cone.material_override = cmat
	cone.rotation.x = PI / 2   # вершина конуса (+Y) у линзы, раструб вперёд (-Z)
	cone.position.z = -0.17 - cone_len / 2
	flash_tool.add_child(cone)

	# Ловушка с детектором
	trap_tool = Node3D.new()
	_box(Vector3(0.075, 0.08, 0.22), Vector3(0, 0, -0.03), _mat(null, Color8(59, 66, 54)), trap_tool)
	_box(Vector3(0.035, 0.11, 0.05), Vector3(0, -0.075, 0.04), metal, trap_tool).rotation.x = 0.35
	ring_mat = _unshaded(Color8(31, 85, 96))
	_cyl(0.052, 0.045, 0.04, ring_mat, trap_tool, -0.155)
	muzzle = Node3D.new()
	muzzle.position.z = -0.18
	trap_tool.add_child(muzzle)
	for i in 5:
		var m := _unshaded(Color(0.07, 0.07, 0.07))
		led_mats.append(m)
		_box(Vector3(0.016, 0.012, 0.016), Vector3(0, 0.046, 0.05 - i * 0.028), m, trap_tool)
	beam_pivot = Node3D.new()
	beam_pivot.visible = false
	muzzle.add_child(beam_pivot)
	var bm := CylinderMesh.new()
	bm.top_radius = 0.09
	bm.bottom_radius = 0.012
	bm.height = 1.0
	bm.cap_top = false
	bm.cap_bottom = false
	var beam := MeshInstance3D.new()
	beam.mesh = bm
	beam_mat = _unshaded(Color(0.5, 0.89, 1.0, 0.5), true)
	beam.material_override = beam_mat
	beam.rotation.x = -PI / 2  # широкий конец (+Y) — вперёд (-Z)
	beam.position.z = -0.5
	beam_pivot.add_child(beam)

	# Табличка на запястье
	wrist = Node3D.new()
	var bg := MeshInstance3D.new()
	var bq := QuadMesh.new()
	bq.size = Vector2(0.17, 0.09)
	bg.mesh = bq
	bg.material_override = _unshaded(Color(0.03, 0.02, 0.06, 0.85))
	wrist.add_child(bg)
	wrist_label = Label3D.new()
	wrist_label.font_size = 30
	wrist_label.pixel_size = 0.00045
	wrist_label.outline_size = 0
	wrist_label.position = Vector3(-0.078, 0, 0.001)
	wrist_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	wrist_label.width = 360
	wrist.add_child(wrist_label)
	_attach_tools()

func _attach_tools() -> void:
	if vr:
		left.add_child(flash_tool)
		right.add_child(trap_tool)
		flash_tool.add_child(wrist)
		wrist.position = Vector3(0, 0.06, 0.03)
		wrist.rotation = Vector3(-0.9, 0, 0)
	else:
		cam.add_child(flash_tool)
		flash_tool.position = Vector3(-0.26, -0.27, -0.6)
		flash_tool.rotation = Vector3(0.045, 0.04, 0)
		cam.add_child(trap_tool)
		trap_tool.position = Vector3(0.26, -0.28, -0.62)
		trap_tool.rotation = Vector3(0.045, -0.04, 0)
		cam.add_child(wrist)
		wrist.position = Vector3(-0.5, 0.26, -0.7)
		wrist.scale = Vector3(2.2, 2.2, 2.2)

func _build_overlays() -> void:
	toast = Label3D.new()
	toast.font_size = 40
	toast.pixel_size = 0.0011
	toast.outline_size = 10
	toast.outline_modulate = Color(0, 0, 0, 1)
	toast.no_depth_test = true
	toast.render_priority = 20
	toast.outline_render_priority = 19
	toast.width = 950
	toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	toast.position = Vector3(0, 0.14, -1.2)
	toast.visible = false
	cam.add_child(toast)

	menu = Label3D.new()
	menu.font_size = 44
	menu.pixel_size = 0.0012
	menu.outline_size = 10
	menu.outline_modulate = Color(0, 0, 0, 1)
	menu.modulate = Color(0.93, 0.9, 0.97)
	menu.no_depth_test = true
	menu.render_priority = 20
	menu.outline_render_priority = 19
	menu.width = 1100
	menu.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	menu.position = Vector3(0, -0.05, -1.6)
	cam.add_child(menu)

	# Виньетка страха и затемнение, если голова ушла в стену: экранный прямоугольник в каждом глазу
	var vs := Shader.new()
	vs.code = """shader_type spatial;
render_mode unshaded, depth_test_disabled, depth_draw_never, cull_disabled, fog_disabled, blend_mix;
uniform float fear = 0.0;
uniform float flash = 0.0;
uniform float black = 0.0;
void vertex() { POSITION = vec4(VERTEX.xy, 0.5, 1.0); }
void fragment() {
	float r = length((UV - 0.5) * 2.0);
	float a = clamp(smoothstep(0.35, 1.25, r) * (fear * 0.95 + flash * 0.7), 0.0, 1.0);
	vec3 col = mix(vec3(0.19, 0.0, 0.0), vec3(0.7, 0.0, 0.0), flash);
	ALBEDO = mix(col, vec3(0.0), black);
	ALPHA = max(a, black);
}"""
	vignette_mat = ShaderMaterial.new()
	vignette_mat.shader = vs
	vignette_mat.render_priority = 100
	var vq := QuadMesh.new()
	vq.size = Vector2(2, 2)
	var vmi := MeshInstance3D.new()
	vmi.mesh = vq
	vmi.material_override = vignette_mat
	vmi.extra_cull_margin = 16384.0
	vmi.position.z = -0.2
	cam.add_child(vmi)

	# Смешанная реальность: тёмная сфера вокруг головы, прозрачная в луче фонаря
	var ds := Shader.new()
	ds.code = """shader_type spatial;
render_mode unshaded, cull_disabled, depth_draw_never, fog_disabled, blend_mix;
uniform vec3 f_pos;
uniform vec3 f_dir = vec3(0.0, 0.0, -1.0);
uniform float on = 1.0;
uniform float dim = 0.82;
varying vec3 wpos;
void vertex() { wpos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	float c = dot(normalize(wpos - f_pos), f_dir);
	float lit = on * smoothstep(0.91, 0.955, c);
	ALBEDO = vec3(0.02, 0.015, 0.03);
	ALPHA = dim * (1.0 - lit * 0.95);
}"""
	dim_mat = ShaderMaterial.new()
	dim_mat.shader = ds
	dim_mat.render_priority = -10
	var sm := SphereMesh.new()
	sm.radius = 12.0
	sm.height = 24.0
	sm.flip_faces = true
	dim_sphere = MeshInstance3D.new()
	dim_sphere.mesh = sm
	dim_sphere.material_override = dim_mat
	dim_sphere.extra_cull_margin = 16384.0
	dim_sphere.visible = false
	add_child(dim_sphere)

func _build_ghost_assets() -> void:
	var prof := [Vector2(0.34, 0), Vector2(0.33, 0.15), Vector2(0.3, 0.35), Vector2(0.27, 0.55), Vector2(0.26, 0.7),
		Vector2(0.25, 0.8), Vector2(0.22, 0.9), Vector2(0.16, 0.97), Vector2(0.08, 1.0), Vector2(0.0, 1.01)]
	var norms: Array[Vector2] = []
	for j in prof.size():
		var a: Vector2 = prof[maxi(j - 1, 0)]
		var b: Vector2 = prof[mini(j + 1, prof.size() - 1)]
		var tg := b - a
		norms.append(Vector2(tg.y, -tg.x).normalized())
	var seg := 24
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in seg:
		var a0 := TAU * i / seg
		var a1 := TAU * (i + 1) / seg
		for j in prof.size() - 1:
			var quad := [[a0, j], [a0, j + 1], [a1, j + 1], [a0, j], [a1, j + 1], [a1, j]]
			for q in quad:
				var ang: float = q[0]
				var p: Vector2 = prof[q[1]]
				var n: Vector2 = norms[q[1]]
				st.set_normal(Vector3(cos(ang) * n.x, n.y, sin(ang) * n.x))
				st.add_vertex(Vector3(cos(ang) * p.x, p.y, sin(ang) * p.x))
	ghost_mesh = st.commit()
	ghost_shader = Shader.new()
	ghost_shader.code = """shader_type spatial;
render_mode unshaded, blend_mix, depth_draw_never, cull_disabled, fog_disabled;
uniform vec3 color : source_color = vec3(0.66, 0.92, 1.0);
uniform float opacity = 0.0;
uniform float phase = 0.0;
void vertex() {
	if (VERTEX.y < 0.35) {
		float k = 1.0 - VERTEX.y / 0.35;
		float a = atan(VERTEX.z, VERTEX.x);
		VERTEX.y += sin(a * 6.0 + TIME * 3.5 + phase) * 0.06 * k;
	}
}
void fragment() {
	float rim = 1.0 - abs(dot(normalize(NORMAL), normalize(VIEW)));
	ALBEDO = color * (0.65 + rim * 0.8);
	ALPHA = (0.3 + pow(rim, 2.0) * 0.9) * opacity;
}"""
	glow_tex = _radial_tex(Color(1, 1, 1, 1), Color(1, 1, 1, 0))


# ═════════ Звук: всё синтезируется при запуске, файлов нет
func _wav(buf: PackedFloat32Array, loop := false) -> AudioStreamWAV:
	var data := PackedByteArray()
	data.resize(buf.size() * 2)
	for i in buf.size():
		data.encode_s16(i * 2, int(clampf(buf[i], -1.0, 1.0) * 32000.0))
	var s := AudioStreamWAV.new()
	s.format = AudioStreamWAV.FORMAT_16_BITS
	s.mix_rate = SR
	s.stereo = false
	s.data = data
	if loop:
		s.loop_mode = AudioStreamWAV.LOOP_FORWARD
		s.loop_begin = 0
		s.loop_end = buf.size()
	return s

func _norm(buf: PackedFloat32Array, peak: float) -> PackedFloat32Array:
	var m := 0.0
	for v in buf: m = maxf(m, absf(v))
	if m > 0.0:
		var k := peak / m
		for i in buf.size(): buf[i] *= k
	return buf

func _buf(d: float) -> PackedFloat32Array:
	var b := PackedFloat32Array()
	b.resize(int(d * SR))
	return b

func _nz() -> float:
	return randf() * 2.0 - 1.0

func _syn_whisper() -> AudioStreamWAV:
	var b := _buf(1.6)
	var n := b.size()
	var f1 := Biquad.new()
	var f2 := Biquad.new()
	var syl := randf_range(5.0, 9.0)
	var c1: Array[float] = []
	var c2: Array[float] = []
	for i in 25:
		c1.append(randf_range(500, 1200))
		c2.append(randf_range(1600, 3000))
	for i in n:
		var x := float(i) / n
		if i % 128 == 0:
			var k := x * 24.0
			var a := int(k)
			f1.bp(lerpf(c1[a], c1[a + 1], k - a), 6.0)
			f2.bp(lerpf(c2[a], c2[a + 1], k - a), 9.0)
		var s := _nz()
		b[i] = (f1.run(s) + f2.run(s)) * pow(maxf(0.0, sin(x * PI * syl)), 1.5) * sin(x * PI)
	return _wav(_norm(b, 0.8))

func _syn_scream() -> AudioStreamWAV:
	var b := _buf(1.0)
	var n := b.size()
	var lp := Biquad.new().lp(3200)
	var hp := Biquad.new().hp(1500)
	var p1 := 0.0
	var p2 := 0.0
	for i in n:
		var x := float(i) / n
		var tt := float(i) / SR
		var f := 900.0 * pow(240.0 / 900.0, x) + sin(TAU * 26.0 * tt) * 50.0
		p1 += f / SR
		p2 += f * 1.49 / SR
		var s := (2.0 * fposmod(p1, 1.0) - 1.0) + (2.0 * fposmod(p2, 1.0) - 1.0) + hp.run(_nz()) * 0.5
		b[i] = lp.run(s) * minf(1.0, tt / 0.03) * pow(0.001, x)
	return _wav(_norm(b, 0.85))

func _syn_stun() -> AudioStreamWAV:
	var b := _buf(1.6)
	var fs := [740.0, 1109.0, 1480.0, 1975.0]
	for i in b.size():
		var tt := float(i) / SR
		var x := tt / 1.6
		var s := 0.0
		for k in 4:
			s += sin(TAU * fs[k] * (1.0 - 0.02 * x) * tt) * exp(-tt * (2.5 + k)) / (k + 1)
		b[i] = s * minf(1.0, tt / 0.01)
	return _wav(_norm(b, 0.7))

func _syn_capture() -> AudioStreamWAV:
	var b := _buf(1.2)
	var n := b.size()
	var lp := Biquad.new()
	var ph := 0.0
	for i in n:
		var x := float(i) / n
		var tt := float(i) / SR
		if i % 64 == 0: lp.lp(6000.0 * pow(150.0 / 6000.0, x))
		ph += 1000.0 * pow(0.06, x) / SR
		var env := minf(1.0, tt / 0.05) * pow(0.001, x)
		b[i] = (lp.run(_nz()) + sin(TAU * ph) * 0.5) * env
	return _wav(_norm(b, 0.8))

func _syn_noise_hit(d: float, filt: Biquad, attack: float, decay: float, peak: float) -> AudioStreamWAV:
	var b := _buf(d)
	for i in b.size():
		var tt := float(i) / SR
		b[i] = filt.run(_nz()) * minf(1.0, tt / attack) * exp(-tt * decay)
	return _wav(_norm(b, peak))

func _syn_tone(freq: float, d: float, decay: float, square := false) -> AudioStreamWAV:
	var b := _buf(d)
	for i in b.size():
		var tt := float(i) / SR
		var s := sin(TAU * freq * tt)
		if square: s = signf(s)
		b[i] = s * exp(-tt * decay)
	return _wav(_norm(b, 0.5))

func _syn_heart() -> AudioStreamWAV:
	var b := _buf(0.5)
	for i in b.size():
		var tt := float(i) / SR
		var s := sin(TAU * 58.0 * tt) * exp(-tt * 18.0)
		if tt > 0.2: s += 0.8 * sin(TAU * 52.0 * (tt - 0.2)) * exp(-(tt - 0.2) * 16.0)
		b[i] = s * minf(1.0, tt / 0.01)
	return _wav(_norm(b, 0.9))

func _syn_ambient() -> AudioStreamWAV:
	# 4 секунды гула и ветра, склеенные по краям, чтобы зацикливаться без щелчка
	var d := 4.0
	var fade := int(0.5 * SR)
	var n := int(d * SR)
	var raw := _buf(d + 0.5)
	var bp := Biquad.new()
	for i in raw.size():
		var tt := float(i) / SR
		if i % 128 == 0: bp.bp(420.0 + 260.0 * sin(TAU * 0.25 * tt), 0.7)
		var tri1 := 2.0 * absf(2.0 * fposmod(55.0 * tt, 1.0) - 1.0) - 1.0
		var tri2 := 2.0 * absf(2.0 * fposmod(55.5 * tt, 1.0) - 1.0) - 1.0
		raw[i] = 0.35 * tri1 + 0.35 * tri2 + 0.12 * sin(TAU * 82.5 * tt) + 0.9 * bp.run(_nz())
	var b := _buf(d)
	for i in n:
		b[i] = raw[i]
		if i < fade:
			var k := float(i) / fade
			b[i] = raw[i] * k + raw[n + i] * (1.0 - k)
	return _wav(_norm(b, 0.6), true)

func _syn_hum() -> AudioStreamWAV:
	var b := _buf(1.0)
	var lp := Biquad.new().lp(700)
	for k in 2:  # первый проход прогревает фильтр, чтобы петля была ровной
		for i in b.size():
			var v := lp.run(2.0 * fposmod(90.0 * i / SR, 1.0) - 1.0)
			if k == 1: b[i] = v
	return _wav(_norm(b, 0.6), true)

func _build_audio() -> void:
	sfx.whispers = [_syn_whisper(), _syn_whisper(), _syn_whisper()]
	sfx.scream = _syn_scream()
	sfx.stun = _syn_stun()
	sfx.capture = _syn_capture()
	sfx.clap = _syn_noise_hit(0.25, Biquad.new().bp(1500, 0.8), 0.002, 35.0, 0.9)
	sfx.puff = _syn_noise_hit(0.5, Biquad.new().lp(500), 0.05, 8.0, 0.5)
	sfx.beep = _syn_tone(1400, 0.07, 60.0, true)
	sfx.click = _syn_tone(1800, 0.04, 90.0, true)
	sfx.heart = _syn_heart()
	for i in 6:
		var p := AudioStreamPlayer.new()
		add_child(p)
		sfx_players.append(p)
	ambient = AudioStreamPlayer.new()
	ambient.stream = _syn_ambient()
	ambient.volume_db = -10.0
	add_child(ambient)
	ambient.play()
	hum = AudioStreamPlayer.new()
	hum.stream = _syn_hum()
	hum.volume_db = -16.0
	add_child(hum)

func _play(stream: AudioStream, vol_db := 0.0, pitch := 1.0) -> void:
	var p := sfx_players[sfx_i]
	sfx_i = (sfx_i + 1) % sfx_players.size()
	p.stream = stream
	p.volume_db = vol_db
	p.pitch_scale = pitch
	p.play()

func _play_ghost(g: Ghost, stream: AudioStream, vol_db := 0.0) -> void:
	g.snd.stream = stream
	g.snd.volume_db = vol_db
	g.snd.pitch_scale = randf_range(0.8, 1.15)
	g.snd.play()

func _haptic(c: XRController3D, amp: float, dur: float) -> void:
	if vr: c.trigger_haptic_pulse("haptic", 0.0, amp, dur, 0.0)


# ═════════ Ввод
func _on_left_pressed(n: String) -> void:
	if n == "trigger_click": want_flash = true
	elif n == "ax_button": want_clap = true

func _on_right_pressed(n: String) -> void:
	if state == "play": return
	if n == "ax_button": _start_game(false)
	elif n == "by_button" and mr_supported: _start_game(true)

func _unhandled_input(e: InputEvent) -> void:
	if vr: return
	if e is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var mm := e as InputEventMouseMotion
		yaw -= mm.relative.x * 0.0022
		pitch = clampf(pitch - mm.relative.y * 0.0022, -1.4, 1.4)
	elif e is InputEventMouseButton and e.pressed:
		Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	elif e is InputEventKey and e.pressed and not e.echo:
		match (e as InputEventKey).keycode:
			KEY_F: want_flash = true
			KEY_E: want_clap = true
			KEY_1: if state != "play": _start_game(false)
			KEY_2: if state != "play": _start_game(true)
			KEY_ESCAPE: Input.mouse_mode = Input.MOUSE_MODE_VISIBLE


# ═════════ Ход игры
func _clear_ghosts() -> void:
	for g in ghosts: g.node.queue_free()
	ghosts.clear()

func _make_ghost(ty: Dictionary, pos: Vector3) -> Ghost:
	var g := Ghost.new()
	g.type = ty
	g.phase = randf() * 10.0
	g.whisper_t = randf_range(4, 12)
	g.node = Node3D.new()
	add_child(g.node)
	g.node.position = pos
	var body := MeshInstance3D.new()
	body.mesh = ghost_mesh
	body.position.y = -0.55
	g.mat = ShaderMaterial.new()
	g.mat.shader = ghost_shader
	g.mat.set_shader_parameter("color", ty.color)
	g.mat.set_shader_parameter("phase", g.phase)
	body.material_override = g.mat
	g.node.add_child(body)
	var sphere := SphereMesh.new()
	sphere.radius = 1.0
	sphere.height = 2.0
	sphere.radial_segments = 12
	sphere.rings = 6
	g.eye_mat = _unshaded(Color(0, 0, 0, 0))
	g.eye_mat.render_priority = 1
	for sx in [-1, 1]:
		var e := MeshInstance3D.new()
		e.mesh = sphere
		e.material_override = g.eye_mat
		e.position = Vector3(sx * 0.085, 0.32, 0.225)
		e.scale = Vector3(0.045, 0.065, 0.03)
		g.node.add_child(e)
	g.mouth_mat = _unshaded(Color(0, 0, 0, 0))
	g.mouth_mat.render_priority = 1
	g.mouth = MeshInstance3D.new()
	g.mouth.mesh = sphere
	g.mouth.material_override = g.mouth_mat
	g.mouth.position = Vector3(0, 0.17, 0.245)
	g.mouth.scale = Vector3(0.05, 0.02, 0.02)
	g.node.add_child(g.mouth)
	var glow := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(1.8, 1.8)
	glow.mesh = q
	g.glow_mat = _unshaded(Color(ty.color.r, ty.color.g, ty.color.b, 0.0), true)
	g.glow_mat.albedo_texture = glow_tex
	g.glow_mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	glow.material_override = g.glow_mat
	g.node.add_child(glow)
	g.snd = AudioStreamPlayer3D.new()
	g.snd.unit_size = 2.0
	g.snd.max_distance = 25.0
	g.node.add_child(g.snd)
	g.target = _random_point()
	return g

func _start_game(use_mr: bool) -> void:
	_clear_ghosts()
	_set_mr(use_mr)
	state = "play"
	game_time = 0.0; fear = 0.0; battery = 1.0; flash_on = true; caught = 0
	beaming = false; flash_fx = 0.0; hint = 0
	menu.visible = false
	for c in candles: c.out = 0.0
	origin.transform = Transform3D.IDENTITY
	yaw = 0.0; pitch = 0.0
	if not use_mr: origin.position = _cell_center(start_cell)
	var order := GHOST_TYPES + GHOST_TYPES
	order.shuffle()
	for i in ghost_cells.size():
		var p: Vector3
		if use_mr:
			var a := randf() * TAU
			var r := randf_range(1.8, MR_R + 0.5)
			p = Vector3(cos(a) * r, 1.45, sin(a) * r)
		else:
			p = _cell_center(ghost_cells[i]) + Vector3(0, 1.45, 0)
		ghosts.append(_make_ghost(order[i % order.size()], p))
	total = ghosts.size()
	if use_mr:
		for i in range(2, ghosts.size()):
			ghosts[i].dormant = true
			ghosts[i].node.visible = false
		_toast("Призраки проникли в ваш дом: %d.\nОсвободите место вокруг себя и светите фонарём." % total, 6.0)
	else:
		_toast("Поймайте всех призраков (%d) до рассвета.\nСвет оглушает их, ловушка затягивает." % total, 6.0)

func _end_game(win: bool, reason: String) -> void:
	state = "over"
	beaming = false
	hum.stop()
	beam_pivot.visible = false
	if win:
		_play(sfx.stun, 0.0, 0.7)
		_show_menu("Дом очищен! Все %d призраков пойманы за %s." % [total, _fmt(game_time)])
	else:
		_play(sfx.scream, -2.0, 0.6)
		_show_menu(reason)
	toast_t = 0.0
	toast.visible = false

func _show_menu(header: String) -> void:
	var s := ("ПРИЗРАКИ ЭМБЕРХОЛЛА" if header == "" else header) + "\n\n"
	if vr:
		s += "A: особняк (VR)\n"
		s += ("B: смешанная реальность, призраки у вас в комнате\n" if mr_supported else "Смешанная реальность недоступна\n")
		s += "\nЛевый стик: идти, правый стик: поворот\nЛевый курок: фонарь, правый курок: ловушка\nX: хлопок, подманивает призраков"
	else:
		s += "1: особняк, 2: смешанная реальность (имитация)\nWASD: идти, мышь: смотреть, F: фонарь\nЛКМ: ловушка, E: хлопок"
	menu.text = s
	menu.visible = true

func _toast(text: String, dur := 3.0) -> void:
	toast.text = text
	toast_t = dur
	toast.visible = true

func _fmt(s: float) -> String:
	var v := maxi(0, ceili(s))
	return "%d:%02d" % [v / 60, v % 60]

func _snap_turn(a: float) -> void:
	var h := cam.global_position
	origin.global_transform = origin.global_transform.translated(-h).rotated(Vector3.UP, a).translated(h)

func _move(d: Vector3) -> void:
	var h := cam.global_position
	if not _collides(h.x + d.x, h.z):
		origin.position.x += d.x
		h.x += d.x
	if not _collides(h.x, h.z + d.z):
		origin.position.z += d.z

func _in_flashlight(p: Vector3, f: Vector3, fd: Vector3) -> bool:
	if not flash_on or spot.light_energy <= 0.0: return false
	var v := p - f
	var d := v.length()
	if d > 6.0 + 9.0 * minf(1.0, battery * 2.0): return false
	var ang := acos(clampf(v.dot(fd) / d, -1.0, 1.0))
	return ang < 0.36 + atan(0.3 / d) and not _wall_between(f, p)

func _noise_event(strength: float) -> void:
	var h := cam.global_position
	for g in ghosts:
		if g.captured or g.stun > 0.0: continue
		if g.node.global_position.distance_to(h) > 14.0 * strength: continue
		if g.state == "wander" or g.state == "lured":
			if g.type.charge > 0.0 and randf() < 0.5:
				_set_state(g, "stalk", 6.0)
			else:
				_set_state(g, "lured", 9.0)
				g.target = Vector3(h.x + randf_range(-1, 1), 1.45, h.z + randf_range(-1, 1))

func _set_state(g: Ghost, s: String, dur: float) -> void:
	g.state = s
	g.state_t = dur

func _teleport_away(g: Ghost, h: Vector3) -> void:
	var min_d := 2.0 if mr else 8.0
	for k in 30:
		var p := _random_point()
		if p.distance_to(h) > min_d:
			g.node.global_position = p
			return

func _scare(g: Ghost) -> void:
	fear += g.type.scare * (0.7 if mr else 1.0)
	flash_fx = 1.0
	g.scare_cd = 5.0
	_play_ghost(g, sfx.scream, 2.0)
	_haptic(left, 1.0, 0.3)
	_haptic(right, 1.0, 0.3)
	_set_state(g, "flee", 3.0)


func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	_step(dt)

func _step(dt: float) -> void:
	t += dt
	if not vr:
		cam.position = Vector3(0, 1.6, 0)
		cam.rotation = Vector3(pitch, yaw, 0)
	for c in candles:
		if c.out > 0.0:
			c.out -= dt
			c.light.visible = false
			c.flame.visible = false
		else:
			var f: float = 0.8 + 0.15 * sin(t * 13.0 + c.seed) + 0.1 * sin(t * 29.0 + c.seed * 2.0)
			c.light.visible = true
			c.light.light_energy = 1.6 * f
			c.flame.visible = true
			c.flame.scale = Vector3(1, f, 1)
	if state == "play": _update(dt)
	want_flash = false
	want_clap = false
	if toast_t > 0.0:
		toast_t -= dt
		var o := clampf(toast_t / 0.6, 0.0, 1.0)
		toast.modulate.a = o
		toast.outline_modulate.a = o
		toast.visible = o > 0.0
	var hp := cam.global_position
	vignette_mat.set_shader_parameter("black", 1.0 if (vr and not mr and _is_wall(hp.x, hp.z)) else 0.0)

func _update(dt: float) -> void:
	game_time += dt
	var head := cam.global_position

	# Ввод
	var mv := Vector2.ZERO
	var run := false
	var beam_in := test_beam
	if vr:
		mv = left.get_vector2("primary")
		var rx := right.get_vector2("primary").x
		if absf(rx) > 0.6 and not snap_latch and not mr:
			snap_latch = true
			_snap_turn(-signf(rx) * PI / 6.0)
		if absf(rx) < 0.3: snap_latch = false
		beam_in = beam_in or right.get_float("trigger") > 0.5
	else:
		mv.x = float(Input.is_key_pressed(KEY_D)) - float(Input.is_key_pressed(KEY_A))
		mv.y = float(Input.is_key_pressed(KEY_W)) - float(Input.is_key_pressed(KEY_S))
		run = Input.is_key_pressed(KEY_SHIFT)
		beam_in = beam_in or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT)

	# Движение (в смешанной реальности ходят ногами)
	if mv.length() > 0.15 and not mr:
		var fwd := -cam.global_basis.z
		fwd.y = 0.0
		fwd = fwd.normalized()
		var rgt := Vector3(-fwd.z, 0, fwd.x)
		var d := fwd * mv.y + rgt * mv.x
		if d.length() > 1.0: d = d.normalized()
		_move(d * (3.6 if run else 2.1) * dt)
		if run:
			noise_t -= dt
			if noise_t <= 0.0:
				noise_t = 0.7
				_noise_event(0.35)
		head = cam.global_position

	# Фонарь и батарея
	if want_flash:
		if not flash_on and battery < 0.05:
			_toast("Батарея разряжена, подождите", 2.0)
		else:
			flash_on = not flash_on
			_play(sfx.click, -8.0)
	if flash_on:
		battery -= dt / 110.0
		if battery <= 0.0:
			battery = 0.0
			flash_on = false
			_toast("Фонарь погас: села батарея.\nВыключенный фонарь заряжается.", 3.0)
	else:
		battery = minf(1.0, battery + dt / 25.0)
	var flick := flash_on and battery < 0.15 and randf() < 0.25
	spot.light_energy = 8.0 * (0.6 + 0.4 * minf(1.0, battery * 3.0)) if (flash_on and not flick) else 0.0
	spot.spot_range = 8.0 + 12.0 * minf(1.0, battery * 2.0)
	cone.visible = spot.light_energy > 0.0
	lens_mat.albedo_color = Color(1, 0.95, 0.82) if cone.visible else Color(0.2, 0.2, 0.2)
	var f := spot.global_position
	var fd := -flash_tool.global_basis.z.normalized()
	if mr:
		dim_sphere.global_position = head
		dim_mat.set_shader_parameter("f_pos", f)
		dim_mat.set_shader_parameter("f_dir", fd)
		dim_mat.set_shader_parameter("on", 1.0 if cone.visible else 0.0)

	# Хлопок
	clap_cd -= dt
	if want_clap and clap_cd <= 0.0:
		clap_cd = 1.0
		_play(sfx.clap)
		_noise_event(1.0)
		_haptic(left, 0.6, 0.04)

	# Луч ловушки
	var m := muzzle.global_position
	var md := -muzzle.global_basis.z.normalized()
	beaming = beam_in
	var target: Ghost = null
	if beaming:
		var best := 1e9
		for g in ghosts:
			if g.captured or g.dormant: continue
			var v := g.node.global_position - m
			var d := v.length()
			if d > 8.0: continue
			var ang := acos(clampf(v.dot(md) / d, -1.0, 1.0))
			if ang < 0.2 + atan(0.35 / d) and ang < best and not _wall_between(m, g.node.global_position):
				best = ang
				target = g
	for g in ghosts:
		if g != target or g.stun <= 0.0: g.cap = maxf(0.0, g.cap - dt * 0.4)
	if target:
		if target.stun > 0.0:
			target.cap += dt / 2.2
			_haptic(right, 0.25 + target.cap * 0.5, 0.03)
			if target.cap >= 1.0:
				target.captured = true
				caught += 1
				_play(sfx.capture)
				_haptic(right, 1.0, 0.25)
				_toast("Пойман: %s (%d/%d)" % [target.type.name, caught, total], 2.5)
		elif target.reveal > 0.3:
			if target.type.charge > 0.0:
				if target.state != "charge": _set_state(target, "charge", 3.0)
			elif target.state != "flee":
				_set_state(target, "flee", 2.0)
			if hint < 2 and toast_t <= 0.0:
				hint = 2
				_toast("Сначала оглушите призрака\nсветом фонаря!", 2.5)
	beam_pivot.visible = beaming
	var prog := target.cap if (target and target.stun > 0.0) else 0.0
	if beaming:
		var tp := target.node.global_position if target else m + md * 6.0
		var dir := tp - m
		if dir.length() > 0.05 and absf(dir.normalized().y) < 0.99:
			beam_pivot.look_at(tp, Vector3.UP)
		beam_pivot.scale = Vector3(1, 1, dir.length())
		var bc := Color(0.5, 1.0, 0.88) if prog > 0.0 else Color(0.42, 0.66, 0.75)
		bc.a = 0.3 + randf() * 0.3
		beam_mat.albedo_color = bc
		if not hum.playing: hum.play()
		hum.pitch_scale = 1.0 + prog * 1.9
	elif hum.playing:
		hum.stop()
	ring_mat.albedo_color = Color8(31, 85, 96).lerp(Color(0.5, 1.0, 0.88), (0.4 + prog * 0.6) if beaming else 0.0)

	# Призраки (в смешанной реальности новые появляются каждые 25 секунд)
	if mr:
		var active := 0
		for g in ghosts:
			if not g.dormant and not g.captured: active += 1
		var limit := 2 + int(game_time / 25.0)
		for g in ghosts:
			if active >= limit: break
			if g.dormant:
				g.dormant = false
				active += 1
				_play_ghost(g, sfx.whispers.pick_random(), 4.0)
	var nearest := 1e9
	var close := false
	for g in ghosts:
		if g.dormant: continue
		_update_ghost(g, dt, head, f, fd, target)
		if not g.captured:
			var d := g.node.global_position.distance_to(head)
			nearest = minf(nearest, d)
			if d < (2.0 if mr else 4.0): close = true

	# Детектор
	var level := 5 if nearest < 2 else 4 if nearest < 4 else 3 if nearest < 6 else 2 if nearest < 9 else 1 if nearest < 13 else 0
	last_level = level
	for i in 5:
		led_mats[i].albedo_color = LED_COLORS[i] if i < level else Color(0.07, 0.07, 0.07)
	beep_t -= dt
	if level > 0 and beep_t <= 0.0:
		beep_t = BEEP_GAP[level]
		_play(sfx.beep, -14.0, 0.8 + level * 0.13)
		_haptic(right, 0.04 * level, 0.015)

	# Страх
	if not flash_on: fear += dt * 0.6
	if close: fear += dt * 0.8
	elif flash_on and fear < 100.0: fear -= dt * 1.5
	fear = clampf(fear, 0.0, 100.0)
	heart_t -= dt
	if fear > 35.0 and heart_t <= 0.0:
		heart_t = 1.4 - fear / 100.0
		_play(sfx.heart, -6.0 + fear / 20.0)
		_haptic(left, 0.15, 0.06)
	flash_fx = maxf(0.0, flash_fx - dt * 2.0)
	vignette_mat.set_shader_parameter("fear", fear / 100.0)
	vignette_mat.set_shader_parameter("flash", flash_fx)

	# Табличка
	hud_t -= dt
	if hud_t <= 0.0:
		hud_t = 0.2
		var bar := func(v: float) -> String:
			var k := clampi(roundi(v * 10.0), 0, 10)
			return "■".repeat(k) + "□".repeat(10 - k)
		wrist_label.text = "Пойманы %d/%d\nРассвет через %s\nСтрах %s\nСвет  %s" % [caught, total, _fmt(DAWN - game_time), bar.call(fear / 100.0), bar.call(battery)]

	# Конец игры
	if caught >= total and total > 0:
		_end_game(true, "")
	elif fear >= 100.0:
		_end_game(false, "Страх победил: вы с криком выбежали из дома.")
	elif game_time >= DAWN:
		_end_game(false, "Рассвет. В доме остались призраки: %d." % (total - caught))

func _update_ghost(g: Ghost, dt: float, head: Vector3, f: Vector3, fd: Vector3, target: Ghost) -> void:
	var p := g.node.global_position
	var ty := g.type
	if g.captured:
		if g.cap_anim >= 1.0: return
		g.cap_anim += dt / 0.7
		g.node.global_position = p.lerp(muzzle.global_position, minf(1.0, dt * 8.0))
		g.node.scale = Vector3.ONE * maxf(0.02, 1.0 - g.cap_anim)
		g.node.rotation.y += dt * 20.0
		g.mat.set_shader_parameter("opacity", 1.0)
		if g.cap_anim >= 1.0: g.node.visible = false
		return
	var dx := head.x - p.x
	var dz := head.z - p.z
	var dxz := maxf(0.001, sqrt(dx * dx + dz * dz))
	var dist := p.distance_to(head)
	var lit := _in_flashlight(p, f, fd)
	var beamed := target == g
	var speed := 0.0
	var dir := Vector2.ZERO
	var target_y := 1.45 + sin(t * 1.3 + g.phase) * 0.15
	g.scare_cd -= dt

	if g.stun > 0.0:
		if not beamed: g.stun -= dt
		g.exposure = 0.0
		if beamed:
			p = p.lerp(muzzle.global_position, dt * 0.25) + Vector3(randf_range(-0.02, 0.02), 0, randf_range(-0.02, 0.02))
		if g.stun <= 0.0:
			g.cap = 0.0
			if ty.blink: _teleport_away(g, head); p = g.node.global_position
			_set_state(g, "flee", 3.0)
	else:
		if lit:
			g.exposure += dt
			if g.exposure >= ty.stun_need:
				g.stun = 4.5
				_play_ghost(g, sfx.stun)
				_haptic(left, 0.5, 0.12)
				if hint < 1:
					hint = 1
					_toast("Призрак оглушён!\nЛовите его лучом ловушки", 3.0)
			elif ty.charge > 0.0:
				if g.state != "charge": _set_state(g, "charge", 4.0)
			elif g.state != "flee":
				_set_state(g, "flee", 2.5)
			else:
				g.state_t = maxf(g.state_t, 1.2)
		else:
			g.exposure = maxf(0.0, g.exposure - dt * 0.25)

		g.state_t -= dt
		var aggro: float = ty.aggro * (1.0 + game_time / 240.0) * (1.0 if flash_on else 1.8) * (0.5 if mr else 1.0)
		match g.state:
			"wander":
				var to := g.target - p
				to.y = 0.0
				if to.length() < 0.5: g.target = _random_point()
				var n := Vector2(to.x, to.z).normalized()
				dir = n
				speed = ty.speed * 0.6
				if dxz < 9.0 and randf() < aggro * dt: _set_state(g, "stalk", 7.0)
			"lured":
				var to := g.target - p
				to.y = 0.0
				if to.length() > 0.4:
					dir = Vector2(to.x, to.z).normalized()
					speed = ty.speed
				if g.state_t <= 0.0: _set_state(g, "wander", 0.0)
			"stalk":
				dir = Vector2(dx, dz) / dxz
				speed = ty.speed * 0.9
				target_y = head.y - 0.15
				if g.state_t <= 0.0: _set_state(g, "wander", 0.0)
			"charge":
				dir = Vector2(dx, dz) / dxz
				speed = ty.charge
				target_y = head.y - 0.1
				if g.state_t <= 0.0: _set_state(g, "wander", 0.0)
			"flee":
				var w := sin(t * 2.0 + g.phase) * 0.5
				dir = Vector2(-dx / dxz + w * dz / dxz, -dz / dxz - w * dx / dxz)
				speed = ty.flee if ty.flee > 0.0 else ty.speed
				if g.state_t <= 0.0:
					_set_state(g, "wander", 0.0)
					g.target = _random_point()
		p.x += dir.x * speed * dt
		p.z += dir.y * speed * dt
		if dist < 0.75 and g.scare_cd <= 0.0: _scare(g)

	if mr:
		var r := sqrt(p.x * p.x + p.z * p.z)
		var lim := MR_R + 0.8
		if r > lim:
			p.x *= lim / r
			p.z *= lim / r
	else:
		p.x = clampf(p.x, CS, (cols - 1) * CS)
		p.z = clampf(p.z, CS, (rows - 1) * CS)
	p.y += (target_y - p.y) * minf(1.0, dt * 2.0)
	g.node.global_position = p

	# Шёпот, чтобы призрака можно было найти на слух
	g.whisper_t -= dt
	if g.whisper_t <= 0.0:
		g.whisper_t = randf_range(5, 13)
		if dist < 14.0 and g.stun <= 0.0: _play_ghost(g, sfx.whispers.pick_random(), 2.0)
	# Призрак гасит свечи, пролетая рядом
	if not mr:
		for c in candles:
			if c.out <= 0.0 and c.pos.distance_to(p) < 1.3:
				c.out = 14.0
				_play(sfx.puff, linear_to_db(clampf(1.0 - c.pos.distance_to(head) / 14.0, 0.01, 1.0)) - 4.0)

	# Видимость
	var want := 0.0
	if lit: want = 1.0
	elif g.stun > 0.0: want = 0.85
	elif (g.state == "stalk" or g.state == "charge") and dist < 2.5: want = 0.4
	elif dist < 3.0: want = 0.05 if ty.blink else 0.13
	g.reveal += (want - g.reveal) * minf(1.0, dt * 4.0)
	var vis := g.reveal
	g.node.visible = vis > 0.01
	g.mat.set_shader_parameter("opacity", vis * 0.8)
	var col: Color = ty.color
	if g.stun > 0.0: col = col.lerp(Color.WHITE, 0.5 + 0.5 * sin(t * 22.0))
	g.mat.set_shader_parameter("color", col)
	var angry := g.state == "charge" and g.stun <= 0.0
	g.eye_mat.albedo_color = Color(1, 0.12, 0.12, vis) if angry else Color(0, 0, 0, vis)
	g.mouth_mat.albedo_color = Color(0, 0, 0, vis)
	g.mouth.scale.y = 0.07 if (g.state == "stalk" or g.state == "charge") else 0.02
	g.glow_mat.albedo_color = Color(col.r, col.g, col.b, vis * 0.35)
	if g.stun > 0.0: g.node.rotation.y += dt * 6.0
	else: g.node.rotation.y = atan2(dx, dz)


# ═════════ Автотест без шлема: godot --headless --xr-mode off -- --selftest
func _selftest() -> void:
	var ok := true
	var dt := 1.0 / 60.0
	_start_game(false)
	_step(dt)
	# 1) свет оглушает призрака перед игроком
	var g := ghosts[0]
	var spot_pos := cam.global_position + Vector3(0, -0.15, -3.0)
	g.scare_cd = 99.0
	for i in 240:
		g.node.global_position = spot_pos   # игрок ведёт призрака лучом фонаря
		_step(dt)
		if g.stun > 0.0: break
	print("stun after light: ", g.stun > 0.0, " reveal=", snappedf(g.reveal, 0.01))
	ok = ok and g.stun > 0.0
	# 2) луч ловушки ловит оглушённого
	test_beam = true
	for i in 300:
		_step(dt)
		if g.captured: break
	test_beam = false
	print("captured: ", g.captured, " caught=", caught)
	ok = ok and g.captured and caught == 1
	# 3) ловим остальных → победа
	for k in range(1, ghosts.size()):
		var h := ghosts[k]
		h.stun = 60.0
		h.scare_cd = 99.0
		test_beam = true
		for i in 400:
			h.node.global_position = cam.global_position + Vector3(0, -0.15, -2.5)
			_step(dt)
			if h.captured: break
		test_beam = false
	for i in 30: _step(dt)
	print("state after all caught: ", state, " caught=", caught, "/", total)
	ok = ok and state == "over" and caught == total
	# 4) смешанная реальность: призраки держатся рядом с игроком
	_start_game(true)
	for i in 1800: _step(dt)
	var far := 0.0
	var awake := 0
	for gh in ghosts:
		far = maxf(far, Vector2(gh.node.global_position.x, gh.node.global_position.z).length())
		if not gh.dormant: awake += 1
	print("MR after 30s: state=", state, " awake=", awake, " fear=", roundi(fear), " max ghost radius=", snappedf(far, 0.01), " house visible=", house.visible)
	ok = ok and far <= MR_R + 0.81 and not house.visible
	# 5) страх → поражение
	_set_mr(false)
	_start_game(false)
	fear = 100.0
	_step(dt)
	print("fear end: ", state)
	ok = ok and state == "over"
	print("SELFTEST ", "OK" if ok else "FAILED")
	get_tree().quit(0 if ok else 1)


# Снимки экрана для проверки картинки без шлема: godot --xr-mode off -- --shot
func _shots() -> void:
	var dir := ProjectSettings.globalize_path("res://build/")
	for mode in [false, true]:
		_start_game(mode)
		toast_t = 0.0
		for i in 3: await get_tree().process_frame
		var g := ghosts[0]
		g.scare_cd = 99.0
		var pos := cam.global_position + Vector3(0.1, -0.1, -2.6)
		for i in 50:
			g.node.global_position = pos
			await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(dir + ("shot_mr.png" if mode else "shot_vr.png"))
	_set_mr(false)
	_end_game(true, "")
	for i in 5: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(dir + "shot_menu.png")
	get_tree().quit()
