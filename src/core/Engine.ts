import { Scene } from './Scene';
import { Renderer } from './renderers/Renderer';
import { RendererFactory } from './renderers/RendererFactory';

/**
 * 主游戏循环和场景管理器。
 * 处理 requestAnimationFrame、时间管理和画布大小调整。
 */
export class Engine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  currentScene: Scene | null;
  running: boolean;
  renderer: Renderer;

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

  // 标尺 overlay
  overlayCanvas: HTMLCanvasElement;
  overlayCtx: CanvasRenderingContext2D;

  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!this.canvas) throw new Error(`Canvas with id "${canvasId}" not found`);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D rendering context');
    this.ctx = ctx;

    // 初始化渲染器（默认为 Canvas 2D）
    this.renderer = RendererFactory.createRenderer('canvas2d', this.canvas);

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

    // 创建 overlay canvas for 标尺
    this.overlayCanvas = document.createElement('canvas');
    this.overlayCanvas.style.position = 'absolute';
    this.overlayCanvas.style.top = '0';
    this.overlayCanvas.style.left = '0';
    this.overlayCanvas.style.pointerEvents = 'none';
    this.overlayCanvas.style.zIndex = '10';
    this.canvas.parentNode?.appendChild(this.overlayCanvas);
    this.overlayCtx = this.overlayCanvas.getContext('2d')!;

    // 处理大小调整
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    const parentElement = this.canvas.parentElement;
    if (parentElement) {
      this.resizeObserver.observe(parentElement);
    }
    this.handleResize(); // 初始大小

    // 监听页面缩放变化
    if ((window as any).visualViewport) {
      (window as any).visualViewport.addEventListener('resize', () => this.handleResize());
    }
  }

  /**
   * 切换到新场景。
   * 卸载旧场景并设置新场景。
   * @param {Scene} sceneInstance
   */
  loadScene(sceneInstance: Scene): void {
    console.info(`[Engine] loadScene: Loading scene instance: ${sceneInstance.constructor.name}`);

    if (this.currentScene) {
      console.info(`[Engine] loadScene: Tearing down previous scene: ${this.currentScene.constructor.name}`);
      this.currentScene.teardown();
    }

    this.currentScene = sceneInstance;
    console.info(`[Engine] loadScene: Setting renderer and resizing scene`);
    // 设置渲染器
    this.currentScene.setRenderer(this.renderer);
    // Use clientWidth/Height (logical pixels) because the context is scaled by DPR
    this.currentScene.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    console.info(`[Engine] loadScene: Calling scene.setup()`);
    this.currentScene.setup();

    // Notify external listeners that a scene has been loaded
    if (this.onSceneLoaded) {
      console.info(`[Engine] loadScene: Notifying onSceneLoaded callback`);
      this.onSceneLoaded(sceneInstance);
    }

    // 重置新场景的时间？还是保留全局时间？
    // 通常重置时间对于新的模拟感觉更自然。
    console.info(`[Engine] loadScene: Resetting time`);
    this.resetTime();

    console.info(`[Engine] loadScene: Scene loading complete`);
  }

  /**
   * 通过键名加载场景（带渲染器切换）
   * @param sceneKey 场景键名
   */
  loadSceneByKey(sceneKey: string): void {
    console.info(`[Engine] loadSceneByKey: Loading scene "${sceneKey}"`);

    // 切换渲染器（如果需要）
    this.switchRendererForScene(sceneKey);

    // 获取场景类并创建实例
    const sceneRegistry = (window as any).sceneRegistry;
    if (!sceneRegistry) {
      throw new Error('Scene registry not initialized. Ensure sceneRegistry is assigned to window.sceneRegistry in main.ts');
    }

    console.info(`[Engine] loadSceneByKey: Scene registry found, getting class for "${sceneKey}"`);
    const SceneClass = sceneRegistry.getSceneClass(sceneKey);
    if (SceneClass) {
      console.info(`[Engine] loadSceneByKey: Scene class found: ${SceneClass.name}, creating instance`);
      const sceneInstance = new SceneClass(this.canvas);
      // 确保场景实例使用正确的canvas引用
      sceneInstance.canvas = this.canvas;
      sceneInstance.viewport.canvas = this.canvas;
      console.info(`[Engine] loadSceneByKey: Scene instance created, canvas references set`);
      this.loadScene(sceneInstance);
      console.info(`[Engine] loadSceneByKey: Scene loaded successfully`);
    } else {
      console.error(`[Engine] loadSceneByKey: Scene class not found for key "${sceneKey}"`);
    }
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
      // 计算插值alpha用于平滑渲染
      const alpha = this.accumulatedTime / this.fixedDeltaTime;
      this.currentScene.renderWithRenderer(this.renderer, alpha);

      // 绘制标尺
      this.drawRuler();

      // 通知外部更新 (使用当前的物理时间)
      if (this.onUpdate) {
        this.onUpdate(this.currentScene, this.physicsTime);
      }
    } else {
      console.warn(`[Engine] loop: No current scene to render`);
    }

    requestAnimationFrame(this.loop);
  }

  handleResize(): void {
    const parent = this.canvas.parentElement;
    if (parent) {
      // 获取设备像素比，默认为 1
      const dpr = window.devicePixelRatio || 1;

      // 获取页面缩放比例，如果支持
      const scale = (window as any).visualViewport?.scale || 1;

      // 设置画布的物理像素大小，根据缩放比例调整逻辑大小
      const width = parent.clientWidth;
      const height = parent.clientHeight;
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;

      // 设置画布的 CSS 显示大小
      this.canvas.style.width = `${width}px`;
      this.canvas.style.height = `${height}px`;

      // 设置 overlay canvas
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
      this.overlayCanvas.style.width = `${width}px`;
      this.overlayCanvas.style.height = `${height}px`;

      // 缩放绘图上下文，使得后续的绘图操作可以直接使用逻辑像素坐标
      this.ctx.scale(dpr, dpr);

      if (this.currentScene) {
        // 传递逻辑像素大小给场景
        this.currentScene.resize(width, height);
        // 即使暂停也强制重新渲染
        this.currentScene.renderWithRenderer(this.renderer, 1.0);
      }
    }
  }

  /**
   * 根据场景需求切换渲染器
   * @param sceneKey 场景键名
   */
  private switchRendererForScene(sceneKey: string): void {
    const requiredRenderer = sceneKey === 'planetary-3d' ? 'threejs' : 'canvas2d';

    if (this.renderer.getType() !== requiredRenderer) {
      // 清理当前渲染器
      this.renderer.dispose();

      // 完全替换canvas元素以确保上下文完全重置
      const parent = this.canvas.parentElement;
      if (parent) {
        // 断开ResizeObserver
        this.resizeObserver.disconnect();

        // 创建新的canvas元素
        const newCanvas = document.createElement('canvas');
        newCanvas.id = this.canvas.id;
        newCanvas.className = this.canvas.className;
        newCanvas.style.cssText = this.canvas.style.cssText;
        newCanvas.style.border = "1px solid white"; // 设置白色边框

        // 设置canvas尺寸，根据缩放比例调整
        const dpr = window.devicePixelRatio || 1;
        const scale = (window as any).visualViewport?.scale || 1;
        const width = parent.clientWidth;
        const height = parent.clientHeight;
        newCanvas.width = width * dpr;
        newCanvas.height = height * dpr;
        newCanvas.style.width = `${width}px`;
        newCanvas.style.height = `${height}px`;

        // 替换DOM中的canvas
        parent.replaceChild(newCanvas, this.canvas);

        // 更新canvas引用
        this.canvas = newCanvas;

        // 更新 overlay 到新canvas
        this.canvas.parentNode?.appendChild(this.overlayCanvas);

        // 如果是Canvas 2D渲染器，获取2D上下文
        if (requiredRenderer === 'canvas2d') {
          const ctx = this.canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get 2D rendering context');
          this.ctx = ctx;
        }

        // 重新设置ResizeObserver
        this.resizeObserver.observe(parent);
      }

      // 创建新的渲染器
      this.renderer = RendererFactory.createRenderer(requiredRenderer, this.canvas);

      // 如果有当前场景，重新设置渲染器和canvas引用
      if (this.currentScene) {
        // 更新场景的canvas引用
        this.currentScene.canvas = this.canvas;
        // 更新视口的canvas引用
        this.currentScene.viewport.canvas = this.canvas;

        this.currentScene.setRenderer(this.renderer);
        this.currentScene.resize(this.canvas.clientWidth, this.canvas.clientHeight);
      }

      // 立即调整大小
      this.handleResize();
    }
  }

  /**
   * 绘制右侧标尺
   */
  private drawRuler(): void {
    const ctx = this.overlayCtx;
    const width = this.overlayCanvas.width;
    const height = this.overlayCanvas.height;

    // 清空 overlay
    ctx.clearRect(0, 0, width, height);

    // 设置样式
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    // 右侧标尺线
    ctx.beginPath();
    ctx.moveTo(width - 20, 0);
    ctx.lineTo(width - 20, height);
    ctx.stroke();

    // 从上向下每100像素标注数字，顶部为0
    for (let y = 0; y <= height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(width - 15, y);
      ctx.lineTo(width - 25, y);
      ctx.stroke();
      ctx.fillText(y.toString(), width - 35, y + 4);
    }
  }
}
