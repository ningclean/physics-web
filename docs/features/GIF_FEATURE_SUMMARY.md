# GIF 录制与缩略图功能开发总结

## 1. 功能概述
为了提升物理引擎首页的视觉效果，我们开发了一套内置的 GIF 录制工具，允许用户直接在浏览器中录制当前物理场景的动画，并将其作为首页卡片的动态缩略图。

## 2. 技术实现细节

### 2.1 核心库集成
- **库**: `gif.js` (基于 JavaScript 的 GIF 编码器)
- **部署**: 为了避免 Web Worker 的跨域问题 (CORS)，我们将 `gif.js` 和 `gif.worker.js` 下载并托管在项目的 `public/` 目录下。

### 2.2 录制逻辑 (`src/components/ControlPanel.js`)
- **帧捕获**: 使用 HTML5 Canvas API (`ctx.drawImage`) 将当前渲染的画面绘制到离屏 Canvas 上。
- **背景处理**: 为了防止透明背景导致的"重影" (Ghosting) 问题，每次绘制前强制填充黑色背景 (`#000000`)。
- **消除锯齿**: 移除了之前的缩放逻辑 (Scale = 1.0)，保持原始分辨率以获得清晰边缘。
- **Dispose Method**: 设置 GIF 帧的处置方法为 `2` (Restore to Background)，确保每一帧都是独立的，避免残影。

### 2.3 智能时长与帧率控制
为了平衡文件大小（作为缩略图）和动画流畅度，我们实现了一套灵活的录制策略：
- **目标帧数**: 固定为 **20帧** (保证文件体积小)。
- **播放倍速**: 最终调整为 **1.5倍速** (兼顾动态感与真实感)。
- **时长计算**:
    - 默认时长：2秒。
    - 物理适配：各个场景类 (`Scene`) 实现了 `getRecordingDuration()` 方法，根据物理周期（如单摆周期 $T = 2\pi\sqrt{L/g}$）自动计算最佳录制时长，确保动画首尾相接，实现完美循环。

### 2.4 文件保存
- **API**: 优先使用 `window.showSaveFilePicker` API。
- **体验**: 用户点击录制后，可以直接选择保存位置和文件名（默认为 `{sceneKey}.gif`），无需手动重命名。
- **兼容性**: 如果浏览器不支持该 API，自动降级为传统的 `<a>` 标签下载方式。

## 3. 缩略图系统集成

### 3.1 目录结构
所有生成的 GIF 文件统一存放于：
```
public/thumbnails/
├── pendulum.gif
├── wave-interference.gif
├── planetary-motion.gif
...
```

### 3.2 首页渲染 (`src/main.js`)
- **注册表更新**: 在 `sceneRegistry` 中为每个场景添加了 `thumbnail` 属性。
- **加载逻辑**:
    1. 尝试加载配置的 GIF 路径。
    2. 支持 `.gif`, `.webm`, `.mp4` (视频自动播放) 和静态图片。
    3. **容错机制**: 如果图片加载失败 (`onerror`) 或未配置，自动回退显示默认的 Emoji 图标 (⚛️)，确保界面整洁。

## 4. 使用指南

### 如何录制新图标
1. 进入任意物理场景。
2. 调整参数（如摆长、重力等）以获得理想的视觉效果。
3. 点击控制面板底部的 **"录制 GIF"** 按钮。
4. 等待进度条完成。
5. 保存文件到 `public/thumbnails/` 目录，文件名为对应的场景 Key (如 `circular.gif`)。
6. 刷新首页即可看到效果。

### 如何调整录制参数
如果需要修改录制速度或帧数，请编辑 `src/components/ControlPanel.js` 中的 `recordGif` 方法：
```javascript
// Flexible Recording Logic
const targetFrames = 20; // 目标帧数
const playbackSpeedup = 1.5; // 播放倍速
```

## 5. 已完成工作列表
- [x] 集成 gif.js 库
- [x] 实现 Canvas 录制与 GIF 编码
- [x] 解决透明背景重影问题
- [x] 解决画面锯齿问题
- [x] 实现基于物理周期的自动时长计算
- [x] 实现文件系统 API 直接保存
- [x] 建立 thumbnails 目录结构
- [x] 更新首页代码支持 GIF 显示与回退
- [x] 编写操作文档
