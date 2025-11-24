import { THEME } from '../config.js';

/**
 * 绘图工具函数。
 */

export function drawAxes(ctx, width, height, color = '#444') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = THEME.sizes.lineWidth.thin;
  const midX = width / 2;
  const midY = height / 2;
  
  // X 轴
  ctx.beginPath();
  ctx.moveTo(0, midY); 
  ctx.lineTo(width, midY); 
  ctx.stroke();
  
  // Y 轴
  ctx.beginPath();
  ctx.moveTo(midX, 0); 
  ctx.lineTo(midX, height); 
  ctx.stroke();
  
  ctx.fillStyle = color;
  ctx.font = THEME.fonts.axis;
  
  // 绘制刻度
  for (let i = -5; i <= 5; i++) {
    if (i !== 0) {
      ctx.fillText(i.toString(), midX + i * 50 - 4, midY - 4); // x 轴数字
      ctx.fillText(i.toString(), midX + 4, midY - i * 50 + 4); // y 轴数字
    }
  }
  ctx.restore();
}

export function drawCircle(ctx, cx, cy, r, color = THEME.colors.objects.referenceLine) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = THEME.sizes.lineWidth.thin;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function drawDot(ctx, x, y, color = THEME.colors.objects.ball.red, radius = THEME.sizes.dotRadius) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/**
 * 在画布上绘制带箭头的向量
 * @param {CanvasRenderingContext2D} ctx - 画布的2D渲染上下文
 * @param {number} fromX - 向量起点的X坐标
 * @param {number} fromY - 向量起点的Y坐标
 * @param {number} dx - 向量在X方向的分量
 * @param {number} dy - 向量在Y方向的分量
 * @param {string} color - 向量的颜色
 * @param {string} [label] - 可选，向量的标签文本
 */
export function drawVector(ctx, fromX, fromY, dx, dy, color, label) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = THEME.sizes.arrow.defaultWidth;
  
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(fromX + dx, fromY + dy);
  ctx.stroke();
  
  // 箭头头部
  const len = Math.hypot(dx, dy);
  // 即使向量很短也尝试绘制，但限制箭头头部长度不超过向量长度的一定比例
  if (len > 0.5) {
    const ux = dx / len;
    const uy = dy / len;
    // 动态调整箭头大小：默认大小，但对于短向量，头部长度不超过向量长度的 60%
    const ah = Math.min(THEME.sizes.arrow.headLength, len * 0.6); 
    
    ctx.beginPath();
    ctx.moveTo(fromX + dx, fromY + dy);
    ctx.lineTo(fromX + dx - ah * (ux + uy * 0.3), fromY + dy - ah * (uy - ux * 0.3));
    ctx.lineTo(fromX + dx - ah * (ux - uy * 0.3), fromY + dy - ah * (uy + ux * 0.3));
    ctx.closePath();
    ctx.fill();
  }
  
  if (label) {
    ctx.font = THEME.fonts.label;
    const padding = 10;
    ctx.textAlign = dx >= 0 ? 'left' : 'right';
    ctx.textBaseline = dy >= 0 ? 'top' : 'bottom';
    ctx.fillText(label, fromX + dx + (dx >= 0 ? padding : -padding), fromY + dy + (dy >= 0 ? padding : -padding));
  }
  ctx.restore();
}

export function drawTrail(ctx, points, color = '#ffffff') {
  if (!points || points.length < 2) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = THEME.sizes.trail.width;

  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const alpha = i / points.length; // 越旧越透明
    
    ctx.globalAlpha = THEME.sizes.trail.opacity * alpha; // 增加最大不透明度以增强对比
    ctx.strokeStyle = color;
    
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
  ctx.restore();
}

// drawSpring 已迁移至 graphics.js，此处移除以避免重复


export function drawLine(ctx, x1, y1, x2, y2, color = '#fff', lineWidth = 1) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
