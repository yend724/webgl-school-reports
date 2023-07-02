import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import earthImgUrl from '../img/earth.jpg';

// DOM がパースされたことを検出するイベントで App3 クラスを初期化
window.addEventListener(
  'DOMContentLoaded',
  () => {
    const app = new App3();
    app.load().then(() => {
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
      far: 30.0,
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
      clearColor: 0x000000,
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
      intensity: 0.2, // 光の強度
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
      color: 0xaaaaaa, // 光の色
      intensity: 0.01, // 光の強度
    };
  }
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff, // マテリアルの基本色
    };
  }
  static get AIRPLANE_MATERIAL_PAEAMS() {
    return {
      color: 0xffff00, // 飛行機の色
    };
  }
  /**
   * フォグの定義のための定数
   */
  static get FOG_PARAM() {
    return {
      fogColor: 0x000000, // フォグの色
      fogNear: 10.0, // フォグの掛かり始めるカメラからの距離
      fogFar: 20.0, // フォグが完全に掛かるカメラからの距離
    };
  }

  static get AIRPLANE_NUMS() {
    return 33;
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.renderer; // レンダラ
    this.scene; // シーン
    this.camera; // カメラ
    this.directionalLight; // ディレクショナルライト
    this.ambientLight; // アンビエントライト
    this.pointLight; // ポイントライト
    this.controls; // オービットコントロール
    this.axesHelper; // 軸ヘルパー
    this.earth; // 地球
    this.earthTexture; // 地球テクスチャ
    this.airplaneArray; // 飛行機の配列
    this.airplaneDirectionArray; // 飛行機の向きの配列
    this.airplaneTarget; // 飛行機の向き先

    // this.isDown = false; // キーの押下状態を保持するフラグ

    // Clock オブジェクトの生成
    this.clock = new THREE.Clock();

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

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
      const loader = new THREE.TextureLoader();
      loader.load(earthImgUrl, earthTexture => {
        this.earthTexture = earthTexture;
        resolve();
      });
    });
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);

    // シーンとフォグ
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      App3.FOG_PARAM.fogColor,
      App3.FOG_PARAM.fogNear,
      App3.FOG_PARAM.fogFar
    );

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
    this.scene.add(this.directionalLight);

    // 点光源
    this.pointLight = new THREE.PointLight(
      App3.AIRPLANE_MATERIAL_PAEAMS.color,
      2,
      50,
      1.0
    );
    this.pointLight.position.set(0.0, 0, 5.0);
    this.scene.add(this.pointLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    const unit = (Math.PI * 2) / 360;
    this.group = new THREE.Group();
    // 自転軸は公転軸より約23.4度傾いているらしい
    // https://ja.wikipedia.org/wiki/%E5%9C%B0%E8%BB%B8
    this.group.rotation.z = -unit * 23.4;
    this.scene.add(this.group);

    // 地球のメッシュ
    const earthGeometry = new THREE.SphereGeometry(3, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);
    earthMaterial.map = this.earthTexture;
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.group.add(this.earth);

    // 飛行機の追いかけ先
    const airplaneTargetGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const airplaneTargetMaterial = new THREE.MeshNormalMaterial();
    this.airplaneTarget = new THREE.Mesh(
      airplaneTargetGeometry,
      airplaneTargetMaterial
    );
    this.scene.add(this.airplaneTarget);
    this.airplaneTarget.visible = false;

    this.airplaneArray = [];
    this.airplaneDirectionArray = [];
    const direction = new THREE.Vector3(0.0, 1.0, 0.0).normalize();
    for (let i = 0; i < App3.AIRPLANE_NUMS; i++) {
      // 飛行機のメッシュ
      const airplane = this.createAirplane();
      this.airplaneArray.push(airplane);
      this.scene.add(airplane);
      // 飛行機の向き
      this.airplaneDirectionArray.push(direction);
    }

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    // const axesBarLength = 5.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  createAirplane = () => {
    const airplaneGeometry = new THREE.ConeGeometry(0.1, 0.25, 32);
    const airplaneMaterial = new THREE.MeshBasicMaterial(
      App3.AIRPLANE_MATERIAL_PAEAMS
    );
    return new THREE.Mesh(airplaneGeometry, airplaneMaterial);
  };

  getVec3Position = time => {
    const x = Math.cos(time);
    const y = Math.sin(time);
    const z = Math.sin(time * 2);
    return new THREE.Vector3(x, y, z).normalize();
  };
  setVec3Position(_mesh, vec3) {
    const mesh = _mesh;
    mesh.position.x = vec3.x;
    mesh.position.y = vec3.y;
    mesh.position.z = vec3.z;
    return mesh;
  }

  calcNextDirection = (toPos, fromPos) => {
    const subVector = new THREE.Vector3().subVectors(toPos, fromPos);
    return subVector.normalize();
  };

  calcQuaternion = (fromDirection, toDirection) => {
    const normalAxis = new THREE.Vector3().crossVectors(
      fromDirection,
      toDirection
    );
    normalAxis.normalize();
    // 内積
    const cos = fromDirection.dot(toDirection);
    const radians = Math.acos(cos);
    // クォータニオン
    return new THREE.Quaternion().setFromAxisAngle(normalAxis, radians);
  };

  /**
   * 描画処理
   */
  render() {
    requestAnimationFrame(this.render);

    this.controls.update();
    this.renderer.render(this.scene, this.camera);

    const r = 3.01;
    const elapsedTime = this.clock.getElapsedTime();
    const deltaTime = 0.1;

    // pointLightのポジション
    const pointVec3Position =
      this.getVec3Position(elapsedTime).multiplyScalar(r);
    this.setVec3Position(this.pointLight, pointVec3Position);

    // airplaneTargetのポジション
    const airplaneTargetVec3Position = this.getVec3Position(
      elapsedTime
    ).multiplyScalar(r + 0.5);
    this.setVec3Position(this.airplaneTarget, airplaneTargetVec3Position);

    const airplaneNums = this.airplaneArray.length;
    console.log(elapsedTime);
    for (let i = 0; i < airplaneNums; i++) {
      const time = elapsedTime - deltaTime * (i + 1);
      const airplaneVec3Position = this.getVec3Position(time).multiplyScalar(
        r + 0.5
      );
      this.setVec3Position(this.airplaneArray[i], airplaneVec3Position);

      const previousDirection = this.airplaneDirectionArray[i].clone();
      const prevPosition =
        i - 1 > 0
          ? this.airplaneArray[i - 1].position
          : airplaneTargetVec3Position;

      this.airplaneDirectionArray[i] = this.calcNextDirection(
        prevPosition,
        this.airplaneArray[i].position
      );

      const qtn = this.calcQuaternion(
        previousDirection,
        this.airplaneDirectionArray[i]
      );

      this.airplaneArray[i].quaternion.premultiply(qtn);
    }

    // 地球の時点
    this.earth.rotation.y = -elapsedTime / 10;

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
