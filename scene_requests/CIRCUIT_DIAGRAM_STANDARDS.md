# 电路图绘制标准与规范 (Circuit Diagram Standards)

本文档总结了在本项目中绘制电路图（串联、并联、混联）时的布局习惯、视觉风格与交互规范。在后续开发新电路场景时，请严格遵循以下标准。

## 1. 视觉风格 (Visual Style)

### 1.1 颜色规范
*   **导线颜色**：统一使用红色 `#d32f2f`。
*   **背景颜色**：深色背景 `#1a1a1a`，以突出发光组件（如灯泡）。
*   **连接点**：**移除**导线连接处的黑色小圆点（Joint Dots），保持线路整洁。

### 1.2 组件连接细节
*   **精确连接**：导线必须连接到组件的**具体接线柱**，严禁直接连接到组件中心或悬空。
    *   **灯泡 (LightBulb)**：导线应连接到底座的左右两侧接线柱（通常偏移量为 `x +/- 6px`）。
    *   **开关 (Switch)**：导线连接到开关底座两侧的端点。
*   **电池动画**：电流动画路径**不可穿过电池内部**。
    *   正确路径：从电池正极（上方）出发 -> 经过外电路 -> 回到电池负极（下方）。

## 2. 图形布局 (Layout & Routing)

### 2.1 空间规划
*   **画布宽度**：场景左右边界建议扩展至 `cx +/- 240px`，为复杂电路预留空间。
*   **垂直间距**：多支路电路中，支路间的垂直间距建议为 `80px`，确保组件不拥挤。

### 2.2 曼哈顿布线 (Manhattan Routing)
*   **横平竖直**：所有导线走向必须严格遵循水平或垂直方向。
*   **汇流排结构**：在并联/混联电路中，使用垂直导线作为“汇流排”（Bus Bar）。
    *   **分流节点 (Node A)**：垂直线，连接各支路入口。
    *   **汇流节点 (Node B)**：垂直线，连接各支路出口。

### 2.3 规范的回流路径 (Outer Loop Return)
*   **外绕回流**：为了避免回流线穿过电路中心造成视觉杂乱，采用“外绕”方式。
    *   路径：汇流节点 (Node B) -> 向右延伸 (`w10`) -> 向下延伸至底部 (`w11`) -> 向左长线回到电池 (`w9`)。

### 2.4 混合电路特例
*   **紧凑串联**：在混联电路中，干路上的串联部分（如 S1, L1）应尽量紧凑，为后方的并联部分腾出空间。
*   **居中分布**：支路上的组件（如 S2, L2）应在支路导线段中居中分布，且组件间必须有清晰的导线连接。

## 3. 交互规范 (Interaction)

### 3.1 开关交互
*   **点击切换**：所有开关组件（S1, S2 等）必须支持点击事件，点击后切换 `true/false` 状态。
*   **鼠标样式**：当鼠标悬停在可交互组件（开关）上时，光标应变为手型 (`pointer`)；否则为默认 (`default`)。
*   **实现方式**：
    *   在 `render` 循环中注册 `hitRegions`。
    *   监听 `click` 和 `mousemove` 事件进行命中检测。

## 4. 示例代码片段

### 4.1 交互实现模板
```javascript
// 在 render 中注册区域
drawSwitch(ctx, x, y, width, !isOpen);
this.registerHitRegion('switch_id', x, y, width, height);

// 事件处理
handleMouseMove(e) {
    // ... 计算鼠标位置 ...
    // 检查 hitRegions，设置 cursor
    this.canvas.style.cursor = hit ? 'pointer' : 'default';
}

handleClick(e) {
    // ... 检查 hitRegions ...
    if (hit) {
        this.params.switchState = !this.params.switchState;
    }
}
```

### 4.2 灯泡连接示例
```javascript
// 假设灯泡中心在 l1X
const offset = 6; // 接线柱偏移量
// 左侧连线
drawWire(ctx, [{x: prevX, y: y}, {x: l1X - offset, y: y}], '#d32f2f');
// 右侧连线
drawWire(ctx, [{x: l1X + offset, y: y}, {x: nextX, y: y}], '#d32f2f');
// 绘制灯泡
drawLightBulb(ctx, l1X, y, size, isOn, color);
```

---
*最后更新: 2025-11-24*
