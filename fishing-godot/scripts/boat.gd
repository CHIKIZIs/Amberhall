class_name Boat
extends Node3D
## Рыболовецкая лодка: модель + плавучесть (качается на волнах из Water)
## + управление (плывёт по точкам, оставляет след на воде).

const LEN := 9.0
const WID := 1.6

var water: Water
var rig := Node3D.new()      # получает крен/дифферент
var seat := Node3D.new()     # место рыбака
var speed := 0.0
var path: Array[Vector3] = []
var homing := false
var extra_roll := 0.0        # рывки рыбы при вываживании
var _yv := 0.0
var _pitch := 0.0
var _pv := 0.0
var _roll := 0.0
var _rv := 0.0
var _turn := 0.0
var _wake_t := 0.0
var _spray: CPUParticles3D

signal arrived
signal stuck


func _ready() -> void:
	add_child(rig)
	_build()
	seat.position = Vector3(0, 0.55, 3.05)
	rig.add_child(seat)


# ───────── корпус ─────────
static func _hull_mesh(length: float, width: float, sheer: float) -> ArrayMesh:
	var n := 30
	var m := 16
	var rows := []
	for i in n + 1:
		var t := float(i) / n
		var z := -length / 2 + t * length
		var w := width * (0.88 + 0.12 * t / 0.6) if t < 0.6 else width * sqrt(max(0.0, 1.0 - pow((t - 0.6) / 0.4, 2.0)))
		var s := sheer * (1.0 + 0.45 * t * t)
		var k := sheer * 0.62 * (1.0 - 0.55 * pow(max(0.0, t - 0.7) / 0.3, 2.0))
		var row := []
		for j in m + 1:
			var phi := PI * j / m
			var c := cos(phi)
			var x: float = -w * sign(c) * pow(abs(c), 0.5)
			var y := s - (s + k) * pow(sin(phi), 1.8)
			row.append([Vector3(x, y, z), Vector2(t, (s - y) / (s + k))])
		rows.append(row)
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var emit := func(a: Array, b: Array, c: Array, out: Vector3) -> void:
		var pa: Vector3 = a[0]
		var pb: Vector3 = b[0]
		var pc: Vector3 = c[0]
		if (pb - pa).cross(pc - pa).length() < 0.000001:
			return
		var order := [a, c, b] if (pb - pa).cross(pc - pa).dot(out) > 0.0 else [a, b, c]
		for v in order:
			st.set_uv(v[1])
			st.add_vertex(v[0])
	for i in n:
		for j in m:
			var a: Array = rows[i][j]
			var b: Array = rows[i][j + 1]
			var c: Array = rows[i + 1][j + 1]
			var d: Array = rows[i + 1][j]
			var mid: Vector3 = (a[0] + b[0] + c[0] + d[0]) * 0.25
			var out := Vector3(mid.x, mid.y - sheer * 0.3, 0.0)
			emit.call(a, b, c, out)
			emit.call(a, c, d, out)
	# транец
	var r0: Array = rows[0]
	var cen := [Vector3(0, sheer * 0.3, r0[0][0].z), Vector2(0, 0.3)]
	for j in m:
		emit.call(cen, r0[j], r0[j + 1], Vector3.BACK)
	st.index()
	st.generate_normals()
	return st.commit()


static func half_width(t: float, width: float) -> float:
	return width * (0.88 + 0.12 * t / 0.6) if t < 0.6 else width * sqrt(max(0.0, 1.0 - pow((t - 0.6) / 0.4, 2.0)))


static func make_hull(length: float, width: float, sheer: float, top: Color, hull: Color, bottom := Color("#1a2b44")) -> MeshInstance3D:
	var mat := ShaderMaterial.new()
	mat.shader = Mats.shader("res://shaders/hull.gdshader")
	mat.set_shader_parameter("grain_tex", Mats.grain)
	mat.set_shader_parameter("top_band", top)
	mat.set_shader_parameter("hull_col", hull)
	mat.set_shader_parameter("bottom_col", bottom)
	var mi := MeshInstance3D.new()
	mi.mesh = _hull_mesh(length, width, sheer)
	mi.material_override = mat
	return mi


func _rail(side: float, y_off: float, r: float, mat: Material, shrink: float = 1.0) -> void:
	var pts := PackedVector3Array()
	for i in 31:
		var t := i / 30.0
		var w := half_width(t, WID) * shrink
		pts.append(Vector3(side * w, (1.0 + 0.45 * t * t) + y_off, -LEN / 2 + t * LEN))
	Mats.mi(Geo.tube(pts, r, 6), mat, rig)


