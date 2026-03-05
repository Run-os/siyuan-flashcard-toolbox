## 文档说明
本文档针对 `sy-tomato-plugin` 项目的4个核心功能拆解实现逻辑，适配思源笔记插件开发环境，仅保留中文使用环境适配，可直接提供给AI用于功能复刻。
## 一、功能1：获取超级块并添加边框
### 1.1 实现思路
思源笔记的超级块有专属DOM类标识，核心逻辑是**定位超级块DOM + 样式注入 + 监听DOM变化保证样式生效**。
### 1.2 核心实现步骤
#### （1）定位超级块DOM
思源笔记中超级块的DOM元素核心类名为 `protyle-wysiwyg__block--super`，通过选择器定位：
```typescript
// 获取所有超级块元素
const superBlocks = document.querySelectorAll('.protyle-wysiwyg__block--super');
```
#### （2）添加边框样式
可通过动态创建CSS样式表或直接修改元素style实现，推荐样式表方式（全局生效）：
```typescript
// 创建并注入超级块边框样式
const addSuperBlockBorderStyle = () => {
  // 避免重复注入
  if (document.getElementById('super-block-border-style')) return;
  
  const style = document.createElement('style');
  style.id = 'super-block-border-style';
  style.textContent = `
    .protyle-wysiwyg__block--super {
      border: 2px solid #4299e1 !important; /* 蓝色边框，可自定义 */
      border-radius: 4px !important;
      padding: 8px !important;
      margin: 4px 0 !important;
    }
  `;
  document.head.appendChild(style);
};
```
#### （3）监听DOM变化（保证新创建的超级块也生效）
使用 `MutationObserver` 监听编辑器区域的DOM变化，当超级块被创建/更新时重新应用样式：
```typescript
// 监听超级块DOM变化
const observeSuperBlocks = () => {
  const protyleContainer = document.querySelector('.protyle-wysiwyg');
  if (!protyleContainer) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        addSuperBlockBorderStyle(); // 每次DOM更新重新注入样式（或检查新增节点是否为超级块）
      }
    });
  });

  observer.observe(protyleContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'] // 仅监听class变化（超级块类名变更时触发）
  });
};

// 初始化调用
addSuperBlockBorderStyle();
observeSuperBlocks();
```
### 1.3 关键注意事项
- 思源笔记的DOM类名可能随版本变更，需验证 `protyle-wysiwyg__block--super` 是否为当前版本超级块类名；
- 样式需添加 `!important` 覆盖思源默认样式；
- MutationObserver需在插件卸载时销毁（避免内存泄漏）。

