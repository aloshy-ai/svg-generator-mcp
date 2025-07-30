import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { MFLUXService } from "../services/mflux-service.js";
import { ModelService } from "../services/model-service.js";
import { SVGProcessor } from "../services/svg-processor.js";
import { logger } from "../utils/logger.js";

// Input validation schemas
const GenerateSVGSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  style: z.enum(["vector", "laser", "colorful"]).optional().default("vector"),
  width: z.number().int().min(64).max(2048).optional().default(512),
  height: z.number().int().min(64).max(2048).optional().default(512),
  steps: z.number().int().min(1).max(50).optional().default(20),
  guidance_scale: z.number().min(1).max(20).optional().default(7.5),
  seed: z.number().int().optional(),
});

const OptimizeSVGSchema = z.object({
  svg_content: z.string().min(1, "SVG content cannot be empty"),
  optimization_level: z.enum(["basic", "aggressive"]).optional().default("basic"),
  preserve_colors: z.boolean().optional().default(true),
});

export class SVGGeneratorServer {
  private mfluxService: MFLUXService;
  private modelService: ModelService;
  private svgProcessor: SVGProcessor;
  private isInitialized = false;

  constructor() {
    this.mfluxService = new MFLUXService();
    this.modelService = new ModelService();
    this.svgProcessor = new SVGProcessor();
  }

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing SVG Generator Server...");
      
      await this.mfluxService.initialize();
      await this.modelService.initialize();
      await this.svgProcessor.initialize();
      
