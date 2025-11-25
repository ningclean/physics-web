# 电流测量电路（安培计/分流器）方案

## 概述
在直流电路实验室中添加新的电路类型：电流测量电路。该电路使用安培计（Ammeter）串联在电路中，测量通过的总电流。分流器可用于大电流测量，但在此模拟环境中，先实现基本安培计。

## 电路结构
- **拓扑**：串联电路
- **路径**：Battery -> S1 -> L1 -> Ammeter -> L2 -> GND
- **组件**：
  - 电池 (Battery)：提供电源电压 V
  - 开关 S1：控制主电路通断
  - 灯泡 L1：电阻 R1
  - 安培计 (Ammeter)：串联测量电流，显示 I_total (A)
  - 灯泡 L2：电阻 R2

## 电路计算
- **总电阻**：R_total = R1 + R2
- **总电流**：I_total = V / R_total
- **支路电流**：I1 = I_total, I2 = I_total
- **功率**：P1 = I1² * R1, P2 = I2² * R2
- **安培计显示**：I_total.toFixed(2) + ' A'

## 布局设计
- **位置**：
  - L1：左侧，x = center - 80
  - Ammeter：中间，x = center
  - L2：右侧，x = center + 80
  - 所有在 topY 水平线上
- **导线**：
  - Battery -> S1 -> L1 -> Ammeter -> L2 -> GND
  - 使用曼哈顿路由，红色导线，无节点
- **动画**：电流流动沿整个回路，显示黄色箭头

## 控制面板
- 添加选项：{ label: '电流测量电路 (Current)', value: 'current' }
- 开关 S1：控制电路通断
- 参数：电压 V、R1、R2

## 公式显示
- 总电阻：R_total = R1 + R2
- 总电流：I = V / R_total

## 实现步骤
1. 在 getControlConfig 中添加 'current' 选项
2. 在 render 的电路求解器中添加 'current' 分支
3. 添加 renderCurrentMeasurement 方法
4. 在 render 中调用相应方法
5. 测试布局和功能

## 未来扩展
- 添加分流器：低阻分流电阻，并联安培计，测量大电流
- 不同位置的安培计：如支路电流测量