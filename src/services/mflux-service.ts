import { PythonShell } from "python-shell";
import { logger } from "../utils/logger.js";
import { ModelConfig, GenerationRequest, GenerationResult, GenerationHistory } from "../types/index.js";
import path from "path";
import fs from "fs/promises";

export class MFLUXService {
  private isInitialized = false;
  private historyFile = "generation_history.json";
  private history: GenerationHistory[] = [];
  private fluxBackend: 'mflux' | 'flux' | 'demo' = 'demo';

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing FLUX service...");
      
      // Check for available FLUX backends
      this.fluxBackend = await this.detectFluxBackend();
      logger.info(`Using FLUX backend: ${this.fluxBackend}`);
      
      if (this.fluxBackend === 'demo') {
        logger.warn("No FLUX backend available - server will run in demo mode");
      }
      
      // Load generation history
      await this.loadHistory();
      
      this.isInitialized = true;
      logger.info("MFLUX service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize MFLUX service:", error);
      throw error;
    }
  }

  private async detectFluxBackend(): Promise<'mflux' | 'flux' | 'demo'> {
    // Try MFLUX first (preferred for Apple Silicon)
    try {
      await this.runPythonScript(`
import mflux
print("MFLUX_AVAILABLE")
`);
      return 'mflux';
    } catch (error) {
      logger.debug("MFLUX not available:", error);
    }

    // Try FLUX with diffusers (for Intel/AMD)
    try {
      await this.runPythonScript(`
import torch
from diffusers import FluxPipeline
print("FLUX_AVAILABLE")
`);
      return 'flux';
    } catch (error) {
      logger.debug("FLUX not available:", error);
    }

    // Fall back to demo mode
    return 'demo';
  }

  private async checkMFLUXInstallation(): Promise<void> {
    // Legacy method - kept for compatibility
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
    
    // Handle different backends
    if (this.fluxBackend === 'demo') {
      logger.info(`Demo mode: simulating image generation for prompt: ${request.prompt}`);
      
      // Create a demo SVG as a placeholder
      const demoSvg = this.createDemoSVG(request);
      const demoBuffer = Buffer.from(demoSvg, 'utf-8');
      
      const generationResult: GenerationResult = {
        uri: `data:image/svg+xml;base64,${demoBuffer.toString('base64')}`,
        data: demoBuffer,
        metadata: {
          prompt: request.prompt,
          style: request.style,
          width: request.width,
          height: request.height,
          steps: request.steps,
          guidance_scale: request.guidance_scale,
          seed: request.seed,
          model: "demo-mode",
          lora: "demo-lora",
          timestamp,
        },
      };

      // Add to history
      await this.addToHistory({
        timestamp,
        prompt: request.prompt,
        style: request.style,
        status: "completed",
        outputPath: "demo-svg",
        metadata: generationResult.metadata,
      });

      logger.info("Demo image generation completed");
      return generationResult;
    }

    const outputPath = `output_${Date.now()}.png`;
    
    try {
      logger.info(`Starting image generation with ${this.fluxBackend}: ${request.prompt}`);
      
      // Prepare the model configuration based on style
      const modelConfig = this.getModelConfig(request.style);
      
      // Create Python script for image generation based on backend
      const pythonScript = this.fluxBackend === 'mflux' 
        ? this.createMFLUXGenerationScript(request, modelConfig, outputPath)
        : this.createFLUXGenerationScript(request, modelConfig, outputPath);
      
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

  private createMFLUXGenerationScript(
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

  private createFLUXGenerationScript(
    request: GenerationRequest,
    modelConfig: ModelConfig,
    outputPath: string
  ): string {
    // Enhanced prompt based on style
    const enhancedPrompt = this.enhancePrompt(request.prompt, request.style);
    
    return `
import sys
import os
import torch
from diffusers import FluxPipeline

try:
    print("Loading FLUX model with diffusers...")
    
    # Initialize FLUX pipeline for CPU
    pipe = FluxPipeline.from_pretrained(
        "black-forest-labs/FLUX.1-dev",
        torch_dtype=torch.float32,  # Use float32 for CPU
        device_map="cpu"
    )
    
    print("Model loaded successfully")
    
    print("Starting image generation...")
    print(f"Prompt: ${enhancedPrompt}")
    print(f"Style: ${request.style}")
    print(f"Steps: ${request.steps}")
    print(f"Guidance Scale: ${request.guidance_scale}")
    print(f"Dimensions: ${request.width}x${request.height}")
    ${request.seed ? `print(f"Seed: ${request.seed}")` : ''}
    
    # Set seed if provided
    ${request.seed ? `
    generator = torch.Generator().manual_seed(${request.seed})
    ` : 'generator = None'}
    
    # Generate image
    image = pipe(
        prompt="${enhancedPrompt}",
        height=${request.height},
        width=${request.width},
        num_inference_steps=${request.steps},
        guidance_scale=${request.guidance_scale},
        generator=generator
    ).images[0]
    
    # Save the image
    image.save("${outputPath}")
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

      PythonShell.runString(script, options).then((results) => {
        const output = results?.join('\n') || '';
        resolve(output);
      }).catch((err) => {
        reject(err);
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

  private createDemoSVG(request: GenerationRequest): string {
    const { width, height, style, prompt } = request;
    
    // Create different demo SVGs based on style
    const colors = style === 'laser' ? ['#000000', '#ffffff'] : 
                  style === 'vector' ? ['#4A90E2', '#7ED321', '#F5A623', '#D0021B'] :
                  ['#E94B3C', '#6BCF7F', '#4A90E2', '#F08F26', '#BD10E0'];
    
    const shapes = [];
    
    // Add some geometric shapes based on style
    if (style === 'vector' || style === 'laser') {
      // Clean geometric shapes
      shapes.push(`<rect x="50" y="50" width="100" height="100" fill="${colors[0]}" opacity="0.8"/>`);
      shapes.push(`<circle cx="${width - 100}" cy="100" r="50" fill="${colors[1]}" opacity="0.6"/>`);
      shapes.push(`<polygon points="50,${height - 50} 150,${height - 100} 250,${height - 50}" fill="${colors[2] || colors[0]}" opacity="0.7"/>`);
    } else {
      // Colorful artistic shapes
      for (let i = 0; i < 5; i++) {
        const x = Math.floor((width / 6) * (i + 1));
        const y = Math.floor(height / 2 + Math.sin(i) * 50);
        const color = colors[i % colors.length];
        shapes.push(`<circle cx="${x}" cy="${y}" r="${20 + i * 5}" fill="${color}" opacity="0.7"/>`);
      }
    }
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .demo-text { font-family: Arial, sans-serif; font-size: 14px; fill: #333; }
      .demo-subtitle { font-family: Arial, sans-serif; font-size: 10px; fill: #666; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="${style === 'laser' ? '#ffffff' : '#f8f9fa'}"/>
  
  <!-- Demo shapes -->
  ${shapes.join('\n  ')}
  
  <!-- Demo text -->
  <text x="20" y="30" class="demo-text">Demo SVG - Style: ${style}</text>
  <text x="20" y="45" class="demo-subtitle">Prompt: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}</text>
  <text x="20" y="${height - 20}" class="demo-subtitle">⚠️ This is a demo. Install MFLUX for AI generation.</text>
</svg>`;
  }
}