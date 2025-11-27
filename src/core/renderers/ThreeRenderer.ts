import { Renderer } from './Renderer';
import * as THREE from 'three';

/**
 * Three.js 3D 渲染器
 * 提供 3D 渲染功能
 */
export class ThreeRenderer extends Renderer {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: any; // OrbitControls

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    console.log('Creating ThreeRenderer');
    this.initThreeJS();
  }

  private initThreeJS(): void {
    // 创建场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // 黑色背景

    // 创建相机
    this.camera = new THREE.PerspectiveCamera(
      45, // FOV 改为45度，更聚焦
      this.width / this.height, // 宽高比
      0.1, // 近裁剪面
      2000 // 远裁剪面
    );
    this.camera.position.set(0, 0, 300); // 调整相机距离
    this.camera.lookAt(0, 0, 0);

    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false
    });
    console.log('Renderer init size:', this.width, this.height);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setSize(500, 500);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 设置画布边框为白色
    this.canvas.style.border = "2px solid white";
    this.canvas.style.boxSizing = "border-box";

    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    this.scene.add(ambientLight);

    // 添加方向光（模拟太阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    this.scene.add(directionalLight);

    // 添加点光源（恒星发光）
    const pointLight = new THREE.PointLight(0xffcc00, 2, 1000);
    pointLight.position.set(0, 0, 0);
    this.scene.add(pointLight);

    // 添加网格辅助线增强3D效果
    const gridHelper = new THREE.GridHelper(4000, 80);
    this.scene.add(gridHelper);

    // 添加空间边界线
    const boundaryBox = new THREE.Box3(
      new THREE.Vector3(-2000, -2000, -2000),
      new THREE.Vector3(2000, 2000, 2000)
    );
    const boundaryHelper = new THREE.Box3Helper(boundaryBox, 0x888888); // 灰色边界线
    this.scene.add(boundaryHelper);

    // 添加白色坐标轴
    this.addAxes(500);

    // 在相机位置添加白色正方形标记
    // this.addCameraMarker(); // 取消相机的描画

    // 初始化轨道控制器（如果可用）
    this.initControls();
  }

  private initControls(): void {
    try {
      // 动态导入 OrbitControls
      import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.enableRotate = true;
      }).catch(() => {
        console.warn('OrbitControls not available, using manual camera control');
      });
    } catch (error) {
      console.warn('Failed to load OrbitControls:', error);
    }
  }

  render(): void {
    try {
      const gl = this.renderer.getContext();
      if (!gl) {
        console.error('No WebGL context in Three.js renderer');
        return;
      }
      // 临时禁用controls以测试
      if (this.controls) {
        this.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Three.js render error:', error);
    }
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    console.log('Renderer resize:', width, height);

    const dpr = window.devicePixelRatio;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    console.log('Canvas size set to:', this.canvas.width, 'x', this.canvas.height, 'physical,', this.canvas.style.width, 'x', this.canvas.style.height, 'CSS');

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(dpr);

    // 确保scissor测试关闭，全屏渲染
    this.renderer.setScissorTest(false);
  }

  dispose(): void {
    // 清理几何体
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });

    // 清理渲染器
    this.renderer.dispose();

    // 清理控制器
    if (this.controls) {
      this.controls.dispose();
    }
  }

  getType(): 'threejs' {
    return 'threejs';
  }

  /**
   * 获取 Three.js 场景对象
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * 获取相机对象
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * 获取渲染器对象
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * 添加对象到场景
   */
  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  /**
   * 从场景移除对象
   */
  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * 添加白色坐标轴
   */
  private addAxes(size: number): void {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });

    // X轴 从-1000到1000
    const xGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1000, 0, 0),
      new THREE.Vector3(1000, 0, 0)
    ]);
    const xAxis = new THREE.Line(xGeometry, material);
    this.scene.add(xAxis);

    // Y轴 从-1000到1000
    const yGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1000, 0),
      new THREE.Vector3(0, 1000, 0)
    ]);
    const yAxis = new THREE.Line(yGeometry, material);
    this.scene.add(yAxis);

    // Z轴 从-1000到1000
    const zGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, -1000),
      new THREE.Vector3(0, 0, 1000)
    ]);
    const zAxis = new THREE.Line(zGeometry, material);
    this.scene.add(zAxis);
  }

  /**
   * 在相机位置添加白色小球标记
   */
  private addCameraMarker(): void {
    // 创建白色小球几何
    const geometry = new THREE.SphereGeometry(5, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const marker = new THREE.Mesh(geometry, material);
    
    // 设置位置为相机位置
    marker.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
    
    this.scene.add(marker);
  }
}