import { Dialog } from 'siyuan';
import {
  EDIT_BUTTON_CLASS,
  EDIT_BUTTON_TOOLTIP,
  TIP_BLOCK_ID_MISSING,
  EDITOR_FLASHCARD_SELECTOR,
  DIALOG_TITLE,
  SAVE_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TIP_TITLE_EMPTY,
  TIP_SAVE_SUCCESS,
  TIP_SAVE_FAILED,
  FLASHCARD_TITLE_ATTR,
  TITLE_REPLACED_FLAG
} from './constants';
import {
  isMobileEnv,
  showSiyuanMsg,
  filterInvalidChars,
  isHeadingElement,
  getHeadingTextElement,
  getCustomTitle
} from './utils';
import { getBlockAttrs, setBlockAttrs } from '../../api';

let observer: MutationObserver | null = null;
let editorObserver: MutationObserver | null = null;
let reviewObserver: MutationObserver | null = null;
let currentDialog: Dialog | null = null;

export const init = (plugin: any) => {
  setTimeout(() => {
    initMutationObserver();
    scanEditorFlashcards();
    initReviewObserver();
  }, 1000);
  
  if (plugin && typeof plugin.onunload === 'function') {
    plugin.onunload(() => cleanup());
  }
};

const initMutationObserver = () => {
  // 监听整个 body，捕获所有编辑器视图的变化
  editorObserver = new MutationObserver((mutations) => {
    // 检查是否有新的 protyle-wysiwyg 元素出现
    let shouldScan = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // 检查是否是编辑器相关元素
            if (node.classList?.contains('protyle-wysiwyg') || 
                node.querySelector?.('.protyle-wysiwyg') ||
                node.hasAttribute?.('custom-riff-decks')) {
              shouldScan = true;
              break;
            }
          }
        }
      }
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'custom-riff-decks' || 
           mutation.attributeName === 'data-node-id')) {
        shouldScan = true;
      }
      if (shouldScan) break;
    }
    if (shouldScan) {
      scanEditorFlashcards();
    }
  });

  // 监听整个文档
  editorObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['custom-riff-decks', 'data-node-id']
  });

  // 立即扫描一次
  scanEditorFlashcards();
};

const scanEditorFlashcards = () => {
  const cardElements = document.querySelectorAll<HTMLElement>(EDITOR_FLASHCARD_SELECTOR);
  
  cardElements.forEach((cardElement) => {
    const blockId = cardElement.getAttribute('data-node-id');
    if (!blockId) return;

    // 找到闪卡的最后一个 .protyle-attr（控制栏在这里）
    const allProtyleAttrs = cardElement.querySelectorAll<HTMLElement>(':scope > .protyle-attr');
    if (allProtyleAttrs.length === 0) return;
    
    const protyleAttr = allProtyleAttrs[allProtyleAttrs.length - 1];
    
    // 检查按钮是否已存在
    if (protyleAttr.querySelector(`.${EDIT_BUTTON_CLASS}`)) return;

    // 创建按钮（使用思源的 protyle-attr__btn 样式）
    const editButton = createEditButton(blockId);
    protyleAttr.appendChild(editButton);
  });
};

// ========== 复习界面标题替换功能 ==========

const DEBUG_PREFIX = '[FlashcardTitle]';

/**
 * 替换单个闪卡的标题
 * @param cardElement 闪卡元素
 */
const replaceFlashcardTitle = (cardElement: HTMLElement) => {
  console.log(DEBUG_PREFIX, '开始处理闪卡（已确认在复习界面）', cardElement);
  
  // 检查是否已替换，避免重复处理
  if (cardElement.hasAttribute(TITLE_REPLACED_FLAG)) {
    console.log(DEBUG_PREFIX, '已处理过，跳过');
    return;
  }
  
  // 获取自定义标题
  const customTitle = getCustomTitle(cardElement);
  console.log(DEBUG_PREFIX, 'custom-riff-title 属性值:', customTitle);
  
  // 如果标题为空，不做替换（保持原标题）
  if (!customTitle) {
    console.log(DEBUG_PREFIX, '标题为空，保持原标题不变');
    return;
  }
  
  // 获取第一个子元素（排除 protyle-attr）
  const firstChild = cardElement.querySelector<HTMLElement>(':scope > div:not(.protyle-attr)');
  console.log(DEBUG_PREFIX, '第一个子元素:', firstChild);
  console.log(DEBUG_PREFIX, '第一个子元素的 data-type:', firstChild?.getAttribute('data-type'));
  
  if (!firstChild) {
    console.log(DEBUG_PREFIX, '未找到第一个子元素');
    return;
  }
  
  if (!isHeadingElement(firstChild)) {
    console.log(DEBUG_PREFIX, '第一个子元素不是标题');
    return;
  }
  
  // 获取标题文本元素
  const textElement = getHeadingTextElement(firstChild);
  console.log(DEBUG_PREFIX, '标题文本元素:', textElement);
  console.log(DEBUG_PREFIX, '原标题文本:', textElement?.textContent);
  
  if (!textElement) {
    console.log(DEBUG_PREFIX, '未找到标题文本元素');
    return;
  }
  
  // 仅替换文本内容，保持所有属性和结构不变
  const originalText = textElement.textContent;
  textElement.textContent = customTitle;
  
  console.log(DEBUG_PREFIX, '✅ 标题替换成功:', originalText, '->', customTitle);
  
  // 标记已处理
  cardElement.setAttribute(TITLE_REPLACED_FLAG, 'true');
};

