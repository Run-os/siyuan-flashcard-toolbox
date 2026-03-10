/**
 * 闪卡标题编辑器 - 统一处理模块
 * 提供统一的闪卡标题处理功能
 */

import type { InterfaceType } from './types';
import {
  EDIT_BUTTON_CLASS,
  EDIT_BUTTON_TOOLTIP,
  TITLE_REPLACED_FLAG,
  EDITOR_TITLE_HINT_ATTR,
  HEADING_TEXT_SELECTOR,
  TITLE_LOCKED_ATTR
} from './constants';
import {
  getCustomTitle,
  getHeadingTextElement,
  isInReviewInterface
} from './utils';
import { getBlockByID } from '../../api';
import { createDebugLogger } from '@/utils/debug';

const debug = createDebugLogger('FlashcardTitle:Handler');

// ========== 统一标记函数 ==========

/**
 * 统一标记元素已处理
 * @param element 元素
 * @param interfaceType 界面类型
 */
export const markElementProcessed = (
  element: HTMLElement,
  interfaceType: InterfaceType
): void => {
  if (interfaceType === 'review') {
    element.setAttribute(TITLE_REPLACED_FLAG, 'true');
  }
  // 编辑界面不需要标记，每次都重新扫描
};

/**
 * 检查元素是否已处理
 * @param element 元素
 * @param interfaceType 界面类型
 * @returns 是否已处理
 */
export const isElementProcessed = (
  element: HTMLElement,
  interfaceType: InterfaceType
): boolean => {
  if (interfaceType === 'review') {
    return element.hasAttribute(TITLE_REPLACED_FLAG);
  }
  return false; // 编辑界面每次都重新扫描
};

/**
 * 移除已处理标记
 * @param element 元素
 */
export const unmarkElementProcessed = (element: HTMLElement): void => {
  element.removeAttribute(TITLE_REPLACED_FLAG);
};

// ========== 统一标题处理函数 ==========

/**
 * 统一处理闪卡标题
 * 流程步骤：
 * 1. 扫描所有包含 custom-riff-decks 属性的元素
 * 2. 为每个元素添加编辑按钮
 * 3. 判断元素所在界面类型（3 类：review / editor / other）
 * 4. 分支处理：
 *    - review 界面：替换为「新标题」 + 锁定标题编辑
 *    - editor/other 界面：解锁标题 + 显示原标题 + 展示提示文案「原标题@@新标题」
 * @param _interfaceType 监听器传入的界面类型（未使用，改为元素实际位置判断）
 * @param element 闪卡元素
 */
export const handleFlashcardTitle = async (
  _interfaceType: InterfaceType,
  element: HTMLElement
): Promise<void> => {
  // 步骤 1：读取自定义标题属性
  const customTitle = getCustomTitle(element);

  // 步骤 2：判断元素实际所在界面类型（3 类：review / editor / other）
  const actualInterfaceType = isInReviewInterface(element) ? 'review' : 'editor';
  debug.log(`元素实际界面类型: ${actualInterfaceType}`);

  // 步骤 3：统一添加编辑按钮（所有界面都添加）
  addEditButtonToElement(element);

  // 步骤 4：根据界面类型分支处理
  if (actualInterfaceType === 'review') {
    // review 界面：替换为「新标题」 + 锁定标题编辑
    await handleReviewTitleDisplay(element, customTitle);
  } else {
    // editor/other 界面：解锁标题 + 显示原标题 + 展示提示文案「原标题@@新标题」
    await unlockTitleForElement(element);
    showTitleHintOnElement(element, customTitle);
  }
};

// ========== 标题锁定/解锁函数 ==========

/**
 * 锁定标题文本元素
 * 在闪卡界面替换标题后调用，防止用户编辑
 * @param textElement 标题文本元素
 */
const lockTitleElement = (textElement: HTMLElement): void => {
  textElement.contentEditable = 'false';
  textElement.setAttribute(TITLE_LOCKED_ATTR, 'true');
  debug.log('🔒 标题已锁定', textElement);
};

