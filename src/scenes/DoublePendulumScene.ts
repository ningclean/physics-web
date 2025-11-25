import { Scene } from '../core/Scene.ts';
import { drawDot, drawLine } from '../utils/draw.ts';
import { THEME } from '../config.ts';
import { Physics } from '../utils/physics.ts';
import { Integrator } from '../core/Integrator.ts';
import description from '../content/DoublePendulum.md?raw';

interface DoublePendulumParams {
  m1: number;
  m2: number;
  L1: number;
  L2: number;
  theta1_0: number;
  theta2_0: number;
  g: number;
  trailLength: number;
  bgColor: string;
}

interface PhysicsState {
  theta1: number;
  theta2: number;
  omega1: number;
  omega2: number;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

/**
 * 场景名称: 双摆 (Double Pendulum)
 * 物理现象: 模拟双摆系统的混沌运动，展示对初始条件的敏感依赖性（蝴蝶效应）。
 * 初始设置: m1=1.0 kg, m2=1.0 kg, L1=1.0 m, L2=1.0 m, theta1=90°, theta2=90°.
 */
export class DoublePendulumScene extends Scene {
  params: DoublePendulumParams;
  phys: PhysicsState;
  trail: TrailPoint[];

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    // 默认参数
    this.params = {
      m1: 1.0, // kg
      m2: 1.0, // kg
      L1: 1.0, // m
      L2: 1.0, // m
      theta1_0: 90, // degrees
      theta2_0: 90, // degrees
      g: 9.8, // m/s^2
      trailLength: 500,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default,
    };

    // 物理状态
    this.phys = {
      theta1: Math.PI / 2,
      theta2: Math.PI / 2,
      omega1: 0,
      omega2: 0,
    };

    // 轨迹
    this.trail = [];

    // 视口设置：1米 = 80像素
    this.viewport.setScale(80);
    this.viewport.setCenter(0, -1.0); // 稍微向下偏移，因为摆通常在下方
  }

  getDescription(): string {
    return description;
  }

  setup(): void {
    this.resetSimulation();
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resetSimulation(): void {
    const { theta1_0, theta2_0 } = this.params;
    this.phys = {
      theta1: (theta1_0 * Math.PI) / 180,
      theta2: (theta2_0 * Math.PI) / 180,
      omega1: 0,
      omega2: 0,
    };
    this.trail = [];

    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig(): any[] {
    return [
      {
        type: 'range',
        key: 'm1',
        label: '质量 1 (m1)',
        min: 0.5,
        max: 5.0,
        step: 0.1,
        description: '上方摆球的质量 (kg)。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'm2',
        label: '质量 2 (m2)',
        min: 0.5,
        max: 5.0,
        step: 0.1,
        description: '下方摆球的质量 (kg)。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'L1',
        label: '摆长 1 (L1)',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        description: '上方摆杆长度 (m)。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'L2',
        label: '摆长 2 (L2)',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        description: '下方摆杆长度 (m)。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'theta1_0',
        label: '初始角 1',
        min: -180,
        max: 180,
        step: 5,
        description: '上方摆杆初始角度 (度)。',
      },
      {
        type: 'range',
        key: 'theta2_0',
        label: '初始角 2',
        min: -180,
        max: 180,
        step: 5,
        description: '下方摆杆初始角度 (度)。',
      },
      {
        type: 'range',
        key: 'g',
        label: '重力 (g)',
        min: 1.0,
        max: 20.0,
        step: 0.1,
        description: '重力加速度 (m/s²)。',
        resetOnChange: false,
      },
      {
        type: 'range',
        key: 'trailLength',
        label: '轨迹长度',
        min: 100,
        max: 2000,
        step: 100,
        description: '保留的轨迹点数量。',
        resetOnChange: false,
      },
      {
        type: 'select',
        key: 'bgColor',
        label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '灰色', value: THEME.colors.background.gray },
          { label: '白色', value: THEME.colors.background.white },
        ],
        onChange: (val: string) => {
          this.canvas.style.backgroundColor = val;
          sessionStorage.setItem('sceneBgColor', val);
        },
      },
    ];
  }

