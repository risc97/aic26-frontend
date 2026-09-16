import { ApiClient } from './api';

const api = new ApiClient();

export type SearchStage = {
  id: number;
  query: string;
};

class MultipleSearchStore {
  private nextStageId = 4;

  stages = $state<SearchStage[]>([
    { id: 1, query: "" },
    { id: 2, query: "" },
    { id: 3, query: "" }
  ]);
  semanticModel = $state<'siglip' | 'siglip2' | 'pe'>('siglip2');
  searchMode = $state<'semantic' | 'object_detect'>('semantic');

  // UI state
  showFilterDrawer = $state(false);

  // Loading state
  isSearching = $state(false);
  errorMessage = $state<string | null>(null);

  addStage() {
    this.stages.push({
      id: this.nextStageId,
      query: ""
    });

    this.nextStageId += 1;
  }

  removeStage(id: number) {
    if (this.stages.length === 1) return;
    this.stages = this.stages.filter((stage) => stage.id !== id);
  }

  async handleSearch() {}
}

export const multipleSearch = new MultipleSearchStore();