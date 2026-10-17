shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

// Тело рыбы: изгиб при плавании в вершинном шейдере, окраска спина/брюхо,
// узоры, чешуйчатый блеск.
uniform vec4 top_col : source_color = vec4(0.3, 0.45, 0.55, 1.0);
uniform vec4 belly_col : source_color = vec4(0.9, 0.92, 0.94, 1.0);
uniform vec4 pat_col : source_color = vec4(0.1, 0.15, 0.1, 1.0);
uniform int pattern = 0;
uniform float pat_freq = 6.0;
uniform float body_len = 1.0;
uniform float body_h = 0.2;
uniform float swim_amp = 0.07;
uniform float swim_speed = 7.0;
uniform float swim_phase = 0.0;
uniform float metal = 0.25;
uniform float glow = 0.0;
uniform sampler2D noise_tex : repeat_enable, filter_linear_mipmap;

varying vec3 lp;

void vertex() {
	lp = VERTEX;
	float t = clamp((body_len * 0.42 - VERTEX.x) / body_len, 0.0, 1.2);
	float ph = TIME * swim_speed + swim_phase - t * 4.0;
	VERTEX.z += sin(ph) * swim_amp * t * t * body_len;
	NORMAL.x -= cos(ph) * swim_amp * t * 2.0 * NORMAL.z;
	NORMAL = normalize(NORMAL);
}

void fragment() {
	float hy = lp.y / max(0.001, body_h * 0.5);
	float x = lp.x / body_len;
	float f = smoothstep(-0.45, 0.55, hy);
	vec3 c = mix(belly_col.rgb, top_col.rgb, f);
	// боковая линия
	c = mix(c, c * 0.75, smoothstep(0.06, 0.0, abs(hy - 0.05 + x * 0.1)) * 0.5);
	if (pattern == 1) {
		float s = smoothstep(0.25, 0.65, sin(x * pat_freq * 6.283));
		c = mix(c, pat_col.rgb, s * 0.7 * smoothstep(-0.55, 0.15, hy));
	} else if (pattern == 2) {
		float s = smoothstep(0.2, 0.7, sin(x * 46.0 + hy * 10.0 + sin(x * 17.0 + hy * 3.0) * 2.4));
		c = mix(c, pat_col.rgb, s * 0.8 * smoothstep(0.0, 0.35, hy));
	} else if (pattern == 3) {
		float n = texture(noise_tex, lp.xz * 2.4 + vec2(lp.y * 1.7, 0.0)).r;
		c = mix(c, pat_col.rgb, smoothstep(0.6, 0.67, n) * 0.85 * smoothstep(-0.6, 0.0, hy));
	} else if (pattern == 4) {
		float band = 1.0 - smoothstep(0.06, 0.24, abs(hy - 0.02));
		c = mix(c, pat_col.rgb, band * 0.75);
	}
	// чешуя
	vec2 sc = vec2(lp.x * 70.0 / body_len, lp.y * 70.0 / body_len + lp.z * 40.0);
	float scale = abs(sin(sc.x + sin(sc.y) * 0.8) * sin(sc.y));
	c *= 0.93 + 0.1 * scale;
	ALBEDO = c;
	METALLIC = metal;
	ROUGHNESS = 0.28 + 0.12 * (1.0 - scale);
	SPECULAR = 0.7;
	EMISSION = c * glow;
	RIM = 0.25;
	RIM_TINT = 0.4;
}