## 二、功能2：闪卡右上方添加功能按钮（暂停按钮+优先级滑块）
### 2.1 实现思路
核心逻辑是**定位闪卡容器 → 创建功能按钮/滑块DOM → 插入到指定位置 → 绑定事件逻辑**。
### 2.2 核心实现步骤
#### （1）定位闪卡容器
思源闪卡（Riff卡）的核心容器类名通常为 `riff-card`（需根据实际DOM验证），先获取闪卡容器：
```typescript
// 获取闪卡容器（单个/所有）
const getRiffCardContainer = () => {
  return document.querySelector('.riff-card'); // 单个闪卡，批量用querySelectorAll
};
```
#### （2）创建功能按钮和滑块DOM
```typescript
// 创建闪卡功能按钮组
const createRiffCardControls = (cardContainer: HTMLElement) => {
  // 避免重复创建
  if (cardContainer.querySelector('.riff-card-controls')) return;

  // 按钮组容器
  const controlsContainer = document.createElement('div');
  controlsContainer.className = 'riff-card-controls';
  controlsContainer.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // 1. 暂停按钮
  const pauseBtn = document.createElement('button');
  pauseBtn.innerText = '暂停闪卡';
  pauseBtn.style.cssText = `
    padding: 4px 8px;
    border: none;
    border-radius: 4px;
    background: #e53e3e;
    color: white;
    cursor: pointer;
    font-size: 12px;
  `;
  // 暂停按钮点击事件
  pauseBtn.addEventListener('click', () => {
    const cardId = cardContainer.dataset.cardId; // 假设闪卡容器有cardId属性
    pauseRiffCard(cardId); // 实现暂停闪卡的核心逻辑
  });

  // 2. 优先级滑块
  const sliderContainer = document.createElement('div');
  sliderContainer.style.cssText = 'display: flex; align-items: center; gap: 4px;';
  
  const sliderLabel = document.createElement('span');
  sliderLabel.innerText = '优先级：';
  sliderLabel.style.fontSize = '12px';

  const prioritySlider = document.createElement('input');
  prioritySlider.type = 'range';
  prioritySlider.min = '1';
  prioritySlider.max = '5';
  prioritySlider.value = '3'; // 默认值
  prioritySlider.style.width = '80px';
  // 滑块值变化事件
  prioritySlider.addEventListener('change', (e) => {
    const cardId = cardContainer.dataset.cardId;
    const priority = (e.target as HTMLInputElement).value;
    updateRiffCardPriority(cardId, priority); // 实现更新优先级的核心逻辑
  });

  // 组装滑块
  sliderContainer.appendChild(sliderLabel);
  sliderContainer.appendChild(prioritySlider);

  // 组装按钮组
  controlsContainer.appendChild(pauseBtn);
  controlsContainer.appendChild(sliderContainer);

  // 设置闪卡容器为相对定位（保证按钮绝对定位生效）
  cardContainer.style.position = 'relative';
  // 插入按钮组到闪卡容器
  cardContainer.appendChild(controlsContainer);
};
```
#### （3）实现暂停/更新优先级的核心逻辑
```typescript
// 暂停闪卡（示例逻辑，需结合思源闪卡API）
const pauseRiffCard = (cardId: string) => {
  // 调用思源闪卡相关API，标记闪卡为暂停状态
  fetch(`${window.siyuan.config.api}/api/riff/setCardStatus`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: cardId,
      status: 'paused' // 自定义状态，需适配思源实际字段
    })
  }).then(res => res.json()).then(() => {
    alert('闪卡已暂停');
  });
};

// 更新闪卡优先级（示例逻辑）
const updateRiffCardPriority = (cardId: string, priority: string) => {
  // 调用思源API更新闪卡优先级
  fetch(`${window.siyuan.config.api}/api/riff/updateCard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardId: cardId,
      priority: priority
    })
  }).then(res => res.json()).then(() => {
    console.log(`闪卡${cardId}优先级更新为${priority}`);
  });
};
```
#### （4）监听闪卡渲染并初始化按钮
```typescript
// 监听闪卡渲染完成
const observeRiffCardRender = () => {
  const riffContainer = document.querySelector('.riff-container'); // 闪卡父容器
  if (!riffContainer) return;

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        const cardContainer = getRiffCardContainer();
        if (cardContainer) {
          createRiffCardControls(cardContainer);
        }
      }
    });
  });

  observer.observe(riffContainer, {
    childList: true,
    subtree: true
  });
};

// 初始化
observeRiffCardRender();
```
### 2.3 关键注意事项
- 思源闪卡的DOM结构和API需以当前版本为准，需先验证 `riff-card`、`riff-container` 等类名；
- 按钮/滑块的样式需适配闪卡UI，避免视觉冲突；
- 所有事件监听需在插件卸载时移除，避免内存泄漏。

## 三、功能3：ToolbarBox.ts 中的按钮创建逻辑
### 3.1 核心设计思路
基于思源插件的 `BaseTomatoPlugin` 基类，实现**顶部栏按钮动态创建 + 配置项控制显示 + 快捷键绑定 + 多环境适配（移动端屏蔽）**。
### 3.2 核心实现步骤
#### （1）基础依赖与初始化
```typescript
import { BaseTomatoPlugin } from "./libs/BaseTomatoPlugin";
import { events } from "./libs/Events";
import { toolbarspacerepeat, toolbarrefreshVr, toolbarlocatedoc, toolbarTidy } from "./libs/stores"; // 配置项存储
import { winHotkey } from "./libs/winHotkey"; // 快捷键封装

// 定义按钮与快捷键映射（中文环境）
export const ToolBarBox间隔重复 = winHotkey("alt+backspace", "间隔重复", "iconRiffCard", () => "复习闪卡");
export const ToolBarBox刷新虚拟引用 = winHotkey("alt+delete", "刷新虚拟引用", "iconRef", () => "刷新虚拟引用");
export const ToolBarBox突出定位文档 = winHotkey("alt+enter", "突出定位文档", "iconFocus", () => "突出定位文档");
export const ToolBarBox整理assets下的图片视频音频 = winHotkey("ctrl+alt+shift+F9", "整理assets下的图片视频音频", "iconMove", () => "整理assets下的图片视频音频");
```
#### （2）按钮创建核心逻辑
```typescript
class ToolbarBox {
  public plugin: BaseTomatoPlugin;
  private ob: MutationObserver;

  // 初始化入口
  onload(plugin: BaseTomatoPlugin) {
    // 等待插件配置初始化完成
    if (plugin.initCfg()) {
      this._onload(plugin);
    } else {
      (async () => {
        await plugin.taskCfg;
        this._onload(plugin);
      })();
    }
  }

