import { BaseAgent } from './base-agent.js';
import { AgentTask, Feature, CodeFile, FeatureSchema, CodeFileSchema } from '../types.js';
import { FileSystemService } from '../services/filesystem.js';
import { GitService } from '../services/git.js';
import path from 'path';
import { config } from '../config.js';

export class DeveloperAgent extends BaseAgent {
  private fs: FileSystemService;
  private git: GitService;

  constructor(context: any) {
    super('developer', context);
    this.fs = new FileSystemService();
    this.git = new GitService();
  }

  protected getRoleResponsibilities(): string {
    return `- Implement features based on user stories and technical specifications
- Write clean, maintainable, and production-ready code
- Follow coding standards and best practices
- Implement proper error handling and validation
- Write unit tests for all code
- Ensure code security and performance
- Collaborate with other team members
- Maintain code documentation and comments`;
  }

  async execute(task: AgentTask): Promise<any> {
    this.logTaskStart(task);

    try {
      switch (task.title.toLowerCase()) {
        case 'implement_feature':
          return await this.implementFeature(task);
        case 'create_project_structure':
          return await this.createProjectStructure(task);
        case 'generate_code':
          return await this.generateCode(task);
        case 'write_tests':
          return await this.writeTests(task);
        case 'code_review':
          return await this.codeReview(task);
        case 'refactor_code':
          return await this.refactorCode(task);
        default:
          throw new Error(`Unknown task: ${task.title}`);
      }
    } catch (error) {
      this.logTaskError(task, error as Error);
      throw error;
    }
  }

  private async implementFeature(task: AgentTask): Promise<{ feature: Feature }> {
    const userStories = this.context.user_stories;
    const techStack = this.context.tech_stack;
    const apiSpecs = this.context.api_specs;
    const databaseSchema = this.context.database_schema;
    const projectPath = task.result?.project_path || `${this.context.id}/src`;

    if (!userStories || userStories.length === 0) {
      throw new Error('User stories must be available before implementing features');
    }

    if (!techStack) {
      throw new Error('Technology stack must be defined before implementing features');
    }

    const prompt = `Implement the following feature based on the provided specifications:

User Stories:
${JSON.stringify(userStories, null, 2)}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

API Specifications:
${JSON.stringify(apiSpecs, null, 2)}

Database Schema:
${JSON.stringify(databaseSchema, null, 2)}

Create a complete feature implementation that includes:
1. All necessary source code files
2. Proper project structure
3. Configuration files
4. Dependencies and package files
5. Unit tests
6. Documentation

Focus on:
- Clean, maintainable code following best practices
- Proper error handling and validation
- Security considerations
- Performance optimization
- Comprehensive test coverage
- Clear documentation and comments

Generate all necessary files with their complete content.`;

    const feature = await this.generateStructuredResponse<Feature>(
      prompt,
      FeatureSchema,
      {
        id: 'feature_001',
        name: 'User Authentication',
        description: 'Complete user authentication system with registration and login',
        user_stories: ['us_001', 'us_002'],
        files: [
          {
            path: 'src/auth/auth.controller.ts',
            content: '// Authentication controller implementation',
            language: 'typescript',
            purpose: 'Handles authentication endpoints'
          }
        ],
        dependencies: []
      }
    );

    // Create the actual files
    await this.createFeatureFiles(feature, projectPath);

    this.updateContext({ 
      features: [...(this.context.features || []), feature] 
    });

    this.addDecision(
      'Feature Implementation Complete',
      `Implemented feature: ${feature.name}`,
      'Feature has been implemented with proper code structure and tests'
    );

    // Commit changes if git is enabled
    if (config.git.enabled) {
      await this.git.commitChanges(`feat: implement ${feature.name}`);
    }

    this.logTaskComplete(task, { feature });
    return { feature };
  }

  private async createProjectStructure(task: AgentTask): Promise<{ project_structure: string }> {
    this.logTaskStart(task);

    const prompt = `
      Create a project structure for a web application based on the following context:
      
      Project Context:
      ${JSON.stringify(this.context, null, 2)}
      
      Task: ${task.title}
      Description: ${task.description}
      
      Generate a comprehensive project structure that includes:
      1. Source code directories
      2. Configuration files
      3. Documentation directories
      4. Test directories
      5. Build and deployment files
      
      Return a detailed project structure with explanations for each directory and file.
    `;

    const projectStructure = await this.generateResponse(prompt);
    
    this.logTaskComplete(task, { project_structure: projectStructure });
    return { project_structure: projectStructure };
  }

