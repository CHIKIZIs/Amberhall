shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx, cull_disabled, depth_draw_opaque;

// Плавники: тот же изгиб, что и у тела, полупрозрачные лучи.
uniform vec4 fin_col : source_color = vec4(0.8, 0.4, 0.3, 1.0);
uniform float body_len = 1.0;
uniform float swim_amp = 0.07;
uniform float swim_speed = 7.0;
uniform float swim_phase = 0.0;
uniform float flutter = 0.0;
uniform float glow = 0.0;

varying vec3 lp;

void vertex() {
	lp = VERTEX;
	vec3 w = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float t = clamp((body_len * 0.42 - VERTEX.x) / body_len, 0.0, 1.6);
	float ph = TIME * swim_speed + swim_phase - t * 4.0;
	VERTEX.z += sin(ph) * swim_amp * t * t * body_len;
	VERTEX.z += sin(TIME * 12.0 + VERTEX.y * 30.0) * flutter;
}

void fragment() {
	float rays = 0.5 + 0.5 * sin(atan(lp.y, lp.x + body_len * 0.6) * 90.0);
	vec3 c = fin_col.rgb * (0.8 + 0.3 * rays);
	ALBEDO = c;
	ALPHA = 0.78 + 0.18 * rays;
	ROUGHNESS = 0.4;
	EMISSION = c * glow;
	BACKLIGHT = c * 0.6;
}
