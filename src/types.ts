import { z } from "zod";

// Agent Roles
export enum AgentRole {
  PRODUCT_MANAGER = "product_manager",
  TECH_LEAD = "tech_lead",
  DEVELOPER = "developer",
  QA_ENGINEER = "qa_engineer",
  DEVOPS = "devops",
  ORCHESTRATOR = "orchestrator"
}

// Project Phases
export enum ProjectPhase {
  REQUIREMENTS_ANALYSIS = "requirements_analysis",
  ARCHITECTURE_DESIGN = "architecture_design",
  DEVELOPMENT = "development",
  TESTING = "testing",
  DEPLOYMENT = "deployment",
  COMPLETE = "complete"
}

// User Story Schema
export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
  storyPoints: z.number().optional(),
  dependencies: z.array(z.string()).optional()
});

export type UserStory = z.infer<typeof UserStorySchema>;

// Technical Architecture Schema
export const ArchitectureSchema = z.object({
  techStack: z.object({
    frontend: z.array(z.string()),
    backend: z.array(z.string()),
    database: z.string(),
    deployment: z.array(z.string())
  }),
  apiSpecs: z.array(z.object({
    endpoint: z.string(),
    method: z.string(),
    description: z.string(),
    requestBody: z.any().optional(),
    responseBody: z.any().optional()
  })),
  databaseSchema: z.array(z.object({
    table: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      type: z.string(),
      constraints: z.array(z.string()).optional()
    }))
  })),
  projectStructure: z.array(z.string())
});

export type Architecture = z.infer<typeof ArchitectureSchema>;

// Feature Implementation Schema
export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
    type: z.enum(["code", "config", "documentation"])
  })),
  dependencies: z.array(z.string()).optional(),
  tests: z.array(z.object({
    path: z.string(),
    content: z.string(),
    type: z.enum(["unit", "integration", "e2e"])
  })).optional()
});

export type Feature = z.infer<typeof FeatureSchema>;

// Test Plan Schema
export const TestPlanSchema = z.object({
  unitTests: z.array(z.object({
    file: z.string(),
    tests: z.array(z.object({
      name: z.string(),
      description: z.string(),
      code: z.string()
    }))
  })),
  integrationTests: z.array(z.object({
    name: z.string(),
    description: z.string(),
    code: z.string()
  })),
  e2eTests: z.array(z.object({
    name: z.string(),
    description: z.string(),
    code: z.string()
  }))
});

export type TestPlan = z.infer<typeof TestPlanSchema>;

// Deployment Configuration Schema
export const DeploymentSchema = z.object({
  docker: z.object({
    dockerfile: z.string(),
    dockerCompose: z.string().optional()
  }),
  ci: z.object({
    githubActions: z.string().optional(),
    gitlabCI: z.string().optional()
  }),
  environment: z.object({
    production: z.record(z.string()),
    staging: z.record(z.string()).optional(),
    development: z.record(z.string()).optional()
  })
});

export type Deployment = z.infer<typeof DeploymentSchema>;

// Project Context Schema
export const ProjectContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  phase: z.nativeEnum(ProjectPhase),
  userStories: z.array(UserStorySchema),
  architecture: ArchitectureSchema.optional(),
  features: z.array(FeatureSchema),
  testPlan: TestPlanSchema.optional(),
  deployment: DeploymentSchema.optional(),
  decisions: z.array(z.object({
    id: z.string(),
    decision: z.string(),
    rationale: z.string(),
    timestamp: z.string()
  })),
  artifacts: z.array(z.object({
    id: z.string(),
    type: z.string(),
    path: z.string(),
    description: z.string()
  }))
});

export type ProjectContext = z.infer<typeof ProjectContextSchema>;

// Agent Task Schema
export const AgentTaskSchema = z.object({
  id: z.string(),
  agentRole: z.nativeEnum(AgentRole),
  task: z.string(),
  input: z.any(),
  output: z.any().optional(),
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  timestamp: z.string(),
  duration: z.number().optional()
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

// LLM Provider Configuration
export const LLMConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "openrouter", "gemini", "local"]),
  apiKey: z.string().optional(),
  model: z.string(),
  baseUrl: z.string().optional(),
  temperature: z.number().default(0.7),
  maxTokens: z.number().default(4000)
});

export type LLMConfig = z.infer<typeof LLMConfigSchema>;

// MCP Tool Schemas
export const AnalyzeRequirementsSchema = z.object({
  prd: z.string(),
  projectName: z.string().optional(),
  projectDescription: z.string().optional()
});

export const CreateArchitectureSchema = z.object({
  userStories: z.array(UserStorySchema),
  projectName: z.string(),
  projectDescription: z.string()
});

export const ImplementFeatureSchema = z.object({
  feature: z.string(),
  architecture: ArchitectureSchema,
  userStories: z.array(UserStorySchema)
});

export const CreateTestsSchema = z.object({
  features: z.array(FeatureSchema),
  architecture: ArchitectureSchema
});

export const SetupDeploymentSchema = z.object({
  projectName: z.string(),
  architecture: ArchitectureSchema,
  features: z.array(FeatureSchema)
});

export const ReviewCodeSchema = z.object({
  code: z.string(),
  context: z.string().optional()
});

export const UpdateDocumentationSchema = z.object({
  projectContext: ProjectContextSchema,
  documentationType: z.enum(["readme", "api", "deployment", "architecture"])
});