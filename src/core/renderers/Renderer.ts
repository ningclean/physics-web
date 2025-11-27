/**
 * 渲染器抽象基类
 * 支持 2D Canvas 和 3D Three.js 渲染
 */
export abstract class Renderer {
  protected canvas: HTMLCanvasElement;
  protected width: number;
  protected height: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.clientWidth || 800;
    this.height = canvas.clientHeight || 600;
  }

  /**
   * 渲染一帧
   */
  abstract render(): void;

  /**
   * 调整画布大小
   */
  abstract resize(width: number, height: number): void;

  /**
   * 清理资源
   */
  abstract dispose(): void;

  /**
   * 获取渲染器类型
   */
  abstract getType(): 'canvas2d' | 'threejs';
}