func _build() -> void:
	rig.add_child(make_hull(LEN, WID, 1.0, Color("#f0e3c4"), Color("#2c79bd")))
	# палуба
	var poly := PackedVector2Array()
	for i in 21:
		var t := i / 20.0
		poly.append(Vector2(-half_width(t, WID) * 0.9, -(-LEN / 2 + t * LEN * 0.98)))
	for i in range(20, -1, -1):
		var t := i / 20.0
		poly.append(Vector2(half_width(t, WID) * 0.9, -(-LEN / 2 + t * LEN * 0.98)))
	Mats.mi(Geo.flat(poly), Mats.wood(Color("#9a7a58"), 1, {"grain_scale": 2.0}), rig, Vector3(0, 0.52, 0), Vector3(-PI / 2, 0, 0))
	# планширь и привальный брус
	var cap := Mats.wood(Color("#e6d2a8"), 2)
	_rail(-1, 0.02, 0.06, cap)
	_rail(1, 0.02, 0.06, cap)
	var rub := Mats.std(Color("#1b2633"), 0.5)
	_rail(-1, -0.17, 0.035, rub, 1.01)
	_rail(1, -0.17, 0.035, rub, 1.01)
	# рубка
	var pink := Mats.paint(Color("#cf7d83"), 1)
	var pink_d := Mats.paint(Color("#b9646d"), 1)
	var trim := Mats.paint(Color("#f1e6cc"), 0)
	var glass := Mats.std(Color("#1b2430"), 0.08, 0.3)
	Mats.mi(Geo.bevel_box(Vector3(2.3, 1.75, 2.1), 0.05), pink, rig, Vector3(0, 1.42, -1.1))
	Mats.mi(Geo.bevel_box(Vector3(2.36, 0.12, 2.16), 0.03), pink_d, rig, Vector3(0, 0.62, -1.1))
	Mats.mi(Geo.bevel_box(Vector3(2.65, 0.16, 2.5), 0.05), Mats.paint(Color("#6b3a4a"), 0), rig, Vector3(0, 2.36, -1.1))
	# лобовые окна
	for x in [-0.55, 0.55]:
		Mats.mi(Geo.bevel_box(Vector3(0.85, 0.6, 0.05), 0.02), glass, rig, Vector3(x, 1.75, -0.03))
		Mats.mi(Geo.bevel_box(Vector3(0.95, 0.07, 0.08), 0.01), trim, rig, Vector3(x, 2.07, -0.03))
		Mats.mi(Geo.bevel_box(Vector3(0.95, 0.07, 0.08), 0.01), trim, rig, Vector3(x, 1.43, -0.03))
	# иллюминаторы
	for s in [-1, 1]:
		var oct := Mats.mi(Geo.cylinder(0.34, 0.34, 0.06, 8, false), glass, rig, Vector3(s * 1.16, 1.5, -1.1), Vector3(0, 0, PI / 2))
		oct.rotation.x = PI / 8
		var rim := Mats.mi(Geo.torus(0.36, 0.05, 8, 6), Mats.std(Color("#efe2c2"), 0.4), rig, Vector3(s * 1.18, 1.5, -1.1), Vector3(0, 0, PI / 2))
		rim.rotation.y = PI / 8
	# дверь сзади
	Mats.mi(Geo.bevel_box(Vector3(0.7, 1.3, 0.05), 0.02), Mats.paint(Color("#7a4250"), 1), rig, Vector3(0.4, 1.3, -2.17))
	# поручни на крыше
	var metal := Mats.std(Color("#cfd2d0"), 0.3, 0.8)
	for s in [-1, 1]:
		Mats.mi(Geo.tube(PackedVector3Array([Vector3(s * 1.15, 2.44, -2.2), Vector3(s * 1.15, 2.62, -2.0), Vector3(s * 1.15, 2.62, -0.2), Vector3(s * 1.15, 2.44, 0.0)]), 0.025, 5), metal, rig)
	# антенны и прожектор
	for x in [-0.6, 0.3]:
		Mats.mi(Geo.cylinder(0.02, 0.012, 1.0, 5), Mats.std(Color("#222222"), 0.4, 0.6), rig, Vector3(x, 2.95, -1.7))
	Mats.mi(Geo.cylinder(0.12, 0.15, 0.2, 10), metal, rig, Vector3(0.6, 2.55, -0.4), Vector3(PI / 2, 0, 0))
	# фонарь на рубке
	var lamp := Node3D.new()
	lamp.position = Vector3(1.22, 1.95, -0.15)
	rig.add_child(lamp)
	Mats.mi(Geo.bevel_box(Vector3(0.16, 0.22, 0.16), 0.0), Mats.glow(Color("#ffae5c"), 5.0), lamp, Vector3.ZERO, Vector3.ZERO, false)
	Mats.mi(Geo.cylinder(0.13, 0.02, 0.1, 4, false), Mats.std(Color("#2b2522"), 0.45, 0.7), lamp, Vector3(0, 0.16, 0), Vector3(0, PI / 4, 0))
	var light := OmniLight3D.new()
	light.light_color = Color("#ff9d4d")
	light.light_energy = 1.6
	light.omni_range = 6.0
	lamp.add_child(light)
	# ходовые огни
	Mats.mi(Geo.sphere(0.07, 8, 5), Mats.glow(Color("#ff3030"), 3.0), rig, Vector3(-1.2, 2.3, 0.0), Vector3.ZERO, false)
	Mats.mi(Geo.sphere(0.07, 8, 5), Mats.glow(Color("#30ff60"), 3.0), rig, Vector3(1.2, 2.3, 0.0), Vector3.ZERO, false)
	# барабан с сетью
	var drum := Node3D.new()
	drum.position = Vector3(0, 1.2, 1.5)
	drum.rotation.z = PI / 2
	rig.add_child(drum)
	Mats.mi(Geo.cylinder(0.5, 0.5, 1.05, 18), Mats.std(Color("#e48d82"), 0.6), drum)
	for y in [-0.55, 0.55]:
		Mats.mi(Geo.cylinder(0.66, 0.66, 0.06, 18), Mats.std(Color("#b85c58"), 0.5, 0.2), drum, Vector3(0, y, 0))
	for i in 10:
		Mats.mi(Geo.torus(0.51, 0.012, 24, 4), Mats.std(Color("#5a4436"), 0.9), drum, Vector3(0, -0.45 + i * 0.1, 0))
	for s in [-1, 1]:
		Mats.mi(Geo.bevel_box(Vector3(0.1, 0.7, 0.1), 0.02), Mats.std(Color("#7c838a"), 0.4, 0.7), rig, Vector3(s * 0.62, 0.85, 1.5))
	# А-рама на корме
	var pole := Mats.std(Color("#3a3634"), 0.5, 0.5)
	for s in [-1, 1]:
		Mats.mi(Geo.tube(PackedVector3Array([Vector3(s * 1.2, 0.55, -3.7), Vector3(0, 3.8, -2.7)]), 0.06, 6), pole, rig)
	Mats.mi(Geo.cylinder(0.12, 0.12, 0.14, 10), Mats.std(Color("#d4a83c"), 0.4, 0.6), rig, Vector3(0, 3.75, -2.6), Vector3(0, 0, PI / 2))
	var line := Mats.std(Color("#2b2420"), 0.9)
	var top := Vector3(0, 3.75, -2.65)
	for p in [Vector3(0, 1.4, 4.4), Vector3(1.4, 1.1, 2.6), Vector3(-1.4, 1.1, 2.6), Vector3(0, 1.1, -4.4)]:
		Mats.mi(Geo.tube(Geo.catenary(top, p, 0.08, 6), 0.015, 4), line, rig, Vector3.ZERO, Vector3.ZERO, false)
	# ящики и улов
	var wb := Mats.wood(Color("#c98c55"), 0)
	Mats.mi(Geo.bevel_box(Vector3(0.75, 0.6, 0.75), 0.04), wb, rig, Vector3(-0.5, 0.82, -3.3))
	Mats.mi(Geo.bevel_box(Vector3(0.9, 0.35, 0.6), 0.04), Mats.std(Color("#2f6fb0"), 0.5), rig, Vector3(0.45, 0.72, -3.4))
	Mats.mi(Geo.bevel_box(Vector3(0.6, 0.45, 0.6), 0.04), Mats.std(Color("#5e6b3a"), 0.6), rig, Vector3(0.6, 0.77, 2.6))
	# спасательные круги и кранцы
	var buoy_mat := ShaderMaterial.new()
	buoy_mat.shader = Mats.shader("res://shaders/buoy.gdshader")
	buoy_mat.set_shader_parameter("noise_tex", Mats.grain)
	for p in [[1.62, 0.78, 0.6], [1.52, 0.86, 2.7], [-1.62, 0.78, 1.4], [1.18, 1.4, -1.9]]:
		Mats.mi(Geo.torus(0.33, 0.1, 22, 8), buoy_mat, rig, Vector3(p[0], p[1], p[2]), Vector3(0, 0, PI / 2))
	for z in [-2.6, -0.4]:
		Mats.mi(Geo.torus(0.3, 0.13, 18, 8), Mats.std(Color("#1e1c1d"), 0.85), rig, Vector3(-1.66, 0.55, z), Vector3(0, 0, PI / 2))
	# брызги из-под носа
	_spray = CPUParticles3D.new()
	_spray.amount = 40
	_spray.lifetime = 0.7
	_spray.emitting = false
	_spray.local_coords = false
	_spray.mesh = Geo.sphere(0.05, 6, 4)
	_spray.material_override = Mats.std(Color(0.92, 0.98, 0.97), 0.3)
	_spray.direction = Vector3(0, 1, 0.3)
	_spray.spread = 50.0
	_spray.initial_velocity_min = 1.5
	_spray.initial_velocity_max = 3.0
	_spray.gravity = Vector3(0, -9.8, 0)
	_spray.scale_amount_min = 0.5
	_spray.scale_amount_max = 1.2
	_spray.emission_shape = CPUParticles3D.EMISSION_SHAPE_SPHERE
	_spray.emission_sphere_radius = 0.6
	_spray.position = Vector3(0, 0.3, 4.2)
	rig.add_child(_spray)


