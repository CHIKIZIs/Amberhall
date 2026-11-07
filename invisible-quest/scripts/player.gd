class_name Player
extends Node3D
## Игрок: шлем и руки (или мышь и клавиатура на ПК), ходьба с коллизиями, хватание и броски,
## невидимость с энергией, часы на руке, сообщения перед глазами, затемнение экрана.

signal interact(pos: Vector3)
signal grabbed(item: RigidBody3D)
signal released(item: RigidBody3D)
signal invisibility_changed(on: bool)

const INV_DRAIN := 1.0 / 35.0     # полный заряд — 35 секунд невидимости
const INV_CHARGE := 1.0 / 14.0
const WALK := 2.1

var vr := false
var origin: XROrigin3D
var cam: XRCamera3D
var body: CharacterBody3D
var left: XRController3D
var right: XRController3D
var hands := {}           # side -> Dictionary
var invisible := false
var energy := 1.0
var can_move := true
var pitch := 0.0
var snap_latch := false
var step_t := 0.0
var moving := false
var sfx: Sfx
var _hand_mat: StandardMaterial3D
var _ghost_mat: ShaderMaterial
var _overlay: ShaderMaterial
var _fade := 0.0
var _flash := 0.0
var _tunnel := 0.0
var _inv_fx := 0.0
var watch: Label3D
var _toast: Label3D
var _toast_t := 0.0
var _desk_held: RigidBody3D = null
var _desk_keys := {}

func setup(is_vr: bool, sfx_node: Sfx) -> void:
	vr = is_vr
	sfx = sfx_node
	origin = XROrigin3D.new()
	add_child(origin)
	cam = XRCamera3D.new()
	cam.near = 0.05
	cam.far = 300.0
	origin.add_child(cam)
	cam.current = true
	if not vr: cam.position = Vector3(0, 1.6, 0)

	body = CharacterBody3D.new()
	body.motion_mode = CharacterBody3D.MOTION_MODE_FLOATING
	body.collision_layer = W.L_PLAYER
	body.collision_mask = W.L_WORLD | W.L_NPC
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.22
	cap.height = 1.3
	cs.shape = cap
	cs.position.y = 0.75
	body.add_child(cs)
	add_child(body)

	_hand_mat = W.mat(Color(0.96, 0.76, 0.6), 0.7)
	_ghost_mat = ShaderMaterial.new()
	_ghost_mat.shader = Shader.new()
	_ghost_mat.shader.code = """shader_type spatial;
render_mode unshaded, blend_add, depth_draw_never, cull_back;
void fragment() {
	float rim = 1.0 - abs(dot(normalize(NORMAL), normalize(VIEW)));
	float wave = 0.6 + 0.4 * sin(TIME * 6.0 + VERTEX.y * 40.0);
	ALBEDO = vec3(0.4, 0.85, 1.0);
	ALPHA = pow(rim, 2.0) * 0.8 * wave + 0.04;
}"""

	left = XRController3D.new()
	left.tracker = &"left_hand"
	left.pose = &"grip"
	origin.add_child(left)
	right = XRController3D.new()
	right.tracker = &"right_hand"
	right.pose = &"grip"
	origin.add_child(right)
	for side in ["left", "right"]:
		var ctrl: XRController3D = left if side == "left" else right
		var hand := _make_hand(side)
		if vr:
			ctrl.add_child(hand)
		else:
			cam.add_child(hand)
			hand.position = Vector3(-0.24 if side == "left" else 0.24, -0.3, -0.42)
			hand.rotation = Vector3(0.3, 0.0, 0.0)
		var gp := Node3D.new()
		gp.position = Vector3(0, -0.01, -0.06)
		hand.add_child(gp)
		hands[side] = {"ctrl": ctrl, "node": hand, "grab": gp, "held": null, "offset": Transform3D(), "prev": Vector3.ZERO, "vel": Vector3.ZERO}
	left.button_pressed.connect(_on_button.bind("left"))
	right.button_pressed.connect(_on_button.bind("right"))
	left.button_released.connect(_on_release.bind("left"))
	right.button_released.connect(_on_release.bind("right"))

	# Часы на левой руке: время, задание, энергия невидимости, подозрение
	watch = Label3D.new()
	watch.font_size = 26
	watch.pixel_size = 0.0005
	watch.outline_size = 6
	watch.outline_modulate = Color(0, 0, 0, 0.9)
	watch.width = 380
	watch.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	watch.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	watch.vertical_alignment = VERTICAL_ALIGNMENT_TOP
	watch.no_depth_test = true
	watch.render_priority = 10
	if vr:
		hands.left.node.add_child(watch)
		watch.position = Vector3(-0.09, 0.06, 0.06)
		watch.rotation = Vector3(-1.0, 0, 0)
	else:
		cam.add_child(watch)
		watch.position = Vector3(-0.62, 0.36, -0.75)
		watch.pixel_size = 0.0009

	_toast = Label3D.new()
	_toast.font_size = 40
	_toast.pixel_size = 0.0011
	_toast.outline_size = 12
	_toast.outline_modulate = Color(0, 0, 0, 1)
	_toast.width = 1000
	_toast.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	_toast.no_depth_test = true
	_toast.render_priority = 20
	_toast.outline_render_priority = 19
	_toast.position = Vector3(0, 0.18, -1.3)
	_toast.visible = false
	cam.add_child(_toast)

	# Экранный слой: голубое свечение по краям в невидимости, затемнение при переходах,
	# красная вспышка, «туннель» при движении стиком (меньше укачивает)
	_overlay = ShaderMaterial.new()
	_overlay.shader = Shader.new()
	_overlay.shader.code = """shader_type spatial;
render_mode unshaded, depth_test_disabled, depth_draw_never, cull_disabled, fog_disabled, blend_mix;
uniform float invis = 0.0;
uniform float fade = 0.0;
uniform float flash = 0.0;
uniform float tunnel = 0.0;
void vertex() { POSITION = vec4(VERTEX.xy, 0.5, 1.0); }
void fragment() {
	float r = length((UV - 0.5) * 2.0);
	float edge = smoothstep(0.45, 1.3, r);
	vec3 col = vec3(0.0);
	float a = 0.0;
	float tun = smoothstep(0.75, 1.2, r) * tunnel * 0.85;
	a = max(a, tun);
	float inv = smoothstep(0.7, 1.35, r) * invis * (0.45 + 0.12 * sin(TIME * 3.0 + r * 8.0));
	col = mix(col, vec3(0.25, 0.7, 1.0), inv / max(a + inv, 0.001));
	a = max(a, inv);
	float fl = edge * flash;
	col = mix(col, vec3(0.9, 0.1, 0.1), fl / max(a + fl, 0.001));
	a = max(a, fl);
	col = mix(col, vec3(0.0), fade);
	a = max(a, fade);
	ALBEDO = col;
	ALPHA = a;
}"""
	_overlay.render_priority = 100
	var q := QuadMesh.new()
	q.size = Vector2(2, 2)
	var mi := MeshInstance3D.new()
	mi.mesh = q
	mi.material_override = _overlay
	mi.extra_cull_margin = 16384.0
	mi.position.z = -0.2
	cam.add_child(mi)

