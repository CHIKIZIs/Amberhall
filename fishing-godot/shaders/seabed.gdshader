shader_type spatial;
render_mode diffuse_burley;
uniform vec4 sand : source_color = vec4(0.42, 0.45, 0.36, 1.0);
uniform vec4 moss : source_color = vec4(0.12, 0.25, 0.2, 1.0);
uniform sampler2D noise_tex : repeat_enable, filter_linear_mipmap;
uniform float wave_time = 0.0;
varying vec3 wp;
void vertex() { wp = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz; }
void fragment() {
	float n = texture(noise_tex, wp.xz * 0.05).r;
	float n2 = texture(noise_tex, wp.xz * 0.4).r;
	vec3 c = mix(sand.rgb, moss.rgb, smoothstep(0.4, 0.65, n));
	c *= 0.85 + 0.3 * n2;
	// каустики
	vec2 p = wp.xz * 0.9;
	float ca = texture(noise_tex, p * 0.35 + vec2(wave_time * 0.05, wave_time * 0.03)).r;
	float cb = texture(noise_tex, p * 0.31 - vec2(wave_time * 0.04, -wave_time * 0.035)).r;
	float caus = pow(1.0 - abs(ca - cb), 10.0);
	c += vec3(0.9, 1.0, 0.85) * caus * 0.5;
	ALBEDO = c;
	ROUGHNESS = 0.95;
}
