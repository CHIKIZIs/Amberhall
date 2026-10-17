extends Node3D
## Тихая Гавань — главный скрипт: сцена, камера (от первого лица / сверху),
## ввод, ловля с вываживанием, лодка.

const COST := [60, 150, 350, 800, 1800]
const MAXLV := 5
const PIER_POS := Vector3(-2.75, 1.6, 6.4)
const MOOR := Vector3(1.0, 0.0, -0.3)
const CAM_DIR := Vector3(1.0, 1.08, 1.0)
const CAM_DIST := 52.0
const PIER_CAM := Vector3(-2.2, 0.0, -1.2)
const EYE := 1.78
const SAVE_PATH := "user://save.json"

var water: Water
var world: World
var boat: Boat
var fisher: Fisher
var fp: FPRig
var line: Fisher.Line
var bobber: Node3D
var cam: Camera3D
var sun: DirectionalLight3D
var env: Environment
var ui: UI
var water_anchor := Node3D.new()
var cam_t := PIER_CAM
var thumbs := {}

var save := {"coins": 0, "up": {"rod": 0, "bait": 0, "line": 0}, "dex": {}, "mute": false, "view": "fp"}
var st := "loading"
var view := "fp"
var t := 0.0
var power := 0.0
var pdir := 1.0
var holding := false
var aim_dir := Vector3(1, 0, 0.3).normalized()
var look_yaw := 0.25
var look_pitch := -0.2
var target := Vector3.ZERO
var bob_pos := Vector3.ZERO
var bob_vel := Vector3.ZERO
var fly_t := 0.0
var wait_t := 0.0
var wait_e := 0.0
var bite_t := 0.0
var bite_win := 1.2
var cur: Dictionary = {}
var cast_pow := 0.0
var cast_dist := 8.0
var fish_node: Node3D
var fish_from := Vector3.ZERO
var fight: Fight
var fight_off := 0.0
var leap_t := -1.0
var leap_from := Vector3.ZERO
var jump_t := 0.0
var rod_a := 1.0
var on_boat := false
var steering := false
var autopilot := false
var ambient: Array[Node3D] = []
var fleeing: Array = []
var gulls: Array = []
var aim_ring: MeshInstance3D
var sfx := {}
var motor: AudioStreamPlayer
var auto_dir := ""
# ввод
var pointer_down := false
var press_pos := Vector2.ZERO
var press_t := 0.0
var dragging := false
var last_drag := -10.0
var side_in := 0.0
var _thrash_t := 0.0
var _click_t := 0.0
var _gull_t := 4.0


func _ready() -> void:
	Mats.init()
	Fishes.init()
	_load()
	view = save.get("view", "fp")
	_env()
	water = Water.new()
	add_child(water)
	add_child(water_anchor)
	water.follow = water_anchor
	_sync_sky_to_water()
	world = World.new()
	add_child(world)
	world.build(water)
	boat = Boat.new()
	boat.water = water
	boat.position = MOOR
	add_child(boat)
	boat.arrived.connect(_on_arrived)
	boat.stuck.connect(func(): ui.toast("Здесь мелко — дальше не проплыть"))
	fisher = Fisher.new()
	add_child(fisher)
	fisher.position = PIER_POS
	fp = FPRig.new()
	cam.add_child(fp)
	line = Fisher.Line.new()
	line.water = water
	line.cam = cam
	add_child(line)
	_make_bobber()
	_make_aim_ring()
	_spawn_life()
	_audio()
	ui = UI.new()
	add_child(ui)
	ui.save_ref = save
	ui.cost_ref = COST
	ui.set_coins(save.coins)
	ui.set_sound(not save.mute)
	ui.set_view(view == "fp")
	ui.shop_buy.connect(_buy)
	ui.boat_action.connect(_boat_action)
	ui.result_closed.connect(_result_closed)
	ui.view_toggled.connect(_toggle_view)
	ui.sound_toggled.connect(func():
		save.mute = not save.mute
		ui.set_sound(not save.mute)
		AudioServer.set_bus_mute(0, save.mute)
		_persist())
	AudioServer.set_bus_mute(0, save.mute)
	_apply_view()
	ui.set_hint("Загрузка гавани…")
	thumbs = await Thumbs.render_all(self)
	ui.thumbs = thumbs
	st = "idle"
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--autotest="):
			auto_dir = a.substr(11)
			_autotest()


