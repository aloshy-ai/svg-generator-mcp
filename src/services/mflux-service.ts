import { PythonShell } from "python-shell";
import { logger } from "../utils/logger.js";
import { ModelConfig, GenerationRequest, GenerationResult, GenerationHistory } from "../types/index.js";
import path from "path";
import fs from "fs/promises";

export class MFLUXService {
  private isInitialized = false;
  private historyFile = "generation_history.json";
  private history: GenerationHistory[] = [];

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing MFLUX service...");
      
      // Check if MFLUX is installed
      await this.checkMFLUXInstallation();
      
      // Load generation history
      await this.loadHistory();
      
      this.isInitialized = true;
      logger.info("MFLUX service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize MFLUX service:", error);
      throw error;
    }
  }

  private async checkMFLUXInstallation(): Promise<void> {
    try {
      const result = await this.runPythonScript(`
import sys
try:
    import mflux
    print("MFLUX_AVAILABLE")
    print(f"Version: {mflux.__version__ if hasattr(mflux, '__version__') else 'unknown'}")
except ImportError as e:
    print("MFLUX_NOT_AVAILABLE")
    print(f"Error: {str(e)}")
    sys.exit(1)
`);
      
      if (!result.includes("MFLUX_AVAILABLE")) {
        throw new Error("MFLUX is not installed. Please install it using: pip install mflux");
      }
      
      logger.info("MFLUX installation verified");
    } catch (error) {
      throw new Error(`MFLUX installation check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateImage(request: GenerationRequest): Promise<GenerationResult> {
    if (!this.isInitialized) {
      throw new Error("MFLUX service not initialized");
    }

    const timestamp = new Date().toISOString();
    const outputPath = `output_${Date.now()}.png`;
    
    try {
      logger.info(`Starting image generation: ${request.prompt}`);
      
      // Prepare the model configuration based on style
      const modelConfig = this.getModelConfig(request.style);
      
      // Create Python script for image generation
      const pythonScript = this.createGenerationScript(request, modelConfig, outputPath);
      
      // Run the generation
      const result = await this.runPythonScript(pythonScript);
      
      // Verify output file was created
      const outputExists = await this.fileExists(outputPath);
      if (!outputExists) {
        throw new Error("Generated image file not found");
      }

      // Read the generated image
      const imageBuffer = await fs.readFile(outputPath);
      
      // Create result
      const generationResult: GenerationResult = {
        uri: `file://${path.resolve(outputPath)}`,
        data: imageBuffer,
        metadata: {
          prompt: request.prompt,
          style: request.style,
          width: request.width,
          height: request.height,
          steps: request.steps,
          guidance_scale: request.guidance_scale,
          seed: request.seed,
          model: modelConfig.model_name,
          lora: modelConfig.lora_path,
          timestamp,
        },
      };

      // Add to history
      await this.addToHistory({
        timestamp,
        prompt: request.prompt,
        style: request.style,
        status: "completed",
        outputPath,
        metadata: generationResult.metadata,
      });

      logger.info(`Image generation completed: ${outputPath}`);
      return generationResult;
      
    } catch (error) {
      // Add failed attempt to history
      await this.addToHistory({
        timestamp,
        prompt: request.prompt,
        style: request.style,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
      
      logger.error("Image generation failed:", error);
      throw error;
    }
  }

  private getModelConfig(style: string): ModelConfig {
    switch (style) {
      case "vector":
      case "laser":
        return {
          model_name: "dev", // Using FLUX dev model
          lora_path: "vector-svg-laser-lora", // Vector SVG Laser LoRA
          quantize: 8,
        };
      case "colorful":
        return {
          model_name: "dev", // Using FLUX dev model
          lora_path: "vector-svg-laser-lora", // Vector SVG Laser LoRA
          checkpoint: "fluxxxmix-checkpoint", // FluxxxMix Checkpoint for colorful results
          quantize: 8,
        };
      default:
        return {
          model_name: "dev",
          lora_path: "vector-svg-laser-lora",
          quantize: 8,
        };
    }
  }

  private createGenerationScript(
    request: GenerationRequest,
    modelConfig: ModelConfig,
    outputPath: string
  ): string {
    // Enhanced prompt based on style
    const enhancedPrompt = this.enhancePrompt(request.prompt, request.style);
    
    return `
import sys
import os
from mflux.flux.flux import Flux1
from mflux.config.config import Config

try:
    print("Loading FLUX model...")
    
    # Initialize FLUX model
    flux = Flux1.from_name(
        model_name="${modelConfig.model_name}",
        quantize=${modelConfig.quantize}
    )
    
    print("Model loaded successfully")
    
    # Configure generation parameters
    config = Config(
        num_inference_steps=${request.steps},
        guidance_scale=${request.guidance_scale},
        height=${request.height},
        width=${request.width}
    )
    
    print("Starting image generation...")
    print(f"Prompt: ${enhancedPrompt}")
    print(f"Style: ${request.style}")
    print(f"Steps: ${request.steps}")
    print(f"Guidance Scale: ${request.guidance_scale}")
    print(f"Dimensions: ${request.width}x${request.height}")
    ${request.seed ? `print(f"Seed: ${request.seed}")` : ''}
    
    # Generate image
    image = flux.generate_image(
        seed=${request.seed || 'None'},
        prompt="${enhancedPrompt}",
        config=config
    )
    
    # Save the image
    image.save(path="${outputPath}")
    print(f"Image saved to: ${outputPath}")
    print("GENERATION_COMPLETED")
    
except Exception as e:
    print(f"GENERATION_FAILED: {str(e)}")
    sys.exit(1)
`;
  }

  private enhancePrompt(prompt: string, style: string): string {
    const stylePrompts = {
      vector: "vector art, clean lines, simple shapes, minimal design, SVG style, flat design",
      laser: "laser cut design, clean edges, high contrast, black and white, stencil style, cut-out design",
      colorful: "vibrant colors, rich palette, detailed illustration, artistic, beautiful lighting, high quality artwork"
    };

    const enhancement = stylePrompts[style as keyof typeof stylePrompts] || stylePrompts.vector;
    return `${prompt}, ${enhancement}`;
  }

  private async runPythonScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        mode: 'text' as const,
        pythonOptions: ['-u'], // Unbuffered output
      };

      PythonShell.runString(script, options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          const output = results?.join('\n') || '';
          resolve(output);
        }
      });
    });
  }

  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  private async loadHistory(): Promise<void> {
    try {
      const historyExists = await this.fileExists(this.historyFile);
      if (historyExists) {
        const historyData = await fs.readFile(this.historyFile, 'utf-8');
        this.history = JSON.parse(historyData);
      }
    } catch (error) {
      logger.warn("Could not load generation history:", error);
      this.history = [];
    }
  }

  private async saveHistory(): Promise<void> {
    try {
      await fs.writeFile(this.historyFile, JSON.stringify(this.history, null, 2));
    } catch (error) {
      logger.error("Could not save generation history:", error);
    }
  }

  private async addToHistory(entry: GenerationHistory): Promise<void> {
    this.history.unshift(entry); // Add to beginning
    this.history = this.history.slice(0, 100); // Keep only last 100 entries
    await this.saveHistory();
  }

  async getGenerationHistory(limit: number = 10): Promise<GenerationHistory[]> {
    return this.history.slice(0, limit);
  }
}