import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import objFoxPath from '../obj/Fox.glb?url';

// DOM がパースされたことを検出するイベントで App3 クラスをインスタンス化する
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
      far: 100.0,
      x: 0.0,
      y: 20.0,
      z: 20.0,
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
      color: 0xffffff,
      intensity: 1.0,
      x: 0.0,
      y: 12.0,
      z: 10.0,
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.1,
    };
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xcccccc,
    };
  }
  /**
   * レイが交差した際のマテリアル定義のための定数
   */
  static get INTERSECTION_MATERIAL_PARAM() {
    return {
      color: 0x00ffff,
    };
  }
  /**
   * 選択されたマテリアル定義のための定数
   */
  static get SELECTED_MATERIAL_PARAM() {
    return {
      color: 0xff00ff,
    };
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
    this.material; // マテリアル
    this.hitMaterial; // レイが交差した場合用のマテリアル
    this.selectedMaterial; // 選択されたマテリアル
    this.plane; // 板
    this.planeArray; // 板の配列
    this.controls; // オービットコントロール
    this.axesHelper; // 軸ヘルパー
    this.gltf; // ロードした glTF 由来のオブジェクト
    this.mixer; // アニメーションミキサー
    this.actions; // アニメーションのアクション
    this.selectedMesh = { uuid: null };

    // Raycaster のインスタンスを生成する
    this.raycaster = new THREE.Raycaster();
    // マウスのポインタイベントの定義
    window.addEventListener(
      'click',
      mouseEvent => {
        // スクリーン空間の座標系をレイキャスター用に正規化する（-1.0 ~ 1.0 の範囲）
        const x = (mouseEvent.clientX / window.innerWidth) * 2.0 - 1.0;
        const y = (mouseEvent.clientY / window.innerHeight) * 2.0 - 1.0;
        // スクリーン空間は上下が反転している点に注意（Y だけ符号を反転させる）
        const v = new THREE.Vector2(x, -y);
        // scene に含まれるすべてのオブジェクトを対象にレイキャストする
        const intersects = this.raycaster.intersectObjects(this.planeArray);
        // レイが交差しなかった場合を考慮し一度マテリアルをリセットしておく
        this.planeArray.forEach(mesh => {
          mesh.material = this.material;
        });
        if (intersects.length > 0) {
          this.selectedMesh = intersects[0].object;
          intersects[0].object.material = this.selectedMaterial;
        }
      },
      false
    );
    window.addEventListener(
      'pointermove',
      mouseEvent => {
        // スクリーン空間の座標系をレイキャスター用に正規化する（-1.0 ~ 1.0 の範囲）
        const x = (mouseEvent.clientX / window.innerWidth) * 2.0 - 1.0;
        const y = (mouseEvent.clientY / window.innerHeight) * 2.0 - 1.0;
        // スクリーン空間は上下が反転している点に注意（Y だけ符号を反転させる）
        const v = new THREE.Vector2(x, -y);
        // レイキャスターに正規化済みマウス座標とカメラを指定する
        this.raycaster.setFromCamera(v, this.camera);
        // scene に含まれるすべてのオブジェクトを対象にレイキャストする
        const intersects = this.raycaster.intersectObjects(this.planeArray);
        document.body.style = 'cursor:auto';
        this.planeArray.forEach(mesh => {
          if (this.selectedMesh.uuid !== mesh.uuid) {
            mesh.material = this.material;
          }
        });
        if (intersects.length > 0) {
          document.body.style = 'cursor:pointer';
          if (this.selectedMesh.uuid !== intersects[0].object.uuid) {
            intersects[0].object.material = this.hitMaterial;
          }
        }
      },
      false
    );

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);

    // リサイズイベント
    window.addEventListener(
      'resize',
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.Device;
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
      // 読み込むファイルのパス
      const gltfPath = objFoxPath;
      const loader = new GLTFLoader();
      loader.load(gltfPath, gltf => {
        this.gltf = gltf;
        // ミキサーを生成する（scene プロパティを渡す点に注意）
        this.mixer = new THREE.AnimationMixer(this.gltf.scene);
        // アニメーション情報を取り出す
        const animations = this.gltf.animations;
        // 取り出したアニメーション情報を順番にミキサーに通してアクション化する
        this.actions = [];
        for (let i = 0; i < animations.length; ++i) {
          // アクションを生成
          this.actions.push(this.mixer.clipAction(animations[i]));
          // ループ方式を設定する
          this.actions[i].setLoop(THREE.LoopRepeat);
          // 再生状態にしつつ、ウェイトをいったん 0.0 にする
          this.actions[i].play();
          this.actions[i].weight = 0.0;
        }

        // 最初のアクションのウェイトだけ 1.0 にして目に見えるようにしておく
        this.actions[0].weight = 1.0;

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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );
    this.renderer.shadowMap.enabled = true;
    const wrapper = document.querySelector('#webgl');
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

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
    const DIRECTIONAL_LIGHT_SIZE = 15;
    this.directionalLight.shadow.camera.right = DIRECTIONAL_LIGHT_SIZE;
    this.directionalLight.shadow.camera.left = DIRECTIONAL_LIGHT_SIZE * -1;
    this.directionalLight.shadow.camera.top = DIRECTIONAL_LIGHT_SIZE * -1;
    this.directionalLight.shadow.camera.bottom = DIRECTIONAL_LIGHT_SIZE;
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);

    // ライトの設定を可視化するためにヘルパーを使う
    // const cameraHelper = new THREE.CameraHelper(
    //   this.directionalLight.shadow.camera
    // );
    // this.scene.add(cameraHelper);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);
    this.hitMaterial = new THREE.MeshPhongMaterial(
      App3.INTERSECTION_MATERIAL_PARAM
    );
    this.selectedMaterial = new THREE.MeshPhongMaterial(
      App3.SELECTED_MATERIAL_PARAM
    );

    // Planeメッシュ
    this.planeArray = [];
    const PLANE_SIZE = 1;
    const planeGeometry = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
    const PLANE_Z_COUNT = 30;
    const PLANE_X_COUNT = 30;
    const PLANE_COUNT = PLANE_Z_COUNT * PLANE_X_COUNT;
    for (let i = 0; i < PLANE_COUNT; i++) {
      const x = i % PLANE_X_COUNT;
      const z = Math.floor(i / PLANE_X_COUNT);
      const plane = new THREE.Mesh(planeGeometry, this.material);
      plane.position.x =
        (x + 0.5) * PLANE_SIZE - (PLANE_X_COUNT * PLANE_SIZE) / 2;
      plane.position.z =
        (z + 0.5) * PLANE_SIZE - (PLANE_Z_COUNT * PLANE_SIZE) / 2;
      plane.rotation.x = -Math.PI / 2;
      plane.receiveShadow = true;
      this.planeArray.push(plane);
    }
    this.scene.add(...this.planeArray);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // シーンに glTF を追加
    const SCALE = 0.03;
    this.gltf.scene.scale.set(SCALE, SCALE, SCALE);
    this.scene.add(this.gltf.scene);

    this.gltf.scene.traverse(object => {
      if (object.isMesh === true || object.isSkinnedMesh === true) {
        object.castShadow = true;
      }
    });

    // アニメーション時間管理のための Clock オブジェクトを生成しておく
    this.clock = new THREE.Clock();

    // ヘルパー
    // const axesBarLength = 5.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    requestAnimationFrame(this.render);
    this.controls.update();

    // 前回からの経過時間（デルタ）を取得してミキサーに適用する
    const delta = this.clock.getDelta();
    this.mixer.update(delta);
    // 選ばれたタイルと狐の距離
    if (this.selectedMesh.position) {
      const subVector = new THREE.Vector3().subVectors(
        this.selectedMesh.position,
        this.gltf.scene.position
      );

      // 距離でアニメーションを変化させる
      const length = subVector.length();
      subVector.normalize();
      const MINMUM = 0.001;
      if (length > 5) {
        this.actions[0].weight = 0;
        this.actions[1].weight = 0;
        this.actions[2].weight = 1.0;
      } else if (length > 1) {
        const _weight = (1 / 4) * (length - 1);
        this.actions[0].weight = 0;
        this.actions[1].weight = 1 - _weight;
        this.actions[2].weight = _weight;
      } else {
        const _weight = length > MINMUM ? length : 0;
        this.actions[0].weight = 1 - _weight;
        this.actions[1].weight = _weight;
        this.actions[2].weight = 0;
      }
      const _scalar = length > MINMUM ? Math.min(length * 0.05, 0.5) : 0;
      this.gltf.scene.position.add(subVector.multiplyScalar(_scalar));
      this.gltf.scene.lookAt(this.selectedMesh.position);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
