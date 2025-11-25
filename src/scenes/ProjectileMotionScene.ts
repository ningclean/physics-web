import { Scene } from '../core/Scene.ts';
import { drawDot, drawVector, drawLine } from '../utils/draw.ts';
import { THEME } from '../config.ts';
import { Physics } from '../utils/physics.ts';
import description from '../content/ProjectileMotion.md?raw';

/**
 * 场景名称: 平抛/斜抛 (Projectile Motion)
 * 物理现象: 模拟物体在重力场中的抛体运动，展示水平方向的匀速直线运动与竖直方向的匀变速运动的合成。
 * 初始设置: 初速度 v0=50 m/s, 发射角度 theta=45°, 初始高度 h=100 m, 重力 g=9.8 m/s².
 */

interface ProjectileMotionParams {
  v0: number;
  theta: number;
  h: number;
  g: number;
  k: number;
  vectorScale: number;
  showVel: boolean;
  showComponents: boolean;
  showTrail: boolean;
  bgColor: string;
}

interface Vector2D {
  x: number;
  y: number;
}

interface Ball {
  pos: Vector2D;
  vel: Vector2D;
  acc: Vector2D;
  mass: number;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
}

export class ProjectileMotionScene extends Scene {
  params: ProjectileMotionParams;
  ball: Ball;
  trail: TrailPoint[];
  time: number;
  isLanded: boolean;
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    // 默认参数
    this.params = {
      v0: 50, // m/s
      theta: 45, // degrees
      h: 100, // m
      g: 9.8, // m/s^2
      k: 0.0, // 空气阻力系数
      vectorScale: 1.0,
      showVel: true,
      showComponents: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default,
    };

