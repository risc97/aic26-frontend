export type EmbeddingModel = 'siglip' | 'siglip2' | 'pe';
export type AllModelTypes = 'siglip' | 'siglip2' | 'gte' | 'pe';

export type LogQueryMode =
  | 'keyframe'
  | 'transcript_semantic'
  | 'transcript_exact'
  | 'ocr_exact'
  | 'temporal'
  | 'detect'
  | 'temporal_detect';

export type SearchMode = 'semantic' | 'transcript' | 'ocr' | 'video_id' | 'detect' | 'reverse_search';
export type TranscriptMethod = 'semantic' | 'keyword';

// --- Base Entities ---

export interface DetectObject {
  phrase: string;
  min_count?: number;
  min_score?: number;
  region?: 'left' | 'right' | 'center' | 'top' | 'bottom' | null;
  min_area?: number;
  max_area?: number;
}

export interface DetectObjectQuery {
  objects: DetectObject[];
}

export interface DetectPrefilter {
  query: string;
  model?: EmbeddingModel;
  limit?: number;
}

export interface DetectQueryRequest {
  objects: DetectObject[];
  limit?: number;
  model?: 'owlv2-base' | 'owlv2-large';
  nms_iou?: number;
  prefilter?: DetectPrefilter | null;
}

export interface DetectItem extends Item {
  counts?: number[];
  boxes?: number[][][]; // [object][box] = [x0, y0, x1, y1, score]
}

export interface DetectQueryResponse {
  request_id: string;
  mode: 'detect';
  model: 'owlv2-base' | 'owlv2-large';
  total?: number;
  results?: DetectItem[];
}

export interface TemporalDetectQueryRequest {
  stages: DetectObjectQuery[];
  seed?: number;
  limit?: number;
  model?: 'owlv2-base' | 'owlv2-large';
  nms_iou?: number;
  r?: number;
  rrf_k?: number;
  weights?: number[] | null;
  max_gap_ms?: number | null;
  iou_threshold?: number;
  chains_per_video?: number;
}

export interface TemporalDetectQueryResponse {
  request_id: string;
  mode: 'temporal_detect';
  model: 'owlv2-base' | 'owlv2-large';
  total?: number;
  results?: TemporalItem[];
}

export interface Item {
  keyframe_id: string;
  video_id: string;
  timestamp_ms: number;
  frame_idx: number;
  video_fps: number;
  score?: number | null;
}

export interface OcrItem extends Item {
  text: string;
}

export interface TranscriptItem {
  video_id: string;
  transcript_id: string;
  text: string;
  time_start_ms: number;
  time_end_ms: number;
  keyframes: Item[];
}

export interface TranscriptFlatItem extends Item {
  transcript_id: string;
  text: string;
  time_start_ms: number;
  time_end_ms: number;
}

// Item entry for kf card
export interface CardItem extends Item {
  text?: string;
  time_start_ms?: number;   //Transcript time start
  time_end_ms?: number;     //Transcript time end
};

export interface TemporalStage {
  query: string;
  variants?: string[];
}

export interface TemporalMatch {
  keyframe_id: string;
  video_id: string;
  timestamp_ms: number;
  frame_idx: number;
  video_fps: number;
  score: number;
  stage: number;
  query: string;
  rank: number;
}

export interface TemporalItem {
  rank: number;
  video_id: string;
  score: number;
  length: number;
  matches?: TemporalMatch[];
  skipped_stages?: number[];
}

// --- Request Payloads ---

export interface KeyframeQueryRequest {
  query: string;
  limit?: number;
  model?: EmbeddingModel;
}

export interface TranscriptSemanticQueryRequest {
  query: string;
  limit?: number;
  model?: 'gte';
}

export interface TranscriptExactQueryRequest {
  query: string;
  limit?: number;
  fuzzy?: boolean;
}

export interface OcrQueryRequest {
  query: string;
  limit?: number;
  fuzzy?: boolean;
}

export interface TemporalQueryRequest {
  stages: TemporalStage[];
  seed?: number;
  limit?: number;
  model?: AllModelTypes;
  chains_per_video?: number;
  r?: number;
  rrf_k?: number;
  weights?: number[] | null;
  max_gap_ms?: number | null;
  iou_threshold?: number;
}

// --- Query Parameter Filters ---

export interface ListKeyframesParams {
  start_ms?: number | null;
  end_ms?: number | null;
}

export interface SimilarQueryParams {
  model?: EmbeddingModel;
  limit?: number;
}

export interface FetchLogsParams {
  limit?: number;
  offset?: number;
}

// --- Response Payloads ---

export interface KeyframeListResponse {
  video_id: string;
  total?: number;
  keyframes?: Item[];
}

export interface KeyframeQueryResponse {
  request_id: string;
  mode: 'keyframe';
  model: EmbeddingModel;
  total?: number;
  results?: Item[];
}

export interface TranscriptSemanticQueryResponse {
  request_id: string;
  mode: 'transcript_semantic';
  model: 'gte';
  total?: number;
  results?: TranscriptItem[];
}

export interface TranscriptExactQueryResponse {
  request_id: string;
  mode: 'transcript_exact';
  model?: AllModelTypes | null;
  total?: number;
  results?: TranscriptItem[];
}

export interface OcrQueryResponse {
  request_id: string;
  mode: 'ocr_exact';
  model?: AllModelTypes | null;
  total?: number;
  results?: OcrItem[];
}

export interface TemporalQueryResponse {
  mode: 'temporal';
  results?: TemporalItem[];
}

export interface SimilarResponse {
  video_id: string;
  keyframe_id: string;
  model: EmbeddingModel;
  total?: number;
  results?: Item[];
}

export interface LogEntry {
  request_id: string;
  timestamp: string | null;
  query: string;
  limit: number;
  mode: LogQueryMode;
  model?: AllModelTypes | null;
  results?: (Item | TranscriptItem | OcrItem | TemporalItem)[];
  total?: number;
}

// --- Error Schemas ---

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail?: ValidationError[];
}