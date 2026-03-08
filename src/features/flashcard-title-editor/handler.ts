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
 * 核心逻辑复用，差异化分支处理
 * @param interfaceType 界面类型
 * @param element 闪卡元素
 */
export const handleFlashcardTitle = async (
  interfaceType: InterfaceType,
  element: HTMLElement
): Promise<void> => {
  // 核心复用逻辑：读取自定义标题属性
  const customTitle = getCustomTitle(element);

  // 差异化分支处理
  if (interfaceType === 'editor') {
    // 编辑界面：显示标题提示 + 添加编辑按钮
    await handleEditorTitle(element, customTitle);
  } else if (interfaceType === 'review') {
    // 闪卡界面：替换显示标题
    await handleReviewTitle(element, customTitle);
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
 * 解锁所有被锁定的标题块
 * 在进入编辑界面时调用
 */
export const unlockAllTitleBlocks = (): void => {
  const lockedElements = document.querySelectorAll<HTMLElement>(
    `[${TITLE_LOCKED_ATTR}]`
  );
  if (lockedElements.length === 0) return;

  lockedElements.forEach((element) => {
    element.contentEditable = 'true';
    element.removeAttribute(TITLE_LOCKED_ATTR);
  });
  debug.log(`🔓 已解锁 ${lockedElements.length} 个标题块`);
};

// ========== 编辑界面处理 ==========

/**
 * 编辑界面标题处理
 * @param element 闪卡元素
 * @param customTitle 自定义标题
 */
const handleEditorTitle = async (
  element: HTMLElement,
  customTitle: string | null
): Promise<void> => {
  // 排除闪卡界面（闪卡界面由 handleReviewTitle 处理）
  if (isInReviewInterface(element)) {
    return;
  }

  // 解锁所有被锁定的标题块
  unlockAllTitleBlocks();

  // 1. 添加编辑按钮
  addEditButtonToElement(element);

  // 2. 显示标题提示
  showTitleHintOnElement(element, customTitle);
};

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
    // 触发自定义事件，由 index.ts 处理对话框
    document.dispatchEvent(
      new CustomEvent('flashcard-title-edit', {
        detail: { blockId }
      })
    );
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

  // 获取标题文本元素（contenteditable）
  const textElement = headingElement.querySelector<HTMLElement>(
    HEADING_TEXT_SELECTOR
  );
  if (!textElement) return;

  if (customTitle && customTitle.trim()) {
    // 设置 data 属性，CSS 会自动显示伪元素
    textElement.setAttribute(EDITOR_TITLE_HINT_ATTR, customTitle.trim());
  } else {
    // 移除 data 属性
    textElement.removeAttribute(EDITOR_TITLE_HINT_ATTR);
  }
};

// ========== 闪卡界面处理 ==========

/**
 * 闪卡界面标题处理
 * @param element 闪卡元素
 * @param customTitle 自定义标题
 */
const handleReviewTitle = async (
  element: HTMLElement,
  customTitle: string | null
): Promise<void> => {
  debug.log('开始处理闪卡（已确认在闪卡界面）', element);

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