/**
 * 解锁单个标题文本元素
 * @param textElement 标题文本元素
 */
const unlockTitleElement = (textElement: HTMLElement): void => {
  if (textElement.hasAttribute(TITLE_LOCKED_ATTR)) {
    textElement.contentEditable = 'true';
    textElement.removeAttribute(TITLE_LOCKED_ATTR);
    debug.log('🔓 标题已解锁', textElement);
  }
};

/**
 * 解锁单个闪卡元素的标题
 * 用于编辑界面，确保标题可编辑
 * @param cardElement 闪卡元素
 */
const unlockTitleForElement = async (cardElement: HTMLElement): Promise<void> => {
  // 查找标题块
  const headingElement = cardElement.querySelector<HTMLElement>(
    '[data-type="NodeHeading"]'
  );
  if (!headingElement) return;

  // 获取标题文本元素（使用 getHeadingTextElement 兼容锁定/未锁定状态）
  const textElement = getHeadingTextElement(headingElement);
  if (!textElement) return;

  // 如果标题被锁定，解锁并恢复原标题
  if (textElement.hasAttribute(TITLE_LOCKED_ATTR)) {
    textElement.contentEditable = 'true';
    textElement.removeAttribute(TITLE_LOCKED_ATTR);

    // 恢复原标题文本
    const blockId = headingElement.getAttribute('data-node-id');
    if (blockId) {
      try {
        const block = await getBlockByID(blockId);
        if (block && block.content) {
          textElement.textContent = block.content;
          debug.log('🔓 已恢复原标题:', block.content);
        }
      } catch (error) {
        debug.log('获取原标题失败', error);
      }
    }
  }
};

// ========== 编辑按钮处理 ==========

/**
 * 为闪卡元素添加编辑按钮
 * @param cardElement 闪卡元素
 */
const addEditButtonToElement = (cardElement: HTMLElement): void => {
  const blockId = cardElement.getAttribute('data-node-id');
  if (!blockId) return;

  // 找到闪卡的最后一个 .protyle-attr（控制栏在这里）
  const allProtyleAttrs = cardElement.querySelectorAll<HTMLElement>(
    ':scope > .protyle-attr'
  );
  if (allProtyleAttrs.length === 0) return;

  const protyleAttr = allProtyleAttrs[allProtyleAttrs.length - 1];

  // 检查按钮是否已存在
  if (protyleAttr.querySelector(`.${EDIT_BUTTON_CLASS}`)) return;

  // 创建按钮
  const editButton = createEditButton(blockId);
  protyleAttr.appendChild(editButton);
};

/**
 * 创建编辑按钮
 * @param blockId 块ID
 * @returns 按钮元素
 */
export const createEditButton = (blockId: string): HTMLElement => {
  const button = document.createElement('button');
  button.className = `svelte-5zv9mq ${EDIT_BUTTON_CLASS}`;
  button.textContent = '✍️';
  button.title = EDIT_BUTTON_TOOLTIP;

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    // 触发自定义事件，由 index.ts 处理对话框
    document.dispatchEvent(
      new CustomEvent('flashcard-title-edit', {
        detail: { blockId }
      })
    );
  });

  // 阻止 mousedown 事件冒泡，防止触发闪卡界面的关闭行为
  button.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  return button;
};

/**
 * 在元素上显示标题提示
 * @param cardElement 闪卡元素
 * @param customTitle 自定义标题
 */
const showTitleHintOnElement = (
  cardElement: HTMLElement,
  customTitle: string | null
): void => {
  // 查找第一个标题块
  const headingElement = cardElement.querySelector<HTMLElement>(
    '[data-type="NodeHeading"]'
  );
  if (!headingElement) return;

  // 获取标题文本元素（使用 getHeadingTextElement 兼容锁定/未锁定状态）
  const textElement = getHeadingTextElement(headingElement);
  if (!textElement) return;

  if (customTitle && customTitle.trim()) {
    // 设置 data 属性，CSS 会自动显示伪元素
    textElement.setAttribute(EDITOR_TITLE_HINT_ATTR, customTitle.trim());
  } else {
    // 移除 data 属性
    textElement.removeAttribute(EDITOR_TITLE_HINT_ATTR);
  }
};

