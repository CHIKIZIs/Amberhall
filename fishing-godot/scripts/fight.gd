class_name Fight
extends RefCounted
## Вываживание: натяжение лески, метры до рыбы, рывки и усталость рыбы.
## Держишь — подматываешь (натяжение растёт), отпускаешь — рыба берёт леску.
## Ведёшь удилище против рывка — рыба быстрее устаёт и натяжение меньше.

var f: Dictionary
var line := 20.0
var line0 := 20.0
var tension := 0.3
var stamina := 1.0
var running := false
var run_dir := 0.0
var side := 0.0
var power := 0.5
var result := ""
var jump_now := false
var _run_t := 0.0
var _over := 0.0
var _slack := 0.0
var _reel_speed := 1.7
var _tol := 1.0


func _init(fish: Dictionary, dist: float, rod_lv: int, line_lv: int) -> void:
	f = fish
	power = 0.3 + fish.d * 0.7
	line0 = dist * 1.4 + 8.0 + fish.tier * 6.0 + clampf(fish.max / 20.0, 0.0, 10.0)
	line = line0
	_reel_speed = 1.6 * (1.0 + 0.09 * rod_lv)
	_tol = 1.0 - 0.06 * line_lv
	_run_t = randf_range(0.6, 1.4)


func overload() -> float:
	return _over / 0.75


func slack() -> float:
	return _slack / 3.2


func update(dt: float, holding: bool, side_in: float) -> void:
	jump_now = false
	side = lerpf(side, side_in, min(1.0, dt * 6.0))
	_run_t -= dt
	if _run_t <= 0.0:
		running = not running if randf() < 0.85 else running
		if running:
			_run_t = randf_range(1.3, 3.2) * (0.6 + power) * (0.5 + 0.5 * stamina)
			run_dir = -1.0 if randf() < 0.5 else 1.0
			# эпические рыбы выпрыгивают на рывке
			if f.tier >= 2 and randf() < 0.25 + f.tier * 0.08 and not f.junk:
				jump_now = true
		else:
			_run_t = randf_range(1.2, 2.8) * (1.3 - power * 0.5)
			run_dir *= 0.3
	var pull := (0.55 + 0.45 * power if running else 0.12 + 0.15 * power) * (0.3 + 0.7 * stamina)
	if f.junk:
		pull *= 0.35
	var counter: float = 1.0 - 0.45 * max(0.0, -side * run_dir)
	var target: float = (0.26 + pull * 0.95 * counter) if holding else pull * 0.45 * counter
	tension = lerpf(tension, target / _tol, min(1.0, dt * (3.5 if holding else 2.2)))
	tension = clampf(tension + randf_range(-0.01, 0.01), 0.0, 1.2)
	# леска
	if holding:
		line -= _reel_speed * (1.0 - pull * 0.7) * dt
	if running:
		line += (1.6 * power + 0.6) * stamina * dt * (0.35 if holding else 1.0)
	line = clampf(line, 0.0, line0 + 30.0)
	# усталость
	var good := tension > 0.3 and tension < 0.82
	var drain: float = (0.03 if good else 0.01) * (1.45 - power * 0.7) * (1.0 + 0.7 * max(0.0, -side * run_dir))
	stamina = max(0.06, stamina - drain * dt)
	# обрыв и сход
	if tension > 0.94:
		_over += dt
	else:
		_over = max(0.0, _over - dt * 1.5)
	if tension < 0.07:
		_slack += dt
	else:
		_slack = max(0.0, _slack - dt * 1.5)
	if _over > 0.75:
		result = "snap"
	elif _slack > 3.2:
		result = "slack"
	elif line <= 1.6:
		result = "win"


func progress() -> float:
	return clampf(1.0 - line / line0, 0.0, 1.0)
