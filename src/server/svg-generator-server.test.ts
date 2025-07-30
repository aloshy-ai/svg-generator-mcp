import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SVGGeneratorServer } from './svg-generator-server.js';
import { MFLUXService } from '../services/mflux-service.js';
import { ModelService } from '../services/model-service.js';
import { SVGProcessor } from '../services/svg-processor.js';

// Mock the services
vi.mock('../services/mflux-service.js');
vi.mock('../services/model-service.js'); 
vi.mock('../services/svg-processor.js');

describe('SVGGeneratorServer', () => {
  let server: SVGGeneratorServer;
  let mockMFLUXService: any;
  let mockModelService: any;
  let mockSVGProcessor: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create fresh instances
    server = new SVGGeneratorServer();
    
    // Get mock instances
    mockMFLUXService = vi.mocked(MFLUXService).prototype;
    mockModelService = vi.mocked(ModelService).prototype;
    mockSVGProcessor = vi.mocked(SVGProcessor).prototype;
    
    // Setup default mock implementations
    mockMFLUXService.initialize = vi.fn().mockResolvedValue(undefined);
    mockModelService.initialize = vi.fn().mockResolvedValue(undefined);
    mockSVGProcessor.initialize = vi.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await expect(server.initialize()).resolves.not.toThrow();
      
      expect(mockMFLUXService.initialize).toHaveBeenCalledOnce();
      expect(mockModelService.initialize).toHaveBeenCalledOnce();
      expect(mockSVGProcessor.initialize).toHaveBeenCalledOnce();
    });

    it('should throw error if initialization fails', async () => {
      const error = new Error('Initialization failed');
      mockMFLUXService.initialize.mockRejectedValue(error);
      
      await expect(server.initialize()).rejects.toThrow('Initialization failed: Initialization failed');
    });
  });

  describe('getTools', () => {
    it('should return all available tools', () => {
      const tools = server.getTools();
      
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('generate_svg_illustration');
      expect(toolNames).toContain('optimize_svg');
      expect(toolNames).toContain('list_available_models');
      expect(toolNames).toContain('get_generation_history');
    });

    it('should have proper tool schemas', () => {
      const tools = server.getTools();
      const generateTool = tools.find(tool => tool.name === 'generate_svg_illustration');
      
      expect(generateTool).toBeDefined();
      expect(generateTool?.inputSchema).toBeDefined();
      expect(generateTool?.inputSchema.properties).toHaveProperty('prompt');
      expect(generateTool?.inputSchema.properties).toHaveProperty('style');
      expect(generateTool?.inputSchema.required).toContain('prompt');
    });
  });

  describe('handleToolCall', () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it('should throw error if server not initialized', async () => {
      const uninitializedServer = new SVGGeneratorServer();
      
      await expect(
        uninitializedServer.handleToolCall('generate_svg_illustration', { prompt: 'test' })
      ).rejects.toThrow('Server not initialized');
    });

    it('should throw error for unknown tool', async () => {
      await expect(
        server.handleToolCall('unknown_tool', {})
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });

    describe('generate_svg_illustration', () => {
      const mockGenerationResult = {
        uri: 'file://test.png',
        data: Buffer.from('test-image-data'),
        metadata: {
          prompt: 'test prompt',
          style: 'vector',
          width: 512,
          height: 512,
          steps: 20,
          guidance_scale: 7.5,
          model: 'dev',
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      };

      const mockSVGResult = {
        uri: 'file://test.svg',
        content: '<svg>test</svg>',
        metadata: {},
      };

      beforeEach(() => {
        mockMFLUXService.generateImage = vi.fn().mockResolvedValue(mockGenerationResult);
        mockSVGProcessor.convertToSVG = vi.fn().mockResolvedValue(mockSVGResult);
      });

      it('should generate SVG illustration with valid input', async () => {
        const args = {
          prompt: 'A beautiful vector illustration',
          style: 'vector',
          width: 512,
          height: 512,
        };

        const result = await server.handleToolCall('generate_svg_illustration', args);

        expect(mockMFLUXService.generateImage).toHaveBeenCalledWith({
          prompt: 'A beautiful vector illustration',
          style: 'vector',
          width: 512,
          height: 512,
          steps: 20,
          guidance_scale: 7.5,
          seed: undefined,
        });

        expect(mockSVGProcessor.convertToSVG).toHaveBeenCalledWith(mockGenerationResult);

        expect(result.content).toHaveLength(2);
        expect(result.content[0].type).toBe('text');
        expect(result.content[1].type).toBe('resource');
        expect(result.content[1].resource.mimeType).toBe('image/svg+xml');
      });

      it('should validate input parameters', async () => {
        const invalidArgs = {
          prompt: '', // Empty prompt should fail
          style: 'vector',
        };

        await expect(
          server.handleToolCall('generate_svg_illustration', invalidArgs)
        ).rejects.toThrow();
      });

      it('should handle generation errors', async () => {
        const error = new Error('Generation failed');
        mockMFLUXService.generateImage.mockRejectedValue(error);

        const args = {
          prompt: 'test prompt',
        };

        await expect(
          server.handleToolCall('generate_svg_illustration', args)
        ).rejects.toThrow('SVG generation failed: Generation failed');
      });
    });

    describe('optimize_svg', () => {
      const mockOptimizedResult = {
        uri: 'file://optimized.svg',
        content: '<svg>optimized</svg>',
        metadata: {
          optimization_level: 'basic',
          original_size: 100,
          optimized_size: 80,
          compression_ratio: '20.00%',
        },
      };

      beforeEach(() => {
        mockSVGProcessor.optimize = vi.fn().mockResolvedValue(mockOptimizedResult);
      });

      it('should optimize SVG with valid input', async () => {
        const args = {
          svg_content: '<svg>original</svg>',
          optimization_level: 'basic',
          preserve_colors: true,
        };

        const result = await server.handleToolCall('optimize_svg', args);

        expect(mockSVGProcessor.optimize).toHaveBeenCalledWith(
          '<svg>original</svg>',
          {
            level: 'basic',
            preserveColors: true,
          }
        );

        expect(result.content).toHaveLength(2);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('compression');
      });

      it('should validate SVG content', async () => {
        const invalidArgs = {
          svg_content: '', // Empty content should fail
        };

        await expect(
          server.handleToolCall('optimize_svg', invalidArgs)
        ).rejects.toThrow();
      });
    });

    describe('list_available_models', () => {
      const mockModels = [
        {
          name: 'FLUX Dev',
          type: 'base_model',
          status: 'available',
          size: '~12GB',
          description: 'FLUX development model',
          path: 'dev',
        },
      ];

      beforeEach(() => {
        mockModelService.listAvailableModels = vi.fn().mockResolvedValue(mockModels);
      });

      it('should list available models', async () => {
        const result = await server.handleToolCall('list_available_models', {});

        expect(mockModelService.listAvailableModels).toHaveBeenCalledOnce();
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('FLUX Dev');
      });
    });

    describe('get_generation_history', () => {
      const mockHistory = [
        {
          timestamp: '2024-01-01T00:00:00.000Z',
          prompt: 'test prompt',
          style: 'vector',
          status: 'completed',
        },
      ];

      beforeEach(() => {
        mockMFLUXService.getGenerationHistory = vi.fn().mockResolvedValue(mockHistory);
      });

      it('should get generation history', async () => {
        const result = await server.handleToolCall('get_generation_history', { limit: 5 });

        expect(mockMFLUXService.getGenerationHistory).toHaveBeenCalledWith(5);
        expect(result.content).toHaveLength(1);
        expect(result.content[0].type).toBe('text');
        expect(result.content[0].text).toContain('test prompt');
      });

      it('should use default limit if not provided', async () => {
        await server.handleToolCall('get_generation_history', {});

        expect(mockMFLUXService.getGenerationHistory).toHaveBeenCalledWith(10);
      });
    });
  });
});