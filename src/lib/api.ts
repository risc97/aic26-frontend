import type {
  KeyframeListResponse,
  KeyframeQueryRequest,
  KeyframeQueryResponse,
  TranscriptSemanticQueryRequest,
  TranscriptSemanticQueryResponse,
  TranscriptExactQueryRequest,
  TranscriptExactQueryResponse,
  OcrQueryRequest,
  OcrQueryResponse,
  TemporalQueryRequest,
  TemporalQueryResponse,
  SimilarResponse,
  SimilarQueryParams,
  ListKeyframesParams,
  FetchLogsParams,
  LogEntry,
  HTTPValidationError,
  TemporalDetectQueryRequest,
  TemporalDetectQueryResponse,
  DetectQueryResponse,
  DetectQueryRequest,
} from './types';
import { config } from './config.svelte';

import {
  mockConfig,
  generateMockImageUrl, 
  mockKeyframeQueryResponse, 
  mockTranscriptResponse, 
  mockOcrResponse, 
  mockKeyframeListResponse, 
  mockSimilarResponse 
} from './mock.svelte';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public validationDetails?: HTTPValidationError
  ) {
    super(`API Error ${status} (${statusText}): ${JSON.stringify(validationDetails ?? {})}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private headers: Record<string, string>;

  constructor(customHeaders: Record<string, string> | undefined = undefined) {
    this.headers = customHeaders ?? {};
  }

  // --- Internal Utilities ---

  private get baseUrl(): string {
    return config.baseUrl.replace(/\/+$/, '');
  }

  private get mediaUrl(): string {
    return config.mediaUrl.replace(/\/+$/, '');
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private buildMediaUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.mediaUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async requestMedia<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = this.buildMediaUrl(path, params);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let validationError: HTTPValidationError | undefined;
      try {
        validationError = await response.json();
      } catch {
        // Body was not JSON
      }
      throw new ApiError(response.status, response.statusText, validationError);
    }

    return response.json() as Promise<T>;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    params?: Record<string, unknown>
  ): Promise<T> {
    if (mockConfig.enabled) {
      await new Promise((resolve) => setTimeout(resolve, mockConfig.latencyMs));
      if (path.includes('/query/keyframe')) return mockKeyframeQueryResponse as unknown as T;
      if (path.includes('/query/transcript')) return mockTranscriptResponse as unknown as T;
      if (path.includes('/query/ocr')) return mockOcrResponse as unknown as T;
      if (path.includes('/keyframes')) return mockKeyframeListResponse as unknown as T;
      if (path.includes('/similar')) return mockSimilarResponse as unknown as T;
      
      return {} as T;
    }

    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      let validationError: HTTPValidationError | undefined;
      try {
        validationError = await response.json();
      } catch {
        // Body was not JSON
      }
      throw new ApiError(response.status, response.statusText, validationError);
    }

    return response.json() as Promise<T>;
  }

  // --- 1. Keyframe & Video Media Endpoints ---

  async listKeyframes(videoId: string, params?: ListKeyframesParams): Promise<KeyframeListResponse> {
    return this.request<KeyframeListResponse>(
      `/keyframe/${encodeURIComponent(videoId)}/keyframes`,
      { method: 'GET' },
      params as Record<string, unknown>
    );
  }

  getKeyframeImageUrl(videoId: string, keyframeId: string): string {
    if (mockConfig.enabled) {
      return generateMockImageUrl(videoId, keyframeId);
    }
    return this.buildMediaUrl(
      `/keyframe/${encodeURIComponent(videoId)}/${encodeURIComponent(keyframeId)}`
    );
  }

  async getKeyframeBlob(videoId: string, keyframeId: string): Promise<Blob> {
    const url = this.getKeyframeImageUrl(videoId, keyframeId);
    const response = await fetch(url, { method: 'GET', headers: this.headers });
    if (!response.ok) throw new ApiError(response.status, response.statusText);
    return response.blob();
  }

  async checkKeyframeExist(videoId: string, keyframeId: string): Promise<boolean> {
    const url = this.getKeyframeImageUrl(videoId, keyframeId);
    const response = await fetch(url, { method: 'HEAD', headers: this.headers });
    return response.ok;
  }

  getVideoStreamUrl(videoId: string): string {
    return this.buildMediaUrl(`/video/${encodeURIComponent(videoId)}`);
  }

  async getVideoFps(videoId: string): Promise<number | null> {
    const response = await this.listKeyframes(videoId, { end_ms: 120000 });
    return response.keyframes?.[0]?.video_fps ?? null;
  }

  // async getVideoBlob(videoId: string): Promise<Blob> {
  //   const url = this.getVideoStreamUrl(videoId);
  //   const response = await fetch(url, { method: 'GET', headers: this.headers });
  //   if (!response.ok) throw new ApiError(response.status, response.statusText);
  //   return response.blob();
  // }

  async checkVideoExist(videoId: string): Promise<boolean> {
    const url = this.getVideoStreamUrl(videoId);
    const response = await fetch(url, { method: 'HEAD', headers: this.headers });
    return response.ok;
  }

  // --- 2. Query Endpoints ---

  async queryKeyframe(payload: KeyframeQueryRequest): Promise<KeyframeQueryResponse> {
    return this.request<KeyframeQueryResponse>('/query/keyframe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async queryTranscriptSemantic(payload: TranscriptSemanticQueryRequest): Promise<TranscriptSemanticQueryResponse> {
    return this.request<TranscriptSemanticQueryResponse>('/query/transcript/semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async queryTranscriptExact(payload: TranscriptExactQueryRequest): Promise<TranscriptExactQueryResponse> {
    return this.request<TranscriptExactQueryResponse>('/query/transcript/exact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async queryOcr(payload: OcrQueryRequest): Promise<OcrQueryResponse> {
    return this.request<OcrQueryResponse>('/query/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async queryTemporal(payload: TemporalQueryRequest): Promise<TemporalQueryResponse> {
    return this.request<TemporalQueryResponse>('/query/temporal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // --- 3. Similarity Search Endpoints ---

  async getSimilarKeyframes(
    videoId: string,
    keyframeId: string,
    params?: SimilarQueryParams
  ): Promise<SimilarResponse> {
    return this.request<SimilarResponse>(
      `/similar/${encodeURIComponent(videoId)}/${encodeURIComponent(keyframeId)}`,
      { method: 'GET' },
      params as Record<string, unknown>
    );
  }

  async searchSimilarByImage(
    file: File | Blob,
    params?: SimilarQueryParams,
    fileName = 'query_image.jpg'
  ): Promise<SimilarResponse> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    return this.request<SimilarResponse>(
      '/similar/upload',
      {
        method: 'POST',
        body: formData,
      },
      params as Record<string, unknown>
    );
  }

  async fetchLogs(params?: FetchLogsParams): Promise<LogEntry[]> {
    return this.request<LogEntry[]>(
      '/logs',
      { method: 'GET' },
      params as Record<string, unknown>
    );
  }

  async fetchLogById(requestId: string): Promise<LogEntry> {
    return this.request<LogEntry>(
      `/logs/${encodeURIComponent(requestId)}`,
      { method: 'GET' }
    );
  }

  // async healthCheck(): Promise<boolean> {
  //   const response = await this.request<Record<string, string>>('/health', { method: 'GET' });
  //   return response.status === 'ok';
  // }

  async queryDetect(payload: DetectQueryRequest): Promise<DetectQueryResponse> {
    return this.request<DetectQueryResponse>('/query/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  async queryTemporalDetect(payload: TemporalDetectQueryRequest): Promise<TemporalDetectQueryResponse> {
    return this.request<TemporalDetectQueryResponse>('/query/temporal/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  // non-existant endpoint for decoy only
  async login(hash: string): Promise<boolean> {
    const res = await fetch('/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: hash })
    });
    return res.ok;
  }
}

export const apiClient = new ApiClient();

// --- DRES evaluation-server client (eventretrieval.one) ---
//

const DRES_BASE_URL = 'https://eventretrieval.one/api/v2';

export interface DresLoginRequest {
  username: string;
  password: string;
}

export interface DresLoginResponse {
  id: string;
  username: string;
  role: string;
  sessionId: string;
}

export interface DresEvaluationInfo {
  id: string;
  name: string;
  type: string;
  status: string;
}

export interface DresKisAnswer {
  mediaItemName: string;
  start: number;
  end: number;
}

export interface DresTextAnswer {
  text: string;
}

interface DresAnswerSet<T> {
  answers: T[];
}

interface DresSubmitRequest<T> {
  answerSets: DresAnswerSet<T>[];
}

export class DresApiError extends ApiError {}

export class DresApiClient {
  private buildUrl(path: string, session: string, params?: Record<string, unknown>): string {
    const url = new URL(`${DRES_BASE_URL}${path}`);
    url.searchParams.set('session', session);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    return url.toString();
  }

  private async parseErrorBody(response: Response): Promise<HTTPValidationError | undefined> {
    try {
      return await response.json();
    } catch {
      return undefined;
    }
  }

  /** GET the list of evaluations (competitions/tasks) visible to this session. */
  async getEvaluationList(sessionId: string): Promise<DresEvaluationInfo[]> {
    const url = this.buildUrl('/client/evaluation/list', sessionId);
    // console.log("[getEvaluationList] Fetching evaluation list from:", url);
    const response = await fetch(url, { method: 'GET' });
    // console.log(`[getEvaluationList] Response status: ${response.status}, Text: ${response.statusText}`);

    if (!response.ok) {
      throw new DresApiError(response.status, response.statusText, await this.parseErrorBody(response));
    }

    return response.json() as Promise<DresEvaluationInfo[]>;
  }

  private async submit<T>(
    evaluationId: string,
    sessionId: string,
    body: DresSubmitRequest<T>
  ): Promise<string> {
    const url = this.buildUrl(`/submit/${encodeURIComponent(evaluationId)}`, sessionId);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new DresApiError(response.status, response.statusText, await this.parseErrorBody(response));
    }
    return response.text();
  }

  /** KIS: submit a video + the start/end (ms) of the matching frame range. */
  async submitKis(
    videoId: string,
    startMs: number,
    endMs: number
  ): Promise<string> {
    return this.submit<DresKisAnswer>(config.evaluationId, config.sessionId, {
      answerSets: [{ answers: [{ mediaItemName: videoId, start: startMs, end: endMs }] }],
    });
  }

  /** QA: submit a free-text answer encoded as QA-<ANSWER>-<VIDEO_ID>-<TIME_MS>. */
  async submitQa(
    videoId: string,
    timeMs: number,
    answer: string
  ): Promise<string> {
    return this.submit<DresTextAnswer>(config.evaluationId, config.sessionId, {
      answerSets: [{ answers: [{ text: `QA-${answer}-${videoId}-${timeMs}` }] }],
    });
  }

  /** TRAKE: submit an ordered list of frame ids encoded as TR-<VIDEO_ID>-<FRAME_ID1>,<FRAME_ID2>,... */
  async submitTrake(
    videoId: string,
    frameIds: Array<string | number>
  ): Promise<string> {
    return this.submit<DresTextAnswer>(config.evaluationId, config.sessionId, {
      answerSets: [{ answers: [{ text: `TR-${videoId}-${frameIds.join(',')}` }] }],
    });
  }
}

export const dresClient = new DresApiClient();