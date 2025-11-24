# 首页与路由功能需求文档

## 1. 概述
构建一个可视化的首页，展示所有物理场景的卡片列表。用户可以通过点击卡片进入对应的模拟场景。使用 URL Hash 实现轻量级路由，支持浏览器后退功能。

## 2. 视图结构
应用将分为两个互斥的视图容器：

### 2.1 首页视图 (`#home-view`)
*   **Header**: 应用标题 (Physics Lab), 副标题/简介。
*   **Grid**: 响应式网格布局，展示场景卡片。
*   **Footer**: 版权信息/链接。

### 2.2 模拟视图 (`#simulation-view`)
*   **Navbar**:
    *   [< 返回] 按钮：点击返回首页。
    *   场景标题。
    *   场景选择器 (保留，作为二级导航)。
*   **Content**: 现有的 Canvas、控制面板、图表区域。

## 3. 场景卡片设计
每个卡片包含：
*   **缩略图**：静态图片 (方案 B)。
    *   路径：`public/thumbnails/{sceneKey}.png`
    *   尺寸建议：300x200px (1.5:1)。
    *   Fallback：如果图片加载失败，显示默认占位图或纯色背景+图标。
*   **标题**：场景名称 (如 "单摆")。
*   **简介**：一句话描述 (从场景配置中获取)。

## 4. 路由逻辑 (Hash Router)

| URL Hash | 视图状态 | 行为 |
| :--- | :--- | :--- |
| `""` (空) 或 `#` | 显示首页 | 暂停/销毁当前引擎，显示 `#home-view`，隐藏 `#simulation-view`。 |
| `#scene={key}` | 显示模拟页 | 隐藏 `#home-view`，显示 `#simulation-view`，初始化/加载对应 `{key}` 的场景。 |

## 5. 技术实现细节

### 5.1 HTML 改造
*   将现有的 Canvas、Controls 等包裹在 `<div id="simulation-view">` 中。
*   新增 `<div id="home-view">`，初始状态根据 Hash 决定显示哪个。

### 5.2 CSS 样式
*   定义 `.view-container` 类，控制显示/隐藏。
*   设计卡片样式：圆角、阴影、Hover 放大效果。
*   设计首页布局：使用 CSS Grid 实现响应式排列。

### 5.3 JavaScript 逻辑 (`main.js`)
*   **SceneRegistry 扩展**：
    *   为每个场景注册信息添加 `description` 字段用于卡片展示。
    *   默认缩略图路径约定为 `thumbnails/${key}.png`。
*   **Router 模块**：
    *   监听 `window.onhashchange`。
    *   解析 Hash 参数。
    *   执行视图切换逻辑。
*   **Engine 管理**：
    *   离开模拟页时，调用 `engine.stop()` 节省资源。
    *   进入模拟页时，确保 Canvas 尺寸正确重置。

## 6. 资源准备 (用户任务)
*   需要在 `public/thumbnails/` 文件夹下准备以下图片 (支持 .png 或 .jpg)：
    *   `pendulum.png`
    *   `circular.png`
    *   `shm.png`
    *   `freefall.png`
    *   `spring.png`
    *   `collision.png`
    *   `double-pendulum.png`
    *   `planetary.png`
    *   `projectile.png`
    *   `wave.png`
