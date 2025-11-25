import { Scene } from '../core/Scene.ts';
import { drawAxes, drawCircle, drawDot, drawVector, drawTrail } from '../utils/draw.ts';
import { THEME } from '../config.ts';

/**
 * 场景名称: 匀速圆周运动 (Uniform Circular Motion)
 * 物理现象: 模拟物体在向心力作用下的匀速圆周运动，展示线速度、角速度与向心加速度的关系。
 * 初始设置: 角速度 omega=0.5 rad/s, 半径 radius=150 px.
 */

interface CircularParams {
  omega: number;
  radius: number;
  vectorScale: number;
  showVel: boolean;
  showAcc: boolean;
  showTrail: boolean;
  bgColor: string;
}

interface PhysicsState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  angle: number;
  radius: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

interface RenderState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  radius: number;
}

export class CircularScene extends Scene {
  params: CircularParams;
  trail: TrailPoint[];
  maxTrailLength: number;
  phys: PhysicsState;
  prevPhys: PhysicsState;
  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    // Default parameters
    this.params = {
      omega: 0.5, // rad/s
      radius: 150, // px
      vectorScale: 1.0, // 矢量缩放系数
      showVel: true,
      showAcc: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default,
    };

    this.trail = [];
    this.maxTrailLength = 240;

