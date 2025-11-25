/**
 * 二维向量类
 * 提供基本的向量运算功能
 */
export class Vector2 {
  x: number;
  y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 向量加法
   * @param {Vector2} v
   * @returns {Vector2} 新向量
   */
  add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  /**
   * 向量减法
   * @param {Vector2} v
   * @returns {Vector2} 新向量
   */
  sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  /**
   * 标量乘法
   * @param {number} n
   * @returns {Vector2} 新向量
   */
  mult(n: number): Vector2 {
    return new Vector2(this.x * n, this.y * n);
  }

  /**
   * 标量除法
   * @param {number} n
   * @returns {Vector2} 新向量
   */
  div(n: number): Vector2 {
    if (n === 0) return new Vector2(0, 0);
    return new Vector2(this.x / n, this.y / n);
  }

  /**
   * 计算向量模长
   * @returns {number}
   */
  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 归一化向量
   * @returns {Vector2} 新向量
   */
  normalize(): Vector2 {
    const m = this.mag();
    if (m === 0) return new Vector2(0, 0);
    return this.div(m);
  }

  /**
   * 点积
   * @param {Vector2} v
   * @returns {number}
   */
  dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  /**
   * 计算两个向量之间的距离
   * @param {Vector2} v1
   * @param {Vector2} v2
   * @returns {number}
   */
  static dist(v1: Vector2, v2: Vector2): number {
    return v1.sub(v2).mag();
  }

  /**
   * 从角度创建向量
   * @param {number} angle 弧度
   * @param {number} length 长度
   * @returns {Vector2}
   */
  static fromAngle(angle: number, length: number = 1): Vector2 {
    return new Vector2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}