  private async generateCode(task: AgentTask): Promise<{ code_files: CodeFile[] }> {
    this.logTaskStart(task);

    const prompt = `
      Generate code for the following feature based on the project context:
      
      Project Context:
      ${JSON.stringify(this.context, null, 2)}
      
      Task: ${task.title}
      Description: ${task.description}
      
      Generate clean, production-ready code that follows best practices.
      Include proper error handling, documentation, and tests.
    `;

    const codeContent = await this.generateResponse(prompt);
    
    // Parse the generated code and create file objects
    const codeFiles: CodeFile[] = [
      {
        path: 'src/main.ts',
        content: codeContent,
        language: 'typescript',
        purpose: 'source'
      }
    ];

    // Write files to filesystem
    for (const file of codeFiles) {
      await this.fs.ensureDirectory(file.path.split('/').slice(0, -1).join('/'));
      await this.fs.writeFile(file.path, file.content);
    }

    // Commit changes if git is enabled
    if (config.git.enabled) {
      await this.git.commitChanges(`feat: implement ${task.title}`);
    }

    this.logTaskComplete(task, { code_files: codeFiles });
    return { code_files: codeFiles };
  }

  private async writeTests(task: AgentTask): Promise<{ test_files: CodeFile[] }> {
    const featureId = task.result?.feature_id;
    const techStack = this.context.tech_stack;

    if (!featureId) {
      throw new Error('Feature ID is required for test generation');
    }

    const feature = this.context.features?.find((f: Feature) => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature not found: ${featureId}`);
    }

    const prompt = `Generate comprehensive tests for the following feature:

Feature: ${feature.name}
Description: ${feature.description}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Generate tests that include:
1. Unit tests for all functions and methods
2. Integration tests for API endpoints
3. Test utilities and mocks
4. Test configuration files
5. Coverage reporting setup

Focus on:
- High test coverage (aim for 80%+)
- Meaningful test cases
- Proper mocking and isolation
- Clear test descriptions
- Edge case coverage
- Performance testing where appropriate`;

    const testFiles = await this.generateStructuredResponse<CodeFile[]>(
      prompt,
      CodeFileSchema.array(),
      [
        {
          path: 'tests/features/auth/auth.service.test.ts',
          content: '// Authentication service tests',
          language: 'typescript',
          purpose: 'Unit tests for authentication service'
        }
      ]
    );

    // Write the actual test files
    for (const file of testFiles) {
      await this.fs.writeFile(file.path, file.content);
      this.addArtifact(`Test File: ${file.path}`, file.language, file.path);
    }

    this.logTaskComplete(task, { test_files: testFiles.length });
    return { test_files: testFiles };
  }

  private async codeReview(task: AgentTask): Promise<{ review_results: any }> {
    const codeContent = task.result?.code_content;
    const language = task.result?.language || 'typescript';

    if (!codeContent) {
      throw new Error('Code content is required for code review');
    }

    const prompt = `Perform a comprehensive code review for the following ${language} code:

\`\`\`${language}
${codeContent}
\`\`\`

Review the code for:
1. Code quality and readability
2. Best practices and patterns
3. Security vulnerabilities
4. Performance issues
5. Error handling
6. Documentation and comments
7. Test coverage
8. Maintainability
9. Scalability
10. Compliance with coding standards

Provide specific recommendations for improvements.`;

    const reviewResults = await this.generateResponse(prompt);

    this.addDecision(
      'Code Review Complete',
      'Code has been reviewed for quality and best practices',
      'Code review ensures high-quality, maintainable code'
    );

    this.logTaskComplete(task, { review_results: reviewResults });
    return { review_results: reviewResults };
  }

  private async refactorCode(task: AgentTask): Promise<{ refactored_code: string }> {
    const codeContent = task.result?.code_content;
    const language = task.result?.language || 'typescript';
    const issues = task.result?.issues || [];

    if (!codeContent) {
      throw new Error('Code content is required for refactoring');
    }

    const prompt = `Refactor the following ${language} code to address the identified issues and improve overall quality:

Original Code:
\`\`\`${language}
${codeContent}
\`\`\`

Issues to Address:
${issues.map((issue: string) => `- ${issue}`).join('\n')}

Refactor the code to:
1. Improve readability and maintainability
2. Follow best practices and design patterns
3. Enhance performance and efficiency
4. Improve error handling
5. Add proper documentation
6. Ensure security best practices
7. Optimize for scalability

Provide the refactored code with explanations of the improvements made.`;

    const refactoredCode = await this.generateResponse(prompt);

    this.addDecision(
      'Code Refactoring Complete',
      'Code has been refactored to improve quality and maintainability',
      'Refactoring enhances code quality and reduces technical debt'
    );

    this.logTaskComplete(task, { refactored_code: refactoredCode });
    return { refactored_code: refactoredCode };
  }

  private async createFeatureFiles(feature: Feature, projectPath: string): Promise<void> {
    for (const file of feature.files) {
      const fullPath = path.join(projectPath, file.path);
      await this.fs.writeFile(fullPath, file.content);
      this.addArtifact(`Feature File: ${file.path}`, file.language, fullPath);
    }
  }

  private async createActualProjectStructure(techStack: any, projectPath: string): Promise<void> {
    const structure = this.getProjectStructure(techStack);
    await this.fs.createProjectStructure(projectPath, structure);
  }

  private getProjectStructure(techStack: any): any {
    const isReact = techStack.frontend.framework.toLowerCase().includes('react');
    const isNode = techStack.backend.framework.toLowerCase().includes('express') || 
                   techStack.backend.framework.toLowerCase().includes('node');

    const structure: any = {
      'package.json': this.generatePackageJson(techStack),
      'README.md': this.generateReadme(techStack),
      '.gitignore': this.generateGitignore(techStack),
      'src': {
        'index.ts': '// Main application entry point',
        'config': {
          'index.ts': '// Application configuration',
        },
        'utils': {
          'index.ts': '// Utility functions',
        },
      },
      'tests': {
        'setup.ts': '// Test setup and configuration',
      },
      'docs': {
        'README.md': '// Project documentation',
      },
    };

    if (isReact) {
      structure.src.components = {
        'index.ts': '// React components',
      };
      structure.src.pages = {
        'index.ts': '// Page components',
      };
      structure.src.hooks = {
        'index.ts': '// Custom React hooks',
      };
    }

    if (isNode) {
      structure.src.routes = {
        'index.ts': '// API routes',
      };
      structure.src.middleware = {
        'index.ts': '// Express middleware',
      };
      structure.src.models = {
        'index.ts': '// Data models',
      };
    }

    return structure;
  }

  private generatePackageJson(techStack: any): string {
    const packageJson = {
      name: this.context.name.toLowerCase().replace(/\s+/g, '-'),
      version: '1.0.0',
      description: this.context.description,
      main: 'src/index.ts',
      scripts: {
        start: 'node dist/index.js',
        dev: 'ts-node src/index.ts',
        build: 'tsc',
        test: 'jest',
        'test:watch': 'jest --watch',
        'test:coverage': 'jest --coverage',
        lint: 'eslint src/**/*.ts',
        'lint:fix': 'eslint src/**/*.ts --fix',
      },
      dependencies: this.getDependencies(techStack),
      devDependencies: this.getDevDependencies(techStack),
      keywords: ['mcp', 'autonomous', 'development'],
      author: 'Auto-generated by MCP Dev Team',
      license: 'MIT',
    };

    return JSON.stringify(packageJson, null, 2);
  }

  private getDependencies(techStack: any): any {
    const deps: any = {};

    // Backend dependencies
    if (techStack.backend.framework.toLowerCase().includes('express')) {
      deps.express = '^4.18.2';
      deps.cors = '^2.8.5';
      deps.helmet = '^7.1.0';
      deps.morgan = '^1.10.0';
    }

    // Database dependencies
    if (techStack.database.orm === 'Prisma') {
      deps['@prisma/client'] = '^5.7.0';
    }

    // Authentication
    deps.bcryptjs = '^2.4.3';
    deps.jsonwebtoken = '^9.0.2';

    return deps;
  }

  private getDevDependencies(techStack: any): any {
    const devDeps: any = {
      typescript: '^5.3.0',
      '@types/node': '^20.10.0',
      jest: '^29.7.0',
      '@types/jest': '^29.5.0',
      eslint: '^8.55.0',
      '@typescript-eslint/eslint-plugin': '^6.13.0',
      '@typescript-eslint/parser': '^6.13.0',
    };

    if (techStack.backend.framework.toLowerCase().includes('express')) {
      devDeps['@types/express'] = '^4.17.21';
      devDeps['@types/cors'] = '^2.8.17';
      devDeps['@types/morgan'] = '^1.9.9';
    }

    if (techStack.database.orm === 'Prisma') {
      devDeps.prisma = '^5.7.0';
    }

    return devDeps;
  }

  private generateReadme(techStack: any): string {
    return `# ${this.context.name}

${this.context.description}

## Technology Stack

- **Frontend:** ${techStack.frontend.framework} with ${techStack.frontend.language}
- **Backend:** ${techStack.backend.framework} with ${techStack.backend.language}
- **Database:** ${techStack.database.type} with ${techStack.database.orm || 'native queries'}
- **Deployment:** ${techStack.infrastructure.deployment}

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Available Scripts

- \`npm start\` - Start production server
- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm test\` - Run tests
- \`npm run lint\` - Run linter

## Project Structure

\`\`\`
src/
├── config/     # Configuration files
├── routes/     # API routes
├── middleware/ # Express middleware
├── models/     # Data models
├── utils/      # Utility functions
└── index.ts    # Application entry point
\`\`\`

## Contributing

This project was auto-generated by the MCP Autonomous Development Team.
`;
  }

  private generateGitignore(techStack: any): string {
    const patterns = [
      'node_modules/',
      'dist/',
      'build/',
      '.env',
      '.env.local',
      '.env.*.local',
      '*.log',
      'coverage/',
      '.nyc_output/',
      '.DS_Store',
      'Thumbs.db',
    ];

    if (techStack.database.orm === 'Prisma') {
      patterns.push('prisma/migrations/');
    }

    return patterns.join('\n') + '\n';
  }
}