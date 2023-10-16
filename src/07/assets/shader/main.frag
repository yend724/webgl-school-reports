precision mediump float;

uniform float progress;
uniform sampler2D textureUnit1; // テクスチャ1
uniform sampler2D textureUnit2; // テクスチャ2

varying vec4 vColor;
varying vec2 vTexCoord; // テクスチャ座標


void main() {
  vec2 uv = vTexCoord;
  vec2 split = vec2(10.0, 10.0);
  vec4 color1 = texture2D(textureUnit1, uv - fract(uv * split) * progress * 0.1 );
  vec4 color2 = texture2D(textureUnit2, uv - fract(uv * split) * ( 1.0 - progress ) * 0.1 );
  vec4 color = mix(color1, color2, progress);

  gl_FragColor = vColor * color;
}

