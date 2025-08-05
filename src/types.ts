import { z } from "zod";

// LLM Provider Types
export const LLMProviderSchema = z.enum(["openai", "anthropic", "local"]);
export type LLMProvider = z.infer<typeof LLMProviderSchema>;

// Agent Role Types
export const AgentRoleSchema = z.enum([
  "product_manager",
  "tech_lead", 
  "developer",
  "qa_engineer",
  "devops_engineer",
  "orchestrator"
]);
export type AgentRole = z.infer<typeof AgentRoleSchema>;

// Project Phase Types
export const ProjectPhaseSchema = z.enum([
  "requirements_analysis",
  "architecture_design",
  "development",
  "testing",
  "deployment",
  "complete"
]);
export type ProjectPhase = z.infer<typeof ProjectPhaseSchema>;

// Requirement Types
export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  type: z.enum(["functional", "non_functional", "technical"]),
  acceptance_criteria: z.array(z.string()),
  dependencies: z.array(z.string()).optional(),
});

export const UserStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  as_a: z.string(),
  i_want: z.string(),
  so_that: z.string(),
  acceptance_criteria: z.array(z.string()),
  priority: z.enum(["high", "medium", "low"]),
  story_points: z.number().optional(),
  requirements: z.array(z.string()),
});

// Architecture Types
export const TechStackSchema = z.object({
  frontend: z.object({
    framework: z.string(),
    language: z.string(),
    build_tool: z.string().optional(),
    styling: z.string().optional(),
  }),
  backend: z.object({
    framework: z.string(),
    language: z.string(),
    runtime: z.string().optional(),
  }),
  database: z.object({
    type: z.string(),
    name: z.string(),
    orm: z.string().optional(),
  }),
  infrastructure: z.object({
    deployment: z.string(),
    containerization: z.string().optional(),
    ci_cd: z.string().optional(),
  }),
});

export const APISpecSchema = z.object({
  name: z.string(),
  version: z.string(),
  base_url: z.string(),
  endpoints: z.array(z.object({
    path: z.string(),
    method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
    description: z.string(),
    request_schema: z.any().optional(),
    response_schema: z.any().optional(),
  })),
});

export const DatabaseSchema = z.object({
  tables: z.array(z.object({
    name: z.string(),
    columns: z.array(z.object({
      name: z.string(),
      type: z.string(),
      constraints: z.array(z.string()).optional(),
      foreign_key: z.object({
        table: z.string(),
        column: z.string(),
      }).optional(),
    })),
  })),
});

// Code Generation Types
export const CodeFileSchema = z.object({
  path: z.string(),
  content: z.string(),
  language: z.string(),
  purpose: z.string(),
});

export const FeatureSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  user_stories: z.array(z.string()),
  files: z.array(CodeFileSchema),
  dependencies: z.array(z.string()),
});

// Testing Types
export const TestSuiteSchema = z.object({
  name: z.string(),
  type: z.enum(["unit", "integration", "e2e"]),
  files: z.array(CodeFileSchema),
  coverage_target: z.number().optional(),
});

// Deployment Types
export const DeploymentConfigSchema = z.object({
  type: z.enum(["docker", "kubernetes", "serverless", "traditional"]),
  config_files: z.array(CodeFileSchema),
  environment_variables: z.record(z.string()),
  dependencies: z.array(z.string()),
});

// Project Context Types
export const ProjectContextSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  phase: ProjectPhaseSchema,
  requirements: z.array(RequirementSchema),
  user_stories: z.array(UserStorySchema),
  tech_stack: TechStackSchema.optional(),
  api_specs: z.array(APISpecSchema).optional(),
  database_schema: DatabaseSchema.optional(),
  features: z.array(FeatureSchema).optional(),
  test_suites: z.array(TestSuiteSchema).optional(),
  deployment_config: DeploymentConfigSchema.optional(),
  decisions: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    rationale: z.string(),
    date: z.string(),
    agent: AgentRoleSchema,
  })),
  artifacts: z.array(z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    path: z.string(),
    created_by: AgentRoleSchema,
    created_at: z.string(),
  })),
});

// Agent Task Types
export const AgentTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  assigned_to: AgentRoleSchema,
  status: z.enum(["pending", "in_progress", "completed", "failed"]),
  priority: z.enum(["high", "medium", "low"]),
  dependencies: z.array(z.string()),
  result: z.any().optional(),
  created_at: z.string(),
  completed_at: z.string().optional(),
});

// MCP Tool Schemas
export const AnalyzeRequirementsSchema = z.object({
  prd_content: z.string(),
  project_name: z.string().optional(),
  project_description: z.string().optional(),
});

export const CreateArchitectureSchema = z.object({
  requirements: z.array(RequirementSchema),
  user_stories: z.array(UserStorySchema),
  project_constraints: z.record(z.string()).optional(),
});

export const ImplementFeatureSchema = z.object({
  feature_id: z.string(),
  user_stories: z.array(UserStorySchema),
  tech_stack: TechStackSchema,
  api_specs: z.array(APISpecSchema).optional(),
  database_schema: DatabaseSchema.optional(),
  project_path: z.string(),
});

export const CreateTestsSchema = z.object({
  features: z.array(FeatureSchema),
  tech_stack: TechStackSchema,
  test_types: z.array(z.enum(["unit", "integration", "e2e"])),
  project_path: z.string(),
});

export const SetupDeploymentSchema = z.object({
  tech_stack: TechStackSchema,
  deployment_type: z.enum(["docker", "kubernetes", "serverless", "traditional"]),
  project_path: z.string(),
  environment: z.enum(["development", "staging", "production"]),
});

export const ReviewCodeSchema = z.object({
  code_content: z.string(),
  language: z.string(),
  context: z.string().optional(),
  standards: z.array(z.string()).optional(),
});

export const UpdateDocumentationSchema = z.object({
  project_context: ProjectContextSchema,
  documentation_type: z.enum(["readme", "api", "setup", "architecture"]),
  project_path: z.string(),
});

// Export all schemas
export type Requirement = z.infer<typeof RequirementSchema>;
export type UserStory = z.infer<typeof UserStorySchema>;
export type TechStack = z.infer<typeof TechStackSchema>;
export type APISpec = z.infer<typeof APISpecSchema>;
export type DatabaseSchema = z.infer<typeof DatabaseSchema>;
export type CodeFile = z.infer<typeof CodeFileSchema>;
export type Feature = z.infer<typeof FeatureSchema>;
export type TestSuite = z.infer<typeof TestSuiteSchema>;
export type DeploymentConfig = z.infer<typeof DeploymentConfigSchema>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;
export type AgentTask = z.infer<typeof AgentTaskSchema>;