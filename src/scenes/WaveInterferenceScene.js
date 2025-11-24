import { Scene } from '../core/Scene.js';
import { drawDot } from '../utils/draw.js';
import { THEME } from '../config.js';
import description from '../content/WaveInterference.md?raw';

/**
 * 场景名称: 波的干涉 (Wave Interference)
 * 物理现象: 模拟两个点波源产生的水波干涉现象，展示波的叠加原理与干涉图样。
 * 初始设置: 频率 f1=1.0 Hz, f2=1.0 Hz, 间距 d=100 px, 波速 v=50 px/s.
 */
export class WaveInterferenceScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      f1: 1.0,        // Hz
      f2: 1.0,        // Hz
      d: 100,         // px (波源间距)
      v: 50,          // px/s (波速)
      A: 10,          // 振幅
      contrast: 1.0,  // 对比度
      resolution: 4,  // 像素步长 (1=全分辨率, 4=每4像素计算一次)
      bgColor: '#000000'
    };
    
    this.time = 0;
    
    // 离屏 Canvas 用于低分辨率渲染
    this.offCanvas = document.createElement('canvas');
    this.offCtx = this.offCanvas.getContext('2d');
    
    // 视口设置：这里主要使用屏幕坐标，不需要复杂的物理坐标转换
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

  resize(w, h) {
    super.resize(w, h);
    // 调整离屏 Canvas 大小
    // 实际渲染尺寸 = 屏幕尺寸 / 分辨率
    this.updateOffscreenSize();
  }

  updateOffscreenSize() {
    const res = this.params.resolution;
    this.offCanvas.width = Math.max(1, Math.ceil(this.width / res));
    this.offCanvas.height = Math.max(1, Math.ceil(this.height / res));
    // 获取新的 ImageData 缓冲区
    this.imageData = this.offCtx.createImageData(this.offCanvas.width, this.offCanvas.height);
  }

  resetSimulation() {
    this.time = 0;
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig() {
    return [
      { 
        type: 'range', key: 'f1', label: '频率 1 (Hz)', min: 0.1, max: 5.0, step: 0.1,
        description: '左侧波源的频率。', resetOnChange: false
      },
      { 
        type: 'range', key: 'f2', label: '频率 2 (Hz)', min: 0.1, max: 5.0, step: 0.1,
        description: '右侧波源的频率。', resetOnChange: false
      },
      { 
        type: 'range', key: 'd', label: '波源间距', min: 0, max: 400, step: 10,
        description: '两个波源之间的像素距离。', resetOnChange: false
      },
      { 
        type: 'range', key: 'v', label: '波速 (v)', min: 10, max: 200, step: 5,
        description: '波的传播速度 (px/s)。', resetOnChange: false
      },
      { 
        type: 'range', key: 'A', label: '振幅 (A)', min: 1, max: 20, step: 1,
        description: '波源振幅。', resetOnChange: false
      },
      { 
        type: 'range', key: 'contrast', label: '对比度', min: 0.5, max: 3.0, step: 0.1,
        description: '调整颜色显示的对比度。', resetOnChange: false
      },
      { 
        type: 'range', key: 'resolution', label: '分辨率 (1-8)', min: 1, max: 8, step: 1,
        description: '渲染质量 (越小越清晰，但越卡)。', 
        onChange: () => this.updateOffscreenSize()
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'dot', color: '#ff0000', label: '波峰 (+)' },
      { type: 'dot', color: '#0000ff', label: '波谷 (-)' },
      { type: 'dot', color: '#fff', label: '波源' }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '波函数', 
        tex: 'y(r, t) = A \\sin(kr - \\omega t)',
        params: []
      },
      { 
        label: '叠加原理', 
        tex: 'y_{total} = y_1 + y_2',
        params: []
      }
    ];
  }

  getChartConfig() {
    return {
      vel: {
        label: '中心点振幅',
        series: ['Amplitude'],
        colors: ['#00ff00']
      }
    };
  }

  getMonitorData(t) {
    // 计算中心点的振幅
    const { f1, f2, d, v, A } = this.params;
    const omega1 = 2 * Math.PI * f1;
    const omega2 = 2 * Math.PI * f2;
    const k1 = omega1 / v;
    const k2 = omega2 / v;
    
    // 中心点距离两个波源都是 d/2
    const r = d / 2;
    
    const y1 = A * Math.sin(k1 * r - omega1 * t);
    const y2 = A * Math.sin(k2 * r - omega2 * t);
    
    return {
      t: t,
      vel: [y1 + y2],
      acc: []
    };
  }

  update(dt, t) {
    this.time += dt;
  }

  render(ctx) {
    const { f1, f2, d, v, A, contrast, resolution } = this.params;
    const width = this.offCanvas.width;
    const height = this.offCanvas.height;
    
    const cx = width / 2;
    const cy = height / 2;
    
    // 波源位置 (在低分辨率网格上)
    // 实际距离 d 是像素，需要除以 resolution
    const dScaled = d / resolution;
    const src1 = { x: cx - dScaled / 2, y: cy };
    const src2 = { x: cx + dScaled / 2, y: cy };
    
    const omega1 = 2 * Math.PI * f1;
    const omega2 = 2 * Math.PI * f2;
    // k = omega / v. 注意 v 也是像素单位，需要匹配 resolution 吗？
    // 物理公式中 kr 是相位。r 是实际距离。
    // 如果我们在低分辨率网格上计算，网格坐标 x' = x / res.
    // 实际距离 r = r' * res.
    // 所以 k * r = (omega / v) * (r' * res).
    
    const k1 = omega1 / v;
    const k2 = omega2 / v;
    
    const data = this.imageData.data;
    const t = this.time;
    
    // 遍历像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        
        // 计算到两个波源的距离 (网格距离)
        const dx1 = x - src1.x;
        const dy1 = y - src1.y;
        const r1_grid = Math.sqrt(dx1*dx1 + dy1*dy1);
        
        const dx2 = x - src2.x;
        const dy2 = y - src2.y;
        const r2_grid = Math.sqrt(dx2*dx2 + dy2*dy2);
        
        // 转换为实际像素距离
        const r1 = r1_grid * resolution;
        const r2 = r2_grid * resolution;
        
        // 计算波高
        const val1 = Math.sin(k1 * r1 - omega1 * t);
        const val2 = Math.sin(k2 * r2 - omega2 * t);
        
        // 叠加并归一化 (-2A ~ 2A) -> (-1 ~ 1)
        // 这里 val1, val2 已经是 -1~1 了，所以 sum 是 -2~2
        const sum = (val1 + val2) * 0.5 * contrast;
        
        // 颜色映射
        // 正(波峰) -> 红, 负(波谷) -> 蓝, 0 -> 黑
        let r = 0, g = 0, b = 0;
        
        if (sum > 0) {
          r = Math.min(255, sum * 255);
        } else {
          b = Math.min(255, -sum * 255);
        }
        
        // 稍微加点紫色/白色在极强处？或者保持简单
        
        data[idx] = r;     // R
        data[idx+1] = g;   // G
        data[idx+2] = b;   // B
        data[idx+3] = 255; // Alpha
      }
    }
    
    // 将数据放回离屏 Canvas
    this.offCtx.putImageData(this.imageData, 0, 0);
    
    // 将离屏 Canvas 绘制到主 Canvas (自动拉伸)
    // 使用 imageSmoothingEnabled = false 获得像素风格，或者 true 获得模糊风格
    ctx.imageSmoothingEnabled = true; 
    ctx.drawImage(this.offCanvas, 0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制波源位置
    const screenCx = this.canvas.width / 2;
    const screenCy = this.canvas.height / 2;
    drawDot(ctx, screenCx - d/2, screenCy, '#fff', 5);
    drawDot(ctx, screenCx + d/2, screenCy, '#fff', 5);
  }
  
  getRecordingDuration() {
    const { f1, f2 } = this.params;
    
    // 如果频率相同，周期为 1/f
    if (Math.abs(f1 - f2) < 0.001) {
        const period = 1.0 / f1;
        let duration = period;
        while (duration < 2.0) {
            duration += period;
        }
        return duration;
    }
    
    // 如果频率不同，寻找最小公倍数比较复杂，简单起见返回 4 秒 (通常足够展示干涉变化)
    return 4.0;
  }
}
