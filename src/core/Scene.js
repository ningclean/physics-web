import { EventBus } from './EventBus.js';
import { Viewport } from './Viewport.js';

/**
 * 所有物理场景的基类。
 * 定义了引擎将调用的生命周期方法。
 */
export class Scene extends EventBus {
  constructor(canvas) {
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
   * @returns {Array} 控件配置数组
   */
  getControlConfig() {
    return [];
  }

  /**
   * 获取控制面板图例配置
   * @returns {Array} 图例配置数组
   */
  getLegendConfig() {
    return [];
  }

  /**
   * 获取公式显示配置
   * @returns {Array} 公式配置数组
   */
  getFormulaConfig() {
    return [];
  }

  /**
   * 获取图表配置
   * @returns {Object} 图表配置对象 { vel: { label, series }, acc: { label, series } }
   */
  getChartConfig() {
    return null;
  }

  /**
   * 获取用于监控的数据（图表数据）
   * @param {number} t 当前时间
   * @returns {Object} { t, vel: [], acc: [] }
   */
  getMonitorData(t) {
    return null;
  }

  /**
   * 获取场景的物理原理解析内容 (HTML)
   * @returns {string} HTML 字符串
   */
  getDescription() {
    return null;
  }

  /**
   * 获取建议的录制时长 (秒)
   * 用于生成完美循环的 GIF
   * @returns {number|null} 建议时长，如果为 null 则使用默认值
   */
  getRecordingDuration() {
    return null;
  }

  /**
   * 每一帧调用，用于更新物理状态。
   * @param {number} dt - 自上一帧以来的时间增量（秒）
   * @param {number} t - 总经过时间（秒）
   */
  update(dt, t) {
    // 在子类中重写
  }

  /**
   * 每一帧调用，用于绘制到画布。
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    // 在子类中重写
  }

  /**
   * 当窗口大小调整时调用。
   * @param {number} width
   * @param {number} height
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.viewport.resize(width, height);
  }

  /**
   * 当切换离开此场景时调用。
   * 清理事件监听器、定时器等。
   */
  teardown() {
    console.log('Scene teardown');
  }

  /**
   * 获取画布中心的辅助方法
   */
  get center() {
    return { x: this.width / 2, y: this.height / 2 };
  }
}