  getLegendConfig(): any[] {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '摆球 1' },
      { type: 'dot', color: '#5cd65c', label: '摆球 2' },
      { type: 'line', color: '#fff', label: '摆杆' },
      { type: 'line', color: '#d28bff', label: '轨迹' },
    ];
  }

  getFormulaConfig(): any[] {
    return [
      {
        label: '拉格朗日量',
        tex: '\\mathcal{L} = T - V',
        params: [],
      },
      {
        label: '运动方程',
        tex: '\\frac{d}{dt}(\\frac{\\partial\\mathcal{L}}{\\partial\\dot{\\theta}_i}) - \\frac{\\partial\\mathcal{L}}{\\partial\\theta_i} = 0',
        params: [],
      },
    ];
  }

  getChartConfig(): any {
    return {
      vel: {
        label: '角度 (deg)',
        series: ['Theta 1', 'Theta 2'],
        colors: [THEME.colors.objects.ball.light, '#5cd65c'],
      },
      acc: {
        label: '相图 (Theta2 vs Omega2)',
        series: ['Phase 2'],
        colors: ['#d28bff'],
      },
    };
  }

  getMonitorData(t: number): any {
    const { theta1, theta2, omega2 } = this.phys;
    // 规范化角度到 -180 ~ 180
    const normalize = (angle: number): number => {
      let a = angle % (2 * Math.PI);
      if (a > Math.PI) a -= 2 * Math.PI;
      if (a < -Math.PI) a += 2 * Math.PI;
      return (a * 180) / Math.PI;
    };

    return {
      t: t,
      vel: [normalize(theta1), normalize(theta2)],
      acc: [omega2], // 这里其实想画相图，但 RealTimeChart 目前只支持 Time Series。
      // 我们可以暂时只画 omega2 随时间变化，或者修改 Chart 组件支持 XY Plot。
      // 鉴于目前架构，先画 omega2。
    };
  }

  update(dt: number, t: number): void {
    const { m1, m2, L1, L2, g, trailLength } = this.params;

    // 定义导数函数
    const derivatives = (state: PhysicsState, time: number) => {
      const { theta1, theta2, omega1, omega2 } = state;
      const { alpha1, alpha2 } = Physics.doublePendulumAccelerations({ m1, m2, L1, L2, g }, state);
      return {
        theta1: omega1,
        theta2: omega2,
        omega1: alpha1,
        omega2: alpha2,
      };
    };

    // RK4 积分
    // 双摆对精度要求高，可以考虑把 dt 分割成更小的步长
    const steps = 4;
    const subDt = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.phys = Integrator.rk4(this.phys, t + i * subDt, subDt, derivatives);
    }

    // 计算位置用于轨迹
    const x1 = L1 * Math.sin(this.phys.theta1);
    const y1 = -L1 * Math.cos(this.phys.theta1);
    const x2 = x1 + L2 * Math.sin(this.phys.theta2);
    const y2 = y1 - L2 * Math.cos(this.phys.theta2);

    // 记录轨迹
    // 限制记录频率，避免点太密
    if (this.trail.length === 0 || Math.abs(this.trail[this.trail.length - 1].t - t) > 0.02) {
      this.trail.push({ x: x2, y: y2, t: t });
      if (this.trail.length > trailLength) {
        this.trail.shift();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { L1, L2, m1, m2, bgColor } = this.params;
    const { theta1, theta2 } = this.phys;

    const isLightBg = bgColor === THEME.colors.background.white;
    const mainColor = isLightBg ? '#333' : '#fff';

    // 计算位置
    const pivot = { x: 0, y: 0 };
    const p1 = {
      x: L1 * Math.sin(theta1),
      y: -L1 * Math.cos(theta1),
    };
    const p2 = {
      x: p1.x + L2 * Math.sin(theta2),
      y: p1.y - L2 * Math.cos(theta2),
    };

    // 转换坐标
    const sPivot = this.viewport.worldToScreen(pivot.x, pivot.y);
    const sP1 = this.viewport.worldToScreen(p1.x, p1.y);
    const sP2 = this.viewport.worldToScreen(p2.x, p2.y);

    // 绘制轨迹
    if (this.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = '#d28bff'; // 紫色
      ctx.lineWidth = 1;
      // 渐变透明度？Canvas 路径渐变比较麻烦，这里简单处理
      // 或者分段绘制

      // 简单绘制
      const start = this.viewport.worldToScreen(this.trail[0].x, this.trail[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < this.trail.length; i++) {
        const p = this.viewport.worldToScreen(this.trail[i].x, this.trail[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // 绘制摆杆
    drawLine(ctx, sPivot.x, sPivot.y, sP1.x, sP1.y, mainColor, 2);
    drawLine(ctx, sP1.x, sP1.y, sP2.x, sP2.y, mainColor, 2);

    // 绘制摆球
    // 半径根据质量稍微变化
    const r1 = THEME.sizes.ballRadius * Math.pow(m1, 1 / 3);
    const r2 = THEME.sizes.ballRadius * Math.pow(m2, 1 / 3);

    drawDot(ctx, sPivot.x, sPivot.y, mainColor, 4);
    drawDot(ctx, sP1.x, sP1.y, THEME.colors.objects.ball.light, r1);
    drawDot(ctx, sP2.x, sP2.y, '#5cd65c', r2);
  }
}
