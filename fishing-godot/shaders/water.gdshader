shader_type spatial;
render_mode blend_mix, depth_draw_always, cull_back, diffuse_burley, specular_schlick_ggx;

// Реалистичная вода: волны Герстнера + круги от событий (поплавок, лодка,
// рыба), преломление, поглощение по глубине, пена у препятствий и на гребнях.
uniform vec4 shallow : source_color = vec4(0.36, 0.78, 0.72, 1.0);
uniform vec4 deep : source_color = vec4(0.09, 0.38, 0.42, 1.0);
uniform vec4 foam_col : source_color = vec4(0.93, 0.98, 0.96, 1.0);
uniform sampler2D nmap_a : hint_normal, repeat_enable, filter_linear_mipmap;
uniform sampler2D nmap_b : hint_normal, repeat_enable, filter_linear_mipmap;
uniform sampler2D foam_noise : repeat_enable, filter_linear_mipmap;
uniform sampler2D screen_t : hint_screen_texture, filter_linear_mipmap;
#if CURRENT_RENDERER != RENDERER_COMPATIBILITY
uniform sampler2D depth_t : hint_depth_texture, filter_nearest;
#endif
uniform float absorb = 0.4;
uniform float refraction = 0.03;
uniform vec4 wave_a = vec4(1.0, 0.35, 0.10, 11.0);
uniform vec4 wave_b = vec4(0.25, 1.0, 0.09, 7.0);
uniform vec4 wave_c = vec4(-0.7, 0.75, 0.06, 4.1);
uniform vec4 wave_d = vec4(0.85, -0.45, 0.045, 2.6);
uniform float wave_time = 0.0;
uniform float ripple_speed = 3.0;
uniform vec4 ripples[24];

varying vec3 wpos;
varying float crest;
varying float rip_foam;

vec3 gerstner(vec4 w, vec2 p, inout vec3 tg, inout vec3 bn) {
	float k = 6.28318 / w.w;
	float c = sqrt(9.8 / k);
	vec2 d = normalize(w.xy);
	float f = k * (dot(d, p) - c * wave_time);
	float s = w.z;
	float a = s / k;
	tg += vec3(-d.x * d.x * s * sin(f), d.x * s * cos(f), -d.x * d.y * s * sin(f));
	bn += vec3(-d.x * d.y * s * sin(f), d.y * s * cos(f), -d.y * d.y * s * sin(f));
	return vec3(d.x * a * cos(f), a * sin(f), d.y * a * cos(f));
}

void vertex() {
	vec3 world = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	vec2 p = world.xz;
	vec3 tg = vec3(1.0, 0.0, 0.0);
	vec3 bn = vec3(0.0, 0.0, 1.0);
	vec3 disp = gerstner(wave_a, p, tg, bn) + gerstner(wave_b, p, tg, bn)
		+ gerstner(wave_c, p, tg, bn) + gerstner(wave_d, p, tg, bn);
	float rh = 0.0;
	vec2 rg = vec2(0.0);
	float rf = 0.0;
	for (int i = 0; i < 24; i++) {
		vec4 r = ripples[i];
		if (r.w <= 0.0) continue;
		float age = wave_time - r.z;
		if (age < 0.0 || age > 6.0) continue;
		vec2 dv = p - r.xy;
		float d = length(dv) + 0.0001;
		float front = age * ripple_speed;
		float env = r.w * exp(-age * 0.85) * exp(-max(0.0, front - d) * 0.45)
			* (1.0 - smoothstep(front - 0.3, front + 0.7, d)) / (1.0 + d * 0.3);
		float ph = (d - front) * 4.2;
		rh += env * sin(ph);
		rg += env * 4.2 * cos(ph) * dv / d;
		rf += env * max(0.0, sin(ph));
	}
	disp.y += rh;
	VERTEX += disp;
	wpos = world + disp;
	crest = disp.y;
	rip_foam = rf;
	vec3 n = normalize(cross(bn, tg));
	n = normalize(n + vec3(-rg.x, 0.0, -rg.y));
	NORMAL = (VIEW_MATRIX * vec4(n, 0.0)).xyz;
}

// В Compatibility (OpenGL) нет текстуры глубины — считаем воду глубокой.
float lin_depth(vec2 uv, mat4 inv_proj, float surf) {
#if CURRENT_RENDERER == RENDERER_COMPATIBILITY
	return surf + 2.6;
#else
	float d = texture(depth_t, uv).r;
	vec3 ndc = vec3(uv * 2.0 - 1.0, d);
	vec4 v = inv_proj * vec4(ndc, 1.0);
	return -v.z / v.w;
#endif
}

void fragment() {
	vec2 uv1 = wpos.xz * 0.075 + vec2(wave_time * 0.021, wave_time * 0.012);
	vec2 uv2 = wpos.xz * 0.12 - vec2(wave_time * 0.016, -wave_time * 0.023);
	vec3 n1 = texture(nmap_a, uv1).rgb;
	vec3 n2 = texture(nmap_b, uv2).rgb;
	vec3 nm = normalize(n1 + n2 - 1.0);
	NORMAL_MAP = nm * 0.5 + 0.5;
	NORMAL_MAP_DEPTH = 0.18;

	float surf = -VERTEX.z;
	float thick = max(0.0, lin_depth(SCREEN_UV, INV_PROJECTION_MATRIX, surf) - surf);
	vec2 off = (nm.xy) * refraction * clamp(thick, 0.0, 1.0);
	vec2 ruv = SCREEN_UV + off;
	float thick2 = lin_depth(ruv, INV_PROJECTION_MATRIX, surf) - surf;
	if (thick2 < 0.0) { ruv = SCREEN_UV; thick2 = thick; }
	vec3 below = texture(screen_t, ruv).rgb;

	float tr = exp(-thick2 * absorb);
	vec3 body = mix(deep.rgb, shallow.rgb, exp(-thick2 * 0.2));

	float fn = texture(foam_noise, wpos.xz * 0.32 + vec2(wave_time * 0.025)).r;
	float fn2 = texture(foam_noise, wpos.xz * 0.9 - vec2(wave_time * 0.04)).r;
	float edge = 1.0 - smoothstep(0.0, 0.6, thick);
	float foam = smoothstep(0.5, 0.78, edge * (0.55 + fn));
	foam += smoothstep(0.4, 0.5, crest + fn * 0.05) * 0.12;
	foam += smoothstep(0.08, 0.2, rip_foam * (0.6 + fn2)) * 0.8;
	foam = clamp(foam, 0.0, 1.0);

	float see = tr * 0.92 * (1.0 - foam);
	ALBEDO = mix(body * (1.0 - see), foam_col.rgb, foam);
	EMISSION = below * mix(vec3(1.0), shallow.rgb * 1.35, 0.55) * see;
	ROUGHNESS = mix(0.32, 0.85, foam);
	SPECULAR = 0.12;
	METALLIC = 0.0;
	ALPHA = 1.0;
}
