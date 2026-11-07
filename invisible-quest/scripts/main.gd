extends Node3D
## «Невидимка»: ты — девятиклассник, единственный человек в мире, который умеет становиться невидимым.
## Город, дом, родители, школа. Глава 1: «Понедельник».

const S := 8.0                         # масштаб городских моделей Kenney
const FS := 0.2                        # масштаб мебели
const HOME := Vector3(-300, 0, 0)      # интерьер дома (отдельно от города)
const SCHOOL := Vector3(300, 0, 0)     # интерьер школы
const SCHOOL_EXT := Vector3(100, 0, -24)
const PARK := Vector3(28, 0, 19)
const MIN_PER_SEC := 1.0 / 3.0         # игровое время: минута за 3 секунды

var xr: XRInterface
var vr := false
var sfx: Sfx
var player: Player
var env: Environment
var sun: DirectionalLight3D
var sky_mat: ProceduralSkyMaterial
var world: Node3D
var area := "home"
var minutes := 7 * 60 + 30.0
var suspicion := 0.0
var step := ""
var steps_done := {}
var doors: Array[Dictionary] = []
var npcs := {}
var items := {}
var cars: Array[Dictionary] = []
var zones: Array[Dictionary] = []
var portals: Array[Dictionary] = []
var marker: Node3D
var busy := false             # идёт переход или сценка
var portal_cd := 0.0
var bump_cd := 0.0
var talk_cd := 0.0
var hint_cd := 0.0
var caught_count := 0
var _shots_mode := false

func _ready() -> void:
	randomize()
	xr = XRServer.find_interface("OpenXR")
	if xr and xr.is_initialized():
		vr = true
		get_viewport().use_xr = true
		DisplayServer.window_set_vsync_mode(DisplayServer.VSYNC_DISABLED)
		xr.session_begun.connect(func():
			var rates: Array = xr.get_available_display_refresh_rates()
			if 90.0 in rates: xr.display_refresh_rate = 90.0)
	sfx = Sfx.new()
	add_child(sfx)
	_build_env()
	world = Node3D.new()
	add_child(world)
	_build_city()
	_build_home()
	_build_school()
	_build_npcs()
	_build_marker()
	player = Player.new()
	add_child(player)
	player.setup(vr, sfx)
	player.interact.connect(_on_interact)
	player.grabbed.connect(_on_grabbed)
	player.released.connect(_on_released)
	player.invisibility_changed.connect(_on_invis)
	_enter_area("home")
	player.teleport(HOME + Vector3(-3.6, 0, -2.0), 180)
	set_step("backpack")
	var args := OS.get_cmdline_user_args()
	if "--selftest" in args: _selftest()
	elif "--shot" in args: _shots()
	else:
		player.toast("Понедельник, 7:30.\nВчера ты обнаружил, что умеешь становиться невидимым.\nВ целом мире так не умеет больше никто. И никто не должен узнать.", 8.0)

# ═════════ Свет и время суток
func _build_env() -> void:
	env = Environment.new()
	env.background_mode = Environment.BG_SKY
	var sky := Sky.new()
	sky_mat = ProceduralSkyMaterial.new()
	sky.sky_material = sky_mat
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 0.9
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	env.fog_enabled = true
	env.fog_density = 0.004
	env.fog_sky_affect = 0.3
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 45.0
	add_child(sun)
	_apply_time()

func _apply_time() -> void:
	var h := minutes / 60.0
	var elev := clampf(sin((h - 6.0) / 12.0 * PI), 0.05, 1.0) * 60.0 + 4.0
	sun.rotation_degrees = Vector3(-elev, -40.0 + (h - 12.0) * 12.0, 0)
	var evening := clampf((h - 16.5) / 2.0, 0.0, 1.0)
	var morning := clampf((9.0 - h) / 2.0, 0.0, 1.0)
	sun.light_color = Color(1, 0.97, 0.92).lerp(Color(1, 0.86, 0.7), morning).lerp(Color(1, 0.55, 0.3), evening)
	sun.light_energy = lerpf(1.2, 0.7, evening)
	sky_mat.sky_top_color = Color(0.32, 0.55, 0.9).lerp(Color(0.25, 0.25, 0.5), evening)
	sky_mat.sky_horizon_color = Color(0.72, 0.82, 0.95).lerp(Color(1.0, 0.62, 0.4), evening).lerp(Color(1.0, 0.85, 0.7), morning * 0.5)
	sky_mat.ground_horizon_color = sky_mat.sky_horizon_color
	env.ambient_light_energy = lerpf(0.9, 0.55, evening)
	env.fog_light_color = sky_mat.sky_horizon_color

func _clock() -> String:
	var m := int(minutes) % (24 * 60)
	return "%02d:%02d" % [m / 60, m % 60]

# ═════════ Город
func _city(path: String, pos: Vector3, rot := 0.0, sc := S, collide := true) -> Node3D:
	return W.place(world, path, pos, rot, sc, collide)

func _build_city() -> void:
	# земля
	var g := W.box(world, Vector3(420, 1, 220), Vector3(30, -0.52, 0), W.mat(Color(0.42, 0.66, 0.33)), true)
	g.name = "Ground"
	# главная улица
	for i in range(-9, 19):
		var x := i * 8.0
		_city("res://assets/roads/road-crossing.glb" if x == 24.0 else "res://assets/roads/road-straight.glb", Vector3(x, 0, 0), 0, S, false)
	# фонари и деревья вдоль тротуаров
	for i in range(-8, 18, 4):
		var x := i * 8.0 + 4.0
		_city("res://assets/roads/light-square.glb", Vector3(x, 0, -4.3), 180, S * 0.8, false)
		_city("res://assets/roads/light-square.glb", Vector3(x + 16.0, 0, 4.3), 0, S * 0.8, false)
	for x in [-60.0, -36.0, -12.0, 12.0, 36.0, 58.0, 124.0]:
		W.place(world, "res://assets/suburban/tree-large.glb", Vector3(x, 0, -7.0), randf() * 360.0, S, true, false, 0.25)
	for x in [-60.0, -36.0, -12.0, 60.0, 76.0, 100.0, 124.0]:
		W.place(world, "res://assets/suburban/tree-small.glb", Vector3(x, 0, 7.0), randf() * 360.0, S, true, false, 0.25)
	# север: дома, магазин, школа (фасадом к дороге, +Z)
	_city("res://assets/suburban/building-type-c.glb", Vector3(-48, 0, -16))
	_city("res://assets/suburban/building-type-f.glb", Vector3(-24, 0, -16))
	_city("res://assets/suburban/building-type-a.glb", Vector3(0, 0, -16))      # наш дом
	_city("res://assets/suburban/building-type-k.glb", Vector3(24, 0, -16))
	var shop := _city("res://assets/commercial/building-c.glb", Vector3(46, 0, -16))
	_city("res://assets/commercial/detail-awning-wide.glb", Vector3(46, 0, -16 + shop.get_meta("size").z / 2.0), 0, S, false)
	W.label(world, "ПРОДУКТЫ", Vector3(46, 5.6, -16 + shop.get_meta("size").z / 2.0 + 0.15), 160, Color(1, 0.95, 0.6))
	_city("res://assets/commercial/building-e.glb", Vector3(66, 0, -16))
	_city("res://assets/suburban/building-type-h.glb", Vector3(132, 0, -16))
	# юг: дома фасадом к дороге (-Z)
	_city("res://assets/suburban/building-type-b.glb", Vector3(-48, 0, 16), 180)
	_city("res://assets/suburban/building-type-d.glb", Vector3(-24, 0, 16), 180)
	_city("res://assets/suburban/building-type-g.glb", Vector3(66, 0, 16), 180)
	_city("res://assets/suburban/building-type-m.glb", Vector3(90, 0, 16), 180)
	_city("res://assets/suburban/building-type-n.glb", Vector3(114, 0, 16), 180)
	# дорожка к нашему дому и почтовый ящик с табличкой
	W.box(world, Vector3(1.6, 0.04, 7.4), Vector3(0, 0.02, -8.0), W.mat(Color(0.75, 0.74, 0.72)), false)
	W.label(world, "Дом 12", Vector3(1.4, 1.2, -6.2), 90, Color(1, 1, 1), 0)
	_build_park()
	_build_school_exterior()
	# машины: по правой полосе на восток (z=+1.9) и на запад (z=-1.9)
	var models := ["sedan", "taxi", "suv", "van", "hatchback-sports", "police"]
	for i in models.size():
		var east := i % 2 == 0
		var n := _city("res://assets/cars/%s.glb" % models[i], Vector3(-80 + i * 40.0, 0, 1.9 if east else -1.9), 90.0 if east else -90.0, 1.3, false)
		cars.append({"node": n, "dir": 1.0 if east else -1.0, "speed": 0.0, "max": randf_range(7.0, 9.5), "honk": 0.0})
	# портал: дверь нашего дома и школы
	portals.append({"area": "city", "pos": Vector3(0, 0, -11.6), "r": 1.1, "to": "home", "spawn": HOME + Vector3(0, 0, 3.9), "yaw": 0.0, "id": "home_in"})
	portals.append({"area": "home", "pos": HOME + Vector3(0, 0, 4.95), "r": 0.7, "to": "city", "spawn": Vector3(0, 0, -9.6), "yaw": 180.0, "id": "home_out"})
	portals.append({"area": "city", "pos": SCHOOL_EXT + Vector3(0, 0, 7.4), "r": 1.4, "to": "school", "spawn": SCHOOL + Vector3(0, 0, 5.6), "yaw": 0.0, "id": "school_in"})
	portals.append({"area": "school", "pos": SCHOOL + Vector3(0, 0, 6.95), "r": 0.8, "to": "city", "spawn": SCHOOL_EXT + Vector3(0, 0, 9.4), "yaw": 180.0, "id": "school_out"})

