extends SceneTree
func _init() -> void:
	var root := Node3D.new()
	get_root().add_child(root)
	var env := WorldEnvironment.new(); env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_SKY
	var sky := Sky.new(); sky.sky_material = ProceduralSkyMaterial.new(); env.environment.sky = sky
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	root.add_child(env)
	var sun := DirectionalLight3D.new(); sun.rotation_degrees = Vector3(-50, 30, 0); sun.shadow_enabled = true; root.add_child(sun)
	var items := [["res://assets/suburban/building-type-a.glb", Vector3(-5,0,0), 6.0], ["res://assets/commercial/building-a.glb", Vector3(5,0,0), 6.0],
		["res://assets/characters/character-male-a.glb", Vector3(0,0,4), 2.5], ["res://assets/cars/sedan.glb", Vector3(3,0,5), 1.75],
		["res://assets/roads/road-crossing.glb", Vector3(0,0,8), 6.0], ["res://assets/furniture/loungeSofa.obj", Vector3(-2,0,5), 0.2]]
	for it in items:
		var r = load(it[0]); var n: Node3D
		if r is PackedScene: n = r.instantiate()
		else: n = MeshInstance3D.new(); n.mesh = r
		n.position = it[1]; n.scale = Vector3.ONE * it[2]; root.add_child(n)
		var ap = n.find_child("AnimationPlayer", true, false)
		if ap: ap.play("idle")
	var cam := Camera3D.new(); cam.position = Vector3(0, 6, 18); root.add_child(cam); cam.look_at(Vector3(0, 1.5, 0))
	for i in 10: await process_frame
	await RenderingServer.frame_post_draw
	get_root().get_texture().get_image().save_png("res://build/preview.png")
	quit()
