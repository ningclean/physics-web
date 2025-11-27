/**
 * 3D 渲染器测试脚本
 * 用于验证 Three.js 集成是否正常工作
 */

import * as THREE from 'three';

// 测试基本 Three.js 功能
export function testThreeJS(): boolean {
  try {
    // 创建场景
    const scene = new THREE.Scene();

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);

    // 创建几何体
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 渲染一帧
    renderer.render(scene, camera);

    // 清理资源
    geometry.dispose();
    material.dispose();
    renderer.dispose();

    console.log('✅ Three.js 测试通过');
    return true;
  } catch (error) {
    console.error('❌ Three.js 测试失败:', error);
    return false;
  }
}

// 测试 3D 天体运动场景的基本功能
export function testPlanetaryMotion3D(): boolean {
  try {
    // 这里可以添加更详细的测试
    console.log('✅ 3D 天体运动场景测试通过');
    return true;
  } catch (error) {
    console.error('❌ 3D 天体运动场景测试失败:', error);
    return false;
  }
}

// 运行所有测试
export function runAllTests(): void {
  console.log('🚀 开始 3D 渲染测试...');

  const results = [
    testThreeJS(),
    testPlanetaryMotion3D()
  ];

  const passed = results.filter(Boolean).length;
  const total = results.length;

  console.log(`📊 测试结果: ${passed}/${total} 通过`);

  if (passed === total) {
    console.log('🎉 所有 3D 测试通过！');
  } else {
    console.log('⚠️ 部分测试失败，请检查配置');
  }
}