  // 实际创建逻辑
  _onload(plugin: BaseTomatoPlugin) {
    this.plugin = plugin;

    // 移动端不创建顶部栏按钮
    if (events.isMobile) return;

    // 1. 间隔重复按钮（根据配置项控制显示）
    if (toolbarspacerepeat.get()) {
      plugin.addTopBar({
        icon: ToolBarBox间隔重复.icon, // 图标
        title: `${ToolBarBox间隔重复.langText()} ${ToolBarBox间隔重复.w()}`, // 标题+快捷键
        position: "left", // 显示位置：左侧
        callback: () => {
          // 按钮点击回调：打开闪卡标签页
          openTab({ app: plugin.app, card: { type: "all" } });
        }
      });
    }

    // 2. 刷新虚拟引用按钮
    if (toolbarrefreshVr.get()) {
      plugin.addTopBar({
        icon: ToolBarBox刷新虚拟引用.icon,
        title: `${ToolBarBox刷新虚拟引用.langText()} ${ToolBarBox刷新虚拟引用.w()}`,
        position: "left",
        callback: refreshVirRef, // 自定义回调函数
      });
    }

    // 3. 突出定位文档按钮
    if (toolbarlocatedoc.get()) {
      plugin.addTopBar({
        icon: ToolBarBox突出定位文档.icon,
        title: `${ToolBarBox突出定位文档.langText()} ${ToolBarBox突出定位文档.w()}`,
        position: "left",
        callback: () => { locateDoc(this.lastPart); }, // 定位文档逻辑
      });
    }

    // 4. 整理assets按钮
    if (toolbarTidy.get()) {
      plugin.addTopBar({
        icon: ToolBarBox整理assets下的图片视频音频.icon,
        title: `${ToolBarBox整理assets下的图片视频音频.langText()} ${ToolBarBox整理assets下的图片视频音频.w()}`,
        position: "left",
        callback: () => {
          // 确认弹窗 + 执行整理逻辑
          confirm("⚠️整理assets下的图片视频音频", "即将创建快照", () => tidyAssets());
        },
      });
    }

    // 绑定命令（快捷键触发）
    this.bindPluginCommands(plugin);

    // 监听布局变化（用于定位文档）
    this.observeLayoutChange();
  }

  // 绑定命令（快捷键）
  private bindPluginCommands(plugin: BaseTomatoPlugin) {
    // 整理assets命令
    plugin.addCommand({
      langKey: ToolBarBox整理assets下的图片视频音频.langKey,
      langText: ToolBarBox整理assets下的图片视频音频.langText(),
      hotkey: ToolBarBox整理assets下的图片视频音频.m,
      callback: () => {
        confirm("⚠️整理assets下的图片视频音频", "即将创建快照", () => tidyAssets());
      },
    });

    // 间隔重复命令
    plugin.addCommand({
      langKey: ToolBarBox间隔重复.langKey,
      langText: ToolBarBox间隔重复.langText(),
      hotkey: ToolBarBox间隔重复.m,
      callback: () => openTab({ app: plugin.app, card: { type: "all" } })
    });

    // 其他命令同理...
  }

  // 监听布局变化，记录当前激活的文档块
  private observeLayoutChange() {
    const layouts = document.getElementById("layouts");
    if (!layouts) return;

    this.ob = new MutationObserver((mutationsList) => {
      for (let mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target as HTMLElement;
          if (target.classList.contains("protyle-active")) { // 激活的文档块类名
            this.lastPart = target;
          }
        }
      }
    });

    this.ob.observe(layouts, { attributes: true, childList: true, subtree: true });
  }

  // 插件卸载时销毁监听
  onunload() {
    this.ob?.disconnect();
    this.ob = null;
  }
}

// 刷新虚拟引用核心逻辑
async function refreshVirRef() {
  await siyuan.refreshVirtualBlockRef(); // 调用思源API
  events.protyleReload(); // 重新加载编辑器
  await siyuan.pushMsg("已经刷新虚拟引用", 2000); // 提示消息
}

// 实例化
export const toolbarBox = new ToolbarBox();
```
### 3.3 关键设计要点
1. **配置项控制**：通过 `toolbarspacerepeat.get()` 等配置项决定按钮是否显示，配置项通常基于本地存储实现；
2. **多环境适配**：通过 `events.isMobile` 判断是否为移动端，移动端不创建顶部栏按钮；
3. **快捷键封装**：`winHotkey` 封装快捷键定义、显示文本、图标，简化按钮标题拼接；
4. **生命周期管理**：`onload` 初始化、`onunload` 销毁监听，避免内存泄漏；
5. **命令绑定**：`addCommand` 绑定快捷键，实现“按钮点击 + 快捷键”双触发。

## 四、功能4：用选中的行创建超级块、超级块制卡、取消制卡
### 4.1 核心实现思路
**选中行获取 → 超级块创建（思源API） → 闪卡制卡/取消制卡（思源Riff卡API） → 交互反馈**。
### 4.2 核心实现步骤
#### （1）获取选中的行（思源编辑器API）
```typescript
import { protyle } from "siyuan";