func _make_hand(side: String) -> Node3D:
	var h := Node3D.new()
	var sx := -1.0 if side == "left" else 1.0
	var parts := [
		[Vector3(0.075, 0.03, 0.09), Vector3(0, 0, 0.0)],          # ладонь
		[Vector3(0.07, 0.025, 0.06), Vector3(0, -0.012, -0.065)],  # пальцы
		[Vector3(0.022, 0.022, 0.05), Vector3(-sx * 0.045, 0.0, -0.025)],  # большой палец
		[Vector3(0.065, 0.045, 0.05), Vector3(0, 0, 0.07)],        # запястье (рукав)
	]
	for i in parts.size():
		var p: Array = parts[i]
		var bm := BoxMesh.new()
		bm.size = p[0]
		var m := MeshInstance3D.new()
		m.mesh = bm
		m.position = p[1]
		m.set_meta("sleeve", i == 3)
		m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		h.add_child(m)
	_paint_hand(h)
	return h

func _paint_hand(h: Node3D) -> void:
	for m in h.get_children():
		if m is MeshInstance3D:
			if invisible: m.material_override = _ghost_mat
			else: m.material_override = W.mat(Color(0.2, 0.35, 0.75)) if m.get_meta("sleeve", false) else _hand_mat

# ───── Невидимость
func set_invisible(on: bool) -> void:
	if on == invisible: return
	if on and energy < 0.15:
		toast("Нет сил: подожди, пока энергия восстановится", 2.0)
		sfx.play("fail", -10.0)
		return
	invisible = on
	for side in hands: _paint_hand(hands[side].node)
	sfx.play("whoosh_on" if on else "whoosh_off", -4.0)
	sfx.set_muffled(on)
	_pulse("left", 0.4, 0.15)
	_pulse("right", 0.4, 0.15)
	invisibility_changed.emit(on)

func _on_button(name: String, side: String) -> void:
	match name:
		"by_button": set_invisible(not invisible)
		"grip_click": _grab(side)
		"trigger_click": interact.emit(hands[side].grab.global_position)

func _on_release(name: String, side: String) -> void:
	if name == "grip_click": _drop(side, true)

func _pulse(side: String, amp: float, dur: float) -> void:
	if vr: hands[side].ctrl.trigger_haptic_pulse("haptic", 0.0, amp, dur, 0.0)

