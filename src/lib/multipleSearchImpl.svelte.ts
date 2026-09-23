import { ApiClient } from './api';
import type { TemporalMatch, TemporalItem, CardItem, DetectObject, DetectObjectQuery } from './types';

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
  private _searchMode = $state<'semantic' | 'object_detect'>('semantic');
  get searchMode() {
    return this._searchMode;
  }
  set searchMode(value: 'semantic' | 'object_detect') {
    if (this._searchMode !== value) {
      this._searchMode = value;
      this.resetView();
    }
  }

  // Advanced temporal-search parameters
  recallDepth = $state(100);
  chainsPerVideo = $state(1);
  rrfK = $state(60);
  maxGapSeconds = $state(120);
  iouThreshold = $state(0.5);
  showWeightsDrawer = $state(true);
  stageWeights = $state<number[]>([1, 1]);

  // UI state
  showFilterDrawer = $state(false);
  allowSingleSubmit = $state(false);
  sequenceView = $state(true);    // true for sequence view, false for event view
  exclusion = $state<string>("");
  exclusionArray = $derived(this.exclusion.split(',').map(s => s.trim()).filter(s => s.length > 0));
  limit = $state(100);
  videoDialogOpen = $state(false);
  qaAnswer = $state<string>('');

  sequencePage = $state(1);
  readonly sequencePageSize = 10;

  // Loading state
  isSearching = $state(false);
  errorMessage = $state<string | null>(null);

  // Event state
  eventPages = $state<number[]>([]);
  readonly eventPageSize = 9;
  eventFrameLockArray = $state<(TemporalMatch | null)[]>([null, null]);
  eventLockedVideoId = $derived.by(() => {
    let id = "";
    for (const lock of this.eventFrameLockArray) {
      if (lock) {
        id = lock.video_id;
        break;
      }
    }
    return id;
  });
  allEventFilled(): boolean {
    return this.eventFrameLockArray.every(item => item !== null);
  }

  // Data state
  sequenceResultsPre = $state<TemporalItem[]>([]);
  sequenceResults = $derived.by(() => {
    return this.sequenceResultsPre.map(r => {
      // Filter matches inside the sequence item
      const filteredMatches = (r.matches ?? []).filter(match => {
        for (const exclusion of this.exclusionArray) {
          if (exclusion.includes('-')) {
            const lastHyphenIndex = exclusion.lastIndexOf('-');
            const vid = exclusion.substring(0, lastHyphenIndex);
            const kid = exclusion.substring(lastHyphenIndex + 1);

            if (match.video_id === vid && match.keyframe_id === kid) {
              return false;
            }
          } else {
            if (match.video_id === exclusion) {
              return false;
            }
          }
        }
        return true;
      });

      return {
        ...r,
        matches: filteredMatches
      };
    }).filter(r => {
      // Also filter out the whole video if a video-level exclusion matches
      for (const exclusion of this.exclusionArray) {
        if (!exclusion.includes('-') && r.video_id === exclusion) {
          return false;
        }
      }
      return r.matches && r.matches.length > 0;
    });
  });
  eventResults = $derived.by(() => {
    const lockedCardIds = new Set(
      this.eventFrameLockArray
        .filter((card): card is TemporalMatch => card !== null)
        .map((card) => `${card.video_id}-${card.keyframe_id}`)
    );
    return this.stages.map((stage, stageIndex): EventItem => {
      const lockedCard = this.eventFrameLockArray[stageIndex];

      // If this stage has a locked card, display only the locked card
      if (lockedCard) {
        return {
          query: stage.query,
          matches: [lockedCard]
        };
      }

      const matches = this.sequenceResults.flatMap((result) => {
        // Reorder cards to events
        const card = result.matches?.find((m) => m.stage === stageIndex);
        if(!card) return [];
        // Skip if this card is currently locked into a different stage
        if (lockedCardIds.has(`${card.video_id}-${card.keyframe_id}`)) {
          return [];
        }
        // If a video lock is active, skip cards not belonging to that video
        if (this.eventLockedVideoId !== "" && card.video_id !== this.eventLockedVideoId) {
          return [];
        }
        /**
         * But... we already filtered out excluded videos in sequenceResults
         * What if we we locked in a filtered video?
         * -> Disable the exclusion input when a video is locked in event view
         */
        return [card];
      });

      return {
        query: stage.query,
        matches
      };
    })
});

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
    this.stageWeights.push(1);
    this.eventPages.push(1);
    this.nextStageId += 1;
  }

  removeStage(id: number) {
    if (this.stages.length === 1) return;
    const index = this.stages.findIndex(stage => stage.id === id);
    this.stages = this.stages.filter((stage) => stage.id !== id);
    if (index !== -1) {
      this.eventPages.splice(index, 1);
      this.stageWeights.splice(index, 1);
    }
    this.resetView();   //safest way to maintain data integrity
  }

  toggleLock(stageIndex: number, card: TemporalMatch) {
    if (this.eventFrameLockArray[stageIndex]) {
      this.eventFrameLockArray[stageIndex] = null;
    } else {
      this.eventFrameLockArray[stageIndex] = card;
    }
    this.eventPages = new Array(this.stages.length).fill(1);
  }

  clearLocks() {
    this.eventFrameLockArray = this.eventFrameLockArray.map(() => null);
    this.eventPages = new Array(this.stages.length).fill(1);
  }

  resetView() {
    this.errorMessage = null;
    this.sequenceResultsPre = [];
    this.eventFrameLockArray = new Array(2).fill(null);
    this.eventPages = new Array(this.stages.length).fill(1);
    this.sequencePage = 1;
    this.stageWeights = new Array(this.stages.length).fill(1);
  }

  async handleSearch() {
    if (this.isSearching) return;
    this.isSearching = true;
    this.resetView();

    const temporalParams = {
      limit: Number(this.limit),
      r: Number(this.recallDepth),
      chains_per_video: Number(this.chainsPerVideo),
      rrf_k: Number(this.rrfK),
      max_gap_ms: Number(this.maxGapSeconds) * 1000,
      iou_threshold: Number(this.iouThreshold),
      weights: this.showWeightsDrawer
        ? this.stageWeights.map(weight => Number(weight))
        : null,
    };

    try {
      const stages = this.stages.map((stage) => ({
        query: stage.query.trim()
      }));

      if (stages.some((stage) => stage.query.length === 0)) {
        throw new Error('Every search stage must contain a query.');
      }

      if (this.searchMode === 'object_detect') {
        const detectObjects: DetectObjectQuery[] = stages.map((stage) => ({
          objects: [
            {
              phrase: stage.query.trim()
            }
          ]
        }));
        const response = await api.queryTemporalDetect({
          stages: detectObjects,
          ...temporalParams,
        });

        this.sequenceResultsPre = response.results ?? [];
        this.sequenceResultsPre.sort((a, b) => b.score - a.score);
        this.eventFrameLockArray = new Array(this.stages.length).fill(null);
      } else if (this.searchMode === 'semantic') {
        const response = await api.queryTemporal({
          stages,
          model: this.semanticModel,
          ...temporalParams,
        });

        this.sequenceResultsPre = response.results ?? [];
        this.sequenceResultsPre.sort((a, b) => b.score - a.score);
        this.eventFrameLockArray = new Array(this.stages.length).fill(null);
      } else {
        throw new Error(`${this.searchMode} is not implemented yet.`);
      }
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Search query failed';
    } finally {
      this.isSearching = false;
    }
  }
}

export const multipleSearch = new MultipleSearchStore();