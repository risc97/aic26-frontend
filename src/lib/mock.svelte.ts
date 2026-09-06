// src/lib/mockData.ts
import type {
  KeyframeQueryResponse,
  TranscriptSemanticQueryResponse,
  OcrQueryResponse,
  KeyframeListResponse,
  SimilarResponse,
} from './types';

class MockConfig {
  enabled = $state<boolean>(false);
  latencyMs = $state<number>(100); 
}

export const mockConfig = new MockConfig();

// Generates a placeholder SVG data URI for a mock keyframe image
export function generateMockImageUrl(videoId = 'video_001', keyframeId = '000100'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="100%" height="100%" fill="#1e293b"/>
      <rect x="20" y="20" width="600" height="320" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
      <circle cx="320" cy="150" r="40" fill="#3b82f6" opacity="0.8"/>
      <polygon points="310,130 340,150 310,170" fill="#ffffff"/>
      <text x="320" y="230" fill="#94a3b8" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="middle">
        Mock Video: ${videoId}
      </text>
      <text x="320" y="255" fill="#64748b" font-family="sans-serif" font-size="13" text-anchor="middle">
        Keyframe ID: ${keyframeId} (Mock Mode)
      </text>
    </svg>
  `.trim();
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const mockKeyframeQueryResponse: KeyframeQueryResponse = {
  request_id: 'mock_request_keyframe_001',
  mode: 'keyframe',
  model: 'siglip',
  total: 3,
  results: [
    {
      video_id: 'video_001',
      keyframe_id: '000120',
      timestamp_ms: 5000,
      frame_idx: 125,
      video_fps: 25,
      score: 0.95,
    },
    {
      video_id: 'video_001',
      keyframe_id: '000240',
      timestamp_ms: 10000,
      frame_idx: 250,
      video_fps: 25,
      score: 0.88,
    },
    {
      video_id: 'video_002',
      keyframe_id: '000050',
      timestamp_ms: 2500,
      frame_idx: 64,
      video_fps: 25,
      score: 0.76,
    },
  ],
};

export const mockTranscriptResponse: TranscriptSemanticQueryResponse = {
  request_id: 'mock_request_transcript_001',
  mode: 'transcript_semantic',
  model: 'gte',
  total: 1,
  results: [
    {
      video_id: 'video_001',
      transcript_id: 'transcript_001',
      text: 'This is a mock transcript segment matching your query and describing the key event in the video.',
      time_start_ms: 4500,
      time_end_ms: 8200,
      keyframes: [
        {
          video_id: 'video_001',
          keyframe_id: '000120',
          timestamp_ms: 5000,
          frame_idx: 125,
          video_fps: 25,
          score: 0.96,
        },
        {
          video_id: 'video_001',
          keyframe_id: '000121',
          timestamp_ms: 5200,
          frame_idx: 130,
          video_fps: 25,
          score: 0.91,
        },
      ],
    },
  ],
};

export const mockOcrResponse: OcrQueryResponse = {
  request_id: 'mock_request_ocr_001',
  mode: 'ocr_exact',
  model: 'pe',
  total: 1,
  results: [
    {
      video_id: 'video_002',
      keyframe_id: '000050',
      timestamp_ms: 2500,
      frame_idx: 64,
      video_fps: 25,
      score: 0.89,
      text: 'MOCK OCR TEXT',
    },
  ],
};

export const mockKeyframeListResponse: KeyframeListResponse = {
  video_id: 'video_001',
  total: 2,
  keyframes: [
    {
      video_id: 'video_001',
      keyframe_id: '000120',
      timestamp_ms: 5000,
      frame_idx: 125,
      video_fps: 25,
      score: 0.96,
    },
    {
      video_id: 'video_001',
      keyframe_id: '000240',
      timestamp_ms: 10000,
      frame_idx: 250,
      video_fps: 25,
      score: 0.88,
    },
  ],
};

export const mockSimilarResponse: SimilarResponse = {
  video_id: 'video_001',
  keyframe_id: '000120',
  model: 'siglip',
  total: 1,
  results: [
    {
      video_id: 'video_001',
      keyframe_id: '000300',
      timestamp_ms: 12000,
      frame_idx: 300,
      video_fps: 25,
      score: 0.99,
    },
  ],
};