# 思源闪卡工具箱

<p align="center">
  <img src="icon.png" width="128" alt="闪卡工具箱图标" />
</p>

<p align="center">
  思源笔记中管理闪卡的工具箱插件，帮助您自定义、编辑和管理闪卡标题。
</p>

<p align="center">
  <a href="https://github.com/Run-os/sy-flashcard-toolbox-plugin/releases"><img src="https://img.shields.io/github/v/release/Run-os/sy-flashcard-toolbox-plugin" alt="最新版本" /></a>
  <a href="https://github.com/Run-os/sy-flashcard-toolbox-plugin/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Run-os/sy-flashcard-toolbox-plugin" alt="许可证" /></a>
</p>

---

## 演示

![演示动图](https://raw.githubusercontent.com/Run-os/sy-flashcard-toolbox-plugin/refs/heads/main/asset/PixPin_2026-03-06_23-26-52%5B00h00m00s-00h00m20s%5D.gif)

---

## 功能特性

| 功能 | 描述 |
|------|------|
| 🏷️ **自定义闪卡标题** | 为每张闪卡单独设置自定义标题，便于复习时快速识别 |
| ✏️ **快捷编辑按钮** | 在编辑器中的每个闪卡块旁直接显示编辑按钮，一键编辑 |
| 👁️ **实时预览** | 复习闪卡时自动替换并显示自定义标题 |
| 🔗 **无缝集成** | 与思源原生闪卡系统完美配合，不修改原始内容 |
| 💾 **持久化存储** | 自定义标题保存在思源块属性中，随笔记一同同步 |
| 📱 **全平台支持** | 同时支持桌面端（Electron）、Web 端和移动端 |

---

## 安装

### 方式一：思源集市（推荐）

在思源笔记的 **集市 → 插件** 中搜索「闪卡工具箱」并安装。

### 方式二：手动安装

1. 前往 [Releases](https://github.com/Run-os/sy-flashcard-toolbox-plugin/releases) 下载最新版本的 `package.zip`
2. 解压至思源笔记工作区的 `data/plugins/sy-flashcard-toolbox-plugin/` 目录
3. 重启思源笔记，在 **设置 → 插件** 中启用插件

---

## 使用方法

### 使用限制

仅支持带标题的制卡，如：`标题制卡和超级块制卡`，标题应当为闪卡的第一个元素。

### 编辑闪卡标题

1. 在编辑器中打开含有闪卡的文档
2. 鼠标悬停在闪卡块上，点击出现的编辑按钮（✏️）
3. 在弹出的对话框中输入自定义标题
4. 点击「保存」确认

自定义标题将以提示形式显示在编辑器中，并在复习时作为主标题呈现。

### 复习时显示

进入闪卡复习模式后，自定义标题将自动替换原有标题文本，帮助您快速识别卡片内容。删除自定义标题后，将恢复显示原始标题。

---

## 技术细节

- **框架**：[Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite](https://vitejs.dev/)
- **标题存储**：使用思源块属性 `custom-riff-title` 持久化自定义标题
- **动态检测**：使用 `MutationObserver` 监听 DOM 变化，自动处理新出现的闪卡
- **双模式支持**：分别针对编辑器模式与复习模式提供不同的处理逻辑

---

## 开发指南

### 环境准备

1. 安装 [Node.js](https://nodejs.org/) 和 [pnpm](https://pnpm.io/)
2. 克隆本仓库
3. 复制 `.env.example` 为 `.env`，配置 `VITE_SIYUAN_WORKSPACE_PATH` 为您的思源工作区路径

```bash
cp .env.example .env
```

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动监听模式，修改源代码后插件自动重新构建并部署到思源工作区。

### 生产构建

```bash
pnpm build
```

在项目根目录生成可发布的 `package.zip`。

### 发布版本

```bash
pnpm release:patch   # 递增补丁版本（1.0.x）
pnpm release:minor   # 递增次版本（1.x.0）
pnpm release:major   # 递增主版本（x.0.0）
pnpm release:manual  # 手动指定版本号
```

---

## 致谢

本项目大量参考了 [sy-tomato-plugin](https://github.com/IAliceBobI/sy-tomato-plugin)，感谢 [IAliceBobI](https://github.com/IAliceBobI) 的开源贡献。

---

## 贡献

欢迎提交 Issue 和 Pull Request！贡献前请先阅读现有代码结构，确保风格一致。

---

## 许可证

本项目基于 [MIT License](https://github.com/Run-os/sy-flashcard-toolbox-plugin/blob/main/LICENSE) 开源。

---

## 相关链接

- [思源笔记官网](https://b3log.org/siyuan/)
- [思源插件开发指南](https://github.com/siyuan-note/plugin-sample)
- [思源插件 SDK](https://github.com/siyuan-note/petal)
- [sysy-tomato-plugin](https://github.com/IAliceBobI/sy-tomato-plugin)
