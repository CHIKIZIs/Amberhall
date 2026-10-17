extends Node3D
## Тихая Гавань — главный скрипт: сцена, камера, ввод, ловля, лодка.

const COST := [60, 150, 350, 800, 1800]
const MAXLV := 5
const PIER_POS := Vector3(-2.75, 1.6, 6.4)
const MOOR := Vector3(1.0, 0.0, -0.3)
const CAM_DIR := Vector3(1.0, 1.08, 1.0)
const CAM_DIST := 52.0
const PIER_CAM := Vector3(-2.2, 0.0, -1.2)
const SAVE_PATH := "user://save.json"

var water: Water
var world: World
var boat: Boat
var fisher: Fisher
var line: Fisher.Line
var bobber: Node3D
var cam: Camera3D
var sun: DirectionalLight3D
var ui: UI
var cam_t := PIER_CAM
var thumbs := {}

var save := {"coins": 0, "up": {"rod": 0, "bait": 0, "line": 0}, "dex": {}, "mute": false}
var st := "loading"
var t := 0.0
var power := 0.0
var pdir := 1.0
var holding := false
var aim_dir := Vector3(1, 0, 0.35).normalized()
var target := Vector3.ZERO
var bob_pos := Vector3.ZERO
var bob_vel := Vector3.ZERO
var fly_t := 0.0
var wait_t := 0.0
var wait_e := 0.0
var bite_t := 0.0
var bite_win := 1.1
var cur: Dictionary = {}
var cast_pow := 0.0
var fish_node: Node3D
var fish_from := Vector3.ZERO
var reel := {}
var jump_t := 0.0
var rod_a := 1.0
var on_boat := false
var steering := false
var autopilot := false
var ambient: Array[Node3D] = []
var fleeing: Array = []
var gulls: Array = []
var aim_ring: MeshInstance3D
var _thrash_t := 0.0
var _click_t := 0.0
var _gull_t := 4.0
var sfx := {}
var motor: AudioStreamPlayer
var auto_dir := ""


func _ready() -> void:
	Mats.init()
	_load()
	_env()
	water = Water.new()
	add_child(water)
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
	line = Fisher.Line.new()
	line.water = water
	line.cam = cam
	add_child(line)
	_make_bobber()
	_make_aim_ring()
	_spawn_life()
	_audio()
	water.follow = boat
	ui = UI.new()
	add_child(ui)
	ui.save_ref = save
	ui.cost_ref = COST
	ui.set_coins(save.coins)
	ui.set_sound(not save.mute)
	ui.shop_buy.connect(_buy)
	ui.boat_action.connect(_boat_action)
	ui.result_closed.connect(_result_closed)
	ui.sound_toggled.connect(func():
		save.mute = not save.mute
		ui.set_sound(not save.mute)
		AudioServer.set_bus_mute(0, save.mute)
		_persist())
	AudioServer.set_bus_mute(0, save.mute)
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
	var e := Environment.new()
	var sky := Sky.new()
	var sm := ProceduralSkyMaterial.new()
	sm.sky_top_color = Color("#2f6481")
	sm.sky_horizon_color = Color("#f4bd8c")
	sm.ground_horizon_color = Color("#e3a879")
	sm.ground_bottom_color = Color("#1d4652")
	sm.sun_angle_max = 25.0
	sky.sky_material = sm
	e.background_mode = Environment.BG_SKY
	e.sky = sky
	e.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	e.ambient_light_energy = 0.75
	e.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.05
	e.glow_enabled = true
	e.glow_intensity = 0.6
	e.glow_bloom = 0.06
	e.glow_hdr_threshold = 1.5
	e.adjustment_enabled = true
	e.adjustment_saturation = 1.12
	e.adjustment_contrast = 1.05
	we.environment = e
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.light_color = Color("#ffcf9a")
	sun.light_energy = 1.35
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_PARALLEL_2_SPLITS
	sun.directional_shadow_max_distance = 95.0
	sun.shadow_blur = 1.5
	add_child(sun)
	sun.look_at_from_position(Vector3(-14, 26, 11), Vector3.ZERO)
	cam = Camera3D.new()
	cam.fov = 24.0
	cam.far = 300.0
	add_child(cam)
	_place_cam()


func _place_cam() -> void:
	cam.position = cam_t + CAM_DIR.normalized() * CAM_DIST
	cam.look_at(cam_t)


