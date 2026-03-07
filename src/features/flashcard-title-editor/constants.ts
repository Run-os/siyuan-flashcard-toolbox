export const FLASHCARD_SELECTOR = '[custom-riff-decks]';

// 样式/命名前缀（隔离避免冲突）
export const PLUGIN_PREFIX = 'ft-editor';
export const EDIT_BUTTON_CLASS = `${PLUGIN_PREFIX}-edit-btn`;
export const CONTROLS_CONTAINER_CUSTOM_CLASS = `${PLUGIN_PREFIX}-controls`;

// 交互文案/图标
export const EDIT_BUTTON_ICON = 'iconEdit';
export const EDIT_BUTTON_TOOLTIP = '编辑闪卡标题';
export const DIALOG_TITLE = '修改闪卡标题';
export const SAVE_BUTTON_TEXT = '保存';
export const CANCEL_BUTTON_TEXT = '取消';

// 提示文案
export const TIP_SAVE_SUCCESS = '闪卡标题修改成功';
export const TIP_SAVE_FAILED = '闪卡标题修改失败';
export const TIP_LOADING = '加载中...';
export const TIP_BLOCK_ID_MISSING = '无法获取闪卡关联的块ID，请重试！';

// 块ID属性（多版本兼容）
export const BLOCK_ID_ATTRS = ['blockId', 'nodeId', 'cardId'];
// 自定义块属性（带插件前缀避免冲突）
export const FLASHCARD_TITLE_ATTR = 'custom-riff-title';

// 防抖延迟（ms）
export const DEBOUNCE_DELAY = 300;
// 通知显示时长（ms）
export const MSG_TIMEOUT = 2000;

// ========== 复习界面标题替换相关 ==========
// 复习界面容器选择器
export const REVIEW_CONTAINER_SELECTOR = '.protyle-wysiwyg';
// 标题元素类型标识
export const HEADING_TYPE = 'NodeHeading';
// 标题文本元素选择器
export const HEADING_TEXT_SELECTOR = 'div[contenteditable="true"]';
// 已替换标记属性
export const TITLE_REPLACED_FLAG = 'data-title-replaced';

// ========== 界面判断相关 ==========
// 复习界面标识属性（父级元素）
export const REVIEW_INTERFACE_ATTR = 'data-key';
export const REVIEW_INTERFACE_VALUE = 'dialog-opencard';
// 编辑器界面标识属性（父级元素）
export const EDITOR_INTERFACE_ATTR = 'data-loading';
export const EDITOR_INTERFACE_VALUE = 'finished';

// ========== 编辑界面标题提示相关 ==========
// 用于存储替代标题的 data 属性名
export const EDITOR_TITLE_HINT_ATTR = 'data-custom-title';