func _build_park() -> void:
	var p := PARK
	W.box(world, Vector3(36, 0.03, 24), p + Vector3(0, 0.015, 0), W.mat(Color(0.36, 0.62, 0.3)), false)
	W.box(world, Vector3(2.0, 0.04, 24), p + Vector3(-4, 0.03, 0), W.mat(Color(0.82, 0.74, 0.58)), false)
	W.box(world, Vector3(36, 0.04, 2.0), p + Vector3(0, 0.03, 2), W.mat(Color(0.82, 0.74, 0.58)), false)
	# пруд
	var pond := MeshInstance3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 4.0
	cm.bottom_radius = 4.0
	cm.height = 0.06
	pond.mesh = cm
	pond.material_override = W.mat(Color(0.3, 0.55, 0.85), 0.1)
	pond.position = p + Vector3(9, 0.04, 7)
	world.add_child(pond)
	for t in [[-15, -9], [-15, 9], [15, -9], [15, 9], [-9, 10], [3, -10], [12, -3], [-12, 3]]:
		W.place(world, "res://assets/suburban/tree-large.glb" if randf() < 0.6 else "res://assets/suburban/tree-small.glb", p + Vector3(t[0], 0, t[1]), randf() * 360.0, S, true, false, 0.25)
	for b in [[-6.6, 7, 90.0], [-6.6, -4, 90.0], [6, -2.4, 0.0]]:
		_bench(p + Vector3(b[0], 0, b[1]), b[2])
	W.box(world, Vector3(0.1, 2.2, 0.1), p + Vector3(-5.6, 1.1, -11.6), W.mat(Color(0.35, 0.25, 0.18)), true)
	W.box(world, Vector3(1.6, 0.6, 0.06), p + Vector3(-5.6, 2.1, -11.6), W.mat(Color(0.25, 0.5, 0.3)), false)
	W.label(world, "ПАРК", p + Vector3(-5.6, 2.1, -11.56), 60, Color(1, 1, 0.9))

func _bench(pos: Vector3, yaw_deg: float) -> void:
	var b := Node3D.new()
	b.position = pos
	b.rotation.y = deg_to_rad(yaw_deg)
	world.add_child(b)
	var wood := W.mat(Color(0.62, 0.42, 0.25))
	var iron := W.mat(Color(0.2, 0.2, 0.22))
	for i in 3: W.box(b, Vector3(1.7, 0.04, 0.12), Vector3(0, 0.45, -0.16 + i * 0.15), wood, false)
	for i in 2: W.box(b, Vector3(1.7, 0.1, 0.03), Vector3(0, 0.62 + i * 0.16, -0.27), wood, false)
	for x in [-0.7, 0.7]:
		W.box(b, Vector3(0.06, 0.45, 0.4), Vector3(x, 0.22, -0.05), iron, false)
		W.box(b, Vector3(0.06, 0.4, 0.04), Vector3(x, 0.65, -0.28), iron, false)
	W.box(b, Vector3(1.7, 0.5, 0.45), Vector3(0, 0.25, -0.05), W.unshaded(Color(0, 0, 0, 0)), true).visible = false

func _build_school_exterior() -> void:
	var c := SCHOOL_EXT
	var wall := W.mat(Color(0.95, 0.74, 0.58))
	W.box(world, Vector3(36, 10, 14), c + Vector3(0, 5, 0), wall, true)
	W.box(world, Vector3(37, 0.6, 15), c + Vector3(0, 10.3, 0), W.mat(Color(0.38, 0.32, 0.34)), false)
	W.box(world, Vector3(37, 0.5, 15), c + Vector3(0, 0.25, 0), W.mat(Color(0.6, 0.6, 0.62)), false)
	var glass := W.mat(Color(0.55, 0.78, 0.95), 0.1, 0.25)
	var frame := W.mat(Color(1, 1, 1))
	for row in 2:
		for col in 10:
			var x := -15.75 + col * 3.5
			if absf(x) < 2.5 and row == 0: continue
			var y := 2.6 + row * 4.0
			W.box(world, Vector3(2.0, 1.9, 0.1), c + Vector3(x, y, 7.02), frame, false)
			W.box(world, Vector3(1.8, 1.7, 0.1), c + Vector3(x, y, 7.06), glass, false)
	# вход
	W.box(world, Vector3(4.4, 3.4, 0.4), c + Vector3(0, 1.7, 7.0), W.mat(Color(0.82, 0.62, 0.48)), false)
	W.box(world, Vector3(2.6, 2.6, 0.1), c + Vector3(0, 1.3, 7.22), W.mat(Color(0.45, 0.28, 0.18)), false)
	W.box(world, Vector3(5.0, 0.25, 2.4), c + Vector3(0, 3.6, 8.0), W.mat(Color(0.38, 0.32, 0.34)), false)
	W.label(world, "ШКОЛА № 7", c + Vector3(0, 5.3, 7.1), 260, Color(0.15, 0.2, 0.45))
	# школьный двор и флаг
	W.box(world, Vector3(28, 0.04, 13), c + Vector3(0, 0.02, 13.5), W.mat(Color(0.7, 0.7, 0.72)), false)
	W.box(world, Vector3(0.12, 8, 0.12), c + Vector3(12, 4, 12), W.mat(Color(0.85, 0.85, 0.88)), true)
	W.box(world, Vector3(1.8, 0.4, 0.04), c + Vector3(12.95, 7.6, 12), W.mat(Color(1, 1, 1)), false)
	W.box(world, Vector3(1.8, 0.4, 0.04), c + Vector3(12.95, 7.2, 12), W.mat(Color(0.1, 0.3, 0.8)), false)
	W.box(world, Vector3(1.8, 0.4, 0.04), c + Vector3(12.95, 6.8, 12), W.mat(Color(0.85, 0.15, 0.15)), false)
	for x in [-10.0, 10.0]:
		_bench(c + Vector3(x, 0, 11), 180)

# ═════════ Дом (интерьер)
func _f(name: String, pos: Vector3, rot := 0.0, parent: Node3D = null, collide := true) -> Node3D:
	return W.place(parent if parent else world, "res://assets/furniture/%s.obj" % name, pos, rot, FS, collide, true)

func _room_light(pos: Vector3, energy := 1.0, rng := 6.0) -> void:
	var l := OmniLight3D.new()
	l.position = pos
	l.light_color = Color(1, 0.93, 0.82)
	l.light_energy = energy
	l.omni_range = rng
	l.omni_attenuation = 1.2
	world.add_child(l)
	var lamp := MeshInstance3D.new()
	var sm := SphereMesh.new()
	sm.radius = 0.16
	sm.height = 0.18
	lamp.mesh = sm
	lamp.material_override = W.mat(Color(1, 0.97, 0.9), 0.5, 2.0)
	lamp.position = pos + Vector3(0, 0.15, 0)
	world.add_child(lamp)

func _window(pos: Vector3, yaw: float, size := Vector2(1.3, 1.1)) -> void:
	W.box(world, Vector3(size.x + 0.14, size.y + 0.14, 0.05), pos, W.mat(Color(1, 1, 1)), false, yaw)
	W.box(world, Vector3(size.x, size.y, 0.06), pos, W.mat(Color(0.62, 0.82, 1.0), 0.1, 0.9), false, yaw)

func _floor(center: Vector3, size: Vector2, material: Material, h := 2.7) -> void:
	W.box(world, Vector3(size.x, 0.2, size.y), center + Vector3(0, -0.1, 0), material, true)
	W.box(world, Vector3(size.x, 0.1, size.y), center + Vector3(0, h + 0.05, 0), W.mat(Color(0.96, 0.95, 0.93)), false)

