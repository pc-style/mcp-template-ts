#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { LLMService } from "./services/llm.js";
import { FileSystemService } from "./services/filesystem.js";
import { OrchestratorAgent } from "./agents/orchestrator.js";
import { ProductManagerAgent } from "./agents/product-manager.js";
import { TechLeadAgent } from "./agents/tech-lead.js";
import { DeveloperAgent } from "./agents/developer.js";
import { QAEngineerAgent } from "./agents/qa-engineer.js";
import { DevOpsAgent } from "./agents/devops.js";
import {
  AnalyzeRequirementsSchema,
  CreateArchitectureSchema,
  ImplementFeatureSchema,
  CreateTestsSchema,
  SetupDeploymentSchema,
  ReviewCodeSchema,
  UpdateDocumentationSchema,
  LLMConfigSchema,
  ProjectContextSchema,
  UserStorySchema,
  ArchitectureSchema,
  FeatureSchema
} from "./types.js";
import path from "path";
import fs from "fs-extra";

// Create an MCP server
const server = new McpServer({
  name: "Autonomous Development Team",
  version: "1.0.0",
});

// Global state
let orchestrator: OrchestratorAgent | null = null;
let llmService: LLMService | null = null;
let fileSystemService: FileSystemService | null = null;
let currentProjectPath: string | null = null;

// Initialize services
async function initializeServices(llmConfig: any) {
  const config = LLMConfigSchema.parse(llmConfig);
  llmService = new LLMService(config);
  
  // Create temporary project directory
  const tempDir = path.join(process.cwd(), 'temp-projects');
  await fs.ensureDir(tempDir);
  fileSystemService = new FileSystemService(tempDir);
  
  orchestrator = new OrchestratorAgent(llmService, fileSystemService, config);
}

// MCP Tools