# ───────── окружение ─────────
func _env() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	var sky := Sky.new()
	var sm := ShaderMaterial.new()
	sm.shader = load("res://shaders/sky.gdshader")
	var fn := FastNoiseLite.new()
	fn.noise_type = FastNoiseLite.TYPE_SIMPLEX_SMOOTH
	fn.frequency = 0.006
	fn.fractal_octaves = 5
	var ct := NoiseTexture2D.new()
	ct.width = 512
	ct.height = 512
	ct.seamless = true
	ct.noise = fn
	sm.set_shader_parameter("clouds", ct)
	sky.sky_material = sm
	sky.process_mode = Sky.PROCESS_MODE_QUALITY
	sky.radiance_size = Sky.RADIANCE_SIZE_128
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.ambient_light_energy = 1.15
	env.ambient_light_color = Color("#ffd9bd")
	env.ambient_light_sky_contribution = 0.55
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.05
	env.glow_enabled = true
	env.glow_intensity = 0.65
	env.glow_bloom = 0.05
	env.glow_hdr_threshold = 1.7
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.12
	env.adjustment_contrast = 1.05
	env.fog_enabled = true
	env.fog_light_color = Color("#e8b896")
	env.fog_sun_scatter = 0.25
	env.fog_density = 0.0
	env.fog_sky_affect = 0.0
	env.fog_aerial_perspective = 0.2
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.light_color = Color("#ffcf96")
	sun.light_energy = 1.4
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 90.0
	sun.shadow_blur = 1.5
	add_child(sun)
	sun.look_at_from_position(Vector3(90, 48, -70), Vector3.ZERO)
	cam = Camera3D.new()
	cam.far = 2600.0
	cam.near = 0.05
	add_child(cam)


func _sync_sky_to_water() -> void:
	var to_sun := sun.global_transform.basis.z.normalized()
	water.mat.set_shader_parameter("sun_dir", to_sun)


func _toggle_view() -> void:
	if st != "idle" and st != "wait":
		return
	view = "iso" if view == "fp" else "fp"
	save.view = view
	_persist()
	_apply_view()


func _apply_view() -> void:
	ui.set_view(view == "fp")
	fp.visible = view == "fp"
	fisher.visible = view == "iso"
	cam.fov = 62.0 if view == "fp" else 24.0
	env.fog_density = 0.0016 if view == "fp" else 0.0


func eye_pos() -> Vector3:
	if on_boat:
		return boat.seat.global_transform * Vector3(0, EYE, 0)
	return PIER_POS + Vector3(0, EYE, 0)


func look_dir() -> Vector3:
	return Vector3(cos(look_yaw), 0, sin(look_yaw))


func _place_cam(dt: float) -> void:
	if view == "fp":
		# автоматически следим за поплавком, если игрок не крутит обзор
		if st in ["wait", "bite", "fight", "jump"] and t - last_drag > 1.2:
			var d := bob_pos - eye_pos()
			var want_yaw := atan2(d.z, d.x)
			look_yaw += wrapf(want_yaw - look_yaw, -PI, PI) * min(1.0, dt * 2.0)
			var want_pitch := clampf(atan2(d.y - 0.6, Vector2(d.x, d.z).length()), -0.7, 0.1)
			look_pitch = lerpf(look_pitch, want_pitch, min(1.0, dt * 1.5))
		var e := eye_pos() + Vector3(0, sin(t * 1.6) * 0.012, 0)
		cam.position = e
		var fwd := look_dir() * cos(look_pitch) + Vector3(0, sin(look_pitch), 0)
		cam.look_at(e + fwd)
		water_anchor.global_position = e
	else:
		var goal := Vector3(boat.position.x - 2.5, 0, boat.position.z - 1.5) if on_boat else PIER_CAM
		cam_t = cam_t.lerp(goal, min(1.0, dt * 2.0))
		cam.position = cam_t + CAM_DIR.normalized() * CAM_DIST
		cam.look_at(cam_t)
		water_anchor.global_position = cam_t
	var focus := focus_point()
	sun.global_position = focus + Vector3(90, 48, -70)


func focus_point() -> Vector3:
	if view == "fp":
		var p := eye_pos() + look_dir() * 12.0
		p.y = 0
		return p
	return cam_t + Vector3(6, 0, 6)


# ───────── поплавок, прицел ─────────
func _make_bobber() -> void:
	bobber = Node3D.new()
	add_child(bobber)
	var top := PackedVector2Array([Vector2(0.0, 0.0), Vector2(0.13, 0.0), Vector2(0.11, 0.1), Vector2(0.05, 0.2), Vector2(0.0, 0.24)])
	var bot := PackedVector2Array([Vector2(0.0, -0.3), Vector2(0.05, -0.22), Vector2(0.11, -0.1), Vector2(0.13, 0.0), Vector2(0.0, 0.0)])
	Mats.mi(Geo.lathe(top, 16), Mats.std(Color("#e0412f"), 0.3), bobber)
	Mats.mi(Geo.lathe(bot, 16), Mats.std(Color("#f4efe6"), 0.3), bobber)
	Mats.mi(Geo.cylinder(0.015, 0.012, 0.35, 6), Mats.std(Color("#ff8a2a"), 0.4, 0.0, {"emission_enabled": true, "emission": Color("#ff6a1a"), "emission_energy_multiplier": 1.4}), bobber, Vector3(0, 0.38, 0))
	bobber.visible = false


func _make_aim_ring() -> void:
	aim_ring = MeshInstance3D.new()
	var tm := TorusMesh.new()
	tm.inner_radius = 0.55
	tm.outer_radius = 0.68
	tm.rings = 32
	aim_ring.mesh = tm
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = Color(1, 0.9, 0.65, 0.85)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	aim_ring.material_override = m
	aim_ring.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	aim_ring.scale = Vector3(1, 0.2, 1)
	aim_ring.visible = false
	add_child(aim_ring)


