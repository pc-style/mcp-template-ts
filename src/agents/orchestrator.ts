import { BaseAgent } from './base-agent.js';
import { ProductManager } from './product-manager.js';
import { TechLead } from './tech-lead.js';
import { Developer } from './developer.js';
import { QAEngineer } from './qa-engineer.js';
import { DevOps } from './devops.js';
import { AgentContext, AgentResponse, ProjectState } from '../types/shared.js';
import { FileOperations } from '../utils/file-operations.js';

export class Orchestrator extends BaseAgent {
  private productManager: ProductManager;
  private techLead: TechLead;
  private developer: Developer;
  private qaEngineer: QAEngineer;
  private devOps: DevOps;

  constructor(context: AgentContext) {
    super(context, 'Orchestrator', 'Workflow Coordination and Project Management');
    
    // Initialize all agent team members
    this.productManager = new ProductManager(context);
    this.techLead = new TechLead(context);
    this.developer = new Developer(context);
    this.qaEngineer = new QAEngineer(context);
    this.devOps = new DevOps(context);
  }

  async execute(input: { prd: string; projectName?: string; outputPath?: string }): Promise<AgentResponse> {
    this.log('Starting autonomous development workflow...');

    try {
      // Initialize project state
      this.initializeProject(input.projectName || 'Generated Project');
      
      // Ensure output directory exists
      if (input.outputPath) {
        this.context.outputDirectory = input.outputPath;
      }
      await FileOperations.ensureDirectory(this.context.outputDirectory);
      await FileOperations.createProjectStructure(this.context.outputDirectory);

      // Execute the complete development workflow
      const workflowResult = await this.executeWorkflow(input.prd);

      if (workflowResult.success) {
        // Generate final project summary
        const summary = this.generateProjectSummary();
        
        this.log('Autonomous development workflow completed successfully!');
        return this.createResponse(
          true,
          'Complete prototype generated successfully',
          summary,
          undefined,
          this.context.projectState
        );
      } else {
        return workflowResult;
      }
    } catch (error) {
      this.log(`Error in orchestrator workflow: ${error.message}`);
      return this.createResponse(
        false,
        `Workflow execution failed: ${error.message}`
      );
    }
  }

  private initializeProject(projectName: string): void {
    this.context.projectState = {
      requirements: [],
      userStories: [],
      architecture: null,
      implementations: [],
      tests: [],
      deployment: null,
      currentPhase: 'analysis',
      decisions: {
        projectName,
        startTime: new Date().toISOString()
      }
    };
  }

  private async executeWorkflow(prd: string): Promise<AgentResponse> {
    this.log('=== Phase 1: Requirements Analysis ===');
    const analysisResult = await this.productManager.execute({ prd });
    
    if (!analysisResult.success) {
      return this.createResponse(false, `Requirements analysis failed: ${analysisResult.message}`);
    }
    
    this.log(`✓ Requirements analysis completed: ${analysisResult.message}`);
    this.updateContextFromResponse(analysisResult);

    // Validation gate: Check if we have sufficient requirements
    if (!this.validateRequirements()) {
      return this.createResponse(false, 'Insufficient requirements for architecture phase');
    }

    this.log('=== Phase 2: Architecture Design ===');
    const architectureResult = await this.techLead.execute({});
    
    if (!architectureResult.success) {
      return this.createResponse(false, `Architecture design failed: ${architectureResult.message}`);
    }
    
    this.log(`✓ Architecture design completed: ${architectureResult.message}`);
    this.updateContextFromResponse(architectureResult);

    // Validation gate: Check if we have valid architecture
    if (!this.validateArchitecture()) {
      return this.createResponse(false, 'Invalid architecture design for implementation phase');
    }

    this.log('=== Phase 3: Feature Implementation ===');
    const implementationResults = await this.implementAllFeatures();
    
    if (!implementationResults.success) {
      return implementationResults;
    }

    this.log('=== Phase 4: Test Suite Creation ===');
    const testResult = await this.qaEngineer.execute({});
    
    if (!testResult.success) {
      return this.createResponse(false, `Test creation failed: ${testResult.message}`);
    }
    
    this.log(`✓ Test suite creation completed: ${testResult.message}`);
    this.updateContextFromResponse(testResult);

    this.log('=== Phase 5: Deployment Configuration ===');
    const deploymentResult = await this.devOps.execute({});
    
    if (!deploymentResult.success) {
      return this.createResponse(false, `Deployment setup failed: ${deploymentResult.message}`);
    }
    
    this.log(`✓ Deployment configuration completed: ${deploymentResult.message}`);
    this.updateContextFromResponse(deploymentResult);

    // Generate final project files
    await this.generateProjectFiles();

    return this.createResponse(true, 'All workflow phases completed successfully');
  }

