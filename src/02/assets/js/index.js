import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { ClearPass } from 'three/addons/postprocessing/ClearPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import {
  MaskPass,
  ClearMaskPass,
} from 'three/addons/postprocessing/MaskPass.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';
import imgUrl from '../img/webglschool.jpg';

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
window.addEventListener(
  'DOMContentLoaded',
  () => {
    const app = new App3();

    // 画像をロードしテクスチャを初期化する（Promise による非同期処理）
    app.load().then(() => {
      // ロードが終わってから初期化し、描画する
      app.init();
      app.render();
    });
  },
  false
);

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 50.0,
      x: 0.0,
      y: 2.0,
      z: 10.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0x111111,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0, // 光の強度
      x: 1.0, // 光の向きを表すベクトルの X 要素
      y: 1.0, // 光の向きを表すベクトルの Y 要素
      z: 1.0, // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1, // 光の強度
    };
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff,
      side: THREE.DoubleSide,
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer; // レンダラ
    this.planeScene; // 画像用シーン
    this.fanCenterScene; // 扇風機シーン
    this.maskScene; //マスクシーン
    this.camera; // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight; // アンビエントライト
    this.material; // マテリアル
    this.bladeMaterial; // 扇風機のマテリアル
    this.controls; // オービットコントロール
    this.planeGroup; // プレーンのグループ
    this.bladeGroup; // 扇風機の羽グループ
    this.centerGroup; // 扇風機の羽の軸グループ
    this.texture; // テクスチャ
    this.composer; // エフェクトコンポーザー

    this.isRunning = false;
    this.isSwinging = false;
    this.isSwingingReverse = false;

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    const triggers = document.querySelectorAll('[data-trigger]');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', e => {
        const { currentTarget } = e;
        const data = currentTarget.dataset.trigger;
        if (data === 'switch') {
          this.isRunning = !this.isRunning;
        }
        if (data === 'swing') {
          this.isSwinging = !this.isSwinging;
        }
      });
    });

    // リサイズイベント
    window.addEventListener(
      'resize',
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  /**
   * アセット（素材）のロードを行う Promise
   */
  load() {
    return new Promise(resolve => {
      // 読み込む画像のパス
      const imagePath = imgUrl;
      // テクスチャ用のローダーのインスタンスを生成
      const loader = new THREE.TextureLoader();
      // ローダーの load メソッドに読み込む画像のパスと、ロード完了時のコールバックを指定
      loader.load(imagePath, texture => {
        // コールバック関数の引数として、初期化済みのテクスチャオブジェクトが渡されてくる
        this.texture = texture;
        // Promise を解決
        resolve();
      });
    });
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.planeScene = new THREE.Scene();
    this.fanCenterScene = new THREE.Scene();
    this.maskScene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.planeScene.add(this.directionalLight);
    this.fanCenterScene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.planeScene.add(this.ambientLight);

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);
    // マテリアルにテクスチャを適用
    this.material.map = this.texture;
    this.bladeMaterial = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

    // グループ
    this.bladeGroup = new THREE.Group();
    this.centerGroup = new THREE.Group();
    this.planeGroup = new THREE.Group();
    this.planeScene.add(this.planeGroup);
    this.maskScene.add(this.bladeGroup);
    this.fanCenterScene.add(this.centerGroup);

    // 扇風機の羽
    const BLADE_COUNT = 4;
    const PI_2 = Math.PI * 2;
    for (let i = 0; i < BLADE_COUNT; ++i) {
      this.bladeGeometory = new THREE.RingGeometry(
        0.25,
        2,
        32,
        32,
        (PI_2 / BLADE_COUNT) * i,
        (PI_2 / 360) * 30
      );
      const blade = new THREE.Mesh(this.bladeGeometory, this.bladeMaterial);
      blade.position.z = 0.26;
      this.bladeGroup.add(blade);
    }

    // 扇風機の羽の軸
    const bladeCenterGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1, 32);
    const bladeCenter = new THREE.Mesh(
      bladeCenterGeometry,
      new THREE.MeshPhongMaterial({
        color: 0xffffff,
      })
    );
    bladeCenter.rotation.x = Math.PI / 2;
    this.centerGroup.add(bladeCenter);

    // 扇風機の支柱
    const fanCenterGeometry = new THREE.CylinderGeometry(0.25, 0.25, 3, 32);
    const fanCenter = new THREE.Mesh(fanCenterGeometry, this.bladeMaterial);
    fanCenter.position.y = -1.5;
    this.fanCenterScene.add(fanCenter);

    // 画像用の板
    const planeGeometory = new THREE.PlaneGeometry(4.2, 4.2);
    const plane = new THREE.Mesh(planeGeometory, this.material);
    plane.position.z = 0.25;
    this.planeGroup.add(plane);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // コンポーザーの設定
    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        stencilBuffer: true,
      }
    );

    this.composer = new EffectComposer(this.renderer, renderTarget);

    const clearPass = new ClearPass();
    this.composer.addPass(clearPass);
    const renderPass2 = new RenderPass(this.fanCenterScene, this.camera);
    this.composer.addPass(renderPass2);
    const maskPass = new MaskPass(this.maskScene, this.camera);
    this.composer.addPass(maskPass);
    const renderPass = new RenderPass(this.planeScene, this.camera);
    renderPass.clear = false;
    this.composer.addPass(renderPass);
    const clearMask = new ClearMaskPass();
    this.composer.addPass(clearMask);
    const outputPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(outputPass);
    outputPass.renderToScreen = true;
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループ
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // フラグに応じてオブジェクトの状態を変化させる
    if (this.isRunning) {
      this.bladeGroup.rotation.z += 0.3;
    }

    if (this.isRunning && this.isSwinging) {
      if (this.bladeGroup.rotation.y > Math.PI / 3) {
        this.isSwingingReverse = true;
      }
      if (this.bladeGroup.rotation.y < -Math.PI / 3) {
        this.isSwingingReverse = false;
      }

      let rotationAmount = 0.01;
      if (this.isSwingingReverse) {
        rotationAmount *= -1;
      }
      this.bladeGroup.rotation.y += rotationAmount;
      this.planeGroup.rotation.y += rotationAmount;
      this.centerGroup.rotation.y += rotationAmount;
    }

    // レンダラーではなく、コンポーザーに対して描画を指示する
    this.composer.render();
  }
}