# ───────── жизнь вокруг ─────────
func _spawn_life() -> void:
	var kinds := ["sprat", "herring", "scad", "mackerel", "smelt", "mullet", "flounder", "redfish", "sprat", "wrasse", "goby", "herring"]
	for i in kinds.size():
		var f := Fishes.by_id(kinds[i])
		var m := Fishes.build(f)
		m.scale = Vector3.ONE * f.vs * 0.9
		m.position = Vector3(randf_range(2, 20), -randf_range(0.6, 1.5), randf_range(-8, 16))
		m.set_meta("h", randf() * TAU)
		m.set_meta("sp", randf_range(0.6, 1.3))
		add_child(m)
		ambient.append(m)
	var g1 := world.make_gull()
	g1.position = Vector3(-2.15, 1.75, -6.5)
	g1.rotation.y = 0.6
	world.fold_wings(g1)
	var g2 := world.make_gull()
	g2.reparent(boat.rig, false)
	g2.position = Vector3(0.2, 2.45, -1.2)
	g2.rotation.y = 2.4
	world.fold_wings(g2)
	var g3 := world.make_gull()
	world.fold_wings(g3)
	g3.position = Vector3(9, 0, -7)
	gulls.append({"n": g3, "mode": "float", "v": Vector3.ZERO})
	for i in 3:
		var g := world.make_gull()
		g.scale = Vector3.ONE * 1.15
		gulls.append({"n": g, "mode": "fly", "ph": i * 2.1, "r": 9.0 + i * 4.0})


func _audio() -> void:
	for n in ["splash", "plop", "bite", "click", "whoosh", "win", "lose", "buy", "gull"]:
		var p := AudioStreamPlayer.new()
		p.stream = load("res://sfx/%s.wav" % n)
		add_child(p)
		sfx[n] = p
	var waves := AudioStreamPlayer.new()
	var ws: AudioStreamWAV = load("res://sfx/waves.wav")
	ws.loop_mode = AudioStreamWAV.LOOP_FORWARD
	ws.loop_end = ws.data.size() / 2
	waves.stream = ws
	waves.volume_db = -8.0
	add_child(waves)
	waves.play()
	motor = AudioStreamPlayer.new()
	var ms: AudioStreamWAV = load("res://sfx/motor.wav")
	ms.loop_mode = AudioStreamWAV.LOOP_FORWARD
	ms.loop_end = ms.data.size() / 2
	motor.stream = ms
	motor.volume_db = -60.0
	add_child(motor)
	motor.play()


func play(n: String, vol := 0.0, pitch := 1.0) -> void:
	var p: AudioStreamPlayer = sfx[n]
	p.volume_db = vol
	p.pitch_scale = pitch
	p.play()


func buzz(ms: int) -> void:
	Input.vibrate_handheld(ms)


func splash_fx(pos: Vector3, amount: int, power_k: float) -> void:
	var p := CPUParticles3D.new()
	p.one_shot = true
	p.explosiveness = 0.92
	p.amount = amount
	p.lifetime = 0.9
	p.mesh = Geo.sphere(0.05, 6, 4)
	p.material_override = Mats.std(Color(0.9, 0.97, 0.96), 0.15)
	p.direction = Vector3.UP
	p.spread = 35.0
	p.initial_velocity_min = 2.0 * power_k
	p.initial_velocity_max = 4.5 * power_k
	p.gravity = Vector3(0, -9.8, 0)
	p.scale_amount_min = 0.5
	p.scale_amount_max = 1.4
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	p.emission_sphere_radius = 0.15 * power_k
	p.position = pos
	add_child(p)
	p.emitting = true
	get_tree().create_timer(1.6).timeout.connect(p.queue_free)


# ───────── сохранение ─────────
func _load() -> void:
	if FileAccess.file_exists(SAVE_PATH):
		var d = JSON.parse_string(FileAccess.get_file_as_string(SAVE_PATH))
		if d is Dictionary:
			for k in d:
				save[k] = d[k]
	for k in ["rod", "bait", "line"]:
		save.up[k] = int(save.up.get(k, 0))
	save.coins = int(save.coins)


func _persist() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f:
		f.store_string(JSON.stringify(save))


func _buy(k: String) -> void:
	var lv: int = save.up[k]
	if lv < MAXLV and save.coins >= COST[lv]:
		save.coins -= COST[lv]
		save.up[k] = lv + 1
		_persist()
		play("buy")
		ui.set_coins(save.coins)
		ui.open_shop()


# ───────── зоны и запреты ─────────
func far(v: Vector3) -> float:
	return clampf((Vector2(v.x - 1, v.z).length() - 9.0) / 32.0, 0.0, 1.0)


func zone_bit(v: Vector3) -> int:
	var f := far(v)
	return Fishes.PIER if f < 0.15 else (Fishes.BAY if f < 0.6 else Fishes.SEA)


func zone_name(v: Vector3) -> String:
	var z := zone_bit(v)
	return "У пирса" if z == Fishes.PIER else ("Залив · редкая рыба" if z == Fishes.BAY else "Открытое море · трофеи")


func blocked(x: float, z: float) -> bool:
	return (x < -0.3 and z < 12.2 and z > -46.0) or x < -22.0 or x > 50.0 or z < -44.0 or z > 50.0