      this.isInitialized = true;
      logger.info("SVG Generator Server initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SVG Generator Server:", error);
      throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getTools(): Tool[] {
    return [
      {
        name: "generate_svg_illustration",
        title: "Generate SVG Illustration",
        description: "Generate a high-quality SVG illustration using MFLUX with Vector SVG Laser LoRA. Supports various styles including vector graphics and colorful illustrations.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Detailed text prompt describing the desired SVG illustration",
            },
            style: {
              type: "string",
              enum: ["vector", "laser", "colorful"],
              description: "Style of the SVG illustration: 'vector' for clean vector graphics, 'laser' for laser-cut style, 'colorful' for vibrant illustrations",
              default: "vector",
            },
            width: {
              type: "number",
              description: "Width of the generated image in pixels (64-2048)",
              default: 512,
              minimum: 64,
              maximum: 2048,
            },
            height: {
              type: "number",
              description: "Height of the generated image in pixels (64-2048)",
              default: 512,
              minimum: 64,
              maximum: 2048,
            },
            steps: {
              type: "number",
              description: "Number of inference steps (1-50, higher = better quality but slower)",
              default: 20,
              minimum: 1,
              maximum: 50,
            },
            guidance_scale: {
              type: "number",
              description: "Guidance scale for prompt adherence (1-20, higher = more prompt following)",
              default: 7.5,
              minimum: 1,
              maximum: 20,
            },
            seed: {
              type: "number",
              description: "Random seed for reproducible results (optional)",
            },
          },
          required: ["prompt"],
        },
      },
      {
        name: "optimize_svg",
        title: "Optimize SVG",
        description: "Optimize and clean up SVG content for better performance and smaller file size while maintaining visual quality.",
        inputSchema: {
          type: "object",
          properties: {
            svg_content: {
              type: "string",
              description: "The SVG content to optimize",
            },
            optimization_level: {
              type: "string",
              enum: ["basic", "aggressive"],
              description: "Level of optimization: 'basic' for safe optimizations, 'aggressive' for maximum compression",
              default: "basic",
            },
            preserve_colors: {
              type: "boolean",
              description: "Whether to preserve original colors during optimization",
              default: true,
            },
          },
          required: ["svg_content"],
        },
      },
      {
        name: "list_available_models",
        title: "List Available Models",
        description: "List all available models and their current status (downloaded, available for download, etc.)",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_generation_history",
        title: "Get Generation History",
        description: "Retrieve the history of recent SVG generations with metadata",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of history entries to return",
              default: 10,
              minimum: 1,
              maximum: 100,
            },
          },
        },
      },
    ];
  }

  async handleToolCall(name: string, args: any): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Server not initialized. Please wait for initialization to complete.");
    }

    switch (name) {
      case "generate_svg_illustration":
        return await this.handleGenerateSVG(args);
      
      case "optimize_svg":
        return await this.handleOptimizeSVG(args);
      
      case "list_available_models":
        return await this.handleListModels();
      
      case "get_generation_history":
        return await this.handleGetHistory(args);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private async handleGenerateSVG(args: any) {
    const validatedArgs = GenerateSVGSchema.parse(args);
    
    logger.info(`Generating SVG illustration with prompt: "${validatedArgs.prompt}"`);
    
    try {
      // Generate the image using MFLUX with appropriate models
      const imageResult = await this.mfluxService.generateImage({
        prompt: validatedArgs.prompt,
        style: validatedArgs.style,
        width: validatedArgs.width,
        height: validatedArgs.height,
        steps: validatedArgs.steps,
        guidance_scale: validatedArgs.guidance_scale,
        seed: validatedArgs.seed,
      });

      // Process the image to SVG if needed
      const svgResult = await this.svgProcessor.convertToSVG(imageResult);
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully generated SVG illustration!\n\nPrompt: ${validatedArgs.prompt}\nStyle: ${validatedArgs.style}\nDimensions: ${validatedArgs.width}x${validatedArgs.height}\nSteps: ${validatedArgs.steps}\nGuidance Scale: ${validatedArgs.guidance_scale}${validatedArgs.seed ? `\nSeed: ${validatedArgs.seed}` : ""}`,
          },
          {
            type: "resource",
            resource: {
              uri: svgResult.uri,
              text: svgResult.content,
              mimeType: "image/svg+xml",
            },
          },
        ],
      };
    } catch (error) {
      logger.error("SVG generation failed:", error);
      throw new Error(`SVG generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleOptimizeSVG(args: any) {
    const validatedArgs = OptimizeSVGSchema.parse(args);
    
    logger.info("Optimizing SVG content");
    
    try {
      const optimizedSVG = await this.svgProcessor.optimize(
        validatedArgs.svg_content,
        {
          level: validatedArgs.optimization_level,
          preserveColors: validatedArgs.preserve_colors,
        }
      );

      return {
        content: [
          {
            type: "text",
            text: `SVG optimized successfully!\n\nOriginal size: ${validatedArgs.svg_content.length} characters\nOptimized size: ${optimizedSVG.content.length} characters\nCompression: ${((1 - optimizedSVG.content.length / validatedArgs.svg_content.length) * 100).toFixed(1)}%`,
          },
          {
            type: "resource",
            resource: {
              uri: optimizedSVG.uri,
              text: optimizedSVG.content,
              mimeType: "image/svg+xml",
            },
          },
        ],
      };
    } catch (error) {
      logger.error("SVG optimization failed:", error);
      throw new Error(`SVG optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleListModels() {
    try {
      const models = await this.modelService.listAvailableModels();
      
      return {
        content: [
          {
            type: "text",
            text: `Available Models:\n\n${models.map(model => 
              `• ${model.name} (${model.type})\n  Status: ${model.status}\n  Size: ${model.size}\n  Description: ${model.description}`
            ).join('\n\n')}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Failed to list models:", error);
      throw new Error(`Failed to list models: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleGetHistory(args: any) {
    const limit = args?.limit || 10;
    
    try {
      const history = await this.mfluxService.getGenerationHistory(limit);
      
      return {
        content: [
          {
            type: "text",
            text: `Generation History (${history.length} entries):\n\n${history.map((entry, index) => 
              `${index + 1}. ${entry.timestamp}\n   Prompt: "${entry.prompt}"\n   Style: ${entry.style}\n   Status: ${entry.status}`
            ).join('\n\n')}`,
          },
        ],
      };
    } catch (error) {
      logger.error("Failed to get generation history:", error);
      throw new Error(`Failed to get generation history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}