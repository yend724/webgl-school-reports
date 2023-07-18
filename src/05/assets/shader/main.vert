precision mediump float;
uniform float time;
attribute vec3 position;
attribute vec4 color;
varying vec4 vColor;

vec3 rotate(vec3 p, float time){
    mat3 m = mat3(
      cos(time), -1.0 * sin(time), 0.0,
      sin(time), cos(time), 0.0,
      0.0, 0.0, 1.0
    );
    return m * p;
}

void main() {
  // フラグメントシェーダに送る色の情報を varying 変数に代入
  vColor = color;
  // 頂点座標の出力
  gl_Position = vec4(rotate(position, time), 1.0);
}

