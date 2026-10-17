class_name Fisher
extends Node3D
## Рыбак в жёлтом дождевике с гнущимся удилищем. Смотрит вдоль +X.

const SEGS := 7
const ROD_LEN := 3.4

var rod_pivot := Node3D.new()
var tip := Node3D.new()
var rod_angle := 1.0
var bend := 0.0
var _segs: Array[Node3D] = []
var _arms: Array[Node3D] = []
var _hands: Array[MeshInstance3D] = []
var _torso: Node3D
var _head: Node3D
var _t := 0.0


func _ready() -> void:
	_build()


func _build() -> void:
	var coat := Mats.std(Color("#eba52a"), 0.45)
	var coat_d := Mats.std(Color("#c98718"), 0.5)
	var pants := Mats.std(Color("#2c3a52"), 0.8)
	var rubber := Mats.std(Color("#1b1a1a"), 0.6)
	var skin := Mats.std(Color("#e9b58e"), 0.6)
	var beard := Mats.std(Color("#6b5240"), 0.9)
	var hat := Mats.std(Color("#b7392c"), 0.9)
	for s in [-1.0, 1.0]:
		var boot := Mats.mi(Geo.bevel_box(Vector3(0.34, 0.3, 0.2), 0.06), rubber, self, Vector3(0.05, 0.15, s * 0.13))
		boot.name = "boot"
		Mats.mi(Geo.cylinder(0.1, 0.12, 0.62, 10), pants, self, Vector3(0, 0.58, s * 0.13))
	_torso = Node3D.new()
	_torso.position = Vector3(0, 0.85, 0)
	add_child(_torso)
	var prof := PackedVector2Array([Vector2(0.27, 0.0), Vector2(0.3, 0.12), Vector2(0.29, 0.45), Vector2(0.26, 0.7), Vector2(0.18, 0.86), Vector2(0.0, 0.9)])
	var body := Mats.mi(Geo.lathe(prof, 16), coat, _torso)
	body.scale = Vector3(0.85, 1, 1.15)
	Mats.mi(Geo.torus(0.12, 0.05, 14, 6), coat_d, _torso, Vector3(0, 0.84, 0))
	for i in 4:
		Mats.mi(Geo.sphere(0.022, 6, 4), Mats.std(Color("#3a2a1a"), 0.4), _torso, Vector3(0.255, 0.18 + i * 0.16, 0))
	Mats.mi(Geo.bevel_box(Vector3(0.04, 0.8, 0.04), 0.01), coat_d, _torso, Vector3(0.25, 0.42, 0.05))
	_head = Node3D.new()
	_head.position = Vector3(0, 1.08, 0)
	_torso.add_child(_head)
	Mats.mi(Geo.cylinder(0.08, 0.08, 0.12, 8), skin, _head, Vector3(0, -0.1, 0))
	Mats.mi(Geo.sphere(0.19, 16, 12), skin, _head, Vector3(0, 0.06, 0))
	Mats.mi(Geo.sphere(0.04, 8, 6), Mats.std(Color("#d99c78"), 0.6), _head, Vector3(0.19, 0.06, 0))
	var bd := Mats.mi(Geo.sphere(0.16, 14, 10), beard, _head, Vector3(0.07, -0.04, 0))
	bd.scale = Vector3(0.9, 0.85, 1.05)
	for s in [-1.0, 1.0]:
		Mats.mi(Geo.sphere(0.022, 6, 5), Mats.std(Color("#1a1412"), 0.2), _head, Vector3(0.17, 0.12, s * 0.07))
		Mats.mi(Geo.sphere(0.04, 6, 5), skin, _head, Vector3(0.0, 0.06, s * 0.19))
	var hprof := PackedVector2Array([Vector2(0.205, 0.0), Vector2(0.21, 0.08), Vector2(0.2, 0.1), Vector2(0.19, 0.18), Vector2(0.14, 0.27), Vector2(0.0, 0.3)])
	Mats.mi(Geo.lathe(hprof, 16), hat, _head, Vector3(0, 0.12, 0))
	Mats.mi(Geo.torus(0.205, 0.035, 18, 6), Mats.std(Color("#9e2e23"), 0.9), _head, Vector3(0, 0.15, 0))
	Mats.mi(Geo.sphere(0.07, 10, 7), Mats.std(Color("#efe8d8"), 0.95), _head, Vector3(0, 0.44, 0))
	# удилище
	rod_pivot.position = Vector3(0.48, 1.15, 0.0)
	add_child(rod_pivot)
	Mats.mi(Geo.cylinder(0.05, 0.045, 0.5, 10), Mats.std(Color("#b98a5a"), 0.9), rod_pivot, Vector3(0, -0.05, 0))
	var reel := Node3D.new()
	reel.position = Vector3(0.07, 0.12, 0)
	rod_pivot.add_child(reel)
	Mats.mi(Geo.cylinder(0.08, 0.08, 0.06, 14), Mats.std(Color("#9aa0a6"), 0.3, 0.85), reel, Vector3(0.04, 0, 0), Vector3(0, 0, PI / 2))
	Mats.mi(Geo.bevel_box(Vector3(0.02, 0.12, 0.02), 0.005), Mats.std(Color("#333333"), 0.4, 0.6), reel, Vector3(0.08, 0.05, 0.06))
	var parent: Node3D = rod_pivot
	var seg_len := ROD_LEN / SEGS
	var blank := Mats.std(Color("#3b2414"), 0.35, 0.1)
	var guide := Mats.std(Color("#c8c8c8"), 0.3, 0.9)
	for i in SEGS:
		var s := Node3D.new()
		s.position = Vector3(0, 0.2 if i == 0 else seg_len, 0)
		parent.add_child(s)
		var r0 := lerpf(0.035, 0.009, float(i) / SEGS)
		var r1 := lerpf(0.035, 0.009, float(i + 1) / SEGS)
		Mats.mi(Geo.cylinder(r0, r1, seg_len, 8), blank, s, Vector3(0, seg_len / 2, 0))
		if i > 0:
			Mats.mi(Geo.torus(0.025, 0.004, 10, 4), guide, s, Vector3(0.03, 0.02, 0), Vector3(0, 0, PI / 2))
		_segs.append(s)
		parent = s
	tip.position = Vector3(0, seg_len, 0)
	parent.add_child(tip)
	# руки
	for s in [-1.0, 1.0]:
		var sh := Node3D.new()
		sh.position = Vector3(0.0, 1.62, s * 0.3)
		add_child(sh)
		var arm := Mats.mi(Geo.cylinder(0.075, 0.065, 1.0, 10), coat, sh, Vector3(0, 0, -0.5), Vector3(PI / 2, 0, 0))
		arm.name = "arm"
		_arms.append(sh)
		_hands.append(Mats.mi(Geo.sphere(0.07, 10, 7), skin, self))


