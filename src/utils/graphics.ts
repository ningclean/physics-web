/**
 * 高级图形绘制工具库
 * 包含物理场景中常用的复杂图形，如火柴人、小球、滑块等。
 */

import { THEME } from '../config.ts';

/**
 * 绘制火柴人
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X坐标
 * @param {number} footY 脚底Y坐标
 * @param {number} headY 头顶Y坐标
 * @param {string} color 颜色
 * @param {string} [label] 标签
 * @param {number} angle 旋转角度 (弧度)
 */
export function drawStickFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  footY: number,
  headY: number,
  color: string,
  label?: string,
  angle: number = 0
): void {
  const h = footY - headY; // Height. Positive if upright.
  const size = Math.abs(h);
  const centerY = (footY + headY) / 2;

  if (size < 5) return;

  const headRadius = size * 0.15;
  const bodyLen = size * 0.4;
  const dir = h > 0 ? 1 : -1;

  ctx.save();
  ctx.translate(x, centerY);
  ctx.rotate(angle);

  // 坐标系已移动到中心，Y轴向下。
  // 我们需要根据原来的 footY/headY 逻辑重新计算相对坐标
  // 原来: headY 是顶部, footY 是底部
  // 现在中心是 0.
  // 如果正立 (h>0): 头在 -h/2, 脚在 h/2

  const localHeadY = -h / 2;
  const localFootY = h / 2;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // Head
  const headCenterY = localHeadY + dir * headRadius;
  ctx.beginPath();
  ctx.arc(0, headCenterY, headRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Neck
  const neckY = headCenterY + dir * headRadius;

  // Body
  const crotchY = neckY + dir * bodyLen;
  ctx.beginPath();
  ctx.moveTo(0, neckY);
  ctx.lineTo(0, crotchY);
  ctx.stroke();

  // Arms
  const shoulderY = neckY + dir * (bodyLen * 0.2);
  const armW = size * 0.25;
  const handY = shoulderY + dir * (bodyLen * 0.1);

  ctx.beginPath();
  ctx.moveTo(-armW, handY);
  ctx.lineTo(0, shoulderY);
  ctx.lineTo(armW, handY);
  ctx.stroke();

  // Legs
  const legW = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(-legW, localFootY);
  ctx.lineTo(0, crotchY);
  ctx.lineTo(legW, localFootY);
  ctx.stroke();

  // Label (保持水平，不随人旋转，或者随人旋转？通常标签随人旋转比较好定位，但阅读困难。这里先随人旋转)
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const labelY = h > 0 ? localHeadY - 15 : localHeadY + 40;
    ctx.fillText(label, 0, labelY);
  }
  ctx.restore();
}

/**
 * 绘制具有立体感的小球
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} r 半径
 * @param {string} color 主色
 */
export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);

  // 创建径向渐变以模拟光照
  const gradient = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  gradient.addColorStop(0, '#fff'); // 高光
  gradient.addColorStop(0.3, color); // 主色
  gradient.addColorStop(1, '#000'); // 阴影

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

/**
 * 绘制滑块/方块
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} w 宽
 * @param {number} h 高
 * @param {string} color
 * @param {string} [text] 内部文字
 * @param {number} angle 旋转角度
 */
export function drawBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  text?: string,
  angle: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 填充
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // 边框
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // 文字
  if (text) {
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '14px Arial';
    ctx.fillText(text, 0, 0);
  }

  ctx.restore();
}

/**
 * 绘制固定地面/墙壁 (带斜线阴影)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {number} thickness 厚度(阴影深度)
 */
