export type ModelVersion = "V3_5" | "V4" | "V4_5" | "V4_5PLUS" | "V5";
export type VocalGender = "m" | "f";
export type SeparationType = "separate_vocal" | "split_stem";
export type TaskStatus = "PENDING" | "TEXT_SUCCESS" | "FIRST_SUCCESS" | "SUCCESS" | "CREATE_TASK_FAILED" | "GENERATE_AUDIO_FAILED";

export interface GenerateMusicRequest {
  customMode: boolean;
  instrumental: boolean;
  model: ModelVersion;
  prompt?: string;
  style?: string;
  title?: string;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface ExtendMusicRequest {
  defaultParamFlag: boolean;
  audioId: string;
  model: ModelVersion;
  prompt?: string;
  style?: string;
  title?: string;
  continueAt?: number;
  personaId?: string;
  negativeTags?: string;
  vocalGender?: VocalGender;
  styleWeight?: number;
  weirdnessConstraint?: number;
  audioWeight?: number;
}

export interface SunoResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface TaskResponse {
  taskId: string;
}

export interface GenerationStatusData {
  taskId: string;
  status: TaskStatus;
  response?: {
    sunoData: Array<{
      id: string;
      audioUrl: string;
      streamAudioUrl: string;
      imageUrl: string;
      title: string;
      tags: string;
      duration: number;
    }>;
  };
  errorMessage?: string;
}