func _build_home() -> void:
	var o := HOME
	var wood := W.tex_mat(W.planks_tex(Color(0.72, 0.5, 0.3)), Vector3(6, 5, 1))
	_floor(o, Vector2(12.4, 10.4), wood)
	var beige := W.mat(Color(0.93, 0.87, 0.76))
	var blue := W.mat(Color(0.7, 0.82, 0.93))
	var green := W.mat(Color(0.78, 0.88, 0.74))
	var white := W.mat(Color(0.95, 0.95, 0.95))
	var v := func(x: float, z: float) -> Vector2: return Vector2(o.x + x, o.z + z)
	W.wall(world, v.call(-6, -5), v.call(6, -5), beige)
	W.wall(world, v.call(-6, 5), v.call(6, 5), beige, [[6.0, 1.0]])
	W.wall(world, v.call(-6, -5), v.call(-6, 5), beige)
	W.wall(world, v.call(6, -5), v.call(6, 5), beige)
	W.wall(world, v.call(-6, 0), v.call(6, 0), beige, [[2.5, 0.95], [6.0, 0.95], [9.5, 0.95]])
	W.wall(world, v.call(-1, -5), v.call(-1, 0), blue)
	W.wall(world, v.call(1, -5), v.call(1, 0), green)
	# окраска комнат: тонкие панели поверх стен
	W.box(world, Vector3(0.02, 2.6, 4.8), o + Vector3(-5.92, 1.3, -2.5), blue, false)
	W.box(world, Vector3(4.8, 2.6, 0.02), o + Vector3(-3.5, 1.3, -4.92), blue, false)
	W.box(world, Vector3(0.02, 2.6, 4.8), o + Vector3(5.92, 1.3, -2.5), green, false)
	W.box(world, Vector3(4.8, 2.6, 0.02), o + Vector3(3.5, 1.3, -4.92), green, false)
	W.box(world, Vector3(1.8, 2.6, 0.02), o + Vector3(0, 1.3, -4.92), white, false)
	# входная дверь (снаружи проёма) и коврик
	W.box(world, Vector3(1.0, 2.15, 0.06), o + Vector3(0, 1.075, 5.12), W.mat(Color(0.42, 0.26, 0.16)), true)
	W.box(world, Vector3(1.0, 0.02, 0.6), o + Vector3(0, 0.01, 4.55), W.mat(Color(0.55, 0.2, 0.2)), false)
	# двери комнат
	_door(o + Vector3(-3.5, 0, 0), true, 0.95, true, "bedroom", 1.0)
	_door(o + Vector3(0, 0, 0), true, 0.95, false, "bathroom", 1.0)
	_door(o + Vector3(3.5, 0, 0), true, 0.95, false, "office", 1.0)
	# окна
	_window(o + Vector3(-5.9, 1.5, -2.5), PI / 2)
	_window(o + Vector3(5.9, 1.5, -2.5), PI / 2)
	_window(o + Vector3(-3.0, 1.5, 4.9), 0)
	_window(o + Vector3(3.5, 1.5, 4.9), 0)
	# моя комната
	_f("bedSingle", o + Vector3(-5.2, 0, -3.3), 180)
	var desk := _f("desk", o + Vector3(-2.2, 0, -4.5))
	_f("chairDesk", o + Vector3(-2.2, 0, -3.75))
	_f("computerScreen", o + Vector3(-2.2, desk.get_meta("size").y, -4.6), 180, null, false)
	_f("computerKeyboard", o + Vector3(-2.2, desk.get_meta("size").y, -4.25), 180, null, false)
	_f("bookcaseOpen", o + Vector3(-1.35, 0, -1.6), 90)
	_f("rugRound", o + Vector3(-3.6, 0, -2.4), 0, null, false)
	_f("lampRoundFloor", o + Vector3(-5.6, 0, -0.5))
	W.label(world, "★ ★ ★", o + Vector3(-3.5, 2.0, -4.9), 90, Color(0.2, 0.3, 0.6))
	items.backpack = _item("backpack", o + Vector3(-5.2, 0.75, -2.5))
	# ванная
	_f("toilet", o + Vector3(0, 0, -4.5), 180)
	_f("bathroomSink", o + Vector3(0.62, 0, -1.6), 90)
	# папин кабинет
	var odesk := _f("desk", o + Vector3(3.6, 0, -4.5))
	_f("chairDesk", o + Vector3(3.6, 0, -3.75))
	_f("laptop", o + Vector3(3.2, odesk.get_meta("size").y, -4.55), 180, null, false)
	_f("bookcaseClosedWide", o + Vector3(5.62, 0, -2.4), 90)
	_f("pottedPlant", o + Vector3(1.45, 0, -4.5))
	items.phone = _item("phone", o + Vector3(4.1, odesk.get_meta("size").y + 0.02, -4.45))
	# кухня
	_f("kitchenStove", o + Vector3(-5.55, 0, 1.3), -90)
	_f("kitchenSink", o + Vector3(-5.55, 0, 2.3), -90)
	_f("kitchenCabinet", o + Vector3(-5.55, 0, 3.3), -90)
	_f("kitchenFridge", o + Vector3(-5.55, 0, 4.4), -90)
	var table := _f("table", o + Vector3(-2.8, 0, 2.8))
	_f("chair", o + Vector3(-2.8, 0, 2.0), 180)
	_f("chair", o + Vector3(-2.8, 0, 3.6), 0)
	_f("chair", o + Vector3(-3.75, 0, 2.8), -90)
	_f("chair", o + Vector3(-1.85, 0, 2.8), 90)
	var th: float = table.get_meta("size").y
	items.apple1 = _item("apple", o + Vector3(-2.6, th + 0.06, 2.7))
	items.apple2 = _item("apple", o + Vector3(-2.95, th + 0.06, 2.95))
	items.cup = _item("cup", o + Vector3(-3.1, th + 0.01, 2.6))
	# гостиная
	_f("loungeSofa", o + Vector3(1.8, 0, 2.6), -90)
	var tvc := _f("cabinetTelevision", o + Vector3(5.6, 0, 2.6), 90)
	_f("televisionModern", o + Vector3(5.62, tvc.get_meta("size").y, 2.6), 90, null, false)
	_f("rugRectangle", o + Vector3(3.7, 0, 2.6), 90, null, false)
	_f("lampRoundFloor", o + Vector3(1.0, 0, 4.4))
	_f("pottedPlant", o + Vector3(5.4, 0, 4.5))
	_f("coatRackStanding", o + Vector3(-0.9, 0, 4.5))
	var tv_glow := W.box(world, Vector3(0.02, 0.5, 0.9), o + Vector3(5.45, tvc.get_meta("size").y + 0.4, 2.6), W.mat(Color(0.5, 0.75, 1.0), 0.2, 1.5), false)
	tv_glow.name = "TV"
	for lp in [Vector3(-3.5, 2.45, -2.5), Vector3(0, 2.45, -2.5), Vector3(3.5, 2.45, -2.5), Vector3(-3, 2.45, 2.5), Vector3(3, 2.45, 2.5)]:
		_room_light(o + lp, 1.1, 6.0)
	# запретная зона: кабинет, пока телефон у папы
	zones.append({"rect": Rect2(o.x + 1.0, o.z - 5.0, 5.0, 5.0), "step": "phone", "guards": ["dad", "mom"],
		"line": "Это куда ты собрался? Телефон получишь в пятницу!", "spawn": o + Vector3(-2.2, 0, 1.0), "yaw": 0.0, "item": "phone"})