# ───────── поплавок, прицел ─────────
func _make_bobber() -> void:
	bobber = Node3D.new()
	add_child(bobber)
	var top := PackedVector2Array([Vector2(0.0, 0.0), Vector2(0.13, 0.0), Vector2(0.11, 0.1), Vector2(0.05, 0.2), Vector2(0.0, 0.24)])
	var bot := PackedVector2Array([Vector2(0.0, -0.3), Vector2(0.05, -0.22), Vector2(0.11, -0.1), Vector2(0.13, 0.0), Vector2(0.0, 0.0)])
	Mats.mi(Geo.lathe(top, 16), Mats.std(Color("#e0412f"), 0.3), bobber)
	Mats.mi(Geo.lathe(bot, 16), Mats.std(Color("#f4efe6"), 0.3), bobber)
	Mats.mi(Geo.cylinder(0.015, 0.012, 0.35, 6), Mats.std(Color("#ff8a2a"), 0.4, 0.0, {"emission_enabled": true, "emission": Color("#ff6a1a"), "emission_energy_multiplier": 1.2}), bobber, Vector3(0, 0.38, 0))
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
	var kinds := ["sprat", "roach", "perch", "mackerel", "sprat", "roach", "flounder", "perch", "sprat", "mackerel"]
	for i in kinds.size():
		var f := Fishes.by_id(kinds[i])
		var m := Fishes.build(f)
		m.scale = Vector3.ONE * f.vs * 0.9
		m.position = Vector3(randf_range(2, 20), -randf_range(0.6, 1.5), randf_range(-8, 16))
		m.set_meta("h", randf() * TAU)
		m.set_meta("sp", randf_range(0.6, 1.3))
		add_child(m)
		ambient.append(m)
	# чайки
	var g1 := world.make_gull()
	g1.position = Vector3(-2.15, 1.75, 6.9)
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
	for i in 2:
		var g := world.make_gull()
		g.scale = Vector3.ONE * 1.15
		gulls.append({"n": g, "mode": "fly", "ph": i * 3.0, "r": 10.0 + i * 4.0})


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


func zone_name(v: Vector3) -> String:
	var f := far(v)
	return "У пирса" if f < 0.15 else ("Залив · редкая рыба чаще" if f < 0.6 else "Открытое море · крупная добыча")


func blocked(x: float, z: float) -> bool:
	return (x < -0.3 and z < 12.2 and z > -46.0) or x < -22.0 or x > 50.0 or z < -44.0 or z > 50.0


func fisher_pos() -> Vector3:
	return fisher.global_position


# ───────── ввод ─────────
func _water_point(sp: Vector2) -> Variant:
	var o := cam.project_ray_origin(sp)
	var d := cam.project_ray_normal(sp)
	if abs(d.y) < 0.0001:
		return null
	var k := -o.y / d.y
	return o + d * k if k > 0 else null


func _aim(sp: Vector2) -> void:
	var p = _water_point(sp)
	if p == null:
		return
	var d: Vector3 = p - fisher_pos()
	d.y = 0
	if d.length() < 0.6:
		return
	var a := atan2(d.z, d.x)
	if not on_boat:
		a = clampf(a, -0.75, 1.3)
	aim_dir = Vector3(cos(a), 0, sin(a))


func _unhandled_input(e: InputEvent) -> void:
	if ui == null or ui.any_open():
		return
	if e is InputEventMouseButton and e.button_index == MOUSE_BUTTON_LEFT:
		if e.pressed:
			_press(e.position)
		else:
			_release()
	elif e is InputEventMouseMotion and st == "charge":
		_aim(e.position)


func _press(sp: Vector2) -> void:
	holding = true
	if st == "idle" and steering:
		_set_dest(sp)
		return
	if st == "idle" and not autopilot:
		_aim(sp)
		st = "charge"
		power = 0.0
		pdir = 1.0
	elif st == "wait":
		_retract()
	elif st == "bite":
		_start_reel()


func _release() -> void:
	holding = false
	if st == "charge":
		_cast()


# ───────── ловля ─────────
func cast_target(p: float) -> Vector3:
	var fp := fisher_pos()
	var tg := fp + aim_dir * (3.5 + p * 14.0)
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


func pick_fish(pw: float, fz: float) -> Dictionary:
	var rb: float = 1.0 + save.up.bait * 0.35 + pw * 0.9 + fz * 2.6
	var tot := 0.0
	var ws := []
	for f in Fishes.LIST:
		var x: float = f.wt * (rb if f.v >= 70 else 1.0)
		if fz > 0.5 and f.get("junk", false):
			x *= 0.3
		tot += x
		ws.append(x)
	var r := randf() * tot
	for i in Fishes.LIST.size():
		r -= ws[i]
		if r <= 0:
			return Fishes.LIST[i]
	return Fishes.LIST[0]


