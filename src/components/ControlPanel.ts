import { THEME } from '../config.ts';
import { EventBus } from '../core/EventBus.ts';

/**
 * 控件配置接口
 */
interface ControlConfig {
  type: 'range' | 'boolean' | 'color' | 'select' | 'action';
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value?: any;
  options?: Array<{ value: any; label: string }>;
  onClick?: () => void;
  description?: string;
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
 * 引擎接口
 */
interface Engine {
  isPaused: boolean;
  togglePause(): void;
  reset(): void;
  setChartWindow(seconds: number): void;
}

/**
 * 基于配置对象生成 UI 控件。
 */
export class ControlPanel extends EventBus {
  container: HTMLElement | null;
  engine: Engine;
  controls: Map<string, any>;
  sceneKey: string;

  constructor(containerId: string, engine: Engine) {
    super();
    this.container = document.getElementById(containerId);
    this.engine = engine;
    this.controls = new Map();
    this.sceneKey = 'scene';

    if (!this.container) {
      console.warn(`Control panel container #${containerId} not found`);
    }
  }

  clear() {
    if (this.container) this.container.innerHTML = '';
    this.controls.clear();
  }

  /**
   * 将控件绑定到场景的参数。
   * @param {Object} params - 要修改的参数对象
   * @param {ControlConfig[]} config - 控件定义数组
   *
   * 配置格式:
   * [
   *   { type: 'range', key: 'omega', label: 'Angular Velocity', min: 0.1, max: 5, step: 0.1 },
   *   { type: 'boolean', key: 'showVel', label: 'Show Velocity' },
   *   { type: 'action', label: 'Reset', onClick: () => ... }
   * ]
   * @param {LegendConfig[]} legend - 图例配置数组 (可选)
   * @param {string} sceneKey - 场景的唯一标识符 (可选)
   */
  setup(params: any, config: ControlConfig[], legend: LegendConfig[] = [], sceneKey: string = 'scene'): void {
    this.clear();
    if (!this.container) return;

    this.sceneKey = sceneKey;

    // 创建顶部栏容器
    const topBar = document.createElement('div');
    topBar.style.display = 'flex';
    topBar.style.justifyContent = 'space-between';
    topBar.style.alignItems = 'center';
    topBar.style.marginBottom = '1rem';
    topBar.style.paddingBottom = '0.5rem';
    topBar.style.borderBottom = `1px solid ${THEME.colors.ui.border}`;
    topBar.style.width = '100%';
    topBar.style.flexWrap = 'wrap';
    topBar.style.gap = '1rem';

    this.container.appendChild(topBar);

    // 1. 添加图例区域 (如果存在)
    if (legend && legend.length > 0) {
      this.addLegend(topBar, legend);
    }

    // 2. 添加全局引擎控件（暂停/恢复）
    this.addEngineControls(topBar);

    // 2.5 添加图表时间窗口控制
    this.addChartControls(topBar);

    // 3. 添加参数控件
    config.forEach(item => {
      const wrapper = document.createElement('div');
      wrapper.className = 'control-item';
      wrapper.style.marginBottom = '0.8rem';
      wrapper.style.display = 'flex';
      wrapper.style.flexDirection = 'column';

      const controlRow = document.createElement('div');
      controlRow.style.display = 'flex';
      controlRow.style.alignItems = 'center';
      controlRow.style.gap = '0.5rem';
      wrapper.appendChild(controlRow);

      if (item.type === 'range') {
        this.createRangeControl(controlRow, params, item);
      } else if (item.type === 'boolean') {
        this.createBooleanControl(controlRow, params, item);
      } else if (item.type === 'color') {
        this.createColorControl(controlRow, params, item);
      } else if (item.type === 'select') {
        this.createSelectControl(controlRow, params, item);
      } else if (item.type === 'action') {
        this.createActionControl(controlRow, item);
      }

      if (item.description) {
        const desc = document.createElement('div');
        desc.textContent = item.description;
        desc.style.fontSize = '0.75rem';
        desc.style.color = THEME.colors.ui.textSub;
        desc.style.marginTop = '0.2rem';
        desc.style.marginLeft = '0.2rem';
        wrapper.appendChild(desc);
      }

      this.container.appendChild(wrapper);
    });
  }