# ═════════ Школа (интерьер)
func _build_school() -> void:
	var o := SCHOOL
	var tiles := W.tex_mat(W.tiles_tex(Color(0.85, 0.85, 0.82), Color(0.72, 0.74, 0.78)), Vector3(16, 9, 1))
	_floor(o + Vector3(0, 0, -2.0), Vector2(33, 18.4), tiles, 3.0)
	var corr := W.mat(Color(0.78, 0.88, 0.8))
	var cream := W.mat(Color(0.97, 0.92, 0.8))
	var tan := W.mat(Color(0.9, 0.82, 0.72))
	var v := func(x: float, z: float) -> Vector2: return Vector2(o.x + x, o.z + z)
	var H := 3.0
	W.wall(world, v.call(-16, -1.5), v.call(16, -1.5), corr, [[11.0, 1.0], [21.0, 1.0]], H)
	W.wall(world, v.call(-16, 1.5), v.call(16, 1.5), corr, [[16.0, 6.0]], H, 0.14, 2.8)
	W.wall(world, v.call(-16, -1.5), v.call(-16, 1.5), corr, [], H)
	W.wall(world, v.call(16, -1.5), v.call(16, 1.5), corr, [], H)
	W.wall(world, v.call(-3, 1.5), v.call(-3, 7), corr, [], H)
	W.wall(world, v.call(3, 1.5), v.call(3, 7), corr, [], H)
	W.wall(world, v.call(-3, 7), v.call(3, 7), corr, [[3.0, 1.4]], H)
	W.box(world, Vector3(1.4, 2.15, 0.06), o + Vector3(0, 1.075, 7.12), W.mat(Color(0.45, 0.28, 0.18)), true)
	W.wall(world, v.call(-16, -11), v.call(-16, -1.5), cream, [], H)
	W.wall(world, v.call(-16, -11), v.call(-2, -11), cream, [], H)
	W.wall(world, v.call(-2, -11), v.call(-2, -1.5), cream, [], H)
	W.wall(world, v.call(2, -9), v.call(2, -1.5), tan, [], H)
	W.wall(world, v.call(2, -9), v.call(12, -9), tan, [], H)
	W.wall(world, v.call(12, -9), v.call(12, -1.5), tan, [], H)
	_door(o + Vector3(-5, 0, -1.5), true, 1.0, true, "classroom", -1.0)
	_door(o + Vector3(5, 0, -1.5), true, 1.0, false, "teachers", -1.0)
	W.label(world, "9 «Б»", o + Vector3(-5, 2.45, -1.4), 70, Color(0.15, 0.2, 0.4))
	W.label(world, "УЧИТЕЛЬСКАЯ", o + Vector3(5, 2.45, -1.4), 56, Color(0.15, 0.2, 0.4))
	W.label(world, "ВЫХОД", o + Vector3(0, 2.5, 6.9), 60, Color(0.1, 0.5, 0.2), PI)
	# класс
	W.box(world, Vector3(5.0, 1.3, 0.06), o + Vector3(-9, 1.55, -10.9), W.mat(Color(0.12, 0.3, 0.22), 0.6), false)
	W.label(world, "Алгебра\nx² − 5x + 6 = 0", o + Vector3(-9, 1.6, -10.85), 70, Color(0.95, 0.95, 0.9))
	_f("desk", o + Vector3(-9, 0, -9.3), 180)
	_f("chairDesk", o + Vector3(-9, 0, -10.0), 180)
	for cx in [-13.0, -9.0, -5.0]:
		for rz in [-7.4, -5.4, -3.4]:
			_f("desk", o + Vector3(cx, 0, rz), 180)
			_f("chair", o + Vector3(cx, 0, rz + 0.7), 0)
	for wz in [-9.0, -6.0, -3.5]:
		_window(o + Vector3(-15.9, 1.6, wz), PI / 2, Vector2(1.6, 1.4))
	_f("pottedPlant", o + Vector3(-15.3, 0, -10.4))
	_f("bookcaseClosed", o + Vector3(-2.6, 0, -9.5), 90)
	# учительская
	var tt := _f("table", o + Vector3(6.5, 0, -5.4))
	_f("chair", o + Vector3(6.5, 0, -4.55), 180)
	_f("chair", o + Vector3(6.5, 0, -6.2), 180)
	_f("loungeSofa", o + Vector3(7.0, 0, -8.35), 180)
	var cab := _f("bookcaseClosedWide", o + Vector3(11.55, 0, -5.0), 90)
	_f("pottedPlant", o + Vector3(2.6, 0, -8.4))
	items.tea = _item("cup", o + Vector3(6.3, tt.get_meta("size").y + 0.01, -5.2))
	items.masha_bag = _item("masha_bag", o + Vector3(11.5, cab.get_meta("size").y + 0.22, -5.0))
	_window(o + Vector3(7.0, 1.6, -8.9), 0, Vector2(1.6, 1.3))
	# коридор: шкафчики и плакаты
	var lockers := [Color(0.25, 0.45, 0.75), Color(0.2, 0.6, 0.6), Color(0.85, 0.55, 0.2)]
	for i in 11:
		W.box(world, Vector3(0.55, 1.8, 0.45), o + Vector3(-15.4 + i * 0.6, 0.9, 1.22), W.mat(lockers[i % 3]), true)
		W.box(world, Vector3(0.55, 1.8, 0.45), o + Vector3(4.0 + i * 0.6, 0.9, 1.22), W.mat(lockers[(i + 1) % 3]), true)
	W.box(world, Vector3(1.2, 0.9, 0.03), o + Vector3(-11, 1.6, -1.42), W.mat(Color(0.95, 0.85, 0.3)), false)
	W.label(world, "ЗОЖ!", o + Vector3(-11, 1.6, -1.39), 60, Color(0.6, 0.15, 0.1))
	W.box(world, Vector3(1.2, 0.9, 0.03), o + Vector3(10, 1.6, -1.42), W.mat(Color(0.6, 0.8, 0.95)), false)
	W.label(world, "Расписание", o + Vector3(10, 1.6, -1.39), 44, Color(0.1, 0.2, 0.4))
	for lx in [-12.0, -4.0, 4.0, 12.0]: _room_light(o + Vector3(lx, 2.75, 0), 1.0, 7.0)
	for lp in [Vector3(-12, 2.75, -6.5), Vector3(-6, 2.75, -6.5), Vector3(7, 2.75, -5), Vector3(0, 2.75, 4.5)]: _room_light(o + lp, 1.1, 8.0)
	zones.append({"rect": Rect2(o.x + 2.0, o.z - 9.0, 10.0, 7.5), "step": "bag", "guards": ["zavuch"],
		"line": "Петров! Ученикам в учительскую нельзя. Марш в коридор!", "spawn": o + Vector3(5, 0, 0.6), "yaw": 180.0, "item": "masha_bag"})
	zones.append({"rect": Rect2(o.x + 2.0, o.z - 9.0, 10.0, 7.5), "step": "give_bag", "guards": ["zavuch"],
		"line": "Петров! Что ты тут делаешь? А ну положи!", "spawn": o + Vector3(5, 0, 0.6), "yaw": 180.0, "item": "masha_bag"})

# ═════════ Двери
func _door(center: Vector3, along_x: bool, width: float, open: bool, id: String, swing: float) -> void:
	var hinge := Node3D.new()
	hinge.position = center + (Vector3(-width / 2, 0, 0) if along_x else Vector3(0, 0, -width / 2))
	var base := 0.0 if along_x else -PI / 2
	hinge.rotation.y = base
	world.add_child(hinge)
	W.box(hinge, Vector3(width - 0.04, 2.1, 0.05), Vector3(width / 2, 1.05, 0), W.mat(Color(0.6, 0.4, 0.25)), true)
	W.box(hinge, Vector3(0.05, 0.05, 0.14), Vector3(width - 0.12, 1.0, 0), W.mat(Color(0.85, 0.75, 0.3), 0.3), false)
	var d := {"hinge": hinge, "open": false, "base": base, "swing": swing, "center": center, "id": id}
	doors.append(d)
	if open: _set_door(d, true, false)

func _set_door(d: Dictionary, open: bool, sound := true) -> void:
	d.open = open
	var tw := create_tween()
	tw.tween_property(d.hinge, "rotation:y", d.base + (d.swing * PI * 0.55 if open else 0.0), 0.5)
	if sound: sfx.play_at("door", d.center + Vector3(0, 1.2, 0), -2.0, randf_range(0.9, 1.1))

func _door_by_id(id: String) -> Dictionary:
	for d in doors:
		if d.id == id: return d
	return {}

# ═════════ Предметы
func _item(id: String, pos: Vector3) -> RigidBody3D:
	var rb := RigidBody3D.new()
	rb.add_to_group("grab")
	rb.set_meta("id", id)
	rb.collision_layer = W.L_ITEM
	rb.collision_mask = W.L_WORLD | W.L_ITEM
	rb.mass = 0.4
	rb.continuous_cd = true
	rb.freeze_mode = RigidBody3D.FREEZE_MODE_KINEMATIC
	rb.freeze = true
	rb.contact_monitor = true
	rb.max_contacts_reported = 1
	var size := Vector3(0.1, 0.1, 0.1)
	match id:
		"backpack", "masha_bag":
			var c := Color(0.2, 0.45, 0.85) if id == "backpack" else Color(0.95, 0.45, 0.65)
			size = Vector3(0.34, 0.42, 0.18)
			W.box(rb, size, Vector3.ZERO, W.mat(c), false)
			W.box(rb, Vector3(0.26, 0.18, 0.06), Vector3(0, -0.08, 0.11), W.mat(c.darkened(0.2)), false)
			W.box(rb, Vector3(0.04, 0.38, 0.03), Vector3(-0.1, 0, -0.1), W.mat(Color(0.15, 0.15, 0.18)), false)
			W.box(rb, Vector3(0.04, 0.38, 0.03), Vector3(0.1, 0, -0.1), W.mat(Color(0.15, 0.15, 0.18)), false)
			if id == "masha_bag": W.box(rb, Vector3(0.08, 0.08, 0.02), Vector3(0.08, 0.1, 0.1), W.mat(Color(1, 0.9, 0.3)), false)
		"phone":
			size = Vector3(0.08, 0.012, 0.16)
			W.box(rb, size, Vector3.ZERO, W.mat(Color(0.1, 0.1, 0.12), 0.3), false)
			W.box(rb, Vector3(0.07, 0.002, 0.14), Vector3(0, 0.007, 0), W.mat(Color(0.3, 0.5, 0.9), 0.2, 0.6), false)
		"ball":
			size = Vector3(0.24, 0.24, 0.24)
			var sm := SphereMesh.new()
			sm.radius = 0.12
			sm.height = 0.24
			var mi := MeshInstance3D.new()
			mi.mesh = sm
			mi.material_override = W.mat(Color(0.9, 0.2, 0.2), 0.5)
			rb.add_child(mi)
			var band := MeshInstance3D.new()
			var tm := TorusMesh.new()
			tm.inner_radius = 0.115
			tm.outer_radius = 0.125
			band.mesh = tm
			band.material_override = W.mat(Color(1, 1, 1))
			rb.add_child(band)
		"apple", "cup":
			var path := "res://assets/food/apple.glb" if id == "apple" else "res://assets/food/cup-tea.glb"
			var m := W.instance(path)
			var bb := W.aabb_of(m)
			var k := (0.08 if id == "apple" else 0.1) / maxf(bb.size.x, maxf(bb.size.y, bb.size.z))
			m.scale = Vector3.ONE * k
			m.position = -(bb.position + bb.size / 2) * k
			rb.add_child(m)
			size = bb.size * k
	var cs := CollisionShape3D.new()
	var sh := BoxShape3D.new()
	sh.size = size
	cs.shape = sh
	rb.add_child(cs)
	rb.set_meta("r", size.length() / 2.0)
	rb.set_meta("home", pos)
	world.add_child(rb)
	rb.global_position = pos
	rb.body_entered.connect(func(_b):
		if rb.linear_velocity.length() > 2.5:
			sfx.play_at("drop", rb.global_position, -2.0)
			_noise(rb.global_position, 7.0))
	return rb

