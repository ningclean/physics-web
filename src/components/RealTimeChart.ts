import { THEME } from '../config.ts';

interface DataPoint {
  t: number;
  values: number[];
}

/**
 * 使用环形缓冲区（Ring Buffer）实现的实时图表组件。
 * 自动处理渲染，确保坐标轴和标签始终可见。
 */
export class RealTimeChart {
  private canvas: HTMLCanvasElement | null;
  private ctx: CanvasRenderingContext2D | null;
  private label: string;
  private colors: string[];
  private seriesNames: string[];

  // 环形缓冲区
  private capacity: number;
  private buffer: (DataPoint | null)[];
  private head: number; // 指向下一个插入位置
  private count: number; // 当前项目数量

  // 时间窗口大小 (秒)
  private windowSec: number;

  // 记录历史最大绝对值，用于 Y 轴缩放 (只增不减，保持视觉稳定性)
  private maxAbs: number;

  /**
   * @param {string} canvasId - Canvas 元素的 ID
   * @param {string} label - Y 轴标签
   * @param {string[]} colors - 每个数据系列的颜色数组
   * @param {number} capacity - 保留的最大数据点数量（默认 3600，即 60fps 下的 60秒）
   */
  constructor(canvasId: string, label: string, colors: string[] = THEME.colors.chart.series, capacity: number = 3600) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.label = label;
    this.colors = colors;
    this.seriesNames = [];

    // 环形缓冲区
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
    this.head = 0; // 指向下一个插入位置
    this.count = 0; // 当前项目数量

    // 时间窗口大小 (秒)
    this.windowSec = 30;

    // 记录历史最大绝对值，用于 Y 轴缩放 (只增不减，保持视觉稳定性)
    this.maxAbs = 0.1;

