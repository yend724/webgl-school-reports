precision mediump float;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
uniform vec3 ligthColor;
uniform float time;
varying vec3 vNormal;
varying vec4 vColor;

void main() {
  // ライトを回転させる
  vec3 light = vec3(sin(time), 0.5, cos(time));

  // 法線をまず行列で変換する
  vec3 n = (normalMatrix * vec4(vNormal, 0.0)).xyz;

  // 変換した法線とライトベクトルで内積を取る
  float d = dot(normalize(n), normalize(light));

  // 内積の結果を頂点カラーの RGB 成分に乗算する
  float r = vColor.r * d * (ligthColor.r * 0.6 + 0.4);
  float g = vColor.g * d * (ligthColor.g * 0.6 + 0.4);
  float b = vColor.b * d * (ligthColor.b * 0.6 + 0.4);
  float a = vColor.a;
  vec4 color = vec4(r, g, b, a);

  gl_FragColor = color;
}