export function drawGround(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, thickness: number = 10): void {
  ctx.save();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 2;

  // 主线
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // 斜线阴影
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const spacing = 10;
  const count = Math.floor(len / spacing);

  ctx.lineWidth = 1;
  for (let i = 0; i <= count; i++) {
    const px = x1 + (dx / len) * i * spacing;
    const py = y1 + (dy / len) * i * spacing;

    // 垂直于主线的方向 + 45度
    // 简单起见，假设水平或垂直
    // 如果是水平地面 (y1=y2)
    if (Math.abs(dy) < 0.1) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - thickness / 2, py + thickness);
      ctx.stroke();
    }
    // 如果是垂直墙壁 (x1=x2)
    else if (Math.abs(dx) < 0.1) {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - thickness, py + thickness / 2); // 向左画斜线
      ctx.stroke();
    } else {
      // 通用情况，暂略，按水平处理
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px - thickness / 2, py + thickness);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * 绘制弹簧
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1 起点X
 * @param {number} y1 起点Y
 * @param {number} x2 终点X
 * @param {number} y2 终点Y
 * @param {number} coils 线圈数
 * @param {number} width 弹簧宽度
 * @param {string} color 颜色
 * @param {number} lineWidth 线宽
 */
export function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  coils: number,
  width: number,
  color: string,
  lineWidth: number = 2
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  if (len < 1) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(dy, dx));

  ctx.beginPath();
  ctx.moveTo(0, 0);

  // 弹簧两端的直线段长度
  const padding = 20;
  // 如果距离太短，压缩 padding
  const actualPadding = Math.min(padding, len * 0.1);

  ctx.lineTo(actualPadding, 0);

  const springLen = len - 2 * actualPadding;
  const step = springLen / (coils * 2);
  const radius = width / 2;

  for (let i = 0; i <= coils * 2; i++) {
    const x = actualPadding + i * step;
    // 偶数点在下，奇数点在上
    let y = 0;
    if (i > 0 && i < coils * 2) {
      y = i % 2 === 0 ? radius : -radius;
    }
    ctx.lineTo(x, y);
  }

  ctx.lineTo(len, 0);
  ctx.stroke();
  ctx.restore();
}

/**
 * 绘制阻尼器
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1 起点X (圆筒端)
 * @param {number} y1 起点Y
 * @param {number} x2 终点X (活塞端)
 * @param {number} y2 终点Y
 * @param {number} width 宽度
 * @param {string} color 颜色
 */
