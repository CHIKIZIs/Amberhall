extends SceneTree
func _aabb(n: Node, xf: Transform3D, acc: Array) -> void:
	if n is MeshInstance3D:
		var a: AABB = (xf * n.transform) * n.get_aabb()
		acc[0] = a if acc[0] == null else acc[0].merge(a)
	for c in n.get_children():
		var t := xf
		if n is Node3D: t = xf * n.transform
		_aabb(c, t if not (n is MeshInstance3D) else xf * n.transform, acc)
func _init() -> void:
	for path in OS.get_cmdline_user_args():
		var res = load(path)
		if res == null: print("FAIL ", path); continue
		var inst: Node
		if res is PackedScene: inst = res.instantiate()
		elif res is Mesh:
			var mi := MeshInstance3D.new(); mi.mesh = res; inst = mi
		var acc := [null]
		_aabb(inst, Transform3D.IDENTITY, acc)
		var anims := []
		var ap = inst.find_child("AnimationPlayer", true, false)
		if ap: anims = ap.get_animation_list()
		print(path.get_file(), " size=", acc[0].size if acc[0] else null, " pos=", acc[0].position if acc[0] else null, " anims=", anims)
	quit()
