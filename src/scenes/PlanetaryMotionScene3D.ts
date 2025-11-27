import { Scene } from '../core/Scene';
import { Renderer } from '../core/renderers/Renderer';
import { THEME } from '../config';
import { Physics } from '../utils/physics';
import description from '../content/PlanetaryMotion.md?raw';
import * as THREE from 'three';

interface PlanetaryMotionParams {
  M: number;
  v0: number;
  r0: number;
  G: number;
  vectorScale: number;
  showVel: boolean;
  showForce: boolean;
  showTrail: boolean;
  bgColor: string;
}

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface PlanetState {
  m: number;
  pos: Vector3D;
  vel: Vector3D;
}

interface StarState {
  pos: Vector3D;
  radius: number;
  color: string;
}

interface TrailPoint {
  x: number;
  y: number;
  z: number;
  t: number;
}

/**
 * 3D 天体运动场景
 * 展示行星绕恒星的 3D 轨道运动
 */
export class PlanetaryMotionScene3D extends Scene {
  params: PlanetaryMotionParams;
  planet: PlanetState;
  star: StarState;
  trail: TrailPoint[];
  time: number;

  // 3D 对象
  private starMesh: THREE.Mesh | null = null;
  private planetMesh: THREE.Mesh | null = null;
  private trailLine: THREE.Line | null = null;
  private velocityArrow: THREE.Group | null = null;
  private forceArrow: THREE.Group | null = null;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    // 默认参数
    this.params = {
      M: 500, // 恒星质量
      v0: 5.0, // 行星初速度 (切向)
      r0: 200, // 初始距离
      G: 1.0, // 引力常数
      vectorScale: 1.0,
      showVel: true,
      showForce: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default,
    };

    // 物理状态
    this.planet = {
      m: 1, // 行星质量
      pos: { x: 0, y: 0, z: 0 },
      vel: { x: 0, y: 0, z: 0 },
    };

    this.star = {
      pos: { x: 0, y: 0, z: 0 }, // 恒星固定在中心
      radius: 10,
      color: '#ffcc00',
    };