    if (!this.canvas) {
      console.warn(`Chart canvas #${canvasId} not found`);
    } else {
      // 初始绘制
      this.draw();
    }
  }

  setSeriesNames(names: string[]): void {
    this.seriesNames = names;
    this.draw();
  }

  setColors(colors: string[]): void {
    this.colors = colors;
    this.draw();
  }

  setLabel(label: string): void {
    this.label = label;
    this.draw();
  }

  setTimeWindow(seconds: number): void {
    this.windowSec = seconds;
    this.draw();
  }

  /**
   * 添加一个新的数据点并重绘图表。
   * @param {number} t - 时间戳（X 轴）
   * @param {...number} values - Y 轴数值（每个系列一个）
   */
  push(t: number, ...values: number[]): void {
    this.buffer[this.head] = { t, values };
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) this.count++;

    // 更新历史最大值
    for (const v of values) {
      if (typeof v === 'number' && !isNaN(v)) {
        this.maxAbs = Math.max(this.maxAbs, Math.abs(v));
      }
    }

    this.draw();
  }

  clear(): void {
    this.head = 0;
    this.count = 0;
    this.maxAbs = 0.1;
    this.draw();
  }

  /**
   * 渲染图表。
   */
  draw(): void {
    if (!this.ctx) return;

    const { width, height } = this.canvas!;
    // 清除画布
    this.ctx.clearRect(0, 0, width, height);

    // 如果没有系列数据，显示提示信息
    if (!this.seriesNames || this.seriesNames.length === 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.font = '14px system-ui';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('不涉及曲线', width / 2, height / 2);
      return;
    }

    // 1. 绘制背景网格
    this.drawGrid(width, height);

    // 2. 绘制坐标轴
    this.ctx.strokeStyle = THEME.colors.chart.axis;
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    // Y轴
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(0, height);
    // X轴
    this.ctx.moveTo(0, height);
    this.ctx.lineTo(width, height);
    this.ctx.stroke();

    // 3. 绘制标签
    this.ctx.fillStyle = THEME.colors.ui.textMain;
    this.ctx.font = THEME.fonts.label;
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(this.label, 5, 5);

    // 4. 绘制 X 轴标签
    this.ctx.fillStyle = THEME.colors.chart.text;
    this.ctx.font = '10px system-ui';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('t (s)', width - 5, height - 5);

    // 确定 X 轴比例
    const newestIdx = (this.head - 1 + this.capacity) % this.capacity;
    const newestT = this.count > 0 ? this.buffer[newestIdx]!.t : 0;
    const windowSec = this.windowSec;

    let xToPix: (t: number) => number;
    let tStart: number, tEnd: number;

    // 滚动机制:
    if (newestT <= windowSec) {
      // 1. 静态阶段 (t < windowSec): X 轴范围固定为 [0, windowSec]
      xToPix = (t: number) => t * (width / windowSec);
      tStart = 0;
      tEnd = windowSec;
    } else {
      // 2. 滚动阶段 (t > windowSec): X 轴随时间向左滚动
      xToPix = (t: number) => width - (newestT - t) * (width / windowSec);
      tStart = newestT - windowSec;
      tEnd = newestT;
    }

    // 绘制 X 轴刻度 (每 5 秒一个刻度)
    const step = 5;
    // 计算第一个刻度的时间：向上取整到 step 的倍数
    const firstTick = Math.ceil(tStart / step) * step;

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = THEME.colors.chart.text;

    for (let t = firstTick; t <= tEnd; t += step) {
      const x = xToPix(t);
      // 绘制刻度线
      this.ctx.beginPath();
      this.ctx.moveTo(x, height);
      this.ctx.lineTo(x, height - 5);
      this.ctx.stroke();

      // 绘制刻度值
      this.ctx.fillText(t.toString(), x, height + 2);
    }

    // 5. 绘制图例
    if (this.seriesNames && this.seriesNames.length > 0) {
      const legendX = width - 10;
      let legendY = 10;
      this.ctx.textAlign = 'right';
      this.ctx.textBaseline = 'top';
      this.ctx.font = '10px system-ui';

      this.seriesNames.forEach((name, i) => {
        if (i >= this.colors.length) return;
        const color = this.colors[i];

        // 颜色块
        this.ctx.fillStyle = color;
        this.ctx.fillRect(legendX - 60, legendY + 2, 10, 6);

        // 文字
        this.ctx.fillStyle = THEME.colors.chart.text;
        this.ctx.fillText(name, legendX, legendY);

        legendY += 12;
      });
    }

    // 如果没有数据，就此结束
    if (this.count < 2) return;

    // 6. 绘制数据曲线
    // 确定 Y 轴比例 (使用历史最大值，保持缩放稳定)
    const padding = 1.2;
    const yMax = this.maxAbs * padding;

    // Y轴坐标转换
    const yToPix = (y: number) => height / 2 - (y / yMax) * (height * 0.45);

    // 绘制零线 (X轴中心线)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, yToPix(0));
    this.ctx.lineTo(width, yToPix(0));
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // 绘制0刻度值
    this.ctx.fillStyle = THEME.colors.chart.text;
    this.ctx.font = '10px system-ui';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('0', 2, yToPix(0) - 2);

    // 绘制每条曲线
    this.colors.forEach((color, seriesIdx) => {
      this.ctx!.strokeStyle = color;
      this.ctx!.lineWidth = 2;
      this.ctx!.beginPath();

      let started = false;

      for (let i = 0; i < this.count; i++) {
        const idx = (this.head - this.count + i + this.capacity) % this.capacity;
        const item = this.buffer[idx];

        // 跳过时间窗口之外的点
        if (item!.t < newestT - windowSec) continue;

        if (!item!.values || seriesIdx >= item!.values.length) continue;
        const val = item!.values[seriesIdx];
        if (typeof val !== 'number' || isNaN(val)) continue;

        const x = xToPix(item!.t);
        const y = yToPix(val);

        if (!started) {
          this.ctx!.moveTo(x, y);
          started = true;
        } else {
          this.ctx!.lineTo(x, y);
        }
      }
      this.ctx!.stroke();
    });
  }

  drawGrid(w: number, h: number): void {
    this.ctx!.save();
    this.ctx!.strokeStyle = THEME.colors.chart.grid;
    this.ctx!.lineWidth = 1;
    // 垂直线
    for (let x = 0; x <= w; x += 50) {
      this.ctx!.beginPath();
      this.ctx!.moveTo(x, 0);
      this.ctx!.lineTo(x, h);
      this.ctx!.stroke();
    }
    // 水平线
    for (let y = 0; y <= h; y += 25) {
      this.ctx!.beginPath();
      this.ctx!.moveTo(0, y);
      this.ctx!.lineTo(w, y);
      this.ctx!.stroke();
    }
    this.ctx!.restore();
  }
}
