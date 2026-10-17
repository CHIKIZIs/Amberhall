shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
// Спасательный круг: красно-белые сектора, потёртости.
uniform vec4 a_col : source_color = vec4(0.86, 0.2, 0.15, 1.0);
uniform vec4 b_col : source_color = vec4(0.96, 0.93, 0.87, 1.0);
uniform sampler2D noise_tex : repeat_enable, filter_linear_mipmap;
uniform int sectors = 4;
varying vec3 lp;
void vertex() { lp = VERTEX; }
void fragment() {
	float a = atan(lp.z, lp.x) / 6.28318 + 0.5;
	float s = step(0.5, fract(a * float(sectors) + 0.125));
	vec3 c = mix(a_col.rgb, b_col.rgb, s);
	float n = texture(noise_tex, lp.xz * 3.0 + lp.y).r;
	c *= 0.88 + 0.18 * n;
	ALBEDO = c;
	ROUGHNESS = 0.55;
}
