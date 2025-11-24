import { Scene } from '../core/Scene.js';
import { drawWire, drawBattery, drawSwitch, drawLightBulb, drawResistor, drawMultimeter } from '../utils/graphics.js';
import { THEME } from '../config.js';
import description from '../content/Circuit.md?raw';

/**
 * 场景名称: 直流电路实验室 (DC Circuit Lab)
 * 物理现象: 模拟串联、并联及混合电路的电流流动与电压分布。
 */
export class CircuitScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      voltage: 12,       // 电源电压 (V)
      r1: 10,            // 灯泡1电阻 (Ω)
      r2: 10,            // 灯泡2电阻 (Ω)
      circuitType: 'series', // 'series' | 'parallel' | 'mixed'
      showCurrent: true, // 显示电流动画
      currentSpeed: 1.0, // 电流动画速度
      switch1: true,     // 总开关 (闭合)
      switch2: true,     // 支路开关 (仅并联/混联有效)
      bgColor: '#1a1a1a' // 深色背景适合看灯泡发光
    };
    
    this.time = 0;
    
    // 视口设置
    this.viewport.setCenter(0, 0);
    this.viewport.setScale(1.0);
    
    // 交互区域
    this.hitRegions = [];
    this.handleClick = this.handleClick.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  getDescription() {
    return description;
  }

  setup() {
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.style.cursor = 'default'; // Reset cursor
  }
  
  teardown() {
      this.canvas.removeEventListener('click', this.handleClick);
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      let hit = false;
      for (const region of this.hitRegions) {
          if (x >= region.x && x <= region.x + region.w &&
              y >= region.y && y <= region.y + region.h) {
              hit = true;
              break;
          }
      }
      this.canvas.style.cursor = hit ? 'pointer' : 'default';
  }

  handleClick(e) {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check hit regions
      for (const region of this.hitRegions) {
          if (x >= region.x && x <= region.x + region.w &&
              y >= region.y && y <= region.y + region.h) {
              
              // Toggle switch
              if (region.id === 'switch1') {
                  this.params.switch1 = !this.params.switch1;
              } else if (region.id === 'switch2') {
                  this.params.switch2 = !this.params.switch2;
              }
              
              // Notify control panel to update UI if needed (optional, depends on implementation)
              // Usually we might emit an event, but direct param modification works for rendering.
              // If we want to sync dat.gui, we might need to emit an event that ControlPanel listens to.
              this.emit('parameter-change', { key: region.id, value: this.params[region.id] });
              
              break; // Handle one click at a time
          }
      }
  }
  
  registerHitRegion(id, x, y, w, h) {
      // x, y are center coordinates in world space?
      // No, drawSwitch uses center coordinates.
      // But mouse event is in canvas coordinates.
      // We need to map world coordinates to canvas coordinates if viewport is used.
      // However, this scene uses a simple viewport where we might just be drawing directly?
      // The render function uses `this.width` and `this.height` and centers manually with `cx`, `cy`.
      // It does NOT seem to use `this.viewport.transform` or similar for the drawing commands 
      // (drawBattery etc take raw coordinates).
      // So the coordinates passed to drawSwitch ARE the canvas coordinates.
      
      // drawSwitch draws centered at (x,y) with width w and height h = w * 0.4
      // So bounding box is:
      const left = x - w / 2;
      const top = y - h / 2;
      
      this.hitRegions.push({ id, x: left, y: top, w, h });
  }

  getControlConfig() {
    return [
      {
        type: 'select', key: 'circuitType', label: '电路类型',
        options: [
          { label: '串联电路 (Series)', value: 'series' },
          { label: '并联电路 (Parallel)', value: 'parallel' },
          { label: '混合电路 (Mixed)', value: 'mixed' }
        ],
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'voltage', label: '电源电压 (V)', min: 0, max: 24, step: 1,
        description: '电池组提供的电压。'
      },
      { 
        type: 'range', key: 'r1', label: '灯泡1电阻 (Ω)', min: 1, max: 50, step: 1,
        description: '左侧/上方灯泡的电阻。'
      },
      { 
        type: 'range', key: 'r2', label: '灯泡2电阻 (Ω)', min: 1, max: 50, step: 1,
        description: '右侧/下方灯泡的电阻。'
      },
      { 
        type: 'boolean', key: 'switch1', label: '开关 S1 (总)',
        description: '控制主电路通断。'
      },
      { 
        type: 'boolean', key: 'switch2', label: '开关 S2 (支)',
        description: '控制第二个灯泡的通断 (仅并联/混联有效)。'
      },
      { 
        type: 'boolean', key: 'showCurrent', label: '显示电流',
        description: '显示电子流动动画。'
      },
      { 
        type: 'range', key: 'currentSpeed', label: '流速倍率', min: 0.1, max: 5.0, step: 0.1
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'circle', color: '#ffff00', label: '电子流 (Current)' },
      { type: 'line', color: '#d32f2f', label: '导线 (Wire)' }
    ];
  }

  getFormulaConfig() {
    if (this.params.circuitType === 'series') {
        return [
            { label: '总电阻', tex: 'R_{total} = R_1 + R_2' },
            { label: '总电流', tex: 'I = V / R_{total}' }
        ];
    } else {
        return [
            { label: '总电阻', tex: '\\frac{1}{R_{total}} = \\frac{1}{R_1} + \\frac{1}{R_2}' },
            { label: '支路电流', tex: 'I_n = V / R_n' }
        ];
    }
  }

  update(dt) {
    this.time += dt;
  }

  render(ctx) {
    const { width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    
    // 电路参数计算
    const V = this.params.voltage;
    const R1 = this.params.r1;
    const R2 = this.params.r2;
    const S1 = this.params.switch1; // Main switch
    const S2 = this.params.switch2; // Branch switch
    
    let I_total = 0;
    let I1 = 0;
    let I2 = 0;
    let P1 = 0;
    let P2 = 0;
    
    // 简单的电路求解器
    if (S1) { // 如果总开关开启
        if (this.params.circuitType === 'series') {
            // 串联: Battery -> S1 -> L1 -> L2 -> GND
            // 实际上 S2 在串联中通常用来短路或者作为第二个开关。
            // 这里假设 S2 控制 L2 的旁路? 或者 S2 串联在 L2 前面?
            // 简单起见：串联模式下 S2 串联在 L2 旁。
            
            if (S2) {
                const R_total = R1 + R2;
                I_total = V / R_total;
                I1 = I_total;
                I2 = I_total;
            } else {
                // S2 断开，整个电路断路 (如果 S2 和 L2 串联)
                // 或者 S2 是旁路开关? 
                // 按通用理解，S2 控制 L2。在串联中，如果 S2 断开，L2 不亮，L1 也不亮。
                I_total = 0;
            }
        } else if (this.params.circuitType === 'parallel') {
            // 并联: Battery -> S1 -> Node A
            // Node A -> L1 -> GND
            // Node A -> S2 -> L2 -> GND
            
            // L1 支路 (始终连通，受 S1 控制)
            I1 = V / R1;
            
            // L2 支路 (受 S2 控制)
            if (S2) {
                I2 = V / R2;
            } else {
                I2 = 0;
            }
            
            I_total = I1 + I2;
            
        } else if (this.params.circuitType === 'mixed') {
            // 混联: Battery -> S1 -> L1 -> Node B
            // Node B -> S2 -> L2 -> GND
            // Node B -> (Empty Wire / Resistor?) -> GND
            // 让我们做一个经典的：L1 串联在干路，L2 和 R3(虚拟) 并联？
            // 或者：L1 与 (S2 + L2) 并联？这和 Parallel 一样。
            // 让我们做：R1(L1) 串联 (R2(L2) // R_fixed)
            // 这样可以看到分压效果。
            // 假设有一个隐藏的定值电阻 R3 = 20欧
            const R3 = 20; 
            
            // 结构: Battery -> S1 -> L1 -> Node -> (S2+L2) // R3 -> GND
            
            // 计算并联部分电阻
            let R_parallel;
            if (S2) {
                R_parallel = (R2 * R3) / (R2 + R3);
            } else {
                R_parallel = R3; // L2 断路，只有 R3
            }
            
            const R_total = R1 + R_parallel;
            I_total = V / R_total;
            I1 = I_total; // 干路
            
            // 并联分流
            const V_parallel = I_total * R_parallel;
            if (S2) {
                I2 = V_parallel / R2;
            } else {
                I2 = 0;
            }
        }
    }
    
    // 计算功率 (用于亮度)
    P1 = I1 * I1 * R1;
    P2 = I2 * I2 * R2;
    
    // 绘制布局
    ctx.clearRect(0, 0, width, height);
    this.hitRegions = []; // Clear hit regions for this frame
    
    // 布局坐标定义
    const topY = cy - 100;
    const bottomY = cy + 100;
    const leftX = cx - 240;
    const rightX = cx + 240;
    
    // 绘制组件
    // 1. 电池 (左侧垂直)
    drawBattery(ctx, leftX, cy, 80, 40, -Math.PI/2);
    // 标注电压
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`${V}V`, leftX - 40, cy);

    // 2. 总开关 S1 (上方靠左)
    const s1X = leftX + 80;
    drawSwitch(ctx, s1X, topY, 60, !S1);
    this.registerHitRegion('switch1', s1X, topY, 60, 60 * 0.4);
    ctx.fillText('S1', s1X, topY - 30);

    // 根据模式绘制其余部分
    if (this.params.circuitType === 'series') {
        this.renderSeries(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I_total, cy);
    } else if (this.params.circuitType === 'parallel') {
        this.renderParallel(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I1, I2, I_total, cy);
    } else {
        this.renderMixed(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I1, I2, I_total, cy);
    }
    
    // 绘制万用表 (显示总电流)
    drawMultimeter(ctx, rightX + 100, bottomY, 60, I_total.toFixed(2), 'A');
  }

  // 渲染串联电路
  renderSeries(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I, cy) {
      // 布局: Battery -> S1 -> L1 -> S2 -> L2 -> Ammeter -> Battery
      
      const l1X = (leftX + rightX) / 2;
      const s2X = rightX - 50;
      const l2X = rightX; // L2 在右侧垂直边? 或者下方?
      
      // 路径点
      const p_bat_top = {x: leftX, y: topY};
      const p_s1_in = {x: s1X - 30, y: topY};
      const p_s1_out = {x: s1X + 30, y: topY};
      const p_l1_in = {x: l1X - 30, y: topY};
      const p_l1_out = {x: l1X + 30, y: topY};
      const p_s2_in = {x: s2X - 30, y: topY};
      const p_s2_out = {x: s2X + 30, y: topY};
      const p_corner_tr = {x: rightX, y: topY};
      const p_l2_top = {x: rightX, y: cy - 30}; // L2 在右边垂直
      const p_l2_bot = {x: rightX, y: cy + 30};
      const p_corner_br = {x: rightX, y: bottomY};
      const p_bat_bot = {x: leftX, y: bottomY};
      
      // 绘制导线
      // Battery Top to S1 Left
      drawWire(ctx, [{x: leftX, y: cy - 40}, {x: leftX, y: topY}, {x: s1X - 30, y: topY}], '#d32f2f');
      // S1 Right to L1 Left
      drawWire(ctx, [{x: s1X + 30, y: topY}, {x: l1X - 6, y: topY}], '#d32f2f');
      
      // L2 Position (Bottom Center)
      const l2X_bot = (leftX + rightX) / 2;
      const s2X_bot = rightX - 80;
      
      // L1 Right to S2 Right (via right edge)
      drawWire(ctx, [{x: l1X + 6, y: topY}, {x: rightX, y: topY}, {x: rightX, y: bottomY}, {x: s2X_bot + 30, y: bottomY}], '#d32f2f');
      
      // S2 Left to L2 Right
      drawWire(ctx, [{x: s2X_bot - 30, y: bottomY}, {x: l2X_bot + 6, y: bottomY}], '#d32f2f');
      
      // L2 Left to Battery Bottom
      drawWire(ctx, [{x: l2X_bot - 6, y: bottomY}, {x: leftX, y: bottomY}, {x: leftX, y: cy + 40}], '#d32f2f');
      
      // 绘制组件
      drawLightBulb(ctx, l1X, topY, 15, P1 > 0.1, this.getBulbColor(P1));
      ctx.fillStyle = '#fff'; ctx.fillText(`L1 (${R1}Ω)`, l1X, topY + 50);
      
      // Components
      // L1 (Top)
      // S2 (Bottom Right)
      drawSwitch(ctx, s2X_bot, bottomY, 60, !S2);
      this.registerHitRegion('switch2', s2X_bot, bottomY, 60, 60 * 0.4);
      ctx.fillText('S2', s2X_bot, bottomY + 40);
      
      // L2 (Bottom Center) - 倒立?
      // drawLightBulb 默认朝上。我们可以 save/rotate/restore.
      ctx.save();
      ctx.translate(l2X_bot, bottomY);
      ctx.rotate(Math.PI); // 倒立
      drawLightBulb(ctx, 0, 0, 15, P2 > 0.1, this.getBulbColor(P2));
      ctx.restore();
      ctx.fillText(`L2 (${R2}Ω)`, l2X_bot, bottomY - 50);
      
      // 动画
      if (this.params.showCurrent && I > 0.01) {
          const path = [
              {x: leftX, y: cy - 40}, {x: leftX, y: topY}, {x: rightX, y: topY}, 
              {x: rightX, y: bottomY}, {x: leftX, y: bottomY}, {x: leftX, y: cy + 40}
          ];
          this.animateCurrent(ctx, path, I);
      }
  }

  // 渲染并联电路
  renderParallel(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I1, I2, I_total, cy) {
      // 布局:
      // Top Wire: Battery -> S1 -> Node A (Center of Bus A)
      // Bus A: Vertical from Branch 1 to Branch 2
      // Branch 1 (Top): Node A Top -> L1 -> Node B Top
      // Branch 2 (Bottom): Node A Bottom -> S2 -> L2 -> Node B Bottom
      // Bus B: Vertical from Branch 1 to Branch 2
      // Return Path: Bus B Center -> w10 -> w11 -> w9 -> Battery
      
      const nodeAX = leftX + 150; 
      const nodeBX = rightX - 40;
      const returnNodeX = rightX + 40; // New node for w11 drop
      
      // Shift branches up, centered around topY
      const branchSpacing = 80;
      const branch1Y = topY - branchSpacing; 
      const branch2Y = topY + branchSpacing;
      
      // Main Wire Top (w1 + w2)
      drawWire(ctx, [{x: leftX, y: cy - 40}, {x: leftX, y: topY}, {x: s1X - 30, y: topY}], '#d32f2f');
      drawWire(ctx, [{x: s1X + 30, y: topY}, {x: nodeAX, y: topY}], '#d32f2f'); 

      // w3 (Bus A): Vertical from branch1Y to branch2Y
      drawWire(ctx, [{x: nodeAX, y: branch1Y}, {x: nodeAX, y: branch2Y}], '#d32f2f'); 
      
      // Branch 1 (Top)
      const l1X = (nodeAX+nodeBX)/2;
      drawWire(ctx, [{x: nodeAX, y: branch1Y}, {x: l1X-6, y: branch1Y}], '#d32f2f');
      drawWire(ctx, [{x: l1X+6, y: branch1Y}, {x: nodeBX, y: branch1Y}], '#d32f2f');
      drawLightBulb(ctx, l1X, branch1Y, 15, P1 > 0.1, this.getBulbColor(P1));
      ctx.fillText(`L1 (${R1}Ω)`, l1X, branch1Y + 50);
      
      // Branch 2 (Bottom)
      const centerX = (nodeAX + nodeBX) / 2;
      const s2X = centerX - 50;
      const l2X = centerX + 50;
      
      drawWire(ctx, [{x: nodeAX, y: branch2Y}, {x: s2X-30, y: branch2Y}], '#d32f2f');
      drawWire(ctx, [{x: s2X+30, y: branch2Y}, {x: l2X-6, y: branch2Y}], '#d32f2f'); 
      drawWire(ctx, [{x: l2X+6, y: branch2Y}, {x: nodeBX, y: branch2Y}], '#d32f2f');
      
      drawSwitch(ctx, s2X, branch2Y, 50, !S2);
      this.registerHitRegion('switch2', s2X, branch2Y, 50, 50 * 0.4);
      ctx.fillText('S2', s2X, branch2Y - 30);
      drawLightBulb(ctx, l2X, branch2Y, 15, P2 > 0.1, this.getBulbColor(P2));
      ctx.fillText(`L2 (${R2}Ω)`, l2X, branch2Y + 50);
      
      // w8 (Bus B): Vertical from branch1Y to branch2Y
      drawWire(ctx, [{x: nodeBX, y: branch1Y}, {x: nodeBX, y: branch2Y}], '#d32f2f'); 
      
      // w10 (New Horizontal): nodeBX to returnNodeX at topY
      drawWire(ctx, [{x: nodeBX, y: topY}, {x: returnNodeX, y: topY}], '#d32f2f');

      // w11 (New Vertical): returnNodeX from topY to bottomY
      drawWire(ctx, [{x: returnNodeX, y: topY}, {x: returnNodeX, y: bottomY}], '#d32f2f');

      // Return Wire (w9): returnNodeX to leftX at bottomY
      drawWire(ctx, [{x: returnNodeX, y: bottomY}, {x: leftX, y: bottomY}], '#d32f2f');

      // Battery Bottom (w12)
      drawWire(ctx, [{x: leftX, y: bottomY}, {x: leftX, y: cy + 40}], '#d32f2f');
      
      // Animation
      if (this.params.showCurrent) {
          // Main Loop
          if (I_total > 0.01) {
             this.animateCurrent(ctx, [{x: leftX, y: cy - 40}, {x: leftX, y: topY}, {x: nodeAX, y: topY}], I_total);
             this.animateCurrent(ctx, [{x: nodeBX, y: topY}, {x: returnNodeX, y: topY}, {x: returnNodeX, y: bottomY}, {x: leftX, y: bottomY}, {x: leftX, y: cy + 40}], I_total);
          }
          // Branch 1
          if (I1 > 0.01) {
              this.animateCurrent(ctx, [{x: nodeAX, y: topY}, {x: nodeAX, y: branch1Y}, {x: nodeBX, y: branch1Y}, {x: nodeBX, y: topY}], I1);
          }
          // Branch 2
          if (I2 > 0.01) {
              this.animateCurrent(ctx, [{x: nodeAX, y: topY}, {x: nodeAX, y: branch2Y}, {x: nodeBX, y: branch2Y}, {x: nodeBX, y: topY}], I2);
          }
      }
  }

  // 渲染混合电路
  renderMixed(ctx, leftX, rightX, topY, bottomY, s1X, R1, R2, S2, P1, P2, I1, I2, I_total, cy) {
      // 结构: Battery -> S1 -> L1 -> Node A
      // Node A -> S2 -> L2 -> Node B
      // Node A -> R3(Fixed) -> Node B
      // Node B -> Battery
      
      // Re-calculate positions for better spacing
      // Compact the series part to give more room for parallel
      const l1X = s1X + 80;
      const nodeAX = l1X + 60;
      const nodeBX = rightX - 40;
      const returnNodeX = rightX + 40;
      
      const branch1Y = topY - 40;
      const branch2Y = topY + 80;
      
      // 1. Main Series Path (Battery -> S1 -> L1 -> Node A)
      drawWire(ctx, [{x: leftX, y: cy-40}, {x: leftX, y: topY}, {x: s1X-30, y: topY}], '#d32f2f');
      drawWire(ctx, [{x: s1X+30, y: topY}, {x: l1X-6, y: topY}], '#d32f2f');
      drawWire(ctx, [{x: l1X+6, y: topY}, {x: nodeAX, y: topY}], '#d32f2f');
      
      drawLightBulb(ctx, l1X, topY, 15, P1 > 0.1, this.getBulbColor(P1));
      ctx.fillText(`L1 (${R1}Ω)`, l1X, topY + 50);
      
      // 2. Node A (Vertical Bus)
      drawWire(ctx, [{x: nodeAX, y: branch1Y}, {x: nodeAX, y: branch2Y}], '#d32f2f');
      
      // 3. Branch 1 (Upper: S2 -> L2)
      // Center components in the available space
      const centerBranch = (nodeAX + nodeBX) / 2;
      const s2X = centerBranch - 50;
      const l2X = centerBranch + 50;
      
      drawWire(ctx, [{x: nodeAX, y: branch1Y}, {x: s2X-30, y: branch1Y}], '#d32f2f');
      drawWire(ctx, [{x: s2X+30, y: branch1Y}, {x: l2X-6, y: branch1Y}], '#d32f2f');
      drawWire(ctx, [{x: l2X+6, y: branch1Y}, {x: nodeBX, y: branch1Y}], '#d32f2f');
      
      drawSwitch(ctx, s2X, branch1Y, 50, !S2);
      this.registerHitRegion('switch2', s2X, branch1Y, 50, 50 * 0.4);
      ctx.fillText('S2', s2X, branch1Y - 30);
      drawLightBulb(ctx, l2X, branch1Y, 15, P2 > 0.1, this.getBulbColor(P2));
      ctx.fillText(`L2 (${R2}Ω)`, l2X, branch1Y + 50);
      
      // 4. Branch 2 (Lower: R3)
      const r3X = (nodeAX + nodeBX) / 2;
      drawWire(ctx, [{x: nodeAX, y: branch2Y}, {x: r3X-40, y: branch2Y}], '#d32f2f');
      drawWire(ctx, [{x: r3X+40, y: branch2Y}, {x: nodeBX, y: branch2Y}], '#d32f2f');
      
      drawResistor(ctx, r3X, branch2Y, 80);
      ctx.fillText('R3 (20Ω)', r3X, branch2Y + 40);
      
      // 5. Node B (Vertical Bus)
      drawWire(ctx, [{x: nodeBX, y: branch1Y}, {x: nodeBX, y: branch2Y}], '#d32f2f');
      
      // 6. Return Path (Standard: Node B -> Right -> Down -> Left)
      drawWire(ctx, [{x: nodeBX, y: topY}, {x: returnNodeX, y: topY}], '#d32f2f');
      drawWire(ctx, [{x: returnNodeX, y: topY}, {x: returnNodeX, y: bottomY}], '#d32f2f');
      drawWire(ctx, [{x: returnNodeX, y: bottomY}, {x: leftX, y: bottomY}], '#d32f2f');
      drawWire(ctx, [{x: leftX, y: bottomY}, {x: leftX, y: cy+40}], '#d32f2f');
      
      // Animation
      if (this.params.showCurrent && I_total > 0.01) {
          // Main Series
          this.animateCurrent(ctx, [{x: leftX, y: cy - 40}, {x: leftX, y: topY}, {x: nodeAX, y: topY}], I_total);
          
          // Return Path
          this.animateCurrent(ctx, [{x: nodeBX, y: topY}, {x: returnNodeX, y: topY}, {x: returnNodeX, y: bottomY}, {x: leftX, y: bottomY}, {x: leftX, y: cy + 40}], I_total);
          
          // Branch L2
          if (I2 > 0.01) {
              this.animateCurrent(ctx, [{x: nodeAX, y: topY}, {x: nodeAX, y: branch1Y}, {x: nodeBX, y: branch1Y}, {x: nodeBX, y: topY}], I2);
          }
          // Branch R3
          const I3 = I_total - I2;
          if (I3 > 0.01) {
              this.animateCurrent(ctx, [{x: nodeAX, y: topY}, {x: nodeAX, y: branch2Y}, {x: nodeBX, y: branch2Y}, {x: nodeBX, y: topY}], I3);
          }
      }
  }

  getBulbColor(power) {
      // Power range roughly 0 to 100W?
      // V=12, R=10 => P=14.4
      // Max V=24, R=1 => P=576 (Too bright)
      // Normalize: 0 -> 0, 50 -> Max Brightness
      const intensity = Math.min(1, power / 20);
      // Color from Dark Red to Bright Yellow
      // Low power: Reddish
      // High power: Yellow/White
      if (intensity < 0.1) return '#550000';
      if (intensity < 0.3) return '#aa0000';
      return `rgba(255, ${Math.floor(255 * intensity)}, 0, ${0.5 + intensity * 0.5})`;
  }

  animateCurrent(ctx, points, current) {
      if (points.length < 2) return;
      
      // Calculate total length
      let totalLen = 0;
      const segLens = [];
      for(let i=0; i<points.length-1; i++) {
          const dx = points[i+1].x - points[i].x;
          const dy = points[i+1].y - points[i].y;
          const len = Math.hypot(dx, dy);
          segLens.push(len);
          totalLen += len;
      }
      
      // Speed proportional to current
      const speed = current * 50 * this.params.currentSpeed; 
      const offset = (this.time * speed) % 40; // 40px spacing for arrows
      
      ctx.fillStyle = '#ffff00';
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      
      // Draw arrows along the path
      for (let d = offset; d < totalLen; d += 40) {
          // Find which segment 'd' is in
          let currentD = d;
          let segIdx = 0;
          while(segIdx < segLens.length && currentD > segLens[segIdx]) {
              currentD -= segLens[segIdx];
              segIdx++;
          }
          
          if (segIdx < segLens.length) {
              const p1 = points[segIdx];
              const p2 = points[segIdx+1];
              const ratio = currentD / segLens[segIdx];
              const x = p1.x + (p2.x - p1.x) * ratio;
              const y = p1.y + (p2.y - p1.y) * ratio;
              
              // Calculate angle
              const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
              
              // Draw Arrow Head
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(angle);
              
              ctx.beginPath();
              ctx.moveTo(-6, -3);
              ctx.lineTo(0, 0);
              ctx.lineTo(-6, 3);
              ctx.stroke();
              
              // Optional: Draw a small line tail to make it look like a moving line segment
              // ctx.beginPath();
              // ctx.moveTo(-15, 0);
              // ctx.lineTo(0, 0);
              // ctx.stroke();
              
              ctx.restore();
          }
      }
  }
}
