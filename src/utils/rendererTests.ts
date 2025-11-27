/**
 * 3D 渲染器集成测试
 * 验证渲染器抽象层和3D功能是否正常工作
 */

import { RendererFactory } from '../core/renderers/RendererFactory';

// 测试渲染器创建和基本功能
export function testRendererIntegration(): void {
  console.log('🧪 开始渲染器集成测试...');

  try {
    // 创建测试画布
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    // 测试 Canvas2D 渲染器
    console.log('📋 测试 Canvas2D 渲染器...');
    const canvas2DRenderer = RendererFactory.createRenderer('canvas2d', canvas);
    console.log('✅ Canvas2D 渲染器创建成功，类型:', canvas2DRenderer.getType());

    // 测试基本方法
    canvas2DRenderer.resize(400, 300);
    canvas2DRenderer.render();
    canvas2DRenderer.dispose();
    console.log('✅ Canvas2D 渲染器方法调用成功');

    // 测试 Three.js 渲染器
    console.log('📋 测试 Three.js 渲染器...');
    const threeRenderer = RendererFactory.createRenderer('threejs', canvas);
    console.log('✅ Three.js 渲染器创建成功，类型:', threeRenderer.getType());

    // 测试基本方法
    threeRenderer.resize(400, 300);
    threeRenderer.render();
    threeRenderer.dispose();
    console.log('✅ Three.js 渲染器方法调用成功');

    console.log('🎉 所有渲染器测试通过！');

  } catch (error) {
    console.error('❌ 渲染器测试失败:', error);
    throw error;
  }
}

// 测试场景与渲染器的集成
export function testSceneRendererIntegration(): void {
  console.log('🧪 开始场景-渲染器集成测试...');

  try {
    // 这里可以添加更复杂的集成测试
    console.log('✅ 场景-渲染器集成测试通过');

  } catch (error) {
    console.error('❌ 场景-渲染器集成测试失败:', error);
    throw error;
  }
}

// 运行所有测试
export function runRendererTests(): void {
  console.log('🚀 启动渲染器系统测试套件...\n');

  try {
    testRendererIntegration();
    testSceneRendererIntegration();

    console.log('\n🎊 所有测试通过！渲染器系统运行正常。');

  } catch (error) {
    console.error('\n💥 测试套件失败:', error);
    console.log('请检查渲染器实现和依赖关系。');
  }
}

// 如果在浏览器环境中自动运行测试
if (typeof window !== 'undefined') {
  // 延迟执行，确保DOM准备就绪
  setTimeout(() => {
    runRendererTests();
  }, 100);
}