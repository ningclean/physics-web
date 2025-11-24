/**
 * 通用物理积分器模块。
 * 提供多种数值积分算法，用于计算物理系统的下一帧状态。
 */
export const Integrator = {
  /**
   * 欧拉法 (Euler Method)
   * 最简单的一阶积分方法。
   * y_{n+1} = y_n + f(t_n, y_n) * dt
   * 
   * @param {Object} state 当前状态对象 (例如 { x: 0, v: 0 })
   * @param {number} t 当前时间
   * @param {number} dt 时间步长
   * @param {Function} derivatives 导数函数，返回状态的变化率。
   *        签名: (state, t) => { dx: ..., dv: ... }
   * @returns {Object} 新的状态对象
   */
  euler(state, t, dt, derivatives) {
    const rates = derivatives(state, t);
    const newState = {};
    
    for (const key in state) {
      if (rates.hasOwnProperty(key)) {
        newState[key] = state[key] + rates[key] * dt;
      } else {
        newState[key] = state[key];
      }
    }
    
    return newState;
  },

  /**
   * 四阶龙格-库塔法 (Runge-Kutta 4th Order)
   * 高精度积分方法，误差为 O(dt^5)。
   * 
   * @param {Object} state 当前状态
   * @param {number} t 当前时间
   * @param {number} dt 时间步长
   * @param {Function} derivatives 导数函数 (state, t) => rates
   * @returns {Object} 新的状态对象
   */
  rk4(state, t, dt, derivatives) {
    // k1 = f(t, y)
    const k1 = derivatives(state, t);
    
    // k2 = f(t + dt/2, y + k1 * dt/2)
    const state2 = {};
    for (const key in state) {
      if (k1.hasOwnProperty(key)) {
        state2[key] = state[key] + k1[key] * dt * 0.5;
      } else {
        state2[key] = state[key];
      }
    }
    const k2 = derivatives(state2, t + dt * 0.5);
    
    // k3 = f(t + dt/2, y + k2 * dt/2)
    const state3 = {};
    for (const key in state) {
      if (k2.hasOwnProperty(key)) {
        state3[key] = state[key] + k2[key] * dt * 0.5;
      } else {
        state3[key] = state[key];
      }
    }
    const k3 = derivatives(state3, t + dt * 0.5);
    
    // k4 = f(t + dt, y + k3 * dt)
    const state4 = {};
    for (const key in state) {
      if (k3.hasOwnProperty(key)) {
        state4[key] = state[key] + k3[key] * dt;
      } else {
        state4[key] = state[key];
      }
    }
    const k4 = derivatives(state4, t + dt);
    
    // y_{n+1} = y_n + (k1 + 2k2 + 2k3 + k4) * dt / 6
    const newState = {};
    for (const key in state) {
      if (k1.hasOwnProperty(key)) {
        newState[key] = state[key] + (k1[key] + 2*k2[key] + 2*k3[key] + k4[key]) * dt / 6;
      } else {
        newState[key] = state[key];
      }
    }
    
    return newState;
  },

  /**
   * 半隐式欧拉法 (Semi-Implicit Euler / Symplectic Euler)
   * 特别适合哈密顿系统（如弹簧、单摆），能更好地保持能量守恒。
   * 注意：此方法需要明确区分位置和速度变量，因此接口略有不同。
   * 
   * @param {Object} state 当前状态 { pos, vel }
   * @param {number} dt 时间步长
   * @param {Function} accelerationFunc 加速度函数 (pos, vel, t) => acc
   * @returns {Object} 新的状态 { pos, vel }
   */
  semiImplicitEuler(pos, vel, t, dt, accelerationFunc) {
    const acc = accelerationFunc(pos, vel, t);
    const newVel = vel + acc * dt;
    const newPos = pos + newVel * dt;
    return { pos: newPos, vel: newVel };
  }
};
