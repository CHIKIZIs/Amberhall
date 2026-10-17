class_name Geo
## Процедурные меши: скошенные бруски, тела вращения, трубки, лофты.
## Godot считает лицевой грань с обходом по часовой стрелке — tri() сам
## выбирает порядок вершин по подсказке «наружу».


static func tri(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, out: Vector3) -> void:
	if (b - a).cross(c - a).dot(out) > 0.0:
		st.add_vertex(a); st.add_vertex(c); st.add_vertex(b)
	else:
		st.add_vertex(a); st.add_vertex(b); st.add_vertex(c)


static func quad(st: SurfaceTool, a: Vector3, b: Vector3, c: Vector3, d: Vector3, out: Vector3) -> void:
	tri(st, a, b, c, out)
	tri(st, a, c, d, out)


static func _finish(st: SurfaceTool, smooth: bool) -> ArrayMesh:
	if smooth:
		st.index()
	st.generate_normals()
	return st.commit()


## Брусок со скошенными рёбрами — доски, балки, ящики.
static func bevel_box(size: Vector3, bevel: float = 0.03) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	st.set_smooth_group(-1)
	var h := size * 0.5
	var b: float = min(bevel, min(h.x, min(h.y, h.z)) * 0.45)
	# грани
	for ax in 3:
		for s in [-1.0, 1.0]:
			var n := Vector3.ZERO
			n[ax] = s
			var u := (ax + 1) % 3
			var v := (ax + 2) % 3
			var pts: Array[Vector3] = []
			for c in [[-1, -1], [1, -1], [1, 1], [-1, 1]]:
				var p := Vector3.ZERO
				p[ax] = s * h[ax]
				p[u] = c[0] * (h[u] - b)
				p[v] = c[1] * (h[v] - b)
				pts.append(p)
			quad(st, pts[0], pts[1], pts[2], pts[3], n)
	# рёбра
	for ax in 3:
		var u := (ax + 1) % 3
		var v := (ax + 2) % 3
		for su in [-1.0, 1.0]:
			for sv in [-1.0, 1.0]:
				var out := Vector3.ZERO
				out[u] = su
				out[v] = sv
				var p := []
				for sa in [-1.0, 1.0]:
					var q1 := Vector3.ZERO
					q1[ax] = sa * (h[ax] - b); q1[u] = su * h[u]; q1[v] = sv * (h[v] - b)
					var q2 := Vector3.ZERO
					q2[ax] = sa * (h[ax] - b); q2[u] = su * (h[u] - b); q2[v] = sv * h[v]
					p.append(q1); p.append(q2)
				quad(st, p[0], p[1], p[3], p[2], out)
	# углы
	for sx in [-1.0, 1.0]:
		for sy in [-1.0, 1.0]:
			for sz in [-1.0, 1.0]:
				var a := Vector3(sx * h.x, sy * (h.y - b), sz * (h.z - b))
				var c := Vector3(sx * (h.x - b), sy * h.y, sz * (h.z - b))
				var d := Vector3(sx * (h.x - b), sy * (h.y - b), sz * h.z)
				tri(st, a, c, d, Vector3(sx, sy, sz))
	return _finish(st, false)


## Тело вращения вокруг оси Y по профилю (x = радиус, y = высота).
static func lathe(profile: PackedVector2Array, segs: int = 16, smooth: bool = true, cap: bool = true) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	if not smooth:
		st.set_smooth_group(-1)
	for i in profile.size() - 1:
		for j in segs:
			var a0 := TAU * j / segs
			var a1 := TAU * (j + 1) / segs
			var p := profile[i]
			var q := profile[i + 1]
			var v00 := Vector3(cos(a0) * p.x, p.y, sin(a0) * p.x)
			var v01 := Vector3(cos(a1) * p.x, p.y, sin(a1) * p.x)
			var v10 := Vector3(cos(a0) * q.x, q.y, sin(a0) * q.x)
			var v11 := Vector3(cos(a1) * q.x, q.y, sin(a1) * q.x)
			var mid := (v00 + v11) * 0.5
			var out := Vector3(mid.x, 0, mid.z).normalized()
			if out == Vector3.ZERO:
				out = Vector3.UP * sign(q.y - p.y)
			# наружная нормаль профиля: поворот касательной
			var t := Vector2(q.x - p.x, q.y - p.y)
			var pn := Vector2(t.y, -t.x)
			var o3 := out * pn.x + Vector3.UP * pn.y
			if o3.length() < 0.001:
				o3 = out
			if p.x > 0.0001:
				tri(st, v00, v01, v11, o3)
			if q.x > 0.0001:
				tri(st, v00, v11, v10, o3)
	if cap:
		var top := profile[profile.size() - 1]
		var bot := profile[0]
		for j in segs:
			var a0 := TAU * j / segs
			var a1 := TAU * (j + 1) / segs
			if top.x > 0.0001:
				tri(st, Vector3(0, top.y, 0), Vector3(cos(a0) * top.x, top.y, sin(a0) * top.x), Vector3(cos(a1) * top.x, top.y, sin(a1) * top.x), Vector3.UP)
			if bot.x > 0.0001:
				tri(st, Vector3(0, bot.y, 0), Vector3(cos(a0) * bot.x, bot.y, sin(a0) * bot.x), Vector3(cos(a1) * bot.x, bot.y, sin(a1) * bot.x), Vector3.DOWN)
	return _finish(st, smooth)


