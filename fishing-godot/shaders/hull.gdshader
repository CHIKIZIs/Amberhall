shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx, cull_disabled;

// Корпус лодки: UV.y = 0 у планширя, 1 у киля.
uniform vec4 top_band : source_color = vec4(0.94, 0.88, 0.74, 1.0);
uniform vec4 hull_col : source_color = vec4(0.18, 0.47, 0.75, 1.0);
uniform vec4 line_col : source_color = vec4(0.12, 0.16, 0.22, 1.0);
uniform vec4 bottom_col : source_color = vec4(0.10, 0.17, 0.27, 1.0);
uniform vec4 inner_col : source_color = vec4(0.82, 0.74, 0.6, 1.0);
uniform sampler2D grain_tex : repeat_enable, filter_linear_mipmap;
uniform float band = 0.14;
uniform float waterline = 0.62;

void fragment() {
	float v = UV.y;
	vec3 c = hull_col.rgb;
	c = mix(c, top_band.rgb, 1.0 - smoothstep(band - 0.01, band + 0.01, v));
	float ln = smoothstep(band + 0.005, band + 0.02, v) * (1.0 - smoothstep(band + 0.04, band + 0.055, v));
	c = mix(c, line_col.rgb, ln);
	c = mix(c, bottom_col.rgb, smoothstep(waterline - 0.01, waterline + 0.01, v));
	float n = texture(grain_tex, UV * vec2(3.0, 9.0)).r;
	c *= 0.9 + 0.2 * n;
	// подтёки ржавчины и грязи у ватерлинии
	float streak = smoothstep(0.7, 0.9, texture(grain_tex, vec2(UV.x * 18.0, v * 0.6)).r) * smoothstep(0.2, 0.6, v);
	c = mix(c, c * vec3(0.7, 0.62, 0.55), streak * 0.5);
	if (!FRONT_FACING) {
		c = inner_col.rgb * (0.85 + 0.2 * n);
	}
	ALBEDO = c;
	ROUGHNESS = 0.45 + n * 0.2;
	SPECULAR = 0.5;
}