// 获取编辑器中选中的行（block）
const getSelectedBlocks = () => {
  const currentProtyle = protyle.current; // 当前激活的编辑器实例
  if (!currentProtyle) return [];
  
  // 获取选中的block ID列表
  const selectedBlockIds = currentProtyle.selection.getSelectedBlocks();
  if (selectedBlockIds.length === 0) {
    alert("请选择至少一行内容");
    return [];
  }

  // 根据ID获取block详情
  return selectedBlockIds.map(id => currentProtyle.block.getBlock(id));
};
```
#### （2）创建超级块
```typescript
// 将选中行创建为超级块
const createSuperBlockFromSelected = async () => {
  const selectedBlocks = getSelectedBlocks();
  if (selectedBlocks.length === 0) return;

  const currentProtyle = protyle.current;
  // 思源API：将选中的block包裹为超级块
  await currentProtyle.block.createSuperBlock(selectedBlocks.map(b => b.id));
  
  alert("超级块创建成功");
  return selectedBlocks[0].rootID; // 返回超级块根ID，用于后续制卡
};
```
#### （3）超级块制卡（转换为闪卡）
```typescript
// 超级块制卡（基于思源Riff卡API）
const createRiffCardFromSuperBlock = async (superBlockId: string) => {
  if (!superBlockId) return;

  // 获取超级块内容
  const superBlock = await siyuan.getBlockByID(superBlockId);
  const cardFront = superBlock.content.split("\n")[0]; // 取第一行作为正面
  const cardBack = superBlock.content.split("\n").slice(1).join("\n"); // 剩余作为背面

  // 调用思源Riff卡API创建闪卡
  const res = await fetch(`${window.siyuan.config.api}/api/riff/addCard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blockId: superBlockId, // 关联超级块ID
      front: cardFront,
      back: cardBack,
      type: "superBlock" // 标记为超级块闪卡
    })
  });

  const data = await res.json();
  if (data.code === 0) {
    alert("超级块制卡成功");
  } else {
    alert(`制卡失败：${data.msg}`);
  }
};
```
#### （4）取消超级块制卡
```typescript
// 取消超级块对应的闪卡
const cancelRiffCardFromSuperBlock = async () => {
  const selectedBlocks = getSelectedBlocks();
  if (selectedBlocks.length === 0) return;

  const superBlockId = selectedBlocks[0].rootID;
  // 调用思源API：删除超级块关联的闪卡
  await fetch(`${window.siyuan.config.api}/api/riff/deleteCard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blockId: superBlockId // 通过超级块ID删除闪卡
    })
  });

  alert("取消制卡成功");
};
```
#### （5）绑定触发方式（右键菜单/快捷键）
```typescript
// 绑定右键菜单（思源插件方式）
const bindSuperBlockCardMenu = (plugin: BaseTomatoPlugin) => {
  plugin.addMenu({
    key: "superBlockCard",
    type: "block", // 块级右键菜单
    label: "超级块制卡/取消制卡",
    callback: async (node) => {
      const superBlockId = node.rootID;
      // 判断是否已制卡
      const hasCard = await checkSuperBlockHasCard(superBlockId);
      if (hasCard) {
        await cancelRiffCardFromSuperBlock();
      } else {
        await createSuperBlockFromSelected().then(superBlockId => {
          createRiffCardFromSuperBlock(superBlockId);
        });
      }
    }
  });
};

// 辅助函数：检查超级块是否已制卡
const checkSuperBlockHasCard = async (superBlockId: string) => {
  const res = await fetch(`${window.siyuan.config.api}/api/riff/getCardByBlockId`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blockId: superBlockId })
  });
  const data = await res.json();
  return data.code === 0 && data.data.length > 0;
};
```
### 4.3 关键注意事项
1. 思源的 `protyle`、`block`、`riff` 相关API需以当前版本为准，需先验证API路径和参数；
2. 超级块的 `rootID` 是关联闪卡的核心标识，需确保正确获取；
3. 制卡逻辑可自定义（如正面/背面的拆分规则），需适配业务需求；
4. 所有异步操作需添加错误处理，避免插件崩溃。

## 五、通用适配与注意事项（复刻时必看）
1. **思源版本适配**：所有DOM类名、API路径需以目标思源版本为准，建议先通过浏览器开发者工具验证；
2. **生命周期管理**：所有 `MutationObserver`、事件监听、定时器需在插件 `onunload` 阶段销毁；
3. **样式隔离**：自定义样式需添加专属类名前缀，避免与思源默认样式冲突；
4. **错误处理**：所有异步操作（API调用、DOM操作）需添加try/catch，避免插件崩溃；
5. **配置项存储**：推荐使用思源插件的 `stores` 封装本地配置（如按钮显示/隐藏），保证配置持久化。