/**
 * 检查元素是否在复习界面内
 * @param element 待检查元素
 * @returns 是否在复习界面内
 */
const isElementInReviewInterface = (element: HTMLElement): boolean => {
  let parent = element.parentElement;
  while (parent) {
    if (parent.getAttribute('data-key') === 'dialog-opencard') {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
};

/**
 * 初始化复习界面 MutationObserver
 */
const initReviewObserver = () => {
  console.log(DEBUG_PREFIX, '初始化复习界面监听器');
  
  // 创建复习界面监听器
  reviewObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement;
      
      // 处理子节点变化
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        for (const node of Array.from(mutation.addedNodes)) {
          if (node instanceof HTMLElement) {
            // 先判断是否在复习界面内
            if (!isElementInReviewInterface(node)) {
              continue;
            }
            // 检查是否是带有 custom-riff-decks 属性的闪卡
            if (node.hasAttribute?.('custom-riff-decks')) {
              console.log(DEBUG_PREFIX, '检测到闪卡元素（新增，在复习界面内）', node);
              setTimeout(() => replaceFlashcardTitle(node as HTMLElement), 100);
              return;
            }
            
            // 检查子元素中是否有闪卡
            const cardElement = node.querySelector?.('[custom-riff-decks]') as HTMLElement;
            if (cardElement && isElementInReviewInterface(cardElement)) {
              console.log(DEBUG_PREFIX, '检测到闪卡元素（子元素，在复习界面内）', cardElement);
              setTimeout(() => replaceFlashcardTitle(cardElement), 100);
              return;
            }
          }
        }
      }
      
      // 处理属性变化（闪卡切换时可能通过修改属性来实现）
      if (mutation.type === 'attributes') {
        // 处理标签切换（class 属性变化，检测 item--focus 类）
        if (mutation.attributeName === 'class') {
          // 检查是否是标签栏的 item 元素
          if (target.classList?.contains('item') &&
              target.hasAttribute?.('data-type') &&
              target.getAttribute('data-type') === 'tab-header') {
            // 检查是否获得了焦点（切换到该标签）
            if (target.classList.contains('item--focus')) {
              console.log(DEBUG_PREFIX, '检测到标签切换到:', target.getAttribute('aria-label'));
              // 延迟扫描，等待内容加载
              setTimeout(() => scanCurrentFlashcard(), 200);
              return;
            }
          }
          continue;
        }
        
        // 先判断目标元素是否在复习界面内
        if (!isElementInReviewInterface(target)) {
          continue;
        }
        
        // 检查 custom-riff-title 属性变化
        if (mutation.attributeName === 'custom-riff-title') {
          // 检查目标元素是否是闪卡（有 custom-riff-decks 属性）
          if (target.hasAttribute?.('custom-riff-decks')) {
            console.log(DEBUG_PREFIX, '检测到闪卡标题属性变化（在复习界面内）', target, mutation.attributeName);
            // 移除已处理标记，允许重新处理
            target.removeAttribute(TITLE_REPLACED_FLAG);
            setTimeout(() => replaceFlashcardTitle(target), 100);
            return;
          }
        }
      }
    }
  });

  // 监听整个文档，包括属性变化
  reviewObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['custom-riff-title', 'class']
  });

  // 立即扫描一次当前显示的闪卡
  console.log(DEBUG_PREFIX, '立即执行首次扫描');
  scanCurrentFlashcard();
};

/**
 * 扫描当前复习界面显示的所有闪卡
 */
