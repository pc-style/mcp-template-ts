import { BaseAgent } from './base-agent.js';
import { AgentTask, TechStack, APISpec, DatabaseSchema, TechStackSchema, APISpecSchema, DatabaseSchema as DBSchema } from '../types.js';
import { FileSystemService } from '../services/filesystem.js';

export class TechLeadAgent extends BaseAgent {
  private fs: FileSystemService;

  constructor(context: any) {
    super('tech_lead', context);
    this.fs = new FileSystemService();
  }

  protected getRoleResponsibilities(): string {
    return `- Design system architecture and technical specifications
- Define technology stack and framework choices
- Create API specifications and database schemas
- Establish coding standards and best practices
- Evaluate technical feasibility and risks
- Plan system scalability and performance requirements
- Define integration patterns and data flow
- Create technical documentation and diagrams`;
  }

  async execute(task: AgentTask): Promise<any> {
    this.logTaskStart(task);

    try {
      switch (task.title.toLowerCase()) {
        case 'create_architecture':
          return await this.createArchitecture(task);
        case 'design_api':
          return await this.designAPI(task);
        case 'design_database':
          return await this.designDatabase(task);
        case 'define_tech_stack':
          return await this.defineTechStack(task);
        case 'create_technical_specs':
          return await this.createTechnicalSpecs(task);
        default:
          throw new Error(`Unknown task: ${task.title}`);
      }
    } catch (error) {
      this.logTaskError(task, error as Error);
      throw error;
    }
  }

