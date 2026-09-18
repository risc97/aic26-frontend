import { ApiClient } from './api';
import type { TemporalMatch, TemporalItem, CardItem } from './types';

const api = new ApiClient();

export type SearchStage = {
  id: number;
  query: string;
};

export type EventItem = {
  query: string;
  matches: TemporalMatch[];
}

class MultipleSearchStore {
  private nextStageId = 3;

  stages = $state<SearchStage[]>([
    { id: 1, query: "" },
    { id: 2, query: "" },
  ]);
  semanticModel = $state<'siglip' | 'siglip2' | 'pe'>('siglip2');
  searchMode = $state<'semantic' | 'object_detect'>('semantic');

  // UI state
  showFilterDrawer = $state(false);
  allowSingleSubmit = $state(false);
  sequenceView = $state(true);    // true for sequence view, false for event view
  exclusion = $state<string>("");
  exclusionArray = $derived(this.exclusion.split(',').map(s => s.trim()).filter(s => s.length > 0));
  limit = $state(100);

  // Loading state
  isSearching = $state(false);
  errorMessage = $state<string | null>(null);

  videoDialogOpen = $state(false);
  qaAnswer = $state<string>('');

  // Data state
  sequenceResultsPre = $state<TemporalItem[]>([]);
  sequenceResults = $derived.by(() => {
    return this.sequenceResultsPre.filter(r => {
      for (const exclusion of this.exclusionArray) {
        if (exclusion.includes('-')) {
          // Format: "video_id-keyframe_id" -> filter just that specific keyframe
          const lastHyphenIndex = exclusion.lastIndexOf('-');
          const vid = exclusion.substring(0, lastHyphenIndex);
          const kid = exclusion.substring(lastHyphenIndex + 1);

          if (
            r.video_id === vid &&
            'keyframe_id' in r &&
            r.keyframe_id === kid
          ) {
            return false;
          }
        } else {
          // Format: "video_id" -> filter the whole video
          if (r.video_id === exclusion) {
            return false;
          }
        }
      }
      return true;
    })
  });
  eventResults = $derived.by(() =>
    this.stages.map((stage, stageIndex): EventItem => ({
      query: stage.query,
      matches: this.sequenceResults.flatMap((result) => {
        // Find the match belonging to this stage (0-indexed)
        const card = result.matches?.find((m) => m.stage === stageIndex);
        return card ? [card] : [];
      })
    }))
  );
  eventFrameLockArray = $derived<(TemporalMatch | null)[]>(
    Array(this.eventResults.length).fill("")
  );

  // Event view
  private _eventViewIndex = $state(0);
  get eventViewIndex(): number {
    return Math.min(this._eventViewIndex, this.eventViewIndexMax);
  }
  set eventViewIndex(val: number) {
    this._eventViewIndex = Math.max(0, Math.min(val, this.eventViewIndexMax));
  }
  eventViewIndexMax = $derived(
    Math.max(0, this.eventResults.length - 2)
  );

  // Search stage management
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
    this.sequenceResultsPre = [];   //safest way to maintain data integrity
  }

  async handleSearch() {
    if (this.isSearching) return;

    this.isSearching = true;
    this.errorMessage = null;
    this.sequenceResultsPre = [];

    try {
      const stages = this.stages.map((stage) => ({
        query: stage.query.trim()
      }));

      if (stages.some((stage) => stage.query.length === 0)) {
        throw new Error('Every search stage must contain a query.');
      }

      if (this.searchMode === 'object_detect') {
        throw new Error('Object detection search is not implemented yet.');
      }

      const response = await api.queryTemporal({
        stages,
        model: this.semanticModel,
        limit: Number(this.limit),
      });

      this.sequenceResultsPre = response.results ?? [];
      this.sequenceResultsPre.sort((a, b) => b.score - a.score);
    } catch (error) {
      this.errorMessage =
        error instanceof Error ? error.message : 'Search query failed';
    } finally {
      this.isSearching = false;
    }
  }
}

export const multipleSearch = new MultipleSearchStore();