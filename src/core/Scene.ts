import { EventBus } from './EventBus';
import { Viewport } from './Viewport';
import { Renderer } from './renderers/Renderer';

/**
 * 场景控制配置接口
 */
interface ControlConfig {
  type: 'range' | 'boolean' | 'action' | 'select' | 'color';
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value?: any;
  options?: Array<{ value: any; label: string }>;
  onClick?: () => void;
}

/**
 * 图例配置接口
 */
interface LegendConfig {
  color: string;
  label: string;
  shape?: 'circle' | 'square' | 'line';
}

/**
 * 公式配置接口
 */
interface FormulaConfig {
  label?: string;
  tex: string;
  params?: Array<{ symbol: string; desc: string }>;
}

/**
 * 图表配置接口
 */
interface ChartConfig {
  vel?: {
    label: string;
    series: string[];
  };
  acc?: {
    label: string;
    series: string[];
  };
}

/**
 * 监控数据接口
 */
interface MonitorData {
  t: number;
  vel: number[];
  acc: number[];
}

/**
 * 所有物理场景的基类。
 * 定义了引擎将调用的生命周期方法。
 */
export class Scene extends EventBus {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  viewport: Viewport;
  protected renderer: Renderer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    this.viewport = new Viewport(canvas);
  }

  /**
   * 当场景首次加载时调用。
   * 用于初始化物理状态、事件监听器等。
   */
  setup() {
    console.log('Scene setup');
  }

  /**
   * 获取控制面板配置
   * @returns {ControlConfig[]} 控件配置数组
   */
  getControlConfig(): ControlConfig[] {
    return [];
  }

  /**
   * 获取控制面板图例配置
   * @returns {LegendConfig[]} 图例配置数组
   */
  getLegendConfig(): LegendConfig[] {
    return [];
  }

  /**
   * 获取公式显示配置
   * @returns {FormulaConfig[]} 公式配置数组
   */
  getFormulaConfig(): FormulaConfig[] {
    return [];
  }

  /**
   * 获取图表配置
   * @returns {ChartConfig | null} 图表配置对象 { vel: { label, series }, acc: { label, series } }
   */
  getChartConfig(): ChartConfig | null {
    return null;
  }

  /**
   * 获取用于监控的数据（图表数据）
   * @param {number} t 当前时间
   * @returns {MonitorData | null} { t, vel: [], acc: [] }
   */
  getMonitorData(t: number): MonitorData | null {
    return null;
  }

  /**
   * 获取场景的物理原理解析内容 (HTML)
   * @returns {string | null} HTML 字符串
   */
  getDescription(): string | null {
    return null;
  }

  /**
   * 获取建议的录制时长 (秒)
   * 用于生成完美循环的 GIF
   * @returns {number | null} 建议时长，如果为 null 则使用默认值
   */
  getRecordingDuration(): number | null {
    return null;
  }

  /**
   * 每一帧调用，用于更新物理状态。
   * @param {number} dt - 自上一帧以来的时间增量（秒）
   * @param {number} t - 总经过时间（秒）
   */
  update(dt: number, t: number): void {
    // 在子类中重写
  }

  /**
   * 每一帧调用，用于绘制到画布。
   * @param {CanvasRenderingContext2D} ctx
   * @deprecated 使用 renderWithRenderer 方法替代
   */
  render(ctx: CanvasRenderingContext2D): void {
    // 在子类中重写
  }

  /**
   * 使用指定的渲染器进行渲染
   * @param renderer 渲染器实例
   * @param alpha 插值因子 (0-1)，用于平滑动画
   */
  renderWithRenderer(renderer: Renderer, alpha: number = 1.0): void {
    if (renderer.getType() === 'canvas2d') {
      // 对于 Canvas 2D 渲染器，使用传统方法
      const canvasRenderer = renderer as any;
      if (canvasRenderer.getContext) {
        const ctx = canvasRenderer.getContext();
        this.render(ctx);
      } else {
        console.error(`[Scene] renderWithRenderer: Failed to get 2D context from renderer`);
      }
    } else {
      // 对于 3D 渲染器，子类需要重写此方法
      // console.log('[Scene] renderWithRenderer: Calling 3D render');
      this.render3D(renderer);
      renderer.render();
    }
  }

  /**
   * 3D 渲染方法，子类可以重写
   * @param renderer 3D 渲染器
   */
  protected render3D(renderer: Renderer): void {
    // 默认实现为空，3D 场景需要重写此方法
  }

  /**
   * 当窗口大小调整时调用。
   * @param {number} width
   * @param {number} height
   */
  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.viewport.resize(width, height);
    console.log('Scene resize called with:', width, height);
    console.log('Scene canvas size:', this.canvas.width, this.canvas.height, 'style:', this.canvas.style.width, this.canvas.style.height);
  }

  /**
   * 当切换离开此场景时调用。
   * 清理事件监听器、定时器等。
   */
  teardown() {
    console.log('Scene teardown');
  }

  /**
   * 设置渲染器
   * @param renderer 渲染器实例
   */
  setRenderer(renderer: Renderer): void {
    this.renderer = renderer;
  }

  /**
   * 获取当前渲染器
   */
  getRenderer(): Renderer | null {
    return this.renderer;
  }
}
