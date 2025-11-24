import { Scene } from '../core/Scene.js';
import { drawDot, drawVector } from '../utils/draw.js';
import { drawEye, drawFish } from '../utils/graphics.js';
import { THEME } from '../config.js';
import description from '../content/Refraction.md?raw';

/**
 * 场景名称: 光的折射与视深 (Refraction & Apparent Depth)
 * 物理现象: 模拟光从水中射向空气时的折射现象，展示视深原理。
 */
export class RefractionScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      fishDepth: 150,    // 鱼的深度 (px)
      eyeHeight: 150,    // 眼睛的高度 (px)
      eyeX: 200,         // 眼睛的水平偏移 (px)
      n1: 1.33,          // 水的折射率
      showNormal: true,  // 显示法线
      showVirtual: true, // 显示虚像
      animationSpeed: 1.0, // 动画速度
      bgColor: '#ffffff' // 默认为白色背景，方便看水
    };
    
    this.animTime = 0;
    
    // 视口设置
    this.viewport.setCenter(0, 0);
    this.viewport.setScale(1.0);
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
    this.animTime = 0;
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'fishDepth', label: '鱼的深度', min: 50, max: 300, step: 10,
        description: '鱼距离水面的深度。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'eyeHeight', label: '眼睛高度', min: 50, max: 300, step: 10,
        description: '眼睛距离水面的高度。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'eyeX', label: '观察距离', min: 0, max: 400, step: 10,
        description: '眼睛与鱼的水平距离。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'n1', label: '液体折射率', min: 1.0, max: 2.0, step: 0.01,
        description: '水的折射率约为1.33。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'animationSpeed', label: '动画速度', min: 0.1, max: 3.0, step: 0.1,
        description: '光线传播演示速度。'
      },
      { 
        type: 'boolean', key: 'showNormal', label: '显示法线',
        description: '显示折射点处的法线。'
      },
      { 
        type: 'boolean', key: 'showVirtual', label: '显示虚像',
        description: '显示鱼的视深位置。',
        onChange: () => this.resetSimulation()
      },
      {
        type: 'action', label: '重播动画', onClick: () => this.resetSimulation()
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'line', color: '#ff9800', label: '实光线 (Real Ray)' },
      { type: 'line', color: '#ff9800', label: '视觉延长线 (Virtual Ray)', dashed: true },
      { type: 'circle', color: '#ff5722', label: '实物 (Real Object)' },
      { type: 'circle', color: '#ff5722', label: '虚像 (Virtual Image)', opacity: 0.5 }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '斯涅尔定律', 
        tex: 'n_1 \\sin \\theta_1 = n_2 \\sin \\theta_2',
        params: []
      },
      { 
        label: '视深公式', 
        tex: "d' \\approx \\frac{n_2}{n_1} d",
        params: []
      }
    ];
  }

  update(dt) {
    this.animTime += dt * this.params.animationSpeed;
  }

  render(ctx) {
    const { width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    
    const waterLevel = cy; // 水面在屏幕中间
    
    // 1. 绘制水体
    ctx.fillStyle = 'rgba(33, 150, 243, 0.2)'; // 浅蓝色
    ctx.fillRect(0, waterLevel, width, height - waterLevel);
    
    // 水面线
    ctx.strokeStyle = '#2196f3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, waterLevel);
    ctx.lineTo(width, waterLevel);
    ctx.stroke();
    
    // 2. 计算位置
    // 鱼的位置 (固定在左侧或中心，这里设为中心偏左)
    const fishX = cx - 100;
    const fishY = waterLevel + this.params.fishDepth;
    
    // 眼睛的位置 (由参数控制相对位置)
    const eyeX = fishX + this.params.eyeX;
    const eyeY = waterLevel - this.params.eyeHeight;
    
    // 3. 计算折射点 (Solver)
    // 我们需要找到水面上的点 x，使得光线从 (fishX, fishY) -> (x, waterLevel) -> (eyeX, eyeY) 满足斯涅尔定律
    // n1 * sin(theta1) = n2 * sin(theta2)
    // theta1 是入射角 (在水中)，theta2 是折射角 (在空气中)
    // sin(theta1) = (x - fishX) / dist1
    // sin(theta2) = (eyeX - x) / dist2
    
    const n1 = this.params.n1;
    const n2 = 1.0; // 空气
    
    let crossX = this.solveRefractionPoint(fishX, fishY, eyeX, eyeY, waterLevel, n1, n2);
    
    // 4. 动画控制
    const speed = 300; // 像素/秒
    const currentDist = this.animTime * speed;
    
    // 计算各段长度
    const len1 = Math.hypot(crossX - fishX, waterLevel - fishY); // 鱼 -> 水面
    const len2 = Math.hypot(eyeX - crossX, eyeY - waterLevel);   // 水面 -> 眼睛
    
    // 虚像位置计算 (反向延长线)
    const crossX2 = this.solveRefractionPoint(fishX, fishY, eyeX + 5, eyeY, waterLevel, n1, n2);
    const slope = (eyeY - waterLevel) / (eyeX - crossX);
    const slope2 = (eyeY - waterLevel) / (eyeX + 5 - crossX2);
    const imgX = (slope * crossX - slope2 * crossX2) / (slope - slope2);
    const imgY = slope * (imgX - crossX) + waterLevel;
    
    const len3 = Math.hypot(imgX - crossX, imgY - waterLevel); // 水面 -> 虚像
    
    // 绘制光路
    const rayColor = '#ff9800';
    
    // 4.1 入射光线 (Fish -> Surface)
    if (currentDist > 0) {
        const progress1 = Math.min(1, currentDist / len1);
        const p1x = fishX + (crossX - fishX) * progress1;
        const p1y = fishY + (waterLevel - fishY) * progress1;
        
        ctx.beginPath();
        ctx.strokeStyle = rayColor;
        ctx.lineWidth = 2;
        ctx.moveTo(fishX, fishY);
        ctx.lineTo(p1x, p1y);
        ctx.stroke();
        
        if (progress1 >= 0.5) {
            this.drawArrowOnLine(ctx, fishX, fishY, crossX, waterLevel, 0.6);
        }
    }
    
    // 4.2 折射光线 (Surface -> Eye)
    if (currentDist > len1) {
        const dist2 = currentDist - len1;
        const progress2 = Math.min(1, dist2 / len2);
        const p2x = crossX + (eyeX - crossX) * progress2;
        const p2y = waterLevel + (eyeY - waterLevel) * progress2;
        
        ctx.beginPath();
        ctx.moveTo(crossX, waterLevel);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();
        
        if (progress2 >= 0.5) {
            this.drawArrowOnLine(ctx, crossX, waterLevel, eyeX, eyeY, 0.5);
        }
    }
    
    // 5. 绘制虚像光线 (Surface -> Virtual Image)
    // 只有当实光线到达眼睛后，才开始绘制反向延长线
    if (this.params.showVirtual && currentDist > len1 + len2) {
        const dist3 = currentDist - (len1 + len2);
        const progress3 = Math.min(1, dist3 / len3);
        
        const p3x = crossX + (imgX - crossX) * progress3;
        const p3y = waterLevel + (imgY - waterLevel) * progress3;
        
        ctx.save();
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = rayColor;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.moveTo(crossX, waterLevel);
        ctx.lineTo(p3x, p3y);
        ctx.stroke();
        
        ctx.restore();
        
        // 6. 绘制虚像鱼
        // 当虚光线到达虚像位置后，鱼开始浮现
        if (progress3 >= 1.0) {
            // 鱼的浮现动画 (0.5秒)
            const fishAppearTime = (currentDist - (len1 + len2 + len3)) / speed;
            const fishOpacity = Math.min(0.5, fishAppearTime); // 最大透明度 0.5
            
            if (fishOpacity > 0) {
                drawFish(ctx, imgX, imgY, '#ff5722', fishOpacity);
                
                // 标记虚像文字
                ctx.fillStyle = `rgba(255, 87, 34, ${fishOpacity * 2})`; // 文字不透明度稍微高点
                ctx.font = '12px Arial';
                ctx.fillText('虚像 (Virtual)', imgX - 20, imgY - 20);
            }
        }
    }

    // 6. 绘制法线 (一直显示，或者随光线出现？一直显示比较好定位)
    if (this.params.showNormal) {
        ctx.save();
        ctx.strokeStyle = '#999';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(crossX, waterLevel - 50);
        ctx.lineTo(crossX, waterLevel + 50);
        ctx.stroke();
        ctx.restore();
    }

    // 7. 绘制物体 (实物鱼)
    drawFish(ctx, fishX, fishY, '#ff5722', 1.0);
    ctx.fillStyle = '#ff5722';
    ctx.font = '12px Arial';
    ctx.fillText('实物 (Real)', fishX - 20, fishY + 30);

    // 8. 绘制眼睛
    // 眼睛朝向折射点
    const eyeAngle = Math.atan2(waterLevel - eyeY, crossX - eyeX);
    drawEye(ctx, eyeX, eyeY, 40, eyeAngle);

  }
  
  // 二分法求解折射点 X 坐标
  solveRefractionPoint(x1, y1, x2, y2, ySurface, n1, n2) {
      // x1, y1: Fish (in water, y1 > ySurface)
      // x2, y2: Eye (in air, y2 < ySurface)
      // We assume x1 < x2 for simplicity in binary search range, but handle swap if needed.
      
      let left = Math.min(x1, x2);
      let right = Math.max(x1, x2);
      
      // 如果垂直
      if (Math.abs(x1 - x2) < 0.1) return x1;
      
      const h1 = Math.abs(y1 - ySurface);
      const h2 = Math.abs(y2 - ySurface);
      
      // 目标函数：n1 * sin(theta1) - n2 * sin(theta2) = 0
      // sin(theta1) = (x - x1) / sqrt((x-x1)^2 + h1^2)  (assuming x between x1 and x2)
      // sin(theta2) = (x2 - x) / sqrt((x2-x)^2 + h2^2)
      
      // 注意方向：如果 x1 < x2，则 x 在 [x1, x2]。
      // x 增大 -> theta1 增大 -> sin(theta1) 增大
      // x 增大 -> theta2 减小 -> sin(theta2) 减小
      // 所以 f(x) 是单调增函数。
      
      for (let i = 0; i < 20; i++) {
          const mid = (left + right) / 2;
          
          // 计算 sin
          const d1 = Math.sqrt((mid - x1)**2 + h1**2);
          const sin1 = (mid - x1) / d1; // Signed distance if we respect direction
          
          const d2 = Math.sqrt((x2 - mid)**2 + h2**2);
          const sin2 = (x2 - mid) / d2;
          
          // 这里的 sin1, sin2 都是正值 (因为 mid 在 x1, x2 之间)
          // 实际上我们要检查 x1, x2 的相对位置
          // 通用公式: sin1 = (mid - x1)/d1, sin2 = (x2 - mid)/d2 ? 
          // 让我们确保 x1 < x2 的情况。
          // 如果 x1 > x2，我们交换了 left/right 吗？
          // 简单起见，我们只处理 x1 <= x2 的情况。如果 x1 > x2，对称处理。
          
          let val;
          if (x1 <= x2) {
             val = n1 * sin1 - n2 * sin2;
          } else {
             // x1 > x2. x 在 [x2, x1].
             // mid 增大 -> 离 x1 近 -> theta1 减小?
             // (mid - x1) 是负数。
             // 让我们用绝对距离
             const s1 = (mid - x1) / d1; // negative
             const s2 = (x2 - mid) / d2; // positive
             // 我们希望 n1 * sin(theta1_abs) = n2 * sin(theta2_abs)
             // 也就是 n1 * |mid-x1|/d1 - n2 * |x2-mid|/d2 = 0
             // 随着 mid 增加 (从 x2 到 x1)，|mid-x1| 减小，|x2-mid| 增加。
             // 所以 f(mid) = n1*... - n2*... 是单调减函数。
             val = -(n1 * Math.abs(mid - x1) / d1 - n2 * Math.abs(x2 - mid) / d2);
          }

          if (val < 0) {
              left = mid;
          } else {
              right = mid;
          }
      }
      
      return (left + right) / 2;
  }
  
  drawArrowOnLine(ctx, x1, y1, x2, y2, ratio) {
      const mx = x1 + (x2 - x1) * ratio;
      const my = y1 + (y2 - y1) * ratio;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(angle);
      
      ctx.beginPath();
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, 0);
      ctx.lineTo(-5, 5);
      ctx.strokeStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
  }
}
