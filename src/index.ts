#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { SVGGeneratorServer } from "./server/svg-generator-server.js";
import { logger } from "./utils/logger.js";

/**
 * SVG Generator MCP Server
 * Professional MCP server for generating SVG illustrations using MFLUX
 * with Vector SVG Laser LoRA and FluxxxMix Checkpoint models
 */
async function main() {
  const server = new Server(
    {
      name: "svg-generator-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const svgGenerator = new SVGGeneratorServer();

  // Initialize the SVG generator
  await svgGenerator.initialize();

  // Register tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: svgGenerator.getTools(),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      const result = await svgGenerator.handleToolCall(name, args);
      return result;
    } catch (error) {
      logger.error(`Tool call failed for ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  logger.info("SVG Generator MCP Server started successfully");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    logger.error("Failed to start server:", error);
    process.exit(1);
  });
}