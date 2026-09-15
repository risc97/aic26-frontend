import { ApiClient } from './api';
import type { Item, TranscriptItem, OcrItem, EmbeddingModel } from './types';

const api = new ApiClient();

class SingleSearchStore {
  // Search parameters & state
  query = $state('');
  limit = $state(100);
  searchMode = $state('semantic'); // 'semantic' | 'transcript' | 'ocr' | 'video_id'
  modelSemantic = $state<EmbeddingModel>('siglip'); // 'siglip' | 'siglip2' | 'pe'
  isTranscriptExact = $state(false);
  isSearchPhrase = $state(false);
  similarFrame = $state("");
  exclusion = $state<string>("");
  videoStartMs = $state<number | undefined>(undefined);
  videoEndMs = $state<number | undefined>(undefined);
  readonly modelTranscriptSemantic = 'gte';

  exclusionArray = $derived(this.exclusion.split(',').map(s => s.trim()).filter(s => s.length > 0));

  // Pagination state
  currentPage = $state(1);
  pageSize = $state(48);

  // Loading state
  isSearching = $state(false);
  errorMessage = $state<string | null>(null);

  // UI state
  showFilterDrawer = $state(false);

  // Results 
  private resultRaw = $state<Item[] | TranscriptItem[] | OcrItem[]>([]);
  private resultSimilar = $state<Item[] | TranscriptItem[] | OcrItem[]>([]);
  private resultActive = $derived(this.similarFrame === "" ? this.resultRaw : this.resultSimilar);
  get results() {
    // $inspect(this.exclusionArray);
    return this.resultActive.filter(r => {
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
  }

  // Paginated slice derived state
  paginatedResults = $derived(
    this.results.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize)
  );

  async handleSearch() {
    this.isSearching = true;
    this.errorMessage = null;
    this.resultRaw = [];
    this.resultSimilar = [];
    this.currentPage = 1; // Reset to first page on new search

    try {
      if (this.searchMode === 'semantic') {
        const res = await api.queryKeyframe({
          query: this.query,
          limit: Number(this.limit),
          model: this.modelSemantic,
        });
        this.resultRaw = res.results ?? [];
      } else if (this.searchMode === 'transcript') {
        const res = this.isTranscriptExact ? await api.queryTranscriptExact({
          query: this.query,
          limit: Number(this.limit),
          phrase: this.isSearchPhrase,
        }) : await api.queryTranscriptSemantic({
          query: this.query,
          limit: Number(this.limit),
          model: 'gte',
        });
        this.resultRaw = res.results ?? [];
      } else if (this.searchMode === 'ocr') {
        const res = await api.queryOcr({
          query: this.query,
          limit: Number(this.limit),
          phrase: this.isSearchPhrase,
        });
        this.resultRaw = res.results ?? [];
      } else if (this.searchMode === 'video_id') {
        const res = await api.listKeyframes(this.query, { start_ms: this.videoStartMs ?? undefined, end_ms: this.videoEndMs ?? undefined });
        this.resultRaw = res.keyframes ?? [];
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'Search query failed';
    } finally {
      this.isSearching = false;
    }
  }

  async handleSimilarFrame(videoId: string, keyframeId: string) {
    this.isSearching = true;
    this.errorMessage = null;
    try {
      const res = await api.getSimilarKeyframes(videoId, keyframeId, { limit: Number(this.limit), model: this.modelSemantic });
      this.resultSimilar = res.results ?? [];
      this.currentPage = 1;
    } catch (err: any) {
      this.errorMessage = err.message || 'Failed to load similar frames';
    } finally {
      this.isSearching = false;
    }
  }

  async clearSimilarFrame() {
    this.similarFrame = "";
    this.resultSimilar = [];
    this.currentPage = 1;
  }
}

export const singleSearch = new SingleSearchStore();