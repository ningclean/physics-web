import { Renderer } from './Renderer';

/**
 * Canvas 2D 渲染器
 * 封装现有的 Canvas 2D 渲染逻辑
 */
export class Canvas2DRenderer extends Renderer {
  private ctx: CanvasRenderingContext2D; // Canvas 2D 渲染上下文

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取2D上下文');
    }
    this.ctx = ctx;
  }

  render(): void {
    // Canvas 2D 的渲染由具体的场景类处理
    // 这里主要提供上下文访问
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width; // 设置物理宽度
    this.canvas.height = height; // 设置物理高度
  }

  dispose(): void {
    // Canvas 2D 不需要特殊清理
  }

  getType(): 'canvas2d' {
    return 'canvas2d';
  }

  /**
   * 获取 Canvas 2D 上下文
   * 用于在场景中进行2D绘制操作
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}