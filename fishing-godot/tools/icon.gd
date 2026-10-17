extends SceneTree
## Рендер рыбы для иконки приложения: godot --path . -s res://tools/icon.gd -- out_dir


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	Mats.init()
	Fishes.init()
	var out: String = OS.get_cmdline_user_args()[0]
	var vp := SubViewport.new()
	vp.size = Vector2i(1024, 1024)
	vp.own_world_3d = true
	vp.transparent_bg = true
	vp.msaa_3d = Viewport.MSAA_8X
	vp.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	root.add_child(vp)
	var we := WorldEnvironment.new()
	var e := Environment.new()
	e.background_mode = Environment.BG_CLEAR_COLOR
	e.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	e.ambient_light_color = Color("#ffd2a8")
	e.ambient_light_energy = 0.7
	e.tonemap_mode = Environment.TONE_MAPPER_ACES
	e.tonemap_exposure = 1.1
	we.environment = e
	vp.add_child(we)
	var key := DirectionalLight3D.new()
	key.light_color = Color("#ffd9a8")
	key.light_energy = 2.2
	vp.add_child(key)
	key.look_at_from_position(Vector3(3, 4, 5), Vector3.ZERO)
	var rim := DirectionalLight3D.new()
	rim.light_color = Color("#7fe0ff")
	rim.light_energy = 1.6
	vp.add_child(rim)
	rim.look_at_from_position(Vector3(-4, 1, -3), Vector3.ZERO)
	var cam := Camera3D.new()
	cam.fov = 26
	vp.add_child(cam)
	for id in ["mahi", "gold", "marlin", "tuna"]:
		var holder := Node3D.new()
		vp.add_child(holder)
		var f := Fishes.by_id(id)
		var m := Fishes.build(f)
		Fishes.set_swim(m, 0.0, 0.0)
		holder.add_child(m)
		holder.rotation = Vector3(0.35, -0.35, 0.55)
		var b := Thumbs.aabb_of(m)
		m.position = -b.get_center()
		var r: float = max(b.size.x, max(b.size.y, b.size.z)) * 0.5
		cam.position = Vector3(0, 0, r / tan(deg_to_rad(13)) * 1.05)
		cam.look_at(Vector3.ZERO)
		for i in 4:
			await RenderingServer.frame_post_draw
		vp.get_texture().get_image().save_png(out + "/fish_" + id + ".png")
		print("rendered ", id)
		holder.queue_free()
	quit()
