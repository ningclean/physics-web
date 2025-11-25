/**
 * 视口类，负责物理坐标到屏幕坐标的转换。
 *
 * 坐标系定义：
 * - 物理坐标 (World Space): 标准笛卡尔坐标系，Y轴向上，单位为米(m)。
 * - 屏幕坐标 (Screen Space): Canvas坐标系，Y轴向下，单位为像素(px)。
 */

// 类型定义
interface ScreenPoint {
  x: number;
  y: number;
}

interface WorldPoint {
  x: number;
  y: number;
}

export class Viewport {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;

  // 视口配置
  scale: number; // 1米 = 100像素 (Pixels Per Meter)
  centerX: number; // 视口中心的物理X坐标
  centerY: number; // 视口中心的物理Y坐标

  // 缓存屏幕中心点
  screenCenterX: number;
  screenCenterY: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;

    // 视口配置
    this.scale = 100; // 1米 = 100像素 (Pixels Per Meter)
    this.centerX = 0; // 视口中心的物理X坐标
    this.centerY = 0; // 视口中心的物理Y坐标

    // 缓存屏幕中心点
    this.screenCenterX = this.width / 2;
    this.screenCenterY = this.height / 2;
  }

  /**
   * 更新视口尺寸（通常在窗口大小改变时调用）
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.screenCenterX = width / 2;
    this.screenCenterY = height / 2;
  }

  /**
   * 设置视口中心对应的物理坐标
   * @param {number} x
   * @param {number} y
   */
  setCenter(x: number, y: number): void {
    this.centerX = x;
    this.centerY = y;
  }

  /**
   * 设置缩放比例 (像素/米)
   * @param {number} pixelsPerMeter
   */
  setScale(pixelsPerMeter: number): void {
    this.scale = pixelsPerMeter;
  }

  /**
   * 将物理坐标转换为屏幕坐标
   * @param {number} x 物理X (米)
   * @param {number} y 物理Y (米)
   * @returns {Object} { x: screenX, y: screenY }
   */
  worldToScreen(x: number, y: number): ScreenPoint {
    // 屏幕X = 屏幕中心X + (物理X - 视口中心X) * 缩放
    const sx = this.screenCenterX + (x - this.centerX) * this.scale;
    // 屏幕Y = 屏幕中心Y - (物理Y - 视口中心Y) * 缩放 (注意Y轴翻转)
    const sy = this.screenCenterY - (y - this.centerY) * this.scale;
    return { x: sx, y: sy };
  }

  /**
   * 将屏幕坐标转换为物理坐标
   * @param {number} sx 屏幕X (像素)
   * @param {number} sy 屏幕Y (像素)
   * @returns {Object} { x: worldX, y: worldY }
   */
  screenToWorld(sx: number, sy: number): WorldPoint {
    const wx = this.centerX + (sx - this.screenCenterX) / this.scale;
    const wy = this.centerY - (sy - this.screenCenterY) / this.scale; // 注意Y轴翻转
    return { x: wx, y: wy };
  }

  /**
   * 将物理长度转换为屏幕像素长度
   * @param {number} length 物理长度 (米)
   * @returns {number} 像素长度
   */
  toPixels(length: number): number {
    return length * this.scale;
  }

  /**
   * 将屏幕像素长度转换为物理长度
   * @param {number} pixels 像素长度
   * @returns {number} 物理长度 (米)
   */
  toMeters(pixels: number): number {
    return pixels / this.scale;
  }
}