export function drawDamper(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number,
  color: string
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  if (len < 1) return;

  ctx.save();
  ctx.translate(x1, y1);
  ctx.rotate(Math.atan2(dy, dx));

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // 为了保证视觉上的连接，让圆筒和活塞杆各占一半长度加上一定的重叠区
  const overlap = width;
  const housingLen = len / 2 + overlap;
  const w2 = width / 2;

  // 1. 绘制圆筒 (Housing)
  ctx.beginPath();
  ctx.moveTo(housingLen, -w2);
  ctx.lineTo(0, -w2);
  ctx.lineTo(0, w2);
  ctx.lineTo(housingLen, w2);
  ctx.stroke();

  // 2. 绘制活塞杆 (Piston Rod)
  // 杆从 x2 (len, 0) 延伸回圆筒内部
  const rodEnd = len - housingLen; // 杆的末端位置 (相对于x1)

  ctx.beginPath();
  ctx.moveTo(len, 0);
  ctx.lineTo(rodEnd, 0);
  ctx.stroke();

  // 3. 绘制活塞头 (Piston Head)
  const gap = 4; // 活塞与筒壁的间隙
  ctx.beginPath();
  ctx.moveTo(rodEnd, -w2 + gap);
  ctx.lineTo(rodEnd, w2 - gap);
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制支架/悬挂点
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 支点尖端X
 * @param {number} y 支点尖端Y
 * @param {number} size 大小
 * @param {string} color 颜色
 * @param {number} angle 旋转角度 (弧度), 0为向下(天花板), PI为向上(地面)
 */
export function drawSupport(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  angle: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  // 三角形主体
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size / 2, -size);
  ctx.lineTo(size / 2, -size);
  ctx.closePath();
  ctx.stroke();

  // 顶部横梁 (用于画阴影)
  ctx.beginPath();
  ctx.moveTo(-size / 2 - 5, -size);
  ctx.lineTo(size / 2 + 5, -size);
  ctx.stroke();

  // 阴影斜线
  ctx.beginPath();
  ctx.lineWidth = 1;
  for (let i = -size / 2 - 5; i < size / 2 + 5; i += 5) {
    ctx.moveTo(i, -size);
    ctx.lineTo(i - 5, -size - 5);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制实验小车
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y (车身中心，不含轮子)
 * @param {number} w 车身宽
 * @param {number} h 车身高
 * @param {number} r 轮子半径
 * @param {string} color 颜色
 * @param {number} angle 旋转角度
 */
export function drawCart(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  color: string,
  angle: number = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // 轮子 (相对于车身中心，轮子在底部)
  const wheelY = h / 2;
  const wheelOffset = w / 2 - r - 5;

  ctx.fillStyle = '#333';
  // 左轮
  ctx.beginPath();
  ctx.arc(-wheelOffset, wheelY, r, 0, Math.PI * 2);
  ctx.fill();
  // 右轮
  ctx.beginPath();
  ctx.arc(wheelOffset, wheelY, r, 0, Math.PI * 2);
  ctx.fill();

  // 车身
  ctx.fillStyle = color;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // 轮轴点
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-wheelOffset, wheelY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(wheelOffset, wheelY, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 绘制滑轮
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 圆心X
 * @param {number} y 圆心Y
 * @param {number} r 半径
 * @param {string} color 颜色
 */
export function drawPulley(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  ctx.save();
  ctx.translate(x, y);

  // 支架 (简单的吊钩形状，向上延伸)
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -r - 10);
  ctx.stroke();
  // 挂环
  ctx.beginPath();
  ctx.arc(0, -r - 15, 5, 0, Math.PI * 2);
  ctx.stroke();

  // 轮子主体
  ctx.fillStyle = '#ccc';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // 轮缘槽 (装饰)
  ctx.beginPath();
  ctx.arc(0, 0, r - 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#999';
  ctx.stroke();

  // 中心轴
  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 绘制标尺
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 起点X
 * @param {number} y 起点Y
 * @param {number} length 长度
 * @param {number} angle 角度
 * @param {string} unit 单位文字
 */
export function drawRuler(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  length: number,
  angle: number = 0,
  unit: string = 'cm'
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const h = 30; // 尺子宽度

  // 尺身
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(0, 0, length, h);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, length, h);

  // 刻度
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.font = '10px Arial';

  const step = 10; // 像素每刻度
  for (let i = 0; i <= length; i += step) {
    let tickH = 5;
    if (i % 50 === 0) tickH = 10;
    if (i % 100 === 0) tickH = 15;

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, tickH);
    ctx.stroke();

    if (i % 50 === 0) {
      ctx.fillText(i, i, 25);
    }
  }

  // 单位
  ctx.fillText(unit, length - 15, h / 2 + 4);

  ctx.restore();
}

/**
 * 绘制量角器
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 圆心X
 * @param {number} y 圆心Y
 * @param {number} r 半径
 */
export function drawProtractor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);

  // 半圆主体 (n形)
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0, false); // 默认顺时针，PI(左) -> 0(右) 是下半圆。我们需要上半圆，所以用 false? 不，canvas y向下。
  // 0是右，PI是左。顺时针 PI->0 是 9点->6点->3点 (下半圆)。
  // 逆时针 PI->0 是 9点->12点->3点 (上半圆)。
  // 所以要用 true (counterclockwise)
  ctx.arc(0, 0, r, Math.PI, 0, true);
  ctx.lineTo(0, 0);
  ctx.closePath();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();

  // 刻度
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.font = '10px Arial';

  for (let i = 0; i <= 180; i += 10) {
    const rad = (Math.PI * i) / 180;
    const theta = Math.PI + rad; // 从左边(PI)开始顺时针? 不，逆时针是减。
    // 我们希望 0度在左边还是右边？通常量角器0度在右边，180在左边。
    // 那么从右边(0)开始，逆时针旋转 i 度。
    // Canvas 角度: 0是右，逆时针是负角度 (因为y向下)。
    // 所以角度是 -rad.

    const angle = -rad;

    const isMajor = i % 90 === 0;
    const tickLen = isMajor ? 10 : 5;

    const x1 = Math.cos(angle) * r;
    const y1 = Math.sin(angle) * r;
    const x2 = Math.cos(angle) * (r - tickLen);
    const y2 = Math.sin(angle) * (r - tickLen);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (i % 30 === 0) {
      const tx = Math.cos(angle) * (r - 20);
      const ty = Math.sin(angle) * (r - 20);
      ctx.fillText(i, tx, ty);
    }
  }

  ctx.restore();
}