  private validateRequirements(): boolean {
    const { requirements, userStories } = this.context.projectState;
    return requirements.length > 0 && userStories.length > 0;
  }

  private validateArchitecture(): boolean {
    const { architecture } = this.context.projectState;
    return architecture !== null && 
           architecture.components.length > 0 && 
           architecture.techStack.length > 0;
  }

  private async implementAllFeatures(): Promise<AgentResponse> {
    const { userStories } = this.context.projectState;
    
    // Group user stories by dependencies to implement in correct order
    const implementationOrder = this.determineImplementationOrder(userStories);
    
    for (const storyGroup of implementationOrder) {
      for (const story of storyGroup) {
        this.log(`Implementing feature: ${story.title}`);
        
        const implementationResult = await this.developer.execute({
          featureId: story.id,
          userStoryId: story.id
        });
        
        if (!implementationResult.success) {
          return this.createResponse(
            false, 
            `Feature implementation failed for ${story.title}: ${implementationResult.message}`
          );
        }
        
        this.updateContextFromResponse(implementationResult);
        this.log(`✓ Feature implemented: ${story.title}`);
      }
    }

    return this.createResponse(true, 'All features implemented successfully');
  }

  private determineImplementationOrder(userStories: any[]): any[][] {
    // Simple dependency resolution - in practice this would be more sophisticated
    const implemented = new Set<string>();
    const remaining = new Map(userStories.map(story => [story.id, story]));
    const order: any[][] = [];

    while (remaining.size > 0) {
      const currentBatch: any[] = [];
      
      for (const [storyId, story] of remaining) {
        // Check if all dependencies are implemented
        const canImplement = story.dependencies.every((depId: string) => implemented.has(depId));
        
        if (canImplement) {
          currentBatch.push(story);
        }
      }

      // If no stories can be implemented, break circular dependencies
      if (currentBatch.length === 0 && remaining.size > 0) {
        // Add stories with no dependencies or circular dependencies
        const nextStory = Array.from(remaining.values())[0];
        currentBatch.push(nextStory);
      }

      // Mark stories as implemented and remove from remaining
      for (const story of currentBatch) {
        implemented.add(story.id);
        remaining.delete(story.id);
      }

      if (currentBatch.length > 0) {
        order.push(currentBatch);
      }
    }

    return order;
  }

  private updateContextFromResponse(response: AgentResponse): void {
    if (response.updatedState) {
      this.updateProjectState(response.updatedState);
    }
  }

  private async generateProjectFiles(): Promise<void> {
    // Generate package.json
    await this.generatePackageJson();
    
    // Generate README.md
    await this.generateReadme();
    
    // Generate environment files
    await this.generateEnvironmentFiles();
    
    // Generate TypeScript configuration
    await this.generateTsConfig();
    
    this.log('✓ Project configuration files generated');
  }

  private async generatePackageJson(): Promise<void> {
    const { architecture } = this.context.projectState;
    const projectName = this.context.projectState.decisions.projectName;
    
    // Extract dependencies from implementations
    const allDependencies = this.context.projectState.implementations
      .flatMap(impl => impl.dependencies)
      .filter((dep, index, arr) => arr.indexOf(dep) === index);

    const packageJson = {
      name: projectName.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: 'Generated project prototype',
      main: 'dist/index.js',
      type: 'module',
      scripts: {
        build: 'tsc',
        start: 'node dist/index.js',
        dev: 'tsc --watch & node --watch dist/index.js',
        test: 'jest',
        'test:unit': 'jest tests/unit',
        'test:integration': 'jest tests/integration',
        'test:e2e': 'playwright test',
        lint: 'eslint src --ext .ts',
        'lint:fix': 'eslint src --ext .ts --fix',
        'type-check': 'tsc --noEmit'
      },
      dependencies: {
        ...this.getDependencyVersions(allDependencies)
      },
      devDependencies: {
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        'typescript': '^5.0.0',
        '@playwright/test': '^1.40.0',
        'supertest': '^6.3.0',
        '@types/supertest': '^2.0.0'
      }
    };

    await FileOperations.writeFile(
      `${this.context.outputDirectory}/package.json`,
      JSON.stringify(packageJson, null, 2)
    );
  }

  private getDependencyVersions(dependencies: string[]): Record<string, string> {
    const versions: Record<string, string> = {
      'express': '^4.18.0',
      'bcrypt': '^5.1.0',
      'jsonwebtoken': '^9.0.0',
      'zod': '^3.22.0',
      'cors': '^2.8.5',
      'helmet': '^7.0.0',
      'dotenv': '^16.0.0',
      'pg': '^8.11.0',
      'redis': '^4.6.0',
      'winston': '^3.10.0'
    };

    const result: Record<string, string> = {};
    for (const dep of dependencies) {
      if (versions[dep]) {
        result[dep] = versions[dep];
      } else {
        result[dep] = '^1.0.0'; // Default version
      }
    }

    return result;
  }