  private async createArchitecture(task: AgentTask): Promise<{ architecture: any }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available before creating architecture');
    }

    const prompt = `Based on the following requirements and user stories, design a comprehensive system architecture:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Design an architecture that includes:
1. System overview and high-level components
2. Technology stack recommendations
3. Database design considerations
4. API design patterns
5. Security considerations
6. Scalability and performance requirements
7. Deployment architecture
8. Integration patterns

Focus on creating a scalable, maintainable, and secure architecture that meets all functional and non-functional requirements.`;

    const architecture = await this.generateResponse(prompt);

    this.addDecision(
      'System Architecture Designed',
      'Comprehensive system architecture has been designed',
      'Architecture provides technical foundation for development team'
    );

    // Create architecture documentation
    await this.createArchitectureDocumentation(architecture);

    this.logTaskComplete(task, { architecture });
    return { architecture };
  }

  private async designAPI(task: AgentTask): Promise<{ api_specs: APISpec[] }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available before designing API');
    }

    const prompt = `Based on the following requirements and user stories, design comprehensive API specifications:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Design RESTful APIs that include:
1. Authentication and authorization endpoints
2. CRUD operations for all major entities
3. Search and filtering capabilities
4. Pagination and sorting
5. Error handling and status codes
6. Request/response schemas
7. API versioning strategy

Focus on creating intuitive, consistent, and well-documented APIs that support all user stories.`;

    const apiSpecs = await this.generateStructuredResponse<APISpec[]>(
      prompt,
      APISpecSchema.array(),
      [
        {
          name: 'User Management API',
          version: 'v1',
          base_url: '/api/v1',
          endpoints: [
            {
              path: '/users',
              method: 'POST',
              description: 'Create a new user account',
              request_schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' }
                },
                required: ['email', 'password', 'name']
              },
              response_schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  created_at: { type: 'string', format: 'date-time' }
                }
              }
            }
          ]
        }
      ]
    );

    this.updateContext({ api_specs: apiSpecs });
    this.addDecision(
      'API Design Complete',
      `Designed ${apiSpecs.length} API specifications`,
      'API specifications provide clear contract for frontend and backend development'
    );

    // Create API documentation
    await this.createAPIDocumentation(apiSpecs);

    this.logTaskComplete(task, { api_specs: apiSpecs.length });
    return { api_specs: apiSpecs };
  }

  private async designDatabase(task: AgentTask): Promise<{ database_schema: DatabaseSchema }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;
    const apiSpecs = this.context.api_specs;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available before designing database');
    }

    const prompt = `Based on the following requirements, user stories, and API specifications, design a comprehensive database schema:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

API Specifications:
${JSON.stringify(apiSpecs, null, 2)}

Design a database schema that includes:
1. All necessary tables and relationships
2. Primary and foreign keys
3. Data types and constraints
4. Indexes for performance
5. Audit fields (created_at, updated_at)
6. Soft delete considerations
7. Data validation rules

Focus on creating a normalized, scalable database design that supports all API operations efficiently.`;

    const databaseSchema = await this.generateStructuredResponse<DatabaseSchema>(
      prompt,
      DBSchema,
      {
        tables: [
          {
            name: 'users',
            columns: [
              { name: 'id', type: 'UUID PRIMARY KEY' },
              { name: 'email', type: 'VARCHAR(255) UNIQUE NOT NULL' },
              { name: 'password_hash', type: 'VARCHAR(255) NOT NULL' },
              { name: 'name', type: 'VARCHAR(255) NOT NULL' },
              { name: 'created_at', type: 'TIMESTAMP DEFAULT NOW()' },
              { name: 'updated_at', type: 'TIMESTAMP DEFAULT NOW()' }
            ]
          }
        ]
      }
    );

    this.updateContext({ database_schema: databaseSchema });
    this.addDecision(
      'Database Design Complete',
      `Designed database schema with ${databaseSchema.tables.length} tables`,
      'Database schema provides data foundation for the application'
    );

    // Create database documentation
    await this.createDatabaseDocumentation(databaseSchema);

    this.logTaskComplete(task, { database_schema: databaseSchema });
    return { database_schema: databaseSchema };
  }

  private async defineTechStack(task: AgentTask): Promise<{ tech_stack: TechStack }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available before defining tech stack');
    }

    const prompt = `Based on the following requirements and user stories, recommend an optimal technology stack:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Consider the following factors:
1. Project complexity and scale
2. Team expertise and learning curve
3. Performance and scalability requirements
4. Security requirements
5. Development velocity and ecosystem maturity
6. Deployment and hosting considerations
7. Maintenance and long-term support

Recommend a complete tech stack including:
- Frontend framework and tools
- Backend framework and runtime
- Database technology
- Infrastructure and deployment tools
- Testing frameworks
- Development tools and utilities`;

    const techStack = await this.generateStructuredResponse<TechStack>(
      prompt,
      TechStackSchema,
      {
        frontend: {
          framework: 'React',
          language: 'TypeScript',
          build_tool: 'Vite',
          styling: 'Tailwind CSS'
        },
        backend: {
          framework: 'Express.js',
          language: 'Node.js',
          runtime: 'Node.js 18'
        },
        database: {
          type: 'PostgreSQL',
          name: 'postgres',
          orm: 'Prisma'
        },
        infrastructure: {
          deployment: 'Docker',
          containerization: 'Docker',
          ci_cd: 'GitHub Actions'
        }
      }
    );

    this.updateContext({ tech_stack: techStack });
    this.addDecision(
      'Technology Stack Defined',
      'Optimal technology stack has been selected',
      'Tech stack provides foundation for efficient development and deployment'
    );

    // Create tech stack documentation
    await this.createTechStackDocumentation(techStack);

    this.logTaskComplete(task, { tech_stack: techStack });
    return { tech_stack: techStack };
  }

  private async createTechnicalSpecs(task: AgentTask): Promise<{ technicalSpecs: any }> {
    const techStack = this.context.tech_stack;
    const apiSpecs = this.context.api_specs;
    const databaseSchema = this.context.database_schema;

    if (!techStack) {
      throw new Error('Technology stack must be defined before creating technical specs');
    }

    const prompt = `Create comprehensive technical specifications based on the following:

Technology Stack:
${JSON.stringify(techStack, null, 2)}

API Specifications:
${JSON.stringify(apiSpecs, null, 2)}

Database Schema:
${JSON.stringify(databaseSchema, null, 2)}

Create technical specifications that include:
1. Development environment setup
2. Code organization and structure
3. Coding standards and conventions
4. Testing strategy and frameworks
5. Security implementation guidelines
6. Performance optimization guidelines
7. Deployment and CI/CD pipeline
8. Monitoring and logging strategy
9. Error handling and debugging
10. Documentation standards`;

    const technicalSpecs = await this.generateResponse(prompt);

    this.addDecision(
      'Technical Specifications Complete',
      'Comprehensive technical specifications have been created',
      'Technical specs provide development guidelines and standards'
    );

    // Create technical specifications documentation
    await this.createTechnicalSpecsDocumentation(technicalSpecs);

    this.logTaskComplete(task, { technicalSpecs: technicalSpecs });
    return { technicalSpecs: technicalSpecs };
  }

  private async createArchitectureDocumentation(architecture: string): Promise<void> {
    const docsPath = `${this.context.id}/docs/architecture`;
    await this.fs.ensureDirectory(docsPath);

    const architectureDoc = `# System Architecture

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Architecture Overview

${architecture}

## Architecture Decisions

${this.context.decisions
  .filter(d => d.agent === 'tech_lead')
  .map(d => `### ${d.title}\n\n${d.description}\n\n**Rationale:** ${d.rationale}\n`)
  .join('\n')}
