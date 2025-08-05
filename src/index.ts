#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server for Autonomous Development Team
const server = new McpServer({
  name: "Autonomous Development Team",
  version: "1.0.0",
});

// Add a resource for project templates
server.resource(
  "project-template",
  new ResourceTemplate("project-template://{type}", { list: undefined }),
  async (uri, { type }) => {
    const templates: Record<string, string> = {
      'web-app': 'Modern web application with React frontend and Node.js backend',
      'api': 'RESTful API with Express.js and PostgreSQL',
      'microservice': 'Microservice with Docker and Kubernetes support',
      'full-stack': 'Full-stack application with authentication and database'
    };
    
    return {
      contents: [
        {
          uri: uri.href,
          text: templates[type as string] || 'Available templates: web-app, api, microservice, full-stack',
        },
      ],
    };
  }
);

// Main tool for complete prototype generation
server.tool("generate_prototype", { 
  prd: z.string().describe('Product Requirements Document content'),
  projectName: z.string().optional().describe('Name of the project to generate'),
  outputDirectory: z.string().optional().describe('Output directory for the generated prototype')
}, async ({ prd, projectName, outputDirectory }) => {
  try {
    // Import the orchestrator dynamically to avoid circular dependencies
    const { Orchestrator } = await import('./agents/orchestrator.js');
    const path = await import('node:path');
    
    // Determine output directory
    const outputDir = outputDirectory || path.join(process.cwd(), 'generated-prototype');
    const projName = projectName || 'Generated Prototype';

    // Initialize agent context
    const context = {
      projectState: {
        requirements: [],
        userStories: [],
        architecture: null,
        implementations: [],
        tests: [],
        deployment: null,
        currentPhase: 'analysis' as const,
        decisions: {
          projectName: projName,
          startTime: new Date().toISOString()
        }
      },
      outputDirectory: outputDir
    };

    // Create and execute Orchestrator
    const orchestrator = new Orchestrator(context);
    const result = await orchestrator.execute({
      prd,
      projectName: projName,
      outputPath: outputDir
    });

    if (result.success) {
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Prototype generation completed successfully!

📁 Output Directory: ${outputDir}
📊 Summary: ${JSON.stringify(result.data, null, 2)}

🚀 Next Steps:
1. Navigate to: cd ${outputDir}
2. Install dependencies: npm install
3. Set up environment: cp .env.example .env
4. Start development: npm run dev
5. Run tests: npm test

Your autonomous development team has created a complete, production-ready prototype!`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text" as const,
            text: `❌ Prototype generation failed: ${result.message}`
          }
        ]
      };
    }
  } catch (error) {
    const err = error as Error;
    return {
      content: [
        {
          type: "text" as const,
          text: `❌ Prototype generation failed: ${err.message}`
        }
      ]
    };
  }
});

// Individual agent tools
server.tool("analyze_requirements", { 
  prd: z.string().describe('Product Requirements Document content')
}, async ({ prd }) => {
  try {
    const { ProductManager } = await import('./agents/product-manager.js');
    
    const context = {
      projectState: {
        requirements: [],
        userStories: [],
        architecture: null,
        implementations: [],
        tests: [],
        deployment: null,
        currentPhase: 'analysis' as const,
        decisions: {}
      },
      outputDirectory: process.cwd()
    };

    const productManager = new ProductManager(context);
    const result = await productManager.execute({ prd });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            requirements: context.projectState.requirements,
            userStories: context.projectState.userStories
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    const err = error as Error;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: false, error: err.message }, null, 2)
        }
      ]
    };
  }
});

server.tool("review_code", { 
  code: z.string().describe('Code content to review'),
  language: z.string().optional().describe('Programming language')
}, async ({ code, language }) => {
  try {
    const { reviewCode } = await import('./tools/review-code.js');
    return await reviewCode({ code, language });
  } catch (error) {
    const err = error as Error;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ success: false, error: err.message }, null, 2)
        }
      ]
    };
  }
});

// Add prompts for guided development workflow
server.prompt("development-workflow", {}, () => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `You are working with an autonomous development team that can take a Product Requirements Document (PRD) and generate a complete working prototype.

Available tools:
1. **generate_prototype** - Complete end-to-end prototype generation from PRD
2. **analyze_requirements** - Extract structured requirements and user stories from PRD  
3. **review_code** - Analyze code quality and suggest improvements

**Main Workflow:**
Use generate_prototype for complete automation - it will:
- Analyze requirements and create user stories
- Design system architecture and tech stack
- Implement all features with clean code
- Generate comprehensive test suites
- Set up deployment configurations
- Create complete documentation

**Example PRD:**
"Build a task management application where users can create, edit, and delete tasks. Users should be able to register and login. Tasks should have titles, descriptions, due dates, and priority levels. Include a dashboard showing task statistics."

The team will generate a production-ready prototype with modern tech stack, comprehensive tests, deployment configs, and documentation.

How would you like to proceed?`,
      },
    },
  ],
}));

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