  private async generateReadme(): Promise<void> {
    const { architecture, requirements, userStories } = this.context.projectState;
    const projectName = this.context.projectState.decisions.projectName;

    const readme = `# ${projectName}

## Overview

This project was generated by an autonomous development team. It implements a ${architecture?.overview || 'modern web application'}.

## Features

${requirements.map(req => `- **${req.title}**: ${req.description}`).join('\n')}

## Tech Stack

${architecture?.techStack.map(tech => `- **${tech.category}**: ${tech.technology} - ${tech.reasoning}`).join('\n') || 'Modern web technologies'}

## Quick Start

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (for production)

### Development Setup

1. Clone the repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your configuration
   \`\`\`

4. Start the development environment:
   \`\`\`bash
   docker-compose up -d
   npm run dev
   \`\`\`

### Running Tests

\`\`\`bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
\`\`\`

### Building for Production

\`\`\`bash
npm run build
npm start
\`\`\`

## API Documentation

${architecture?.apiSpecs.map(api => `### ${api.method} ${api.endpoint}\n${api.description}\n`).join('\n') || 'API documentation will be available after implementation.'}

## Project Structure

\`\`\`
src/
├── components/     # Frontend components
├── pages/         # Page components
├── services/      # Business logic services
├── controllers/   # API controllers
├── repositories/  # Data access layer
├── types/         # TypeScript type definitions
└── utils/         # Utility functions

tests/
├── unit/          # Unit tests
├── integration/   # Integration tests
└── e2e/           # End-to-end tests

config/            # Configuration files
docs/              # Documentation
scripts/           # Build and deployment scripts
\`\`\`

## User Stories

${userStories.map(story => `### ${story.title}\n${story.description}\n\n**Acceptance Criteria:**\n${story.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}\n`).join('\n')}

## Deployment

This project includes Docker configuration and CI/CD pipelines for easy deployment:

- **Development**: \`docker-compose up\`
- **Production**: See \`k8s/\` directory for Kubernetes manifests
- **CI/CD**: GitHub Actions workflow in \`.github/workflows/\`

## Contributing

This project follows standard development practices:

1. Create feature branches from \`develop\`
2. Write tests for new functionality
3. Ensure all tests pass and linting is clean
4. Submit pull requests for review

## License

Generated project - see individual component licenses for details.
`;

    await FileOperations.writeFile(
      `${this.context.outputDirectory}/README.md`,
      readme
    );
  }

  private async generateEnvironmentFiles(): Promise<void> {
    const envExample = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/app_dev

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-here

# Redis (for sessions/caching)
REDIS_URL=redis://localhost:6379

# Server Configuration
PORT=3000
NODE_ENV=development

# External APIs (add as needed)
# API_KEY=your-api-key-here

# Logging
LOG_LEVEL=info
`;

    await FileOperations.writeFile(
      `${this.context.outputDirectory}/.env.example`,
      envExample
    );
  }

  private async generateTsConfig(): Promise<void> {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'Node16',
        moduleResolution: 'Node16',
        lib: ['ES2022'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        sourceMap: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist', 'tests']
    };

    await FileOperations.writeFile(
      `${this.context.outputDirectory}/tsconfig.json`,
      JSON.stringify(tsConfig, null, 2)
    );
  }

  private generateProjectSummary(): any {
    const { requirements, userStories, architecture, implementations, tests, deployment } = this.context.projectState;
    
    return {
      projectName: this.context.projectState.decisions.projectName,
      generatedAt: new Date().toISOString(),
      statistics: {
        requirements: requirements.length,
        userStories: userStories.length,
        components: architecture?.components.length || 0,
        apiEndpoints: architecture?.apiSpecs.length || 0,
        implementations: implementations.length,
        sourceFiles: implementations.reduce((acc, impl) => acc + impl.files.length, 0),
        testSuites: tests.length,
        testFiles: tests.reduce((acc, suite) => acc + suite.files.length, 0),
        deploymentConfigs: deployment?.configurations.length || 0
      },
      techStack: architecture?.techStack.map(tech => ({
        category: tech.category,
        technology: tech.technology
      })) || [],
      features: userStories.map(story => ({
        id: story.id,
        title: story.title,
        priority: story.priority,
        estimatedEffort: story.estimatedEffort
      })),
      deployment: {
        platform: deployment?.platform || 'not configured',
        environment: deployment?.environment || 'not configured'
      },
      outputDirectory: this.context.outputDirectory
    };
  }
}