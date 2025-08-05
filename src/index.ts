#!/usr/bin/env node

import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OrchestratorAgent } from "./agents/orchestrator.js";
import { ProductManagerAgent } from "./agents/product-manager.js";
import { TechLeadAgent } from "./agents/tech-lead.js";
import { DeveloperAgent } from "./agents/developer.js";
import { QAEngineerAgent } from "./agents/qa-engineer.js";
import { DevOpsEngineerAgent } from "./agents/devops-engineer.js";
import { 
  AnalyzeRequirementsSchema,
  CreateArchitectureSchema,
  ImplementFeatureSchema,
  CreateTestsSchema,
  SetupDeploymentSchema,
  ReviewCodeSchema,
  UpdateDocumentationSchema,
  ProjectContextSchema
} from "./types.js";
import { Logger } from "./utils/logger.js";
import { config } from "./config.js";

// Create an MCP server
const server = new McpServer({
  name: "MCP Autonomous Development Team",
  version: "1.0.0",
});

const logger = new Logger('MCP-Server');

// Initialize project context
let currentProjectContext: any = null;

// MCP Tools Implementation

// 1. Analyze Requirements Tool
server.tool(
  "analyze_requirements",
  "Analyze a Product Requirements Document (PRD) and extract structured requirements",
  AnalyzeRequirementsSchema.shape,
  async (args, extra) => {
    const { prd_content, project_name, project_description } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: project_name || 'New Project',
      description: project_description || 'Project from PRD analysis',
      phase: 'requirements_analysis',
      requirements: [],
      user_stories: [],
      decisions: [],
      artifacts: [],
    };

    const pmAgent = new ProductManagerAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Analyze PRD Requirements',
      description: 'Extract and structure requirements from PRD',
      assigned_to: 'product_manager',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { prd_content, project_name, project_description },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await pmAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully analyzed PRD and extracted ${result.requirements?.length || 0} requirements.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error analyzing PRD: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 2. Create Architecture Tool
server.tool(
  "create_architecture",
  "Create system architecture and technical specifications based on requirements",
  CreateArchitectureSchema.shape,
  async (args, extra) => {
    const { requirements, user_stories, project_constraints } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Architecture Design Project',
      description: 'Creating system architecture',
      phase: 'architecture_design',
      requirements: requirements || [],
      user_stories: user_stories || [],
      decisions: [],
      artifacts: [],
    };

    const tlAgent = new TechLeadAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Create System Architecture',
      description: 'Design system architecture and technical specifications',
      assigned_to: 'tech_lead',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { project_constraints },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await tlAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully created system architecture with ${result.tech_stack ? 'defined tech stack' : 'basic structure'}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating architecture: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 3. Implement Feature Tool
server.tool(
  "implement_feature",
  "Implement a specific feature based on user stories and technical specifications",
  ImplementFeatureSchema.shape,
  async (args, extra) => {
    const { feature_id, user_stories, tech_stack, api_specs, database_schema, project_path } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Feature Implementation',
      description: 'Implementing specific feature',
      phase: 'development',
      requirements: [],
      user_stories: user_stories || [],
      tech_stack: tech_stack,
      api_specs: api_specs,
      database_schema: database_schema,
      decisions: [],
      artifacts: [],
    };

    const devAgent = new DeveloperAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: `Implement Feature: ${feature_id}`,
      description: 'Implement feature based on specifications',
      assigned_to: 'developer',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { feature_id, user_stories, tech_stack, api_specs, database_schema, project_path },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await devAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully implemented feature ${feature_id} with ${result.code_files?.length || 0} code files.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error implementing feature: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 4. Create Tests Tool
server.tool(
  "create_tests",
  "Create comprehensive test suites for implemented features",
  CreateTestsSchema.shape,
  async (args, extra) => {
    const { features, tech_stack, test_types, project_path } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Test Creation',
      description: 'Creating test suites',
      phase: 'testing',
      requirements: [],
      user_stories: [],
      features: features || [],
      tech_stack: tech_stack,
      decisions: [],
      artifacts: [],
    };

    const qaAgent = new QAEngineerAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Create Test Suites',
      description: 'Create comprehensive test coverage',
      assigned_to: 'qa_engineer',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { features, tech_stack, test_types, project_path },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await qaAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully created test suites with ${result.test_suites?.length || 0} test suites.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error creating tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 5. Setup Deployment Tool
server.tool(
  "setup_deployment",
  "Set up deployment configuration and infrastructure",
  SetupDeploymentSchema.shape,
  async (args, extra) => {
    const { tech_stack, deployment_type, project_path, environment } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Deployment Setup',
      description: 'Setting up deployment infrastructure',
      phase: 'deployment',
      requirements: [],
      user_stories: [],
      tech_stack: tech_stack,
      decisions: [],
      artifacts: [],
    };

    const devopsAgent = new DevOpsEngineerAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Setup Deployment',
      description: 'Configure deployment infrastructure',
      assigned_to: 'devops_engineer',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { tech_stack, deployment_type, project_path, environment },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await devopsAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully set up deployment configuration for ${deployment_type || 'default'} environment.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error setting up deployment: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 6. Review Code Tool
server.tool(
  "review_code",
  "Review code for quality, best practices, and potential improvements",
  ReviewCodeSchema.shape,
  async (args, extra) => {
    const { code_content, language, context, standards } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Code Review',
      description: 'Reviewing code quality',
      phase: 'development',
      requirements: [],
      user_stories: [],
      decisions: [],
      artifacts: [],
    };

    const devAgent = new DeveloperAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Code Review',
      description: 'Review code for quality and best practices',
      assigned_to: 'developer',
      status: 'pending' as const,
      priority: 'medium' as const,
      dependencies: [],
      result: { code_content, language, context, standards },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await devAgent.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Code review completed. Found ${result.issues?.length || 0} issues to address.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error during code review: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 7. Update Documentation Tool
server.tool(
  "update_documentation",
  "Update project documentation based on current project context",
  UpdateDocumentationSchema.shape,
  async (args, extra) => {
    const { project_context, documentation_type, project_path } = args;
    
    const orchestrator = new OrchestratorAgent(project_context);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Update Documentation',
      description: 'Update project documentation',
      assigned_to: 'orchestrator',
      status: 'pending' as const,
      priority: 'medium' as const,
      dependencies: [],
      result: { project_context, documentation_type, project_path },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await orchestrator.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Successfully updated ${documentation_type || 'project'} documentation.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error updating documentation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 8. Orchestrate Complete Project Tool
server.tool(
  "orchestrate_project",
  "Orchestrate the complete project workflow from PRD to prototype",
  {
    prd_content: z.string(),
    project_name: z.string().optional(),
    project_description: z.string().optional(),
  },
  async (args, extra) => {
    const { prd_content, project_name, project_description } = args;
    
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: project_name || 'Autonomous Project',
      description: project_description || 'Project orchestrated by autonomous team',
      phase: 'requirements_analysis' as const,
      requirements: [],
      user_stories: [],
      decisions: [],
      artifacts: [],
    };

    const orchestrator = new OrchestratorAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Orchestrate Complete Project',
      description: 'Execute full project workflow from PRD to prototype',
      assigned_to: 'orchestrator',
      status: 'pending' as const,
      priority: 'high' as const,
      dependencies: [],
      result: { prd_content, project_name, project_description },
      created_at: new Date().toISOString(),
    };

    try {
      const result = await orchestrator.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Project orchestration completed successfully. Project is now in ${result.phase || 'complete'} phase.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error during project orchestration: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// 9. Get Project Status Tool
server.tool(
  "get_project_status",
  "Get the current status and progress of a project",
  {},
  async (args, extra) => {
    const projectContext: any = {
      id: `project_${Date.now()}`,
      name: 'Status Check Project',
      description: 'Checking project status',
      phase: 'complete' as const,
      requirements: [],
      user_stories: [],
      decisions: [],
      artifacts: [],
    };

    const orchestrator = new OrchestratorAgent(projectContext);
    const task: any = {
      id: `task_${Date.now()}`,
      title: 'Get Project Status',
      description: 'Retrieve current project status and progress',
      assigned_to: 'orchestrator',
      status: 'pending' as const,
      priority: 'low' as const,
      dependencies: [],
      result: {},
      created_at: new Date().toISOString(),
    };

    try {
      const result = await orchestrator.execute(task);
      return {
        content: [
          {
            type: "text",
            text: `Project Status: ${result.phase || 'unknown'}. Progress: ${result.progress || '0'}% complete.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting project status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// MCP Resources

// Project Context Resource
server.resource(
  "project_context",
  new ResourceTemplate("project://{project_id}", { list: undefined }),
  async (uri, { project_id }) => {
    if (!currentProjectContext || currentProjectContext.id !== project_id) {
      return {
        contents: [
          {
            uri: uri.href,
            text: "Project not found or not initialized",
          },
        ],
      };
    }

    return {
      contents: [
        {
          uri: uri.href,
          text: JSON.stringify(currentProjectContext, null, 2),
        },
      ],
    };
  }
);

// Project Documentation Resource
server.resource(
  "project_docs",
  new ResourceTemplate("docs://{project_id}/{doc_type}", { list: undefined }),
  async (uri, { project_id, doc_type }) => {
    if (!currentProjectContext || currentProjectContext.id !== project_id) {
      return {
        contents: [
          {
            uri: uri.href,
            text: "Project not found or not initialized",
          },
        ],
      };
    }

    // This would return actual documentation files
    const docContent = `# ${doc_type} Documentation

Project: ${currentProjectContext.name}
Document Type: ${doc_type}
Generated: ${new Date().toISOString()}

This is auto-generated documentation for the ${currentProjectContext.name} project.
`;

    return {
      contents: [
        {
          uri: uri.href,
          text: docContent,
        },
      ],
    };
  }
);

// MCP Prompts

// Code Review Prompt
server.prompt(
  "review-code",
  { code: z.string(), language: z.string().optional() },
  ({ code, language }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please review this " + (language || 'code') + " for quality, best practices, and potential improvements.",
        },
      },
    ],
  })
);

// Architecture Review Prompt
server.prompt(
  "review-architecture",
  { architecture: z.string() },
  ({ architecture }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please review this system architecture for completeness, scalability, and best practices.",
        },
      },
    ],
  })
);

// Requirements Validation Prompt
server.prompt(
  "validate-requirements",
  { requirements: z.string() },
  ({ requirements }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Please validate these requirements for completeness, clarity, and feasibility.",
        },
      },
    ],
  })
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

logger.info('MCP Autonomous Development Team Server starting...', {
  version: '1.0.0',
  features: [
    'Requirements Analysis',
    'Architecture Design', 
    'Feature Implementation',
    'Test Creation',
    'Deployment Setup',
    'Code Review',
    'Documentation',
    'Complete Project Orchestration'
  ]
});

await server.connect(transport);