    // 物理状态
    this.ball = {
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 },
      acc: { x: 0, y: 0 },
      mass: 1.0, // kg, 假设质量为1以便计算阻力加速度 a = F/m = -kv/m -> -kv
    };

    this.trail = [];
    this.time = 0;
    this.isLanded = false;

    // 视口设置：1米 = 4像素 (因为抛射距离可能很远，比如 v0=50, 45度 -> R ~ 250m)
    this.viewport.setScale(4.0);
    this.viewport.setCenter(100, 50); // 初始视口中心
  }

  getDescription() {
    return description;
  }

  setup(): void {
    this.resetSimulation();
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resetSimulation(): void {
    const { v0, theta, h } = this.params;

    // 初始位置
    this.ball.pos = { x: 0, y: h };

    // 初始速度
    const rad = (theta * Math.PI) / 180;
    this.ball.vel = {
      x: v0 * Math.cos(rad),
      y: v0 * Math.sin(rad),
    };

    this.ball.acc = { x: 0, y: -this.params.g };

    this.trail = [];
    this.time = 0;
    this.isLanded = false;

    // 自动调整视口以适应预估的轨迹
    // 估算最大高度和射程 (无阻力情况)
    const vy0 = this.ball.vel.y;
    const g = this.params.g;
    const maxH = h + (vy0 * vy0) / (2 * g);
    const t_up = vy0 / g;
    const t_total = t_up + Math.sqrt((maxH * 2) / g);
    const range = this.ball.vel.x * t_total;

    // 视口中心设为轨迹中心附近
    this.viewport.setCenter(range / 2, maxH / 2);
    // 调整缩放比例以适应屏幕
    // 留出 20% 边距
    const width = this.canvas.clientWidth || 800;
    const height = this.canvas.clientHeight || 600;
    const scaleX = (width * 0.8) / range;
    const scaleY = (height * 0.8) / (maxH * 1.2); // 高度多留点
    this.viewport.setScale(Math.min(scaleX, scaleY, 10)); // 限制最大缩放

    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig(): any[] {
    return [
      {
        type: 'range',
        key: 'v0',
        label: '初速度 (v0)',
        min: 10,
        max: 100,
        step: 1,
        description: '发射时的速度大小 (m/s)。',
        resetOnChange: true,
      },
      {
        type: 'range',
        key: 'theta',
        label: '发射角度',
        min: 0,
        max: 90,
        step: 1,
        description: '发射方向与水平面的夹角 (度)。',
        resetOnChange: true,
      },
      {
        type: 'range',
        key: 'h',
        label: '初始高度 (h)',
        min: 0,
        max: 200,
        step: 10,
        description: '发射点距离地面的高度 (m)。',
        resetOnChange: true,
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
        key: 'k',
        label: '空气阻力 (k)',
        min: 0.0,
        max: 1.0,
        step: 0.01,
        description: '空气阻力系数 (F = -kv)。',
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
        label: '显示合速度',
        description: '显示合速度矢量。',
      },
      {
        type: 'boolean',
        key: 'showComponents',
        label: '显示分速度',
        description: '显示水平和垂直分速度。',
      },
      {
        type: 'boolean',
        key: 'showTrail',
        label: '显示轨迹',
        description: '显示运动路径。',
      },
      {
        type: 'select',
        key: 'bgColor',
        label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '天空蓝', value: '#87CEEB' }, // 适合抛体运动
          { label: '白色', value: THEME.colors.background.white },
        ],
        onChange: val => {
          this.canvas.style.backgroundColor = val;
          sessionStorage.setItem('sceneBgColor', val);
        },
      },
    ];
  }

  getLegendConfig(): any[] {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '炮弹' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '合速度' },
      { type: 'arrow', color: '#ffcc00', label: '分速度' }, // 淡橙色
      { type: 'arrow', color: THEME.colors.vectors.gravity, label: '重力/加速度' },
    ];
  }

  getFormulaConfig(): any[] {
    return [
      {
        label: '水平位移',
        tex: 'x(t) = v_0 \\cos\\theta \\cdot t',
        params: [],
      },
      {
        label: '垂直位移',
        tex: 'y(t) = h + v_0 \\sin\\theta \\cdot t - \\frac{1}{2}gt^2',
        params: [],
      },
      {
        label: '轨迹方程',
        tex: 'y = x \\tan\\theta - \\frac{g}{2v_0^2\\cos^2\\theta}x^2 + h',
        params: [],
      },
    ];
  }

  getChartConfig(): any {
    return {
      vel: {
        label: '高度 y (m)',
        series: ['Height'],
        colors: [THEME.colors.objects.ball.light],
      },
      acc: {
        label: '垂直速度 vy (m/s)',
        series: ['Vy'],
        colors: ['#ffcc00'],
      },
    };
  }

  getMonitorData(t: number): any {
    return {
      t: t,
      vel: [this.ball.pos.y],
      acc: [this.ball.vel.y],
    };
  }

  update(dt: number, t: number): void {
    if (this.isLanded) return;

    const { g, k } = this.params;
    const { vel, pos, mass } = this.ball;

    // 计算受力/加速度
    // 重力: (0, -g)
    // 阻力: -k * v

    const fx = -k * vel.x;
    const fy = -mass * g - k * vel.y;

    const ax = fx / mass;
    const ay = fy / mass;

    this.ball.acc = { x: ax, y: ay };

    // 更新速度
    vel.x += ax * dt;
    vel.y += ay * dt;

    // 更新位置
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;

    // 落地检测
    if (pos.y <= 0) {
      pos.y = 0;
      vel.x = 0;
      vel.y = 0;
      this.isLanded = true;
    }

    // 记录轨迹
    this.time += dt;
    if (this.params.showTrail && !this.isLanded) {
      // 采样
      if (this.trail.length === 0 || Math.abs(this.trail[this.trail.length - 1].t - t) > 0.05) {
        this.trail.push({ x: pos.x, y: pos.y, t: t });
      }
    } else if (this.isLanded && this.trail[this.trail.length - 1].y !== 0) {
      // 确保最后一个点在地面
      this.trail.push({ x: pos.x, y: 0, t: t });
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { vectorScale, showVel, showComponents, showTrail, h } = this.params;

    // 绘制地面
    const groundY = this.viewport.worldToScreen(0, 0).y;
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.canvas.width, groundY);
    ctx.stroke();

    // 绘制发射台 (如果 h > 0)
    if (h > 0) {
      const startPos = this.viewport.worldToScreen(0, h);
      const basePos = this.viewport.worldToScreen(0, 0);
      ctx.beginPath();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 4;
      ctx.moveTo(basePos.x, basePos.y);
      ctx.lineTo(startPos.x, startPos.y);
      ctx.stroke();
    }

    // 绘制轨迹
    if (showTrail && this.trail.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      const start = this.viewport.worldToScreen(this.trail[0].x, this.trail[0].y);
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < this.trail.length; i++) {
        const p = this.viewport.worldToScreen(this.trail[i].x, this.trail[i].y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // 绘制炮弹
    const screenPos = this.viewport.worldToScreen(this.ball.pos.x, this.ball.pos.y);
    drawDot(ctx, screenPos.x, screenPos.y, THEME.colors.objects.ball.light, 6);

    // 绘制矢量
    const vScale = 0.5 * vectorScale;

    if (showComponents) {
      // 水平分速度
      const screenVx = this.viewport.toPixels(this.ball.vel.x) * 0.02 * vectorScale; // 这里的比例需要调整，因为像素单位可能很大
      // 重新考虑缩放：
      // 速度单位 m/s。如果 1m = 4px。v=50m/s -> 200px。
      // 直接用像素画可能太长。
      // 统一用一个系数。

      const vxPx = this.ball.vel.x * vScale;
      const vyPx = -this.ball.vel.y * vScale;

      // Vx (虚线)
      ctx.save();
      ctx.setLineDash([4, 4]);
      drawVector(ctx, screenPos.x, screenPos.y, vxPx, 0, '#ffcc00');
      // Vy (虚线)
      drawVector(ctx, screenPos.x, screenPos.y, 0, vyPx, '#ffcc00');
      ctx.restore();
    }

    if (showVel) {
      const vxPx = this.ball.vel.x * vScale;
      const vyPx = -this.ball.vel.y * vScale;
      drawVector(ctx, screenPos.x, screenPos.y, vxPx, vyPx, THEME.colors.vectors.velocity);
    }
  }
}
