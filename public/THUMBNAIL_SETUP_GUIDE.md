# 如何设置和更改首页图标 (Thumbnail Setup Guide)

本文档说明如何为物理模拟引擎的首页各个模块设置或更改缩略图（图标）。

## 1. 准备图片或动画文件

首先，您需要准备好要显示的图片或动画文件。支持的格式包括：
- **图片**: `.png`, `.jpg`, `.jpeg`, `.svg`
- **动画**: `.gif`, `.webm`, `.mp4` (推荐使用 `.gif` 或 `.webm` 以获得更好的自动播放效果)

建议将所有缩略图文件统一存放在 `public/thumbnails/` 文件夹中，以便管理。

例如：
- `public/thumbnails/pendulum.gif`
- `public/thumbnails/wave.gif`
- `public/thumbnails/projectile.png`

## 2. 修改配置文件

图标的配置位于源代码的入口文件 `src/main.js` 中。

1.  打开 `src/main.js` 文件。
2.  找到 `sceneRegistry.register` 相关的代码块。
3.  在对应场景的配置对象中，添加或修改 `thumbnail` 属性。

### 示例代码

假设您已经将一个名为 `pendulum.gif` 的文件放入了 `public/thumbnails/` 文件夹中，并且想要将其设置为“单摆”场景的图标。

```javascript
// src/main.js

// ... (其他导入代码)

// 注册场景
sceneRegistry.register('pendulum', SimplePendulumScene, { 
    label: '单摆', 
    description: '经典的单摆运动，展示周期与摆长的关系。',
    // 设置 thumbnail 属性，路径相对于 public 目录
    thumbnail: '/thumbnails/pendulum.gif' 
});

sceneRegistry.register('wave', WaveInterferenceScene, { 
    label: '波的干涉', 
    description: '双波源干涉图样的实时模拟。',
    thumbnail: '/thumbnails/wave-interference.gif' 
});

// ... (其他注册代码)
```

## 3. 验证

1.  保存 `src/main.js` 文件。
2.  刷新浏览器中的应用首页。
3.  您应该能看到对应的卡片现在显示了您设置的图片或动画。

## 4. 录制 GIF (可选)

如果您没有现成的 GIF，可以使用应用内置的录制功能：
1.  进入某个场景（如“波的干涉”）。
2.  在控制面板中点击 **"录制 GIF (10s)"**。
3.  录制完成后，保存文件。
4.  将文件重命名并移动到 `public/thumbnails/` 文件夹。
5.  按照上述步骤更新 `src/main.js`。
