/**
 * 全局配置文件
 * 集中管理颜色、尺寸、字体等样式设置，以及部分物理模拟的默认参数。
 */

export const THEME = {
  // 颜色配置
  colors: {
    // 背景色选项
    background: {
      default: '#000000',
      gray: '#333333',
      white: '#ffffff'
    },
    // 矢量箭头颜色
    vectors: {
      velocity: '#ffa500',      // 橙色 (速度)
      acceleration: '#00b7ff',  // 蓝色 (加速度)
      force: '#32cd32',         // 绿色 (回复力/受力)
      gravity: '#9370db',       // 紫色 (重力)
      damping: '#ff4d4d',       // 红色 (阻尼/摩擦)
      components: '#cccccc'     // 灰色 (分量)
    },
    // 物体颜色
    objects: {
      ball: {
        light: '#eeeeee',     // 深色背景下的小球
        dark: '#333333',      // 浅色背景下的小球
        red: '#ff4d4d'        // 特殊红色小球 (如自由落体)
      },
      spring: '#dddddd',
      wall: {
        fillLight: '#cccccc', // 浅色背景下的墙填充
        fillDark: '#444444',  // 深色背景下的墙填充
        strokeLight: '#333333',
        strokeDark: '#ffffff'
      },
      ground: {
        light: '#999999',
        dark: '#666666'
      },
      referenceLine: '#2f7aea', // 参考线 (蓝色)
      trail: {
        darkBg: '#00ffff',    // 深色背景下的轨迹 (青色)
        lightBg: '#cc00cc'    // 浅色背景下的轨迹 (洋红)
      }
    },
    // 图表颜色
    chart: {
      grid: '#1e1e1e',
      axis: '#ffffff',
      text: '#aaaaaa',
      series: ['#ffa500', '#5cd65c', '#00b7ff', '#d28bff'] // 默认系列颜色
    },
    // UI 控件颜色
    ui: {
      border: '#444444',
      panelBg: '#222222',
      inputBg: '#333333',
      textMain: '#eeeeee',
      textSub: '#aaaaaa'
    }
  },

  // 尺寸配置
  sizes: {
    ballRadius: 15,
    dotRadius: 8,
    lineWidth: {
      thick: 2,
      thin: 1
    },
    arrow: {
      headLength: 15,
      defaultWidth: 2
    },
    trail: {
      width: 2,
      maxLength: 240,
      opacity: 0.8
    }
  },

  // 字体配置
  fonts: {
    label: '20px system-ui',
    axis: '14px system-ui',
    chartLabel: '12px system-ui',
    chartTick: '10px system-ui',
    annotation: '12px system-ui'
  },

  // 缩放比例 (用于将物理量转换为像素长度)
  scales: {
    velocity: 0.15,      // 速度矢量缩放
    acceleration: 0.15,  // 加速度矢量缩放
    force: 0.004,        // 力矢量缩放 (SpringOscillator)
    gravity: 0.5         // 重力矢量缩放 (FreeFall)
  }
};