func _reset_item(id: String) -> void:
	var rb: RigidBody3D = items[id]
	player.take_away(rb)
	rb.freeze = true
	rb.collision_layer = W.L_ITEM
	rb.visible = true
	rb.global_position = rb.get_meta("home")
	rb.rotation = Vector3.ZERO

# ═════════ Люди
func _npc(id: String, name_: String, model: String, pos: Vector3, yaw: float, sc := 2.5, voice := 1.0) -> NPC:
	var n := NPC.new()
	world.add_child(n)
	n.setup(name_, "res://assets/characters/character-%s.glb" % model, pos, yaw, sc, voice, sfx)
	npcs[id] = n
	return n

func _build_npcs() -> void:
	var h := HOME
	var dad := _npc("dad", "Папа", "male-b", h + Vector3(1.95, 0, 2.6), 90, 2.6, 0.8)
	dad.sit_at(h + Vector3(1.75, 0, 2.6), 90, 0.32)
	dad.fov = 130.0
	var mom := _npc("mom", "Мама", "female-b", h + Vector3(-4.8, 0, 1.4), -90, 2.45, 1.25)
	mom.set_routine([[h + Vector3(-4.8, 0, 1.4), 5.0, -90.0], [h + Vector3(-4.8, 0, 2.3), 4.0, -90.0],
		[h + Vector3(-2.8, 0, 1.4), 3.0, 0.0], [h + Vector3(-4.8, 0, 4.2), 4.0, -90.0]])
	# город
	var p := PARK
	var tema := _npc("tema", "Тёма", "male-c", p + Vector3(-1.0, 0, -2.0), 90, 1.6, 1.6)
	var gosha := _npc("gosha", "Гоша", "male-e", p + Vector3(2.0, 0, -2.0), -90, 2.35, 0.95)
	items.ball = _item("ball", p + Vector3(2.0, 1.0, -1.6))
	gosha.holding = items.ball
	tema.emote("emote-no")
	var gran := _npc("gran", "Бабушка", "female-d", p + Vector3(-6.3, 0, 7.0), 90, 2.3, 1.1)
	gran.sit_at(p + Vector3(-6.3, 0, 7.0), 90, 0.38)
	var seller := _npc("seller", "Продавец", "male-f", Vector3(48.5, 0, -10.6), 0, 2.5, 0.9)
	seller.set_routine([[Vector3(48.5, 0, -10.6), 8.0, 0.0], [Vector3(43.5, 0, -10.6), 6.0, 0.0]])
	var w1 := _npc("walker1", "Прохожий", "male-g", Vector3(-30, 0, -5.6), 90, 2.5, 0.85)
	w1.set_routine([[Vector3(-30, 0, -5.6), 1.0, null], [Vector3(80, 0, -5.6), 2.0, null]])
	w1.speed = 1.2
	var w2 := _npc("walker2", "Прохожая", "female-f", Vector3(110, 0, 5.6), -90, 2.45, 1.2)
	w2.set_routine([[Vector3(110, 0, 5.6), 2.0, null], [Vector3(-40, 0, 5.6), 2.0, null]])
	w2.speed = 1.1
	# школа
	var s := SCHOOL
	_npc("teacher", "Анна Петровна", "female-c", s + Vector3(-9, 0, -10.0), 0, 2.5, 1.15)
	var zav := _npc("zavuch", "Завуч", "female-e", s + Vector3(6.5, 0, -4.55), 0, 2.5, 1.0)
	zav.sit_at(s + Vector3(6.5, 0, -4.55), 0)
	zav.fov = 140.0
	_npc("masha", "Маша", "female-a", s + Vector3(-13, 0, -6.8), 180, 2.3, 1.35).sit_at(s + Vector3(-13, 0, -6.6), 180)
	_npc("dima", "Дима", "male-d", s + Vector3(-5, 0, -6.8), 180, 2.35, 1.05).sit_at(s + Vector3(-5, 0, -6.6), 180)
	_npc("gosha_s", "Гоша", "male-e", s + Vector3(-13, 0, -4.8), 180, 2.35, 0.95).sit_at(s + Vector3(-13, 0, -4.6), 180)
	_npc("kid1", "Лена", "female-f", s + Vector3(-9, 0, -6.8), 180, 2.25, 1.3).sit_at(s + Vector3(-9, 0, -6.6), 180)
	_npc("kid2", "Артём", "male-a", s + Vector3(-5, 0, -4.8), 180, 2.3, 1.1).sit_at(s + Vector3(-5, 0, -4.6), 180)

func _build_marker() -> void:
	marker = Node3D.new()
	var cm := CylinderMesh.new()
	cm.top_radius = 0.18
	cm.bottom_radius = 0.0
	cm.height = 0.34
	var mi := MeshInstance3D.new()
	mi.mesh = cm
	var m := W.unshaded(Color(1.0, 0.85, 0.2, 0.9))
	m.no_depth_test = true
	m.render_priority = 5
	mi.material_override = m
	marker.add_child(mi)
	add_child(marker)

# ═════════ Задания
const STEPS := {
	"backpack": "Возьми свой рюкзак с кровати: поднеси руку и сожми кнопку хвата (на ПК: E).",
	"power": "Стань невидимым: кнопка B или Y (на ПК: Q). Энергии хватает примерно на 35 секунд.",
	"phone": "Папа забрал твой телефон за двойку и унёс в кабинет. Забери его так, чтобы родители тебя не заметили.",
	"leave": "Пора в школу. Выходи через входную дверь.",
	"to_school": "Иди в школу № 7: она в конце улицы, направо.",
	"ball": "В парке Гоша отобрал мяч у малыша Тёмы. Верни Тёме мяч.",
	"class": "Иди в класс 9 «Б» на алгебру. На урок нужно прийти видимым.",
	"masha": "Перемена. Маша плачет в коридоре. Подойди и спроси, что случилось (видимым).",
	"bag": "Гоша закинул рюкзак Маши на шкаф в учительской. Забери его, но завуч не должна тебя видеть.",
	"give_bag": "Отдай рюкзак Маше.",
	"go_home": "Уроки закончились. Иди домой.",
	"dinner": "Родители ждут тебя ужинать. Подойди к столу на кухне.",
	"free": "Глава 1 пройдена! Можешь гулять по городу и пробовать силу. Продолжение следует.",
}

func set_step(id: String) -> void:
	if step != "": steps_done[step] = true
	step = id
	if id != "backpack": sfx.play("ding", -6.0)
	match id:
		"phone": player.toast("Отлично! Теперь тебя никто не видит.\nНо слышат: двери скрипят, а летающие предметы пугают людей.", 6.0)
		"to_school": player.toast("Город. Машины тебя не видят, когда ты невидим, так что переходи дорогу видимым!", 5.0)
		"ball":
			npcs.tema.say("Отдай! Это мой мяч!", 3.0)
			npcs.gosha.say("Ха-ха! Отбери, если сможешь!", 3.0)