func fisher_pos() -> Vector3:
	if on_boat:
		return boat.seat.global_position
	return PIER_POS


# ───────── ввод ─────────
func _water_point(sp: Vector2) -> Variant:
	var o := cam.project_ray_origin(sp)
	var d := cam.project_ray_normal(sp)
	if abs(d.y) < 0.0001:
		return null
	var k := -o.y / d.y
	return o + d * k if k > 0 else null


func _aim_iso(sp: Vector2) -> void:
	var p = _water_point(sp)
	if p == null:
		return
	var d: Vector3 = p - fisher_pos()
	d.y = 0
	if d.length() < 0.6:
		return
	aim_dir = d.normalized()


func _unhandled_input(e: InputEvent) -> void:
	if ui == null or ui.any_open() or st == "loading":
		return
	if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if e.pressed:
			pointer_down = true
			holding = true
			press_pos = e.position
			press_t = t
			dragging = false
			side_in = 0.0
			if st == "bite":
				_start_fight()
			elif view == "iso" and st == "idle":
				_aim_iso(e.position)
		else:
			pointer_down = false
			holding = false
			side_in = 0.0
			if st == "charge":
				_cast()
			elif not dragging and t - press_t < 0.3:
				_tap(e.position)
	elif e is InputEventMouseMotion and pointer_down:
		if (e.position - press_pos).length() > 16.0:
			dragging = true
		if st == "fight":
			side_in = clampf((e.position.x - press_pos.x) / 170.0, -1.0, 1.0)
		elif view == "fp" and dragging:
			look_yaw += e.relative.x * 0.0045
			look_pitch = clampf(look_pitch - e.relative.y * 0.0035, -0.8, 0.2)
			last_drag = t
		elif view == "iso" and st == "charge":
			_aim_iso(e.position)


func _tap(sp: Vector2) -> void:
	if st == "idle" and steering:
		_set_dest(sp)


# ───────── ловля ─────────
func cast_target(p: float) -> Vector3:
	var fpp := fisher_pos()
	var dir := look_dir() if view == "fp" else aim_dir
	var tg := fpp + dir * (3.5 + p * 16.0)
	tg.y = 0
	if not on_boat:
		if tg.x > -0.9 and tg.x < 3.4 and tg.z > -5.3 and tg.z < 4.8:
			tg.z = 4.9
		tg.x = max(tg.x, -0.6)
	else:
		var d := Vector3(tg.x - boat.position.x, 0, tg.z - boat.position.z)
		if d.length() < 3.4:
			tg = boat.position + d.normalized() * 3.4
			tg.y = 0
		if tg.x < -1.0 and tg.z < 9.0:
			tg.x = -1.0
	return tg


func pick_fish(pw: float, zbit: int) -> Dictionary:
	var tot := 0.0
	var ws := []
	for f in Fishes.LIST:
		var x := 0.0
		if f.zone & zbit:
			x = f.wt
			if f.tier >= 2:
				x *= 1.0 + save.up.bait * 0.3
			if f.tier >= 1:
				x *= 1.0 + pw * 0.6
		tot += x
		ws.append(x)
	var r := randf() * tot
	for i in Fishes.LIST.size():
		r -= ws[i]
		if r <= 0 and ws[i] > 0:
			return Fishes.LIST[i]
	return Fishes.LIST[0]


func _cast() -> void:
	st = "fly"
	fly_t = 0.0
	play("whoosh", -4.0)
	cast_pow = max(power, 0.08)
	target = cast_target(cast_pow)
	cast_dist = Vector2(target.x - fisher_pos().x, target.z - fisher_pos().z).length()
	cur = pick_fish(cast_pow, zone_bit(target))
	aim_ring.visible = false
	var tip := _tip()
	bob_pos = tip
	var tt := 0.95
	bob_vel = (target - tip) / tt - Vector3(0, -9.8, 0) * tt * 0.5
	bobber.visible = true
	line.active = true
	line.reset(tip)


func _tip() -> Vector3:
	return fp.tip.global_position if view == "fp" else fisher.tip.global_position


func _land() -> void:
	st = "wait"
	play("splash", -6.0, 1.3)
	play("plop", -4.0)
	water.ripple(target, 0.16)
	splash_fx(target, 14, 0.7)
	bob_vel = Vector3.ZERO
	wait_t = randf_range(2.5, 6.0) * (1.0 - 0.1 * save.up.bait)
	wait_e = 0.0
	bite_win = 1.2 + 0.12 * save.up.line
	fish_node = Fishes.build(cur)
	fish_node.scale = Vector3.ONE * cur.vs
	add_child(fish_node)
	var a := randf() * TAU
	fish_from = target + Vector3(cos(a), 0, sin(a)) * 6.0
	if blocked(fish_from.x, fish_from.z):
		fish_from = target - Vector3(cos(a), 0, sin(a)) * 6.0
	fish_from.y = -0.7
	fish_node.position = fish_from


func _drop_fish() -> void:
	if fish_node:
		fish_node.queue_free()
		fish_node = null


func _retract() -> void:
	st = "idle"
	bobber.visible = false
	line.active = false
	_drop_fish()


