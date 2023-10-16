// = 011 ======================================================================
// three.js のサンプルでも利用した「テクスチャ」をネイティブな WebGL で実装する
// とどのような手順になるのか、実際に体験してみましょう。
// テクスチャを導入する場合、覚えなくてはならないことがかなり多く出てきます。そ
// ういう意味では、テクスチャを「完全に理解して使いこなす」のはちょっとだけ大変
// です。
// 最初は、一度に覚えるのは困難な場合が多いので、とにかくじっくり、少しずつ慣れ
// ていくのがよいと思います。最低限、まずはテクスチャユニットの概念を把握するこ
// とが理解への第一歩となるはずです。
// テクスチャを扱うために、webgl.js 側に新しく追加されたメソッドもありますので、
// 落ち着いて手順を確認していきましょう。
// ============================================================================

import { WebGLUtility } from './webgl.js';
import { WebGLMath } from './math.js';
import { WebGLGeometry } from './geometry.js';
import { WebGLOrbitCamera } from './camera.js';
import { Pane } from 'tweakpane';
import vertex from '../shader/main.vert';
import fragment from '../shader/main.frag';
import img1Url from '../img/img01.png';
import img2Url from '../img/img02.png';

window.addEventListener(
  'DOMContentLoaded',
  () => {
    const app = new App();
    app.init();
    app.load().then(() => {
      app.setupGeometry();
      app.setupLocation();
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
     * attribute 変数のロケーションを保持する配列
     * @type {Array.<number>}
     */
    this.attributeLocation = null;
    /**
     * attribute 変数のストライドの配列
     * @type {Array.<number>}
     */
    this.attributeStride = null;
    /**
     * uniform 変数のロケーションを保持するオブジェクト
     * @type {object.<WebGLUniformLocation>}
     */
    this.uniformLocation = null;
    /**
     * plane ジオメトリの情報を保持するオブジェクト
     * @type {object}
     */
    this.planeGeometry = null;
    /**
     * plane ジオメトリの VBO の配列
     * @type {Array.<WebGLBuffer>}
     */
    this.planeVBO = null;
    /**
     * plane ジオメトリの IBO
     * @type {WebGLBuffer}
     */
    this.planeIBO = null;
    /**
     * レンダリング開始時のタイムスタンプ
     * @type {number}
     */
    this.startTime = null;
    /**
     * アニメーション
     * @type {number}
     */
    this.progress = 0;
    this.animateRunning = false;
    this.animateReverse = false;
    /**
     * カメラ制御用インスタンス
     * @type {WebGLOrbitCamera}
     */
    this.camera = null;
    /**
     * テクスチャ格納用
     * @type {WebGLTexture}
     */
    this.textures = [];
    /**
     * レンダリングを行うかどうかのフラグ
     * @type {boolean}
     */
    this.isRender = false;
    /**
     * テクスチャの可視性 @@@
     * @type {boolean}
     */
    this.textureVisibility = true;

    // this を固定するためのバインド処理
    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    this.render = this.render.bind(this);
  }

  /**
   * バックフェイスカリングを設定する
   * @param {boolean} flag - 設定する値
   */
  setCulling(flag) {
    const gl = this.gl;
    if (gl == null) {
      return;
    }
    if (flag === true) {
      gl.enable(gl.CULL_FACE);
    } else {
      gl.disable(gl.CULL_FACE);
    }
  }

  /**
   * 深度テストを設定する
   * @param {boolean} flag - 設定する値
   */
  setDepthTest(flag) {
    const gl = this.gl;
    if (gl == null) {
      return;
    }
    if (flag === true) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }
  }

  /**
   * テクスチャの可視性を設定する @@@
   * @param {boolean} flag - 設定する値
   */
  setTextureVisibility(flag) {
    this.textureVisibility = flag;
  }

  /**
   * 初期化処理を行う
   */
  init() {
    // canvas エレメントの取得と WebGL コンテキストの初期化
    this.canvas = document.getElementById('webgl-canvas');
    this.gl = WebGLUtility.createWebGLContext(this.canvas);

    // カメラ制御用インスタンスを生成する
    const cameraOption = {
      distance: 5.0, // Z 軸上の初期位置までの距離
      min: 1.0, // カメラが寄れる最小距離
      max: 10.0, // カメラが離れられる最大距離
      move: 2.0, // 右ボタンで平行移動する際の速度係数
    };
    this.camera = new WebGLOrbitCamera(this.canvas, cameraOption);

    // 最初に一度リサイズ処理を行っておく
    this.resize();

    // リサイズイベントの設定
    window.addEventListener('resize', this.resize, false);

    // アニメーション
    this.canvas.addEventListener('click', this.animate, false);

    // 深度テストは初期状態で有効
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  /**
   * リサイズ処理
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  animate() {
    if (this.animateRunning) {
      return;
    }

    const duration = 600;
    const startTime = Date.now() - 0.016;
    this.animateRunning = true;

    const loop = () => {
      const now = Date.now();
      const progress = Math.min(1, (now - startTime) / duration);
      this.progress = this.animateReverse ? 1 - progress : progress;

      if (this.progress >= 1 || this.progress <= 0) {
        this.progress = this.progress >= 1 ? 1 : 0;
        this.animateRunning = false;
        this.animateReverse = !this.animateReverse;
      } else {
        requestAnimationFrame(loop);
      }
    };

    loop();
  }

  /**
   * 各種リソースのロードを行う
   * @return {Promise}
   */
  load() {
    return new Promise((resolve, reject) => {
      const gl = this.gl;
      if (gl == null) {
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

        const loadImages = [img1Url, img2Url].map((imgUrl, i) => {
          return WebGLUtility.loadImage(imgUrl).then(image => {
            // 読み込んだ画像からテクスチャを生成 @@@
            this.textures[i] = WebGLUtility.createTexture(gl, image);
          });
        });
        Promise.all(loadImages).then(() => {
          resolve();
        });
      }
    });
  }

  /**
   * 頂点属性（頂点ジオメトリ）のセットアップを行う
   */
  setupGeometry() {
    // プレーンジオメトリの情報を取得
    const size = 2.0;
    const color = [1.0, 1.0, 1.0, 1.0];
    this.planeGeometry = WebGLGeometry.plane(size, size, color);

    // VBO と IBO を生成する
    this.planeVBO = [
      WebGLUtility.createVBO(this.gl, this.planeGeometry.position),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.normal),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.color),
      WebGLUtility.createVBO(this.gl, this.planeGeometry.texCoord), // テクスチャ座標 @@@
    ];
    this.planeIBO = WebGLUtility.createIBO(this.gl, this.planeGeometry.index);
  }

  /**
   * 頂点属性のロケーションに関するセットアップを行う
   */
  setupLocation() {
    const gl = this.gl;
    // attribute location の取得
    this.attributeLocation = [
      gl.getAttribLocation(this.program, 'position'),
      gl.getAttribLocation(this.program, 'normal'),
      gl.getAttribLocation(this.program, 'color'),
      gl.getAttribLocation(this.program, 'texCoord'),
    ];
    // attribute のストライド
    this.attributeStride = [
      3,
      3,
      4,
      2, // ストライドは２ @@@
    ];
    // uniform location の取得
    this.uniformLocation = {
      mvpMatrix: gl.getUniformLocation(this.program, 'mvpMatrix'),
      normalMatrix: gl.getUniformLocation(this.program, 'normalMatrix'),
      time: gl.getUniformLocation(this.program, 'time'),
      progress: gl.getUniformLocation(this.program, 'progress'),
      textureUnit1: gl.getUniformLocation(this.program, 'textureUnit1'),
      textureUnit2: gl.getUniformLocation(this.program, 'textureUnit2'),
    };
  }

  /**
   * レンダリングのためのセットアップを行う
   */
  setupRendering() {
    const gl = this.gl;
    // ビューポートを設定する
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    // クリアする色と深度を設定する
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clearDepth(1.0);
    // 色と深度をクリアする
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
    const m4 = WebGLMath.Mat4;
    const v3 = WebGLMath.Vec3;

    // レンダリングのフラグの状態を見て、requestAnimationFrame を呼ぶか決める
    if (this.isRender === true) {
      requestAnimationFrame(this.render);
    }

    // 現在までの経過時間
    const nowTime = (Date.now() - this.startTime) * 0.001;

    // レンダリングのセットアップ
    this.setupRendering();

    // モデル座標変換行列（ここでは特になにもモデル座標変換は掛けていない）
    const m = m4.identity();

    // ビュー・プロジェクション座標変換行列
    const v = this.camera.update();
    const fovy = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 10.0;
    const p = m4.perspective(fovy, aspect, near, far);

    // 行列を乗算して MVP 行列を生成する（掛ける順序に注意）
    const vp = m4.multiply(p, v);
    const mvp = m4.multiply(vp, m);

    // モデル座標変換行列の、逆転置行列を生成する
    const normalMatrix = m4.transpose(m4.inverse(m));

    // 0番ユニットにバインドする
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
    if (this.textureVisibility === false) {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // 1番ユニットにバインドする
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[1]);
    if (this.textureVisibility === false) {
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    // プログラムオブジェクトを選択し uniform 変数を更新する
    gl.useProgram(this.program);
    gl.uniformMatrix4fv(this.uniformLocation.mvpMatrix, false, mvp);
    gl.uniformMatrix4fv(this.uniformLocation.normalMatrix, false, normalMatrix);
    gl.uniform1f(this.uniformLocation.time, nowTime);
    gl.uniform1f(this.uniformLocation.progress, this.progress);
    gl.uniform1i(this.uniformLocation.textureUnit1, 0);
    gl.uniform1i(this.uniformLocation.textureUnit2, 1);

    // VBO と IBO を設定し、描画する
    WebGLUtility.enableBuffer(
      gl,
      this.planeVBO,
      this.attributeLocation,
      this.attributeStride,
      this.planeIBO
    );
    gl.drawElements(
      gl.TRIANGLES,
      this.planeGeometry.index.length,
      gl.UNSIGNED_SHORT,
      0
    );
  }
}
