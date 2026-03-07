<template>
  <div class="b3-dialog--open">
    <div class="b3-dialog" style="z-index: 999999;">
      <div class="b3-dialog__scrim" @click="handleCancel"></div>
      <div class="b3-dialog__container" style="width: 400px;">
        <svg class="b3-dialog__close" @click="handleCancel"><use xlink:href="#iconCloseRound"></use></svg>
        <div class="b3-dialog__header">{{ DIALOG_TITLE }}</div>
        <div class="b3-dialog__body">
          <div v-if="loading" style="text-align: center; padding: 20px 0;">
            {{ TIP_LOADING }}
          </div>
          <div v-else>
            <input
              v-model="inputTitle"
              type="text"
              placeholder="请输入闪卡标题"
              class="b3-text-field fn__block"
              @keyup.enter="handleSave"
            />
          </div>
        </div>
        <div class="b3-dialog__action">
          <button class="b3-button b3-button--cancel" @click="handleCancel">
            {{ CANCEL_BUTTON_TEXT }}
          </button>
          <button class="b3-button b3-button--text" @click="handleSave" :disabled="loading">
            {{ SAVE_BUTTON_TEXT }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { showSiyuanMsg, filterInvalidChars } from './utils';
import {
  SAVE_BUTTON_TEXT,
  CANCEL_BUTTON_TEXT,
  TIP_LOADING,
  TIP_SAVE_SUCCESS,
  TIP_SAVE_FAILED,
  DIALOG_TITLE,
  FLASHCARD_TITLE_ATTR
} from './constants';
import { getBlockAttrs, setBlockAttrs } from '../../api';

const props = defineProps<{
  blockId: string;
  isVisible: boolean;
}>();

const emit = defineEmits<{
  (e: 'save', blockId: string, newTitle: string): void;
  (e: 'close'): void;
}>();

const visible = ref(false);
const loading = ref(false);
const inputTitle = ref('');

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleCancel();
  }
};

onMounted(() => {
  visible.value = props.isVisible;
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});

const loadCurrentTitle = async () => {
  try {
    loading.value = true;
    const attrs = await getBlockAttrs(props.blockId);
    inputTitle.value = attrs[FLASHCARD_TITLE_ATTR] || '';
  } catch (error) {
    showSiyuanMsg('加载标题失败', 'error');
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.isVisible,
  async (val) => {
    visible.value = val;
    if (val) {
      await loadCurrentTitle();
    }
  },
  { immediate: true }
);

const handleSave = async () => {
  const filteredTitle = filterInvalidChars(inputTitle.value);

  try {
    loading.value = true;
    await setBlockAttrs(props.blockId, { [FLASHCARD_TITLE_ATTR]: filteredTitle });
    emit('save', props.blockId, filteredTitle);
    showSiyuanMsg(TIP_SAVE_SUCCESS, 'success');
    handleCancel();
  } catch (error) {
    showSiyuanMsg(TIP_SAVE_FAILED, 'error');
  } finally {
    loading.value = false;
  }
};

const handleCancel = () => {
  emit('close');
  visible.value = false;
};
</script>

<style>
</style>
