// モジュールを読み込み
import { WebGLUtility } from './webgl.js';
import vertex from '../shader/main.vert';
import fragment from '../shader/main.frag';

let selectedMode = 'TRIANGLES';
const handleChangeMode = () => {
  const $select = document.querySelector('#mode');
  $select.addEventListener('change', e => {
    const { currentTarget } = e;
    selectedMode = currentTarget.value;
  });
};

// ドキュメントの読み込みが完了したら実行されるようイベントを設定する
window.addEventListener(
  'DOMContentLoaded',
  () => {
    handleChangeMode();
    // アプリケーションのインスタンスを初期化し、必要なリソースをロードする
    const app = new App();
    app.init();
    app.load().then(() => {
      // ジオメトリセットアップ
      app.setupGeometry();
      // ロケーションのセットアップ
      app.setupLocation();

      // セットアップが完了したら描画を開始する
      app.start();
    });
  },
  false
);

/**
 * アプリケーション管理クラス
 */
class App {
  /**
   * @constructro
   */
  constructor() {
    /**
     * WebGL で描画対象となる canvas
     * @type {HTMLCanvasElement}
     */
    this.canvas = null;
    /**
     * WebGL コンテキスト
     * @type {WebGLRenderingContext}
     */
    this.gl = null;
    /**
     * プログラムオブジェクト
     * @type {WebGLProgram}
     */
    this.program = null;
    /**
     * uniform 変数のロケーションを保持するオブジェクト
     * @type {object.<WebGLUniformLocation>}
     */
    this.uniformLocation = null;
    /**
     * 頂点の座標を格納する配列
     * @type {Array.<number>}
     */
    this.position = null;
    /**
     * 頂点の座標を構成する要素数（ストライド）
     * @type {number}
     */
    this.positionStride = null;
    /**
     * 座標の頂点バッファ
     * @type {WebGLBuffer}
     */
    this.positionVBO = null;
    /**
     * 頂点の色を格納する配列
     * @type {Array.<number>}
     */
    this.color = null;
    /**
     * 頂点の色を構成する要素数（ストライド）
     * @type {number}
     */
    this.colorStride = null;
    /**
     * 色の頂点バッファ
     * @type {WebGLBuffer}
     */
    this.colorVBO = null;
    /**
     * レンダリング開始時のタイムスタンプ
     * @type {number}
     */
    this.startTime = null;
    /**
     * レンダリングを行うかどうかのフラグ
     * @type {boolean}
     */
    this.isRender = false;

    // this を固定するためのバインド処理
    this.render = this.render.bind(this);
  }

  /**
   * 初期化処理を行う
   */
  init() {
    // canvas エレメントの取得と WebGL コンテキストの初期化
    this.canvas = document.getElementById('webgl-canvas');
    this.gl = WebGLUtility.createWebGLContext(this.canvas);

    // canvas のサイズを設定
    const size = Math.min(window.innerWidth, window.innerHeight);
    this.canvas.width = size;
    this.canvas.height = size;
  }

  /**
   * 各種リソースのロードを行う
   * @return {Promise}
   */
  load() {
    return new Promise((resolve, reject) => {
      // 変数に WebGL コンテキストを代入しておく（コード記述の最適化）
      const gl = this.gl;
      // WebGL コンテキストがあるかどうか確認する
      if (gl == null) {
        // もし WebGL コンテキストがない場合はエラーとして Promise を reject する
        const error = new Error('not initialized');
        reject(error);
      } else {
        const vs = WebGLUtility.createShaderObject(
          gl,
          vertex,
          gl.VERTEX_SHADER
        );
        const fs = WebGLUtility.createShaderObject(
          gl,
          fragment,
          gl.FRAGMENT_SHADER
        );
        this.program = WebGLUtility.createProgramObject(gl, vs, fs);
        resolve();
      }
    });
  }

