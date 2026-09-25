import { ApiClient } from './api';
import type { SearchMode, Item, TranscriptItem, OcrItem, EmbeddingModel, VisualModel, SimilarKind, TranscriptFlatItem, TranscriptMethod } from './types';

const api = new ApiClient();

class SingleSearchStore {
  // Search parameters & state
  query = $state('');
  limit = $state(100);
  uploadedFile = $state<File | null>(null);
  private _searchMode = $state<SearchMode>('semantic');
  get searchMode() {
    return this._searchMode;
  }
  set searchMode(value: SearchMode) {
    if (this._searchMode !== value) {
      this._searchMode = value;
      this.resetView();
    }
  }
  modelSemantic = $state<EmbeddingModel>('siglip2'); // 'siglip' | 'siglip2' | 'pe'
  modelReverse = $state<EmbeddingModel | VisualModel>('siglip2');
  similarKind = $state<SimilarKind>('semantic');
  transcriptMethod = $state<TranscriptMethod>('semantic');
  isSearchFuzzy = $state(true);
  similarFrame = $state("");
  exclusion = $state<string>("");
  videoStartMs = $state<number | null>(null);
  videoEndMs = $state<number | null>(null);
  readonly modelTranscriptSemantic = 'gte';

  exclusionArray = $derived(this.exclusion.split(',').map(s => s.trim()).filter(s => s.length > 0));

  // Pagination state
  currentPage = $state(1);
  readonly pageSize = 25;

  // Loading state
  isSearching = $state(false);
  errorMessage = $state<string | null>(null);

  // QA state
  // qaEnabled = $state(false);
  qaAnswer = $state<string>('');

  // UI state
  showFilterDrawer = $state(false);

  // Results 
  private resultRaw = $state<Item[] | TranscriptFlatItem[] | OcrItem[]>([]);
  private resultSimilar = $state<Item[] | TranscriptFlatItem[] | OcrItem[]>([]);
  private resultActive = $derived(this.similarFrame === "" ? this.resultRaw : this.resultSimilar);
  get results() {
    if(this.searchMode === 'video_id') return this.resultActive;
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

  flattenTranscripts(transcripts: TranscriptItem[]): TranscriptFlatItem[] {
    return transcripts.flatMap((transcript) =>
      transcript.keyframes.map((keyframe) => ({
        video_id: transcript.video_id,
        transcript_id: transcript.transcript_id,
        text: transcript.text,
        time_start_ms: transcript.time_start_ms,
        time_end_ms: transcript.time_end_ms,

        keyframe_id: keyframe.keyframe_id,
        timestamp_ms: keyframe.timestamp_ms,
        frame_idx: keyframe.frame_idx,
        video_fps: keyframe.video_fps,
        score: keyframe.score,
      }))
    );
  }

  resetView() {
    this.errorMessage = null;
    this.similarFrame = "";
    this.resultRaw = [];
    this.resultSimilar = [];
    this.currentPage = 1;
  }

  async handleSearch() {
    if(this.isSearching) return;
    this.resetView();
    this.isSearching = true;

    try {
      if (this.searchMode === 'semantic') {
        const res = await api.queryKeyframe({
          query: this.query,
          limit: Number(this.limit),
          model: this.modelSemantic,
        });
        this.resultRaw = res.results ?? [];
      } else if (this.searchMode === 'transcript') {
        const res = this.transcriptMethod === 'keyword' ? await api.queryTranscriptExact({
          query: this.query,
          limit: Number(this.limit),
          fuzzy: this.isSearchFuzzy,
        }) : await api.queryTranscriptSemantic({
          query: this.query,
          limit: Number(this.limit),
          model: 'gte',
        });
        
        this.resultRaw = this.flattenTranscripts(res.results ?? []);
      } else if (this.searchMode === 'detect') {
        const res = await api.queryDetect({
          objects: [{ phrase: this.query }],
          limit: Number(this.limit),
        });
        this.resultRaw = res.results ?? [];
      } else if (this.searchMode === 'ocr') {
        const res = await api.queryOcr({
          query: this.query,
          limit: Number(this.limit),
          fuzzy: this.isSearchFuzzy,
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

  async handleReverseSearch() {
    if (this.isSearching) return;
    if (!this.uploadedFile) return;
    this.resetView();
    this.isSearching = true;

    try {
      const kind: SimilarKind = this.modelReverse === 'dinov3' ? 'visual' : 'semantic';
      const res = await api.searchSimilarByImage(this.uploadedFile!, {
        limit: Number(this.limit),
        model: this.modelReverse,
      }, kind);
      this.resultRaw = res.results ?? [];
    } catch (err: any) {
      this.errorMessage = err.message || 'Reverse search failed';
    } finally {
      this.isSearching = false;
    }
  }

  async handleSimilarFrame(videoId: string, keyframeId: string, kind: SimilarKind = 'semantic') {
    this.isSearching = true;
    this.errorMessage = null;
    try {
      const model = kind === 'visual' ? 'dinov3' : this.modelSemantic;
      const res = await api.getSimilarKeyframes(videoId, keyframeId, { limit: Number(this.limit), model }, kind);
      this.similarFrame = `${videoId}-${keyframeId}`;
      this.similarKind = kind;
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