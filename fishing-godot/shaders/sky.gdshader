shader_type sky;
// Закатное небо: градиент, солнце с ореолом, слоистые облака.
uniform vec4 zenith : source_color = vec4(0.12, 0.3, 0.48, 1.0);
uniform vec4 horizon : source_color = vec4(0.94, 0.68, 0.5, 1.0);
uniform vec4 ground : source_color = vec4(0.1, 0.27, 0.32, 1.0);
uniform vec4 cloud_col : source_color = vec4(1.0, 0.88, 0.8, 1.0);
uniform sampler2D clouds : repeat_enable, filter_linear_mipmap;

void sky() {
	vec3 d = EYEDIR;
	float y = d.y;
	vec3 col = mix(horizon.rgb, zenith.rgb, pow(clamp(y, 0.0, 1.0), 0.35));
	if (y < 0.0) {
		col = mix(horizon.rgb * 0.9, ground.rgb, clamp(-y * 5.0, 0.0, 1.0));
	}
	float sd = max(dot(d, LIGHT0_DIRECTION), 0.0);
	col += LIGHT0_COLOR * (pow(sd, 10.0) * 0.18 + pow(sd, 80.0) * 0.5);
	col += LIGHT0_COLOR * smoothstep(0.9993, 0.9997, sd) * 8.0;
	if (y > 0.0) {
		vec2 uv = d.xz / (y + 0.08) * 0.09;
		float c1 = texture(clouds, uv).r;
		float c2 = texture(clouds, uv * 2.7 + vec2(0.31, 0.17)).r;
		float cov = smoothstep(0.5, 0.78, c1 * 0.72 + c2 * 0.38);
		float lit = 0.7 + 0.6 * pow(sd, 3.0);
		vec3 cc = mix(cloud_col.rgb, horizon.rgb, 0.35) * lit;
		cc = mix(cc, zenith.rgb * 1.2, smoothstep(0.85, 0.5, c2) * 0.25);
		col = mix(col, cc, cov * smoothstep(0.0, 0.1, y) * 0.92);
	}
	COLOR = col;
}
