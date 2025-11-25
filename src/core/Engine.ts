import { Scene } from './Scene';

/**
 * 主游戏循环和场景管理器。
 * 处理 requestAnimationFrame、时间管理和画布大小调整。
 */
export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentScene: Scene | null;
  running: boolean;

  // 时间管理
  lastFrameTime: number;
  accumulatedTime: number;
  startTime: number;
  pauseStartTime: number;
  totalPausedTime: number;

  // 固定时间步长 (60 FPS)
  fixedDeltaTime: number;
  // 物理模拟的总时间 (用于替代 elapsed)
  physicsTime: number;

  // 外部回调，用于在每帧更新后通知外部（例如更新图表）
  onUpdate: ((scene: Scene, physicsTime: number) => void) | null;
  onSceneLoaded: ((scene: Scene) => void) | null;

  // 处理大小调整
  resizeObserver: ResizeObserver;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id "${canvasId}" not found`);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;

    this.currentScene = null;
    this.running = false;

    // 时间管理
    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
    this.startTime = 0;
    this.pauseStartTime = 0;
    this.totalPausedTime = 0;

    // 固定时间步长 (60 FPS)
    this.fixedDeltaTime = 1 / 60;
    // 物理模拟的总时间 (用于替代 elapsed)
    this.physicsTime = 0;

    // 外部回调，用于在每帧更新后通知外部（例如更新图表）
    this.onUpdate = null;
    this.onSceneLoaded = null;

    // 绑定循环以保留 'this'
    this.loop = this.loop.bind(this);

    // 处理大小调整
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    const parentElement = this.canvas.parentElement;
    if (parentElement) {
      this.resizeObserver.observe(parentElement);
    }
    this.handleResize(); // 初始大小
  }

  /**
   * 切换到新场景。
   * 卸载旧场景并设置新场景。
   * @param {Scene} sceneInstance
   */
  loadScene(sceneInstance: Scene): void {
    if (this.currentScene) {
      this.currentScene.teardown();
    }

    this.currentScene = sceneInstance;
    // Use clientWidth/Height (logical pixels) because the context is scaled by DPR
    this.currentScene.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.currentScene.setup();

    // Notify external listeners that a scene has been loaded
    if (this.onSceneLoaded) {
      this.onSceneLoaded(sceneInstance);
    }

    // 重置新场景的时间？还是保留全局时间？
    // 通常重置时间对于新的模拟感觉更自然。
    this.resetTime();
  }

  start(): void {
    if (!this.running) {
      this.running = true;
      this.lastFrameTime = performance.now();

      // 如果我们暂停了，计算那段时间
      if (this.pauseStartTime > 0) {
        this.totalPausedTime += performance.now() - this.pauseStartTime;
        this.pauseStartTime = 0;
      } else {
        // 第一次启动
        this.startTime = this.lastFrameTime;
      }

      requestAnimationFrame(this.loop);
    }
  }

  pause(): void {
    if (this.running) {
      this.running = false;
      this.pauseStartTime = performance.now();
    }
  }

  toggle(): void {
    if (this.running) this.pause();
    else this.start();
  }

  resetTime(): void {
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.totalPausedTime = 0;
    this.pauseStartTime = 0;
    this.accumulatedTime = 0;
    this.physicsTime = 0;
  }

  get elapsed(): number {
    // 返回物理模拟的时间，而不是挂钟时间
    // 这保证了物理状态与时间的一致性
    return this.physicsTime;
  }

  loop(timestamp: number): void {
    if (!this.running) return;

    let dt = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;

    // 限制 dt 以防止标签页后台运行时出现巨大跳跃 (最大允许 0.25s 的跳跃)
    if (dt > 0.25) dt = 0.25;

    this.accumulatedTime += dt;

    if (this.currentScene) {
      // 核心：消耗累加的时间进行物理更新
      // 使用 while 循环确保物理模拟赶上渲染时间
      while (this.accumulatedTime >= this.fixedDeltaTime) {
        this.currentScene.update(this.fixedDeltaTime, this.physicsTime);
        this.physicsTime += this.fixedDeltaTime;
        this.accumulatedTime -= this.fixedDeltaTime;
      }

      // 清除画布 (使用逻辑坐标，因为已经 scale 了)
      // 注意：clearRect 受 scale 影响，所以这里清除的区域是逻辑像素区域
      // 但为了保险起见，清除足够大的区域，或者重置 transform 后清除
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵为单位矩阵
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // 使用物理像素清除
      this.ctx.restore(); // 恢复之前的变换 (包括 dpr 缩放)

      // 渲染
      this.currentScene.render(this.ctx);

      // 通知外部更新 (使用当前的物理时间)
      if (this.onUpdate) {
        this.onUpdate(this.currentScene, this.physicsTime);
      }
    }

    requestAnimationFrame(this.loop);
  }

  handleResize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      // 获取设备像素比，默认为 1
      const dpr = window.devicePixelRatio || 1;

      // 设置画布的物理像素大小
      this.canvas.width = parent.clientWidth * dpr;
      this.canvas.height = parent.clientHeight * dpr;

      // 设置画布的 CSS 显示大小
      this.canvas.style.width = `${parent.clientWidth}px`;
      this.canvas.style.height = `${parent.clientHeight}px`;

      // 缩放绘图上下文，使得后续的绘图操作可以直接使用逻辑像素坐标
      this.ctx.scale(dpr, dpr);

      if (this.currentScene) {
        // 传递逻辑像素大小给场景
        this.currentScene.resize(parent.clientWidth, parent.clientHeight);
        // 即使暂停也强制重新渲染
        this.currentScene.render(this.ctx);
      }
    }
  }
}