  addLegend(parent: HTMLElement, legendItems: LegendConfig[]): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'legend-panel';
    wrapper.style.padding = '0.5rem';
    wrapper.style.background = THEME.colors.ui.panelBg;
    wrapper.style.borderRadius = '4px';
    wrapper.style.border = `1px solid ${THEME.colors.ui.border}`;
    wrapper.style.display = 'flex';
    wrapper.style.flexWrap = 'wrap';
    wrapper.style.gap = '1rem';
    wrapper.style.fontSize = '1rem'; // 放大字体 (原 0.85rem)
    wrapper.style.flex = '1';

    legendItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.display = 'flex';
      itemDiv.style.alignItems = 'center';
      itemDiv.style.gap = '0.6rem'; // 增加间距

      // 图标
      const icon = document.createElement('span');
      icon.style.display = 'inline-block';

      if (item.type === 'line' || item.type === 'arrow') {
        icon.style.width = '40px'; // 放大一倍 (原 20px)
        icon.style.height = '4px'; // 放大一倍 (原 2px)
        icon.style.background = item.color;
        if (item.dashed) {
          icon.style.background = 'transparent';
          icon.style.borderTop = `4px dashed ${item.color}`; // 放大边框
          icon.style.height = '0';
        }
      } else if (item.type === 'dot' || item.type === 'circle') {
        icon.style.width = '20px'; // 放大一倍 (原 10px)
        icon.style.height = '20px'; // 放大一倍 (原 10px)
        icon.style.borderRadius = '50%';
        if (item.type === 'dot') {
          icon.style.background = item.color;
        } else {
          icon.style.border = `3px solid ${item.color}`; // 加粗边框
        }
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      label.style.color = THEME.colors.ui.textMain;

      itemDiv.appendChild(icon);
      itemDiv.appendChild(label);
      wrapper.appendChild(itemDiv);
    });