/**
 * 绘制秒表
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} r 半径
 * @param {number} time 时间(秒)
 */
export function drawStopwatch(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, time: number): void {
  ctx.save();
  ctx.translate(x, y);

  // 表壳
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = '#eee';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 按钮
  ctx.fillStyle = '#333';
  ctx.fillRect(-5, -r - 8, 10, 8);

  // 刻度
  ctx.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const angle = (Math.PI * 2 * i) / 60 - Math.PI / 2;
    const len = i % 5 === 0 ? 8 : 4;
    const x1 = Math.cos(angle) * r;
    const y1 = Math.sin(angle) * r;
    const x2 = Math.cos(angle) * (r - len);
    const y2 = Math.sin(angle) * (r - len);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // 指针
  const angle = (Math.PI * 2 * time) / 60 - Math.PI / 2;
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(angle) * (r - 5), Math.sin(angle) * (r - 5));
  ctx.stroke();

  // 数字显示
  ctx.fillStyle = '#000';
  ctx.font = '14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(time.toFixed(1), 0, r / 2);

  ctx.restore();
}

/**
 * 绘制条形磁铁
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} w 宽度
 * @param {number} h 高度
 * @param {number} angle 旋转角度
 */
export function drawMagnet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, angle: number = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const halfW = w / 2;
  const halfH = h / 2;

  // N极 (红色)
  ctx.fillStyle = '#ff4d4d';
  ctx.fillRect(-halfW, -halfH, halfW, h);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(-halfW, -halfH, halfW, h);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', -halfW / 2, 0);

  // S极 (蓝色)
  ctx.fillStyle = '#00b7ff';
  ctx.fillRect(0, -halfH, halfW, h);
  ctx.strokeRect(0, -halfH, halfW, h);

  ctx.fillStyle = '#fff';
  ctx.fillText('S', halfW / 2, 0);

  ctx.restore();
}

/**
 * 绘制点电荷
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} r 半径
 * @param {number} charge 电荷量 (正数红色+, 负数蓝色-)
 */
export function drawCharge(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, charge: number): void {
  ctx.save();
  ctx.translate(x, y);

  const color = charge > 0 ? '#ff4d4d' : '#00b7ff';
  const symbol = charge > 0 ? '+' : '-';

  // 电场晕染 (Glow)
  const gradient = ctx.createRadialGradient(0, 0, r, 0, 0, r * 2.5);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // 实体球
  ctx.globalAlpha = 1.0;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);

  // 球体立体感
  const ballGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  ballGrad.addColorStop(0, '#fff');
  ballGrad.addColorStop(0.3, color);
  ballGrad.addColorStop(1, '#000');

  ctx.fillStyle = ballGrad;
  ctx.fill();

  // 符号
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r * 1.2}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, 0, 0); // 微调垂直位置

  ctx.restore();
}

/**
 * 绘制电池
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} w 宽度
 * @param {number} h 高度
 * @param {number} angle 旋转角度
 */
export function drawBattery(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, angle: number = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const bodyW = w * 0.9;
  const capW = w * 0.1;
  const capH = h * 0.4;

  // 电池主体
  ctx.fillStyle = '#333'; // 黑色外壳
  ctx.fillRect(-w / 2, -h / 2, bodyW, h);

  // 金色条纹 (品牌标识区)
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-w / 2 + bodyW * 0.6, -h / 2, bodyW * 0.1, h);

  // 边框
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-w / 2, -h / 2, bodyW, h);

  // 正极帽
  ctx.fillStyle = '#ccc';
  ctx.fillRect(w / 2 - capW, -capH / 2, capW, capH);
  ctx.strokeRect(w / 2 - capW, -capH / 2, capW, capH);

  // 极性标识
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', w / 2 - capW - 10, 0);
  ctx.fillText('-', -w / 2 + 10, 0);

  ctx.restore();
}

