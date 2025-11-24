import { Scene } from '../core/Scene.js';
import { drawDot, drawVector, drawLine, drawCircle } from '../utils/draw.js';
import { THEME } from '../config.js';
import description from '../content/ElasticCollision.md?raw';

/**
 * 场景名称: 弹性碰撞 (Elastic Collision)
 * 物理现象: 模拟两个小球在二维平面内的完全弹性碰撞，验证动量守恒与动能守恒定律。
 * 初始设置: m1=2.0 kg, m2=1.0 kg, v1=5.0 m/s, v2=0.0 m/s, 碰撞偏置 b=0.5 m.
 */
export class ElasticCollisionScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      m1: 2.0,        // kg
      m2: 1.0,        // kg
      v1: 5.0,        // m/s
      v2: 0.0,        // m/s
      b: 0.5,         // m (Impact Parameter) - 注意单位，这里用米
      e: 1.0,         // Restitution
      vectorScale: 1.0,
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    // 状态
    this.balls = [];
    this.time = 0;
    
    // 视口设置：1米 = 50像素
    this.viewport.setScale(50);
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
    const { m1, m2, v1, v2, b } = this.params;
    
    // 半径根据质量设定 (假设密度相同，或者只是视觉上的大小)
    // r ~ m^(1/3) ? 或者直接简单设定
    const r1 = 0.3 * Math.pow(m1, 1/3);
    const r2 = 0.3 * Math.pow(m2, 1/3);
    
    // 初始位置
    // Ball 2 在原点 (0,0)
    // Ball 1 在左侧 (-8, b)
    
    this.balls = [
      {
        id: 1,
        m: m1,
        r: r1,
        pos: { x: -8, y: b },
        vel: { x: v1, y: 0 },
        color: THEME.colors.objects.ball.light,
        trail: []
      },
      {
        id: 2,
        m: m2,
        r: r2,
        pos: { x: 0, y: 0 },
        vel: { x: -v2, y: 0 }, // 假设 v2 是向左的速度大小
        color: '#5cd65c', // 绿色
        trail: []
      }
    ];
    
    this.time = 0;
    
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'm1', label: '质量 1 (红)', min: 0.5, max: 10.0, step: 0.5,
        description: '红色小球的质量 (kg)。', resetOnChange: true
      },
      { 
        type: 'range', key: 'm2', label: '质量 2 (绿)', min: 0.5, max: 10.0, step: 0.5,
        description: '绿色小球的质量 (kg)。', resetOnChange: true
      },
      { 
        type: 'range', key: 'v1', label: '初速度 1', min: 0, max: 20, step: 1,
        description: '红色小球向右的初速度 (m/s)。', resetOnChange: true
      },
      { 
        type: 'range', key: 'v2', label: '初速度 2', min: 0, max: 20, step: 1,
        description: '绿色小球向左的初速度 (m/s)。', resetOnChange: true
      },
      { 
        type: 'range', key: 'b', label: '碰撞偏置 (b)', min: 0, max: 3.0, step: 0.1,
        description: '垂直方向的偏离距离 (m)。', resetOnChange: true
      },
      { 
        type: 'range', key: 'e', label: '恢复系数 (e)', min: 0, max: 1.0, step: 0.1,
        description: '1.0 为完全弹性碰撞，0.0 为完全非弹性碰撞。', resetOnChange: false
      },
      { 
        type: 'range', key: 'vectorScale', label: '矢量缩放', min: 0.1, max: 3.0, step: 0.1,
        description: '调整矢量箭头的显示长度。', resetOnChange: false
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
      { type: 'dot', color: THEME.colors.objects.ball.light, label: '小球 1' },
      { type: 'dot', color: '#5cd65c', label: '小球 2' },
      { type: 'arrow', color: THEME.colors.vectors.velocity, label: '速度' },
      { type: 'arrow', color: '#d28bff', label: '动量' }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '动量守恒', 
        tex: 'm_1\\vec{v}_1 + m_2\\vec{v}_2 = m_1\\vec{v}_1\' + m_2\\vec{v}_2\'',
        params: []
      },
      { 
        label: '动能', 
        tex: 'E_k = \\frac{1}{2}mv^2',
        params: []
      }
    ];
  }

  getChartConfig() {
    return {
      vel: {
        label: '总动能 (J)',
        series: ['Total Ek'],
        colors: ['#ffa500']
      },
      acc: {
        label: '总动量 X (kg·m/s)',
        series: ['Total Px'],
        colors: ['#d28bff']
      }
    };
  }

  getMonitorData(t) {
    let totalEk = 0;
    let totalPx = 0;
    
    this.balls.forEach(b => {
      const v2 = b.vel.x * b.vel.x + b.vel.y * b.vel.y;
      totalEk += 0.5 * b.m * v2;
      totalPx += b.m * b.vel.x;
    });
    
    return {
      t: t,
      vel: [totalEk],
      acc: [totalPx]
    };
  }

  update(dt, t) {
    this.time += dt;
    
    // 1. 更新位置
    // 计算视口边界 (物理坐标)
    const topLeft = this.viewport.screenToWorld(0, 0);
    const bottomRight = this.viewport.screenToWorld(this.canvas.clientWidth, this.canvas.clientHeight);
    const minX = topLeft.x;
    const maxX = bottomRight.x;
    const minY = bottomRight.y; // 物理Y向上，屏幕Y向下
    const maxY = topLeft.y;

    this.balls.forEach(b => {
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      // 边界碰撞检测 (围墙)
      if (b.pos.x - b.r < minX) {
        b.pos.x = minX + b.r;
        b.vel.x = -b.vel.x;
      } else if (b.pos.x + b.r > maxX) {
        b.pos.x = maxX - b.r;
        b.vel.x = -b.vel.x;
      }

      if (b.pos.y - b.r < minY) {
        b.pos.y = minY + b.r;
        b.vel.y = -b.vel.y;
      } else if (b.pos.y + b.r > maxY) {
        b.pos.y = maxY - b.r;
        b.vel.y = -b.vel.y;
      }
      
      // 记录轨迹 (每隔几帧记录一次，或者简单点每帧记录但限制长度)
      if (this.time % 0.1 < dt) { // 约每0.1秒记录一次
          b.trail.push({x: b.pos.x, y: b.pos.y});
          if (b.trail.length > 100) b.trail.shift();
      }
    });
    
    // 2. 碰撞检测
    const b1 = this.balls[0];
    const b2 = this.balls[1];
    
    const dx = b2.pos.x - b1.pos.x;
    const dy = b2.pos.y - b1.pos.y;
    const distSq = dx*dx + dy*dy;
    const minDist = b1.r + b2.r;
    
    if (distSq < minDist * minDist) {
      // 发生碰撞
      const dist = Math.sqrt(distSq);
      
      // 法向量 (从 1 指向 2)
      const nx = dx / dist;
      const ny = dy / dist;
      
      // 切向量 (旋转 90 度)
      const tx = -ny;
      const ty = nx;
      
      // 分解速度
      const v1n = b1.vel.x * nx + b1.vel.y * ny;
      const v1t = b1.vel.x * tx + b1.vel.y * ty;
      
      const v2n = b2.vel.x * nx + b2.vel.y * ny;
      const v2t = b2.vel.x * tx + b2.vel.y * ty;
      
      // 相对速度 (法向)
      const vRelN = v1n - v2n;
      
      // 只有当它们相互接近时才处理碰撞 (防止重叠时粘连)
      if (vRelN > 0) {
        const { m1, m2, e } = this.params;
        
        // 1D 弹性碰撞公式
        // v1' = (v1(m1-m2) + 2m2v2) / (m1+m2)  <-- 这是 e=1 的情况
        // 通用公式:
        // v1' = (m1*v1 + m2*v2 - m2*e*(v1-v2)) / (m1+m2)
        // v2' = (m1*v1 + m2*v2 + m1*e*(v1-v2)) / (m1+m2)
        
        const v1n_new = (m1 * v1n + m2 * v2n - m2 * e * (v1n - v2n)) / (m1 + m2);
        const v2n_new = (m1 * v1n + m2 * v2n + m1 * e * (v1n - v2n)) / (m1 + m2);
        
        // 合成新速度
        b1.vel.x = v1n_new * nx + v1t * tx;
        b1.vel.y = v1n_new * ny + v1t * ty;
        
        b2.vel.x = v2n_new * nx + v2t * tx;
        b2.vel.y = v2n_new * ny + v2t * ty;
        
        // 简单的位置修正：将它们移出重叠区域
        // 这是一个简单的处理，防止下一帧继续判定碰撞
        // 更好的做法是计算碰撞时间回退，但这里简单推开即可
        const overlap = minDist - dist;
        const separationX = nx * overlap * 0.51; // 多推一点点
        const separationY = ny * overlap * 0.51;
        
        b1.pos.x -= separationX;
        b1.pos.y -= separationY;
        b2.pos.x += separationX;
        b2.pos.y += separationY;
      }
    }
  }

  render(ctx) {
    const { vectorScale } = this.params;

    // 绘制围墙
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    
    // 绘制轨迹
    this.balls.forEach(b => {
      if (b.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = b.color;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        const start = this.viewport.worldToScreen(b.trail[0].x, b.trail[0].y);
        ctx.moveTo(start.x, start.y);
        for (let i = 1; i < b.trail.length; i++) {
          const p = this.viewport.worldToScreen(b.trail[i].x, b.trail[i].y);
          ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }
    });
    
    // 绘制小球
    this.balls.forEach(b => {
      const screenPos = this.viewport.worldToScreen(b.pos.x, b.pos.y);
      const screenR = this.viewport.toPixels(b.r);
      
      // 填充
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(screenPos.x, screenPos.y, screenR, 0, Math.PI * 2);
      ctx.fill();
      
      // 描边
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // 绘制速度矢量
      const vScale = 0.2 * vectorScale;
      const screenVx = this.viewport.toPixels(b.vel.x);
      const screenVy = -this.viewport.toPixels(b.vel.y); // Y轴反转
      
      drawVector(ctx, screenPos.x, screenPos.y, screenVx * vScale, screenVy * vScale, THEME.colors.vectors.velocity);
      
      // 绘制动量矢量 (可选，用不同颜色)
      // P = mv. 
      // 为了显示清楚，缩放系数可能需要不同
      // const pScale = 0.1 * vectorScale;
      // const screenPx = this.viewport.toPixels(b.vel.x * b.m);
      // const screenPy = -this.viewport.toPixels(b.vel.y * b.m);
      // drawVector(ctx, screenPos.x, screenPos.y, screenPx * pScale, screenPy * pScale, '#d28bff');
    });
  }
}
