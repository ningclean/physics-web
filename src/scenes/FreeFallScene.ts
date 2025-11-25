import { Scene } from '../core/Scene.ts';
import { drawAxes, drawDot, drawVector, drawTrail } from '../utils/draw.ts';
import { THEME } from '../config.ts';

interface FreeFallParams {
  height: number;
  gravity: number;
  v0: number;
  restitution: number;
  vectorScale: number;
  showVel: boolean;
  showAcc: boolean;
  showForce: boolean;
  showTrail: boolean;
  bgColor: string;
}

interface PhysicsState {
  y: number;
  vy: number;
  simV0?: number;
  simG?: number;
  t: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

/**
 * 场景名称: 自由落体 (Free Fall)
 * 物理现象: 模拟物体在重力作用下的垂直下落运动，包含地面反弹（恢复系数）。
 * 初始设置: 高度 height=300 px, 重力 gravity=9.8 px/s², 初速度 v0=0.
 */
export class FreeFallScene extends Scene {
  params: FreeFallParams;
  trail: TrailPoint[];
  maxTrailLength: number;
  phys: PhysicsState;
  prevPhys: PhysicsState;
  groundYOffset: number;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    // Default parameters
    this.params = {
      height: 300, // px (distance from ground)
      gravity: 9.8, // px/s^2 (scaled)
      v0: 0, // px/s
      restitution: 0, // 0-1
      vectorScale: 1.0, // 矢量缩放系数
      showVel: true,
      showAcc: true,
      showForce: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default,
    };

    this.trail = [];
    this.maxTrailLength = 240;

    // Simulation state
    this.phys = {
      y: 0,
      vy: 0,
      t: 0,
    };
    this.prevPhys = { ...this.phys };
  }

  setup(): void {
    console.log('FreeFallScene setup');

    // Ground Y position (relative to canvas bottom)
    this.groundYOffset = 50;

    // Initialize state
    this.resetSimulation();

    // Apply initial background color
    this.canvas.style.backgroundColor = this.params.bgColor;
  }

  getControlConfig(): any[] {
    return [
      {
        type: 'range',
        key: 'height',
        label: '初始高度 (H)',
        min: 50,
        max: 400,
        step: 10,
        description: '小球起始距离地面的高度 (px)',
        onChange: () => this.resetSimulation(),
      },
      {
        type: 'range',
        key: 'gravity',
        label: '重力加速度 (g)',
        min: 1,
        max: 30,
        step: 0.1,
        description: '环境重力大小',
        onChange: (val: number) => {
          this.phys.simG = val * 10;
        },
      },
      {
        type: 'range',
        key: 'v0',
        label: '初速度 (v0)',
        min: -20,
        max: 20,
        step: 1,
        description: '垂直方向初速度 (负值向上，正值向下)',
        onChange: () => this.resetSimulation(),
      },
      {
        type: 'range',
        key: 'restitution',
        label: '弹性系数 (e)',
        min: 0,
        max: 1,
        step: 0.1,
        description: '地面反弹损耗 (0为不反弹，1为完全弹性)',
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
        description: '显示物体的速度矢量（橙色箭头）。',
      },
      {
        type: 'boolean',
        key: 'showAcc',
        label: '显示加速度',
        description: '显示物体的重力加速度矢量（蓝色箭头）。',
      },
      {
        type: 'boolean',
        key: 'showForce',
        label: '显示受力',
        description: '显示物体受到的重力矢量（绿色箭头）。',
      },
      {
        type: 'boolean',
        key: 'showTrail',
        label: '显示轨迹',
        description: '显示物体运动留下的路径。',
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
        description: '选择场景画布的背景颜色。',
        onChange: (val: string) => {
          this.canvas.style.backgroundColor = val;
          sessionStorage.setItem('sceneBgColor', val);
        },
      },
    ];
  }