    this.trail = [];
    this.time = 0;
  }

  getDescription(): string {
    return description;
  }

  setup(): void {
    this.resetSimulation();
    this.init3DObjects();
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);



    // 强制初始渲染
    if (this.renderer) {
      this.renderWithRenderer(this.renderer, 1.0);
    }
  }

  private init3DObjects(): void {
    const renderer = this.getRenderer();
    if (!renderer || renderer.getType() !== 'threejs') {
      console.warn('PlanetaryMotionScene3D requires Three.js renderer');
      return;
    }

    const threeRenderer = renderer as any;
    const scene = threeRenderer.getScene();

    // 设置场景背景色
    scene.background = new THREE.Color(this.params.bgColor);

    // 创建恒星
    const starGeometry = new THREE.SphereGeometry(this.star.radius, 32, 32);
    const starMaterial = new THREE.MeshPhongMaterial({
      color: this.star.color,
      emissive: this.star.color,
      emissiveIntensity: 0.3
    });
    this.starMesh = new THREE.Mesh(starGeometry, starMaterial);
    this.starMesh.position.set(this.star.pos.x, this.star.pos.y, this.star.pos.z);
    scene.add(this.starMesh);



    // 创建行星
    const planetGeometry = new THREE.SphereGeometry(3, 16, 16);
    const planetMaterial = new THREE.MeshPhongMaterial({
      color: THEME.colors.objects.ball.light
    });
    this.planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(this.planetMesh);

    // 创建轨迹线
    const trailGeometry = new THREE.BufferGeometry();
    this.trailLine = new THREE.Line(trailGeometry, new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    }));
    scene.add(this.trailLine);

    // 创建速度矢量箭头
    this.velocityArrow = this.createArrow(0x00ff00);
    scene.add(this.velocityArrow);

    // 创建引力矢量箭头
    this.forceArrow = this.createArrow(0xd28bff);
    scene.add(this.forceArrow);

    console.info('[PlanetaryMotionScene3D] 3D objects initialized');
  }

  private createArrow(color: number): THREE.Group {
    const group = new THREE.Group();

    // 箭头主体
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 20, 8);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
    cylinder.position.y = 10;
    group.add(cylinder);

    // 箭头头部
    const coneGeometry = new THREE.ConeGeometry(3, 8, 8);
    const coneMaterial = new THREE.MeshBasicMaterial({ color });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.position.y = 24;
    group.add(cone);

    group.visible = false;
    return group;
  }

  resetSimulation(): void {
    const { r0, v0 } = this.params;

    // 初始位置：在恒星右侧 r0 处
    this.planet.pos = { x: r0, y: 0, z: 0 };

    // 初始速度：垂直向上 (切向)
    this.planet.vel = { x: 0, y: v0, z: 0 };

    this.trail = [];
    this.time = 0;

    console.log('Reset simulation: planet at', this.planet.pos, 'star at', this.star.pos);

    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();

    // 更新 3D 对象位置
    this.update3DObjects();
  }

  private update3DObjects(): void {
    if (this.planetMesh) {
      this.planetMesh.position.set(this.planet.pos.x, this.planet.pos.y, this.planet.pos.z);
    }

    // 更新轨迹
    if (this.params.showTrail && this.trailLine && this.trail.length > 1) {
      const positions = new Float32Array(this.trail.length * 3);
      for (let i = 0; i < this.trail.length; i++) {
        positions[i * 3] = this.trail[i].x;
        positions[i * 3 + 1] = this.trail[i].y;
        positions[i * 3 + 2] = this.trail[i].z;
      }
      this.trailLine.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.trailLine.geometry.computeBoundingSphere();
      this.trailLine.visible = true;
    } else if (this.trailLine) {
      this.trailLine.visible = false;
    }

    // 更新矢量箭头
    this.updateArrows();
  }

  private updateArrows(): void {
    const { vectorScale, showVel, showForce } = this.params;

    if (showVel && this.velocityArrow) {
      const vScale = 5.0 * vectorScale;
      this.updateArrow(this.velocityArrow, this.planet.pos, {
        x: this.planet.vel.x * vScale,
        y: this.planet.vel.y * vScale,
        z: this.planet.vel.z * vScale
      });
      this.velocityArrow.visible = true;
    } else if (this.velocityArrow) {
      this.velocityArrow.visible = false;
    }

    if (showForce && this.forceArrow) {
      // 计算当前引力
      const dx = this.planet.pos.x - this.star.pos.x;
      const dy = this.planet.pos.y - this.star.pos.y;
      const dz = this.planet.pos.z - this.star.pos.z;
      const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const F = Physics.gravitationalForce(this.params.G, this.params.M, this.planet.m, r);

      const Fx = -F * (dx / r);
      const Fy = -F * (dy / r);
      const Fz = -F * (dz / r);

      const fScale = 200.0 * vectorScale;
      this.updateArrow(this.forceArrow, this.planet.pos, {
        x: Fx * fScale,
        y: Fy * fScale,
        z: Fz * fScale
      });
      this.forceArrow.visible = true;
    } else if (this.forceArrow) {
      this.forceArrow.visible = false;
    }
  }

  private updateArrow(arrow: THREE.Group, start: Vector3D, direction: Vector3D): void {
    // 设置箭头位置
    arrow.position.set(start.x, start.y, start.z);

    // 计算箭头方向和长度
    const length = Math.sqrt(direction.x ** 2 + direction.y ** 2 + direction.z ** 2);
    if (length > 0) {
      // 创建四元数来旋转箭头
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0), // 默认箭头方向 (向上)
        new THREE.Vector3(direction.x, direction.y, direction.z).normalize()
      );
      arrow.setRotationFromQuaternion(quaternion);

      // 缩放箭头长度
      arrow.scale.y = length / 32; // 32 是默认箭头长度
    }
  }

  getControlConfig(): any[] {
    return [
      {
        type: 'range',
        key: 'M',
        label: '恒星质量 (M)',
        min: 100,
        max: 1000,
        step: 50,
        description: '中心天体的质量。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'v0',
        label: '初速度 (v0)',
        min: 0,
        max: 10,
        step: 0.1,
        description: '行星的初始切向速度。',
        resetOnChange: true,
      },
      {
        type: 'range',
        key: 'r0',
        label: '初始距离 (r)',
        min: 100,
        max: 400,
        step: 10,
        description: '行星与恒星的初始距离。',
        resetOnChange: true,
      },
      {
        type: 'range',
        key: 'G',
        label: '引力常数 (G)',
        min: 0.1,
        max: 5.0,
        step: 0.1,
        description: '模拟的万有引力常数。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'vectorScale',
        label: '矢量缩放',
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: '调整矢量箭头的显示长度。',
        resetOnChange: false,
      },
      {
        type: 'boolean',
        key: 'showVel',
        label: '显示速度',
        description: '显示速度矢量。',
      },
      {
        type: 'boolean',
        key: 'showForce',
        label: '显示引力',
        description: '显示万有引力矢量。',
      },
      {
        type: 'boolean',
        key: 'showTrail',
        label: '显示轨迹',
        description: '显示行星运行轨道。',
      },
      {
        type: 'select',
        key: 'bgColor',
        label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '深蓝', value: '#000022' },
          { label: '白色', value: THEME.colors.background.white },
        ],
        onChange: (val: string) => {
          this.canvas.style.backgroundColor = val;
          sessionStorage.setItem('sceneBgColor', val);
          // 更新 Three.js 背景色
          const renderer = this.getRenderer();
          if (renderer && renderer.getType() === 'threejs') {
            const threeRenderer = renderer as any;
            const scene = threeRenderer.getScene();
            scene.background = new THREE.Color(val);
          }
        },
      },
    ];
  }

  getLegendConfig(): any[] {
    return [
      { type: 'dot', color: '#ffcc00', label: '恒星' },
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '行星' },
      { type: 'arrow', color: '#00ff00', label: '速度' },
      { type: 'arrow', color: '#d28bff', label: '引力' },
    ];
  }

  getFormulaConfig(): any[] {
    return [
      {
        label: '万有引力',
        tex: 'F = G \\frac{Mm}{r^2}',
        params: [],
      },
      {
        label: '机械能',
        tex: 'E = \\frac{1}{2}mv^2 - G\\frac{Mm}{r}',
        params: [],
      },
    ];
  }

  getChartConfig(): any {
    return {
      vel: {
        label: '距离 r (px)',
        series: ['Distance'],
        colors: [THEME.colors.objects.ball.light],
      },
      acc: {
        label: '速度 v (px/s)',
        series: ['Velocity'],
        colors: [THEME.colors.vectors.velocity],
      },
    };
  }

  getMonitorData(t: number): any {
    const dx = this.planet.pos.x - this.star.pos.x;
    const dy = this.planet.pos.y - this.star.pos.y;
    const dz = this.planet.pos.z - this.star.pos.z;
    const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const v = Math.sqrt(this.planet.vel.x ** 2 + this.planet.vel.y ** 2 + this.planet.vel.z ** 2);

    return {
      t: t,
      vel: [r],
      acc: [v],
    };
  }

  getRecordingDuration(): number {
    const { M, G, r0, v0 } = this.params;
    // 计算轨道周期
    const E = (v0 * v0) / 2 - (G * M) / r0;

    if (E >= 0) {
      return 10.0;
    }

    const a = -(G * M) / (2 * E);
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * M));

    let duration = period;
    while (duration < 2.0) {
      duration += period;
    }

    return duration;
  }

  update(dt: number, t: number): void {
    const { M, G } = this.params;
    const { m, pos, vel } = this.planet;

    // 计算引力 (3D 版本)
    const dx = pos.x - this.star.pos.x;
    const dy = pos.y - this.star.pos.y;
    const dz = pos.z - this.star.pos.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    const r = Math.sqrt(r2);

    const F = Physics.gravitationalForce(G, M, m, r);

    // 分解力
    const Fx = -F * (dx / r);
    const Fy = -F * (dy / r);
    const Fz = -F * (dz / r);

    // 更新速度 (半隐式 Euler)
    vel.x += (Fx / m) * dt;
    vel.y += (Fy / m) * dt;
    vel.z += (Fz / m) * dt;

    // 更新位置
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    pos.z += vel.z * dt;

    // 记录轨迹
    this.time += dt;
    if (this.params.showTrail) {
      if (this.trail.length === 0 || Math.abs(this.trail[this.trail.length - 1].t - t) > 0.1) {
        this.trail.push({ x: pos.x, y: pos.y, z: pos.z, t: t });
        if (this.trail.length > 2000) this.trail.shift();
      }
    }

    // 更新 3D 对象
    this.update3DObjects();
  }

  protected render3D(renderer: Renderer): void {
    // 3D 渲染主要在 update 方法中完成
    // 这里可以添加额外的渲染逻辑
  }

  teardown(): void {
    // 清理 3D 对象
    const renderer = this.getRenderer();
    if (renderer && renderer.getType() === 'threejs') {
      const threeRenderer = renderer as any;
      const scene = threeRenderer.getScene();

      if (this.starMesh) scene.remove(this.starMesh);
      if (this.planetMesh) scene.remove(this.planetMesh);
      if (this.trailLine) scene.remove(this.trailLine);
      if (this.velocityArrow) scene.remove(this.velocityArrow);
      if (this.forceArrow) scene.remove(this.forceArrow);
    }



    super.teardown();
  }
}