    parent.appendChild(wrapper);
  }

  addEngineControls(parent: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'engine-controls';
    wrapper.style.display = 'flex';
    wrapper.style.gap = '0.5rem';
    wrapper.style.flexShrink = '0'; // 防止按钮被压缩

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pause';
    pauseBtn.onclick = () => {
      this.engine.toggle();
      pauseBtn.textContent = this.engine.running ? 'Pause' : 'Resume';
    };

    const resetBtn = document.createElement('button');
    resetBtn.textContent = '重新开始';
    resetBtn.onclick = () => {
      this.engine.resetTime();
      // 重新开始时，如果场景有重置逻辑，也应该调用
      if (this.engine.currentScene && this.engine.currentScene.resetSimulation) {
        this.engine.currentScene.resetSimulation();
      }
      // 如果暂停了，也许我们想渲染一帧来显示重置状态？
      // 如果正在运行，引擎循环会处理这个，但如果暂停了，我们可能需要手动触发。
      if (!this.engine.running && this.engine.currentScene) {
        this.engine.currentScene.update(0, 0);
        this.engine.currentScene.render(this.engine.ctx);
      }
    };

    const recordBtn = document.createElement('button');
    recordBtn.textContent = this.isRecording ? '停止' : '录制';
    if (this.isRecording) {
      recordBtn.style.background = '#cc0000';
    }
    recordBtn.onclick = () => this.toggleRecording(recordBtn);

    const record10sBtn = document.createElement('button');

    // 动态获取建议时长
    const updateRecordBtnLabel = () => {
      let duration = 10;
      if (this.engine.currentScene && this.engine.currentScene.getRecordingDuration) {
        const d = this.engine.currentScene.getRecordingDuration();
        if (d) duration = d;
      }
      record10sBtn.textContent = `录制 GIF (~${duration.toFixed(1)}s)`;
      record10sBtn.dataset.duration = duration * 1000; // Store in ms
    };

    // 初始设置
    updateRecordBtnLabel();

    // 监听参数变化，更新时长
    if (this.engine.currentScene) {
      this.engine.currentScene.on('parameter-change', () => {
        updateRecordBtnLabel();
      });
    }

    record10sBtn.title = '录制 GIF 动画 (自动计算周期)';
    record10sBtn.onclick = () => {
      const duration = parseFloat(record10sBtn.dataset.duration) || 10000;
      this.recordGif(duration, record10sBtn);
    };

    wrapper.appendChild(pauseBtn);
    wrapper.appendChild(resetBtn);
    wrapper.appendChild(recordBtn);
    wrapper.appendChild(record10sBtn);
    parent.appendChild(wrapper);
  }

  addChartControls(parent: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-controls';
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '0.5rem';
    wrapper.style.marginLeft = '1rem';
    wrapper.style.fontSize = '0.85rem';

    const label = document.createElement('span');
    label.textContent = '图表时间:';
    label.style.color = THEME.colors.ui.textSub;

    const select = document.createElement('select');
    select.style.padding = '2px 5px';
    select.style.background = THEME.colors.ui.inputBg;
    select.style.color = THEME.colors.ui.textMain;
    select.style.border = `1px solid ${THEME.colors.ui.border}`;
    select.style.borderRadius = '3px';
    select.style.cursor = 'pointer';

    [10, 20, 30].forEach(sec => {
      const option = document.createElement('option');
      option.value = sec;
      option.textContent = `${sec}s`;
      if (sec === 30) option.selected = true;
      select.appendChild(option);
    });

    select.onchange = e => {
      const val = parseInt(e.target.value);
      if (window.velChart) window.velChart.setTimeWindow(val);
      if (window.accChart) window.accChart.setTimeWindow(val);
    };

    wrapper.appendChild(label);
    wrapper.appendChild(select);
    parent.appendChild(wrapper);
  }

  async recordGif(duration: number, btn: HTMLButtonElement): Promise<void> {
    if (!window.GIF) {
      alert('GIF library not loaded. Please check internet connection.');
      return;
    }

    // Ask for file path immediately (if supported)
    let fileHandle = null;
    const defaultName = `${this.sceneKey || 'scene'}.gif`;

    if (window.showSaveFilePicker) {
      try {
        fileHandle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [
            {
              description: 'GIF Image',
              accept: { 'image/gif': ['.gif'] },
            },
          ],
        });
      } catch (err) {
        // User cancelled
        if (err.name === 'AbortError') return;
      }
    }

    const canvas = this.engine.canvas;
    if (!canvas) return;

    // UI Feedback Setup
    const originalText = btn ? btn.textContent : '';
    const originalBackground = btn ? btn.style.background : '';

    if (btn) {
      btn.style.width = `${btn.offsetWidth}px`; // Lock width
      btn.disabled = true;
    }

    const updateBtn = (progress, text) => {
      if (!btn) return;
      const p = Math.round(progress * 100);
      btn.textContent = text;
      // Red progress bar with dark grey background
      btn.style.background = `linear-gradient(to right, #cc0000 ${p}%, #444 ${p}%)`;
    };

    // Reset simulation
    this.engine.resetTime();
    if (this.engine.currentScene && this.engine.currentScene.resetSimulation) {
      this.engine.currentScene.resetSimulation();
    }

    // Force render initial state (t=0)
    this.engine.ctx.save();
    this.engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.engine.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.engine.ctx.restore();
    if (this.engine.currentScene) {
      this.engine.currentScene.render(this.engine.ctx);
    }

    if (!this.engine.running) this.engine.start();

    // Configure GIF encoder
    const scale = 1.0;
    const width = canvas.width * scale;
    const height = canvas.height * scale;

    const gif = new window.GIF({
      workers: 2,
      quality: 1,
      width: width,
      height: height,
      workerScript: '/gif.worker.js',
      background: '#000000',
    });

    // Flexible Recording Logic
    // Target: 20 frames total
    // Playback Speed: 1.5x

    const targetFrames = 20;
    const recordingFps = targetFrames / (duration / 1000); // e.g. 20 / 2s = 10 FPS
    const playbackSpeedup = 1.5;

    const captureInterval = duration / targetFrames; // e.g. 2000ms / 20 = 100ms
    const gifDelay = captureInterval / playbackSpeedup; // e.g. 100ms / 1.5 = 66ms

    const totalFrames = targetFrames;
    let frameCount = 0;

    console.log(
      `Starting GIF recording: ${duration.toFixed(0)}ms, ${targetFrames} frames, interval ${captureInterval.toFixed(0)}ms`
    );

    // Create temp canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';

    // Encoding progress
    gif.on('progress', p => {
      updateBtn(p, 'Encoding...');
    });

    gif.on('finished', async blob => {
      if (fileHandle) {
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('GIF saved successfully.');
        } catch (e) {
          console.error('Save failed', e);
          downloadBlob(blob);
        }
      } else {
        downloadBlob(blob);
      }

      // Reset UI
      if (btn) {
        btn.textContent = originalText;
        btn.style.background = originalBackground;
        btn.style.width = '';
        btn.disabled = false;
      }
    });

    const downloadBlob = blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    const capture = () => {
      if (frameCount >= totalFrames) {
        clearInterval(captureFrame);
        console.log('Recording finished, encoding...');
        updateBtn(0, 'Encoding...'); // Reset bar for encoding phase
        gif.render();
        return;
      }

      // Update UI for recording
      const recProgress = frameCount / totalFrames;
      updateBtn(recProgress, 'Recording...');

      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, width, height);
      tempCtx.drawImage(canvas, 0, 0, width, height);

      gif.addFrame(tempCtx, {
        copy: true,
        delay: gifDelay,
        dispose: 2,
      });

      frameCount++;
    };

    // Capture first frame immediately
    capture();
    const captureFrame = setInterval(capture, captureInterval);
  }

  async recordCanvas(duration: number): Promise<void> {
    const canvas = this.engine.canvas;
    if (!canvas) return;

    // Reset simulation first
    this.engine.resetTime();
    if (this.engine.currentScene && this.engine.currentScene.resetSimulation) {
      this.engine.currentScene.resetSimulation();
    }

    // Ensure engine is running
    if (!this.engine.running) this.engine.start();

    const stream = canvas.captureStream(60); // 60 FPS
    const mimeType = 'video/webm;codecs=vp9';
    let options = { mimeType };
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      options = { mimeType: 'video/webm' };
    }

    const recorder = new MediaRecorder(stream, options);
    const chunks = [];

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scene-recording-${duration / 1000}s.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

    recorder.start();
    console.log(`Recording started for ${duration}ms...`);

    // Show visual feedback
    const originalTitle = document.title;
    document.title = `🔴 Recording...`;

    setTimeout(() => {
      recorder.stop();
      document.title = originalTitle;
      console.log('Recording finished.');
    }, duration);
  }

  async toggleRecording(btn: HTMLButtonElement): Promise<void> {
    if (this.isRecording) {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
      this.isRecording = false;
      // 按钮状态更新由 stop 回调处理，但为了响应迅速，这里也可以更新
      if (btn) {
        btn.textContent = '录制';
        btn.style.background = '';
      }
    } else {
      try {
        // 使用 getDisplayMedia 录制整个标签页/屏幕，以包含公式和图表
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        });

        this.chunks = [];

        // 尝试支持的 MIME 类型
        let options = { mimeType: 'video/webm;codecs=vp9' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/webm' };
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = undefined; // 让浏览器选择默认
          }
        }

        this.mediaRecorder = new MediaRecorder(stream, options);

        this.mediaRecorder.ondataavailable = e => {
          if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `physics-session-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          // 停止所有轨道
          stream.getTracks().forEach(track => track.stop());

          // 恢复按钮状态
          this.isRecording = false;
          // 查找当前的录制按钮并更新
          const currentBtn = this.container.querySelector('.engine-controls button:last-child');
          if (currentBtn && currentBtn.textContent === '停止') {
            currentBtn.textContent = '录制';
            currentBtn.style.background = '';
          }
        };

        // 监听用户通过浏览器原生UI停止共享的情况
        stream.getVideoTracks()[0].onended = () => {
          if (this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
          }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        if (btn) {
          btn.textContent = '停止';
          btn.style.background = '#cc0000';
        }
      } catch (e) {
        console.error('Recording failed:', e);
        // 用户取消选择时也会抛出错误，忽略即可
      }
    }
  }

  createRangeControl(parent: HTMLElement, params: any, config: ControlConfig): void {
    const label = document.createElement('label');
    label.textContent = `${config.label}: `;
    label.style.fontSize = '0.9rem';
    label.style.minWidth = '120px';

    const valSpan = document.createElement('span');
    valSpan.textContent = params[config.key].toFixed(2);
    valSpan.style.display = 'inline-block';
    valSpan.style.width = '40px';
    valSpan.style.textAlign = 'right';
    valSpan.style.marginRight = '0.5rem';
    valSpan.style.fontFamily = 'monospace';

    const input = document.createElement('input');
    input.type = 'range';
    input.min = config.min;
    input.max = config.max;
    input.step = config.step || (config.max - config.min) / 100;
    input.value = params[config.key];

    input.oninput = e => {
      const val = parseFloat(e.target.value);
      // 直接修改 params，确保所有场景都能响应
      params[config.key] = val;
      valSpan.textContent = val.toFixed(2);

      this.emit('parameter-change', { key: config.key, value: val });

      if (config.onChange) config.onChange(val);

      // 调节参数时，根据配置决定是否重置场景
      // 默认为 true (为了兼容旧代码)，除非显式设置为 false
      const shouldReset = config.resetOnChange !== false;

      if (shouldReset) {
        this.emit('request-reset');
      }
    };

    parent.appendChild(label);
    parent.appendChild(valSpan);
    parent.appendChild(input);
  }

  createBooleanControl(parent: HTMLElement, params: any, config: ControlConfig): void {
    const label = document.createElement('label');
    label.style.fontSize = '0.9rem';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.style.cursor = 'pointer';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = params[config.key];
    input.style.marginRight = '0.5rem';

    input.onchange = e => {
      params[config.key] = e.target.checked;
      this.emit('parameter-change', { key: config.key, value: e.target.checked });
      if (config.onChange) config.onChange(e.target.checked);
    };

    label.appendChild(input);
    label.appendChild(document.createTextNode(config.label));
    parent.appendChild(label);
  }

  createColorControl(parent: HTMLElement, params: any, config: ControlConfig): void {
    const label = document.createElement('label');
    label.textContent = `${config.label}: `;
    label.style.fontSize = '0.9rem';
    label.style.minWidth = '120px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';

    const input = document.createElement('input');
    input.type = 'color';
    input.value = params[config.key];
    input.style.border = 'none';
    input.style.width = '40px';
    input.style.height = '24px';
    input.style.cursor = 'pointer';
    input.style.backgroundColor = 'transparent';

    input.oninput = e => {
      params[config.key] = e.target.value;
      this.emit('parameter-change', { key: config.key, value: e.target.value });
      if (config.onChange) config.onChange(e.target.value);
    };

    parent.appendChild(label);
    parent.appendChild(input);
  }

  createSelectControl(parent: HTMLElement, params: any, config: ControlConfig): void {
    const label = document.createElement('label');
    label.textContent = `${config.label}: `;
    label.style.fontSize = '0.9rem';
    label.style.minWidth = '120px';
    label.style.display = 'flex';
    label.style.alignItems = 'center';

    const select = document.createElement('select');
    select.style.padding = '2px 5px';
    select.style.background = THEME.colors.ui.inputBg;
    select.style.color = THEME.colors.ui.textMain;
    select.style.border = `1px solid ${THEME.colors.ui.border}`;
    select.style.borderRadius = '3px';
    select.style.cursor = 'pointer';

    config.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      if (params[config.key] === opt.value) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.onchange = e => {
      const val = e.target.value;
      params[config.key] = val;
      this.emit('parameter-change', { key: config.key, value: val });
      if (config.onChange) config.onChange(val);
    };

    parent.appendChild(label);
    parent.appendChild(select);
  }

  createActionControl(parent: HTMLElement, config: ControlConfig): void {
    const btn = document.createElement('button');
    btn.textContent = config.label;
    btn.onclick = config.onClick;
    parent.appendChild(btn);
  }
}