func _marker_target() -> Vector3:
	match step:
		"backpack": return items.backpack.global_position + Vector3(0, 0.6, 0)
		"phone": return items.phone.global_position + Vector3(0, 0.5, 0)
		"leave": return HOME + Vector3(0, 2.3, 4.8)
		"to_school", "go_home":
			var dest := SCHOOL_EXT + Vector3(0, 4.0, 7.4) if step == "to_school" else Vector3(0, 3.5, -11.6)
			if area == "school": return SCHOOL + Vector3(0, 2.4, 6.8)
			if area == "home" and step == "to_school": return HOME + Vector3(0, 2.3, 4.8)
			return dest
		"ball": return items.ball.global_position + Vector3(0, 0.5, 0)
		"class": return SCHOOL + Vector3(-5, 2.6, -1.5)
		"masha", "give_bag": return npcs.masha.global_position + Vector3(0, 2.3, 0)
		"bag": return items.masha_bag.global_position + Vector3(0, 0.5, 0)
		"dinner": return HOME + Vector3(-2.8, 1.8, 2.8)
	return Vector3.INF

func _area_of(p: Vector3) -> String:
	if p.x < -200.0: return "home"
	if p.x > 200.0: return "school"
	return "city"

func _enter_area(a: String) -> void:
	area = a
	sfx.set_ambient("city" if a == "city" else "room")
	env.fog_enabled = a == "city"

# ═════════ Переходы через двери
func _use_portal(pt: Dictionary) -> void:
	if pt.id == "home_out" and not steps_done.get("backpack", false):
		player.toast("Ты забыл рюкзак!", 2.0)
		_bounce(pt)
		return
	if pt.id == "home_out" and step in ["power", "phone"]:
		player.toast("Сначала забери телефон из папиного кабинета.", 2.5)
		_bounce(pt)
		return
	if pt.id == "school_out" and step in ["class", "masha", "bag", "give_bag"]:
		player.toast("Уроки ещё не закончились!", 2.0)
		_bounce(pt)
		return
	if pt.id == "school_in" and step in ["go_home", "dinner"]:
		player.toast("Уроки уже закончились. Домой!", 2.0)
		_bounce(pt)
		return
	if pt.id == "home_out" and step == "leave" and not steps_done.get("mom_bye", false):
		player.toast("Мама: Сынок, а попрощаться?..", 2.0)
	busy = true
	sfx.play("door", -3.0)
	await player.fade_to(1.0, 0.3)
	player.teleport(pt.spawn, pt.yaw)
	_enter_area(pt.to)
	portal_cd = 1.0
	if pt.id == "home_out" and step == "leave": set_step("to_school")
	if pt.id == "school_in" and step == "to_school": set_step("class")
	if pt.id == "home_in" and step == "go_home": _evening()
	await player.fade_to(0.0, 0.4)
	busy = false

func _bounce(pt: Dictionary) -> void:
	var back: Vector3 = player.head() - pt.pos
	back.y = 0.0
	player.teleport(pt.pos + back.normalized() * (pt.r + 0.5), rad_to_deg(player.origin.rotation.y))
	portal_cd = 1.0

# ═════════ Главный цикл
func _process(dt: float) -> void:
	if player == null: return
	if not busy: minutes += dt * MIN_PER_SEC
	_apply_time()
	portal_cd -= dt
	bump_cd -= dt
	talk_cd -= dt
	hint_cd -= dt
	suspicion = maxf(0.0, suspicion - dt * 0.4)
	var hp := player.head()
	var a := _area_of(hp)
	if a != area: _enter_area(a)
	# метка задания
	var mt := _marker_target()
	marker.visible = mt != Vector3.INF and _area_of(mt) == area
	if marker.visible:
		marker.global_position = mt + Vector3(0, 0.08 * sin(Time.get_ticks_msec() / 300.0), 0)
		marker.rotation.y += dt * 2.0
	# двери-порталы
	if not busy and portal_cd <= 0.0:
		for pt in portals:
			if pt.area == area and Vector2(hp.x - pt.pos.x, hp.z - pt.pos.z).length() < pt.r:
				_use_portal(pt)
				break
	_update_cars(dt)
	_update_quests()
	_update_watch()
	if suspicion >= 100.0 and not busy: _too_suspicious()

func _update_watch() -> void:
	var bar := func(v: float, n := 10) -> String:
		var k := clampi(roundi(v * n), 0, n)
		return "■".repeat(k) + "□".repeat(n - k)
	var t := "%s  Понедельник\n%s\n\nНевидимость %s\nПодозрение  %s" % [_clock(), STEPS.get(step, ""), bar.call(player.energy), bar.call(suspicion / 100.0)]
	if player.invisible: t += "\n<<  ТЫ НЕВИДИМ  >>"
	player.watch.text = t

func _update_quests() -> void:
	if busy: return
	var hp := player.head()
	match step:
		"leave":
			var mom: NPC = npcs.mom
			if not steps_done.get("mom_bye", false) and not player.invisible and mom.global_position.distance_to(hp) < 2.0 and talk_cd <= 0.0:
				steps_done["mom_bye"] = true
				mom.look_toward(hp)
				mom.say("Удачи в школе, сынок! Бутерброд в рюкзаке.", 4.0)
		"to_school":
			if area == "city" and Vector2(hp.x - PARK.x, hp.z - PARK.z).length() < 24.0 and not steps_done.get("ball", false):
				set_step("ball")
		"ball":
			var gosha: NPC = npcs.gosha
			var ball: RigidBody3D = items.ball
			ball.set_meta("grabbable", player.invisible or gosha.holding != ball)
			if gosha.holding == ball and not player.invisible and gosha.global_position.distance_to(hp) < 2.2 and talk_cd <= 0.0:
				talk_cd = 4.0
				gosha.look_toward(hp)
				gosha.say("Чё надо, Петров? Иди куда шёл.", 3.0)
				if hint_cd <= 0.0:
					hint_cd = 10.0
					player.toast("Отобрать мяч силой не выйдет. Может, стать невидимым?", 3.0)
			var tema: NPC = npcs.tema
			if gosha.holding != ball and ball.global_position.distance_to(tema.global_position + Vector3(0, 0.6, 0)) < 1.4 and not (ball in player.held_items()):
				_ball_returned()
		"class":
			if area == "school" and _in_rect(hp, SCHOOL, Rect2(-16, -11, 14, 9.5)):
				if player.invisible:
					if hint_cd <= 0.0:
						hint_cd = 6.0
						player.toast("Учитель тебя не видит. Стань видимым, чтобы тебя отметили.", 3.0)
				else:
					_lesson()
		"masha":
			var masha: NPC = npcs.masha
			if masha.global_position.distance_to(hp) < 2.2:
				if player.invisible:
					if hint_cd <= 0.0:
						hint_cd = 6.0
						player.toast("Маша тебя не видит. Стань видимым, чтобы поговорить.", 3.0)
				else:
					_masha_talk()
		"give_bag":
			var bag: RigidBody3D = items.masha_bag
			var m2: NPC = npcs.masha
			if bag.global_position.distance_to(m2.global_position + Vector3(0, 0.8, 0)) < 1.5:
				_bag_returned()
		"dinner":
			if hp.distance_to(HOME + Vector3(-2.8, 1.2, 2.8)) < 1.9 and not player.invisible:
				_dinner_talk()

func _in_rect(p: Vector3, origin_: Vector3, r: Rect2) -> bool:
	return r.has_point(Vector2(p.x - origin_.x, p.z - origin_.z))

# ═════════ Восприятие людей
func _physics_process(_dt: float) -> void:
	if player == null or busy: return
	var space := get_world_3d().direct_space_state
	var hp := player.head()
	var held := player.held_items()
	for id in npcs:
		var n: NPC = npcs[id]
		if not n.visible or _area_of(n.global_position) != area: continue
		if n.global_position.distance_to(hp) > 14.0: continue
		# пойман в запретной зоне
		if not player.invisible:
			for z in zones:
				if z.step == step and id in z.guards and (z.rect as Rect2).has_point(Vector2(hp.x, hp.z)) and n.can_see(hp, space):
					_caught(n, z)
					return
		if n.react_cd > 0.0: continue
		# летающий предмет
		if player.invisible:
			for it in held:
				if n.can_see((it as Node3D).global_position, space):
					n.react_cd = 6.0
					n.look_toward((it as Node3D).global_position)
					n.emote("emote-no")
					n.say(["Э?! Оно... летает?!", "Мне это кажется?..", "Ой! Привидение?!", "Что за фокусы?!"].pick_random(), 3.0)
					sfx.play_at("gasp", n.eye(), 0.0, n.pitch)
					_suspect(12.0)
					break
		# столкнулся с невидимкой
		if player.invisible and bump_cd <= 0.0:
			var d := Vector2(n.global_position.x - hp.x, n.global_position.z - hp.z).length()
			if d < 0.6:
				bump_cd = 5.0
				n.react_cd = 4.0
				n.look_toward(hp)
				n.say("Ай! Кто здесь?!", 2.5)
				sfx.play_at("gasp", n.eye(), 0.0, n.pitch)
				_suspect(8.0)

func _suspect(v: float) -> void:
	suspicion += v
	player.pulse_both(0.3, 0.1)

func _noise(pos: Vector3, radius: float) -> void:
	for id in npcs:
		var n: NPC = npcs[id]
		if n.busy or n.global_position.distance_to(pos) > radius: continue
		n.look_toward(pos)

