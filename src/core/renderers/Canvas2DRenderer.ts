import { Renderer } from './Renderer';

/**
 * Canvas 2D 渲染器
 * 封装现有的 Canvas 2D 渲染逻辑
 */
export class Canvas2DRenderer extends Renderer {
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
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
    this.canvas.width = width;
    this.canvas.height = height;
  }

  dispose(): void {
    // Canvas 2D 不需要特殊清理
  }

  getType(): 'canvas2d' {
    return 'canvas2d';
  }

  /**
   * 获取 Canvas 2D 上下文
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
}