func _cast() -> void:
	st = "fly"
	fly_t = 0.0
	play("whoosh", -4.0)
	cast_pow = max(power, 0.08)
	target = cast_target(cast_pow)
	cur = pick_fish(cast_pow, far(target))
	aim_ring.visible = false
	var tip := fisher.tip.global_position
	bob_pos = tip
	var tt := 0.85
	bob_vel = (target - tip) / tt - Vector3(0, -9.8, 0) * tt * 0.5
	bobber.visible = true
	line.active = true
	line.reset(tip)


func _land() -> void:
	st = "wait"
	play("splash", -6.0, 1.3)
	play("plop", -4.0)
	water.ripple(target, 0.16)
	splash_fx(target, 14, 0.7)
	bob_vel = Vector3.ZERO
	wait_t = randf_range(2.2, 5.0) * (1.0 - 0.1 * save.up.bait)
	wait_e = 0.0
	bite_win = 1.1 + 0.12 * save.up.line
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


func _start_reel() -> void:
	st = "reel"
	reel = {"bar": 0.3, "vel": 0.0, "fish": 0.5, "ft": 0.5, "timer": 0.0, "prog": 0.3, "bar_h": 0.2 + 0.032 * save.up.rod, "pos": target, "in_zone": false}
	holding = true
	ui.reel_fish.texture = thumbs.get(cur.id)
	Fishes.set_swim(fish_node, 18.0, 0.14)


func _fail() -> void:
	st = "idle"
	bobber.visible = false
	line.active = false
	play("lose", -3.0)
	buzz(60)
	ui.toast("Рыба ушла…")
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
	var free := st == "idle" or st == "wait"
	var key := "%s|%s|%s|%s" % [free, on_boat, steering, autopilot]
	var btns := []
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
	# камера плавно следует за лодкой
	var goal := Vector3(boat.position.x - 2.5, 0, boat.position.z - 1.5) if on_boat else PIER_CAM
	cam_t = cam_t.lerp(goal, min(1.0, dt * 2.0))
	_place_cam()
	sun.global_position = cam_t + Vector3(-14, 26, 11)
	if world.has_node("."):
		pass
	_update_gulls(dt)
	_update_ambient(dt)
	if st != "loading":
		_update_state(dt)
	_update_rod_line(dt)
	_update_ui()


func _update_gulls(dt: float) -> void:
	_gull_t -= dt
	if _gull_t <= 0:
		_gull_t = randf_range(6, 14)
		play("gull", -14.0, randf_range(0.85, 1.15))
	for g in gulls:
		var n: Node3D = g.n
		if g.mode == "float":
			var nr := water.normal(n.position.x, n.position.z)
			n.position.y = water.height(n.position.x, n.position.z) + 0.12
			n.rotation.x = nr.z * 0.6
			n.rotation.z = -nr.x * 0.6
			# пугается проплывающей лодки
			var away := n.position - boat.position
			away.y = 0
			if away.length() < 6.0 and boat.speed > 0.5:
				g.v = away.normalized() * 2.5
				if randf() < dt * 3.0:
					water.ripple(n.position, 0.03)
			n.position += g.v * dt
			g.v *= 1.0 - dt * 0.8
			n.position.x += dt * 0.12
			if n.position.distance_to(cam_t) > 40.0:
				n.position = cam_t + Vector3(randf_range(6, 14), 0, randf_range(-8, 8))
		else:
			var a: float = t * 0.22 + g.ph
			var c := cam_t + Vector3(6, 0, -2)
			n.position = c + Vector3(cos(a) * g.r, 7.5 + sin(t * 0.7 + g.ph) * 0.7, sin(a) * g.r * 0.8)
			n.rotation = Vector3(0, -a - PI / 2, 0.25)
			var w: Array = n.get_meta("wings")
			var f := sin(t * 6.5 + g.ph) * 0.65
			w[0].rotation.x = f
			w[1].rotation.x = -f


