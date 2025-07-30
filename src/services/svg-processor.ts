import sharp from "sharp";
import { logger } from "../utils/logger.js";
import { SVGResult, OptimizationOptions } from "../types/index.js";
import path from "path";
import fs from "fs/promises";

export class SVGProcessor {
  private isInitialized = false;

  async initialize(): Promise<void> {
    try {
      logger.info("Initializing SVG Processor...");
      
      // Test sharp functionality
      await this.testSharpInstallation();
      
      this.isInitialized = true;
      logger.info("SVG Processor initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize SVG Processor:", error);
      throw error;
    }
  }

  private async testSharpInstallation(): Promise<void> {
    try {
      // Create a simple test image to verify sharp is working
      const testBuffer = await sharp({
        create: {
          width: 10,
          height: 10,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      })
      .png()
      .toBuffer();
      
      if (testBuffer.length === 0) {
        throw new Error("Sharp test failed");
      }
      
      logger.info("Sharp installation verified");
    } catch (error) {
      throw new Error(`Sharp installation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async convertToSVG(generationResult: any): Promise<SVGResult> {
    if (!this.isInitialized) {
      throw new Error("SVG Processor not initialized");
    }

    try {
      logger.info("Converting generated image to SVG");
      
      // For now, we'll create a simple SVG wrapper around the generated image
      // In a more advanced implementation, you could use image tracing algorithms
      const imageBuffer = generationResult.data;
      const base64Image = imageBuffer.toString('base64');
      const { width, height } = generationResult.metadata;
      
      // Create SVG with embedded image
      const svgContent = this.createSVGWrapper(base64Image, width, height, generationResult.metadata);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `svg_${timestamp}.svg`;
      const uri = `file://${path.resolve(filename)}`;
      
      // Save SVG file
      await fs.writeFile(filename, svgContent, 'utf-8');
      
      logger.info(`SVG created: ${filename}`);
      
      return {
        uri,
        content: svgContent,
        metadata: {
          ...generationResult.metadata,
          format: 'svg',
          size: svgContent.length,
        },
      };
      
    } catch (error) {
      logger.error("SVG conversion failed:", error);
      throw new Error(`SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createSVGWrapper(base64Image: string, width: number, height: number, metadata: any): string {
    const style = metadata.style || 'vector';
    
    // Create different SVG styles based on the generation style
    switch (style) {
      case 'vector':
        return this.createVectorStyleSVG(base64Image, width, height, metadata);
      case 'laser':
        return this.createLaserStyleSVG(base64Image, width, height, metadata);
      case 'colorful':
        return this.createColorfulStyleSVG(base64Image, width, height, metadata);
      default:
        return this.createBasicSVG(base64Image, width, height, metadata);
    }
  }

  private createVectorStyleSVG(base64Image: string, width: number, height: number, metadata: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .vector-style {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        shape-rendering: crispEdges;
      }
    </style>
  </defs>
  <title>Generated SVG Illustration - Vector Style</title>
  <desc>Prompt: ${metadata.prompt}</desc>
  <image class="vector-style" width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
  }

  private createLaserStyleSVG(base64Image: string, width: number, height: number, metadata: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .laser-style {
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        shape-rendering: crispEdges;
        filter: contrast(150%) brightness(110%);
      }
    </style>
  </defs>
  <title>Generated SVG Illustration - Laser Cut Style</title>
  <desc>Prompt: ${metadata.prompt}</desc>
  <image class="laser-style" width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
  }

  private createColorfulStyleSVG(base64Image: string, width: number, height: number, metadata: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .colorful-style {
        image-rendering: auto;
        shape-rendering: geometricPrecision;
        filter: saturate(110%) brightness(105%);
      }
    </style>
  </defs>
  <title>Generated SVG Illustration - Colorful Style</title>
  <desc>Prompt: ${metadata.prompt}</desc>
  <image class="colorful-style" width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
  }

  private createBasicSVG(base64Image: string, width: number, height: number, metadata: any): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <title>Generated SVG Illustration</title>
  <desc>Prompt: ${metadata.prompt}</desc>
  <image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base64Image}"/>
</svg>`;
  }

  async optimize(svgContent: string, options: OptimizationOptions): Promise<SVGResult> {
    if (!this.isInitialized) {
      throw new Error("SVG Processor not initialized");
    }

    try {
      logger.info(`Optimizing SVG with ${options.level} level`);
      
      let optimizedContent = svgContent;
      
      // Basic optimizations
      if (options.level === 'basic' || options.level === 'aggressive') {
        optimizedContent = this.applyBasicOptimizations(optimizedContent, options);
      }
      
      // Aggressive optimizations
      if (options.level === 'aggressive') {
        optimizedContent = this.applyAggressiveOptimizations(optimizedContent, options);
      }
      
      // Generate unique filename for optimized SVG
      const timestamp = Date.now();
      const filename = `optimized_svg_${timestamp}.svg`;
      const uri = `file://${path.resolve(filename)}`;
      
      // Save optimized SVG
      await fs.writeFile(filename, optimizedContent, 'utf-8');
      
      logger.info(`Optimized SVG saved: ${filename}`);
      
      return {
        uri,
        content: optimizedContent,
        metadata: {
          optimization_level: options.level,
          preserve_colors: options.preserveColors,
          original_size: svgContent.length,
          optimized_size: optimizedContent.length,
          compression_ratio: ((svgContent.length - optimizedContent.length) / svgContent.length * 100).toFixed(2) + '%',
        },
      };
      
    } catch (error) {
      logger.error("SVG optimization failed:", error);
      throw new Error(`SVG optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyBasicOptimizations(svgContent: string, options: OptimizationOptions): string {
    let optimized = svgContent;
    
    // Remove unnecessary whitespace and line breaks
    optimized = optimized.replace(/>\s+</g, '><');
    optimized = optimized.replace(/\s+/g, ' ');
    optimized = optimized.trim();
    
    // Remove comments
    optimized = optimized.replace(/<!--[\s\S]*?-->/g, '');
    
    // Remove empty attributes
    optimized = optimized.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');
    
    // Simplify decimal numbers (keep 2 decimal places max)
    optimized = optimized.replace(/(\d+\.\d{3,})/g, (match) => {
      return parseFloat(match).toFixed(2);
    });
    
    return optimized;
  }

  private applyAggressiveOptimizations(svgContent: string, options: OptimizationOptions): string {
    let optimized = svgContent;
    
    // Remove unnecessary XML declarations and namespaces if not needed
    if (!optimized.includes('xlink:')) {
      optimized = optimized.replace(/xmlns:xlink="[^"]*"\s*/g, '');
    }
    
    // Remove title and desc if present (optional metadata)
    if (optimized.includes('<title>') && optimized.includes('</title>')) {
      optimized = optimized.replace(/<title>[\s\S]*?<\/title>\s*/g, '');
    }
    if (optimized.includes('<desc>') && optimized.includes('</desc>')) {
      optimized = optimized.replace(/<desc>[\s\S]*?<\/desc>\s*/g, '');
    }
    
    // Simplify style definitions if preserve_colors is false
    if (!options.preserveColors) {
      // This is a placeholder - in a real implementation you might want to
      // analyze and simplify color usage, convert to grayscale, etc.
      logger.info("Color preservation disabled - additional optimizations could be applied");
    }
    
    // Remove unnecessary precision in viewBox
    optimized = optimized.replace(/viewBox="([^"]+)"/g, (match, viewBox) => {
      const values = viewBox.split(/\s+/).map((v: string) => {
        const num = parseFloat(v);
        return Number.isInteger(num) ? num.toString() : num.toFixed(1);
      });
      return `viewBox="${values.join(' ')}"`;
    });
    
    return optimized;
  }
}