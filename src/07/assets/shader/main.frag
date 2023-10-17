precision mediump float;

uniform float progress;
uniform sampler2D textureUnit1; // テクスチャ1
uniform sampler2D textureUnit2; // テクスチャ2
uniform sampler2D textureNoise; // ノイズテクスチャ

varying vec4 vColor;
varying vec2 vTexCoord; // テクスチャ座標

vec2 mirrored(vec2 v) {
  vec2 m = mod(v, 2.0);
  return mix(m, 2.0 - m, step(1.0, m));
}

void main() {
  float p = progress;
  vec2 uv = vTexCoord;
  vec4 noise = texture2D(textureNoise, mirrored(vTexCoord + progress * 0.04));
  p = p + noise.g * 0.06;
  p = smoothstep(0.0, 1.0, (p * 2.0 + (1.0 - vTexCoord.x) - 1.0));
  float intpl = pow(abs(p), 5.0);
  vec2 uv1 = (uv - 0.5) * (1.0 - intpl) + 0.5; // zoom in effect.
  vec2 uv2 = (uv - 0.5) * intpl + 0.5; //zoom out effect.
  vec4 texColor = mix(texture2D(textureUnit1, uv1), texture2D(textureUnit2, uv2), p);
  gl_FragColor = texColor;
}

