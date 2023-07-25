precision mediump float;
uniform mat4 mvpMatrix;
uniform mat4 normalMatrix;
uniform vec3 lightColor1;
uniform vec3 lightColor2;
uniform float time;
varying vec3 vNormal;
varying vec4 vColor;

void main() {
  // ライトを回転させる
  vec3 light1 = vec3(1.0, sin(time) * 1.0, 0.0);
  vec3 light2 = vec3(-1.0, sin(time) * -1.0, 0.0);

  // 法線をまず行列で変換する
  vec3 n = (normalMatrix * vec4(vNormal, 0.0)).xyz;

  // 変換した法線とライトベクトルで内積を取る
  float d1 = dot(normalize(n), normalize(light1));
  float d2 = dot(normalize(n), normalize(light2));

  // 内積の結果を頂点カラーの RGB 成分に乗算する
  float r = max(vColor.r * d1 * (lightColor1.r * 0.6 + 0.4), 0.0) + max(vColor.r * d2 * (lightColor2.r * 0.6 + 0.4), 0.0);
  float g = max(vColor.g * d1 * (lightColor1.g * 0.6 + 0.4), 0.0) + max(vColor.g * d2 * (lightColor2.g * 0.6 + 0.4), 0.0);
  float b = max(vColor.b * d1 * (lightColor1.b * 0.6 + 0.4), 0.0) + max(vColor.b * d2 * (lightColor2.b * 0.6 + 0.4), 0.0);
  vec4 color = vec4(r, g, b, vColor.a);

  gl_FragColor = color;
}

