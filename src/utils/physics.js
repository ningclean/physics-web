/**
 * physics.js
 * 物理定律库：包含通用的力学和运动学公式
 * 旨在解耦“怎么算”（数学/物理规则）与“算什么”（场景逻辑）
 */

export const Physics = {
    // 标准重力加速度 (虽然场景中可能覆盖，但提供一个基准)
    gravity: 9.8,

    /**
     * 胡克定律 (Hooke's Law)
     * F = -k * x
     * @param {number} k - 劲度系数 (Stiffness)
     * @param {number} displacement - 位移 (相对于平衡位置)
     * @returns {number} 弹力
     */
    springForce(k, displacement) {
        return -k * displacement;
    },

    /**
     * 线性阻尼力 (Linear Damping)
     * F = -c * v
     * @param {number} c - 阻尼系数 (Damping coefficient)
     * @param {number} velocity - 速度
     * @returns {number} 阻尼力
     */
    dampingForce(c, velocity) {
        return -c * velocity;
    },

    /**
     * 牛顿第二定律 (Newton's Second Law)
     * a = F / m
     * @param {number} force - 力
     * @param {number} mass - 质量
     * @returns {number} 加速度
     */
    acceleration(force, mass) {
        return force / mass;
    },

    /**
     * 单摆角加速度 (Angular Acceleration of Simple Pendulum)
     * alpha = -(g/L) * sin(theta) - (c/m) * omega
     * @param {number} g - 重力加速度
     * @param {number} length - 摆长
     * @param {number} theta - 摆角 (弧度)
     * @param {number} damping - 阻尼系数 (可选，默认为0)
     * @param {number} mass - 质量 (可选，如果有阻尼则需要)
     * @param {number} omega - 角速度 (可选，如果有阻尼则需要)
     * @returns {number} 角加速度
     */
    pendulumAngularAcceleration(g, length, theta, damping = 0, mass = 1, omega = 0) {
        const gravityTerm = -(g / length) * Math.sin(theta);
        const dampingTerm = damping ? -(damping / mass) * omega : 0;
        return gravityTerm + dampingTerm;
    },

    /**
     * 单摆周期 (小角度近似)
     * T = 2 * PI * sqrt(L / g)
     * @param {number} length - 摆长
     * @param {number} g - 重力加速度
     * @returns {number} 周期
     */
    pendulumPeriod(length, g) {
        return 2 * Math.PI * Math.sqrt(length / g);
    },

    /**
     * 弹簧振子固有角频率
     * omega = sqrt(k / m)
     * @param {number} k - 劲度系数
     * @param {number} m - 质量
     * @returns {number} 角频率
     */
    springNaturalFrequency(k, m) {
        return Math.sqrt(k / m);
    },

    /**
     * 弹簧静止伸长量 (竖直悬挂)
     * delta_l = m * g / k
     * @param {number} m - 质量
     * @param {number} g - 重力加速度
     * @param {number} k - 劲度系数
     * @returns {number} 伸长量
     */
    springStaticExtension(m, g, k) {
        return (m * g) / k;
    },
    
    /**
     * 单摆绳子拉力 (Tension)
     * T = m * (g * cos(theta) + L * omega^2)
     * @param {number} m - mass
     * @param {number} g - gravity
     * @param {number} theta - angle
     * @param {number} L - length
     * @param {number} omega - angular velocity
     * @returns {number} Tension force magnitude
     */
    pendulumTension(m, g, theta, L, omega) {
        return m * (g * Math.cos(theta) + L * omega * omega);
    },

    /**
     * 双摆角加速度 (Double Pendulum Angular Accelerations)
     * 计算 theta1 和 theta2 的角加速度
     * @param {Object} params - { m1, m2, L1, L2, g }
     * @param {Object} state - { theta1, theta2, omega1, omega2 }
     * @returns {Object} { alpha1, alpha2 }
     */
    doublePendulumAccelerations(params, state) {
        const { m1, m2, L1, L2, g } = params;
        const { theta1, theta2, omega1, omega2 } = state;
        
        const sinDiff = Math.sin(theta1 - theta2);
        const cosDiff = Math.cos(theta1 - theta2);
        const sinT1 = Math.sin(theta1);
        const sinT2 = Math.sin(theta2);
        
        // 分母中的公共项
        const denCommon = 2 * m1 + m2 - m2 * Math.cos(2 * theta1 - 2 * theta2);
        const den1 = L1 * denCommon;
        const den2 = L2 * denCommon;

        // alpha1
        const num1 = -g * (2 * m1 + m2) * sinT1 
                     - m2 * g * Math.sin(theta1 - 2 * theta2) 
                     - 2 * sinDiff * m2 * (omega2 * omega2 * L2 + omega1 * omega1 * L1 * cosDiff);
        
        // alpha2
        const num2 = 2 * sinDiff * (omega1 * omega1 * L1 * (m1 + m2) 
                     + g * (m1 + m2) * Math.cos(theta1) 
                     + omega2 * omega2 * L2 * m2 * cosDiff);

        return {
            alpha1: num1 / den1,
            alpha2: num2 / den2
        };
    },

    /**
     * 万有引力 (Gravitational Force Magnitude)
     * F = G * M * m / r^2
     * @param {number} G - 引力常数
     * @param {number} M - 质量1
     * @param {number} m - 质量2
     * @param {number} r - 距离
     * @returns {number} 引力大小
     */
    gravitationalForce(G, M, m, r) {
        if (r === 0) return 0; // 避免除以零
        return (G * M * m) / (r * r);
    }
};
