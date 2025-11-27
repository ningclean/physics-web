# Bug记录

## Bug: 从2D scene切换到3D scene后刷新页面，组件位置下移约100px

### 描述
- 从某个2D scene（例如 projectile）切换到3D scene（planetary-3d）后，在当前页面刷新，组件位置下移不到100px。
- 2D scene之间切换后刷新，布局不变。

### 可能原因
- 不同scene的知识讲解内容（knowledge section）长度不同，导致高度变化。
- Flexbox布局调整，影响组件位置。
- 切换时layout状态与刷新时的初始状态不同。

### 复现步骤
1. 从首页进入2D scene（例如 projectile）。
2. 切换到3D scene（planetary-3d）。
3. 刷新页面。
4. 观察组件位置下移。

### 影响
- 用户体验不佳，布局不一致。

### 待修正
- 后续尝试修正，确保所有scene布局一致。