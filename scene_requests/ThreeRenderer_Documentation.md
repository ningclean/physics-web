# ThreeRenderer 3D 渲染器文档

## 概述

`ThreeRenderer` 是基于 Three.js 的 3D 渲染器类，用于处理物理模拟应用的 3D 场景渲染。它继承自基类 `Renderer`，提供完整的 3D 渲染管道，包括场景管理、相机控制、光照、网格辅助线等。

## 框架结构

### 类继承
```typescript
export class ThreeRenderer extends Renderer
```

### 主要属性
- `renderer: THREE.WebGLRenderer` - WebGL 渲染器实例
- `scene: THREE.Scene` - Three.js 场景对象
- `camera: THREE.PerspectiveCamera` - 透视相机
- `controls: any` - OrbitControls 轨道控制器（可选）

### 核心方法
- `initThreeJS()` - 初始化 Three.js 环境
- `render()` - 执行渲染循环
- `resize(width, height)` - 处理画布大小调整
- `dispose()` - 清理资源

## 初始化逻辑

### initThreeJS() 方法

#### 场景设置
```typescript
this.scene = new THREE.Scene();
this.scene.background = new THREE.Color(0x000000); // 黑色背景
```

#### 相机配置
```typescript
this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 2000);
this.camera.position.set(0, 0, 300); // 位置：(0, 0, 300)
this.camera.lookAt(0, 0, 0);
```
- **FOV**: 45度
- **近平面**: 0.1
- **远平面**: 2000
- **初始位置**: (0, 0, 300)

#### 渲染器配置
```typescript
this.renderer = new THREE.WebGLRenderer({
  canvas: this.canvas,
  antialias: true,
  alpha: false
});
this.renderer.setSize(this.width, this.height);
this.renderer.setPixelRatio(window.devicePixelRatio);
this.renderer.shadowMap.enabled = true;
this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
```

#### 光照系统
- **环境光**: `AmbientLight(0x404040, 0.4)`
- **方向光**: `DirectionalLight(0xffffff, 1)`，位置 (100, 100, 50)，启用阴影
- **点光源**: `PointLight(0xffcc00, 2, 1000)`，位置 (0, 0, 0)，模拟恒星光

## 辅助元素

### 网格辅助线
```typescript
const gridHelper = new THREE.GridHelper(4000, 80);
```
- **大小**: 4000 x 4000 单位
- **分割数**: 80 x 80
- **格子间距**: 50 单位

### 空间边界线
```typescript
const boundaryBox = new THREE.Box3(
  new THREE.Vector3(-2000, -2000, -2000),
  new THREE.Vector3(2000, 2000, 2000)
);
const boundaryHelper = new THREE.Box3Helper(boundaryBox, 0x888888);
```
- **边界范围**: -2000 到 2000 单位立方体
- **颜色**: 灰色 (0x888888)

### 坐标轴
```typescript
this.addAxes(500);
```
- **长度**: 500 单位
- **颜色**: 白色 (0xffffff)
- **轴线**: X、Y、Z 轴，从 -500 到 500

## 画布管理

### 大小调整逻辑
```typescript
resize(width: number, height: number): void {
  this.width = width;
  this.height = height;
  
  const dpr = window.devicePixelRatio;
  this.canvas.width = width * dpr;
  this.canvas.height = height * dpr;
  this.canvas.style.width = `${width}px`;
  this.canvas.style.height = `${height}px`;
  
  this.camera.aspect = width / height;
  this.camera.updateProjectionMatrix();
  this.renderer.setSize(width, height);
  this.renderer.setPixelRatio(dpr);
  
  this.renderer.setScissorTest(false); // 确保全屏渲染
}
```

### 画布样式
- **边框**: 2px solid black
- **盒模型**: border-box
- **设备像素比**: 自动适配 (window.devicePixelRatio)

## 轨道控制器

### 初始化
```typescript
import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
  this.controls = new OrbitControls(this.camera, this.canvas);
  this.controls.enableDamping = true;
  this.controls.dampingFactor = 0.05;
  this.controls.enableZoom = true;
  this.controls.enablePan = true;
  this.controls.enableRotate = true;
});
```

### 控制选项
- **阻尼**: 启用，系数 0.05
- **缩放**: 启用
- **平移**: 启用
- **旋转**: 启用

## 渲染循环

### render() 方法
```typescript
render(): void {
  if (this.controls) {
    this.controls.update();
  }
  this.renderer.render(this.scene, this.camera);
}
```

## 资源清理

### dispose() 方法
- 遍历场景，清理几何体和材质
- 清理渲染器
- 清理轨道控制器

## 参数配置

### 可调整参数
- **相机位置**: 可通过 `this.camera.position` 修改
- **网格密度**: 通过 GridHelper 的 divisions 参数调整
- **光照强度**: 通过光源的 intensity 属性
- **背景颜色**: 通过 `scene.background` 设置

### 默认值
- 相机距离: 300 单位
- 网格间距: 50 单位
- FOV: 45°
- 背景: 黑色

## 使用场景

此渲染器主要用于：
- 3D 行星运动模拟 (PlanetaryMotionScene3D)
- 其他需要 3D 可视化的物理场景

## 依赖项

- Three.js 库
- OrbitControls (可选，用于交互控制)

## 注意事项

- 确保 WebGL 上下文可用
- 渲染器会在场景切换时自动清理和重建
- 画布大小会根据容器动态调整
- 阴影映射已启用，提升视觉效果