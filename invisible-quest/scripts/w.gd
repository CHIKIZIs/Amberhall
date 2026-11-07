class_name W
extends RefCounted
## Строительные инструменты: модели Kenney, коробки, стены, материалы, коллизии.

const L_WORLD := 1      # стены, мебель, здания
const L_NPC := 2        # люди
const L_ITEM := 4       # предметы, которые можно взять
const L_PLAYER := 8

static var _cache := {}
static var _mats := {}

static func res(path: String) -> Resource:
	if not _cache.has(path): _cache[path] = load(path)
	return _cache[path]

static func instance(path: String) -> Node3D:
	var r := res(path)
	if r is PackedScene: return (r as PackedScene).instantiate()
	var mi := MeshInstance3D.new()
	mi.mesh = r
	return mi

## Габариты модели в её собственных координатах (без масштаба корня).
static func aabb_of(n: Node3D) -> AABB:
	var acc: AABB
	var has := false
	var stack: Array = [[n, Transform3D.IDENTITY]]
	while not stack.is_empty():
		var e: Array = stack.pop_back()
		var node: Node = e[0]
		var xf: Transform3D = e[1]
		if node is MeshInstance3D and node.mesh:
			var a: AABB = xf * (node as MeshInstance3D).mesh.get_aabb()
			acc = a if not has else acc.merge(a)
			has = true
		for c in node.get_children():
			if c is Node3D: stack.append([c, xf * (c as Node3D).transform])
	return acc

## Поставить модель. center: выровнять по центру и по полу (для мебели из OBJ).
## collide: добавить коробку-коллизию по габаритам; shrink уменьшает её по X/Z.
static func place(parent: Node3D, path: String, pos: Vector3, rot_deg := 0.0, s := 1.0,
		collide := true, center := false, shrink := 1.0) -> Node3D:
	var holder := Node3D.new()
	holder.position = pos
	holder.rotation.y = deg_to_rad(rot_deg)
	parent.add_child(holder)
	var m := instance(path)
	var bb := aabb_of(m)
	m.scale = Vector3.ONE * s
	if center:
		m.position = Vector3(-(bb.position.x + bb.size.x / 2) * s, -bb.position.y * s, -(bb.position.z + bb.size.z / 2) * s)
	holder.add_child(m)
	var size := bb.size * s
	if collide:
		var body := StaticBody3D.new()
		body.collision_layer = L_WORLD
		body.collision_mask = 0
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = Vector3(size.x * shrink, size.y, size.z * shrink)
		cs.shape = sh
		cs.position = m.position + (bb.position + bb.size / 2) * s
		body.add_child(cs)
		holder.add_child(body)
	holder.set_meta("size", size)
	holder.set_meta("model", m)
	return holder

static func mat(c: Color, rough := 0.85, emissive := 0.0) -> StandardMaterial3D:
	var key := "%s|%s|%s" % [c.to_html(), rough, emissive]
	if _mats.has(key): return _mats[key]
	var m := StandardMaterial3D.new()
	m.albedo_color = c
	m.roughness = rough
	if c.a < 1.0: m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	if emissive > 0.0:
		m.emission_enabled = true
		m.emission = c
		m.emission_energy_multiplier = emissive
	_mats[key] = m
	return m

static func unshaded(c: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	m.albedo_color = c
	if c.a < 1.0: m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return m

static func box(parent: Node3D, size: Vector3, pos: Vector3, material: Material, collide := true, rot_y := 0.0) -> MeshInstance3D:
	var bm := BoxMesh.new()
	bm.size = size
	var mi := MeshInstance3D.new()
	mi.mesh = bm
	mi.material_override = material
	mi.position = pos
	mi.rotation.y = rot_y
	parent.add_child(mi)
	if collide:
		var body := StaticBody3D.new()
		body.collision_layer = L_WORLD
		body.collision_mask = 0
		var cs := CollisionShape3D.new()
		var sh := BoxShape3D.new()
		sh.size = size
		cs.shape = sh
		body.add_child(cs)
		mi.add_child(body)
	return mi

## Стена от a до b (точки на полу XZ) с проёмами gaps: [[смещение центра от a, ширина], ...].
## Над проёмами — перемычка. Возвращает массив сегментов.
static func wall(parent: Node3D, a: Vector2, b: Vector2, material: Material, gaps := [], h := 2.7, thick := 0.14, door_h := 2.15) -> void:
	var dir := (b - a)
	var length := dir.length()
	dir = dir / length
	var rot := atan2(-dir.y, dir.x)
	var cuts: Array = []
	for g in gaps: cuts.append([g[0] - g[1] / 2.0, g[0] + g[1] / 2.0])
	cuts.sort_custom(func(p, q): return p[0] < q[0])
	var t := 0.0
	for c in cuts + [[length, length]]:
		if c[0] > t + 0.01:
			var mid: float = (t + c[0]) / 2.0
			var p := a + dir * mid
			box(parent, Vector3(c[0] - t, h, thick), Vector3(p.x, h / 2, p.y), material, true, rot)
		if c[1] > c[0]:
			var midg: float = (c[0] + c[1]) / 2.0
			var pg := a + dir * midg
			box(parent, Vector3(c[1] - c[0], h - door_h, thick), Vector3(pg.x, door_h + (h - door_h) / 2, pg.y), material, true, rot)
		t = c[1]

static func label(parent: Node3D, text: String, pos: Vector3, size := 64, color := Color.WHITE, rot_y := 0.0, px := 0.01) -> Label3D:
	var l := Label3D.new()
	l.text = text
	l.font_size = size
	l.pixel_size = px
	l.modulate = color
	l.outline_size = 0
	l.position = pos
	l.rotation.y = rot_y
	parent.add_child(l)
	return l

## Процедурная текстура: доски пола.
static func planks_tex(base: Color) -> ImageTexture:
	var img := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	for y in range(0, 128, 16):
		var c := base.lightened(randf_range(-0.08, 0.08))
		img.fill_rect(Rect2i(0, y, 128, 16), c)
		img.fill_rect(Rect2i(0, y, 128, 1), base.darkened(0.35))
		img.fill_rect(Rect2i(randi() % 128, y, 1, 16), base.darkened(0.35))
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)

static func tiles_tex(a: Color, b: Color) -> ImageTexture:
	var img := Image.create(64, 64, false, Image.FORMAT_RGBA8)
	for y in 2:
		for x in 2:
			img.fill_rect(Rect2i(x * 32, y * 32, 32, 32), a if (x + y) % 2 == 0 else b)
	img.generate_mipmaps()
	return ImageTexture.create_from_image(img)

static func tex_mat(tex: Texture2D, uv_scale: Vector3, rough := 0.8) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_texture = tex
	m.uv1_scale = uv_scale
	m.roughness = rough
	m.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS_ANISOTROPIC
	return m
