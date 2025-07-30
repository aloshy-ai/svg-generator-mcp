import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SVGGeneratorServer } from './server/svg-generator-server.js';

describe('Smoke Tests', () => {
  it('should be able to create SVGGeneratorServer instance', () => {
    const server = new SVGGeneratorServer();
    assert.ok(server);
  });

  it('should return tools without initialization', () => {
    const server = new SVGGeneratorServer();
    const tools = server.getTools();
    assert.ok(Array.isArray(tools));
    assert.strictEqual(tools.length, 4);
    
    const toolNames = tools.map(tool => tool.name);
    assert.ok(toolNames.includes('generate_svg_illustration'));
    assert.ok(toolNames.includes('optimize_svg'));
    assert.ok(toolNames.includes('list_available_models'));
    assert.ok(toolNames.includes('get_generation_history'));
  });

  it('should have proper tool schemas', () => {
    const server = new SVGGeneratorServer();
    const tools = server.getTools();
    const generateTool = tools.find(tool => tool.name === 'generate_svg_illustration');
    
    assert.ok(generateTool);
    assert.ok(generateTool.inputSchema);
    assert.ok(generateTool.inputSchema.properties);
    assert.ok(generateTool.inputSchema.properties.prompt);
    assert.ok(generateTool.inputSchema.required);
    assert.ok(generateTool.inputSchema.required.includes('prompt'));
  });
});