# 思源闪卡标题工具箱

思源笔记中管理闪卡标题的工具箱插件。帮助您自定义、编辑和管理闪卡标题。

[![1](./asset/readme1.png)](https://github.com/Run-os/siyuan-flashcard-title-toolbox-plugin/blob/main/asset/readme1.png)

演示视频：

![asset\PixPin_2026-03-06_23-26-52[00h00m00s-00h00m20s].gif](https://raw.githubusercontent.com/Run-os/siyuan-flashcard-title-toolbox-plugin/refs/heads/main/asset/PixPin_2026-03-06_23-26-52%5B00h00m00s-00h00m20s%5D.gif)

## 功能特性

- **自定义闪卡标题** - 为闪卡设置自定义标题，便于复习时快速识别
- **快捷编辑按钮** - 在编辑器中的闪卡上直接添加编辑按钮
- **实时预览** - 复习闪卡时显示自定义标题
- **无缝集成** - 与思源原生闪卡系统完美配合，不影响原始内容

## 安装方式

### 从集市安装

1. 打开思源笔记
2. 进入 `设置` → `集市`
3. 搜索 "闪卡标题工具箱"
4. 点击安装

### 手动安装

1. 从 [Releases](https://github.com/Run-os/siyuan-flashcard-title-toolbox-plugin/releases) 下载最新的 `package.zip`
2. 解压到思源工作空间：`{工作空间}/data/plugins/siyuan-flashcard-title-toolbox-plugin/`
3. 重启思源笔记
4. 在 `设置` → `集市` 中启用插件

## 使用方法

### 编辑闪卡标题

1. 在编辑器中找到闪卡块（带有闪卡图标的块）
2. 点击闪卡上出现的编辑按钮（✏️）
3. 在弹窗中输入自定义标题
4. 点击保存

自定义标题将在复习闪卡时显示。

### 复习时显示

复习闪卡时，自定义标题将替换原有的标题文本，帮助您快速识别卡片内容。

## 开发指南

### 开发模式

```bash
pnpm dev
```

此命令将构建插件并监听文件变化。当您修改源代码时，插件会自动重新构建。

### 构建

```bash
pnpm build
```

此命令将在项目根目录生成 `package.zip`。

### 发布版本

```bash
pnpm release:patch  # 递增补丁版本
pnpm release:minor  # 递增次版本
pnpm release:major  # 递增主版本
```

## 技术细节

- 使用 **Vite** 和 **Vue 3** 构建
- 使用思源块属性存储自定义标题（`custom-riff-title`）
- 使用 MutationObserver 动态检测闪卡
- 同时支持桌面端和移动端环境

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

[MIT License](./LICENSE)

## 相关链接

- [思源笔记](https://b3log.org/siyuan/)
- [插件开发指南](https://github.com/siyuan-note/plugin-sample)
