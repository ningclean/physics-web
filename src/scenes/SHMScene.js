import { Scene } from '../core/Scene.js';
import { drawAxes, drawDot, drawVector, drawTrail } from '../utils/draw.js';
import { THEME } from '../config.js';

/**
 * 场景名称: 简谐运动 (Simple Harmonic Motion)
 * 物理现象: 模拟理想弹簧振子的简谐振动，展示位移、速度、加速度随时间的正弦变化规律。
 * 初始设置: 角频率 omega=1.0 rad/s, 振幅 amplitude=150 px.
 */
export class SHMScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      omega: 1.0, // rad/s
      amplitude: 150, // px
      vectorScale: 1.0, // 矢量缩放系数
      showVel: true,
      showAcc: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    this.trail = [];
    this.maxTrailLength = 240;

    // 物理状态
    this.phys = this.computeState(0);
    this.prevPhys = { ...this.phys };
  }

  setup() {
    console.log('SHMScene setup');
    this.resetSimulation();
    // Apply initial background color
    this.canvas.style.backgroundColor = this.params.bgColor;
  }

  resetSimulation() {
    this.phys = this.computeState(0);
    this.prevPhys = { ...this.phys };
    this.trail = [];
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'omega', label: '角频率 (ω)', min: 0.1, max: 5, step: 0.1,
        description: '控制振动的快慢，值越大往复运动越频繁。'
      },
      { 
        type: 'range', key: 'amplitude', label: '振幅 (A)', min: 50, max: 250, step: 10,
        description: '控制物体偏离平衡位置的最大距离。'
      },
      { 
        type: 'range', key: 'vectorScale', label: '矢量缩放', min: 0.1, max: 3.0, step: 0.1,
        description: '调整矢量箭头的显示长度。', resetOnChange: false
      },
      { 
        type: 'boolean', key: 'showVel', label: '显示速度',
        description: '显示物体的瞬时速度矢量（橙色箭头）。'
      },
      { 
        type: 'boolean', key: 'showAcc', label: '显示加速度',
        description: '显示物体的回复加速度矢量（蓝色箭头），方向总是指向平衡位置。'
      },
      { 
        type: 'boolean', key: 'showTrail', label: '显示轨迹',
        description: '显示物体运动留下的路径。'
      },
      {
        type: 'select', key: 'bgColor', label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '灰色', value: THEME.colors.background.gray },
          { label: '白色', value: THEME.colors.background.white }
        ],
        description: '选择场景画布的背景颜色。',
        onChange: (val) => { 
          this.canvas.style.backgroundColor = val; 
          sessionStorage.setItem('sceneBgColor', val);
        }
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '物体' },
      { type: 'line', color: THEME.colors.objects.referenceLine, label: '运动范围', dashed: true },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度矢量' },
      { type: 'arrow', color: THEME.colors.vectors.acceleration, label: '加速度矢量' },
      { type: 'line', color: this.params.bgColor === THEME.colors.background.white ? THEME.colors.objects.trail.lightBg : THEME.colors.objects.trail.darkBg, label: '轨迹' }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '位移', 
        tex: 'x(t) = A \\cos(\\omega t)',
        params: [
          { symbol: 'x', desc: '位移' },
          { symbol: 'A', desc: '振幅' },
          { symbol: '\\omega', desc: '角频率' },
          { symbol: 't', desc: '时间' }
        ]
      },
      { 
        label: '速度', 
        tex: 'v_x(t) = -A\\omega \\sin(\\omega t)',
        params: [
          { symbol: 'v_x', desc: '速度' }
        ]
      },
      { 
        label: '加速度', 
        tex: 'a_x(t) = -A\\omega^2 \\cos(\\omega t)',
        params: [
          { symbol: 'a_x', desc: '加速度' }
        ]
      }
    ];
  }

  getChartConfig() {
    return {
      vel: {
        label: '速度 (px/s)',
        series: ['速度'],
        colors: THEME.colors.chart.series
      },
      acc: {
        label: '加速度 (px/s²)',
        series: ['加速度'],
        colors: THEME.colors.chart.series
      }
    };
  }

  getMonitorData(t) {
    if (!this.phys) return null;
    return {
      t: t,
      vel: [this.phys.vx],
      acc: [this.phys.ax]
    };
  }

  getRecordingDuration() {
    const { omega } = this.params;
    // T = 2 * pi / omega
    const period = 2 * Math.PI / omega;
    
    // 确保至少录制 2 秒
    let duration = period;
    while (duration < 2.0) {
        duration += period;
    }
    
    return duration;
  }

  update(dt, t) {
    // 保存上一帧状态
    this.prevPhys = { ...this.phys };
    
    // 计算当前帧状态 (t + dt)
    this.phys = this.computeState(t + dt);
    
    // 更新轨迹
    if (this.params.showTrail) {
      this.trail.push({ x: this.phys.x, y: this.phys.y });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    } else {
      this.trail.length = 0;
    }
  }

  computeState(t) {
    const { omega, amplitude } = this.params;
    const cx = this.center.x;
    const cy = this.center.y;
    
    // 沿 X 轴的简谐运动
    const xOffset = amplitude * Math.cos(omega * t);
    const x = cx + xOffset;
    const y = cy;
    
    // 速度：-Aω sin(ωt)
    const vx = -amplitude * omega * Math.sin(omega * t);
    const vy = 0;
    
    // 加速度：-Aω² cos(ωt)
    const ax = -amplitude * omega * omega * Math.cos(omega * t);
    const ay = 0;

    return { x, y, vx, vy, ax, ay, amplitude };
  }

  render(ctx, alpha = 1.0) {
    // 根据背景色选择反差最大的坐标系颜色
    const isLightBg = this.params.bgColor === THEME.colors.background.white;
    const axesColor = isLightBg ? '#333333' : '#cccccc';
    drawAxes(ctx, this.width, this.height, axesColor);
    
    if (!this.phys) return;

    // 插值计算渲染状态
    const st = {};
    st.x = this.prevPhys.x * (1 - alpha) + this.phys.x * alpha;
    st.y = this.prevPhys.y * (1 - alpha) + this.phys.y * alpha;
    st.vx = this.prevPhys.vx * (1 - alpha) + this.phys.vx * alpha;
    st.vy = this.prevPhys.vy * (1 - alpha) + this.phys.vy * alpha;
    st.ax = this.prevPhys.ax * (1 - alpha) + this.phys.ax * alpha;
    st.ay = this.prevPhys.ay * (1 - alpha) + this.phys.ay * alpha;
    st.amplitude = this.phys.amplitude;

    // 绘制参考线（运动范围）
    ctx.save();
    ctx.strokeStyle = THEME.colors.objects.referenceLine;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(this.center.x - st.amplitude, this.center.y);
    ctx.lineTo(this.center.x + st.amplitude, this.center.y);
    ctx.stroke();
    ctx.restore();

    // 绘制轨迹
    if (this.params.showTrail) {
      const trailColor = isLightBg ? THEME.colors.objects.trail.lightBg : THEME.colors.objects.trail.darkBg;
      drawTrail(ctx, this.trail, trailColor);
    }

    // 绘制点
    drawDot(ctx, st.x, st.y, THEME.colors.objects.ball.light, THEME.sizes.ballRadius);

    // 绘制向量
    const vScale = this.params.vectorScale;

    if (this.params.showVel) {
      const speed = Math.abs(st.vx) || 1;
      const scale = Math.min(0.25 * st.amplitude, 60) * (speed ? 1 : 0) * vScale;
      // 归一化以绘制方向，但相对于最大值按幅度缩放
      // 实际上，为了可见性，我们只使用一致的比例因子
      // 或者使用与 CircularScene 相同的逻辑以保持一致性
      drawVector(ctx, st.x, st.y, (st.vx / speed) * scale, 0, THEME.colors.vectors.velocity, 'v');
    }

    if (this.params.showAcc) {
      const accel = Math.abs(st.ax) || 1;
      const scale = Math.min(0.15 * st.amplitude, 50) * (accel ? 1 : 0) * vScale;
      drawVector(ctx, st.x, st.y, (st.ax / accel) * scale, 0, THEME.colors.vectors.acceleration, 'a');
    }
  }
}
