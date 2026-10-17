class_name Water
extends MeshInstance3D
## Поверхность моря. Волны считаются одинаково на GPU (шейдер) и на CPU
## (height()), чтобы лодка, поплавок и чайки честно качались на них.

const WAVES := [
	Vector4(1.0, 0.35, 0.10, 11.0),
	Vector4(0.25, 1.0, 0.09, 7.0),
	Vector4(-0.7, 0.75, 0.06, 4.1),
	Vector4(0.85, -0.45, 0.045, 2.6),
]
const RIP_SPEED := 3.0
const SLOTS := 24

var t := 0.0
var ripples := PackedVector4Array()
var _slot := 0
var mat: ShaderMaterial
var follow: Node3D


func _init() -> void:
	mesh = _radial_mesh()
	mat = ShaderMaterial.new()
	mat.shader = load("res://shaders/water.gdshader")
	mat.set_shader_parameter("nmap_a", Mats.nmap_a)
	mat.set_shader_parameter("nmap_b", Mats.nmap_b)
	mat.set_shader_parameter("foam_noise", Mats.grain)
	material_override = mat
	cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	extra_cull_margin = 6.0
	ripples.resize(SLOTS)
	for i in SLOTS:
		ripples[i] = Vector4(0, 0, -100, 0)


func _process(dt: float) -> void:
	t += dt
	mat.set_shader_parameter("wave_time", t)
	mat.set_shader_parameter("ripples", ripples)
	if follow:
		var p := follow.global_position
		position = Vector3(snappedf(p.x, 0.5), 0.0, snappedf(p.z, 0.5))


## Радиальная сетка до горизонта: густая у центра, редкая вдали.
func _radial_mesh() -> ArrayMesh:
	var segs := 160
	var radii := PackedFloat32Array([0.0])
	var r := 0.0
	var step := 0.3
	while r < 1800.0:
		r += step
		step *= 1.072
		radii.append(r)
	var verts := PackedVector3Array()
	var norms := PackedVector3Array()
	var idx := PackedInt32Array()
	verts.append(Vector3.ZERO)
	norms.append(Vector3.UP)
	for i in range(1, radii.size()):
		for k in segs:
			var a := TAU * k / segs + (0.5 * TAU / segs if i % 2 else 0.0)
			verts.append(Vector3(cos(a) * radii[i], 0, sin(a) * radii[i]))
			norms.append(Vector3.UP)
	for k in segs:
		idx.append_array([0, 1 + k, 1 + (k + 1) % segs])
	for i in range(1, radii.size() - 1):
		var a0 := 1 + (i - 1) * segs
		var b0 := 1 + i * segs
		for k in segs:
			var k2 := (k + 1) % segs
			idx.append_array([a0 + k, b0 + k, a0 + k2])
			idx.append_array([a0 + k2, b0 + k, b0 + k2])
	var arr := []
	arr.resize(Mesh.ARRAY_MAX)
	arr[Mesh.ARRAY_VERTEX] = verts
	arr[Mesh.ARRAY_NORMAL] = norms
	arr[Mesh.ARRAY_INDEX] = idx
	var m := ArrayMesh.new()
	m.add_surface_from_arrays(Mesh.PRIMITIVE_TRIANGLES, arr)
	m.custom_aabb = AABB(Vector3(-1800, -2, -1800), Vector3(3600, 4, 3600))
	return m


## Круг на воде: всплеск, поклёвка, след лодки.
func ripple(pos: Vector3, strength: float) -> void:
	ripples[_slot] = Vector4(pos.x, pos.z, t, strength)
	_slot = (_slot + 1) % SLOTS


func height(x: float, z: float) -> float:
	var h := 0.0
	for w in WAVES:
		var k: float = TAU / w.w
		var c := sqrt(9.8 / k)
		var d := Vector2(w.x, w.y).normalized()
		h += (w.z / k) * sin(k * (d.dot(Vector2(x, z)) - c * t))
	for r in ripples:
		if r.w <= 0.0:
			continue
		var age := t - r.z
		if age < 0.0 or age > 6.0:
			continue
		var d := Vector2(x - r.x, z - r.y).length() + 0.0001
		var front := age * RIP_SPEED
		var env := r.w * exp(-age * 0.85) * exp(-max(0.0, front - d) * 0.45) * (1.0 - smoothstep(front - 0.3, front + 0.7, d)) / (1.0 + d * 0.3)
		h += env * sin((d - front) * 4.2)
	return h


func normal(x: float, z: float) -> Vector3:
	var e := 0.4
	var hx := height(x + e, z) - height(x - e, z)
	var hz := height(x, z + e) - height(x, z - e)
	return Vector3(-hx, 2.0 * e, -hz).normalized()