    // 物理状态
    this.phys = this.computeState(0);
    this.prevPhys = { ...this.phys };
  }

  setup(): void {
    console.log('CircularScene setup');
    this.resetSimulation();
    // Apply initial background color
    this.canvas.style.backgroundColor = this.params.bgColor;
  }

  resetSimulation(): void {
    this.phys = this.computeState(0);
    this.prevPhys = { ...this.phys };
    this.trail = [];
  }

  getControlConfig(): any[] {
    return [
      {
        type: 'range',
        key: 'omega',
        label: '角速度 (ω)',
        min: 0.1,
        max: 5,
        step: 0.1,
        description: '控制物体绕圆心转动的快慢，值越大转得越快。',
      },
      {
        type: 'range',
        key: 'radius',
        label: '半径 (R)',
        min: 50,
        max: 250,
        step: 10,
        description: '控制圆周运动的轨道大小。',
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
        description: '显示物体的瞬时速度矢量（橙色箭头），方向沿切线。',
      },
      {
        type: 'boolean',
        key: 'showAcc',
        label: '显示加速度',
        description: '显示物体的向心加速度矢量（蓝色箭头），方向指向圆心。',
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
        onChange: val => {
          this.canvas.style.backgroundColor = val;
          sessionStorage.setItem('sceneBgColor', val);
        },
      },
    ];
  }

  getLegendConfig(): any[] {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '物体' },
      { type: 'circle', color: THEME.colors.objects.orbit, label: '轨道' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度矢量' },
      { type: 'arrow', color: THEME.colors.vectors.acceleration, label: '加速度矢量' },
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
        label: '角度随时间变化',
        tex: '\\theta(t)=\\omega t',
        params: [
          { symbol: '\\theta', desc: '角度' },
          { symbol: '\\omega', desc: '角速度' },
          { symbol: 't', desc: '时间' },
        ],
      },
      {
        label: '位置矢量',
        tex: '\\vec{r}(t) = R(\\cos\\theta \\hat{i} + \\sin\\theta \\hat{j})',
        params: [
          { symbol: '\\vec{r}', desc: '位置' },
          { symbol: 'R', desc: '半径' },
          { symbol: '\\hat{i},\\hat{j}', desc: '单位向量' },
        ],
      },
    ];
  }

  getChartConfig(): any {
    return {
      vel: {
        label: '速度 (px/s)',
        series: ['vx', 'vy'],
        colors: THEME.colors.chart.series,
      },
      acc: {
        label: '加速度 (px/s²)',
        series: ['ax', 'ay'],
        colors: THEME.colors.chart.series,
      },
    };
  }

  getMonitorData(t: number): any {
    if (!this.phys) return null;
    return {
      t: t,
      vel: [this.phys.vx, this.phys.vy],
      acc: [this.phys.ax, this.phys.ay],
    };
  }

  getRecordingDuration(): number {
    const { omega } = this.params;
    // T = 2 * pi / omega
    const period = (2 * Math.PI) / omega;

    // 确保至少录制 2 秒
    let duration = period;
    while (duration < 2.0) {
      duration += period;
    }

    return duration;
  }

  update(dt: number, t: number): void {
    // 保存上一帧状态
    this.prevPhys = { ...this.phys };

    // 计算当前帧状态 (t + dt)
    this.phys = this.computeState(t + dt);

    // 更新轨迹 (使用最新状态)
    if (this.params.showTrail) {
      this.trail.push({ x: this.phys.x, y: this.phys.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    } else {
      this.trail.length = 0;
    }
  }

  computeState(t: number): PhysicsState {
    const { omega, radius } = this.params;
    const angle = omega * t;
    const cx = this.center.x;
    const cy = this.center.y;

    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    // 速度：切线方向 (-sin, cos)
    const vx = -omega * radius * Math.sin(angle);
    const vy = omega * radius * Math.cos(angle);

    // 加速度：向心方向 (-cos, -sin)
    const ax = -omega * omega * radius * Math.cos(angle);
    const ay = -omega * omega * radius * Math.sin(angle);

    return { x, y, vx, vy, ax, ay, angle, radius };
  }

  render(ctx: CanvasRenderingContext2D, alpha: number = 1.0): void {
    // 根据背景色选择反差最大的坐标系颜色
    const isLightBg = this.params.bgColor === THEME.colors.background.white;
    const axesColor = isLightBg ? '#333333' : '#cccccc';
    drawAxes(ctx, this.width, this.height, axesColor);

    if (!this.phys) return;

    // 插值计算渲染状态
    const st: RenderState = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      radius: 0,
    };
    // 线性插值位置和速度
    st.x = this.prevPhys.x * (1 - alpha) + this.phys.x * alpha;
    st.y = this.prevPhys.y * (1 - alpha) + this.phys.y * alpha;
    st.vx = this.prevPhys.vx * (1 - alpha) + this.phys.vx * alpha;
    st.vy = this.prevPhys.vy * (1 - alpha) + this.phys.vy * alpha;
    st.ax = this.prevPhys.ax * (1 - alpha) + this.phys.ax * alpha;
    st.ay = this.prevPhys.ay * (1 - alpha) + this.phys.ay * alpha;
    st.radius = this.phys.radius; // 半径不变

    // 绘制基础圆
    drawCircle(ctx, this.center.x, this.center.y, st.radius, THEME.colors.objects.orbit);

    // 绘制轨迹
    if (this.params.showTrail) {
      const trailColor = isLightBg
        ? THEME.colors.objects.trail.lightBg
        : THEME.colors.objects.trail.darkBg;
      drawTrail(ctx, this.trail, trailColor);
    }

    // 绘制点
    drawDot(ctx, st.x, st.y, THEME.colors.objects.ball.light, THEME.sizes.ballRadius);

    // 绘制向量
    const vScale = this.params.vectorScale;

    if (this.params.showVel) {
      const speed = Math.hypot(st.vx, st.vy) || 1;
      const scale = Math.min(0.25 * st.radius, 60) * (speed ? 1 : 0) * vScale;
      drawVector(
        ctx,
        st.x,
        st.y,
        (st.vx / speed) * scale,
        (st.vy / speed) * scale,
        THEME.colors.vectors.velocity,
        'v'
      );
    }

    if (this.params.showAcc) {
      const accel = Math.hypot(st.ax, st.ay) || 1;
      const scale = Math.min(0.15 * st.radius, 50) * (accel ? 1 : 0) * vScale;
      drawVector(
        ctx,
        st.x,
        st.y,
        (st.ax / accel) * scale,
        (st.ay / accel) * scale,
        THEME.colors.vectors.acceleration,
        'a'
      );
    }
  }
}
