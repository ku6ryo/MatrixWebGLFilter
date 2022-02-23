precision mediump float;

// our texture
uniform sampler2D u_image;
uniform vec2 u_resolution;

// the texCoords passed in from the vertex shader.
varying vec2 v_texCoord;

void main() {
  float dx = 1.0 / u_resolution.x; 
  float dy = 1.0 / u_resolution.y;
  vec4 c0 = texture2D(u_image, v_texCoord + vec2(-dx, -dy));
  vec4 c8 = texture2D(u_image, v_texCoord + vec2(dx, dy));
  vec4 c2 = texture2D(u_image, v_texCoord + vec2(dx, -dy));
  vec4 c6 = texture2D(u_image, v_texCoord + vec2(-dx, dy));
  vec4 x = c8 - c0;
  vec4 y = c6 - c2;
  float r = sqrt(dot(x, y) + dot(y, y));
   float c = r * (1.0 - step(r, 0.05)) * 2.0;
  vec4 color = c * vec4(0.51, 1, 0.51, 1);
  gl_FragColor = vec4(color.rgb, 0.0);
}