/**
 * 绘制灯泡 (带底座)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X (底座中心)
 * @param {number} y 中心Y (底座中心)
 * @param {number} size 大小 (灯泡半径)
 * @param {boolean} isOn 是否点亮
 * @param {string} color 光色
 */
export function drawLightBulb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  isOn: boolean = false,
  color: string = '#ffff00'
): void {
  ctx.save();
  ctx.translate(x, y);

  // 1. 绘制底座 (Socket)
  // 底座是一个矩形或梯形，位于 (0, 0) 附近
  const baseW = size * 1.2;
  const baseH = size * 0.6;

  ctx.fillStyle = '#555'; // 深灰色底座
  ctx.fillRect(-baseW / 2, -baseH / 2, baseW, baseH);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.strokeRect(-baseW / 2, -baseH / 2, baseW, baseH);

  // 接线柱 (螺丝)
  ctx.fillStyle = '#888';
  ctx.beginPath();
  ctx.arc(-baseW / 3, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(baseW / 3, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  // 2. 绘制灯泡 (Bulb)
  // 灯泡位于底座上方 (y < 0)
  // 移动坐标系到灯泡中心位置
  const bulbCenterY = -baseH / 2 - size * 1.2;
  ctx.translate(0, bulbCenterY);

  const r = size;
  const neckW = r * 0.6;
  const neckH = r * 0.8;

  // 发光效果 (Glow)
  if (isOn) {
    const glow = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.5);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }

  // 玻璃泡主体
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI * 0.75, Math.PI * 2.25); // 大半圆

  // 颈部连接 (连接到底座)
  // 颈部底部 y = neckH + r (approx) -> 实际上我们要连接到 translate 之前的 0 点上方
  // 当前坐标系原点在灯泡球心。底座顶部在 -bulbCenterY - baseH/2 = size * 1.2
  // 让我们简单画一个颈部向下延伸

  const neckBottomY = size * 1.2;
  const neckTopX = Math.cos(Math.PI * 0.75) * r; // 负值
  const neckTopY = Math.sin(Math.PI * 0.75) * r; // 正值

  ctx.quadraticCurveTo(neckTopX, neckBottomY / 2, -neckW / 2, neckBottomY);
  ctx.lineTo(neckW / 2, neckBottomY);
  ctx.quadraticCurveTo(-neckTopX, neckBottomY / 2, -neckTopX, neckTopY);

  ctx.closePath();

  ctx.fillStyle = isOn ? color : 'rgba(255, 255, 255, 0.3)';
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 灯丝 (Filament)
  ctx.beginPath();
  ctx.strokeStyle = isOn ? '#fff' : '#555';
  ctx.lineWidth = 2;
  ctx.moveTo(-neckW / 3, neckBottomY);
  ctx.lineTo(-neckW / 3, 0);
  // 螺旋灯丝
  for (let i = 0; i < 4; i++) {
    const sx = -neckW / 3 + (i / 4) * ((2 * neckW) / 3);
    const ex = -neckW / 3 + ((i + 1) / 4) * ((2 * neckW) / 3);
    ctx.lineTo((sx + ex) / 2, 0 - (i % 2 == 0 ? 5 : -5));
  }
  ctx.lineTo(neckW / 3, 0);
  ctx.lineTo(neckW / 3, neckBottomY);
  ctx.stroke();

  // 螺纹底座 (Screw Base) - 在灯泡颈部和底座之间
  const screwH = size * 0.5;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(-neckW / 2, neckBottomY - screwH, neckW, screwH);
  ctx.strokeStyle = '#666';
  ctx.strokeRect(-neckW / 2, neckBottomY - screwH, neckW, screwH);

  // 螺纹线
  ctx.beginPath();
  for (let i = 1; i < 3; i++) {
    const ly = neckBottomY - screwH + (i / 3) * screwH;
    ctx.moveTo(-neckW / 2, ly);
    ctx.lineTo(neckW / 2, ly + 2);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制电线
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x:number, y:number}>} points 路径点数组
 * @param {string} color 颜色
 * @param {number} lineWidth 线宽
 */