func _bite() -> void:
	st = "bite"
	bite_t = 0.0
	play("bite")
	buzz(90)
	water.ripple(bob_pos, 0.1)
	splash_fx(bob_pos, 6, 0.5)


func _start_fight() -> void:
	st = "fight"
	fight = Fight.new(cur, cast_dist, save.up.rod, save.up.line)
	fight_off = 0.0
	leap_t = -1.0
	ui.fight = fight
	ui.toast(Fishes.TIER_NAMES[cur.tier] + " рыба на крючке!" if not cur.junk else "Что-то зацепилось…")
	holding = true
	Fishes.set_swim(fish_node, 16.0, 0.13)


func _fail(msg: String) -> void:
	st = "idle"
	bobber.visible = false
	line.active = false
	play("lose", -3.0)
	buzz(70)
	ui.toast(msg)
	fight = null
	if fish_node:
		var d := Vector3(randf_range(-1, 1), 0, randf_range(0.2, 1)).normalized()
		fleeing.append({"n": fish_node, "d": d, "t": 0.0})
		Fishes.set_swim(fish_node, 22.0, 0.12)
		fish_node = null


func _win() -> void:
	st = "jump"
	jump_t = 0.0
	bobber.visible = false
	line.active = false
	fight = null
	play("splash", -2.0, 0.9)
	play("win", -4.0)
	buzz(120)
	water.ripple(bob_pos, 0.22)
	splash_fx(bob_pos, 30, 1.2)
	fish_from = bob_pos


func _show_result() -> void:
	var f := cur
	var w: float = f.min + pow(randf(), 1.6) * (f.max - f.min)
	var coins := int(round(f.v * (0.8 + 0.4 * (w - f.min) / (f.max - f.min))))
	var first: bool = not save.dex.has(f.id)
	var d: Dictionary = save.dex.get(f.id, {"n": 0, "best": 0.0})
	d.n = int(d.n) + 1
	d.best = max(float(d.best), w)
	save.dex[f.id] = d
	save.coins += coins
	_persist()
	ui.set_coins(save.coins)
	st = "result"
	if fish_node and view == "fp":
		fish_node.visible = false
	var model := Fishes.build(f)
	Fishes.set_swim(model, 9.0, 0.08)
	ui.show_result(model, f, w, coins, first)


func _result_closed() -> void:
	_drop_fish()
	st = "idle"


# ───────── лодка ─────────
func _boat_action(what: String) -> void:
	match what:
		"board":
			if st != "idle":
				return
			on_boat = true
			steering = true
			fisher.reparent(boat.seat, false)
			fisher.position = Vector3.ZERO
			fisher.rotation = Vector3(0, PI / 2, 0)
			look_yaw = -boat.rotation.y
			look_pitch = -0.15
			ui.toast("Ты в лодке! Тапни по воде, чтобы плыть")
			play("plop", -2.0, 0.6)
		"steer":
			if st == "wait":
				_retract()
			steering = true
		"fish":
			steering = false
			boat.path.clear()
			aim_ring.visible = false
		"reel_in":
			if st == "wait":
				_retract()
		"home":
			if st == "wait":
				_retract()
			if st != "idle":
				return
			steering = false
			autopilot = true
			boat.homing = true
			boat.path.clear()
			if boat.position.x < 0.8:
				boat.path.append(Vector3(3.0, 0, 13.5))
			boat.path.append(Vector3(3.0, 0, -9.0))
			boat.path.append(Vector3(1.0, 0, -6.0))
			boat.path.append(MOOR)


func _on_arrived() -> void:
	aim_ring.visible = false
	if autopilot:
		autopilot = false
		boat.homing = false
		on_boat = false
		fisher.reparent(self, false)
		fisher.position = PIER_POS
		fisher.rotation = Vector3.ZERO
		boat.rotation.y = 0.0
		look_yaw = 0.25


func _set_dest(sp: Vector2) -> void:
	var p = _water_point(sp)
	if p == null:
		return
	var d := Vector3(clampf(p.x, -21, 49), 0, clampf(p.z, -43, 49))
	if blocked(d.x, d.z):
		ui.toast("Туда не проплыть")
		return
	boat.path = [d]
	water.ripple(d, 0.05)
	aim_ring.visible = true
	aim_ring.position = Vector3(d.x, 0.15, d.z)


func _boat_ui() -> void:
	var free := st == "idle"
	var key := "%s|%s|%s|%s|%s" % [st, on_boat, steering, autopilot, view]
	var btns := []
	if st == "wait":
		btns.append(["reel_in", "Смотать", false])
	if free and not on_boat:
		btns.append(["board", "Сесть в лодку", true])
	elif free and on_boat and not autopilot:
		if steering:
			btns.append(["fish", "Рыбачить", true])
		else:
			btns.append(["steer", "Плыть", false])
		btns.append(["home", "К пирсу", false])
	ui.set_boat_buttons(key, btns)