func _update_ambient(dt: float) -> void:
	for m in ambient:
		var h: float = m.get_meta("h")
		var sp: float = m.get_meta("sp")
		h += sin(t * 0.3 + sp * 9.0) * dt * 0.4
		var dir := Vector3(cos(h), 0, -sin(h))
		m.position += dir * sp * dt
		var rel := m.position - cam_t - Vector3(6, 0, 6)
		if rel.length() > 21.0 or blocked(m.position.x, m.position.z):
			h += PI * dt * 2.0
		if rel.length() > 40.0:
			m.position = cam_t + Vector3(6 + randf_range(-10, 10), m.position.y, 6 + randf_range(-10, 10))
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
	var ra := 1.0
	var fp := fisher_pos()
	match st:
		"charge":
			power += pdir * dt * 0.95
			if power >= 1.0:
				power = 1.0
				pdir = -1.0
			if power <= 0.0:
				power = 0.0
				pdir = 1.0
			ra = lerpf(0.6, -0.7, min(1.0, power * 1.6))
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
			ra = 1.35
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
			_float_bobber(dt, Vector3(target.x, 0, target.z), 0.22 + sin(t * 30.0) * 0.06)
			if bite_t > bite_win:
				_fail()
		"reel":
			_update_reel(dt)
			ra = 0.85 + sin(t * 28.0) * 0.04 + (1.0 - reel.prog) * 0.15
		"jump":
			jump_t += dt
			var k := clampf(jump_t, 0.0, 1.0)
			ra = 0.2
			var to := fp + Vector3(0.9, 2.1, 0.3)
			if fish_node:
				var p := fish_from.lerp(to, k)
				p.y = lerpf(-0.3, to.y, k) + sin(k * PI) * 3.2
				fish_node.position = p
				fish_node.rotation = Vector3(sin(t * 10.0) * 0.4, 1.4, k * TAU)
			if k >= 1.0:
				_show_result()
		"result":
			ra = 0.2
			if fish_node:
				fish_node.rotation.y += dt * 1.2
				fish_node.position = fp + Vector3(0.9, 2.1 + sin(t * 2.0) * 0.08, 0.3)
	rod_a = lerpf(rod_a, ra, min(1.0, dt * (18.0 if st == "fly" else 8.0)))
	fisher.rod_angle = rod_a
	fisher.bend = lerpf(fisher.bend, (0.9 + sin(t * 20.0) * 0.15) if st == "reel" else (0.35 if st == "bite" else 0.05), dt * 6.0)
	# поворот рыбака
	var look := aim_dir
	if st != "idle" and st != "charge":
		look = Vector3(bob_pos.x - fp.x, 0, bob_pos.z - fp.z).normalized()
	var yaw := atan2(-look.z, look.x)
	if on_boat:
		yaw -= boat.rotation.y
	fisher.rotation.y += wrapf(yaw - fisher.rotation.y, -PI, PI) * min(1.0, dt * 6.0)


func _float_bobber(dt: float, anchor: Vector3, sink: float) -> void:
	# поплавок держится на воде пружиной, его тянет к точке заброса
	var wh := water.height(bob_pos.x, bob_pos.z)
	var ty := wh + 0.02 - sink
	bob_vel.y += ((ty - bob_pos.y) * 60.0 - bob_vel.y * 7.0) * dt
	var hz := anchor - Vector3(bob_pos.x, 0, bob_pos.z)
	bob_vel.x += (hz.x * 6.0 - bob_vel.x * 3.0) * dt
	bob_vel.z += (hz.z * 6.0 - bob_vel.z * 3.0) * dt
	bob_pos += bob_vel * dt


