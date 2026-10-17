class_name FPRig
extends Node3D
## Руки и удочка в кадре при виде от первого лица. Дочерний узел камеры.

const SEGS := 8
const ROD_LEN := 2.7

var tip := Node3D.new()
var pitch := 0.95       # наклон удилища от вертикали вперёд
var lean := 0.0         # отклонение вбок (ведение рыбы)
var bend := 0.05
var reeling := false
var _pivot := Node3D.new()
var _segs: Array[Node3D] = []
var _handle: Node3D
var _t := 0.0
var _crank := 0.0
var _left: Node3D
var _arms: Array[Node3D] = []
var _arm_from := [Vector3(0.5, -0.85, -0.25), Vector3(-0.3, -0.9, -0.3)]


func _ready() -> void:
	_pivot.position = Vector3(0.3, -0.42, -0.78)
	add_child(_pivot)
	var cork := Mats.std(Color("#c49a6a"), 0.95)
	var blank := Mats.std(Color("#2b1a10"), 0.25, 0.15)
	var wrap := Mats.std(Color("#a8322a"), 0.4)
	var metal := Mats.std(Color("#b9bec4"), 0.25, 0.9)
	var dark := Mats.std(Color("#1e1e22"), 0.35, 0.6)
	Mats.mi(Geo.cylinder(0.032, 0.026, 0.42, 14), cork, _pivot, Vector3(0, -0.02, 0))
	Mats.mi(Geo.cylinder(0.034, 0.034, 0.04, 14), dark, _pivot, Vector3(0, 0.2, 0))
	# катушка
	var reel := Node3D.new()
	reel.position = Vector3(0, 0.08, 0.06)
	_pivot.add_child(reel)
	Mats.mi(Geo.bevel_box(Vector3(0.02, 0.06, 0.05), 0.008), metal, reel, Vector3(0, 0, -0.02))
	Mats.mi(Geo.cylinder(0.055, 0.055, 0.05, 20), metal, reel, Vector3(0, 0, 0.04), Vector3(PI / 2, 0, 0))
	Mats.mi(Geo.cylinder(0.045, 0.045, 0.052, 20), Mats.std(Color("#e9e4d6"), 0.6), reel, Vector3(0, 0, 0.04), Vector3(PI / 2, 0, 0))
	Mats.mi(Geo.torus(0.057, 0.006, 20, 5), dark, reel, Vector3(0, 0, 0.065), Vector3(PI / 2, 0, 0))
	_handle = Node3D.new()
	_handle.position = Vector3(0.035, 0, 0.04)
	reel.add_child(_handle)
	Mats.mi(Geo.bevel_box(Vector3(0.012, 0.075, 0.012), 0.003), dark, _handle, Vector3(0.0, 0.035, 0))
	Mats.mi(Geo.cylinder(0.012, 0.012, 0.035, 8), Mats.std(Color("#d8c08a"), 0.5), _handle, Vector3(0.02, 0.07, 0), Vector3(0, 0, PI / 2))
	# бланк из сегментов (гнётся)
	var parent: Node3D = _pivot
	var seg_len := ROD_LEN / SEGS
	for i in SEGS:
		var s := Node3D.new()
		s.position = Vector3(0, 0.22 if i == 0 else seg_len, 0)
		parent.add_child(s)
		var r0 := lerpf(0.02, 0.005, float(i) / SEGS)
		var r1 := lerpf(0.02, 0.005, float(i + 1) / SEGS)
		Mats.mi(Geo.cylinder(r0, r1, seg_len, 10), blank, s, Vector3(0, seg_len / 2, 0))
		if i > 0:
			Mats.mi(Geo.cylinder(r0 * 1.6, r0 * 1.6, 0.025, 10), wrap, s, Vector3(0, 0.01, 0))
			var ring := Mats.mi(Geo.torus(0.018 - i * 0.0015, 0.0025, 12, 4), metal, s, Vector3(0, 0.02, 0.025), Vector3(0, 0, 0))
			ring.rotation.x = PI / 2
		_segs.append(s)
		parent = s
	tip.position = Vector3(0, seg_len, 0)
	parent.add_child(tip)
	# руки
	var sleeve := Mats.std(Color("#eba52a"), 0.45)
	var cuff := Mats.std(Color("#c98718"), 0.5)
	var glove := Mats.std(Color("#3d4a5a"), 0.8)
	var right := Node3D.new()
	right.name = "right"
	_pivot.add_child(right)
	var rh := Mats.mi(Geo.sphere(0.055, 14, 10), glove, right, Vector3(0.0, 0.02, 0.0))
	rh.scale = Vector3(1.1, 1.4, 1.2)
	for i in 4:
		var f := Mats.mi(Geo.cylinder(0.016, 0.014, 0.06, 8), glove, right, Vector3(-0.03, 0.06 - i * 0.025, 0.03), Vector3(0, 0, PI / 2))
		f.name = "f%d" % i
	var left := Node3D.new()
	left.name = "left"
	reel.add_child(left)
	left.position = Vector3(0.09, 0.0, 0.04)
	_left = left
	var lh := Mats.mi(Geo.sphere(0.05, 14, 10), glove, left)
	lh.scale = Vector3(1.2, 1.1, 1.2)
	# предплечья: цилиндр вдоль -Z, каждый кадр смотрит на кисть
	for i in 2:
		var a := Node3D.new()
		a.position = _arm_from[i]
		add_child(a)
		var sl := Mats.mi(Geo.cylinder(0.07, 0.085, 1.0, 16), sleeve, a, Vector3(0, 0, -0.5), Vector3(PI / 2, 0, 0))
		sl.name = "sleeve"
		var cf := Mats.mi(Geo.cylinder(0.066, 0.072, 0.07, 16), cuff, a, Vector3(0, 0, -0.95), Vector3(PI / 2, 0, 0))
		cf.name = "cuff"
		_arms.append(a)
	for c in get_children():
		_no_shadow(c)


func _no_shadow(n: Node) -> void:
	if n is GeometryInstance3D:
		(n as GeometryInstance3D).cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	for c in n.get_children():
		_no_shadow(c)


func _process(dt: float) -> void:
	_t += dt
	# удилище смотрит вперёд (-Z камеры): поворот оси Y к -Z
	_pivot.rotation = Vector3(-pitch, 0.08, -lean * 0.45 - 0.08)
	_pivot.position = Vector3(0.24 + lean * 0.05, -0.36 + sin(_t * 1.7) * 0.004, -0.5)
	for i in _segs.size():
		_segs[i].rotation.x = -bend * (0.25 + float(i) / SEGS) / SEGS * 2.2
		_segs[i].rotation.z = lean * bend * 0.08
	if reeling:
		_crank += dt * 14.0
	_handle.rotation.z = -_crank
	var hands := [_pivot.position + _pivot.basis * Vector3(0.0, 0.0, 0.03), to_local(_left.global_position) if _left else _pivot.position]
	for i in 2:
		var a := _arms[i]
		var d: Vector3 = hands[i] - a.position
		var l := d.length()
		if l > 0.01:
			a.basis = Basis.looking_at(d / l, Vector3.UP)
		a.get_node("sleeve").scale = Vector3(1, l - 0.04, 1)
		a.get_node("sleeve").position = Vector3(0, 0, -(l - 0.04) / 2)
		a.get_node("cuff").position = Vector3(0, 0, -l + 0.06)
	if _left:
		_left.position = Vector3(0.09, 0.0, 0.04) + Vector3(0, cos(_crank) * 0.04, sin(_crank) * 0.04)
