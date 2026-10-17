class_name Mats
## Общие материалы и процедурные текстуры.

static var _cache := {}
static var grain: NoiseTexture2D
static var noise: NoiseTexture2D
static var nmap_a: NoiseTexture2D
static var nmap_b: NoiseTexture2D


static func init() -> void:
	grain = _noise(512, 0.02, FastNoiseLite.TYPE_SIMPLEX_SMOOTH, 4, false)
	noise = _noise(256, 0.03, FastNoiseLite.TYPE_CELLULAR, 2, false)
	nmap_a = _noise(256, 0.035, FastNoiseLite.TYPE_SIMPLEX_SMOOTH, 3, true)
	nmap_b = _noise(256, 0.06, FastNoiseLite.TYPE_PERLIN, 3, true)


static func _noise(size: int, freq: float, t: int, oct: int, normal: bool) -> NoiseTexture2D:
	var fn := FastNoiseLite.new()
	fn.noise_type = t
	fn.frequency = freq
	fn.fractal_octaves = oct
	var tx := NoiseTexture2D.new()
	tx.width = size
	tx.height = size
	tx.seamless = true
	tx.noise = fn
	tx.generate_mipmaps = true
	if normal:
		tx.as_normal_map = true
		tx.bump_strength = 6.0
	return tx


static func shader(path: String) -> Shader:
	if not _cache.has(path):
		_cache[path] = load(path)
	return _cache[path]


## Дерево. axis — вдоль какой локальной оси идут волокна.
static func wood(col: Color, axis: int = 0, opts: Dictionary = {}) -> ShaderMaterial:
	var key := "wood%s%d%s" % [col.to_html(), axis, str(opts)]
	if _cache.has(key):
		return _cache[key]
	var m := ShaderMaterial.new()
	m.shader = shader("res://shaders/wood.gdshader")
	m.set_shader_parameter("albedo", col)
	m.set_shader_parameter("axis", axis)
	m.set_shader_parameter("grain_tex", grain)
	for k in opts:
		m.set_shader_parameter(k, opts[k])
	_cache[key] = m
	return m


static func paint(col: Color, axis: int = 0) -> ShaderMaterial:
	return wood(col, axis, {"paint": 1.0, "rough": 0.6})


static func std(col: Color, rough: float = 0.7, metal: float = 0.0, opts: Dictionary = {}) -> StandardMaterial3D:
	var key := "std%s%f%f%s" % [col.to_html(), rough, metal, str(opts)]
	if _cache.has(key):
		return _cache[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = col
	m.roughness = rough
	m.metallic = metal
	for k in opts:
		m.set(k, opts[k])
	_cache[key] = m
	return m


static func glow(col: Color, power: float = 4.0) -> ShaderMaterial:
	var m := ShaderMaterial.new()
	m.shader = shader("res://shaders/glow_glass.gdshader")
	m.set_shader_parameter("col", col)
	m.set_shader_parameter("power", power)
	m.set_shader_parameter("seed", randf() * 10.0)
	return m


static func mi(mesh: Mesh, mat: Material, parent: Node, pos := Vector3.ZERO, rot := Vector3.ZERO, shadow := true) -> MeshInstance3D:
	var m := MeshInstance3D.new()
	m.mesh = mesh
	m.material_override = mat
	m.position = pos
	m.rotation = rot
	m.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadow else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	parent.add_child(m)
	return m