func _process(dt: float) -> void:
	_t += dt
	rod_pivot.rotation.z = -rod_angle
	for i in _segs.size():
		_segs[i].rotation.z = -bend * (0.3 + float(i) / SEGS) / SEGS * 2.0
	_torso.scale.y = 1.0 + sin(_t * 1.8) * 0.01
	_head.rotation.z = sin(_t * 0.7) * 0.05
	# руки тянутся к рукояти
	var grips := [rod_pivot.position + Vector3(0, -0.02, 0.06), rod_pivot.position + Vector3(0, 0.25, -0.06)]
	grips[1] = rod_pivot.position + Basis(Vector3.BACK, -rod_angle) * Vector3(0, 0.28, 0) + Vector3(0, 0, -0.05)
	for i in 2:
		var sh := _arms[i]
		var target: Vector3 = grips[i]
		var d := target - sh.position
		var arm: Node3D = sh.get_node("arm")
		arm.scale = Vector3(1, max(0.2, d.length()), 1)
		arm.position = Vector3(0, 0, -d.length() / 2)
		if d.length() > 0.01:
			sh.basis = Basis.looking_at(d.normalized(), Vector3.UP if abs(d.normalized().y) < 0.98 else Vector3.RIGHT)
		_hands[i].position = target


## Леска: верёвка из точек, считается методом Верле.
class Line:
	extends MeshInstance3D
	const N := 30
	var pts := PackedVector3Array()
	var old := PackedVector3Array()
	var im := ImmediateMesh.new()
	var water: Water
	var cam: Camera3D
	var active := false

	func _init() -> void:
		mesh = im
		var m := StandardMaterial3D.new()
		m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		m.albedo_color = Color(0.96, 0.95, 0.88, 0.95)
		m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		m.cull_mode = BaseMaterial3D.CULL_DISABLED
		material_override = m
		cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		pts.resize(N)
		old.resize(N)

	func reset(a: Vector3) -> void:
		for i in N:
			pts[i] = a
			old[i] = a

	func sim(dt: float, a: Vector3, b: Vector3, length: float) -> void:
		var seg: float = max(length, a.distance_to(b) * 1.001) / (N - 1)
		var g := Vector3(0, -9.8 * dt * dt, 0)
		for i in range(1, N - 1):
			var p := pts[i]
			var v := (p - old[i]) * 0.985
			old[i] = p
			p += v + g
			var wh := water.height(p.x, p.z) - 0.03
			if p.y < wh:
				p.y = lerpf(p.y, wh, 0.5)
				old[i] = p - v * 0.4
			pts[i] = p
		pts[0] = a
		pts[N - 1] = b
		for _k in 10:
			for i in N - 1:
				var d := pts[i + 1] - pts[i]
				var l := d.length()
				if l < 0.00001 or l <= seg:
					continue
				var c := d * (1.0 - seg / l) * 0.5
				if i != 0:
					pts[i] += c
				if i + 1 != N - 1:
					pts[i + 1] -= c
			pts[0] = a
			pts[N - 1] = b
		_draw()

	func _draw() -> void:
		im.clear_surfaces()
		if not active:
			return
		im.surface_begin(Mesh.PRIMITIVE_TRIANGLE_STRIP)
		var cp := cam.global_position
		for i in N:
			var t := (pts[min(i + 1, N - 1)] - pts[max(i - 1, 0)]).normalized()
			var side := t.cross(cp - pts[i]).normalized() * 0.014
			im.surface_add_vertex(pts[i] - side)
			im.surface_add_vertex(pts[i] + side)
		im.surface_end()
