# Git 基础操作指南 (Git Basic Guide)

本文档旨在帮助您快速掌握 Git 的核心操作，包括版本更新、回滚以及日常开发流程。

## 1. 核心概念
- **工作区 (Working Directory)**: 您当前编辑代码的地方。
- **暂存区 (Staging Area)**: 临时存放您准备提交的修改 (`git add` 后的状态)。
- **仓库 (Repository)**: 存放所有历史版本的地方 (`git commit` 后的状态)。

## 2. 日常开发流程 (更新版本)

每当您完成一个功能或修复一个 Bug，请按以下步骤操作：

### 第一步：查看状态
检查哪些文件被修改了。
```bash
git status
```
- 红色：已修改但未暂存。
- 绿色：已暂存，准备提交。

### 第二步：添加修改
将修改的文件加入暂存区。
```bash
# 添加所有修改 (推荐)
git add .

# 或者只添加特定文件
git add src/main.js
```

### 第三步：提交版本
将暂存区的内容保存为一个新版本。
```bash
git commit -m "描述您做了什么修改"
```
> **规范示例**:
> - `feat: add gif recording feature` (新增功能)
> - `fix: fix ghosting issue in canvas` (修复 Bug)
> - `docs: update readme` (文档修改)

---

## 3. 版本回滚 (撤销修改)

### 场景 A：还没提交，想放弃修改
如果您在编辑器里改乱了，想恢复到上一次提交的状态：
```bash
# 放弃所有文件的修改 (慎用！)
git checkout .

# 放弃单个文件的修改
git checkout src/main.js
```

### 场景 B：已经提交了，想撤销最近一次提交
如果您刚提交完发现有错，想撤销这次提交（但保留代码修改）：
```bash
# 软回退：撤销 commit，代码保留在暂存区
git reset --soft HEAD~1
```

### 场景 C：彻底回退到某个版本
如果您想彻底丢弃最近的修改，回到过去：
```bash
# 硬回退：彻底丢弃最近一次提交的所有修改 (代码会消失，慎用！)
git reset --hard HEAD~1
```

---

## 4. 查看历史
查看项目的提交记录：
```bash
# 查看详细历史
git log

# 查看简洁历史 (推荐)
git log --oneline
```

## 5. 分支管理 (进阶)
在开发新功能时，建议使用分支，以免影响主干代码。

```bash
# 创建并切换到新分支
git checkout -b feature-new-scene

# ... 写代码 ...

# 切换回主分支
git checkout master

# 合并分支
git merge feature-new-scene
```
