import { Scene } from '../core/Scene.js';
import { drawDot, drawVector, drawLine } from '../utils/draw.js';
import { THEME } from '../config.js';
import { Physics } from '../utils/physics.js';
import description from '../content/PlanetaryMotion.md?raw';

/**
 * 场景名称: 天体运动 (Planetary Motion)
 * 物理现象: 模拟行星绕恒星的运动，展示万有引力定律与开普勒定律。
 * 初始设置: 恒星质量 M=500, 行星初速度 v0=5.0, 初始距离 r0=200, 引力常数 G=1.0.
 */
export class PlanetaryMotionScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      M: 500,         // 恒星质量
      v0: 5.0,        // 行星初速度 (切向)
      r0: 200,        // 初始距离
      G: 1.0,         // 引力常数
      vectorScale: 1.0,
      showVel: true,
      showForce: true,
      showTrail: true,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    // 物理状态
    this.planet = {
      m: 1, // 行星质量 (不影响轨道形状，只影响受力大小，设为1简化)
      pos: { x: 0, y: 0 },
      vel: { x: 0, y: 0 }
    };
    
    this.star = {
      pos: { x: 0, y: 0 }, // 恒星固定在中心
      radius: 20,
      color: '#ffcc00'
    };
    
    this.trail = [];
    this.time = 0;
    
    // 视口设置：1单位距离 = 1像素 (或者根据需要缩放)
    // 这里直接用像素单位模拟比较直观
    this.viewport.setScale(1.0); 
    this.viewport.setCenter(0, 0);
  }

  getDescription() {
    return description;
  }

  setup() {
    this.resetSimulation();
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resetSimulation() {
    const { r0, v0 } = this.params;
    
    // 初始位置：在恒星右侧 r0 处
    this.planet.pos = { x: r0, y: 0 };
    
    // 初始速度：垂直向上 (切向)
    this.planet.vel = { x: 0, y: v0 };
    
    this.trail = [];
    this.time = 0;
    
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'M', label: '恒星质量 (M)', min: 100, max: 1000, step: 50,
        description: '中心天体的质量。', resetOnChange: false
      },
      { 
        type: 'range', key: 'v0', label: '初速度 (v0)', min: 0, max: 10, step: 0.1,
        description: '行星的初始切向速度。', resetOnChange: true
      },
      { 
        type: 'range', key: 'r0', label: '初始距离 (r)', min: 100, max: 400, step: 10,
        description: '行星与恒星的初始距离。', resetOnChange: true
      },
      { 
        type: 'range', key: 'G', label: '引力常数 (G)', min: 0.1, max: 5.0, step: 0.1,
        description: '模拟的万有引力常数。', resetOnChange: false
      },
      { 
        type: 'range', key: 'vectorScale', label: '矢量缩放', min: 0.1, max: 3.0, step: 0.1,
        description: '调整矢量箭头的显示长度。', resetOnChange: false
      },
      { 
        type: 'boolean', key: 'showVel', label: '显示速度',
        description: '显示速度矢量。'
      },
      { 
        type: 'boolean', key: 'showForce', label: '显示引力',
        description: '显示万有引力矢量。'
      },
      { 
        type: 'boolean', key: 'showTrail', label: '显示轨迹',
        description: '显示行星运行轨道。'
      },
      {
        type: 'select', key: 'bgColor', label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '深蓝', value: '#000022' },
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
      { type: 'dot', color: '#ffcc00', label: '恒星' },
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '行星' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度' },
      { type: 'arrow', color: '#d28bff', label: '引力' }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '万有引力', 
        tex: 'F = G \\frac{Mm}{r^2}',
        params: []
      },
      { 
        label: '机械能', 
        tex: 'E = \\frac{1}{2}mv^2 - G\\frac{Mm}{r}',
        params: []
      }
    ];
  }

  getChartConfig() {
    return {
      vel: {
        label: '距离 r (px)',
        series: ['Distance'],
        colors: [THEME.colors.objects.ball.light]
      },
      acc: {
        label: '速度 v (px/s)',
        series: ['Velocity'],
        colors: [THEME.colors.vectors.velocity]
      }
    };
  }

  getMonitorData(t) {
    const dx = this.planet.pos.x - this.star.pos.x;
    const dy = this.planet.pos.y - this.star.pos.y;
    const r = Math.sqrt(dx*dx + dy*dy);
    const v = Math.sqrt(this.planet.vel.x**2 + this.planet.vel.y**2);
    
    return {
      t: t,
      vel: [r],
      acc: [v]
    };
  }

  getRecordingDuration() {
    const { M, G, r0, v0 } = this.params;
    // 计算轨道周期
    // 1. 计算总能量 E = v^2/2 - GM/r
    const E = (v0 * v0) / 2 - (G * M) / r0;
    
    if (E >= 0) {
        // 双曲线或抛物线轨道，非周期性
        return 10.0; 
    }
    
    // 2. 计算半长轴 a = -GM / (2E)
    const a = -(G * M) / (2 * E);
    
    // 3. 开普勒第三定律 T = 2 * pi * sqrt(a^3 / (GM))
    const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * M));
    
    // 确保至少录制 2 秒
    let duration = period;
    while (duration < 2.0) {
        duration += period;
    }
    
    return duration;
  }

  update(dt, t) {
    const { M, G } = this.params;
    const { m, pos, vel } = this.planet;
    
    // 简单的 Euler 积分或者 Verlet 积分
    // 为了轨道稳定性，最好用 Verlet 或 RK4。这里用半隐式 Euler (Symplectic Euler) 足够稳定
    
    // 1. 计算引力
    const dx = pos.x - this.star.pos.x;
    const dy = pos.y - this.star.pos.y;
    const r2 = dx*dx + dy*dy;
    const r = Math.sqrt(r2);
    
    // F = G * M * m / r^2
    const F = Physics.gravitationalForce(G, M, m, r);
    
    // 分解力
    // Fx = F * (-dx / r)
    // Fy = F * (-dy / r)
    const Fx = -F * (dx / r);
    const Fy = -F * (dy / r);
    
    // a = F / m
    const ax = Fx / m;
    const ay = Fy / m;
    
    // 2. 更新速度 (半隐式 Euler: 先更新速度，再用新速度更新位置)
    vel.x += ax * dt;
    vel.y += ay * dt;
    
    // 3. 更新位置
    pos.x += vel.x * dt;
    pos.y += vel.y * dt;
    
    // 4. 记录轨迹
    this.time += dt;
    if (this.params.showTrail) {
        // 限制采样率
        if (this.trail.length === 0 || Math.abs(this.trail[this.trail.length-1].t - t) > 0.1) {
            this.trail.push({ x: pos.x, y: pos.y, t: t });
            // 限制轨迹长度，防止内存溢出，但要足够长以显示闭合轨道
            if (this.trail.length > 2000) this.trail.shift();
        }
    }
  }

  render(ctx) {
    const { vectorScale, showVel, showForce, showTrail } = this.params;
    
    // 绘制恒星
    const screenStar = this.viewport.worldToScreen(this.star.pos.x, this.star.pos.y);
    
    // 简单的光晕效果
    const gradient = ctx.createRadialGradient(screenStar.x, screenStar.y, this.star.radius * 0.2, screenStar.x, screenStar.y, this.star.radius * 2);
    gradient.addColorStop(0, this.star.color);
    gradient.addColorStop(1, 'rgba(255, 204, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenStar.x, screenStar.y, this.star.radius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 恒星本体
    drawDot(ctx, screenStar.x, screenStar.y, this.star.color, this.star.radius);

    // 绘制轨迹
    if (showTrail && this.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        const start = this.viewport.worldToScreen(this.trail[0].x, this.trail[0].y);
        ctx.moveTo(start.x, start.y);
        for(let i=1; i<this.trail.length; i++) {
            const p = this.viewport.worldToScreen(this.trail[i].x, this.trail[i].y);
            ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
    }

    // 绘制行星
    const screenPlanet = this.viewport.worldToScreen(this.planet.pos.x, this.planet.pos.y);
    drawDot(ctx, screenPlanet.x, screenPlanet.y, THEME.colors.objects.ball.light, 6);
    
    // 绘制矢量
    if (showVel) {
        const vScale = 5.0 * vectorScale; // 速度通常较小，放大显示
        const screenVx = this.planet.vel.x * vScale; // 这里不需要 viewport.toPixels 因为我们没有严格定义米/像素
        const screenVy = -this.planet.vel.y * vScale; // Y轴反转
        drawVector(ctx, screenPlanet.x, screenPlanet.y, screenVx, screenVy, THEME.colors.vectors.velocity);
    }
    
    if (showForce) {
        // 计算当前引力用于显示
        const dx = this.planet.pos.x - this.star.pos.x;
        const dy = this.planet.pos.y - this.star.pos.y;
        const r = Math.sqrt(dx*dx + dy*dy);
        const F = Physics.gravitationalForce(this.params.G, this.params.M, this.planet.m, r);
        const Fx = -F * (dx / r);
        const Fy = -F * (dy / r);
        
        const fScale = 200.0 * vectorScale; // 力很小，大幅放大
        const screenFx = Fx * fScale;
        const screenFy = -Fy * fScale;
        
        drawVector(ctx, screenPlanet.x, screenPlanet.y, screenFx, screenFy, '#d28bff');
    }
  }
}