func _update_reel(dt: float) -> void:
	var r := reel
	var f := cur
	r.timer -= dt
	if r.timer <= 0:
		r.timer = randf_range(0.5, 1.4) * (1.25 - f.d * 0.5)
		r.ft = clampf(r.fish + randf_range(-1, 1) * (0.25 + f.d * 0.55), 0, 1)
	r.fish += (r.ft - r.fish) * min(1.0, dt * (1.2 + f.d * 3.2))
	r.vel = clampf(r.vel + (3.4 if holding else -2.6) * dt, -1.15, 1.15)
	r.bar += r.vel * dt
	var top: float = 1.0 - r.bar_h
	if r.bar < 0:
		r.bar = 0.0
		r.vel = max(0.0, -r.vel * 0.3)
	if r.bar > top:
		r.bar = top
		r.vel = min(0.0, -r.vel * 0.3)
	r.in_zone = r.fish >= r.bar - 0.015 and r.fish <= r.bar + r.bar_h + 0.015
	r.prog = clampf(r.prog + (dt * 0.34 if r.in_zone else -dt * 0.2 * (1.0 - 0.1 * save.up.line)), 0, 1)
	# рыба тянет поплавок, рыбак подматывает к себе
	var fp := fisher_pos()
	var to_me := Vector3(fp.x - target.x, 0, fp.z - target.z)
	var near := Vector3(fp.x, 0, fp.z) - to_me.normalized() * (2.8 if on_boat else 1.8)
	var want: Vector3 = target.lerp(near, r.prog * 0.85)
	var wob := Vector3(sin(t * 2.3) * 1.2, 0, cos(t * 1.7) * 1.2) * (0.4 if r.in_zone else 1.0)
	r.pos = r.pos.lerp(want + wob, min(1.0, dt * 2.0))
	_float_bobber(dt, r.pos, 0.12 + (0.0 if r.in_zone else 0.1))
	if fish_node:
		var fpos := Vector3(bob_pos.x - 0.25, -0.45, bob_pos.z + 0.1)
		fish_node.position = fish_node.position.lerp(fpos, min(1.0, dt * 6.0))
		fish_node.rotation.y = sin(t * 6.0) * 1.2 + 0.6
	_thrash_t -= dt
	if _thrash_t <= 0:
		_thrash_t = randf_range(0.15, 0.35)
		var strength: float = 0.04 + f.d * 0.06
		water.ripple(bob_pos, strength)
		if randf() < 0.5:
			splash_fx(bob_pos, 4, 0.5 + f.d * 0.5)
		if on_boat:
			boat.extra_roll = randf_range(-1, 1) * f.d * 0.05
	if on_boat:
		boat.extra_roll = lerpf(boat.extra_roll, 0.0, dt * 2.0)
	_click_t -= dt
	if holding and _click_t <= 0:
		_click_t = 0.07
		play("click", -14.0, 1.0 + randf() * 0.2)
	if r.prog >= 1.0:
		_win()
	elif r.prog <= 0.0:
		_fail()


func _update_rod_line(dt: float) -> void:
	var tip := fisher.tip.global_position
	if bobber.visible:
		bobber.position = bob_pos
		var nr := water.normal(bob_pos.x, bob_pos.z)
		bobber.basis = Basis(Quaternion(Vector3.UP, nr)) if st != "fly" else Basis()
		var dist := tip.distance_to(bob_pos)
		var slack := 1.1 if st == "wait" else (1.0 if st == "reel" else 1.04)
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
	ui.reel_panel.visible = st == "reel"
	if st == "reel":
		ui.reel_state = reel
	ui.set_zone(zone_name(boat.position if on_boat else PIER_POS))
	_boat_ui()
	var hints := {
		"loading": "Загрузка гавани…",
		"idle": "Зажми на воде — прицел и сила, отпусти — [color=#ffb85c]бросок[/color]",
		"charge": "Веди пальцем для прицела. Дальше — крупнее рыба",
		"wait": "Жди поклёвку…  (тап — смотать)",
		"bite": "[color=#ffb85c]ПОДСЕКАЙ![/color] Тапни сейчас",
		"reel": "[color=#ffb85c]Удерживай[/color] — зелёная зона должна держать рыбу",
	}
	var h: String = hints.get(st, "")
	if st == "idle" and steering:
		h = "Тапни по воде — [color=#ffb85c]лодка поплывёт туда[/color]"
	elif st == "idle" and autopilot:
		h = "Возвращаемся к пирсу…"
	ui.set_hint(h)


# ───────── автотест (скриншоты в CI) ─────────
func _shot(name: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(auto_dir + "/" + name + ".png")
	print("shot ", name, " st=", st)


func _wait(s: float) -> void:
	await get_tree().create_timer(s).timeout


func _autotest() -> void:
	await _wait(1.0)
	await _shot("01_pier")
	_press(Vector2(900, 560))
	await _wait(0.6)
	await _shot("02_charge")
	_release()
	await _wait(0.5)
	await _shot("03_fly")
	while st != "bite":
		await _wait(0.1)
	await _shot("04_bite")
	_press(Vector2(900, 560))
	while st == "reel":
		holding = reel.fish > reel.bar + reel.bar_h * 0.5
		await _wait(0.03)
	await _wait(0.4)
	await _shot("05_jump")
	while st == "jump":
		await _wait(0.1)
	await _wait(0.5)
	await _shot("06_result")
	ui.result_layer.visible = false
	_result_closed()
	ui.open_dex()
	await _wait(0.3)
	await _shot("07_dex")
	ui.dex_layer.visible = false
	_boat_action("board")
	_set_dest(cam.unproject_position(Vector3(14, 0, 10)))
	await _wait(4.0)
	await _shot("08_sailing")
	await _wait(5.0)
	_boat_action("fish")
	_press(cam.unproject_position(boat.position + Vector3(8, 0, 4)))
	await _wait(0.7)
	_release()
	await _wait(1.5)
	await _shot("09_boat_fishing")
	print("autotest done")
	get_tree().quit()
