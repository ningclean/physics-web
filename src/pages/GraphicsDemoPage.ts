import {
  drawStickFigure,
  drawBall,
  drawBlock,
  drawGround,
  drawSpring,
  drawDamper,
  drawSupport,
  drawCart,
  drawPulley,
  drawRuler,
  drawProtractor,
  drawStopwatch,
  drawMagnet,
  drawCharge,
  drawBattery,
  drawLightBulb,
  drawWire,
  drawSwitch,
  drawMultimeter,
  drawResistor,
  drawFish,
} from '../utils/graphics.ts';
import { THEME } from '../config.ts';

export function renderGraphicsDemo(container: HTMLElement): void {
  // 1. 清空容器
  container.innerHTML = '';
  container.style.backgroundColor = '#1a1a1a';
  container.style.color = '#fff';
  container.style.overflowY = 'auto';
  container.style.padding = '20px';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';

  // 2. 构建头部
  const header = document.createElement('header');
  header.style.width = '100%';
  header.style.maxWidth = '800px';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '20px';

  const backBtn = document.createElement('button');
  backBtn.textContent = '← 返回首页';
  backBtn.className = 'nav-btn'; // 复用现有样式
  backBtn.onclick = () => {
    window.location.hash = '';
  };

  const title = document.createElement('h2');
  title.textContent = '图形组件库 (Graphics Library)';
  title.style.margin = '0';

  header.appendChild(backBtn);
  header.appendChild(title);
  container.appendChild(header);

  // 3. 创建画布容器
  const canvasContainer = document.createElement('div');
  canvasContainer.style.backgroundColor = '#000';
  canvasContainer.style.borderRadius = '8px';
  canvasContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
  canvasContainer.style.padding = '20px';

  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = 800;
  canvas.height = 3000; // 再次增加高度以容纳电阻
  canvas.style.maxWidth = '100%';
  canvas.style.height = 'auto';

  canvasContainer.appendChild(canvas);
  container.appendChild(canvasContainer);

  // 4. 绘制内容
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const width = canvas.width;

  // 绘制背景
  ctx.fillStyle = THEME.colors.background.default;
  ctx.fillRect(0, 0, width, canvas.height);

  const textColor = '#fff';

  // 辅助函数：绘制标题
  const drawSectionTitle = (text: string, y: number): void => {
    ctx.fillStyle = textColor;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(text, 50, y);

    ctx.beginPath();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.moveTo(50, y + 15);
    ctx.lineTo(width - 50, y + 15);
    ctx.stroke();
  };

  // --- 绘制内容 ---

  // 1. 火柴人展示
  drawSectionTitle('1. 火柴人 (Stick Figure)', 50);

  // 正立
  drawStickFigure(ctx, width * 0.25, 200, 100, '#ffa500', '正立 (Upright)');
  // 倒立
  drawStickFigure(ctx, width * 0.5, 100, 200, '#00b7ff', '倒立 (Inverted)');
  // 小尺寸
  drawStickFigure(ctx, width * 0.75, 180, 140, '#32cd32', '小尺寸');

  // 2. 小球展示
  drawSectionTitle('2. 立体小球 (3D Ball)', 280);

  drawBall(ctx, width * 0.2, 360, 30, '#ff4d4d');
  ctx.fillStyle = '#aaa';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Red (r=30)', width * 0.2, 410);

  drawBall(ctx, width * 0.4, 360, 20, '#5cd65c');
  ctx.fillText('Green (r=20)', width * 0.4, 410);

  drawBall(ctx, width * 0.6, 360, 40, '#00b7ff');
  ctx.fillText('Blue (r=40)', width * 0.6, 420);

  drawBall(ctx, width * 0.8, 360, 15, '#ffff00');
  ctx.fillText('Yellow (r=15)', width * 0.8, 400);

  // 3. 滑块展示
  drawSectionTitle('3. 滑块 (Block)', 480);

  drawBlock(ctx, width * 0.3, 560, 80, 50, '#ff4d4d', 'm1');
  drawBlock(ctx, width * 0.7, 560, 100, 60, '#32cd32', 'Mass', Math.PI / 6); // 旋转30度
  ctx.fillText('Rotated 30°', width * 0.7, 620);

  // 4. 地面/墙壁展示
  drawSectionTitle('4. 地面与墙壁 (Ground/Wall)', 650);

  // 地面
  drawGround(ctx, width * 0.1, 730, width * 0.4, 730, 15);
  ctx.fillStyle = textColor;
  ctx.font = '14px Arial';
  ctx.fillText('地面 (Ground)', width * 0.25, 710);

  // 墙壁
  drawGround(ctx, width * 0.7, 680, width * 0.7, 780, 15);
  ctx.fillText('墙壁 (Wall)', width * 0.75, 730);

  // 5. 弹簧展示
  drawSectionTitle('5. 弹簧 (Spring)', 820);

  // 水平弹簧
  drawSpring(ctx, width * 0.1, 880, width * 0.4, 880, 10, 20, '#dddddd', 2);
  ctx.fillText('水平弹簧', width * 0.25, 910);

  // 倾斜弹簧
  drawSpring(ctx, width * 0.6, 850, width * 0.8, 900, 12, 15, '#ffa500', 2);
  ctx.fillText('倾斜弹簧', width * 0.7, 920);

  // 6. 阻尼器展示
  drawSectionTitle('6. 阻尼器 (Damper)', 980);

  // 水平阻尼器
  drawDamper(ctx, width * 0.1, 1040, width * 0.4, 1040, 20, '#00b7ff');
  ctx.fillText('水平阻尼器', width * 0.25, 1070);

  // 倾斜阻尼器
  drawDamper(ctx, width * 0.6, 1010, width * 0.8, 1060, 15, '#ff4d4d');
  ctx.fillText('倾斜阻尼器', width * 0.7, 1080);

  // 7. 支架展示
  drawSectionTitle('7. 支架 (Support)', 1120);

  drawSupport(ctx, width * 0.2, 1180, 20, '#888', 0); // 天花板
  ctx.fillText('天花板', width * 0.2, 1210);

  drawSupport(ctx, width * 0.4, 1210, 20, '#888', Math.PI); // 地面
  ctx.fillText('地面', width * 0.4, 1180);

  drawSupport(ctx, width * 0.6, 1195, 20, '#888', -Math.PI / 2); // 左墙
  ctx.fillText('左墙', width * 0.65, 1195);

  // 8. 实验小车展示
  drawSectionTitle('8. 实验小车 (Cart)', 1250);
  drawCart(ctx, width * 0.3, 1320, 80, 40, 10, '#00b7ff');
  drawCart(ctx, width * 0.7, 1320, 80, 40, 10, '#ffa500', -Math.PI / 6); // 旋转-30度
  ctx.fillText('Rotated -30°', width * 0.7, 1380);

  // 9. 滑轮展示
  drawSectionTitle('9. 滑轮 (Pulley)', 1380);
  drawPulley(ctx, width * 0.3, 1450, 30, '#aaa');

  // 10. 测量工具展示
  drawSectionTitle('10. 测量工具 (Tools)', 1520);

  // 标尺
  drawRuler(ctx, width * 0.1, 1580, 200, 0, 'cm');

  // 量角器
  drawProtractor(ctx, width * 0.6, 1600, 60);

  // 秒表
  drawStopwatch(ctx, width * 0.85, 1580, 40, 12.5);

  // 11. 电磁学组件展示
  drawSectionTitle('11. 电磁学 (Electromagnetism)', 1660);

  // 第一行：磁铁
  drawMagnet(ctx, width * 0.25, 1730, 120, 40, 0);
  drawMagnet(ctx, width * 0.65, 1730, 100, 30, Math.PI / 4);

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.fillText('条形磁铁 (Magnet)', width * 0.25, 1780);

  // 第二行：电荷 (换行以避免拥挤)
  drawCharge(ctx, width * 0.3, 1850, 25, 1); // 正电荷
  drawCharge(ctx, width * 0.7, 1850, 25, -1); // 负电荷
  ctx.fillText('点电荷 (Charge)', width * 0.5, 1890);

  // 12. 电路组件展示
  drawSectionTitle('12. 电路组件 (Circuits)', 1940);

  // 第一行：电池
  // 水平放置
  drawBattery(ctx, width * 0.25, 2020, 100, 50, 0);
  ctx.fillText('电池 (Horizontal)', width * 0.25, 2070);

  // 垂直放置 (旋转 -90度)
  drawBattery(ctx, width * 0.65, 2020, 100, 50, -Math.PI / 2);
  ctx.fillText('电池 (Vertical)', width * 0.65, 2090);

  // 第二行：灯泡
  drawLightBulb(ctx, width * 0.3, 2180, 35, false);
  ctx.fillText('Bulb (Off)', width * 0.3, 2250);

  drawLightBulb(ctx, width * 0.7, 2180, 35, true, '#ffcc00');
  ctx.fillText('Bulb (On)', width * 0.7, 2250);

  // 第三行：开关与电线
  // 开关 (断开)
  drawSwitch(ctx, width * 0.25, 2350, 80, true);
  ctx.fillText('Switch (Open)', width * 0.25, 2400);

  // 开关 (闭合)
  drawSwitch(ctx, width * 0.5, 2350, 80, false);
  ctx.fillText('Switch (Closed)', width * 0.5, 2400);

  // 电线
  const wirePoints = [
    { x: width * 0.7, y: 2350 },
    { x: width * 0.8, y: 2350 },
    { x: width * 0.8, y: 2380 },
    { x: width * 0.9, y: 2380 },
  ];
  drawWire(ctx, wirePoints, '#d32f2f', 3);
  ctx.fillText('Wire', width * 0.8, 2410);

  // 第四行：电阻
  // 1kΩ (棕黑红金)
  drawResistor(ctx, width * 0.3, 2520, 120, ['#8d6e63', '#000000', '#d32f2f', '#ffd700']);
  ctx.fillText('Resistor (1kΩ)', width * 0.3, 2570);

  // 220Ω (红红棕金)
  drawResistor(ctx, width * 0.7, 2520, 120, ['#d32f2f', '#d32f2f', '#8d6e63', '#ffd700']);
  ctx.fillText('Resistor (220Ω)', width * 0.7, 2570);

  // 13. 生物组件展示
  drawSectionTitle('13. 生物组件 (Biology)', 2640);

  // 鱼
  drawFish(ctx, width * 0.25, 2700, '#ff5722');
  ctx.fillText('鱼 (Fish)', width * 0.25, 2740);

  drawFish(ctx, width * 0.5, 2700, '#00b7ff', 0.5);
  ctx.fillText('半透明鱼 (Ghost Fish)', width * 0.5, 2740);

  // 说明文字
  const footer = document.createElement('div');
  footer.style.marginTop = '20px';
  footer.style.color = '#888';
  footer.innerHTML = '<p>所有图形均由 <code>src/utils/graphics.ts</code> 动态生成。</p>';
  container.appendChild(footer);
}
