# 物理引擎架构优化建议

基于对当前项目代码的分析，目前的架构设计清晰且轻量，但为了提升物理模拟的精确性、可维护性和扩展性，建议进行以下层面的优化。

## 1. 核心物理层：引入“固定时间步长” (Fixed Time Step)

**现状与问题**：
目前 `Engine.js` 直接将渲染帧的间隔 `dt` (Variable Delta Time) 传给物理更新。
由于屏幕刷新率不稳定（60Hz, 144Hz 或卡顿），可变的 `dt` 会导致物理积分结果不一致，甚至在低帧率下出现穿墙现象。

**建议方案**：
采用 **"Accumulator" 模式**，将物理更新与渲染循环解耦。

*   设定固定的物理时间步长（例如 `fixedDeltaTime = 1/60` 秒）。
*   在主循环中累加时间，当累加时间超过 `fixedDeltaTime` 时执行物理更新。
*   渲染时可以使用剩余时间进行插值，以获得极致的平滑度。

**代码示例 (Engine.js)**：
```javascript
// 伪代码示例
loop(timestamp) {
  let dt = (timestamp - this.lastFrameTime) / 1000;
  this.accumulator += dt;

  // 核心：消耗累加的时间进行物理更新
  while (this.accumulator >= this.fixedDeltaTime) {
    this.currentScene.update(this.fixedDeltaTime); 
    this.accumulator -= this.fixedDeltaTime;
  }

  // 渲染
  this.currentScene.render(this.ctx);
}
```

## 2. 渲染层：抽象“坐标系统” (Viewport/Camera)

**现状与问题**：
`Scene` 类直接持有 `width` 和 `height`，场景实现中直接混合了“像素坐标”和“物理单位（米）”。
这导致调整窗口大小时物体可能变形，且编写场景时需要手动处理繁琐的坐标映射（`x * scale + offsetX`）。

**建议方案**：
引入 `Viewport` 或 `Camera` 类。

*   **物理世界**：只关心标准单位（米、千克、秒）。坐标原点通常在 (0,0)。
*   **渲染器**：负责将物理坐标 $(x, y)$ 映射到屏幕像素 $(u, v)$。
*   场景代码只需关注物理逻辑，渲染器自动处理缩放和平移。

## 3. 逻辑层：解耦 UI 与 状态 (Event System)

**现状与问题**：
`main.js` 通过回调函数硬连接了组件，`ControlPanel` 直接修改 `scene.params`。
这种强耦合使得添加“重置参数”等功能变得困难，且 `main.js` 承担了过多的胶水代码。

**建议方案**：
引入轻量级的 **事件总线 (Event Bus)** 或 **信号 (Signals)**。

*   `Scene` 不直接暴露 `params` 对象引用，而是暴露配置。
*   UI 变动触发事件：`controlPanel.emit('change', { key: 'gravity', value: 9.8 })`。
*   场景监听事件更新状态，反之亦然。

## 4. 工程化：迁移至 TypeScript

**现状与问题**：
物理引擎涉及大量数学运算 (`Vector2`, `Matrix`)。JavaScript 容易发生类型错误（如 `undefined + number` 导致 `NaN`），且难以排查。

**建议方案**：
引入 TypeScript。
*   利用 Interface 规范 `Scene` 的生命周期和配置结构。
*   利用类型系统确保数学运算的安全性。

## 5. 算法层：通用积分器 (Integrator)

**现状与问题**：
每个 `Scene` 目前都在 `update` 方法中手写物理公式（如 `x += v * dt`）。

**建议方案**：
提取通用的积分器模块，提供多种算法选择：
*   **Euler (欧拉法)**: 简单，但误差较大。
*   **Verlet (韦尔莱法)**: 能量守恒性好，适合粒子系统。
*   **Runge-Kutta 4 (RK4)**: 高精度，适合复杂模拟。

场景只需定义受力函数 `F(state, t)`，由积分器自动计算下一帧状态。
