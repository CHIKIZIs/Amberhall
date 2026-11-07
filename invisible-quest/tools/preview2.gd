extends SceneTree
func _init() -> void:
	var root := Node3D.new(); get_root().add_child(root)
	var env := WorldEnvironment.new(); env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR; env.environment.background_color = Color(0.3,0.5,0.3)
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR; env.environment.ambient_light_color = Color(0.6,0.6,0.6)
	root.add_child(env)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-60, 30, 0); root.add_child(sun)
	W.place(root, "res://assets/roads/road-straight.glb", Vector3(-8,0,0), 0, 8.0, false)
	W.place(root, "res://assets/roads/road-crossing.glb", Vector3(0,0,0), 0, 8.0, false)
	W.place(root, "res://assets/roads/road-straight.glb", Vector3(8,0,0), 0, 8.0, false)
	W.place(root, "res://assets/furniture/loungeSofa.obj", Vector3(0,0,8), 0, 0.2, false, true)
	var c := W.instance("res://assets/characters/character-male-a.glb"); c.scale = Vector3.ONE*2.5; c.position = Vector3(0,0,8); root.add_child(c)
	var ap: AnimationPlayer = c.find_child("AnimationPlayer", true, false); ap.play("sit"); ap.seek(0.5, true)
	var c2 := W.instance("res://assets/characters/character-male-a.glb"); c2.scale = Vector3.ONE*2.5; c2.position = Vector3(3,0,8); root.add_child(c2)
	W.place(root, "res://assets/furniture/chair.obj", Vector3(-3,0,8), 0, 0.2, false, true)
	W.place(root, "res://assets/furniture/desk.obj", Vector3(-6,0,8), 0, 0.2, false, true)
	W.label(root, "+X", Vector3(12,0.5,0), 200); W.label(root, "+Z", Vector3(0,0.5,13), 200)
	var cam := Camera3D.new(); root.add_child(cam); cam.look_at_from_position(Vector3(-1, 2.5, 13), Vector3(-1.5,0.8,8))
	for i in 10: await process_frame
	await RenderingServer.frame_post_draw
	get_root().get_texture().get_image().save_png("res://build/preview2.png")
	quit()
