precision mediump float;

uniform float progress;
uniform vec2 point;
uniform sampler2D textureUnit1; // テクスチャ1
uniform sampler2D textureUnit2; // テクスチャ2

varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
  vec2 uv = vTexCoord;
  vec2 dir = uv - vec2(point);
  float dist = length(dir) / 1.4141357;
  vec4 color = vec4(0.0);
  if (dist > progress) {
    color = mix(texture2D(textureUnit1, uv), texture2D(textureUnit2, uv), step(1.0 ,progress));
  } else {
    vec2 offset = dir * sin(dist * 20.0 - progress * 20.0);
    color = mix(texture2D(textureUnit1, uv + offset), texture2D(textureUnit2, uv), progress);
  }
  gl_FragColor = vColor * color;
}