# ───────── кадр ─────────
func _process(dt: float) -> void:
	t += dt
	dt = min(dt, 0.05)
	boat.sail_update(dt, blocked)
	boat.float_update(dt)
	motor.volume_db = lerpf(motor.volume_db, -60.0 if boat.speed < 0.2 else lerpf(-20.0, -9.0, boat.speed / 4.5), dt * 3.0)
	motor.pitch_scale = 0.8 + boat.speed * 0.08
	if st == "idle" and pointer_down and not dragging and not steering and not autopilot and t - press_t > 0.2:
		st = "charge"
		power = 0.0
		pdir = 1.0
	if st != "loading":
		_update_state(dt)
	_place_cam(dt)
	_update_gulls(dt)
	_update_ambient(dt)
	_update_rod_line(dt)
	_update_ui()


func _update_gulls(dt: float) -> void:
	_gull_t -= dt
	if _gull_t <= 0:
		_gull_t = randf_range(6, 14)
		play("gull", -14.0, randf_range(0.85, 1.15))
	var c0 := focus_point()
	for g in gulls:
		var n: Node3D = g.n
		if g.mode == "float":
			var nr := water.normal(n.position.x, n.position.z)
			n.position.y = water.height(n.position.x, n.position.z) + 0.12
			n.rotation.x = nr.z * 0.6
			n.rotation.z = -nr.x * 0.6
			var away := n.position - boat.position
			away.y = 0
			if away.length() < 6.0 and boat.speed > 0.5:
				g.v = away.normalized() * 2.5
				if randf() < dt * 3.0:
					water.ripple(n.position, 0.03)
			n.position += g.v * dt
			g.v *= 1.0 - dt * 0.8
			n.position.x += dt * 0.12
			if n.position.distance_to(c0) > 40.0:
				n.position = c0 + Vector3(randf_range(4, 10), 0, randf_range(-8, 8))
		else:
			var a: float = t * 0.22 + g.ph
			n.position = c0 + Vector3(cos(a) * g.r, 7.0 + sin(t * 0.7 + g.ph) * 0.7, sin(a) * g.r * 0.8)
			n.rotation = Vector3(0, -a - PI / 2, 0.25)
			var w: Array = n.get_meta("wings")
			var f := sin(t * 6.5 + g.ph) * 0.65
			w[0].rotation.x = f
			w[1].rotation.x = -f


func _update_ambient(dt: float) -> void:
	var c0 := focus_point()
	for m in ambient:
		var h: float = m.get_meta("h")
		var sp: float = m.get_meta("sp")
		h += sin(t * 0.3 + sp * 9.0) * dt * 0.4
		var dir := Vector3(cos(h), 0, -sin(h))
		m.position += dir * sp * dt
		var rel := m.position - c0
		rel.y = 0
		if rel.length() > 18.0 or blocked(m.position.x, m.position.z):
			h += PI * dt * 2.0
		if rel.length() > 36.0:
			m.position = c0 + Vector3(randf_range(-10, 10), m.position.y, randf_range(-10, 10))
		m.set_meta("h", h)
		m.rotation.y = h
	for i in range(fleeing.size() - 1, -1, -1):
		var q: Dictionary = fleeing[i]
		q.t += dt
		var n: Node3D = q.n
		n.position += q.d * dt * 6.0
		n.position.y -= dt * 0.5
		n.rotation.y = atan2(-q.d.z, q.d.x)
		if q.t > 1.6:
			n.queue_free()
			fleeing.remove_at(i)


