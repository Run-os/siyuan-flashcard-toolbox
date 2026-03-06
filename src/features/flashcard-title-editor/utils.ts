import {
  BLOCK_ID_ATTRS,
  DEBOUNCE_DELAY,
  MSG_TIMEOUT,
  HEADING_TYPE,
  HEADING_TEXT_SELECTOR,
  REVIEW_INTERFACE_ATTR,
  REVIEW_INTERFACE_VALUE,
  EDITOR_INTERFACE_ATTR,
  EDITOR_INTERFACE_VALUE
} from './constants';
import { pushMsg, pushErrMsg } from '../../api';

export const debounce = (fn: Function, delay = DEBOUNCE_DELAY) => {
  let timer: any;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
};

export const getBlockIdFromCard = (cardElement: HTMLElement): string | null => {
  for (const attr of BLOCK_ID_ATTRS) {
    const id = (cardElement as any).dataset[attr];
    if (id) return id;
  }
  const blockNode = cardElement.closest('.protyle-wysiwyg__block');
  return blockNode ? (blockNode as any).dataset.blockId || null : null;
};

export const isMobileEnv = (): boolean => {
  return /Mobile|Android|iOS|iPad/.test(navigator.userAgent);
};

export const showSiyuanMsg = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (type === 'error') {
    pushErrMsg(msg, MSG_TIMEOUT);
  } else {
    pushMsg(msg, MSG_TIMEOUT);
  }
};

export const filterInvalidChars = (str: string): string => {
  return str.trim().replace(/[<>\/\\:"*?|]/g, '');
};

// ========== 复习界面标题替换工具函数 ==========

/**
 * 检测元素是否为标题元素
 * @param element 待检测元素
 * @returns 是否为标题元素
 */
export const isHeadingElement = (element: HTMLElement | Element): boolean => {
  return element.getAttribute('data-type') === HEADING_TYPE;
};

/**
 * 获取标题文本元素
 * @param headingElement 标题元素
 * @returns 标题文本 div 元素
 */
export const getHeadingTextElement = (headingElement: HTMLElement | Element): HTMLElement | null => {
  return headingElement.querySelector<HTMLElement>(HEADING_TEXT_SELECTOR);
};

/**
 * 获取闪卡的自定义标题
 * @param cardElement 闪卡元素
 * @returns 自定义标题或 null
 */
export const getCustomTitle = (cardElement: HTMLElement): string | null => {
  const title = cardElement.getAttribute('custom-riff-title');
  return title && title.trim() ? title.trim() : null;
};

// ========== 界面判断工具函数 ==========

/**
 * 判断闪卡元素是否在复习界面中
 * 通过检查父级元素是否具有 data-key="dialog-opencard" 属性
 * @param cardElement 闪卡元素
 * @returns 是否在复习界面中
 */
export const isInReviewInterface = (cardElement: HTMLElement): boolean => {
  // 向上查找父级元素，检查是否存在复习界面标识
  let parent = cardElement.parentElement;
  while (parent) {
    if (parent.getAttribute(REVIEW_INTERFACE_ATTR) === REVIEW_INTERFACE_VALUE) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};

/**
 * 判断闪卡元素是否在编辑器界面中
 * 通过检查父级元素是否具有 data-loading="finished" 属性
 * @param cardElement 闪卡元素
 * @returns 是否在编辑器界面中
 */
export const isInEditorInterface = (cardElement: HTMLElement): boolean => {
  // 向上查找父级元素，检查是否存在编辑器界面标识
  let parent = cardElement.parentElement;
  while (parent) {
    if (parent.getAttribute(EDITOR_INTERFACE_ATTR) === EDITOR_INTERFACE_VALUE) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};
