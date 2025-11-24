import { Scene } from '../core/Scene.js';
import { drawLine, drawDot } from '../utils/draw.js';
import { drawStickFigure, drawEye } from '../utils/graphics.js';
import { THEME } from '../config.js';
import description from '../content/OpticsLens.md?raw';

/**
 * 场景名称: 透镜成像 (Lens Imaging)
 * 物理现象: 模拟凸透镜和凹透镜的几何成像规律。
 */
export class OpticsLensScene extends Scene {
  constructor(canvas) {
    super(canvas);
    
    // 默认参数
    this.params = {
      f: 100,         // 焦距 (px), 正为凸, 负为凹
      do: 200,        // 物距 (px), 默认为正 (左侧)
      ho: 60,         // 物高 (px), 向上为正
      eyeX: 350,      // 人眼位置 (x坐标)
      showRays: true, // 显示光路
      lensType: 'convex', // 'convex' | 'concave' (用于UI控制f的符号)
      animationSpeed: 1.0, // 动画速度
      bgColor: sessionStorage.getItem('sceneBgColor') || THEME.colors.background.default
    };
    
    // 动画状态
    this.animTime = 0;
    this.animDuration = 3.0; // 完整动画周期 (秒)
    
    // 视口设置：原点在画布中心
    this.viewport.setCenter(0, 0);
    this.viewport.setScale(1.0);
  }

  getDescription() {
    return description;
  }

  setup() {
    this.resetSimulation();
    this.canvas.style.backgroundColor = this.params.bgColor;
    this.resize(this.canvas.clientWidth, this.canvas.clientHeight);
  }

  resetSimulation() {
    this.animTime = 0;
    if (window.velChart) window.velChart.clear();
    if (window.accChart) window.accChart.clear();
  }

  getControlConfig() {
    return [
      {
        type: 'select', key: 'lensType', label: '透镜类型',
        options: [
          { label: '凸透镜 (汇聚)', value: 'convex' },
          { label: '凹透镜 (发散)', value: 'concave' }
        ],
        onChange: (val) => {
          if (val === 'convex' && this.params.f < 0) this.params.f = -this.params.f;
          if (val === 'concave' && this.params.f > 0) this.params.f = -this.params.f;
          this.resetSimulation();
        }
      },
      { 
        type: 'range', key: 'f', label: '焦距大小 (f)', min: 50, max: 300, step: 10,
        description: '透镜焦距的绝对值。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'do', label: '物距 (do)', min: 50, max: 400, step: 10,
        description: '物体到透镜的距离。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'ho', label: '物高 (ho)', min: 10, max: 100, step: 5,
        description: '物体的高度。',
        onChange: () => this.resetSimulation()
      },
      { 
        type: 'range', key: 'eyeX', label: '人眼位置', min: 50, max: 500, step: 10,
        description: '观察者眼睛的水平位置。'
      },
      { 
        type: 'range', key: 'animationSpeed', label: '动画速度', min: 0.1, max: 3.0, step: 0.1,
        description: '光线传播的速度。'
      },
      { 
        type: 'boolean', key: 'showRays', label: '显示光路',
        description: '显示三条特殊光线。'
      },
      {
        type: 'select', key: 'bgColor', label: '背景颜色',
        options: [
          { label: '默认 (黑)', value: THEME.colors.background.default },
          { label: '白色', value: THEME.colors.background.white }
        ],
        onChange: (val) => { 
          this.canvas.style.backgroundColor = val; 
          sessionStorage.setItem('sceneBgColor', val);
        }
      },
      {
        type: 'action', label: '重播动画', onClick: () => this.resetSimulation()
      }
    ];
  }

  getLegendConfig() {
    return [
      { type: 'arrow', color: THEME.colors.objects.ball.light, label: '物体' },
      { type: 'arrow', color: '#00ff00', label: '像 (实像)' },
      { type: 'arrow', color: '#00ff00', label: '像 (虚像)', dashed: true },
      { type: 'line', color: '#ffff00', label: '光线' },
      { type: 'line', color: '#ffff00', label: '延长线', dashed: true }
    ];
  }