  getLegendConfig(): any[] {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.red, label: '物体' },
      { type: 'line', color: THEME.colors.objects.ground.light, label: '地面' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度' },
      { type: 'arrow', color: THEME.colors.vectors.acceleration, label: '加速度' },
      { type: 'arrow', color: THEME.colors.vectors.force, label: '受力' },
      {
        type: 'line',
        color:
          this.params.bgColor === THEME.colors.background.white
            ? THEME.colors.objects.trail.lightBg
            : THEME.colors.objects.trail.darkBg,
        label: '轨迹',
      },
    ];
  }

  getFormulaConfig(): any[] {
    return [
      {
        label: '位移公式',
        tex: 'y(t) = H - (v_0 t + \\frac{1}{2}gt^2)',
        params: [
          { symbol: 'y', desc: '高度' },
          { symbol: 'H', desc: '初始高度' },
          { symbol: 'v_0', desc: '初速度' },
          { symbol: 'g', desc: '重力' },
        ],
      },
      {
        label: '速度公式',
        tex: 'v(t) = v_0 + gt',
        params: [
          { symbol: 'v', desc: '速度' },
          { symbol: 't', desc: '时间' },
        ],
      },
    ];
  }

  getChartConfig(): any {
    return {
      vel: {
        label: '高度 (px)',
        series: ['高度'],
        colors: THEME.colors.chart.series,
      },
      acc: {
        label: '垂直速度 (px/s)',
        series: ['速度'],
        colors: THEME.colors.chart.series,
      },
    };
  }

  getMonitorData(t: number): any {
    // Chart 1: Y position (Height from ground)
    const groundY = this.height - this.groundYOffset;
    const currentHeight = groundY - this.phys.y;

    // 检查是否停止
    const radius = THEME.sizes.ballRadius;
    let isStopped = false;
    if (Math.abs(this.phys.y - (groundY - radius)) < 1 && Math.abs(this.phys.vy) < 1) {
      isStopped = true;
    }

    if (isStopped) return null;

    return {
      t: t,
      vel: [currentHeight],
      acc: [-this.phys.vy],
    };
  }

  resetSimulation(): void {
    // Reset state based on params
    // Canvas Y increases downwards.
    // Ground is at (height - groundYOffset).
    // Ball starts at (Ground - params.height).
    const groundY = this.height - this.groundYOffset;
    this.phys = {
      y: groundY - this.params.height,
      vy: this.params.v0 * 10,
      simV0: this.params.v0 * 10,
      simG: this.params.gravity * 10,
      t: 0,
    };
    this.phys.vy = this.phys.simV0;
    this.prevPhys = { ...this.phys };
    this.trail = [];

    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  update(dt: number, totalTime: number): void {
    // 保存上一帧状态
    this.prevPhys = { ...this.phys };

    // Physics update (Euler integration)
    // y is position in canvas (top=0).
    // Ground is at bottom.
    // Gravity pulls DOWN (positive Y direction).

    const groundY = this.height - this.groundYOffset;
    const radius = THEME.sizes.ballRadius; // Ball radius

    // Update velocity
    this.phys.vy += this.phys.simG! * dt;

    // Update position
    this.phys.y += this.phys.vy * dt;

    // Collision detection
    let isStopped = false;
    if (this.phys.y + radius > groundY) {
      this.phys.y = groundY - radius;
      // Bounce
      if (this.params.restitution > 0) {
        this.phys.vy = -this.phys.vy * this.params.restitution;
        // Stop if velocity is very small
        if (Math.abs(this.phys.vy) < this.phys.simG! * dt * 2) {
          this.phys.vy = 0;
          isStopped = true;
        }
      } else {
        this.phys.vy = 0;
        isStopped = true;
      }
    }

    this.phys.t += dt;

    // Update trail
    if (this.params.showTrail) {
      // Center X is width/2
      this.trail.push({ x: this.width / 2, y: this.phys.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    } else {
      this.trail.length = 0;
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number = 1.0): void {
    // Auto-contrast axes color
    const isLightBg = this.params.bgColor === THEME.colors.background.white;
    const axesColor = isLightBg ? '#333333' : '#cccccc';

    // Draw ground
    const groundY = this.height - this.groundYOffset;
    ctx.save();
    ctx.strokeStyle = isLightBg ? '#999' : '#888';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(this.width, groundY);
    ctx.stroke();

    // Draw ground hashes
    ctx.beginPath();
    for (let i = 0; i < this.width; i += 20) {
      ctx.moveTo(i, groundY);
      ctx.lineTo(i - 10, groundY + 10);
    }
    ctx.stroke();
    ctx.restore();

    // 插值计算渲染状态
    const y = this.prevPhys.y * (1 - alpha) + this.phys.y * alpha;
    const vy = this.prevPhys.vy * (1 - alpha) + this.phys.vy * alpha;

    // Draw Trail
    if (this.params.showTrail) {
      const trailColor = isLightBg
        ? THEME.colors.objects.trail.lightBg
        : THEME.colors.objects.trail.darkBg;
      drawTrail(ctx, this.trail, trailColor);
    }

    // Draw Ball
    const centerX = this.width / 2;
    drawDot(ctx, centerX, y, THEME.colors.objects.ball.red, THEME.sizes.ballRadius);

    // Draw Vectors
    // Helper to clamp vector length to stay within canvas
    const clampDy = (y: number, dy: number) => {
      const visualLen = dy * 2; // drawVector doubles the length
      const maxY = this.height - 10; // Bottom padding
      const minY = 10; // Top padding
      const targetY = y + visualLen;

      if (targetY > maxY) {
        return (maxY - y) / 2;
      }
      if (targetY < minY) {
        return (minY - y) / 2;
      }
      return dy;
    };

    if (this.params.showVel) {
      // Velocity vector
      // Scale it down for display
      const vScale = 0.2 * this.params.vectorScale;
      let dy = vy * vScale;
      dy = clampDy(y, dy);
      drawVector(ctx, centerX, y, 0, dy, THEME.colors.vectors.velocity, 'v');
    }

    if (this.params.showAcc) {
      // Acceleration vector (Gravity)
      // Always down
      const aScale = 0.5 * this.params.vectorScale;
      let dy = this.phys.simG! * aScale;
      dy = clampDy(y, dy);
      drawVector(ctx, centerX, y, 0, dy, THEME.colors.vectors.acceleration, 'g');
    }

    if (this.params.showForce) {
      // Force vector
      const fScale = 0.5 * this.params.vectorScale;
      // Offset X slightly so it doesn't perfectly overlap acceleration
      const offsetX = this.params.showAcc ? 10 : 0;
      let dy = this.phys.simG! * fScale;
      dy = clampDy(y, dy);
      drawVector(ctx, centerX + offsetX, y, 0, dy, THEME.colors.vectors.force, 'F');
    }
  }

  resize(width: number, height: number): void {
    super.resize(width, height);
    // If resized, we might need to adjust ball position to keep relative height?
    // Or just reset.
    this.resetSimulation();
  }
}