// ========== 闪卡界面标题显示处理 ==========

/**
 * 闪卡界面标题显示处理（仅处理标题替换，按钮由主函数统一添加）
 * @param element 闪卡元素
 * @param customTitle 自定义标题
 */
const handleReviewTitleDisplay = async (
  element: HTMLElement,
  customTitle: string | null
): Promise<void> => {
  debug.log('开始处理闪卡界面标题显示', element);

  // 检查是否已处理，避免重复处理
  if (isElementProcessed(element, 'review')) {
    debug.log('已处理过，跳过');
    return;
  }

  // 获取第一个子元素
  // 如果是超级块，需要在子元素中查找；否则 firstTitleChild 就是 cardElement 自身
  let firstTitleChild: HTMLElement | null;
  if (element.getAttribute('data-type') === 'NodeSuperBlock') {
    // 超级块：查找第一个子元素（排除 protyle-attr）
    firstTitleChild = element.querySelector<HTMLElement>(
      ':scope > div:not(.protyle-attr)'
    );
  } else {
    // 非超级块：cardElement 自身就是标题元素
    firstTitleChild = element;
  }

  if (!firstTitleChild) {
    debug.log('未找到第一个子元素');
    return;
  }

  // 获取标题文本元素
  const textElement = getHeadingTextElement(firstTitleChild);

  if (!textElement) {
    debug.log('未找到标题文本元素');
    return;
  }

  // 如果标题为空，需要恢复原标题并解锁
  if (!customTitle) {
    // 解锁标题元素，允许编辑
    unlockTitleElement(textElement);

    // 从标题元素获取块 ID 以查询原始标题（标题元素有独立的 data-node-id）
    const headingBlockId = firstTitleChild.getAttribute('data-node-id');
    if (headingBlockId) {
      try {
        const block = await getBlockByID(headingBlockId);
        if (block && block.content) {
          textElement.textContent = block.content;
          debug.log('原标题文本:', textElement?.textContent, '➡️ 标题已恢复为原标题:', block.content,'⚠️标题文本元素:', textElement);
        } else {
          debug.log('标题为空，保持原标题不变');
        }
      } catch (error) {
        debug.log('获取原标题失败，保持当前标题不变');
      }
    } else {
      debug.log('标题为空，保持原标题不变');
    }
    // 标记已处理
    markElementProcessed(element, 'review');
    return;
  }

  // 仅替换文本内容，保持所有属性和结构不变
  const originalText = textElement.textContent;
  textElement.textContent = `「${customTitle}」`;

  // 清除编辑界面可能遗留的 data-custom-title 属性，避免 CSS 伪元素重复显示
  textElement.removeAttribute(EDITOR_TITLE_HINT_ATTR);

  // 锁定标题元素，防止用户编辑
  lockTitleElement(textElement);

  debug.log('✅ 标题替换成功:', originalText, '->', customTitle);

  // 标记已处理
  markElementProcessed(element, 'review');
};

// ========== 清理函数 ==========

/**
 * 清理所有处理痕迹
 */
export const cleanupProcessedElements = (): void => {
  // 移除编辑按钮
  document.querySelectorAll(`.${EDIT_BUTTON_CLASS}`).forEach((btn) => btn.remove());

  // 移除已替换标记
  document.querySelectorAll(`[${TITLE_REPLACED_FLAG}]`).forEach((el) => {
    el.removeAttribute(TITLE_REPLACED_FLAG);
  });

  // 移除编辑界面标题提示属性
  document.querySelectorAll(`[${EDITOR_TITLE_HINT_ATTR}]`).forEach((el) => {
    el.removeAttribute(EDITOR_TITLE_HINT_ATTR);
  });
};