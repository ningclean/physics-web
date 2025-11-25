import './style.css';
import { Engine } from './core/Engine.ts';
import { sceneRegistry } from './core/SceneRegistry.ts';

// 导入场景
import { CircularScene } from './scenes/CircularScene.ts';
import { SHMScene } from './scenes/SHMScene.ts';
import { FreeFallScene } from './scenes/FreeFallScene.ts';
import { SpringOscillatorScene } from './scenes/SpringOscillatorScene.ts';
import { SimplePendulumScene } from './scenes/SimplePendulumScene.ts';
import { ElasticCollisionScene } from './scenes/ElasticCollisionScene.ts';
import { DoublePendulumScene } from './scenes/DoublePendulumScene.ts';
import { PlanetaryMotionScene } from './scenes/PlanetaryMotionScene.ts';
import { ProjectileMotionScene } from './scenes/ProjectileMotionScene.ts';
import { WaveInterferenceScene } from './scenes/WaveInterferenceScene.ts';
import { OpticsLensScene } from './scenes/OpticsLensScene.ts';
import { RefractionScene } from './scenes/RefractionScene.ts';
import { CircuitScene } from './scenes/CircuitScene.ts';
// import { GraphicsDemoScene } from './scenes/GraphicsDemoScene.js'; // No longer used as a scene

import { renderGraphicsDemo } from './pages/GraphicsDemoPage.ts';

import { ControlPanel } from './components/ControlPanel.ts';
import { FormulaDisplay } from './components/FormulaDisplay.ts';
import { RealTimeChart } from './components/RealTimeChart.ts';
import { KnowledgePanel } from './components/KnowledgePanel.ts';

// 全局变量类型声明
declare global {
  interface Window {
    engine: Engine;
    controlPanel: ControlPanel;
    formulaDisplay: FormulaDisplay;
    velChart: RealTimeChart;
    accChart: RealTimeChart;
    knowledgePanel: KnowledgePanel;
  }
}

// 注册场景
sceneRegistry.register('graphics-demo', null, {
  label: '图形组件库',
  description: '展示物理引擎中可复用的图形组件 (Stick Figure, Ball, etc.)。',
  thumbnail: '/thumbnails/graphicLib.jpg',
});
sceneRegistry.register('pendulum', SimplePendulumScene, {
  label: '单摆',
  description: '经典的单摆运动，展示周期与摆长的关系。',
  thumbnail: '/thumbnails/pendulum.gif',
});
sceneRegistry.register('circular', CircularScene, {
  label: '匀速圆周运动',
  description: '展示向心力、线速度与角速度的关系。',
  thumbnail: '/thumbnails/circular.gif',
});
sceneRegistry.register('shm', SHMScene, {
  label: '简谐运动',
  description: '弹簧振子与参考圆的对比，理解正弦运动。',
  thumbnail: '/thumbnails/shm.gif',
});
sceneRegistry.register('freefall', FreeFallScene, {
  label: '自由落体',
  description: '物体在重力作用下的匀加速直线运动。',
  thumbnail: '/thumbnails/freefall.gif',
});
sceneRegistry.register('spring', SpringOscillatorScene, {
  label: '弹簧振子',
  description: '阻尼振动与受迫振动的模拟。',
  thumbnail: '/thumbnails/spring.gif',
});
sceneRegistry.register('collision', ElasticCollisionScene, {
  label: '弹性碰撞',
  description: '二维平面上的动量守恒与动能守恒。',
  thumbnail: '/thumbnails/collision.gif',
});
sceneRegistry.register('double-pendulum', DoublePendulumScene, {
  label: '双摆',
  description: '展示混沌现象，对初始条件极其敏感。',
  thumbnail: '/thumbnails/double-pendulum.gif',
});
sceneRegistry.register('planetary', PlanetaryMotionScene, {
  label: '天体运动',
  description: '模拟行星绕恒星运动，验证开普勒定律。',
  thumbnail: '/thumbnails/planetary.gif',
});
sceneRegistry.register('projectile', ProjectileMotionScene, {
  label: '平抛/斜抛',
  description: '抛体运动的轨迹与速度分解。',
  thumbnail: '/thumbnails/projectile.gif',
});
sceneRegistry.register('wave', WaveInterferenceScene, {
  label: '波的干涉',
  description: '双波源干涉图样的实时模拟。',
  thumbnail: '/thumbnails/wave.gif',
});
sceneRegistry.register('optics-lens', OpticsLensScene, {
  label: '透镜成像',
  description: '凸透镜与凹透镜的几何成像规律演示。',
  thumbnail: '/thumbnails/optics-lens.gif',
});
sceneRegistry.register('refraction', RefractionScene, {
  label: '光的折射 (视深)',
  description: '为什么水里的鱼看起来比实际浅？',
  thumbnail: '/thumbnails/refraction.gif',
});
sceneRegistry.register('circuit', CircuitScene, {
  label: '直流电路实验室',
  description: '串联、并联与混合电路的电流与电压模拟。',
  thumbnail: '/thumbnails/circuit.gif',
});

