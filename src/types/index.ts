export interface GenerationRequest {
  prompt: string;
  style: "vector" | "laser" | "colorful";
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
  seed?: number;
}

export interface GenerationResult {
  uri: string;
  data: Buffer;
  metadata: GenerationMetadata;
}

export interface GenerationMetadata {
  prompt: string;
  style: string;
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
  seed?: number;
  model: string;
  lora?: string;
  checkpoint?: string;
  timestamp: string;
}

export interface GenerationHistory {
  timestamp: string;
  prompt: string;
  style: string;
  status: "completed" | "failed" | "in_progress";
  outputPath?: string;
  error?: string;
  metadata?: GenerationMetadata;
}

export interface ModelConfig {
  model_name: string;
  lora_path?: string;
  checkpoint?: string;
  quantize: number;
}

export interface ModelInfo {
  name: string;
  type: "base_model" | "lora" | "checkpoint";
  status: "available" | "not_downloaded" | "downloading" | "error";
  size: string;
  description: string;
  path: string;
  url?: string;
}

export interface SVGResult {
  uri: string;
  content: string;
  metadata: {
    [key: string]: any;
  };
}

export interface OptimizationOptions {
  level: "basic" | "aggressive";
  preserveColors: boolean;
}