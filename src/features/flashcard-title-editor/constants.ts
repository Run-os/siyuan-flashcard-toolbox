// 复习界面
export const FLASHCARD_CONTAINER_CLASS = '.riff-card';
export const FLASHCARD_PARENT_CONTAINER = '.riff-container';
export const CONTROLS_CONTAINER_CLASS = '.riff-card-controls';

// 编辑器视图
export const EDITOR_FLASHCARD_SELECTOR = '[custom-riff-decks]';
export const EDITOR_FLASHCARD_PARENT = '.protyle-wysiwyg';

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
export const TIP_TITLE_EMPTY = '标题不能为空';
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