document.addEventListener('DOMContentLoaded', () => {
  try {
    // --- 1. 初始化引擎与组件 ---
    const engine = new Engine('scene-canvas');

    const controlPanel = new ControlPanel('controls', engine);
    const formulaDisplay = new FormulaDisplay('formula');
    const knowledgePanel = new KnowledgePanel('knowledge');

    const velChart = new RealTimeChart('vel-chart', '速度 (px/s)', ['#ffa500', '#5cd65c']);
    const accChart = new RealTimeChart('acc-chart', '加速度 (px/s²)', ['#00b7ff', '#d28bff']);

    // 全局暴露 (调试用)
    window.controlPanel = controlPanel;
    window.formulaDisplay = formulaDisplay;
    window.velChart = velChart;
    window.accChart = accChart;
    window.engine = engine;

    // --- 2. 注册引擎回调 ---
    engine.onUpdate = (scene, totalTime) => {
      const data = scene.getMonitorData(totalTime);
      if (data) {
        if (data.vel) velChart.push(data.t, ...data.vel);
        if (data.acc) accChart.push(data.t, ...data.acc);
      }
    };

    engine.onSceneLoaded = scene => {
      window.currentScene = scene;

      // Find key
      const entry = sceneRegistry.getAll().find(e => e.SceneClass === scene.constructor);
      const key = entry ? entry.key : 'scene';

      // 配置 UI
      const controls = scene.getControlConfig();
      const legend = scene.getLegendConfig();
      controlPanel.setup(scene.params, controls, legend, key);

      controlPanel.on('parameter-change', data => {
        scene.emit('parameter-change', data);
      });

      controlPanel.on('request-reset', () => {
        if (scene.resetSimulation) {
          scene.resetSimulation();
          engine.resetTime();
        }
      });

      const formulas = scene.getFormulaConfig();
      formulaDisplay.setFormula(formulas);

      knowledgePanel.update(scene);

      const chartConfig = scene.getChartConfig();
      if (chartConfig) {
        if (chartConfig.vel) {
          velChart.setLabel(chartConfig.vel.label);
          velChart.setSeriesNames(chartConfig.vel.series);
          velChart.setColors(chartConfig.vel.colors);
          velChart.clear();
        } else {
          velChart.setSeriesNames([]);
          velChart.clear();
        }
        if (chartConfig.acc) {
          accChart.setLabel(chartConfig.acc.label);
          accChart.setSeriesNames(chartConfig.acc.series);
          accChart.setColors(chartConfig.acc.colors);
          accChart.clear();
        } else {
          accChart.setSeriesNames([]);
          accChart.clear();
        }
      } else {
        velChart.setSeriesNames([]);
        velChart.clear();
        accChart.setSeriesNames([]);
        accChart.clear();
      }

      // 同步下拉框状态 (如果存在)
      const selector = document.querySelector('#scene-selector select');
      if (selector) {
        const entry = sceneRegistry.getAll().find(e => e.SceneClass === scene.constructor);
        if (entry) selector.value = entry.key;
      }

      console.log(`Scene loaded: ${scene.constructor.name}`);
    };

    // --- 3. 视图管理与路由 ---
    const homeView = document.getElementById('home-view') as HTMLElement;
    const simView = document.getElementById('simulation-view') as HTMLElement;
    const customView = document.getElementById('custom-view') as HTMLElement;
    const sceneGrid = document.getElementById('scene-grid') as HTMLElement;
    const backBtn = document.getElementById('back-btn') as HTMLButtonElement;

    // 返回按钮逻辑
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.location.hash = ''; // 清空 hash 返回首页
      });
    }

    // 渲染首页卡片
    function renderHome(): void {
      if (!sceneGrid) return;
      sceneGrid.innerHTML = '';
      const scenes = sceneRegistry.getAll();

      scenes.forEach(item => {
        const card = document.createElement('div') as HTMLElement;
        card.className = 'scene-card';

        // 缩略图区域
        const thumb = document.createElement('div') as HTMLElement;
        thumb.className = 'card-thumb';

        if (item.thumbnail) {
          // Check if it's a video format we support for autoplay
          const isVideo = item.thumbnail.endsWith('.webm') || item.thumbnail.endsWith('.mp4');
          let media: HTMLImageElement | HTMLVideoElement;

          if (isVideo) {
            media = document.createElement('video') as HTMLVideoElement;
            media.autoplay = true;
            media.loop = true;
            media.muted = true;
            media.playsInline = true;
          } else {
            // Images (gif, png, jpg)
            media = document.createElement('img') as HTMLImageElement;
          }

          media.src = item.thumbnail;
          media.style.width = '100%';
          media.style.height = '100%';
          media.style.objectFit = 'cover';

          // Fallback to emoji on error
          media.onerror = () => {
            media.remove();
            const icon = document.createElement('div') as HTMLElement;
            icon.className = 'card-thumb-placeholder';
            icon.textContent = '⚛️';
            thumb.appendChild(icon);
          };

          thumb.appendChild(media);
        } else {
          const icon = document.createElement('div') as HTMLElement;
          icon.className = 'card-thumb-placeholder';
          icon.textContent = '⚛️'; // 暂时使用 emoji 作为占位符
          thumb.appendChild(icon);
        }

        // 内容区域
        const content = document.createElement('div') as HTMLElement;
        content.className = 'card-content';

        const title = document.createElement('h3') as HTMLElement;
        title.textContent = item.label;

        const desc = document.createElement('p') as HTMLElement;
        desc.textContent = item.description || '暂无描述';

        content.appendChild(title);
        content.appendChild(desc);

        card.appendChild(thumb);
        card.appendChild(content);

        // 点击跳转
        card.addEventListener('click', () => {
          window.location.hash = `#scene=${item.key}`;
        });

        sceneGrid.appendChild(card);
      });
    }

    // 加载场景逻辑
    function loadScene(key: string): void {
      const SceneClass = sceneRegistry.getSceneClass(key);
      if (SceneClass) {
        const sceneInstance = new SceneClass(engine.canvas);
        engine.loadScene(sceneInstance);
        engine.start();
      } else {
        console.error(`Scene class not found for key: ${key}`);
        // 如果找不到场景，可能需要返回首页或显示错误
      }
    }

    // 路由处理函数
    function handleRoute(): void {
      const hash = window.location.hash;

      if (hash.startsWith('#scene=')) {
        const key = hash.split('=')[1];

        if (key === 'graphics-demo') {
          homeView.style.display = 'none';
          simView.style.display = 'none';
          customView.style.display = 'flex';
          renderGraphicsDemo(customView);
          return;
        }

        // 切换到模拟视图
        homeView.style.display = 'none';
        customView.style.display = 'none';
        simView.style.display = 'flex';

        // 滚动到顶部
        window.scrollTo(0, 0);

        // 加载对应场景
        loadScene(key);

        // 确保引擎启动
        if (!engine.running) {
          engine.start();
        }
      } else {
        // 切换到首页视图
        simView.style.display = 'none';
        customView.style.display = 'none';
        homeView.style.display = 'flex';

        // 停止引擎以节省资源
        engine.pause();

        // 渲染首页列表
        renderHome();
      }
    }

    // --- 4. 快速切换器 (保留在模拟视图头部) ---
    const selectorContainer = document.getElementById('scene-selector') as HTMLElement;
    if (selectorContainer) {
      const select = document.createElement('select') as HTMLSelectElement;
      select.style.padding = '0.3rem';
      select.style.background = '#333';
      select.style.color = '#fff';
      select.style.border = '1px solid #555';
      select.style.borderRadius = '4px';

      const scenes = sceneRegistry.getAll();
      scenes.forEach(item => {
        const option = document.createElement('option') as HTMLOptionElement;
        option.value = item.key;
        option.textContent = item.label;
        select.appendChild(option);
      });

      select.onchange = (e: Event) => {
        // 修改 hash 触发路由跳转
        const target = e.target as HTMLSelectElement;
        window.location.hash = `#scene=${target.value}`;
      };

      selectorContainer.appendChild(select);
    }

    // --- 5. 启动监听 ---
    window.addEventListener('hashchange', handleRoute);

    // 处理初始路由
    handleRoute();
  } catch (e) {
    console.error('Failed to initialize engine:', e);
  }
});
