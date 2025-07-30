import { PythonShell } from "python-shell";
import { logger } from "../utils/logger.js";
import { ModelInfo } from "../types/index.js";

export class ModelService {
  private isInitialized = false;
  private availableModels: ModelInfo[] = [];

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing Model service...");
      
      await this.loadAvailableModels();
      
      this.isInitialized = true;
      logger.info("Model service initialized successfully");
    } catch (error) {
      logger.warn("Model service initialized with limited functionality:", error);
      // Still mark as initialized but with demo models
      this.availableModels = this.getDemoModels();
      this.isInitialized = true;
    }
  }

  private async loadAvailableModels(): Promise<void> {
    try {
      // Check available FLUX models
      const fluxModels = await this.checkFluxModels();
      
      // Define our target models
      this.availableModels = [
        {
          name: "FLUX Dev",
          type: "base_model",
          status: fluxModels.includes("dev") ? "available" : "not_downloaded",
          size: "~12GB",
          description: "FLUX development model with high quality generation capabilities",
          path: "dev",
        },
        {
          name: "FLUX Schnell",
          type: "base_model", 
          status: fluxModels.includes("schnell") ? "available" : "not_downloaded",
          size: "~12GB", 
          description: "FLUX schnell model optimized for faster generation",
          path: "schnell",
        },
        {
          name: "Vector SVG Laser LoRA",
          type: "lora",
          status: await this.checkLoRAAvailability("vector-svg-laser") ? "available" : "not_downloaded",
          size: "~100MB",
          description: "LoRA model specialized for vector SVG and laser-cut style illustrations",
          path: "vector-svg-laser-lora",
          url: "https://civitai.com/models/1541480/vector-svg-laser?modelVersionId=1744149",
        },
        {
          name: "FluxxxMix Checkpoint",
          type: "checkpoint",
          status: await this.checkCheckpointAvailability("fluxxxmix") ? "available" : "not_downloaded", 
          size: "~2GB",
          description: "Checkpoint model for colorful and vibrant illustrations",
          path: "fluxxxmix-checkpoint",
          url: "https://civitai.com/models/1726621?modelVersionId=1954014",
        },
      ];

      logger.info(`Loaded ${this.availableModels.length} model definitions`);
    } catch (error) {
      logger.error("Failed to load available models:", error);
      throw error;
    }
  }

  private async checkFluxModels(): Promise<string[]> {
    try {
      const result = await this.runPythonScript(`
import os
import sys
try:
    from mflux.flux.flux import Flux1
    
    available_models = []
    
    # Test common FLUX models
    models_to_check = ["dev", "schnell"]
    
    for model_name in models_to_check:
        try:
            # Try to initialize (this will check if model files exist)
            flux = Flux1.from_name(model_name=model_name, quantize=8)
            available_models.append(model_name)
            print(f"MODEL_AVAILABLE: {model_name}")
        except Exception as e:
            print(f"MODEL_NOT_AVAILABLE: {model_name} - {str(e)}")
    
    print(f"AVAILABLE_MODELS: {','.join(available_models)}")
    
except Exception as e:
    print(f"ERROR_CHECKING_MODELS: {str(e)}")
    sys.exit(1)
`);

      const availableMatch = result.match(/AVAILABLE_MODELS: (.+)/);
      if (availableMatch && availableMatch[1]) {
        return availableMatch[1].split(',').filter(model => model.trim().length > 0);
      }
      
      return [];
    } catch (error) {
      logger.warn("Could not check FLUX models:", error);
      return [];
    }
  }

  private async checkLoRAAvailability(loraName: string): Promise<boolean> {
    try {
      // For now, we'll assume LoRA models need to be manually downloaded
      // In a real implementation, you'd check specific paths or use MFLUX's model management
      const result = await this.runPythonScript(`
import os
import sys

# Check common LoRA paths
lora_paths = [
    f"~/.cache/mflux/loras/${loraName}",
    f"./models/loras/${loraName}",
    f"./loras/${loraName}"
]

for path in lora_paths:
    expanded_path = os.path.expanduser(path)
    if os.path.exists(expanded_path):
        print(f"LORA_FOUND: {expanded_path}")
        sys.exit(0)

print("LORA_NOT_FOUND")
`);

      return result.includes("LORA_FOUND");
    } catch (error) {
      logger.warn(`Could not check LoRA availability for ${loraName}:`, error);
      return false;
    }
  }

  private async checkCheckpointAvailability(checkpointName: string): Promise<boolean> {
    try {
      // Similar to LoRA check
      const result = await this.runPythonScript(`
import os
import sys

# Check common checkpoint paths
checkpoint_paths = [
    f"~/.cache/mflux/checkpoints/${checkpointName}",
    f"./models/checkpoints/${checkpointName}",
    f"./checkpoints/${checkpointName}"
]

for path in checkpoint_paths:
    expanded_path = os.path.expanduser(path)
    if os.path.exists(expanded_path):
        print(f"CHECKPOINT_FOUND: {expanded_path}")
        sys.exit(0)

print("CHECKPOINT_NOT_FOUND")
`);

      return result.includes("CHECKPOINT_FOUND");
    } catch (error) {
      logger.warn(`Could not check checkpoint availability for ${checkpointName}:`, error);
      return false;
    }
  }

  private async runPythonScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'text' as const,
        pythonOptions: ['-u'], // Unbuffered output
      };

      PythonShell.runString(script, options).then((results) => {
        const output = results?.join('\n') || '';
        resolve(output);
      }).catch((err) => {
        reject(err);
      });
    });
  }

  async listAvailableModels(): Promise<ModelInfo[]> {
    if (!this.isInitialized) {
      throw new Error("Model service not initialized");
    }
    
    // Refresh model status
    await this.loadAvailableModels();
    return this.availableModels;
  }

  async getModelInfo(modelName: string): Promise<ModelInfo | null> {
    const model = this.availableModels.find(m => 
      m.name.toLowerCase().includes(modelName.toLowerCase()) || 
      m.path.toLowerCase().includes(modelName.toLowerCase())
    );
    
    return model || null;
  }

  async downloadModel(modelName: string): Promise<void> {
    const model = await this.getModelInfo(modelName);
    
    if (!model) {
      throw new Error(`Model not found: ${modelName}`);
    }

    if (model.status === "available") {
      logger.info(`Model ${modelName} is already available`);
      return;
    }

    // For base FLUX models, MFLUX will handle downloading automatically
    if (model.type === "base_model") {
      logger.info(`Base model ${modelName} will be downloaded automatically by MFLUX when first used`);
      return;
    }

    // For LoRA and checkpoints, provide download instructions
    if (model.url) {
      throw new Error(`Manual download required for ${modelName}. Please download from: ${model.url}`);
    } else {
      throw new Error(`No download URL available for ${modelName}`);
    }
  }

  private getDemoModels(): ModelInfo[] {
    return [
      {
        name: "FLUX Dev (Demo)",
        type: "base_model",
        status: "not_downloaded",
        size: "~12GB",
        description: "FLUX development model - requires MFLUX installation",
        path: "dev",
      },
      {
        name: "Vector SVG Laser LoRA (Demo)",
        type: "lora",
        status: "not_downloaded",
        size: "~100MB",
        description: "LoRA model for vector SVG generation - requires manual download",
        path: "vector-svg-laser-lora",
        url: "https://civitai.com/models/1541480/vector-svg-laser?modelVersionId=1744149",
      },
      {
        name: "FluxxxMix Checkpoint (Demo)",
        type: "checkpoint",
        status: "not_downloaded",
        size: "~2GB",
        description: "Checkpoint for colorful illustrations - requires manual download",
        path: "fluxxxmix-checkpoint",
        url: "https://civitai.com/models/1726621?modelVersionId=1954014",
      },
    ];
  }
}