func _caught(n: NPC, z: Dictionary) -> void:
	busy = true
	caught_count += 1
	n.look_toward(player.head())
	n.say(z.line, 3.5)
	sfx.play("fail", -4.0)
	player.flash()
	player.toast("Тебя заметили!", 2.5)
	await get_tree().create_timer(1.6).timeout
	await player.fade_to(1.0, 0.4)
	if z.has("item") and items.has(z.item) and (items[z.item] in player.held_items()): _reset_item(z.item)
	player.teleport(z.spawn, z.yaw)
	await player.fade_to(0.0, 0.4)
	busy = false

func _too_suspicious() -> void:
	busy = true
	sfx.play("fail", -2.0)
	player.toast("Слишком много странностей вокруг тебя...\nЛюди начинают шептаться. Будь осторожнее!", 4.0)
	await get_tree().create_timer(2.0).timeout
	await player.fade_to(1.0, 0.5)
	suspicion = 35.0
	player.set_invisible(false)
	var cp := _checkpoint()
	player.teleport(cp[0], cp[1])
	_enter_area(_area_of(cp[0]))
	await player.fade_to(0.0, 0.5)
	busy = false

func _checkpoint() -> Array:
	match step:
		"backpack", "power", "phone", "leave", "dinner", "free": return [HOME + Vector3(-3.6, 0, -2.0), 180.0]
		"to_school", "ball": return [Vector3(0, 0, -9.6), 180.0]
		"go_home": return [SCHOOL_EXT + Vector3(0, 0, 9.4), 180.0]
	return [SCHOOL + Vector3(0, 0, 5.6), 0.0]

# ═════════ События игрока
func _on_invis(on: bool) -> void:
	if step == "power" and on: set_step("phone")
	if on: return
	# появился из ниоткуда на глазах у людей
	var space := get_world_3d().direct_space_state
	var hp := player.head()
	for id in npcs:
		var n: NPC = npcs[id]
		if _area_of(n.global_position) != area or n.global_position.distance_to(hp) > 7.0: continue
		if n.can_see(hp, space):
			n.look_toward(hp)
			n.say("Ой! Ты откуда взялся?!", 3.0)
			sfx.play_at("gasp", n.eye(), 0.0, n.pitch)
			_suspect(15.0)
			break

func _on_grabbed(it: RigidBody3D) -> void:
	var id: String = it.get_meta("id")
	match id:
		"backpack":
			player.take_away(it)
			it.visible = false
			it.freeze = true
			it.collision_layer = 0
			player.toast("Рюкзак за спиной.", 2.0)
			if step == "backpack": set_step("power")
		"phone":
			player.take_away(it)
			it.visible = false
			it.freeze = true
			it.collision_layer = 0
			sfx.play("success", -4.0)
			player.toast("Телефон снова у тебя! А теперь тихо уходи.", 3.0)
			if step == "phone": set_step("leave")
		"ball":
			var gosha: NPC = npcs.gosha
			if gosha.holding == it:
				gosha.holding = null
				gosha.look_toward(it.global_position)
				gosha.emote("emote-no")
				gosha.say("Э?! Мяч сам улетел?!", 3.0)
				sfx.play_at("gasp", gosha.eye(), 0.0, gosha.pitch)
				_suspect(6.0)
		"masha_bag":
			if step == "bag": set_step("give_bag")

func _on_released(_it: RigidBody3D) -> void:
	pass

func _on_interact(pos: Vector3) -> void:
	var best: Dictionary = {}
	var best_d := 1.4
	for d in doors:
		var c: Vector3 = d.center
		var dist := Vector2(c.x - pos.x, c.z - pos.z).length()
		if dist < best_d and absf(pos.y - 1.0) < 1.5:
			best_d = dist
			best = d
	if best.is_empty(): return
	_set_door(best, not best.open)
	if not player.invisible: return
	# дверь открылась сама: кто видит — удивляется, хозяева идут проверить
	var space := get_world_3d().direct_space_state
	var dc: Vector3 = best.center + Vector3(0, 1.2, 0)
	for id in npcs:
		var n: NPC = npcs[id]
		if _area_of(n.global_position) != area or n.global_position.distance_to(dc) > 9.0 or n.busy: continue
		if id in ["dad", "zavuch"]:
			var door_ref := best
			n.investigate(dc, ["Хм... сквозняк?", "Кто тут балуется?"].pick_random(), func():
				if door_ref.open: _set_door(door_ref, false))
			_suspect(4.0)
		elif n.can_see(dc, space) and n.react_cd <= 0.0:
			n.react_cd = 5.0
			n.look_toward(dc)
			n.say("Дверь сама открылась?..", 2.5)
			_suspect(4.0)

# ═════════ Сценки
func _ball_returned() -> void:
	busy = true
	var tema: NPC = npcs.tema
	var gosha: NPC = npcs.gosha
	var ball: RigidBody3D = items.ball
	player.take_away(ball)
	ball.freeze = true
	ball.collision_layer = 0
	tema.holding = ball
	tema.look_toward(player.head())
	tema.emote("emote-yes")
	tema.say("Мой мячик! Ура!" if player.invisible else "Спасибо! Ты настоящий герой!", 3.5)
	sfx.play("success", -4.0)
	steps_done["ball"] = true
	busy = false
	set_step("to_school")
	await get_tree().create_timer(2.0).timeout
	gosha.say("Ну и ладно... В школу пора.", 3.0)
	gosha.walk_to(SCHOOL_EXT + Vector3(-3, 0, 9), func(): gosha.visible = false)

func _lesson() -> void:
	busy = true
	var t: NPC = npcs.teacher
	t.look_toward(player.head())
	if minutes > 8 * 60 + 30:
		t.say("Петров, ты опоздал! Садись скорее.", 3.5)
	else:
		t.say("Петров, наконец-то. Садись, начинаем.", 3.5)
	await get_tree().create_timer(2.5).timeout
	await player.fade_to(1.0, 0.8)
	player.set_invisible(false)
	player.toast("Урок алгебры...\n45 минут спустя", 3.0)
	minutes = 9 * 60 + 15
	sfx.play("bell", -6.0)
	# перемена: ученики выходят в коридор
	var s := SCHOOL
	for id in ["masha", "dima", "gosha_s", "kid1", "kid2"]: (npcs[id] as NPC).stand()
	npcs.masha.global_position = s + Vector3(7.5, 0, -0.4)
	npcs.masha.rotation.y = 0.0
	npcs.dima.global_position = s + Vector3(-6.5, 0, 0.3)
	npcs.dima.set_routine([[s + Vector3(-6.5, 0, 0.3), 5.0, 0.0], [s + Vector3(-9.5, 0, 0.3), 5.0, 0.0]])
	npcs.gosha_s.global_position = s + Vector3(-13, 0, 0.6)
	npcs.gosha_s.rotation.y = PI / 2
	npcs.kid1.global_position = s + Vector3(-12.2, 0, 0.6)
	npcs.kid1.rotation.y = -PI / 2
	npcs.kid2.global_position = s + Vector3(1.0, 0, 3.5)
	player.teleport(s + Vector3(-5, 0, -2.6), 180)
	await get_tree().create_timer(2.0).timeout
	await player.fade_to(0.0, 0.8)
	busy = false
	set_step("masha")
	npcs.masha.say("(всхлипывает)", 4.0)

func _masha_talk() -> void:
	busy = true
	var m: NPC = npcs.masha
	m.look_toward(player.head())
	m.say("Гоша закинул мой рюкзак на шкаф в учительской...", 3.5)
	await get_tree().create_timer(3.6).timeout
	m.say("А туда нельзя, там завуч сидит. Там вся моя домашка!", 3.5)
	await get_tree().create_timer(3.6).timeout
	busy = false
	set_step("bag")

func _bag_returned() -> void:
	busy = true
	var m: NPC = npcs.masha
	var bag: RigidBody3D = items.masha_bag
	player.take_away(bag)
	bag.freeze = true
	bag.collision_layer = 0
	m.holding = bag
	if player.invisible:
		m.emote("emote-no")
		m.say("Он... сам прилетел?! Мне страшно...", 3.5)
		sfx.play_at("gasp", m.eye(), 0.0, m.pitch)
		_suspect(10.0)
	else:
		m.emote("emote-yes")
		m.say("Мой рюкзак! Спасибо!!! Как ты это сделал?", 3.5)
	sfx.play("success", -4.0)
	await get_tree().create_timer(3.8).timeout
	await player.fade_to(1.0, 0.8)
	minutes = 14 * 60 + 10
	sfx.play("bell", -6.0)
	player.toast("Остальные уроки пролетели незаметно.", 3.0)
	await get_tree().create_timer(1.5).timeout
	await player.fade_to(0.0, 0.8)
	busy = false
	set_step("go_home")