static func cylinder(r_bot: float, r_top: float, h: float, segs: int = 12, smooth: bool = true) -> ArrayMesh:
	return lathe(PackedVector2Array([Vector2(r_bot, -h * 0.5), Vector2(r_top, h * 0.5)]), segs, smooth, true)


static func sphere(r: float, segs: int = 14, rings: int = 9) -> ArrayMesh:
	var prof := PackedVector2Array()
	for i in rings + 1:
		var a := PI * i / rings - PI * 0.5
		prof.append(Vector2(cos(a) * r, sin(a) * r))
	prof[0].x = 0.0
	prof[rings].x = 0.0
	return lathe(prof, segs, true, false)


## Трубка вдоль ломаной — верёвки, леерные тросы, поручни.
static func tube(points: PackedVector3Array, r: float, sides: int = 6) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var rings: Array = []
	for i in points.size():
		var t: Vector3
		if i == 0:
			t = points[1] - points[0]
		elif i == points.size() - 1:
			t = points[i] - points[i - 1]
		else:
			t = points[i + 1] - points[i - 1]
		t = t.normalized()
		var up := Vector3.UP if abs(t.y) < 0.95 else Vector3.RIGHT
		var n1 := t.cross(up).normalized()
		var n2 := t.cross(n1).normalized()
		var ring := []
		for k in sides:
			var a := TAU * k / sides
			ring.append(points[i] + (n1 * cos(a) + n2 * sin(a)) * r)
		rings.append(ring)
	for i in points.size() - 1:
		for k in sides:
			var k2 := (k + 1) % sides
			var a: Vector3 = rings[i][k]
			var b: Vector3 = rings[i][k2]
			var c: Vector3 = rings[i + 1][k2]
			var d: Vector3 = rings[i + 1][k]
			var out := ((a + b + c + d) * 0.25 - (points[i] + points[i + 1]) * 0.5).normalized()
			quad(st, a, b, c, d, out)
	return _finish(st, true)


## Лофт: последовательность замкнутых сечений (одинаковое число точек).
## Используется для корпуса лодки и тел рыб.
static func loft(sections: Array, close_ends: bool = true, smooth: bool = true) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	if not smooth:
		st.set_smooth_group(-1)
	var n: int = sections[0].size()
	var centers: Array[Vector3] = []
	for s in sections:
		var c := Vector3.ZERO
		for p in s:
			c += p
		centers.append(c / n)
	for i in sections.size() - 1:
		for k in n:
			var k2 := (k + 1) % n
			var a: Vector3 = sections[i][k]
			var b: Vector3 = sections[i][k2]
			var c: Vector3 = sections[i + 1][k2]
			var d: Vector3 = sections[i + 1][k]
			var mid := (a + b + c + d) * 0.25
			var out := mid - (centers[i] + centers[i + 1]) * 0.5
			if (a - d).length() < 0.0001 and (b - c).length() < 0.0001:
				continue
			if (a - b).length() > 0.00001:
				tri(st, a, b, c, out)
			if (c - d).length() > 0.00001:
				tri(st, a, c, d, out)
	if close_ends:
		for e in [0, sections.size() - 1]:
			var s: Array = sections[e]
			var other: Vector3 = centers[1] if e == 0 else centers[sections.size() - 2]
			var out := (centers[e] - other).normalized()
			for k in n:
				var a: Vector3 = s[k]
				var b: Vector3 = s[(k + 1) % n]
				if (a - b).length() > 0.00001:
					tri(st, centers[e], a, b, out)
	return _finish(st, smooth)


## Плоская фигура (плавник, флажок) в плоскости XY.
static func flat(poly: PackedVector2Array, thickness: float = 0.0) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	var idx := Geometry2D.triangulate_polygon(poly)
	for side in ([1.0, -1.0] if thickness > 0.0 else [1.0]):
		for i in range(0, idx.size(), 3):
			var a := Vector3(poly[idx[i]].x, poly[idx[i]].y, side * thickness * 0.5)
			var b := Vector3(poly[idx[i + 1]].x, poly[idx[i + 1]].y, side * thickness * 0.5)
			var c := Vector3(poly[idx[i + 2]].x, poly[idx[i + 2]].y, side * thickness * 0.5)
			tri(st, a, b, c, Vector3(0, 0, side))
	return _finish(st, false)


## Тор (спасательные круги, покрышки, обручи бочек).
static func torus(r: float, tube_r: float, segs: int = 24, sides: int = 10) -> ArrayMesh:
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in segs:
		for k in sides:
			var pts := []
			for di in [0, 1]:
				for dk in [0, 1]:
					var a: float = TAU * (i + di) / segs
					var b: float = TAU * (k + dk) / sides
					var c := Vector3(cos(a), 0, sin(a))
					pts.append(c * (r + cos(b) * tube_r) + Vector3.UP * sin(b) * tube_r)
			var a0 := TAU * (i + 0.5) / segs
			var cen := Vector3(cos(a0), 0, sin(a0)) * r
			var mid: Vector3 = (pts[0] + pts[1] + pts[2] + pts[3]) * 0.25
			quad(st, pts[0], pts[2], pts[3], pts[1], mid - cen)
	return _finish(st, true)


static func catenary(a: Vector3, b: Vector3, sag: float, n: int = 16) -> PackedVector3Array:
	var pts := PackedVector3Array()
	for i in n + 1:
		var t := float(i) / n
		pts.append(a.lerp(b, t) + Vector3.DOWN * sag * 4.0 * t * (1.0 - t))
	return pts
