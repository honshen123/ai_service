<template>
  <view class="page" :class="themeClass">
    <view class="toolbar"><button class="btn-primary mini-btn" @tap="showCreateBase = true">新建知识库</button></view>
    <scroll-view scroll-y class="scroll-body">
      <view v-for="base in bases" :key="base.id" class="base-card" @tap="selectBase(base.id)">
        <text class="base-card__name">{{ base.name }}</text>
        <text class="base-card__desc">{{ base.description || '暂无描述' }}</text>
        <text class="base-card__meta">文档 {{ base.doc_count }} · 分块 {{ base.chunk_count }}</text>
      </view>
      <view v-if="bases.length === 0" class="empty-box">暂无知识库</view>
    </scroll-view>

    <view v-if="showCreateBase" class="popup-mask" @tap="showCreateBase = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">新建知识库</text>
        <view class="form-field"><text class="form-field__label">名称</text><input v-model="newBase.name" class="form-field__input" /></view>
        <view class="form-field"><text class="form-field__label">描述</text><input v-model="newBase.description" class="form-field__input" /></view>
        <button class="btn-primary" @tap="submitBase">创建</button>
      </view>
    </view>

    <view v-if="showDocPanel" class="popup-mask" @tap="showDocPanel = false">
      <view class="popup-panel doc-panel" @tap.stop>
        <view class="doc-panel__head">
          <text class="popup-panel__title">{{ activeBase?.name }}</text>
          <button class="btn-plain mini-btn" @tap="showIngest = true">入库</button>
        </view>
        <scroll-view scroll-y style="max-height: 50vh">
          <view v-for="doc in documents" :key="doc.id" class="doc-card">
            <text class="doc-card__title">{{ doc.title || '文档 #' + doc.id }}</text>
            <text class="doc-card__meta">分块 {{ doc.chunk_count }}</text>
            <button class="btn-danger-plain mini-btn" @tap.stop="removeDoc(doc.id)">删除</button>
          </view>
        </scroll-view>
      </view>
    </view>

    <view v-if="showIngest" class="popup-mask" @tap="showIngest = false">
      <view class="popup-panel" @tap.stop>
        <text class="popup-panel__title">文档入库</text>
        <view class="form-field"><text class="form-field__label">标题</text><input v-model="docForm.title" class="form-field__input" /></view>
        <view class="form-field"><text class="form-field__label">商品ID</text><input v-model="docForm.product_id" class="form-field__input" /></view>
        <button class="btn-plain mini-btn mb-2" @tap="chooseFile">选择文件(PDF/DOC/DOCX/TXT)</button>
        <text v-if="selectedFileName" class="file-hint">{{ selectedFileName }}</text>
        <view class="form-field"><text class="form-field__label">或手动输入内容</text><textarea v-model="docForm.content" class="form-field__textarea" /></view>
        <button class="btn-primary" @tap="submitDocument">提交入库</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { createKnowledgeBase, deleteDocument, ingestDocument, knowledgeBases, knowledgeDocuments, uploadKnowledgeDocument } from '@/api/tenant';
import type { KnowledgeBaseItem, KnowledgeDocumentItem } from '@/types/api';
import { ensurePermission } from '@/composables/useAccessGuard';
import { confirm, toastSuccess, useThemeClass } from '@/composables/useApp';

const themeClass = useThemeClass();
const bases = ref<KnowledgeBaseItem[]>([]);
const documents = ref<KnowledgeDocumentItem[]>([]);
const activeBaseId = ref<number | null>(null);
const showCreateBase = ref(false);
const showDocPanel = ref(false);
const showIngest = ref(false);
const newBase = reactive({ name: '', description: '' });
const docForm = reactive({ title: '', product_id: '', content: '' });
const selectedFilePath = ref('');
const selectedFileName = ref('');
const activeBase = computed(() => bases.value.find((b) => b.id === activeBaseId.value) || null);

function pickSelectedFile(file: { path?: string; name?: string } | undefined) {
  if (!file?.path) return;
  selectedFilePath.value = file.path;
  selectedFileName.value = file.name || file.path.split('/').pop() || '';
}

function chooseFile() {
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.pdf', '.doc', '.docx', '.txt'],
    success: (res) => {
      pickSelectedFile(res.tempFiles[0]);
    },
    fail: () => {
      uni.chooseFile({
        count: 1,
        extension: ['.pdf', '.doc', '.docx', '.txt'],
        success: (res) => {
          const files = Array.isArray(res.tempFiles) ? res.tempFiles : [res.tempFiles];
          const raw = files[0];
          pickSelectedFile(raw && 'path' in raw ? raw : undefined);
        },
      });
    },
  });
}

async function loadBases() { bases.value = await knowledgeBases(); }
async function loadDocuments() {
  if (!activeBaseId.value) return;
  documents.value = await knowledgeDocuments(activeBaseId.value);
}
async function selectBase(id: number) {
  activeBaseId.value = id;
  showDocPanel.value = true;
  await loadDocuments();
}
async function submitBase() {
  if (!newBase.name.trim()) return;
  await createKnowledgeBase({ name: newBase.name.trim(), description: newBase.description.trim() });
  toastSuccess('已创建');
  showCreateBase.value = false;
  newBase.name = ''; newBase.description = '';
  await loadBases();
}
async function submitDocument() {
  if (!activeBaseId.value) return;
  if (selectedFilePath.value) {
    const result = await uploadKnowledgeDocument(activeBaseId.value, selectedFilePath.value, {
      title: docForm.title.trim(),
      product_id: docForm.product_id.trim(),
    });
    toastSuccess(`已入库 ${result.chunk_count} 个分块`);
  } else if (docForm.content.trim()) {
    const result = await ingestDocument(activeBaseId.value, {
      title: docForm.title.trim(), content: docForm.content.trim(), product_id: docForm.product_id.trim(),
    });
    toastSuccess(`已入库 ${result.chunk_count} 个分块`);
  } else {
    return;
  }
  showIngest.value = false;
  docForm.title = ''; docForm.product_id = ''; docForm.content = '';
  selectedFilePath.value = ''; selectedFileName.value = '';
  await Promise.all([loadDocuments(), loadBases()]);
}
async function removeDoc(id: number) {
  if (!(await confirm('确认删除', '删除后不可恢复'))) return;
  await deleteDocument(id);
  toastSuccess('已删除');
  await Promise.all([loadDocuments(), loadBases()]);
}

onShow(() => {
  if (!ensurePermission('knowledge:view')) return;
  loadBases();
});
</script>

<style scoped lang="scss">
.toolbar { padding: 8px 16px; }
.scroll-body { height: calc(100vh - 80px); }
.base-card { margin: 0 16px 10px; padding: 14px; background: var(--cs-bg-elevated); border-radius: 12px; border: 1px solid var(--cs-divider); }
.base-card__name { display: block; font-weight: 600; }
.base-card__desc { display: block; margin-top: 4px; font-size: 13px; color: var(--cs-text-muted); }
.base-card__meta { display: block; margin-top: 8px; font-size: 12px; color: var(--cs-text-secondary); }
.doc-panel__head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.doc-card { padding: 12px; margin-bottom: 8px; background: var(--cs-bg-subtle); border-radius: 8px; }
.doc-card__title { display: block; font-weight: 600; }
.doc-card__meta { display: block; margin: 4px 0 8px; font-size: 12px; color: var(--cs-text-muted); }
.mini-btn { padding: 4px 12px; font-size: 12px; }
.file-hint { display: block; margin-bottom: 8px; font-size: 12px; color: var(--cs-text-secondary); }
.mb-2 { margin-bottom: 8px; }
</style>