func _update_state(dt: float) -> void:
	var ra := 0.95
	var bend := 0.05
	var lean := 0.0
	var fpp := fisher_pos()
	match st:
		"charge":
			power += pdir * dt * 0.85
			if power >= 1.0:
				power = 1.0
				pdir = -1.0
			if power <= 0.0:
				power = 0.0
				pdir = 1.0
			ra = lerpf(0.6, -0.5, min(1.0, power * 1.6))
			var tg := cast_target(max(power, 0.08))
			aim_ring.visible = true
			aim_ring.position = Vector3(tg.x, water.height(tg.x, tg.z) + 0.1, tg.z)
			var s := 1.0 + sin(t * 8.0) * 0.08
			aim_ring.scale = Vector3(s, 0.2, s)
			_click_t -= dt
			if _click_t <= 0:
				_click_t = 0.09
				play("click", -16.0, 0.8 + power * 0.8)
		"fly":
			fly_t += dt
			ra = 1.3
			bob_vel += Vector3(0, -9.8, 0) * dt
			bob_pos += bob_vel * dt
			if fly_t > 0.3 and bob_pos.y <= water.height(bob_pos.x, bob_pos.z):
				bob_pos = Vector3(target.x, 0, target.z)
				_land()
		"wait":
			wait_e += dt
			var k := clampf(wait_e / wait_t, 0.0, 1.0)
			var e := 1.0 - pow(1.0 - k, 2.0)
			_float_bobber(dt, Vector3(target.x, 0, target.z), 0.0)
			if k > 0.6 and randf() < dt * 2.0:
				bob_vel.y -= 0.8
				water.ripple(bob_pos, 0.03)
				play("plop", -18.0, 1.4)
			if fish_node:
				var np := fish_from.lerp(Vector3(target.x - 0.3, -0.6, target.z), e)
				var d := np - fish_node.position
				if d.length() > 0.0001:
					fish_node.rotation.y = atan2(-d.z, d.x)
				fish_node.position = np
			if wait_e >= wait_t:
				_bite()
		"bite":
			bite_t += dt
			bend = 0.35
			_float_bobber(dt, Vector3(target.x, 0, target.z), 0.22 + sin(t * 30.0) * 0.06)
			if bite_t > bite_win:
				_fail("Рыба сорвалась с наживки…")
		"fight":
			_update_fight(dt)
			if fight:
				ra = 0.55 - fight.tension * 0.25
				bend = 0.25 + fight.tension * 1.4
				lean = fight.side
		"jump":
			jump_t += dt
			var k := clampf(jump_t, 0.0, 1.0)
			ra = 0.3
			var to := (eye_pos() + look_dir() * 3.2 + Vector3(0, -0.9, 0)) if view == "fp" else fpp + Vector3(0.9, 2.1, 0.3)
			if fish_node:
				var p := fish_from.lerp(to, k)
				p.y = lerpf(-0.3, to.y, k) + sin(k * PI) * 3.0
				fish_node.position = p
				fish_node.rotation = Vector3(sin(t * 10.0) * 0.4, 1.4, k * TAU)
			if k >= 1.0:
				_show_result()
		"result":
			ra = 0.3
			if fish_node:
				fish_node.rotation.y += dt * 1.2
	rod_a = lerpf(rod_a, ra, min(1.0, dt * (18.0 if st == "fly" else 8.0)))
	fisher.rod_angle = rod_a
	fisher.bend = lerpf(fisher.bend, bend, dt * 6.0)
	fp.pitch = rod_a + 0.3
	fp.bend = fisher.bend
	fp.lean = lerpf(fp.lean, lean, dt * 6.0)
	fp.reeling = st == "fight" and holding
	# поворот рыбака (вид сверху)
	var look := aim_dir if view == "iso" else look_dir()
	if st != "idle" and st != "charge":
		look = Vector3(bob_pos.x - fpp.x, 0, bob_pos.z - fpp.z).normalized()
	var yaw := atan2(-look.z, look.x)
	if on_boat:
		yaw -= boat.rotation.y
	fisher.rotation.y += wrapf(yaw - fisher.rotation.y, -PI, PI) * min(1.0, dt * 6.0)


func _float_bobber(dt: float, anchor: Vector3, sink: float) -> void:
	var wh := water.height(bob_pos.x, bob_pos.z)
	var ty := wh + 0.02 - sink
	bob_vel.y += ((ty - bob_pos.y) * 60.0 - bob_vel.y * 7.0) * dt
	var hz := anchor - Vector3(bob_pos.x, 0, bob_pos.z)
	bob_vel.x += (hz.x * 6.0 - bob_vel.x * 3.0) * dt
	bob_vel.z += (hz.z * 6.0 - bob_vel.z * 3.0) * dt
	bob_pos += bob_vel * dt


func _update_fight(dt: float) -> void:
	fight.update(dt, holding, side_in)
	var f := cur
	var fpp := fisher_pos()
	var u := Vector3(target.x - fpp.x, 0, target.z - fpp.z).normalized()
	var perp := Vector3(-u.z, 0, u.x)
	var reach: float = max(1.8, cast_dist * fight.line / fight.line0)
	fight_off = lerpf(fight_off, fight.run_dir * min(7.0, reach * 0.45) * (1.0 if fight.running else 0.35), dt * 0.8)
	var want := Vector3(fpp.x, 0, fpp.z) + u * reach + perp * fight_off
	_float_bobber(dt, want, 0.08 + fight.tension * 0.25)
	if fish_node and leap_t < 0.0:
		var fpos := Vector3(bob_pos.x - u.x * 0.6, -0.5, bob_pos.z - u.z * 0.6)
		var mv := fpos - fish_node.position
		fish_node.position = fish_node.position.lerp(fpos, min(1.0, dt * 5.0))
		if mv.length() > 0.01:
			fish_node.rotation.y = lerp_angle(fish_node.rotation.y, atan2(-mv.z, mv.x), dt * 4.0)
	# прыжок рыбы на рывке
	if fight.jump_now and leap_t < 0.0 and fish_node:
		leap_t = 0.0
		leap_from = fish_node.position
		splash_fx(bob_pos, 18, 1.0)
		water.ripple(bob_pos, 0.18)
		play("splash", -3.0, 1.1)
	if leap_t >= 0.0 and fish_node:
		leap_t += dt
		var k := clampf(leap_t / 0.9, 0.0, 1.0)
		var p := leap_from.lerp(Vector3(bob_pos.x, -0.5, bob_pos.z), k)
		p.y = -0.4 + sin(k * PI) * (1.6 + f.tier * 0.4)
		fish_node.position = p
		fish_node.rotation.z = sin(k * PI) * 0.8 * (1.0 if k < 0.5 else -1.0)
		if k >= 1.0:
			leap_t = -1.0
			fish_node.rotation.z = 0.0
			splash_fx(bob_pos, 22, 1.0)
			water.ripple(bob_pos, 0.2)
			play("splash", -4.0, 0.95)
	_thrash_t -= dt
	if _thrash_t <= 0:
		_thrash_t = randf_range(0.15, 0.35) * (0.6 if fight.running else 1.4)
		water.ripple(bob_pos, 0.03 + f.d * 0.06 * (1.5 if fight.running else 0.6))
		if randf() < (0.6 if fight.running else 0.2):
			splash_fx(bob_pos, 4, 0.5 + f.d * 0.5)
	if on_boat:
		boat.extra_roll = lerpf(boat.extra_roll, fight.tension * fight.power * 0.06 * fight.run_dir, dt * 3.0)
	_click_t -= dt
	if _click_t <= 0:
		if holding:
			_click_t = 0.07
			play("click", -14.0, 1.0 + randf() * 0.2)
		elif fight.running:
			_click_t = 0.04
			play("click", -12.0, 1.8 + randf() * 0.3)
	if fight.tension > 0.92 and randf() < dt * 8.0:
		buzz(25)
	match fight.result:
		"win":
			boat.extra_roll = 0.0
			_win()
		"snap":
			boat.extra_roll = 0.0
			_fail("Леска оборвалась!")
		"slack":
			boat.extra_roll = 0.0
			_fail("Рыба сошла с крючка — леска провисла")


