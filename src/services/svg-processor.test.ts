import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SVGProcessor } from './svg-processor.js';
import sharp from 'sharp';
import fs from 'fs/promises';

// Mock dependencies
vi.mock('sharp');
vi.mock('fs/promises');

describe('SVGProcessor', () => {
  let svgProcessor: SVGProcessor;
  let mockSharp: any;
  let mockFs: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    svgProcessor = new SVGProcessor();
    mockSharp = vi.mocked(sharp);
    mockFs = vi.mocked(fs);
    
    // Setup default sharp mock
    const mockSharpInstance = {
      png: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('test-buffer')),
    };
    
    mockSharp.mockReturnValue(mockSharpInstance);
    mockFs.writeFile = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(svgProcessor.initialize()).resolves.not.toThrow();
    });

    it('should throw error if sharp test fails', async () => {
      const mockSharpInstance = {
        png: vi.fn().mockReturnThis(),
        toBuffer: vi.fn().mockResolvedValue(Buffer.alloc(0)), // Empty buffer should fail
      };
      
      mockSharp.mockReturnValue(mockSharpInstance);
      
      await expect(svgProcessor.initialize()).rejects.toThrow('Sharp test failed');
    });
  });

  describe('convertToSVG', () => {
    const mockGenerationResult = {
      data: Buffer.from('mock-image-data'),
      metadata: {
        width: 512,
        height: 512,
        style: 'vector',
        prompt: 'test prompt',
        model: 'dev',
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    };

    beforeEach(async () => {
      await svgProcessor.initialize();
    });

    it('should convert generation result to SVG', async () => {
      const result = await svgProcessor.convertToSVG(mockGenerationResult);

      expect(result.uri).toMatch(/^file:\/\/.*\.svg$/);
      expect(result.content).toContain('<svg');
      expect(result.content).toContain('width="512"');
      expect(result.content).toContain('height="512"');
      expect(result.content).toContain('test prompt');
      expect(result.metadata.format).toBe('svg');
      
      expect(mockFs.writeFile).toHaveBeenCalledOnce();
    });

    it('should create vector style SVG', async () => {
      const result = await svgProcessor.convertToSVG({
        ...mockGenerationResult,
        metadata: { ...mockGenerationResult.metadata, style: 'vector' },
      });

      expect(result.content).toContain('Vector Style');
      expect(result.content).toContain('vector-style');
      expect(result.content).toContain('crisp-edges');
    });

    it('should create laser style SVG', async () => {
      const result = await svgProcessor.convertToSVG({
        ...mockGenerationResult,
        metadata: { ...mockGenerationResult.metadata, style: 'laser' },
      });

      expect(result.content).toContain('Laser Cut Style');
      expect(result.content).toContain('laser-style');
      expect(result.content).toContain('contrast');
    });

    it('should create colorful style SVG', async () => {
      const result = await svgProcessor.convertToSVG({
        ...mockGenerationResult,
        metadata: { ...mockGenerationResult.metadata, style: 'colorful' },
      });

      expect(result.content).toContain('Colorful Style');
      expect(result.content).toContain('colorful-style');
      expect(result.content).toContain('saturate');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProcessor = new SVGProcessor();
      
      await expect(
        uninitializedProcessor.convertToSVG(mockGenerationResult)
      ).rejects.toThrow('SVG Processor not initialized');
    });

    it('should handle conversion errors', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(
        svgProcessor.convertToSVG(mockGenerationResult)
      ).rejects.toThrow('SVG conversion failed: Write failed');
    });
  });

  describe('optimize', () => {
    const testSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" viewBox="0 0 100.000 100.000" xmlns="http://www.w3.org/2000/svg">
  <!-- This is a comment -->
  <title>Test SVG</title>
  <desc>Test description</desc>
  <rect x="10.123456" y="20.987654" width="50" height="50" fill="red" stroke="blue" stroke-width="2.345678"/>
</svg>`;

    beforeEach(async () => {
      await svgProcessor.initialize();
    });

    it('should optimize SVG with basic level', async () => {
      const result = await svgProcessor.optimize(testSVG, {
        level: 'basic',
        preserveColors: true,
      });

      expect(result.uri).toMatch(/^file:\/\/.*optimized_svg.*\.svg$/);
      expect(result.content.length).toBeLessThan(testSVG.length);
      expect(result.metadata.optimization_level).toBe('basic');
      expect(result.metadata.preserve_colors).toBe(true);
      expect(result.metadata.compression_ratio).toMatch(/\d+\.\d{2}%/);
      
      // Should remove comments and extra whitespace
      expect(result.content).not.toContain('<!-- This is a comment -->');
      expect(result.content).not.toContain('\n  ');
      
      expect(mockFs.writeFile).toHaveBeenCalledOnce();
    });

    it('should optimize SVG with aggressive level', async () => {
      const result = await svgProcessor.optimize(testSVG, {
        level: 'aggressive',
        preserveColors: false,
      });

      expect(result.content.length).toBeLessThan(testSVG.length);
      expect(result.metadata.optimization_level).toBe('aggressive');
      
      // Should remove title and desc elements
      expect(result.content).not.toContain('<title>');
      expect(result.content).not.toContain('<desc>');
    });

    it('should simplify decimal precision', async () => {
      const result = await svgProcessor.optimize(testSVG, {
        level: 'basic',
        preserveColors: true,
      });

      // Long decimals should be shortened
      expect(result.content).not.toContain('10.123456');
      expect(result.content).not.toContain('20.987654');
      expect(result.content).toContain('10.12');
      expect(result.content).toContain('20.99');
    });

    it('should handle viewBox optimization in aggressive mode', async () => {
      const result = await svgProcessor.optimize(testSVG, {
        level: 'aggressive',
        preserveColors: true,
      });

      // ViewBox should be simplified
      expect(result.content).toContain('viewBox="0 0 100 100"');
      expect(result.content).not.toContain('100.000');
    });

    it('should throw error if not initialized', async () => {
      const uninitializedProcessor = new SVGProcessor();
      
      await expect(
        uninitializedProcessor.optimize(testSVG, { level: 'basic', preserveColors: true })
      ).rejects.toThrow('SVG Processor not initialized');
    });

    it('should handle optimization errors', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
      
      await expect(
        svgProcessor.optimize(testSVG, { level: 'basic', preserveColors: true })
      ).rejects.toThrow('SVG optimization failed: Write failed');
    });

    it('should calculate compression ratio correctly', async () => {
      const result = await svgProcessor.optimize(testSVG, {
        level: 'basic',
        preserveColors: true,
      });

      const originalSize = testSVG.length;
      const optimizedSize = result.content.length;
      const expectedRatio = ((originalSize - optimizedSize) / originalSize * 100).toFixed(2) + '%';
      
      expect(result.metadata.compression_ratio).toBe(expectedRatio);
      expect(result.metadata.original_size).toBe(originalSize);
      expect(result.metadata.optimized_size).toBe(optimizedSize);
    });
  });
});