// 1. Analyze Requirements
server.tool(
  "analyze_requirements",
  {
    prd: z.string(),
    projectName: z.string().optional(),
    projectDescription: z.string().optional()
  },
  async (args) => {
    const { prd, projectName, projectDescription } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const productManager = new ProductManagerAgent(llmService!);
      const userStories = await productManager.analyzeRequirements(prd, projectName, projectDescription);
      
      const validation = await productManager.validateUserStories(userStories);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Requirements analysis completed!\n\nCreated ${userStories.length} user stories:\n\n${userStories.map(story => 
              `• ${story.title} (${story.priority} priority)\n  ${story.description}\n  Acceptance Criteria: ${story.acceptanceCriteria.join(', ')}`
            ).join('\n\n')}\n\n${validation.valid ? '✅ All user stories are valid' : `⚠️ Validation issues: ${validation.issues.join(', ')}`}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Requirements analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 2. Create Architecture
server.tool(
  "create_architecture",
  {
    userStories: z.array(UserStorySchema),
    projectName: z.string(),
    projectDescription: z.string()
  },
  async (args) => {
    const { userStories, projectName, projectDescription } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const techLead = new TechLeadAgent(llmService!);
      const architecture = await techLead.createArchitecture(userStories, projectName, projectDescription);
      
      const enhancedArchitecture = await techLead.createAPIContracts(architecture);
      const finalArchitecture = await techLead.designDatabaseSchema(enhancedArchitecture, userStories);
      
      const validation = await techLead.validateArchitecture(finalArchitecture);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Architecture design completed!\n\nTech Stack:\n• Frontend: ${finalArchitecture.techStack.frontend.join(', ')}\n• Backend: ${finalArchitecture.techStack.backend.join(', ')}\n• Database: ${finalArchitecture.techStack.database}\n• Deployment: ${finalArchitecture.techStack.deployment.join(', ')}\n\nAPI Endpoints: ${finalArchitecture.apiSpecs.length}\nDatabase Tables: ${finalArchitecture.databaseSchema.length}\n\n${validation.valid ? '✅ Architecture is valid' : `⚠️ Validation issues: ${validation.issues.join(', ')}`}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Architecture creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 3. Implement Feature
server.tool(
  "implement_feature",
  {
    feature: z.string(),
    architecture: ArchitectureSchema,
    userStories: z.array(UserStorySchema)
  },
  async (args) => {
    const { feature, architecture, userStories } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const developer = new DeveloperAgent(llmService!);
      const featureImplementation = await developer.implementFeature(feature, architecture as any, userStories as any);
      
      const featureWithTests = await developer.generateTests(featureImplementation, architecture as any);
      const validation = await developer.validateFeature(featureWithTests);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Feature implementation completed!\n\nFeature: ${featureWithTests.name}\nDescription: ${featureWithTests.description}\nFiles created: ${featureWithTests.files.length}\nTests created: ${featureWithTests.tests?.length || 0}\n\n${validation.valid ? '✅ Feature is valid' : `⚠️ Validation issues: ${validation.issues.join(', ')}`}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Feature implementation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 4. Create Tests
server.tool(
  "create_tests",
  {
    features: z.array(FeatureSchema),
    architecture: ArchitectureSchema
  },
  async (args) => {
    const { features, architecture } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const qaEngineer = new QAEngineerAgent(llmService!);
      const testPlan = await qaEngineer.createTestPlan(features as any, architecture as any);
      
      const validation = await qaEngineer.validateTestPlan(testPlan);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Test plan creation completed!\n\nTest Coverage:\n• Unit Tests: ${testPlan.unitTests.length} files\n• Integration Tests: ${testPlan.integrationTests.length} tests\n• End-to-End Tests: ${testPlan.e2eTests.length} tests\n\n${validation.valid ? '✅ Test plan is valid' : `⚠️ Validation issues: ${validation.issues.join(', ')}`}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Test creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 5. Setup Deployment
server.tool(
  "setup_deployment",
  {
    projectName: z.string(),
    architecture: ArchitectureSchema,
    features: z.array(FeatureSchema)
  },
  async (args) => {
    const { projectName, architecture, features } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const devOps = new DevOpsAgent(llmService!);
      const deployment = await devOps.setupDeployment(projectName, architecture as any, features as any);
      
      const validation = await devOps.validateDeployment(deployment);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Deployment setup completed!\n\nDeployment Configuration:\n• Docker: ${deployment.docker.dockerfile ? 'Configured' : 'Not configured'}\n• CI/CD: ${deployment.ci.githubActions || deployment.ci.gitlabCI ? 'Configured' : 'Not configured'}\n• Environments: ${Object.keys(deployment.environment).length} configured\n\n${validation.valid ? '✅ Deployment is valid' : `⚠️ Validation issues: ${validation.issues.join(', ')}`}`
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Deployment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 6. Review Code
server.tool(
  "review_code",
  {
    code: z.string(),
    context: z.string().optional()
  },
  async (args) => {
    const { code, context } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      const systemPrompt = `You are an experienced code reviewer. Analyze the provided code for:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance issues
4. Maintainability concerns
5. Testing coverage
6. Documentation quality

Provide specific, actionable feedback with examples.`;

      const prompt = `Please review the following code${context ? ` in the context of: ${context}` : ''}:

\`\`\`
${code}
\`\`\`

Provide a comprehensive code review with:
1. Overall assessment
2. Specific issues found
3. Recommendations for improvement
4. Security considerations
5. Performance suggestions
6. Best practices recommendations`;

      const response = await llmService!.generateResponse(prompt, systemPrompt, 0.3);
      
      return {
        content: [
          {
            type: "text",
            text: `🔍 Code Review Results:\n\n${response.content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Code review failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 7. Update Documentation
server.tool(
  "update_documentation",
  {
    projectContext: ProjectContextSchema,
    documentationType: z.enum(["readme", "api", "deployment", "architecture"])
  },
  async (args) => {
    const { projectContext, documentationType } = args;
    try {
      if (!orchestrator) {
        throw new Error("Services not initialized. Please call initialize_services first.");
      }

      let documentation = '';
      
      switch (documentationType) {
        case 'readme':
          await fileSystemService!.createREADME(projectContext.name, projectContext);
          documentation = 'README.md created';
          break;
        case 'api':
          if (projectContext.architecture) {
            const techLead = new TechLeadAgent(llmService!);
            documentation = await techLead.createArchitectureDocumentation(projectContext.architecture);
          }
          break;
        case 'deployment':
          if (projectContext.deployment) {
            const devOps = new DevOpsAgent(llmService!);
            documentation = await devOps.createDeploymentDocumentation(projectContext.deployment, projectContext.name);
          }
          break;
        case 'architecture':
          if (projectContext.architecture) {
            const techLead = new TechLeadAgent(llmService!);
            documentation = await techLead.createArchitectureDocumentation(projectContext.architecture);
          }
          break;
      }
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Documentation updated!\n\nType: ${documentationType}\n\n${documentation}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Documentation update failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 8. Execute Full Project
server.tool(
  "execute_project",
  {
    prd: z.string(),
    projectName: z.string(),
    projectDescription: z.string().optional(),
    llmConfig: LLMConfigSchema
  },
  async (args) => {
    const { prd, projectName, projectDescription, llmConfig } = args;
    try {
      // Initialize services
      await initializeServices(llmConfig);
      
      // Execute the full project
      const projectContext = await orchestrator!.executeProject(
        prd,
        projectName,
        projectDescription || `Auto-generated project: ${projectName}`
      );
      
      return {
        content: [
          {
            type: "text",
            text: `🎉 Project execution completed successfully!\n\nProject: ${projectContext.name}\nStatus: ${projectContext.phase}\n\nStatistics:\n• User Stories: ${projectContext.userStories.length}\n• Features: ${projectContext.features.length}\n• Decisions: ${projectContext.decisions.length}\n\nTech Stack:\n• Frontend: ${projectContext.architecture?.techStack.frontend.join(', ')}\n• Backend: ${projectContext.architecture?.techStack.backend.join(', ')}\n• Database: ${projectContext.architecture?.techStack.database}\n\n✅ Your working prototype is ready!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Project execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 9. Get Project Status
server.tool(
  "get_project_status",
  {},
  async () => {
    try {
      if (!orchestrator) {
        throw new Error("No active project. Please execute a project first.");
      }

      const status = await orchestrator.getProjectStatus();
      const taskHistory = await orchestrator.getTaskHistory();
      
      return {
        content: [
          {
            type: "text",
            text: `📊 Project Status:\n\nCurrent Phase: ${status.currentPhase}\n\nTasks Completed: ${taskHistory.filter(t => t.status === 'completed').length}\nTasks Failed: ${taskHistory.filter(t => t.status === 'failed').length}\nTotal Tasks: ${taskHistory.length}\n\nRecent Tasks:\n${taskHistory.slice(-5).map(task => `• ${task.task} (${task.status})`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Failed to get project status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 10. Initialize Services
server.tool(
  "initialize_services",
  {
    llmConfig: LLMConfigSchema
  },
  async (args) => {
    const { llmConfig } = args;
    try {
      await initializeServices(llmConfig);
      
      return {
        content: [
          {
            type: "text",
            text: `✅ Services initialized successfully!\n\nLLM Provider: ${llmConfig.provider}\nModel: ${llmConfig.model}\n\nReady to execute projects!`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `❌ Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// MCP Prompts

// 1. Code Review Prompt
server.prompt(
  "review-code",
  { code: z.string(), context: z.string().optional() },
  ({ code, context }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please review this code${context ? ` in the context of: ${context}` : ''}:\n\n${code}\n\nProvide a comprehensive code review covering code quality, security, performance, and best practices.`,
        },
      },
    ],
  })
);

// 2. Architecture Review Prompt
server.prompt(
  "review-architecture",
  { architecture: z.string() },
  ({ architecture }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please review this system architecture:\n\n${architecture}\n\nProvide feedback on scalability, security, performance, and best practices.`,
        },
      },
    ],
  })
);

// 3. Requirements Analysis Prompt
server.prompt(
  "analyze-requirements",
  { prd: z.string() },
  ({ prd }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Please analyze this Product Requirements Document:\n\n${prd}\n\nBreak it down into user stories with acceptance criteria and provide technical recommendations.`,
        },
      },
    ],
  })
);

// MCP Resources

// 1. Project Context Resource
server.resource(
  "project-context",
  new ResourceTemplate("project-context://{projectId}", { list: undefined }),
  async (uri, { projectId }) => {
    try {
      if (!orchestrator) {
        throw new Error("No active project");
      }

      const context = await orchestrator.getProjectContext();
      if (!context || context.id !== projectId) {
        throw new Error("Project not found");
      }

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(context, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// 2. Task History Resource
server.resource(
  "task-history",
  new ResourceTemplate("task-history://{projectId}", { list: undefined }),
  async (uri, { projectId }) => {
    try {
      if (!orchestrator) {
        throw new Error("No active project");
      }

      const tasks = await orchestrator.getTaskHistory();

      return {
        contents: [
          {
            uri: uri.href,
            text: JSON.stringify(tasks, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
