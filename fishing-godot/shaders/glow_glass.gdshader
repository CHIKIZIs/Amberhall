shader_type spatial;
render_mode unshaded;
// Светящееся стекло фонарей и окон с мерцанием пламени.
uniform vec4 col : source_color = vec4(1.0, 0.62, 0.25, 1.0);
uniform float power = 4.0;
uniform float seed = 0.0;
void fragment() {
	float fl = 0.88 + 0.08 * sin(TIME * 9.0 + seed) + 0.05 * sin(TIME * 23.0 + seed * 3.0);
	ALBEDO = col.rgb * power * fl;
}