`;

    await this.fs.writeFile(`${docsPath}/system-architecture.md`, architectureDoc);
    this.addArtifact('System Architecture Document', 'markdown', `${docsPath}/system-architecture.md`);
  }

  private async createAPIDocumentation(apiSpecs: APISpec[]): Promise<void> {
    const docsPath = `${this.context.id}/docs/api`;
    await this.fs.ensureDirectory(docsPath);

    let apiDoc = `# API Documentation

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## API Overview

This document describes the RESTful APIs for the ${this.context.name} application.

`;

    apiSpecs.forEach(spec => {
      apiDoc += `## ${spec.name} (${spec.version})\n\n`;
      apiDoc += `**Base URL:** ${spec.base_url}\n\n`;

      spec.endpoints.forEach(endpoint => {
        apiDoc += `### ${endpoint.method} ${endpoint.path}\n\n`;
        apiDoc += `${endpoint.description}\n\n`;

        if (endpoint.request_schema) {
          apiDoc += `**Request Schema:**\n\`\`\`json\n${JSON.stringify(endpoint.request_schema, null, 2)}\n\`\`\`\n\n`;
        }

        if (endpoint.response_schema) {
          apiDoc += `**Response Schema:**\n\`\`\`json\n${JSON.stringify(endpoint.response_schema, null, 2)}\n\`\`\`\n\n`;
        }
      });
    });

    await this.fs.writeFile(`${docsPath}/api-documentation.md`, apiDoc);
    this.addArtifact('API Documentation', 'markdown', `${docsPath}/api-documentation.md`);
  }

  private async createDatabaseDocumentation(databaseSchema: DatabaseSchema): Promise<void> {
    const docsPath = `${this.context.id}/docs/database`;
    await this.fs.ensureDirectory(docsPath);

    let dbDoc = `# Database Schema

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Database Overview

This document describes the database schema for the ${this.context.name} application.

`;

    databaseSchema.tables.forEach(table => {
      dbDoc += `## Table: ${table.name}\n\n`;
      dbDoc += `| Column | Type | Constraints | Description |\n`;
      dbDoc += `|--------|------|-------------|-------------|\n`;

      table.columns.forEach(column => {
        const constraints = column.constraints ? column.constraints.join(', ') : '';
        dbDoc += `| ${column.name} | ${column.type} | ${constraints} | |\n`;
      });

      dbDoc += `\n`;
    });

    await this.fs.writeFile(`${docsPath}/database-schema.md`, dbDoc);
    this.addArtifact('Database Schema Document', 'markdown', `${docsPath}/database-schema.md`);
  }

  private async createTechStackDocumentation(techStack: TechStack): Promise<void> {
    const docsPath = `${this.context.id}/docs/tech-stack`;
    await this.fs.ensureDirectory(docsPath);

    const techStackDoc = `# Technology Stack

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Frontend

- **Framework:** ${techStack.frontend.framework}
- **Language:** ${techStack.frontend.language}
- **Build Tool:** ${techStack.frontend.build_tool || 'N/A'}
- **Styling:** ${techStack.frontend.styling || 'N/A'}

## Backend

- **Framework:** ${techStack.backend.framework}
- **Language:** ${techStack.backend.language}
- **Runtime:** ${techStack.backend.runtime || 'N/A'}

## Database

- **Type:** ${techStack.database.type}
- **Name:** ${techStack.database.name}
- **ORM:** ${techStack.database.orm || 'N/A'}

## Infrastructure

- **Deployment:** ${techStack.infrastructure.deployment}
- **Containerization:** ${techStack.infrastructure.containerization || 'N/A'}
- **CI/CD:** ${techStack.infrastructure.ci_cd || 'N/A'}

## Rationale

${this.context.decisions
  .filter(d => d.agent === 'tech_lead' && d.title.includes('Technology'))
  .map(d => d.rationale)
  .join('\n\n')}
`;

    await this.fs.writeFile(`${docsPath}/technology-stack.md`, techStackDoc);
    this.addArtifact('Technology Stack Document', 'markdown', `${docsPath}/technology-stack.md`);
  }

  private async createTechnicalSpecsDocumentation(technicalSpecs: string): Promise<void> {
    const docsPath = `${this.context.id}/docs/technical-specs`;
    await this.fs.ensureDirectory(docsPath);

    const specsDoc = `# Technical Specifications

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Technical Specifications

${technicalSpecs}

## Development Guidelines

This document provides comprehensive technical specifications and development guidelines for the ${this.context.name} project.
`;

    await this.fs.writeFile(`${docsPath}/technical-specifications.md`, specsDoc);
    this.addArtifact('Technical Specifications Document', 'markdown', `${docsPath}/technical-specifications.md`);
  }
}