func _evening() -> void:
	minutes = 18 * 60 + 40
	var h := HOME
	var dad: NPC = npcs.dad
	var mom: NPC = npcs.mom
	mom.set_routine([])
	mom.target = Vector3.INF
	dad.sit_at(h + Vector3(-2.8, 0, 3.75), 180)
	mom.sit_at(h + Vector3(-3.95, 0, 2.8), 90)
	set_step("dinner")

func _dinner_talk() -> void:
	busy = true
	var mom: NPC = npcs.mom
	var dad: NPC = npcs.dad
	mom.say("Как прошёл день, сынок?", 3.0)
	await get_tree().create_timer(3.2).timeout
	dad.say("Кстати, ты не видел мой... хотя ладно. Ешь давай.", 3.5)
	await get_tree().create_timer(3.8).timeout
	sfx.play("success", -2.0)
	player.toast("Конец первого дня.\nТвою тайну не знает никто в целом мире.\nПодозрение: %d%%   Попадался: %d раз" % [int(suspicion), caught_count], 7.0)
	busy = false
	set_step("free")

# ═════════ Машины
func _update_cars(dt: float) -> void:
	var hp := player.head()
	for c in cars:
		var n: Node3D = c.node
		var dir: float = c.dir
		var want: float = c.max
		# видимого человека на дороге водитель видит и тормозит
		var ahead := (hp.x - n.position.x) * dir
		var on_lane := absf(hp.z - n.position.z) < 2.4
		if area == "city" and on_lane and ahead > 0.0 and ahead < 14.0:
			if not player.invisible:
				want = 0.0
				c.honk = float(c.honk) - dt
				if c.honk <= 0.0:
					c.honk = 4.0
					sfx.play_at("horn", n.position + Vector3(0, 1, 0), 0.0)
		c.speed = move_toward(c.speed, want, dt * (9.0 if want < c.speed else 3.0))
		n.position.x += dir * float(c.speed) * dt
		if n.position.x > 150.0: n.position.x = -90.0
		if n.position.x < -90.0: n.position.x = 150.0
		# наезд
		if area == "city" and not busy and absf(hp.x - n.position.x) < 2.3 and absf(hp.z - n.position.z) < 1.2 and c.speed > 2.0:
			_hit_by_car(n)

func _hit_by_car(n: Node3D) -> void:
	busy = true
	sfx.play("horn", 2.0)
	player.flash()
	player.toast("Машина тебя не видела!\nНевидимым на дороге опасно.", 3.5)
	await player.fade_to(1.0, 0.3)
	player.teleport(Vector3(player.head().x, 0, -5.8 if player.head().z < 0 else 5.8), rad_to_deg(player.origin.rotation.y))
	await get_tree().create_timer(0.5).timeout
	await player.fade_to(0.0, 0.5)
	busy = false

# ═════════ Автотест: godot --headless --xr-mode off -- --selftest
func _wait(sec: float) -> void:
	await get_tree().create_timer(sec).timeout

func _walk_into(p: Vector3) -> void:
	player.teleport(p, 0)
	await _wait(0.6)
	while busy: await _wait(0.2)

func _selftest() -> void:
	var log := []
	var ok := true
	await _wait(0.5)
	player.force_hold(items.backpack)
	await _wait(0.2)
	log.append("backpack -> " + step); ok = ok and step == "power"
	player.set_invisible(true)
	await _wait(0.2)
	log.append("power -> " + step); ok = ok and step == "phone"
	# видимым в кабинет при открытой двери — папа ловит
	player.set_invisible(false)
	_set_door(_door_by_id("office"), true, false)
	await _wait(0.6)
	player.teleport(HOME + Vector3(4.4, 0, -1.6), 180)
	await _wait(1.0)
	while busy: await _wait(0.2)
	log.append("caught in office: %d" % caught_count); ok = ok and caught_count == 1
	player.energy = 1.0
	player.set_invisible(true)
	player.teleport(HOME + Vector3(4.1, 0, -3.8), 180)
	await _wait(0.3)
	player.force_hold(items.phone)
	await _wait(0.2)
	log.append("phone -> " + step); ok = ok and step == "leave"
	player.set_invisible(false)
	await _walk_into(HOME + Vector3(0, 0, 4.95))
	log.append("left home -> area=%s step=%s" % [area, step]); ok = ok and area == "city" and step == "to_school"
	player.teleport(PARK + Vector3(-12, 0, -8), 0)
	await _wait(0.3)
	log.append("near park -> " + step); ok = ok and step == "ball"
	player.energy = 1.0
	player.set_invisible(true)
	player.teleport(npcs.gosha.global_position + Vector3(0.9, 0, 0.9), 0)
	await _wait(0.2)
	player.force_hold(items.ball)
	await _wait(0.2)
	player.teleport(npcs.tema.global_position + Vector3(0.8, 0, 0.6), 0)
	await _wait(0.2)
	items.ball.global_position = npcs.tema.global_position + Vector3(0.4, 0.6, 0)
	player.force_drop()
	items.ball.global_position = npcs.tema.global_position + Vector3(0.4, 0.6, 0)
	await _wait(0.5)
	log.append("ball -> " + step); ok = ok and step == "to_school"
	player.set_invisible(false)
	suspicion = 0.0
	await _walk_into(SCHOOL_EXT + Vector3(0, 0, 7.4))
	log.append("school -> area=%s step=%s" % [area, step]); ok = ok and area == "school" and step == "class"
	await _walk_into(SCHOOL + Vector3(-5, 0, -3.0))
	await _wait(0.5)
	while busy: await _wait(0.2)
	log.append("lesson -> " + step); ok = ok and step == "masha"
	player.teleport(npcs.masha.global_position + Vector3(0, 0, 1.5), 180)
	await _wait(0.4)
	while busy: await _wait(0.3)
	log.append("masha -> " + step); ok = ok and step == "bag"
	player.energy = 1.0
	player.set_invisible(true)
	player.teleport(SCHOOL + Vector3(10.6, 0, -5.0), -90)
	await _wait(0.2)
	player.force_hold(items.masha_bag)
	log.append("bag -> " + step); ok = ok and step == "give_bag"
	player.set_invisible(false)
	player.teleport(npcs.masha.global_position + Vector3(0, 0, 0.9), 180)
	await _wait(0.1)
	player.force_drop()
	items.masha_bag.global_position = npcs.masha.global_position + Vector3(0, 0.8, 0.5)
	await _wait(0.5)
	while busy: await _wait(0.3)
	log.append("give_bag -> " + step); ok = ok and step == "go_home"
	await _walk_into(SCHOOL + Vector3(0, 0, 6.95))
	await _walk_into(Vector3(0, 0, -11.6))
	log.append("home -> area=%s step=%s" % [area, step]); ok = ok and area == "home" and step == "dinner"
	player.teleport(HOME + Vector3(-2.8, 0, 1.4), 180)
	await _wait(0.5)
	while busy: await _wait(0.3)
	log.append("dinner -> " + step); ok = ok and step == "free"
	for l in log: print(l)
	print("SELFTEST ", "OK" if ok else "FAILED")
	get_tree().quit(0 if ok else 1)

# Снимки для проверки картинки: godot --xr-mode off -- --shot
func _shots() -> void:
	_shots_mode = true
	var dir := ProjectSettings.globalize_path("res://build/")
	var views := [
		["bedroom", HOME + Vector3(-1.6, 0, -0.6), HOME + Vector3(-5.2, 0.6, -3.5)],
		["living", HOME + Vector3(-0.6, 0, 4.3), HOME + Vector3(3.5, 0.8, 1.0)],
		["kitchen", HOME + Vector3(-0.6, 0, 1.0), HOME + Vector3(-5.0, 0.9, 3.0)],
		["street", Vector3(-14, 0, 2.5), Vector3(10, 2.0, -10)],
		["park", PARK + Vector3(-12, 0, -9), PARK + Vector3(2, 1.0, -1)],
		["school", SCHOOL_EXT + Vector3(-12, 0, 24), SCHOOL_EXT + Vector3(0, 4, 4)],
		["classroom", SCHOOL + Vector3(-3.0, 0, -2.2), SCHOOL + Vector3(-11, 1.0, -9)],
		["teachers", SCHOOL + Vector3(3.2, 0, -2.2), SCHOOL + Vector3(9, 1.0, -6.5)],
	]
	for v in views:
		var from: Vector3 = v[1]
		var to: Vector3 = v[2]
		var d := to - from
		player.teleport(from, rad_to_deg(atan2(-d.x, -d.z)))
		player.pitch = atan2(to.y - 1.6, Vector2(d.x, d.z).length())
		_enter_area(_area_of(from))
		for i in 25: await get_tree().process_frame
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(dir + "shot_%s.png" % v[0])
	player.set_invisible(true)
	player.teleport(HOME + Vector3(2.8, 0, -1.0), 180)
	_enter_area("home")
	for i in 25: await get_tree().process_frame
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(dir + "shot_invisible.png")
	get_tree().quit()
