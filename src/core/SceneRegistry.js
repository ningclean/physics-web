/**
 * 场景注册表
 * 负责管理所有可用的场景，提供注册和获取场景的接口。
 */
export class SceneRegistry {
  constructor() {
    this.scenes = new Map();
  }

  /**
   * 注册一个场景类
   * @param {string} key - 场景的唯一标识符
   * @param {Class} SceneClass - 场景类
   * @param {Object} metadata - 元数据 (例如标签)
   */
  register(key, SceneClass, metadata = {}) {
    if (this.scenes.has(key)) {
      console.warn(`Scene with key "${key}" already registered. Overwriting.`);
    }
    this.scenes.set(key, {
      Class: SceneClass,
      metadata: {
        label: key, // 默认标签为 key
        ...metadata
      }
    });
  }

  /**
   * 获取场景类
   * @param {string} key 
   * @returns {Class}
   */
  getSceneClass(key) {
    const entry = this.scenes.get(key);
    return entry ? entry.Class : null;
  }

  /**
   * 获取所有注册的场景信息
   * @returns {Array} [{ key, label, ... }]
   */
  getAll() {
    const list = [];
    this.scenes.forEach((value, key) => {
      list.push({
        key: key,
        SceneClass: value.Class,
        ...value.metadata
      });
    });
    return list;
  }
}

// 导出单例实例
export const sceneRegistry = new SceneRegistry();
