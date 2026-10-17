shader_type spatial;
render_mode cull_disabled, diffuse_burley;
uniform vec4 col : source_color = vec4(0.18, 0.4, 0.22, 1.0);
uniform float phase = 0.0;
varying float vh;
void vertex() {
	vh = VERTEX.y;
	float h = max(0.0, VERTEX.y);
	VERTEX.x += sin(TIME * 1.3 + phase + h * 1.5) * 0.18 * h;
	VERTEX.z += cos(TIME * 1.1 + phase + h) * 0.1 * h;
}
void fragment() { ALBEDO = col.rgb * (0.6 + 0.3 * clamp(vh, 0.0, 1.5)); ROUGHNESS = 0.8; BACKLIGHT = col.rgb * 0.5; }