export function drawWire(ctx: CanvasRenderingContext2D, points: Point[], color: string = '#d32f2f', lineWidth: number = 3): void {
  if (points.length < 2) return;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();

  ctx.restore();
}

/**
 * 绘制开关
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} width 宽度
 * @param {boolean} isOpen 是否断开
 */
export function drawSwitch(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, isOpen: boolean = true): void {
  ctx.save();
  ctx.translate(x, y);

  const h = width * 0.4;
  const r = 4; // 接线柱半径

  // 底座
  ctx.fillStyle = '#ddd';
  ctx.fillRect(-width / 2, -h / 2, width, h);
  ctx.strokeStyle = '#999';
  ctx.strokeRect(-width / 2, -h / 2, width, h);

  // 接线柱
  ctx.fillStyle = '#333';
  // 左
  ctx.beginPath();
  ctx.arc(-width / 3, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // 右
  ctx.beginPath();
  ctx.arc(width / 3, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 闸刀 (Lever)
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(-width / 3, 0);

  if (isOpen) {
    // 断开状态：向上翘起 30度
    const angle = -Math.PI / 6;
    const len = width * 0.7;
    ctx.lineTo(-width / 3 + Math.cos(angle) * len, Math.sin(angle) * len);
  } else {
    // 闭合状态：连接两端
    ctx.lineTo(width / 3, 0);
  }
  ctx.stroke();

  // 闸刀手柄
  if (isOpen) {
    const angle = -Math.PI / 6;
    const len = width * 0.7;
    const handleX = -width / 3 + Math.cos(angle) * len;
    const handleY = Math.sin(angle) * len;

    ctx.fillStyle = '#d32f2f'; // 红色手柄
    ctx.beginPath();
    ctx.arc(handleX, handleY, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.arc(width / 3, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 绘制万用表
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} width 宽度
 * @param {string|number} value 显示数值
 * @param {string} unit 单位
 */
export function drawMultimeter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: string | number,
  unit: string
): void {
  const height = width * 1.6;
  ctx.save();
  ctx.translate(x, y);

  // 外壳 (黄色或橙色常见)
  ctx.fillStyle = '#fbc02d';
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 屏幕区域
  const screenW = width * 0.8;
  const screenH = height * 0.25;
  ctx.fillStyle = '#e0e0e0'; // 灰底
  ctx.fillRect(-screenW / 2, -height / 2 + 15, screenW, screenH);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(-screenW / 2, -height / 2 + 15, screenW, screenH);

  // 数值显示
  ctx.fillStyle = '#000';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${value} ${unit}`, screenW / 2 - 10, -height / 2 + 15 + screenH / 2);

  // 旋钮 (Dial)
  const dialY = 10;
  const dialR = width * 0.25;

  // 刻度盘背景
  ctx.beginPath();
  ctx.arc(0, dialY, dialR + 5, 0, Math.PI * 2);
  ctx.fillStyle = '#333';
  ctx.fill();

  // 旋钮本体
  ctx.beginPath();
  ctx.arc(0, dialY, dialR, 0, Math.PI * 2);
  ctx.fillStyle = '#ddd';
  ctx.fill();

  // 旋钮指示条
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, dialY - dialR + 5);
  ctx.lineTo(0, dialY + dialR - 5);
  ctx.stroke();

  // 插孔 (Terminals)
  const termY = height / 2 - 25;
  const termSpacing = width * 0.25;

  // COM (黑)
  ctx.beginPath();
  ctx.arc(-termSpacing, termY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('COM', -termSpacing, termY + 15);

  // V/Ω (红)
  ctx.beginPath();
  ctx.arc(termSpacing, termY, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#d32f2f';
  ctx.fill();
  ctx.fillStyle = '#d32f2f';
  ctx.fillText('VΩmA', termSpacing, termY + 15);

  ctx.restore();
}

/**
 * 绘制电阻
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} width 总宽度 (包括引脚)
 * @param {Array<string>} bands 色环颜色数组 (默认4环: 棕黑红金 = 1kΩ)
 */
export function drawResistor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  bands: string[] = ['#8d6e63', '#000000', '#d32f2f', '#ffd700']
): void {
  ctx.save();
  ctx.translate(x, y);

  const height = width * 0.25; // 纵横比
  const bodyW = width * 0.6;

  // 引脚 (Leads)
  ctx.strokeStyle = '#bbb';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-width / 2, 0);
  ctx.lineTo(width / 2, 0);
  ctx.stroke();

  // 电阻主体 (Body) - 骨头形状
  ctx.fillStyle = '#f5deb3'; // 米黄色 (Wheat)

  // 绘制两端稍大的哑铃形
  const r = height / 2;
  const bulge = height * 0.2;

  ctx.beginPath();
  // 左端圆头
  ctx.arc(-bodyW / 2 + r, 0, r + bulge, Math.PI / 2, -Math.PI / 2);
  // 中间连接
  ctx.lineTo(bodyW / 2 - r, -r - bulge);
  // 右端圆头
  ctx.arc(bodyW / 2 - r, 0, r + bulge, -Math.PI / 2, Math.PI / 2);
  // 底部连接
  ctx.lineTo(-bodyW / 2 + r, r + bulge);
  ctx.closePath();

  ctx.fill();

  // 简单的光照效果
  const grad = ctx.createLinearGradient(0, -height, 0, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.6)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle = '#d2b48c';
  ctx.lineWidth = 1;
  ctx.stroke();

  // 色环 (Bands)
  // 裁剪区域以限制色环在电阻主体内
  ctx.clip();

  const bandW = bodyW * 0.08;
  const startX = -bodyW / 2 + bodyW * 0.2;
  const gap = bodyW * 0.15;

  bands.forEach((color, i) => {
    let bx = startX + i * gap;
    // 最后一环(误差环)通常离得远一点
    if (i === bands.length - 1 && bands.length > 3) {
      bx = bodyW / 2 - bodyW * 0.2;
    }

    ctx.fillStyle = color;
    ctx.fillRect(bx, -height * 2, bandW, height * 4);
  });

  ctx.restore();
}

/**
 * 绘制眼睛
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {number} size 大小 (宽度)
 * @param {number} angle 旋转角度 (0为向右看)
 */
export function drawEye(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number = 0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const h = size * 0.6; // 高度

  // 眼白 (Sclera)
  ctx.beginPath();
  ctx.moveTo(-size / 2, 0);
  ctx.quadraticCurveTo(0, -h, size / 2, 0);
  ctx.quadraticCurveTo(0, h, -size / 2, 0);
  ctx.closePath();

  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 虹膜 (Iris)
  const irisR = h * 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, irisR, 0, Math.PI * 2);
  ctx.fillStyle = '#42a5f5'; // 蓝色眼睛
  ctx.fill();

  // 瞳孔 (Pupil)
  const pupilR = irisR * 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, pupilR, 0, Math.PI * 2);
  ctx.fillStyle = '#000';
  ctx.fill();

  // 高光 (Highlight)
  ctx.beginPath();
  ctx.arc(-irisR * 0.3, -irisR * 0.3, pupilR * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fill();

  // 睫毛 (Eyelashes) - 可选，增加一点细节
  ctx.beginPath();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  // 上睫毛
  for (let i = -2; i <= 2; i++) {
    const lx = i * (size / 6);
    const ly = -h * 0.8; // 近似上眼睑位置
    // 简单的短线
    // ctx.moveTo(lx, ly);
    // ctx.lineTo(lx + i*2, ly - 5);
  }
  // ctx.stroke();

  ctx.restore();
}

/**
 * 绘制鱼
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x 中心X
 * @param {number} y 中心Y
 * @param {string} color 颜色
 * @param {number} opacity 透明度
 */
export function drawFish(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, opacity: number = 1.0): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  // 简单的鱼形状
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // 尾巴
  ctx.beginPath();
  ctx.moveTo(-15, 0);
  ctx.lineTo(-25, -10);
  ctx.lineTo(-25, 10);
  ctx.fill();

  // 眼睛
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(10, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(11, -3, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// 类型定义
interface Point {
  x: number;
  y: number;
}