  /**
   * 頂点属性（頂点ジオメトリ）のセットアップを行う
   */
  setupGeometry() {
    const start = 90;
    // 頂点座標の定義
    const degree = (Math.PI * 2) / 360;
    const n1 = start * degree;
    const n2 = (start + 72) * degree;
    const n3 = (start + 72 * 2) * degree;
    const n4 = (start + 72 * 3) * degree;
    const n5 = (start - 72) * degree;
    // prettier-ignore
    this.position = [
      Math.cos(n1), Math.sin(n1), 0.0,
      Math.cos(n2), Math.sin(n2), 0.0,
      Math.cos(n5), Math.sin(n5), 0.0, // 1つ目の三角形
      Math.cos(n2), Math.sin(n2), 0.0,
      Math.cos(n3), Math.sin(n3), 0.0,
      Math.cos(n5), Math.sin(n5), 0.0, // 2つ目の三角形
      Math.cos(n3), Math.sin(n3), 0.0,
      Math.cos(n4), Math.sin(n4), 0.0,
      Math.cos(n5), Math.sin(n5), 0.0, // 3つ目の三角形
    ];
    // 要素数は XYZ の３つ
    this.positionStride = 3;
    // VBO を生成
    this.positionVBO = WebGLUtility.createVBO(this.gl, this.position);

    const RED = [1.0, 0.0, 0.0, 1.0];
    const GREEN = [0.0, 1.0, 0.0, 1.0];
    const BLUE = [0.0, 0.0, 1.0, 1.0];
    const YELLOW = [1.0, 1.0, 0.0, 1.0];
    const PURPLE = [1.0, 0.0, 1.0, 1.0];
    // 頂点の色の定義
    // prettier-ignore
    this.color = [
      ...RED,
      ...GREEN,
      ...PURPLE,  // 1つ目の三角形
      ...GREEN,
      ...YELLOW,
      ...PURPLE,  // 2つ目の三角形
      ...YELLOW,
      ...BLUE,
      ...PURPLE  // 3つ目の三角形
    ];
    // 要素数は RGBA の４つ
    this.colorStride = 4;
    // VBO を生成
    this.colorVBO = WebGLUtility.createVBO(this.gl, this.color);
  }

  /**
   * 頂点属性のロケーションに関するセットアップを行う
   */
  setupLocation() {
    const gl = this.gl;
    // attribute location の取得
    const attPosition = gl.getAttribLocation(this.program, 'position');
    const attColor = gl.getAttribLocation(this.program, 'color');
    // attribute location の有効化
    WebGLUtility.enableAttribute(
      gl,
      this.positionVBO,
      attPosition,
      this.positionStride
    );
    WebGLUtility.enableAttribute(gl, this.colorVBO, attColor, this.colorStride);

    // uniform location の取得
    this.uniformLocation = {
      time: gl.getUniformLocation(this.program, 'time'),
    };
  }

  /**
   * レンダリングのためのセットアップを行う
   */
  setupRendering() {
    const gl = this.gl;
    // ビューポートを設定する
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // クリアする色を設定する（RGBA で 0.0 ～ 1.0 の範囲で指定する）
    gl.clearColor(0.7, 0.7, 0.7, 1.0);
    // 実際にクリアする（gl.COLOR_BUFFER_BIT で色をクリアしろ、という指定になる）
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  /**
   * 描画を開始する
   */
  start() {
    // レンダリング開始時のタイムスタンプを取得しておく
    this.startTime = Date.now();
    // レンダリングを行っているフラグを立てておく
    this.isRender = true;
    // レンダリングの開始
    this.render();
  }

  /**
   * 描画を停止する
   */
  stop() {
    this.isRender = false;
  }

  /**
   * レンダリングを行う
   */
  render() {
    const gl = this.gl;

    // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める
    if (this.isRender === true) {
      requestAnimationFrame(this.render);
    }
    // ビューポートの設定やクリア処理は毎フレーム呼び出す
    this.setupRendering();
    // 現在までの経過時間を計算し、秒単位に変換する
    const nowTime = (Date.now() - this.startTime) * 0.001;
    // プログラムオブジェクトを選択
    gl.useProgram(this.program);

    // ロケーションを指定して、uniform 変数の値を更新する（GPU に送る）
    gl.uniform1f(this.uniformLocation.time, nowTime);
    // ドローコール（描画命令）
    gl.drawArrays(
      gl[selectedMode],
      0,
      this.position.length / this.positionStride
    );
  }
}