# ───────── физика ─────────
func forward() -> Vector3:
	return Vector3(sin(rotation.y), 0, cos(rotation.y))


func right() -> Vector3:
	return Vector3(cos(rotation.y), 0, -sin(rotation.y))


func float_update(dt: float) -> void:
	var p := global_position
	var f := forward()
	var r := right()
	var hb := water.height(p.x + f.x * 3.6, p.z + f.z * 3.6)
	var hs := water.height(p.x - f.x * 3.6, p.z - f.z * 3.6)
	var hr := water.height(p.x + r.x * 1.3, p.z + r.z * 1.3)
	var hl := water.height(p.x - r.x * 1.3, p.z - r.z * 1.3)
	var ty := (hb + hs + hr + hl) * 0.25 - 0.08 - speed * 0.02
	_yv += ((ty - position.y) * 22.0 - _yv * 4.5) * dt
	position.y += _yv * dt
	var tp := atan2(hs - hb, 7.2) - speed * 0.018
	_pv += ((tp - _pitch) * 18.0 - _pv * 3.5) * dt
	_pitch += _pv * dt
	var tr := atan2(hr - hl, 2.6) - _turn * 0.1 + extra_roll
	_rv += ((tr - _roll) * 16.0 - _rv * 3.0) * dt
	_roll += _rv * dt
	rig.rotation = Vector3(_pitch, 0, _roll)