const scanCurrentFlashcard = () => {
  console.log(DEBUG_PREFIX, '扫描当前闪卡...');
  
  // 先检查是否在复习界面
  const reviewContainer = document.querySelector('[data-key="dialog-opencard"]');
  if (!reviewContainer) {
    console.log(DEBUG_PREFIX, '未找到复习界面容器，跳过扫描');
    return;
  }
  
  // 在复习界面容器内查找所有带有 custom-riff-decks 属性的闪卡
  // 不要求必须有 custom-riff-title 属性
  const cards = reviewContainer.querySelectorAll<HTMLElement>('[custom-riff-decks]');
  
  if (cards.length > 0) {
    console.log(DEBUG_PREFIX, `找到 ${cards.length} 个闪卡（在复习界面内）`);
    cards.forEach(card => {
      replaceFlashcardTitle(card);
    });
  } else {
    console.log(DEBUG_PREFIX, '未找到闪卡');
  }
};

// ========== 编辑器视图功能 ==========

const createEditButton = (blockId: string): HTMLElement => {
  const button = document.createElement('button');
  button.className = `svelte-5zv9mq ${EDIT_BUTTON_CLASS}`;
  button.textContent = '✍️';
  button.title = EDIT_BUTTON_TOOLTIP;

  button.addEventListener('click', (e) => {
    e.stopPropagation();
    openEditDialog(blockId);
  });

  return button;
};

const openEditDialog = async (blockId: string) => {
  if (!blockId) {
    showSiyuanMsg(TIP_BLOCK_ID_MISSING, 'error');
    return;
  }

  if (currentDialog) {
    currentDialog.destroy();
    currentDialog = null;
  }

  let inputTitle = '';
  
  try {
    const attrs = await getBlockAttrs(blockId);
    inputTitle = attrs[FLASHCARD_TITLE_ATTR] || '';
  } catch (error) {
    showSiyuanMsg('加载标题失败', 'error');
    return;
  }

  const isMobile = isMobileEnv();
  
  currentDialog = new Dialog({
    title: DIALOG_TITLE,
    content: `
      <div class="b3-dialog__content" style="padding: 24px;">
        <input
          id="ft-editor-title-input"
          type="text"
          class="b3-text-field fn__block"
          placeholder="请输入闪卡标题"
          value="${inputTitle.replace(/"/g, '&quot;')}"
          style="width: 100%; padding: 8px 12px;"
        />
      </div>
      <div class="b3-dialog__action">
        <button class="b3-button b3-button--cancel" id="ft-editor-cancel-btn">${CANCEL_BUTTON_TEXT}</button>
        <button class="b3-button b3-button--text" id="ft-editor-save-btn">${SAVE_BUTTON_TEXT}</button>
      </div>
    `,
    width: isMobile ? '90vw' : '400px',
    destroyCallback: () => {
      currentDialog = null;
    }
  });

  const inputEl = currentDialog.element.querySelector('#ft-editor-title-input') as HTMLInputElement;
  const cancelBtn = currentDialog.element.querySelector('#ft-editor-cancel-btn');
  const saveBtn = currentDialog.element.querySelector('#ft-editor-save-btn');

  const handleSave = async () => {
    const title = filterInvalidChars(inputEl.value);
    if (!title) {
      showSiyuanMsg(TIP_TITLE_EMPTY, 'error');
      return;
    }

    try {
      await setBlockAttrs(blockId, { [FLASHCARD_TITLE_ATTR]: title });
      showSiyuanMsg(TIP_SAVE_SUCCESS, 'success');
      currentDialog?.destroy();
      currentDialog = null;
    } catch (error) {
      showSiyuanMsg(TIP_SAVE_FAILED, 'error');
    }
  };

  const handleCancel = () => {
    currentDialog?.destroy();
    currentDialog = null;
  };

  inputEl?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') handleSave();
  });

  cancelBtn?.addEventListener('click', handleCancel);
  saveBtn?.addEventListener('click', handleSave);

  inputEl?.focus();
};

export const cleanup = () => {
  observer?.disconnect();
  observer = null;

  editorObserver?.disconnect();
  editorObserver = null;

  reviewObserver?.disconnect();
  reviewObserver = null;

  if (currentDialog) {
    currentDialog.destroy();
    currentDialog = null;
  }

  document.querySelectorAll(`.${EDIT_BUTTON_CLASS}`).forEach((btn) => btn.remove());
  
  // 移除已替换标记
  document.querySelectorAll(`[${TITLE_REPLACED_FLAG}]`).forEach((el) => {
    el.removeAttribute(TITLE_REPLACED_FLAG);
  });
};
