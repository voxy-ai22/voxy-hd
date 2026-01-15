
export interface ApiResponse {
  status: boolean;
  hd_url: string;
  message?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'enhancing' | 'success' | 'error';

export interface UploadState {
  status: UploadStatus;
  originalImage: string | null;
  hdUrl: string | null;
  errorMessage: string | null;
}

export type VoxyModel = 'hd1' | 'hd2' | 'hd3' | 'hd4' | 'hd5';

export interface LinkEnhancerState {
  status: UploadStatus;
  remoteUrl: string | null;
  hdUrl: string | null;
  selectedModel: VoxyModel;
  errorMessage: string | null;
}
