precision mediump float;

uniform float progress;
uniform sampler2D textureUnit1; // テクスチャ1
uniform sampler2D textureUnit2; // テクスチャ2

varying vec4 vColor;
varying vec2 vTexCoord; // テクスチャ座標


void main() {
  vec2 uv = vTexCoord;
  // float progress = (sin(time * 2.0) + 1.0) * 0.5;
  // テクスチャから、テクスチャ座標の位置の色を取り出す
  // ※フラグメントシェーダはピクセルの単位で動作していることを念頭に
  vec4 textureColo1 = texture2D(textureUnit1, uv - fract(uv * vec2(15.0, 0.0)) * progress * 0.1 );
  vec4 textureColo2 = texture2D(textureUnit2, uv - fract(uv * vec2(15.0, 0.0)) * ( 1.0 - progress ) * 0.1 );
  vec4 textureColor = mix(textureColo1, textureColo2, progress);

  gl_FragColor = vColor * textureColor;
}