func pulse_both(amp: float, dur: float) -> void:
	_pulse("left", amp, dur)
	_pulse("right", amp, dur)

# ───── Хватание
func held_items() -> Array:
	var a := []
	for side in hands:
		if hands[side].held: a.append(hands[side].held)
	if _desk_held: a.append(_desk_held)
	return a

func _grab(side: String) -> void:
	var h: Dictionary = hands[side]
	if h.held: return
	var gp: Vector3 = h.grab.global_position
	var best: RigidBody3D = null
	var best_d := 0.22
	for n in get_tree().get_nodes_in_group("grab"):
		var rb := n as RigidBody3D
		if not rb.is_inside_tree() or not rb.visible or not rb.get_meta("grabbable", true): continue
		var d := rb.global_position.distance_to(gp) - float(rb.get_meta("r", 0.05))
		if d < best_d:
			best_d = d
			best = rb
	if best == null: return
	_take(best)
	h.held = best
	h.offset = (h.grab as Node3D).global_transform.affine_inverse() * best.global_transform
	_pulse(side, 0.3, 0.05)
	grabbed.emit(best)

func _take(rb: RigidBody3D) -> void:
	for side in hands:
		if hands[side].held == rb: hands[side].held = null
	if _desk_held == rb: _desk_held = null
	rb.freeze = true
	rb.collision_layer = 0
	sfx.play("pop", -8.0)

func _drop(side: String, throw: bool) -> void:
	var h: Dictionary = hands[side]
	var rb: RigidBody3D = h.held
	if rb == null: return
	h.held = null
	_free(rb, h.vel if throw else Vector3.ZERO)
	released.emit(rb)

func _free(rb: RigidBody3D, vel: Vector3) -> void:
	rb.collision_layer = W.L_ITEM
	rb.freeze = false
	rb.linear_velocity = vel
	rb.angular_velocity = Vector3(randf_range(-2, 2), randf_range(-2, 2), randf_range(-2, 2)) * minf(1.0, vel.length() / 3.0)

## Забрать предмет из рук без броска (например, телефон уходит в карман).
func take_away(rb: RigidBody3D) -> void:
	for side in hands:
		if hands[side].held == rb: hands[side].held = null
	if _desk_held == rb: _desk_held = null

# ───── Перемещение
func head() -> Vector3:
	return cam.global_position

func forward() -> Vector3:
	var f := -cam.global_basis.z
	f.y = 0.0
	return f.normalized()

func teleport(pos: Vector3, yaw_deg: float) -> void:
	origin.rotation = Vector3(0, deg_to_rad(yaw_deg), 0)
	pitch = 0.0
	var off := cam.global_position - origin.global_position
	off.y = 0.0
	origin.global_position = Vector3(pos.x, pos.y, pos.z) - off
	body.global_position = Vector3(pos.x, pos.y, pos.z)
	body.velocity = Vector3.ZERO

func _snap(a: float) -> void:
	var h := cam.global_position
	origin.global_transform = origin.global_transform.translated(-h).rotated(Vector3.UP, a).translated(h)

func _physics_process(dt: float) -> void:
	if origin == null: return
	var mv := Vector2.ZERO
	if can_move:
		if vr:
			mv = left.get_vector2("primary")
			var rx := right.get_vector2("primary").x
			if absf(rx) > 0.65 and not snap_latch:
				snap_latch = true
				_snap(-signf(rx) * PI / 4.0)
			if absf(rx) < 0.3: snap_latch = false
		else:
			mv.x = float(_key(KEY_D)) - float(_key(KEY_A))
			mv.y = float(_key(KEY_W)) - float(_key(KEY_S))
	if mv.length() < 0.15: mv = Vector2.ZERO
	var fwd := forward()
	var rgt := Vector3(-fwd.z, 0, fwd.x)
	var move := (fwd * mv.y + rgt * mv.x)
	if move.length() > 1.0: move = move.normalized()
	moving = move.length() > 0.1
	var h := cam.global_position
	var room := Vector3(h.x - body.global_position.x, 0, h.z - body.global_position.z)
	if room.length() > 1.0: room = Vector3.ZERO   # после телепорта
	body.velocity = room / dt + move * WALK
	body.move_and_slide()
	var diff := body.global_position - Vector3(h.x, body.global_position.y, h.z)
	origin.global_position += Vector3(diff.x, 0, diff.z)
	_tunnel = move_toward(_tunnel, 1.0 if (vr and moving) else 0.0, dt * 4.0)
	if moving:
		step_t -= dt
		if step_t <= 0.0:
			step_t = 0.45
			if not invisible: sfx.play("step", -22.0, randf_range(0.9, 1.1))

func _key(k: Key) -> bool:
	return Input.is_key_pressed(k)