  getFormulaConfig() {
    return [
      { 
        label: '透镜公式', 
        tex: '\\frac{1}{f} = \\frac{1}{d_o} + \\frac{1}{d_i}',
        params: []
      },
      { 
        label: '放大率', 
        tex: 'M = -\\frac{d_i}{d_o} = \\frac{h_i}{h_o}',
        params: []
      }
    ];
  }

  getChartConfig() {
    return null;
  }

  getMonitorData(t) {
    return null;
  }

  update(dt, t) {
    const cycle = 5.0 / this.params.animationSpeed;
    this.animTime += dt;
    if (this.animTime > cycle) {
        this.animTime = 0;
    }
  }

  render(ctx) {
    const { width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    
    const fAbs = this.params.f;
    const isConvex = this.params.lensType === 'convex';
    const f = isConvex ? fAbs : -fAbs;
    const do_val = this.params.do;
    const ho = this.params.ho;
    const showRays = this.params.showRays;
    const animSpeed = this.params.animationSpeed;
    
    // 动画阶段计算
    // 使用距离驱动的动画
    const pixelsPerSec = 300 * animSpeed;
    const currentDist = this.animTime * pixelsPerSec;
    
    const isLightBg = this.params.bgColor === THEME.colors.background.white;
    const axisColor = isLightBg ? '#333' : '#888';
    const rayColor = '#ffff00';
    const rayDashColor = isLightBg ? '#aaaa00' : '#aaaa00';
    const objColor = THEME.colors.objects.ball.light;
    const imgColor = '#00ff00';

    // 1. 绘制主光轴
    ctx.beginPath();
    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    // 2. 绘制透镜 (实体玻璃效果)
    const lensH = 300;
    const lensW = 20;
    
    ctx.save();
    const glassFill = isLightBg ? 'rgba(200, 240, 255, 0.4)' : 'rgba(100, 200, 255, 0.2)';
    const glassStroke = isLightBg ? '#0099ff' : '#00ccff';
    
    ctx.fillStyle = glassFill;
    ctx.strokeStyle = glassStroke;
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    if (isConvex) {
        ctx.moveTo(cx, cy - lensH/2);
        ctx.quadraticCurveTo(cx + lensW, cy, cx, cy + lensH/2);
        ctx.quadraticCurveTo(cx - lensW, cy, cx, cy - lensH/2);
    } else {
        const edgeW = 15;
        const centerW = 5;
        ctx.moveTo(cx - edgeW, cy - lensH/2);
        ctx.lineTo(cx + edgeW, cy - lensH/2);
        ctx.quadraticCurveTo(cx + centerW, cy, cx + edgeW, cy + lensH/2);
        ctx.lineTo(cx - edgeW, cy + lensH/2);
        ctx.quadraticCurveTo(cx - centerW, cy, cx - edgeW, cy - lensH/2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.strokeStyle = isLightBg ? 'rgba(0, 153, 255, 0.3)' : 'rgba(0, 204, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx, cy - lensH/2);
    ctx.lineTo(cx, cy + lensH/2);
    ctx.stroke();
    ctx.restore();

    // 3. 标记焦点及整数倍焦距
    const fPixel = fAbs;
    const maxMultiple = Math.ceil(cx / fPixel); // 计算屏幕内能显示的最大倍数

    for (let i = 1; i <= maxMultiple; i++) {
        const label = i === 1 ? 'F' : `${i}F`;
        // 左侧
        if (cx - i * fPixel > 0) {
            this.drawFocus(ctx, cx - i * fPixel, cy, label, axisColor);
        }
        // 右侧
        if (cx + i * fPixel < width) {
            this.drawFocus(ctx, cx + i * fPixel, cy, label + '\'', axisColor);
        }
    }

    // 4. 绘制物体
    const objX = cx - do_val;
    const objY = cy;
    const objTopY = cy - ho;
    
    drawStickFigure(ctx, objX, objY, objTopY, objColor, '物');

    // 5. 计算像的位置
    let di = 0;
    let hi = 0;
    let hasImage = true;
    
    if (Math.abs(do_val - f) < 0.001) {
        hasImage = false;
    } else {
        di = (f * do_val) / (do_val - f);
        const M = -di / do_val;
        hi = M * ho;
    }

    // 6. 绘制像 (动画逻辑移到光路绘制中，统一处理)
    let imgX, imgTopY;
    let imageProgress = 0; // 0~1, 0=未开始, 1=完成
    
    if (hasImage) {
        imgX = cx + di;
        imgTopY = cy - hi; 
    }

    // 7. 绘制光路
    if (showRays) {
        ctx.lineWidth = 1;
        
        // 辅助函数：绘制射线路径
        // points: [{x, y}, ...]
        // maxLen: 当前允许绘制的最大长度
        // dashedAfterIndex: 在第几个点之后变成虚线 (可选)
        const drawPath = (points, maxLen, dashedAfterIndex = -1) => {
            let drawnLen = 0;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            
            for (let i = 0; i < points.length - 1; i++) {
                const p1 = points[i];
                const p2 = points[i+1];
                const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                
                const isDashed = dashedAfterIndex >= 0 && i >= dashedAfterIndex;
                
                // 设置样式
                if (isDashed) {
                    ctx.stroke(); // 绘制之前的实线
                    ctx.beginPath();
                    ctx.save();
                    ctx.setLineDash([5, 5]);
                    ctx.strokeStyle = rayDashColor; // 虚线颜色
                    ctx.moveTo(p1.x, p1.y);
                } else {
                    ctx.strokeStyle = rayColor;
                }

                if (drawnLen + segLen <= maxLen) {
                    // 完整绘制这一段
                    ctx.lineTo(p2.x, p2.y);
                    drawnLen += segLen;
                    if (isDashed) {
                        ctx.stroke();
                        ctx.restore();
                        ctx.beginPath();
                        ctx.moveTo(p2.x, p2.y);
                    }
                } else {
                    // 绘制部分
                    const remain = maxLen - drawnLen;
                    const ratio = remain / segLen;
                    const ex = p1.x + (p2.x - p1.x) * ratio;
                    const ey = p1.y + (p2.y - p1.y) * ratio;
                    ctx.lineTo(ex, ey);
                    ctx.stroke();
                    if (isDashed) ctx.restore();
                    
                    // 画光子头
                    drawDot(ctx, ex, ey, isDashed ? rayDashColor : rayColor, 2);
                    
                    return; // 结束
                }
            }
            ctx.stroke();
        };

        // 计算第一段距离 (物体 -> 透镜)
        // 假设所有光线第一段长度近似相同 (其实略有不同，但为了动画同步，我们统一用 cx-objX 近似?)
        // 为了精确，还是分别计算
        
        // 定义光线路径点
        // Ray 1: 平行 -> 焦点
        // Ray 2: 过光心
        // Ray 3: 过焦点 -> 平行
        
        const rays = [];
        
        // Ray 1
        {
            const pts = [{x: objX, y: objTopY}, {x: cx, y: objTopY}];
            let dashedIdx = -1;
            
            if (isConvex) {
                // 凸: 透镜 -> 像点 -> 远方
                if (hasImage && di > 0) { // 实像
                    pts.push({x: imgX, y: imgTopY});
                    // 延长到屏幕外
                    const slope = (imgTopY - objTopY) / (imgX - cx);
                    const endX = width + 100;
                    const endY = objTopY + slope * (endX - cx);
                    pts.push({x: endX, y: endY});
                    dashedIdx = 1; // Index 1 是透镜点。Index 2 是像点。
                    // 用户要求: "汇聚后变成虚线"。汇聚点是 Index 2 (imgX, imgTopY)。
                    // 所以在 Index 2 之后变成虚线。
                    dashedIdx = 2; 
                } else {
                    // 虚像: 透镜 -> 远方 (折射光线)
                    // 需计算折射方向: 过右焦点
                    const slope = (cy - objTopY) / ((cx + f) - cx);
                    const endX = width + 100;
                    const endY = objTopY + slope * (endX - cx);
                    pts.push({x: endX, y: endY});
                    // 虚像不需要画实光线的虚线部分，但需要画反向延长线
                    // 这里只处理实光线路径
                }
            } else {
                // 凹: 透镜 -> 远方 (发散)
                const slope = (objTopY - cy) / (cx - (cx - fAbs));
                const endX = width + 100;
                const endY = objTopY + slope * (endX - cx);
                pts.push({x: endX, y: endY});
            }
            rays.push({ pts, dashedIdx });
        }
        
        // Ray 2 (过光心)
        {
            const pts = [{x: objX, y: objTopY}, {x: cx, y: cy}];
            let dashedIdx = -1;
            // 直线传播
            const slope = (cy - objTopY) / (cx - objX);
            
            if (hasImage && di > 0) {
                pts.push({x: imgX, y: imgTopY});
                const endX = width + 100;
                const endY = cy + slope * (endX - cx);
                pts.push({x: endX, y: endY});
                dashedIdx = 2; // 汇聚点后变虚线
            } else {
                const endX = width + 100;
                const endY = cy + slope * (endX - cx);
                pts.push({x: endX, y: endY});
            }
            rays.push({ pts, dashedIdx });
        }
        
        // Ray 3
        {
            // 凸: 过左焦点 -> 平行
            // 凹: 指向右焦点 -> 平行
            let y_inc;
            if (isConvex) {
                const slope = (cy - objTopY) / ((cx - f) - objX);
                y_inc = objTopY + slope * (cx - objX);
            } else {
                const slope = (cy - objTopY) / ((cx + fAbs) - objX);
                y_inc = objTopY + slope * (cx - objX);
            }
            
            const pts = [{x: objX, y: objTopY}, {x: cx, y: y_inc}];
            let dashedIdx = -1;
            
            if (isConvex && hasImage && di > 0) {
                pts.push({x: imgX, y: imgTopY});
                // 平行后汇聚? 不，Ray 3 折射后是平行的。
                // 等等，Ray 3 (过焦点) 折射后平行于主光轴。
                // 平行光线怎么汇聚到像点？
                // 只有当物体在焦点外时，Ray 3 才会折射成平行光。
                // 此时像点由 Ray 1 和 Ray 2 确定。
                // 实际上 Ray 3 折射后平行于主光轴，它也会经过像点吗？
                // 像点坐标 (cx + di, cy - hi).
                // Ray 3 折射后 y = y_inc.
                // 几何关系: y_inc = -hi ?
                // 相似三角形: ho / (do - f) = y_inc / f => y_inc = ho * f / (do - f).
                // hi = ho * di / do = ho * (f*do/(do-f)) / do = ho * f / (do - f).
                // 是的，y_inc 的高度(相对于轴)等于像高。
                // 注意符号: objTopY < cy (ho>0). y_inc > cy (if real image inverted).
                // 所以 Ray 3 折射后确实经过像点 (imgX, imgTopY)。
                // 路径: 物 -> 透镜 -> 像点 -> 远方
                pts.push({x: width + 100, y: y_inc});
                // 对于 Ray 3，折射后是平行线，它"经过"像点吗？
                // 如果是实像，像点在右侧。平行线 y=y_inc 穿过 x=imgX 处的点 (imgX, y_inc)。
                // 既然 y_inc 对应像的高度，那么它确实经过像点。
                // 我们需要在像点处打断变虚线。
                // 插入像点
                const p3 = {x: imgX, y: y_inc};
                // 修正 pts: [Obj, Lens, Image, End]
                pts.pop(); // 移除 End
                pts.push(p3);
                pts.push({x: width + 100, y: y_inc});
                dashedIdx = 2;
            } else {
                // 虚像或发散
                pts.push({x: width + 100, y: y_inc});
            }
            rays.push({ pts, dashedIdx });
        }

        // 绘制所有实光线
        rays.forEach(ray => drawPath(ray.pts, currentDist, ray.dashedIdx));
        
        // 计算像的生成进度
        // 逻辑: 当光线到达像点时，像开始生成
        // 我们取 Ray 2 (过光心) 的距离作为基准，因为它最简单
        if (hasImage) {
            const distToLens = Math.hypot(cx - objX, cy - objTopY); // 近似
            let distLensToImg = 0;
            
            if (di > 0) { // 实像
                distLensToImg = Math.hypot(imgX - cx, imgTopY - cy);
                const totalDistToImg = distToLens + distLensToImg;
                
                if (currentDist > totalDistToImg) {
                    // 像开始生长
                    const growDist = 100; // 生长过程对应的光线行进距离
                    imageProgress = Math.min(1, (currentDist - totalDistToImg) / growDist);
                }
            } else { // 虚像
                // 虚像是由反向延长线形成的
                // 动画逻辑: 当发散光线(或其延长线)到达虚像位置时?
                // 虚像在物体同侧。光线向右传播。
                // 我们可以假设"虚拟光线"从透镜向左传播到像点
                distLensToImg = Math.hypot(imgX - cx, imgTopY - cy);
                // 当实光线走出透镜一段距离后，虚像显现
                if (currentDist > distToLens) {
                    const distAfterLens = currentDist - distToLens;
                    if (distAfterLens > distLensToImg) {
                        const growDist = 100;
                        imageProgress = Math.min(1, (distAfterLens - distLensToImg) / growDist);
                    }
                    
                    // 绘制虚像的反向延长线 (虚线)
                    // 仅当光线到达透镜后才画
                    // 简单起见，画从透镜到像点的虚线
                    // 随时间生长: 从透镜向像点生长? 还是从像点向透镜?
                    // 通常反向延长线是从光线发出的，所以从透镜向像点画
                    const extProgress = Math.min(1, distAfterLens / distLensToImg);
                    if (extProgress > 0) {
                        // Ray 1 延长线
                        if (isConvex) {
                            this.drawDashedLine(ctx, cx, objTopY, cx + (imgX-cx)*extProgress, cy + (imgTopY-cy)*extProgress, rayDashColor);
                        } else {
                            // 凹透镜 Ray 1 延长线: 从 (cx, objTopY) 到 (cx-f, cy) 即焦点，也是像的方向
                            // 凹透镜成像在焦点内。
                            this.drawDashedLine(ctx, cx, objTopY, cx + (imgX-cx)*extProgress, objTopY + (imgTopY-objTopY)*extProgress, rayDashColor);
                        }
                        // Ray 3 延长线 (略，避免太乱)
                    }
                }
            }
        }
    }
    
    // 绘制像 (根据进度)
    if (hasImage && imageProgress > 0) {
        const isRealImage = di > 0;
        ctx.save();
        if (!isRealImage) ctx.setLineDash([5, 5]);
        
        // 从汇聚点 (imgTopY) 向 坐标轴 (cy) 描绘
        // 箭头头部在 imgTopY. 尾部在 cy.
        // 动画: 尾部从 imgTopY 移动到 cy.
        const currentBottomY = imgTopY + (cy - imgTopY) * imageProgress;
        
        // 注意: drawObjectArrow 画的是从 bottom 到 top 的线，箭头在 top
        // 我们这里 bottom 是动态的
        drawStickFigure(ctx, imgX, currentBottomY, imgTopY, imgColor, imageProgress >= 1 ? '像' : null);
        
        ctx.restore();
    }

    // 8. 绘制人眼
    const eyeXPos = cx + this.params.eyeX;
    const eyeYPos = cy;
    // 眼睛看向透镜中心 (cx, cy)
    // 如果 eyeXPos > cx (在右侧), 向左看 (PI)
    // 如果 eyeXPos < cx (在左侧), 向右看 (0)
    const eyeAngle = eyeXPos > cx ? Math.PI : 0;
    
    drawEye(ctx, eyeXPos, eyeYPos, 40, eyeAngle);
    
    // 9. 绘制视觉光线 (Vision Rays)
    // 演示人眼如何通过接收光线并反向延长来看到像
    if (hasImage && showRays) {
        // 只有当眼睛在透镜右侧 (通常情况) 且光线能到达时才绘制
        // 简单起见，只要眼睛在透镜右侧就画
        if (eyeXPos > cx) {
            // 计算从像点 (imgX, imgTopY) 到 眼睛 (eyeXPos, eyeYPos) 的连线
            // 这条线穿过透镜的位置
            const slope = (eyeYPos - imgTopY) / (eyeXPos - imgX);
            const yAtLens = imgTopY + slope * (cx - imgX);
            
            // 检查穿过透镜的点是否在透镜范围内 (假设透镜高度足够大，或者限制一下)
            if (Math.abs(yAtLens - cy) < lensH/2) {
                const visionColor = '#00ffff'; // 青色表示视觉光线
                
                // 1. 绘制进入眼睛的实光线 (透镜 -> 眼睛)
                // 实际上光线是从透镜表面 (cx, yAtLens) 射向眼睛
                ctx.beginPath();
                ctx.strokeStyle = visionColor;
                ctx.lineWidth = 2;
                ctx.moveTo(cx, yAtLens);
                ctx.lineTo(eyeXPos, eyeYPos);
                ctx.stroke();
                
                // 箭头表示方向
                const midX = (cx + eyeXPos) / 2;
                const midY = (yAtLens + eyeYPos) / 2;
                // drawArrowHead(ctx, midX, midY, Math.atan2(eyeYPos - yAtLens, eyeXPos - cx), visionColor);
                
                // 2. 绘制反向延长线 (眼睛/透镜 -> 像)
                // 如果是虚像 (di < 0)，像在透镜左侧。反向延长线从透镜向左指。
                // 如果是实像 (di > 0)，像在透镜右侧。
                //    如果眼睛在实像后 (eyeX > imgX)，光线是 透镜 -> 像 -> 眼睛。
                //    如果眼睛在实像前 (eyeX < imgX)，眼睛无法聚焦实像(除非有屏幕)，但光线几何上指向像。
                
                ctx.save();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = visionColor;
                ctx.globalAlpha = 0.7;
                ctx.beginPath();
                
                if (di < 0) {
                    // 虚像: 绘制从透镜到像的虚线 (反向延长线)
                    ctx.moveTo(cx, yAtLens);
                    ctx.lineTo(imgX, imgTopY);
                } else {
                    // 实像
                    if (eyeXPos > imgX) {
                        // 眼睛在像后面: 光线经过像点。
                        // 此时 (cx, yAtLens) -> (imgX, imgTopY) 是实光线的一部分
                        // 我们把它画成实线或者另一种颜色?
                        // 为了符合"视觉光线"概念，我们画出这条路径
                        ctx.restore(); // 恢复实线
                        ctx.beginPath();
                        ctx.strokeStyle = visionColor;
                        ctx.moveTo(cx, yAtLens);
                        ctx.lineTo(imgX, imgTopY);
                        // 然后从像到眼睛也是实线 (已经包含在 透镜->眼睛 的连线中了? 不，透镜->眼睛是直连)
                        // 等等，如果实像在中间，(cx, yAtLens), (imgX, imgTopY), (eyeXPos, eyeYPos) 三点共线。
                        // 所以刚才画的 透镜->眼睛 已经覆盖了。
                        // 我们只需要强调一下像点
                        drawDot(ctx, imgX, imgTopY, visionColor, 3);
                        ctx.save(); // 重新save以便后面restore
                    } else {
                        // 眼睛在像前面: 眼睛看向像的位置(在眼睛后面)，这通常看不清。
                        // 但几何上，光线是汇聚向像点的。
                        // 画出从眼睛到像点的虚线 (表示光线原本要去的地方)
                        ctx.moveTo(eyeXPos, eyeYPos);
                        ctx.lineTo(imgX, imgTopY);
                    }
                }
                ctx.stroke();
                ctx.restore();
                
                // 3. 绘制对应的入射光线 (物体 -> 透镜)
                // 从物体发出，射向 (cx, yAtLens) 的光线
                ctx.beginPath();
                ctx.strokeStyle = visionColor;
                ctx.globalAlpha = 0.5; // 稍微淡一点
                ctx.moveTo(objX, objTopY);
                ctx.lineTo(cx, yAtLens);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
        }
    }
  }



  drawFocus(ctx, x, y, label, color) {
    drawDot(ctx, x, y, color, 3);
    ctx.fillStyle = color;
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 15);
  }



  drawRay(ctx, x1, y1, x2, y2, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  drawDashedLine(ctx, x1, y1, x2, y2, color) {
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
}
