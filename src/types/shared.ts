export interface ProjectRequirement {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'functional' | 'non-functional' | 'technical';
  acceptanceCriteria: string[];
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  estimatedEffort: number;
  priority: 'high' | 'medium' | 'low';
  dependencies: string[];
}

export interface TechStackDecision {
  category: 'frontend' | 'backend' | 'database' | 'deployment' | 'testing';
  technology: string;
  reasoning: string;
  alternatives: string[];
}

export interface ArchitectureDesign {
  overview: string;
  components: ComponentSpec[];
  dataFlow: string;
  apiSpecs: APISpec[];
  databaseSchema: DatabaseSchema[];
  techStack: TechStackDecision[];
}

export interface ComponentSpec {
  name: string;
  type: 'frontend' | 'backend' | 'service' | 'utility';
  description: string;
  dependencies: string[];
  interfaces: string[];
}

export interface APISpec {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  requestSchema: object;
  responseSchema: object;
  authentication: boolean;
}

export interface DatabaseSchema {
  tableName: string;
  columns: ColumnSpec[];
  indexes: string[];
  relationships: RelationshipSpec[];
}

export interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: any;
}

export interface RelationshipSpec {
  type: 'oneToOne' | 'oneToMany' | 'manyToMany';
  targetTable: string;
  foreignKey: string;
}

export interface FeatureImplementation {
  featureId: string;
  files: GeneratedFile[];
  dependencies: string[];
  testFiles: GeneratedFile[];
  documentation: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'config' | 'test' | 'documentation';
}

export interface TestSuite {
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  framework: string;
  files: GeneratedFile[];
  coverage: string[];
}

export interface DeploymentConfig {
  platform: 'docker' | 'kubernetes' | 'serverless' | 'traditional';
  configurations: GeneratedFile[];
  cicdPipeline: GeneratedFile[];
  environment: 'development' | 'staging' | 'production';
}

export interface ProjectState {
  requirements: ProjectRequirement[];
  userStories: UserStory[];
  architecture: ArchitectureDesign | null;
  implementations: FeatureImplementation[];
  tests: TestSuite[];
  deployment: DeploymentConfig | null;
  currentPhase: 'analysis' | 'architecture' | 'implementation' | 'testing' | 'deployment';
  decisions: Record<string, any>;
}

export interface AgentContext {
  projectState: ProjectState;
  llmProvider?: 'openai' | 'anthropic' | 'local';
  outputDirectory: string;
  gitRepository?: string;
}

export interface AgentResponse {
  success: boolean;
  message: string;
  data?: any;
  nextPhase?: string;
  updatedState?: Partial<ProjectState>;
}