func _update_rod_line(dt: float) -> void:
	var tip := _tip()
	if bobber.visible:
		bobber.position = bob_pos
		var nr := water.normal(bob_pos.x, bob_pos.z)
		bobber.basis = Basis(Quaternion(Vector3.UP, nr)) if st != "fly" else Basis()
		var dist := tip.distance_to(bob_pos)
		var slack := 1.1 if st == "wait" else (1.0 if st == "fight" else 1.04)
		if st == "fight" and fight and fight.tension < 0.15:
			slack = 1.12
		line.sim(dt, tip, bob_pos + Vector3(0, 0.36, 0), dist * slack)
	else:
		line.active = false
		line.sim(dt, tip, tip, 0.0)


func _update_ui() -> void:
	ui.charge.visible = st == "charge"
	ui.charge_v = power
	if st == "bite":
		ui.show_bite(cam.unproject_position(bob_pos), bite_t / bite_win)
	else:
		ui.bite_mark.visible = false
	ui.fight_hud.visible = st == "fight"
	ui.reel_panel.visible = false
	ui.set_zone(zone_name(boat.position if on_boat else PIER_POS))
	_boat_ui()
	var hints := {
		"loading": "Загрузка гавани…",
		"idle": "Зажми экран — сила заброса, отпусти — [color=#ffb85c]бросок[/color]" + ("  ·  веди пальцем — осмотреться" if view == "fp" else ""),
		"charge": "Отпусти, чтобы забросить. Дальше от берега — крупнее рыба",
		"wait": "Жди поклёвку…",
		"bite": "[color=#ffb85c]ПОДСЕКАЙ![/color] Тапни сейчас",
		"fight": "[color=#ffb85c]Держи[/color] — подматывать, [color=#ffb85c]отпусти[/color] — ослабить. Не дай леске порваться!",
	}
	var h: String = hints.get(st, "")
	if st == "idle" and steering:
		h = "Тапни по воде — [color=#ffb85c]лодка поплывёт туда[/color]"
	elif st == "idle" and autopilot:
		h = "Возвращаемся к пирсу…"
	ui.set_hint(h)


# ───────── автотест (скриншоты) ─────────
func _shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(auto_dir + "/" + name + ".png")
	print("shot ", name, " st=", st)


func _wait(s: float) -> void:
	await get_tree().create_timer(s).timeout


func _fake_press(down: bool) -> void:
	var e := InputEventMouseButton.new()
	e.button_index = MOUSE_BUTTON_LEFT
	e.pressed = down
	e.position = Vector2(900, 400)
	_unhandled_input(e)


func _autotest() -> void:
	await _wait(1.0)
	await _shot("01_fp_pier")
	look_yaw = -0.35
	await _wait(0.3)
	await _shot("02_fp_sun")
	look_yaw = 0.25
	_fake_press(true)
	await _wait(1.3)
	await _shot("03_charge")
	_fake_press(false)
	await _wait(0.5)
	await _shot("04_fly")
	while st != "bite":
		await _wait(0.1)
	await _shot("05_bite")
	_fake_press(true)
	var n := 0
	var shot_fight := false
	while st == "fight":
		var want: bool = fight.tension < 0.62
		if want != holding:
			_fake_press(want)
		side_in = -fight.run_dir if fight.running else 0.0
		n += 1
		if n == 60 and not shot_fight:
			shot_fight = true
			await _shot("06_fight")
		if n > 700:
			fight.line = 1.0
		await _wait(0.05)
	_fake_press(false)
	await _wait(0.4)
	await _shot("07_jump")
	while st == "jump":
		await _wait(0.1)
	await _wait(0.6)
	await _shot("08_result")
	ui.result_layer.visible = false
	_result_closed()
	ui.open_dex()
	await _wait(0.4)
	await _shot("09_dex")
	ui.dex_layer.visible = false
	_toggle_view()
	await _wait(1.0)
	await _shot("10_iso")
	_toggle_view()
	_boat_action("board")
	look_yaw = 0.4
	await _wait(0.5)
	_set_dest(cam.unproject_position(Vector3(16, 0, 12)))
	await _wait(6.0)
	await _shot("11_boat_fp")
	print("autotest done")
	get_tree().quit()
