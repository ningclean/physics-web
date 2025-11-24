import { Scene } from '../core/Scene.js';
import { drawDot, drawVector, drawSpring } from '../utils/draw.js';
import { THEME } from '../config.js';
import { Physics } from '../utils/physics.js';
import { Integrator } from '../core/Integrator.js';

/**
 * 场景名称: 弹簧振子 (Spring Oscillator)
 * 物理现象: 模拟弹簧振子的阻尼振动，支持水平和竖直两种模式，展示回复力、阻尼力与运动的关系。
 * 初始设置: 模式 mode='horizontal', 质量 mass=1.0 kg, 劲度系数 k=20 N/m, 阻尼 c=0.5, 振幅 A=150 px.
 */
export class SpringOscillatorScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      mode: 'horizontal', // 'horizontal' | 'vertical'
      mass: 1.0,      // kg
      stiffness: 20,  // N/m
      damping: 0.5,   // Ns/m (阻尼系数)
      amplitude: 150, // px
      g: 500,         // px/s^2 (重力加速度，为了视觉效果设大一点)
      vectorScale: 1.0, // 矢量缩放系数
      showForce: true,
      showFriction: true, // 显示摩擦力/阻尼力
      showVel: true,
      showGravity: true,  // 显示重力
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    // 物理状态 (用于数值积分)
    this.phys = {
      x: this.params.amplitude,
      v: 0
    };
    
    // 上一帧的物理状态 (用于插值)
    this.prevPhys = { ...this.phys };

    // 布局参数
    this.wallX = 50;
    this.ceilingY = 50;
    this.equilibriumX = 0; // 在 resize 中计算
    this.equilibriumY = 0; // 在 resize 中计算
    this.groundY = 0;      // 在 resize 中计算
  }

  resetSimulation() {
    // 重置物理状态
    this.phys.x = this.params.amplitude;
    this.phys.v = 0;
    this.prevPhys = { ...this.phys };
    
    // 清除图表数据
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  setup() {
    console.log('SpringOscillatorScene setup');
    this.resetSimulation();
    // Apply initial background color
    this.canvas.style.backgroundColor = this.params.bgColor;
    // Use clientWidth/Height (logical pixels) because the context is scaled by DPR
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resize(w, h) {
    super.resize(w, h);
    this.wallX = w * 0.1;
    this.ceilingY = h * 0.1;
    this.equilibriumX = w * 0.5; // 水平模式平衡位置
    this.equilibriumY = h * 0.4; // 竖直模式平衡位置 (稍微靠上一点，留出振动空间)
    this.groundY = h * 0.6;      // 水平模式地面位置
  }

  getControlConfig() {
    return [
      {
        type: 'select', key: 'mode', label: '模式',
        options: [
          { label: '水平振子', value: 'horizontal' },
          { label: '竖直振子', value: 'vertical' }
        ],
        onChange: () => {
          this.resetSimulation();
          // 重新 setup 以更新公式显示
          // 注意：这里我们不能直接调用 setup 来更新公式，因为 setup 不再负责 UI。
          // 我们需要一种机制来通知 main.js 更新公式。
          // 简单的做法是：重新加载场景。
          // 或者，我们可以让 main.js 监听参数变化。
          // 鉴于目前的架构，我们可以通过 window.engine.loadScene(this) 来重新加载自己，
          // 但这会创建新的实例。
          // 更好的方式是：在 main.js 中，当参数变化导致需要更新 UI 结构时，重新获取配置。
          // 但目前的 ControlPanel 实现比较简单。
          // 让我们暂时保持简单：如果模式改变，我们手动更新公式显示（如果能访问到的话），
          // 或者接受公式显示可能不会立即更新的限制。
          // 实际上，我们可以通过重新加载场景来解决：
          if (window.engine) window.engine.loadScene(this);
        }
      },
      { 
        type: 'range', key: 'mass', label: '质量 (m)', min: 0.5, max: 5.0, step: 0.1,
        description: '小球的质量 (kg)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'stiffness', label: '劲度系数 (k)', min: 10, max: 100, step: 5,
        description: '弹簧的硬度 (N/m)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'damping', label: '阻尼系数 (c)', min: 0.0, max: 5.0, step: 0.1,
        description: '空气阻力或摩擦力系数。', resetOnChange: false
      },
      { 
        type: 'range', key: 'amplitude', label: '振幅 (A)', min: 50, max: 250, step: 10,
        description: '初始拉伸距离 (px)。'
      },
      { 
        type: 'range', key: 'g', label: '重力 (g)', min: 100, max: 1000, step: 50,
        description: '重力加速度 (仅竖直模式)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'vectorScale', label: '矢量缩放', min: 0.1, max: 3.0, step: 0.1,
        description: '调整矢量箭头的显示长度。', resetOnChange: false
      },
      { 
        type: 'boolean', key: 'showForce', label: '显示回复力',
        description: '显示弹簧弹力 (绿色)。'
      },
      { 
        type: 'boolean', key: 'showFriction', label: '显示阻尼力',
        description: '显示摩擦力/阻尼力 (红色)。'
      },
      { 
        type: 'boolean', key: 'showVel', label: '显示速度',
        description: '显示速度矢量 (橙色)。'
      },
      { 
        type: 'boolean', key: 'showGravity', label: '显示重力',
        description: '显示重力矢量 (紫色)。'
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
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '小球' },
      { type: 'line', color: THEME.colors.objects.spring, label: '弹簧' },
      { type: 'arrow', color: THEME.colors.vectors.force, label: '回复力' },
      { type: 'arrow', color: THEME.colors.vectors.damping, label: '阻尼力' },
      { type: 'arrow', color: THEME.colors.vectors.gravity, label: '重力' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度' }
    ];
  }

  getFormulaConfig() {
    const formulas = [
      { 
        label: '动力学方程', 
        tex: 'F_{net} = -kx - cv = ma',
        params: [
          { symbol: 'k', desc: '劲度系数' },
          { symbol: 'c', desc: '阻尼系数' },
          { symbol: 'v', desc: '速度' }
        ]
      },
      { 
        label: '固有角频率', 
        tex: '\\omega_n = \\sqrt{\\frac{k}{m}}',
        params: [
           { symbol: 'm', desc: '质量' }
        ]
      }
    ];

    if (this.params.mode === 'vertical') {
      formulas.push({
        label: '平衡位置伸长量',
        tex: '\\Delta l = \\frac{mg}{k}',
        params: [
          { symbol: 'g', desc: '重力加速度' }
        ]
      });
    }
    return formulas;
  }

  getChartConfig() {
    return {
      vel: {
        label: '位移 (px)',
        series: ['位移'],
        colors: [THEME.colors.objects.referenceLine]
      },
      acc: {
        label: '速度 (px/s)',
        series: ['速度'],
        colors: [THEME.colors.vectors.velocity]
      }
    };
  }

  getMonitorData(t) {
    const { x, v } = this.phys;
    // 当速度和位移都非常小时，停止更新图表
    const isResting = Math.abs(x) < 0.1 && Math.abs(v) < 0.1;
    
    if (isResting) return null;

    return {
      t: t,
      vel: [x],
      acc: [v]
    };
  }

  getRecordingDuration() {
    const { mass, stiffness } = this.params;
    // T = 2 * pi * sqrt(m / k)
    const period = 2 * Math.PI * Math.sqrt(mass / stiffness);
    
    // 确保至少录制 2 秒
    let duration = period;
    while (duration < 2.0) {
        duration += period;
    }
    
    return duration;
  }

  update(dt, t) {
    const { mass, stiffness, damping } = this.params;
    
    // 保存当前状态为上一帧状态
    this.prevPhys = { ...this.phys };

    // 定义受力函数 (用于积分器)
    const forceFn = (pos, vel, t) => {
        // F_spring = -k * x
        const F_spring = Physics.springForce(stiffness, pos);
        // F_damping = -c * v
        const F_damping = Physics.dampingForce(damping, vel);
        return F_spring + F_damping;
    };
    
    // 定义加速度函数 (用于半隐式欧拉)
    const accelerationFunc = (pos, vel, t) => {
        const force = forceFn(pos, vel, t);
        return Physics.acceleration(force, mass);
    };

    // 使用半隐式欧拉积分器更新状态
    // 注意：this.phys 中的 x 和 v 是标量
    const newState = Integrator.semiImplicitEuler(this.phys.x, this.phys.v, t, dt, accelerationFunc);

    // 更新物理状态
    this.phys.x = newState.pos;
    this.phys.v = newState.vel;

    // 为了渲染和调试，重新计算力 (或者让积分器返回力，但标准接口不返回)
    const F_spring = Physics.springForce(stiffness, this.phys.x);
    const F_damping = Physics.dampingForce(damping, this.phys.v);
    const F_net = F_spring + F_damping;
    const a = Physics.acceleration(F_net, mass);

    // 固有角频率 (用于参考)
    const omega = Physics.springNaturalFrequency(stiffness, mass);

    this.state = { x: this.phys.x, v: this.phys.v, a, F_spring, F_damping, F_net, omega };
  }

  render(ctx, alpha = 1.0) {
    const { width, height } = this;
    const { wallX, ceilingY, equilibriumX, equilibriumY, groundY } = this;
    const { mode, mass, stiffness, damping, g, showForce, showFriction, showVel, showGravity, bgColor } = this.params;
    
    // 插值计算渲染状态
    const x = this.prevPhys.x * (1 - alpha) + this.phys.x * alpha;
    const v = this.prevPhys.v * (1 - alpha) + this.phys.v * alpha;

    // 更新 state 用于渲染函数内部使用 (虽然有点 hacky，但避免了修改所有 render 方法签名)
    // 注意：这里我们只更新了 x 和 v，其他派生量 (如力) 仍然是 update 中计算的最新值。
    // 对于视觉效果来说，力的微小差异通常不可见，但位置的平滑至关重要。
    if (this.state) {
        this.state.x = x;
        this.state.v = v;
        // Recalculate forces for visual consistency
        this.state.F_spring = Physics.springForce(stiffness, x);
        this.state.F_damping = Physics.dampingForce(damping, v);
    }

    // 确定颜色
    const isLightBg = bgColor === THEME.colors.background.white;
    const mainColor = isLightBg ? '#333' : '#fff';
    
    if (mode === 'horizontal') {
      this.renderHorizontal(ctx, isLightBg, mainColor);
    } else {
      this.renderVertical(ctx, isLightBg, mainColor);
    }
  }

  renderHorizontal(ctx, isLightBg, mainColor) {
    const { width, height } = this;
    const { wallX, equilibriumX, groundY } = this;
    const { showForce, showFriction, showVel } = this.params;

    // 1. 绘制背景网格/地面
    // 地面线
    ctx.beginPath();
    ctx.strokeStyle = isLightBg ? '#999' : '#666';
    ctx.lineWidth = 2;
    ctx.moveTo(0, groundY + 10); // 小球半径约10，地面在球下方
    ctx.lineTo(width, groundY + 10);
    ctx.stroke();
    
    // 墙壁
    ctx.fillStyle = isLightBg ? '#ccc' : '#444';
    ctx.fillRect(0, groundY - 100, wallX, 200);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, groundY - 100);
    ctx.lineTo(wallX, groundY + 100);
    ctx.stroke();
    
    // 墙壁阴影线
    ctx.beginPath();
    ctx.strokeStyle = isLightBg ? '#999' : '#666';
    ctx.lineWidth = 1;
    for (let y = groundY - 100; y < groundY + 100; y += 20) {
        ctx.moveTo(wallX, y);
        ctx.lineTo(wallX - 15, y + 15);
    }
    ctx.stroke();

    // 平衡位置参考线
    ctx.save();
    ctx.strokeStyle = THEME.colors.objects.referenceLine;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX, groundY - 80);
    ctx.lineTo(equilibriumX, groundY + 80);
    ctx.stroke();
    // 标注 "0"
    ctx.fillStyle = THEME.colors.objects.referenceLine;
    ctx.font = THEME.fonts.label;
    ctx.textAlign = 'center';
    ctx.fillText('平衡位置', equilibriumX, groundY + 95);
    ctx.restore();

    if (!this.state) return;
    
    const { x, v, F_spring, F_damping } = this.state;
    const ballX = equilibriumX + x;
    const ballY = groundY;
    const ballRadius = THEME.sizes.ballRadius;

    // 2. 绘制弹簧
    drawSpring(ctx, wallX, groundY, ballX - ballRadius, groundY, 20, 10, mainColor);

    // 3. 绘制小球
    drawDot(ctx, ballX, ballY, THEME.colors.objects.ball.light, ballRadius);
    // 小球轮廓
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isLightBg ? '#333' : '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. 绘制矢量
    const vScale = THEME.scales.velocity * this.params.vectorScale;
    // 增大力的缩放系数，使其更易见
    const fScale = 0.05 * this.params.vectorScale;

    // 速度 (画在球上方)
    if (showVel) {
      drawVector(ctx, ballX, ballY - ballRadius - 10, v * vScale, 0, THEME.colors.vectors.velocity, 'v');
    }

    // 回复力 (画在球下方)
    if (showForce) {
      drawVector(ctx, ballX, ballY + ballRadius + 10, F_spring * fScale, 0, THEME.colors.vectors.force, 'F_s');
    }

    // 阻尼力 (画在球下方，与回复力错开)
    if (showFriction) {
      const offset = showForce ? 25 : 10;
      drawVector(ctx, ballX, ballY + ballRadius + offset, F_damping * fScale, 0, THEME.colors.vectors.damping, 'F_d');
    }
  }

  renderVertical(ctx, isLightBg, mainColor) {
    const { width, height } = this;
    const { ceilingY, equilibriumY, equilibriumX } = this; // equilibriumX 在这里作为水平中心
    const { mass, stiffness, g, showForce, showFriction, showVel, showGravity } = this.params;

    // 1. 绘制天花板
    ctx.fillStyle = isLightBg ? '#ccc' : '#444';
    ctx.fillRect(equilibriumX - 100, 0, 200, ceilingY);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(equilibriumX - 100, ceilingY);
    ctx.lineTo(equilibriumX + 100, ceilingY);
    ctx.stroke();
    
    // 天花板阴影线
    ctx.beginPath();
    ctx.strokeStyle = isLightBg ? '#999' : '#666';
    ctx.lineWidth = 1;
    for (let x = equilibriumX - 100; x < equilibriumX + 100; x += 20) {
        ctx.moveTo(x, ceilingY);
        ctx.lineTo(x + 15, ceilingY - 15);
    }
    ctx.stroke();

    // 计算静止伸长量 delta_l = mg / k
    // 注意：这里的 g 是像素单位的重力加速度
    const deltaL = Physics.springStaticExtension(mass, g, stiffness);
    
    // 弹簧原长位置 (未挂重物时)
    const naturalLengthY = equilibriumY - deltaL;

    // 平衡位置参考线
    ctx.save();
    ctx.strokeStyle = THEME.colors.objects.referenceLine;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX - 80, equilibriumY);
    ctx.lineTo(equilibriumX + 80, equilibriumY);
    ctx.stroke();
    // 标注 "0"
    ctx.fillStyle = THEME.colors.objects.referenceLine;
    ctx.font = THEME.fonts.label;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('平衡位置', equilibriumX - 90, equilibriumY);
    ctx.restore();

    // 原长参考线 (可选，用灰色虚线)
    ctx.save();
    ctx.strokeStyle = isLightBg ? '#aaa' : '#555';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(equilibriumX - 50, naturalLengthY);
    ctx.lineTo(equilibriumX + 50, naturalLengthY);
    ctx.stroke();
    ctx.fillStyle = isLightBg ? '#aaa' : '#555';
    ctx.font = '10px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText('原长', equilibriumX - 60, naturalLengthY);
    ctx.restore();

    if (!this.state) return;
    
    const { x, v, F_spring, F_damping } = this.state;
    // 竖直模式下，x 是垂直位移 (向下为正)
    const ballX = equilibriumX;
    const ballY = equilibriumY + x;
    const ballRadius = THEME.sizes.ballRadius;

    // 2. 绘制弹簧
    // 从天花板中心到小球顶部
    drawSpring(ctx, equilibriumX, ceilingY, ballX, ballY - ballRadius, 20, 10, mainColor);

    // 3. 绘制小球
    drawDot(ctx, ballX, ballY, THEME.colors.objects.ball.light, ballRadius);
    // 小球轮廓
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isLightBg ? '#333' : '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. 绘制矢量
    const vScale = THEME.scales.velocity * this.params.vectorScale;
    // 调整基础力缩放系数：
    // 增大系数以避免矢量过短
    const fScale = 0.05 * this.params.vectorScale;

    // 速度 (画在右侧)
    if (showVel) {
      // 竖直速度，x分量为0，y分量为v
      drawVector(ctx, ballX + ballRadius + 5, ballY, 0, v * vScale, THEME.colors.vectors.velocity, 'v');
    }

    // 回复力 (弹力 + 阻尼力 的合力? 不，通常分开画)
    // 这里 F_spring 是 -kx，即偏离平衡位置的回复力。
    // 但实际上弹簧的总弹力是 F_total_spring = -k(x + deltaL) = -kx - mg。方向向上。
    // 我们的物理模型简化了，只计算了净力。
    // 为了视觉准确，我们应该画出总弹力吗？还是只画回复力？
    // 用户通常理解的“回复力”是指指向平衡位置的力。
    // 但如果显示重力，那么对应的应该显示总弹力，否则合力对不上。
    // 让我们画出总弹力 F_total_spring 和 重力 G。
    // F_total_spring = -k * (x + deltaL) = -k*x - mg.
    // 方向：如果 x>0 (在平衡位置下方), F_total_spring 向下更小? 不，x向下为正。
    // 弹簧伸长量 L = deltaL + x.
    // 弹力 F = -k * L = -k(deltaL + x) = -mg - kx. (负号表示向上)
    
    const G = mass * g;
    const F_total_spring = -G + F_spring; // F_spring = -kx

    if (showForce) {
      // 画总弹力 (绿色)
      // 画在球上方
      drawVector(ctx, ballX, ballY - ballRadius, 0, F_total_spring * fScale, THEME.colors.vectors.force, 'F_s');
    }

    if (showGravity) {
      // 画重力 (紫色)
      // 画在球心
      drawVector(ctx, ballX, ballY, 0, G * fScale, THEME.colors.vectors.gravity, 'G');
    }

    // 阻尼力
    if (showFriction) {
      // 画在左侧
      drawVector(ctx, ballX - ballRadius - 5, ballY, 0, F_damping * fScale, THEME.colors.vectors.damping, 'F_d');
    }
  }
}
