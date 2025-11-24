import { Scene } from '../core/Scene.js';
import { drawDot, drawVector, drawLine } from '../utils/draw.js';
import { THEME } from '../config.js';
import { Physics } from '../utils/physics.js';
import { Integrator } from '../core/Integrator.js';
import description from '../content/SimplePendulum.md?raw';

/**
 * 场景名称: 单摆 (Simple Pendulum)
 * 物理现象: 模拟单摆在重力作用下的周期性摆动，展示摆角、角速度与受力的关系。
 * 初始设置: 摆长 length=2.0 m, 初始角度 theta0=30°, 质量 mass=1.0 kg, 重力 g=9.8 m/s².
 */
export class SimplePendulumScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      length: 2.0,    // m (摆长)
      theta0: 30,     // degrees (初始角度)
      mass: 1.0,      // kg
      g: 9.8,         // m/s^2 (重力加速度)
      damping: 0.5,   // 阻尼系数
      vectorScale: 1.0, // 矢量缩放系数
      showVel: true,
      showForce: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    // 物理状态
    this.phys = {
      theta: this.params.theta0 * Math.PI / 180, // 弧度
      omega: 0 // 角速度 rad/s
    };
    
    // 上一帧的物理状态 (用于插值)
    this.prevPhys = { ...this.phys };

    // 设置视口：1米 = 100像素
    this.viewport.setScale(100);
    // 视口中心在物理坐标 (0, -1) 处，这样 (0,0) 就在屏幕上方
    this.viewport.setCenter(0, -1.5);
  }

  getDescription() {
    return description;
  }

  resetSimulation() {
    this.phys.theta = this.params.theta0 * Math.PI / 180;
    this.phys.omega = 0;
    this.prevPhys = { ...this.phys };
    
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  setup() {
    console.log('SimplePendulumScene setup');
    this.resetSimulation();
    this.canvas.style.backgroundColor = this.params.bgColor;
    // Use clientWidth/Height (logical pixels) because the context is scaled by DPR
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resize(w, h) {
    super.resize(w, h);
    // 不再需要手动计算 pivotX/Y，由 Viewport 处理
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'length', label: '摆长 (L)', min: 0.5, max: 3.0, step: 0.1,
        description: '绳子的长度 (m)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'theta0', label: '初始角度', min: -90, max: 90, step: 5,
        description: '初始偏离竖直方向的角度 (度)。'
      },
      { 
        type: 'range', key: 'mass', label: '质量 (m)', min: 0.1, max: 5.0, step: 0.1,
        description: '摆球的质量 (kg)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'g', label: '重力 (g)', min: 1.0, max: 20.0, step: 0.1,
        description: '重力加速度 (m/s²)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'damping', label: '阻尼系数 (c)', min: 0.0, max: 2.0, step: 0.1,
        description: '空气阻力系数。', resetOnChange: false
      },
      { 
        type: 'range', key: 'vectorScale', label: '矢量缩放', min: 0.1, max: 3.0, step: 0.1,
        description: '调整矢量箭头的显示长度。', resetOnChange: false
      },
      { 
        type: 'boolean', key: 'showVel', label: '显示速度',
        description: '显示速度矢量 (橙色)。'
      },
      { 
        type: 'boolean', key: 'showForce', label: '显示受力',
        description: '显示重力(紫)和拉力(绿)。'
      },
      {
        type: 'select', key: 'bgColor', label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '灰色', value: THEME.colors.background.gray },
          { label: '白色', value: THEME.colors.background.white }
        ],
        onChange: (val) => { 
          this.canvas.style.backgroundColor = val; 
          sessionStorage.setItem('sceneBgColor', val);
        }
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '摆球' },
      { type: 'line', color: '#fff', label: '绳子' }, // 绳子颜色根据背景变，这里暂定白色
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度' },
      { type: 'arrow', color: THEME.colors.vectors.gravity, label: '重力' },
      { type: 'arrow', color: THEME.colors.vectors.force, label: '拉力' }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '运动方程', 
        tex: '\\frac{d^2\\theta}{dt^2} = -\\frac{g}{L}\\sin\\theta - \\frac{c}{m}\\frac{d\\theta}{dt}',
        params: [
          { symbol: '\\theta', desc: '摆角' },
          { symbol: 'L', desc: '摆长' },
          { symbol: 'c', desc: '阻尼' }
        ]
      },
      { 
        label: '周期 (小角度)', 
        tex: 'T \\approx 2\\pi\\sqrt{\\frac{L}{g}}',
        params: [
           { symbol: 'g', desc: '重力加速度' }
        ]
      }
    ];
  }

  getChartConfig() {
    return {
      vel: {
        label: '摆角 (deg)',
        series: ['角度'],
        colors: [THEME.colors.objects.referenceLine]
      },
      acc: {
        label: '角速度 (rad/s)',
        series: ['角速度'],
        colors: [THEME.colors.vectors.velocity]
      }
    };
  }

  getMonitorData(t) {
    const { theta, omega } = this.phys;
    // 转换为角度显示
    const thetaDeg = theta * 180 / Math.PI;
    
    return {
      t: t,
      vel: [thetaDeg],
      acc: [omega]
    };
  }

  getRecordingDuration() {
    const { length, g } = this.params;
    // T = 2 * pi * sqrt(L / g)
    const period = 2 * Math.PI * Math.sqrt(length / g);
    
    // 确保至少录制 2 秒
    let duration = period;
    while (duration < 2.0) {
        duration += period;
    }
    
    return duration;
  }

  update(dt, t) {
    const { length, mass, g, damping } = this.params;

    // 保存当前状态为上一帧状态
    this.prevPhys = { ...this.phys };

    // 定义导数函数 (state, t) => derivatives
    // state: { theta, omega }
    const derivatives = (state, time) => {
      const { theta, omega } = state;
      const alpha = Physics.pendulumAngularAcceleration(g, length, theta, damping, mass, omega);
      return {
        theta: omega, // d(theta)/dt = omega
        omega: alpha  // d(omega)/dt = alpha
      };
    };

    // 使用 RK4 积分器更新状态
    this.phys = Integrator.rk4(this.phys, t, dt, derivatives);

    // 更新用于显示的辅助状态
    // 注意：RK4 返回的是新状态，我们需要重新计算 alpha 用于显示或其他逻辑（如果需要）
    // 这里为了简单，我们只保留 theta 和 omega
    this.state = { ...this.phys };
  }

  render(ctx, alpha = 1.0) {
    const { length, mass, g, showVel, showForce, bgColor, vectorScale } = this.params;
    
    // 插值计算渲染状态
    // renderTheta = prevTheta * (1 - alpha) + currTheta * alpha
    const theta = this.prevPhys.theta * (1 - alpha) + this.phys.theta * alpha;
    const omega = this.prevPhys.omega * (1 - alpha) + this.phys.omega * alpha;

    const isLightBg = bgColor === THEME.colors.background.white;
    const mainColor = isLightBg ? '#333' : '#fff';

    // 物理坐标计算
    // 悬挂点在 (0, 0)
    const pivotPos = { x: 0, y: 0 };
    // 摆球位置 (注意：物理坐标系Y轴向上，所以向下是负的)
    // x = L * sin(theta)
    // y = -L * cos(theta)
    const ballPos = {
      x: length * Math.sin(theta),
      y: -length * Math.cos(theta)
    };

    // 转换为屏幕坐标
    const screenPivot = this.viewport.worldToScreen(pivotPos.x, pivotPos.y);
    const screenBall = this.viewport.worldToScreen(ballPos.x, ballPos.y);

    // 1. 绘制环境
    // 竖直参考线
    ctx.save();
    ctx.strokeStyle = isLightBg ? '#ccc' : '#444';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(screenPivot.x, screenPivot.y);
    // 参考线画长一点
    const screenRefEnd = this.viewport.worldToScreen(0, -length - 1.0);
    ctx.lineTo(screenRefEnd.x, screenRefEnd.y);
    ctx.stroke();
    ctx.restore();

    // 2. 绘制绳子
    drawLine(ctx, screenPivot.x, screenPivot.y, screenBall.x, screenBall.y, mainColor, 2);

    // 3. 绘制悬挂点
    drawDot(ctx, screenPivot.x, screenPivot.y, mainColor, 4);

    // 4. 绘制摆球
    const ballRadius = THEME.sizes.ballRadius;
    drawDot(ctx, screenBall.x, screenBall.y, THEME.colors.objects.ball.light, ballRadius);
    // 轮廓
    ctx.beginPath();
    ctx.arc(screenBall.x, screenBall.y, ballRadius, 0, Math.PI * 2);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. 绘制矢量
    // 基础缩放系数 (调整以适应新的物理单位)
    const vScale = 0.2 * vectorScale; 
    const fScale = 0.02 * vectorScale; // 力通常在 10N 左右，缩放后为 0.2m (20px)

    if (showVel) {
      // 速度 v = L * omega
      const vMag = length * omega;
      const vx = vMag * Math.cos(theta);
      const vy = vMag * Math.sin(theta); // 注意：物理坐标系Y轴向上，切线方向分量变化
      
      // 转换矢量末端点到屏幕坐标
      // 注意：drawVector 接受的是屏幕坐标的起点和屏幕坐标的偏移量
      // 但我们的 vx, vy 是物理单位。我们需要将物理长度转换为像素长度。
      // 且注意 Y 轴方向：物理 Y 向上，屏幕 Y 向下。
      // 所以屏幕上的 dy = - physical_dy * scale
      
      const screenVx = this.viewport.toPixels(vx);
      const screenVy = -this.viewport.toPixels(vy);

      drawVector(ctx, screenBall.x, screenBall.y, screenVx * vScale, screenVy * vScale, THEME.colors.vectors.velocity, 'v');
    }

    if (showForce) {
      // 重力 G = m * g (竖直向下，即物理Y轴负方向)
      const G = mass * g;
      const screenGy = -this.viewport.toPixels(-G); // 物理dy为负，屏幕dy为正

      drawVector(ctx, screenBall.x, screenBall.y, 0, screenGy * fScale, THEME.colors.vectors.gravity, 'mg');

      // 拉力 T
      const T_mag = Physics.pendulumTension(mass, g, theta, length, omega);
      
      // 方向：沿绳子指向悬挂点 (-sin(theta), cos(theta)) (物理坐标系)
      const Tx = -T_mag * Math.sin(theta);
      const Ty = T_mag * Math.cos(theta);

      const screenTx = this.viewport.toPixels(Tx);
      const screenTy = -this.viewport.toPixels(Ty);

      drawVector(ctx, screenBall.x, screenBall.y, screenTx * fScale, screenTy * fScale, THEME.colors.vectors.force, 'T');
    }
  }
}
