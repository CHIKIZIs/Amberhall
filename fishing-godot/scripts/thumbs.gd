class_name Thumbs
## Рендер миниатюр рыб в отдельном SubViewport.


static func aabb_of(n: Node3D) -> AABB:
	var box := AABB()
	var first := true
	var stack: Array = [n]
	var inv := n.global_transform.affine_inverse() if n.is_inside_tree() else Transform3D.IDENTITY
	while stack.size() > 0:
		var c: Node = stack.pop_back()
		stack.append_array(c.get_children())
		if c is MeshInstance3D and c.mesh:
			var xf := _rel(c, n)
			var b: AABB = xf * c.mesh.get_aabb()
			if first:
				box = b
				first = false
			else:
				box = box.merge(b)
	return box


static func _rel(c: Node3D, root: Node3D) -> Transform3D:
	var xf := Transform3D.IDENTITY
	var cur: Node = c
	while cur != root and cur is Node3D:
		xf = (cur as Node3D).transform * xf
		cur = cur.get_parent()
	return xf


static func render_all(host: Node) -> Dictionary:
	var vp := SubViewport.new()
	vp.size = Vector2i(320, 200)
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_4X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	host.add_child(vp)
	var env := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("#a8c8cc")
	e.ambient_light_energy = 0.9
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.environment = e
	vp.add_child(env)
	var key := DirectionalLight3D.new()
	key.light_energy = 1.7
	key.light_color = Color("#fff0dc")
	vp.add_child(key)
	key.look_at_from_position(Vector3(2, 4, 5), Vector3.ZERO)
	var rim := DirectionalLight3D.new()
	rim.light_energy = 0.9
	rim.light_color = Color("#8fd4ff")
	vp.add_child(rim)
	rim.look_at_from_position(Vector3(-3, 2, -4), Vector3.ZERO)
	var cam := Camera3D.new()
	cam.fov = 28
	vp.add_child(cam)
	var out := {}
	for f in Fishes.LIST:
		var holder := Node3D.new()
		vp.add_child(holder)
		var m := Fishes.build(f)
		Fishes.set_swim(m, 0.0, 0.0)
		holder.add_child(m)
		holder.rotation = Vector3(0.15, -0.55, 0)
		if f.m.get("kind", "") == "flat":
			holder.rotation = Vector3(0.75, -0.5, 0)
		if f.m.get("kind", "") == "crab":
			holder.rotation = Vector3(0.6, -0.9, 0)
		var box := aabb_of(holder)
		var c := holder.transform * Vector3.ZERO
		box = AABB()
		# габариты в мировых координатах держателя
		var b2 := aabb_of(m)
		var corners := []
		for i in 8:
			corners.append(holder.transform * (m.transform * b2.get_endpoint(i)))
		var mn: Vector3 = corners[0]
		var mx: Vector3 = corners[0]
		for p in corners:
			mn = mn.min(p)
			mx = mx.max(p)
		var cen := (mn + mx) / 2
		var sz := mx - mn
		var d: float = max(sz.x / 2 / tan(deg_to_rad(14)) / 1.6, sz.y / 2 / tan(deg_to_rad(14))) * 1.15 + sz.z / 2
		cam.position = cen + Vector3(0, d * 0.12, d)
		cam.look_at(cen)
		await RenderingServer.frame_post_draw
		await RenderingServer.frame_post_draw
		var img := vp.get_texture().get_image()
		out[f.id] = ImageTexture.create_from_image(img)
		holder.queue_free()
	vp.queue_free()
	return out