func _process(dt: float) -> void:
	if origin == null: return
	if not vr:
		cam.position = Vector3(0, 1.6, 0)
		cam.rotation = Vector3(pitch, 0, 0)
	# скорость рук — для бросков
	for side in hands:
		var hd: Dictionary = hands[side]
		var p: Vector3 = (hd.grab as Node3D).global_position
		var v: Vector3 = (p - hd.prev) / maxf(dt, 0.001)
		hd.vel = (hd.vel as Vector3).lerp(v, 0.5)
		hd.prev = p
		if hd.held:
			(hd.held as RigidBody3D).global_transform = (hd.grab as Node3D).global_transform * (hd.offset as Transform3D)
	if _desk_held:
		_desk_held.global_position = cam.global_position + (-cam.global_basis.z) * 0.6 + Vector3(0, -0.2, 0)
		_desk_held.global_rotation = Vector3(0, origin.rotation.y, 0)
	# энергия невидимости
	if invisible:
		energy -= dt * INV_DRAIN
		if energy <= 0.0:
			energy = 0.0
			toast("Невидимость кончилась!", 2.0)
			set_invisible(false)
		elif energy < 0.2 and fmod(Time.get_ticks_msec() / 1000.0, 0.5) < dt:
			_pulse("left", 0.15, 0.04)
	else:
		energy = minf(1.0, energy + dt * INV_CHARGE)
	_inv_fx = move_toward(_inv_fx, 1.0 if invisible else 0.0, dt * 3.0)
	_overlay.set_shader_parameter("invis", _inv_fx)
	_flash = maxf(0.0, _flash - dt * 1.5)
	_overlay.set_shader_parameter("flash", _flash)
	_overlay.set_shader_parameter("fade", _fade)
	_overlay.set_shader_parameter("tunnel", _tunnel)
	if _toast_t > 0.0:
		_toast_t -= dt
		var o := clampf(_toast_t / 0.5, 0.0, 1.0)
		_toast.modulate.a = o
		_toast.outline_modulate.a = o
		_toast.visible = o > 0.0

func toast(text: String, dur := 3.5) -> void:
	_toast.text = text
	_toast_t = dur
	_toast.visible = true

func flash() -> void:
	_flash = 1.0
	pulse_both(0.8, 0.25)

## Плавное затемнение: fade_to(1) — в темноту, fade_to(0) — обратно.
func fade_to(v: float, dur := 0.35) -> void:
	var tw := create_tween()
	tw.tween_property(self, "_fade", v, dur)
	await tw.finished

# ───── ПК: мышь и клавиатура
func _unhandled_input(e: InputEvent) -> void:
	if vr: return
	if e is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		var mm := e as InputEventMouseMotion
		origin.rotate_y(-mm.relative.x * 0.0022)
		pitch = clampf(pitch - mm.relative.y * 0.0022, -1.3, 1.3)
	elif e is InputEventMouseButton and e.pressed:
		if Input.mouse_mode != Input.MOUSE_MODE_CAPTURED:
			Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
		elif (e as InputEventMouseButton).button_index == MOUSE_BUTTON_LEFT:
			desk_grab()
		elif (e as InputEventMouseButton).button_index == MOUSE_BUTTON_RIGHT and _desk_held:
			desk_throw()
	elif e is InputEventKey and e.pressed and not e.echo:
		match (e as InputEventKey).keycode:
			KEY_Q: set_invisible(not invisible)
			KEY_E: desk_grab()
			KEY_F: interact.emit(cam.global_position + (-cam.global_basis.z) * 1.0)
			KEY_ESCAPE: Input.mouse_mode = Input.MOUSE_MODE_VISIBLE

func desk_grab() -> void:
	if _desk_held:
		var rb := _desk_held
		_desk_held = null
		_free(rb, Vector3.ZERO)
		released.emit(rb)
		return
	var best: RigidBody3D = null
	var best_d := 1e9
	var from := cam.global_position
	var dir := -cam.global_basis.z
	for n in get_tree().get_nodes_in_group("grab"):
		var rb := n as RigidBody3D
		if not rb.visible or not rb.get_meta("grabbable", true): continue
		var v := rb.global_position - from
		var along := v.dot(dir)
		if along < 0.0 or along > 2.6: continue
		var off := (v - dir * along).length()
		if off < 0.3 + float(rb.get_meta("r", 0.05)) and along < best_d:
			best_d = along
			best = rb
	if best:
		_take(best)
		_desk_held = best
		grabbed.emit(best)

func desk_throw() -> void:
	var rb := _desk_held
	_desk_held = null
	_free(rb, -cam.global_basis.z * 6.0 + Vector3(0, 1.5, 0))
	released.emit(rb)

## Для автотеста: положить предмет «в руку» на ПК.
func force_hold(rb: RigidBody3D) -> void:
	_take(rb)
	_desk_held = rb
	grabbed.emit(rb)

func force_drop() -> void:
	if _desk_held: desk_grab()
