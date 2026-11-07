class_name Sfx
extends Node
## Все звуки синтезируются при запуске: файлов нет, APK не раздувается.

const SR := 22050

class Biquad:
	var b0 := 0.0
	var b1 := 0.0
	var b2 := 0.0
	var a1 := 0.0
	var a2 := 0.0
	var x1 := 0.0
	var x2 := 0.0
	var y1 := 0.0
	var y2 := 0.0
	func coef(kind: String, f: float, q: float) -> Biquad:
		var w := TAU * f / 22050.0
		var al := sin(w) / (2.0 * q)
		var c := cos(w)
		var a0 := 1.0 + al
		match kind:
			"bp":
				b0 = al / a0; b1 = 0.0; b2 = -al / a0
			"lp":
				b0 = (1.0 - c) / 2.0 / a0; b1 = (1.0 - c) / a0; b2 = b0
			"hp":
				b0 = (1.0 + c) / 2.0 / a0; b1 = -(1.0 + c) / a0; b2 = b0
		a1 = -2.0 * c / a0; a2 = (1.0 - al) / a0
		return self
	func run(x: float) -> float:
		var y := b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
		x2 = x1; x1 = x; y2 = y1; y1 = y
		return y

var s := {}
var _pool: Array[AudioStreamPlayer] = []
var _pool3: Array[AudioStreamPlayer3D] = []
var _i := 0
var _j := 0
var lowpass: AudioEffectLowPassFilter
var ambient: AudioStreamPlayer

func _ready() -> void:
	s.blip = _tone_seq([520.0], 0.06, 40.0, 0.4)
	s.pop = _sweep(300, 900, 0.09, 0.5)
	s.drop = _thud(0.18)
	s.door = _creak()
	s.whoosh_on = _whoosh(true)
	s.whoosh_off = _whoosh(false)
	s.success = _tone_seq([660.0, 880.0, 1320.0], 0.12, 9.0, 0.6)
	s.fail = _tone_seq([330.0, 247.0], 0.22, 6.0, 0.6)
	s.gasp = _gasp()
	s.bell = _bell()
	s.horn = _horn()
	s.step = _thud(0.08, 160.0)
	s.ding = _tone_seq([1568.0, 2093.0], 0.09, 18.0, 0.4)
	for i in 8:
		var p := AudioStreamPlayer.new()
		add_child(p)
		_pool.append(p)
	for i in 10:
		var p3 := AudioStreamPlayer3D.new()
		p3.unit_size = 3.0
		p3.max_distance = 40.0
		add_child(p3)
		_pool3.append(p3)
	ambient = AudioStreamPlayer.new()
	add_child(ambient)
	# Невидимость приглушает мир: фильтр низких частот на общей шине
	lowpass = AudioEffectLowPassFilter.new()
	lowpass.cutoff_hz = 20000.0
	AudioServer.add_bus_effect(0, lowpass)

func play(name: String, vol_db := 0.0, pitch := 1.0) -> void:
	if not s.has(name): return
	var p := _pool[_i]
	_i = (_i + 1) % _pool.size()
	p.stream = s[name]
	p.volume_db = vol_db
	p.pitch_scale = pitch
	p.play()

func play_at(name: String, pos: Vector3, vol_db := 0.0, pitch := 1.0) -> void:
	if not s.has(name): return
	var p := _pool3[_j]
	_j = (_j + 1) % _pool3.size()
	p.stream = s[name]
	p.volume_db = vol_db
	p.pitch_scale = pitch
	p.global_position = pos
	p.play()

func set_ambient(kind: String) -> void:
	var key := "amb_" + kind
	if not s.has(key): s[key] = _ambient(kind)
	if ambient.stream == s[key] and ambient.playing: return
	ambient.stream = s[key]
	ambient.volume_db = -14.0 if kind == "city" else -20.0
	ambient.play()

func set_muffled(on: bool) -> void:
	var tw := create_tween()
	tw.tween_property(lowpass, "cutoff_hz", 1800.0 if on else 20000.0, 0.35)

# ───── Синтез
func _buf(d: float) -> PackedFloat32Array:
	var b := PackedFloat32Array()
	b.resize(int(d * SR))
	return b

func _wav(buf: PackedFloat32Array, peak := 0.8, loop := false) -> AudioStreamWAV:
	var m := 0.0
	for v in buf: m = maxf(m, absf(v))
	var k := peak / m if m > 0.0 else 1.0
	var data := PackedByteArray()
	data.resize(buf.size() * 2)
	for i in buf.size(): data.encode_s16(i * 2, int(clampf(buf[i] * k, -1.0, 1.0) * 32000.0))
	var w := AudioStreamWAV.new()
	w.format = AudioStreamWAV.FORMAT_16_BITS
	w.mix_rate = SR
	w.data = data
	if loop:
		w.loop_mode = AudioStreamWAV.LOOP_FORWARD
		w.loop_end = buf.size()
	return w

