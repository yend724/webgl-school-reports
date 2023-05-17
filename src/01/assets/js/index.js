import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

window.addEventListener(
  'DOMContentLoaded',
  () => {
    const app = new App3();
    app.init();
    app.render();
  },
  false
);

class App3 {
  // カメラ定数
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 100.0,
      x: 30.0,
      y: 0.0,
      z: 30.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }

  // レンダラー定数
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xa9ceec,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  // ディレクショナルライト定数
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
      x: 0.0,
      y: 10.0,
      z: 5.0,
    };
  }

  // アンビエントライト定数
  static get AMBIENT_LIGHT_PARAM() {
    return {
      intensity: 0.4,
      color: 0xffffff,
    };
  }

  // 中心ボックスマテリアル定数
  static get RED_MATERIAL_PARAM() {
    return {
      color: 0xee0000,
    };
  }
  static get BLUE_MATERIAL_PARAM() {
    return {
      color: 0x0000ee,
    };
  }
  static get WHITE_MATERIAL_PARAM() {
    return {
      color: 0xffffff,
    };
  }

  // 上下面マテリアル定数
  static get VERTICAL_SIDE_MATERIAL_PARAM() {
    return {
      color: 0x000000,
    };
  }

  // 側面マテリアル定数
  static get HORIZONTAL_SIDE_MATERIAL_PARAM() {
    return {
      transparent: true,
      opacity: 0.25,
      color: 0xffffff,
    };
  }

  constructor() {
    this.renderer; // レンダラ
    this.scene; // シーン
    this.camera; // カメラ
    this.centerBoxGeometry; // 中心ボックスジオメトリ
    this.centerBoxMaterials = []; // 中心ボックスマテリアル
    this.centerBoxMeshArray = []; // 中心ボックスメッシュ配列
    this.centerBoxNum = 33;
    this.controls; // オービットコントロール
    this.render = this.render.bind(this);

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

  init() {
    // レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );

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

    // ディレクショナルライト
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

    // アンビエントライト
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // 上下面
    const verticalSideGeometory = new THREE.BoxGeometry(6, 1, 6);
    const verticalSideMaterial = new THREE.MeshPhongMaterial(
      App3.VERTICAL_SIDE_MATERIAL_PARAM
    );
    const upper = new THREE.Mesh(verticalSideGeometory, verticalSideMaterial);
    const under = upper.clone();
    upper.position.y = (this.centerBoxNum + 1) / 2;
    under.position.y = ((this.centerBoxNum + 1) / 2) * -1;
    this.scene.add(upper, under);

    // 側面
    const horizontalSideGeometory = new THREE.BoxGeometry(
      5,
      this.centerBoxNum,
      5
    );
    const horizontalSideMaterial = new THREE.MeshStandardMaterial(
      App3.HORIZONTAL_SIDE_MATERIAL_PARAM
    );
    const horizontalMesh = new THREE.Mesh(
      horizontalSideGeometory,
      horizontalSideMaterial
    );
    this.scene.add(horizontalMesh);

    // 中心ボックス
    this.centerBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
    this.centerBoxMaterials = [
      new THREE.MeshPhongMaterial(App3.RED_MATERIAL_PARAM),
      new THREE.MeshPhongMaterial(App3.BLUE_MATERIAL_PARAM),
      new THREE.MeshPhongMaterial(App3.WHITE_MATERIAL_PARAM),
    ];

    const PI_UNIT = (2 * Math.PI) / this.centerBoxMaterials.length;

    Array.from({ length: this.centerBoxNum }).forEach((_, i) => {
      const row = i;
      const y = (this.centerBoxNum - 1) / 2 - i * 1;

      const posArray = [
        {
          x: Math.cos(i),
          z: Math.sin(i),
        },
        {
          x: Math.cos(i + PI_UNIT),
          z: Math.sin(i + PI_UNIT),
        },
        {
          x: Math.cos(i + PI_UNIT),
          z: Math.sin(i + PI_UNIT),
        },
      ];

      const boxes = posArray.map(({ x, z }, i) => {
        const box = new THREE.Mesh(
          this.centerBoxGeometry,
          this.centerBoxMaterials[i]
        );
        box.position.set(x, y, z);

        this.scene.add(box);

        return {
          target: box,
          initial: {
            row,
            position: {
              x,
              y,
              z,
            },
          },
        };
      });
      this.centerBoxMeshArray.push(boxes);
    });

    // オービットコントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxDistance = 50;

    // ヘルパー
    // const axesBarLength = 16.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  render(time) {
    requestAnimationFrame(this.render);

    if (time) {
      const PI_UNIT = (2 * Math.PI) / 3;
      const timerAmount = time / 400;
      this.centerBoxMeshArray.forEach(boxes => {
        boxes.forEach(({ target, initial }, i) => {
          const { row } = initial;
          target.position.x = Math.cos(row + PI_UNIT * i + timerAmount);
          target.position.z = Math.sin(row + PI_UNIT * i + timerAmount);
          target.rotation.set(timerAmount + row, timerAmount + row, 0);
        });
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}
