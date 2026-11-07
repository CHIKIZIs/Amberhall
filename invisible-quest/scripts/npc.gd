class_name NPC
extends Node3D
## Житель города: ходит по маршруту, сидит, говорит (облачко над головой), видит (конус зрения
## с проверкой стен), слышит шум, подходит проверить и возвращается к своему делу.

var npc_name := ""
var model: Node3D
var anim: AnimationPlayer
var bubble: Label3D
var bubble_t := 0.0
var pitch := 1.0
var speed := 1.3
var height := 1.75
var fov := 120.0
var sight := 10.0
var sfx: Sfx

var target := Vector3.INF
var on_arrive: Callable = Callable()
var routine: Array = []    # [[позиция, ожидание сек, взгляд(град) или null], ...]
var routine_i := 0
var wait_t := 0.0
var face_yaw := INF
var sitting := false
var holding: Node3D = null
var react_cd := 0.0
var busy := false          # проверяет шум
var _rest: Dictionary = {}  # куда вернуться после проверки
var _cur_anim := ""

func setup(name_: String, model_path: String, pos: Vector3, yaw_deg: float, scale_k: float, voice: float, sfx_node: Sfx) -> NPC:
	npc_name = name_
	pitch = voice
	sfx = sfx_node
	position = pos
	rotation.y = deg_to_rad(yaw_deg)
	model = W.instance(model_path)
	model.scale = Vector3.ONE * scale_k
	add_child(model)
	height = 0.7 * scale_k
	anim = model.find_child("AnimationPlayer", true, false)
	if anim:
		for a in ["walk", "idle", "sit", "sprint", "holding-both"]:
			if anim.has_animation(a): anim.get_animation(a).loop_mode = Animation.LOOP_LINEAR
	_play("idle")
	var body := AnimatableBody3D.new()
	body.collision_layer = W.L_NPC
	body.collision_mask = 0
	var cs := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.28 * scale_k / 2.5
	cap.height = height
	cs.shape = cap
	cs.position.y = height / 2
	body.add_child(cs)
	add_child(body)
	bubble = Label3D.new()
	bubble.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	bubble.font_size = 40
	bubble.pixel_size = 0.006
	bubble.outline_size = 12
	bubble.outline_modulate = Color(0.05, 0.05, 0.1)
	bubble.width = 520
	bubble.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	bubble.position.y = height + 0.35
	bubble.visible = false
	bubble.no_depth_test = false
	add_child(bubble)
	return self

func _play(a: String, blend := 0.2) -> void:
	if anim == null or _cur_anim == a or not anim.has_animation(a): return
	_cur_anim = a
	anim.play(a, blend)

func emote(a: String) -> void:
	if anim and anim.has_animation(a):
		_cur_anim = a
		anim.play(a, 0.15)
		await get_tree().create_timer(1.2).timeout
		if _cur_anim == a: _cur_anim = ""

func say(text: String, dur := 3.5) -> void:
	bubble.text = text
	bubble.visible = true
	bubble_t = dur
	if sfx:
		for i in mini(4, 1 + text.length() / 12):
			get_tree().create_timer(i * 0.11).timeout.connect(func(): sfx.play_at("blip", eye(), -4.0, pitch * randf_range(0.9, 1.15)))

func eye() -> Vector3:
	return global_position + Vector3(0, height * (0.45 if sitting else 0.88), 0)

func walk_to(p: Vector3, cb := Callable()) -> void:
	if sitting: stand()
	target = Vector3(p.x, 0.0, p.z)
	on_arrive = cb

func sit_at(p: Vector3, yaw_deg: float, seat := 0.4) -> void:
	target = Vector3.INF
	global_position = Vector3(p.x, p.y + seat, p.z)
	rotation.y = deg_to_rad(yaw_deg)
	sitting = true
	_play("sit")

func stand() -> void:
	if sitting: global_position.y = 0.0
	sitting = false
	_play("idle")

func set_routine(points: Array) -> void:
	routine = points
	routine_i = 0
	wait_t = 0.0

func look_toward(p: Vector3) -> void:
	var d := p - global_position
	face_yaw = atan2(d.x, d.z)

## Видит ли точку: расстояние, угол обзора, стены между.
func can_see(p: Vector3, space: PhysicsDirectSpaceState3D) -> bool:
	var e := eye()
	var v := p - e
	var d := v.length()
	if d > sight or d < 0.01: return false
	var f := Vector3(sin(rotation.y), 0, cos(rotation.y))
	var flat := Vector3(v.x, 0, v.z).normalized()
	if d > 1.2 and rad_to_deg(acos(clampf(flat.dot(f), -1.0, 1.0))) > fov / 2.0: return false
	var q := PhysicsRayQueryParameters3D.create(e, p, W.L_WORLD)
	return space.intersect_ray(q).is_empty()

## Подойти посмотреть, что за шум, и вернуться на место.
func investigate(p: Vector3, line: String, after := Callable()) -> void:
	if busy: return
	busy = true
	_rest = {"pos": global_position, "yaw": rotation_degrees.y, "sit": sitting, "routine": routine}
	routine = []
	if sitting: stand()
	await get_tree().create_timer(0.6).timeout
	var to := p - global_position
	to.y = 0
	var stop := p - to.normalized() * 1.1
	walk_to(stop, func():
		look_toward(p)
		say(line, 3.0)
		_look_around_then_return(after))

func _look_around_then_return(after: Callable) -> void:
	await get_tree().create_timer(2.6).timeout
	if after.is_valid(): after.call()
	walk_to(_rest.pos, func():
		if _rest.sit: sit_at(_rest.pos, _rest.yaw)
		else: rotation_degrees.y = _rest.yaw
		set_routine(_rest.routine)
		busy = false)

func _process(dt: float) -> void:
	react_cd -= dt
	if bubble_t > 0.0:
		bubble_t -= dt
		if bubble_t <= 0.0: bubble.visible = false
	if target != Vector3.INF:
		var d := target - global_position
		d.y = 0.0
		if d.length() < 0.12:
			target = Vector3.INF
			_play("idle")
			var cb := on_arrive
			on_arrive = Callable()
			if cb.is_valid(): cb.call()
		else:
			var dir := d.normalized()
			global_position += dir * minf(speed * dt, d.length())
			var want := atan2(dir.x, dir.z)
			rotation.y = lerp_angle(rotation.y, want, minf(1.0, dt * 8.0))
			_play("walk")
			face_yaw = INF
	elif not sitting:
		if face_yaw != INF:
			rotation.y = lerp_angle(rotation.y, face_yaw, minf(1.0, dt * 6.0))
		if not routine.is_empty() and not busy:
			wait_t -= dt
			if wait_t <= 0.0:
				var pt: Array = routine[routine_i]
				routine_i = (routine_i + 1) % routine.size()
				walk_to(pt[0], func():
					wait_t = pt[1]
					if pt.size() > 2 and pt[2] != null: face_yaw = deg_to_rad(pt[2]))
		if not _cur_anim.begins_with("emote"):
			_play("holding-both" if holding else "idle")
	if holding:
		holding.global_position = global_position + global_basis.z * 0.35 * (height / 1.75) + Vector3(0, height * 0.5, 0)