func _nz() -> float:
	return randf() * 2.0 - 1.0

func _tone_seq(freqs: Array, note: float, decay: float, peak: float) -> AudioStreamWAV:
	var b := _buf(note * freqs.size() + 0.25)
	for k in freqs.size():
		var f: float = freqs[k]
		var start := int(k * note * SR)
		for i in range(start, b.size()):
			var t := float(i - start) / SR
			b[i] += (sin(TAU * f * t) + 0.3 * sin(TAU * f * 2.0 * t)) * exp(-t * decay) * minf(1.0, t / 0.005)
	return _wav(b, peak)

func _sweep(f0: float, f1: float, d: float, peak: float) -> AudioStreamWAV:
	var b := _buf(d)
	var ph := 0.0
	for i in b.size():
		var x := float(i) / b.size()
		ph += lerpf(f0, f1, x) / SR
		b[i] = sin(TAU * ph) * (1.0 - x)
	return _wav(b, peak)

func _thud(d: float, f := 90.0) -> AudioStreamWAV:
	var b := _buf(d)
	var lp := Biquad.new().coef("lp", 900, 0.7)
	for i in b.size():
		var t := float(i) / SR
		b[i] = (sin(TAU * f * t) * 0.8 + lp.run(_nz()) * 0.6) * exp(-t * 30.0)
	return _wav(b, 0.6)

func _creak() -> AudioStreamWAV:
	var b := _buf(0.7)
	var bp := Biquad.new()
	var ph := 0.0
	for i in b.size():
		var x := float(i) / b.size()
		if i % 64 == 0: bp.coef("bp", 600.0 + 500.0 * sin(x * 7.0), 12.0)
		ph += (90.0 + 40.0 * sin(x * 13.0)) / SR
		var pulse := 1.0 if fposmod(ph, 1.0) < 0.08 else 0.0
		b[i] = bp.run(pulse * 4.0 + _nz() * 0.1) * sin(x * PI)
	return _wav(b, 0.5)

func _whoosh(on: bool) -> AudioStreamWAV:
	var b := _buf(0.6)
	var bp := Biquad.new()
	for i in b.size():
		var x := float(i) / b.size()
		var f := lerpf(300.0, 2500.0, x) if on else lerpf(2500.0, 300.0, x)
		if i % 32 == 0: bp.coef("bp", f, 3.0)
		b[i] = bp.run(_nz()) * sin(x * PI) + 0.25 * sin(TAU * f * 0.5 * x * 0.6) * sin(x * PI)
	return _wav(b, 0.6)

func _gasp() -> AudioStreamWAV:
	var b := _buf(0.45)
	var bp := Biquad.new().coef("bp", 1400, 2.0)
	for i in b.size():
		var t := float(i) / SR
		b[i] = bp.run(_nz()) * minf(1.0, t / 0.03) * exp(-t * 7.0)
	return _wav(b, 0.6)

func _bell() -> AudioStreamWAV:
	var b := _buf(2.2)
	for i in b.size():
		var t := float(i) / SR
		var ring := 1.0 if fposmod(t, 0.12) < 0.06 else 0.4
		b[i] = (sin(TAU * 1250.0 * t) + 0.5 * sin(TAU * 2500.0 * t)) * ring * minf(1.0, (2.2 - t) * 3.0)
	return _wav(b, 0.35)

func _horn() -> AudioStreamWAV:
	var b := _buf(0.55)
	for i in b.size():
		var t := float(i) / SR
		var v := 0.0
		for f in [392.0, 494.0]: v += (2.0 * fposmod(f * t, 1.0) - 1.0)
		b[i] = v * minf(1.0, t / 0.02) * minf(1.0, (0.55 - t) * 15.0)
	var lp := Biquad.new().coef("lp", 1800, 0.7)
	for i in b.size(): b[i] = lp.run(b[i])
	return _wav(b, 0.6)

func _ambient(kind: String) -> AudioStreamWAV:
	var d := 6.0
	var b := _buf(d)
	var lp := Biquad.new().coef("lp", 300 if kind == "city" else 180, 0.7)
	for i in b.size(): b[i] = lp.run(_nz()) * (1.6 if kind == "city" else 0.8)
	if kind == "city":
		# птицы: короткие трели
		for k in 7:
			var start := randi_range(0, b.size() - SR)
			var f := randf_range(2500, 4200)
			for i in range(start, mini(start + int(0.35 * SR), b.size())):
				var t := float(i - start) / SR
				b[i] += 0.25 * sin(TAU * (f + 600.0 * sin(TAU * 18.0 * t)) * t) * sin(t / 0.35 * PI)
	var fade := int(0.4 * SR)
	for i in fade:
		var k := float(i) / fade
		b[i] = b[i] * k + b[b.size() - fade + i] * (1.0 - k)
	b.resize(b.size() - fade)
	return _wav(b, 0.5, true)
