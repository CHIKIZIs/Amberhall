shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;

// Дерево и крашеные доски: волокна вдоль выбранной оси, сучки,
// потёртости, тёмная мокрая древесина у воды.
uniform vec4 albedo : source_color = vec4(0.85, 0.6, 0.38, 1.0);
uniform sampler2D grain_tex : repeat_enable, filter_linear_mipmap;
uniform int axis = 0;
uniform float grain_scale = 1.0;
uniform float grain_strength = 0.38;
uniform float paint = 0.0;
uniform float wet_level = -100.0;
uniform float rough = 0.82;
uniform bool use_color = false;

varying vec3 lp;
varying vec3 wp;
varying vec4 icol;

void vertex() {
	lp = VERTEX;
	wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	icol = use_color ? COLOR : vec4(1.0);
}

void fragment() {
	vec3 q = lp * grain_scale;
	vec2 g = axis == 0 ? vec2(q.x * 0.09, (q.y * 0.6 + q.z) * 2.6)
		: axis == 1 ? vec2(q.y * 0.09, (q.x + q.z * 0.6) * 2.6)
		: vec2(q.z * 0.09, (q.x + q.y * 0.6) * 2.6);
	float n = texture(grain_tex, g).r;
	float n2 = texture(grain_tex, g * vec2(0.35, 0.22) + vec2(0.37, 0.11)).r;
	float rings = smoothstep(0.25, 0.75, abs(fract(n * 7.0 + n2 * 2.0) - 0.5) * 2.0);
	float knot = smoothstep(0.78, 0.86, texture(grain_tex, g * vec2(1.6, 0.18) + 0.5).r);
	vec3 c = albedo.rgb * icol.rgb;
	float k = mix(grain_strength, grain_strength * 0.22, paint);
	c *= 1.0 - k * (0.6 * rings + 0.4 * n2) + k * 0.3;
	c *= 1.0 - knot * 0.35 * (1.0 - paint);
	// потёртая краска
	if (paint > 0.5) {
		float wear = smoothstep(0.66, 0.74, texture(grain_tex, g * vec2(3.0, 0.6) + 0.21).r);
		c = mix(c, vec3(0.55, 0.42, 0.3), wear * 0.5);
	}
	float wet = smoothstep(wet_level + 0.3, wet_level - 0.2, wp.y);
	c = mix(c, c * vec3(0.3, 0.36, 0.3), wet);
	ALBEDO = c;
	ROUGHNESS = mix(rough, 0.3, wet);
	SPECULAR = 0.35;
}
