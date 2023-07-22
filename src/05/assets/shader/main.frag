precision mediump float;
uniform float time;
varying vec4 vColor;

void main() {
  // 時間の経過からサイン波を作り、絶対値で点滅させるようにする
  vec3 rgb = vColor.rgb * ((sin(time) + 1.0) * 0.5);
  // フラグメントの色
  gl_FragColor = vec4(rgb, vColor.a);
}

