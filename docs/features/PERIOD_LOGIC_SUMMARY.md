# 物理周期与 GIF 录制时长逻辑总结

为了生成首尾相接、循环播放流畅的 GIF 动图，我们为部分物理场景实现了基于物理周期的自动时长计算逻辑。

## 1. 核心目标
GIF 动图通常作为缩略图循环播放。如果录制时长不是物理周期的整数倍，动画在循环点会出现明显的“跳变”。我们的目标是计算出精确的录制时长 $T_{rec}$，使得：
$$ T_{rec} = n \times T_{physics} $$
其中 $n$ 是整数，且 $T_{rec} \ge 2.0$ 秒（避免动画过短）。

## 2. 通用算法 (`ControlPanel.js`)
控制面板通过检查当前场景是否实现了 `getRecordingDuration()` 方法来决定录制时长：
- **已实现**: 调用该方法获取精确时长。
- **未实现**: 默认使用 **10秒**。

## 3. 各场景实现细节

### 3.1 单摆 (Simple Pendulum)
- **物理公式**: 小角度单摆周期近似公式
  $$ T = 2\pi\sqrt{\frac{L}{g}} $$
- **代码实现**:
  ```javascript
  // src/scenes/SimplePendulumScene.js
  const period = 2 * Math.PI * Math.sqrt(length / g);
  ```
- **逻辑**: 计算出 $T$ 后，累加直到总时长超过 2 秒。

### 3.2 天体运动 (Planetary Motion)
- **物理原理**: 开普勒第三定律
  $$ T^2 = \frac{4\pi^2}{GM} a^3 \implies T = 2\pi\sqrt{\frac{a^3}{GM}} $$
- **轨道能量判断**:
  首先计算总机械能 $E = \frac{1}{2}v^2 - \frac{GM}{r}$。
  - 如果 $E \ge 0$: 轨道为双曲线或抛物线（非周期性），强制返回 **10秒**。
  - 如果 $E < 0$: 轨道为椭圆。
- **半长轴计算**:
  $$ a = -\frac{GM}{2E} $$
- **代码实现**:
  ```javascript
  // src/scenes/PlanetaryMotionScene.js
  const a = -(G * M) / (2 * E);
  const period = 2 * Math.PI * Math.sqrt(Math.pow(a, 3) / (G * M));
  ```

### 3.3 波的干涉 (Wave Interference)
- **物理原理**: 波的周期 $T = 1/f$。
- **逻辑**:
  - 如果两个波源频率相同 ($f_1 = f_2$)，则干涉图样也是周期性变化的，周期 $T = 1/f_1$。
  - 如果频率不同，寻找最小公倍数较为复杂，目前简化处理返回 **4秒**。
- **代码实现**:
  ```javascript
  // src/scenes/WaveInterferenceScene.js
  if (Math.abs(f1 - f2) < 0.001) {
      const period = 1.0 / f1;
      // ...累加至 2s
  }
  ```

## 4. 待扩展场景
以下场景目前使用默认的 10秒 录制时长，未来可以轻松扩展：

- **匀速圆周运动 (Circular)**: $T = 2\pi / \omega$
- **简谐运动 (SHM)**: $T = 2\pi / \omega$
- **弹簧振子 (Spring)**: $T = 2\pi\sqrt{m/k}$

## 5. 总结
通过引入物理公式计算录制时长，我们生成的 GIF 缩略图（特别是单摆和天体运动）能够呈现出完美的循环效果，极大地提升了首页的视觉体验。
