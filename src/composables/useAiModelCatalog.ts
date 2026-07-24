import { computed, type Ref } from 'vue';
import type { TenantAiModelCatalogItem } from '@/types/api';

export interface AiModelCatalogProvider {
  code: string;
  models?: TenantAiModelCatalogItem[];
}

export interface AiModelCatalogForm {
  id: number;
  provider: string;
  model_name: string;
  display_name: string;
  model_type: number;
}

export function useAiModelCatalog(
  providers: Ref<AiModelCatalogProvider[]>,
  modelForm: AiModelCatalogForm,
) {
  const filteredModelOptions = computed((): TenantAiModelCatalogItem[] => {
    const provider = providers.value.find((item) => item.code === modelForm.provider);
    const models = provider?.models ?? [];
    return models.filter((item) => item.model_type === modelForm.model_type);
  });

  const modelOptionLabels = computed(() =>
    filteredModelOptions.value.map((item) =>
      item.display_name && item.display_name !== item.model_name
        ? `${item.display_name} (${item.model_name})`
        : item.model_name,
    ),
  );

  const modelOptionIndex = computed(() => {
    const idx = filteredModelOptions.value.findIndex((item) => item.model_name === modelForm.model_name);
    return idx >= 0 ? idx : 0;
  });

  function syncModelNameFromCatalog() {
    if (modelForm.id > 0) return;
    const options = filteredModelOptions.value;
    const matched = options.find((item) => item.model_name === modelForm.model_name);
    if (matched) {
      if (!modelForm.display_name.trim()) {
        modelForm.display_name = matched.display_name;
      }
      return;
    }
    const first = options[0];
    modelForm.model_name = first?.model_name || '';
    modelForm.display_name = first?.display_name || modelForm.model_name;
  }

  function onProviderChange() {
    syncModelNameFromCatalog();
  }

  function onModelTypeChange() {
    syncModelNameFromCatalog();
  }

  function onModelNamePick(index: number) {
    const item = filteredModelOptions.value[index];
    if (!item) return;
    modelForm.model_name = item.model_name;
    modelForm.display_name = item.display_name || item.model_name;
  }

  return {
    filteredModelOptions,
    modelOptionLabels,
    modelOptionIndex,
    syncModelNameFromCatalog,
    onProviderChange,
    onModelTypeChange,
    onModelNamePick,
  };
}
