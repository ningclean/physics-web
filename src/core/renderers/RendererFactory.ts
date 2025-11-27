import { Renderer } from './Renderer';
import { Canvas2DRenderer } from './Canvas2DRenderer';
import { ThreeRenderer } from './ThreeRenderer';

/**
 * 渲染器工厂类
 * 负责创建不同类型的渲染器实例
 */
export class RendererFactory {
  static createRenderer(type: 'canvas2d' | 'threejs', canvas: HTMLCanvasElement): Renderer {
    switch (type) {
      case 'canvas2d':
        return new Canvas2DRenderer(canvas);
      case 'threejs':
        return new ThreeRenderer(canvas);
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }
  }
}