## Движение по точкам; blocked(x, z) — запрет мелководья/пирса.
func sail_update(dt: float, blocked: Callable) -> void:
	var moving := false
	if path.size() > 0:
		var w: Vector3 = path[0]
		var dx := w.x - position.x
		var dz := w.z - position.z
		var dist := sqrt(dx * dx + dz * dz)
		var want := atan2(dx, dz)
		var d := wrapf(want - rotation.y, -PI, PI)
		var last := path.size() == 1
		if dist < (0.2 if (last and homing) else 0.9):
			path.pop_front()
			if path.is_empty():
				arrived.emit()
		else:
			var turn := clampf(d, -dt * 1.5, dt * 1.5)
			rotation.y += turn
			_turn = lerpf(_turn, turn / max(dt, 0.001), dt * 3.0)
			var sp: float = max(0.0, cos(d)) * min(4.5, dist * 1.4 + 0.5)
			speed = lerpf(speed, sp, dt * 1.6)
			var n := position + forward() * speed * dt
			if (homing and last) or not blocked.call(n.x, n.z):
				position.x = n.x
				position.z = n.z
			elif not blocked.call(n.x, position.z):
				position.x = n.x
			elif not blocked.call(position.x, n.z):
				position.z = n.z
			else:
				path.clear()
				stuck.emit()
			moving = speed > 0.4
	if not moving:
		speed = lerpf(speed, 0.0, dt * 1.5)
		_turn = lerpf(_turn, 0.0, dt * 2.0)
	_spray.emitting = speed > 2.0
	# след на воде: круги от носа и кормы
	if speed > 0.5:
		_wake_t -= dt
		if _wake_t <= 0.0:
			_wake_t = 0.32
			var f := forward()
			water.ripple(position + f * 4.3, 0.035 * speed)
			water.ripple(position - f * 4.4, 0.025 * speed)
