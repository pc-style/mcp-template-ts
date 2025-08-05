import { LLMService } from '../services/llm.js';
import { Architecture, ArchitectureSchema, UserStory, AgentRole } from '../types.js';
import { z } from 'zod';

export class TechLeadAgent {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async createArchitecture(
    userStories: UserStory[],
    projectName: string,
    projectDescription: string
  ): Promise<Architecture> {
    const systemPrompt = `You are an experienced Technical Lead and Software Architect. Your role is to design system architecture, select appropriate technology stacks, and define API contracts based on user stories and project requirements.

Key responsibilities:
1. Analyze user stories to understand system requirements
2. Design scalable and maintainable system architecture
3. Select appropriate technology stack for frontend, backend, and database
4. Define API specifications and contracts
5. Design database schema
6. Create project structure and organization
7. Consider security, performance, and scalability requirements

Guidelines:
- Choose proven, production-ready technologies
- Design for scalability and maintainability
- Consider team expertise and learning curve
- Ensure security best practices
- Plan for future growth and changes
- Document architectural decisions and rationale`;

    const prompt = `Please design the system architecture for the following project:

PROJECT: ${projectName}
DESCRIPTION: ${projectDescription}

USER STORIES:
${JSON.stringify(userStories, null, 2)}

Please create a comprehensive architecture with:

1. TECHNOLOGY STACK:
   - Frontend: Array of frontend technologies (React, Vue, Angular, etc.)
   - Backend: Array of backend technologies (Node.js/Express, Python/FastAPI, Go, etc.)
   - Database: Primary database choice (PostgreSQL, MongoDB, SQLite, etc.)
   - Deployment: Array of deployment technologies (Docker, Kubernetes, etc.)

2. API SPECIFICATIONS:
   - Array of API endpoints with method, path, description
   - Request/response body schemas where applicable
   - Consider RESTful design principles

3. DATABASE SCHEMA:
   - Array of database tables with columns and constraints
   - Consider relationships and data integrity
   - Include indexes for performance

4. PROJECT STRUCTURE:
   - Array of directory/file paths showing project organization
   - Follow best practices for the chosen tech stack

Focus on:
1. Scalability and maintainability
2. Security best practices
3. Performance optimization
4. Team productivity
5. Future extensibility

Respond with a JSON object matching the Architecture schema.`;

    try {
      return await this.llm.generateStructuredResponse<Architecture>(
        prompt,
        ArchitectureSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Tech Lead Agent - Architecture creation failed:', error);
      throw new Error(`Failed to create architecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refineArchitecture(
    architecture: Architecture,
    feedback?: string,
    constraints?: string[]
  ): Promise<Architecture> {
    const systemPrompt = `You are a Technical Lead refining system architecture based on feedback, constraints, and additional requirements.

Your role is to:
1. Address feedback and concerns about the current architecture
2. Adapt to technical constraints and limitations
3. Improve design based on new requirements
4. Ensure architecture remains scalable and maintainable
5. Document architectural decisions and trade-offs`;

    const prompt = `Please refine the following system architecture based on the feedback and constraints:

CURRENT ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

FEEDBACK:
${feedback || 'No specific feedback provided. Please review and improve the architecture.'}

CONSTRAINTS:
${constraints ? constraints.join('\n') : 'No specific constraints provided.'}

Please refine the architecture by:
1. Addressing feedback and concerns
2. Adapting to constraints
3. Improving design decisions
4. Adding missing components
5. Ensuring best practices

Respond with the refined JSON architecture object.`;

    try {
      return await this.llm.generateStructuredResponse<Architecture>(
        prompt,
        ArchitectureSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Tech Lead Agent - Architecture refinement failed:', error);
      throw new Error(`Failed to refine architecture: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createAPIContracts(architecture: Architecture): Promise<Architecture> {
    const systemPrompt = `You are a Technical Lead creating detailed API contracts and specifications.

Your role is to:
1. Define comprehensive API endpoints
2. Specify request/response schemas
3. Document authentication and authorization
4. Define error handling and status codes
5. Ensure API design follows RESTful principles`;

    const prompt = `Please create detailed API contracts for the following architecture:

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please enhance the API specifications with:
1. Detailed request/response body schemas
2. Authentication requirements
3. Error response formats
4. Query parameters where applicable
5. Rate limiting considerations
6. API versioning strategy

Focus on:
1. RESTful design principles
2. Clear and consistent naming
3. Proper HTTP status codes
4. Comprehensive documentation
5. Security considerations

Respond with the enhanced architecture including detailed API contracts.`;

    try {
      return await this.llm.generateStructuredResponse<Architecture>(
        prompt,
        ArchitectureSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Tech Lead Agent - API contract creation failed:', error);
      throw new Error(`Failed to create API contracts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async designDatabaseSchema(architecture: Architecture, userStories: UserStory[]): Promise<Architecture> {
    const systemPrompt = `You are a Technical Lead designing comprehensive database schema based on user stories and system requirements.

Your role is to:
1. Analyze user stories to identify data entities
2. Design normalized database schema
3. Define relationships between entities
4. Specify constraints and indexes
5. Consider performance and scalability`;

    const prompt = `Please design a comprehensive database schema for the following project:

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

USER STORIES:
${JSON.stringify(userStories, null, 2)}

Please enhance the database schema with:
1. Complete table definitions with all necessary columns
2. Proper data types and constraints
3. Foreign key relationships
4. Indexes for performance
5. Consider the chosen database technology (${architecture.techStack.database})

Focus on:
1. Data normalization
2. Referential integrity
3. Performance optimization
4. Scalability considerations
5. Security best practices

Respond with the enhanced architecture including detailed database schema.`;

    try {
      return await this.llm.generateStructuredResponse<Architecture>(
        prompt,
        ArchitectureSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Tech Lead Agent - Database schema design failed:', error);
      throw new Error(`Failed to design database schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateArchitecture(architecture: Architecture): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate tech stack
    if (!architecture.techStack.frontend || architecture.techStack.frontend.length === 0) {
      issues.push('Frontend technology stack is missing');
    }

    if (!architecture.techStack.backend || architecture.techStack.backend.length === 0) {
      issues.push('Backend technology stack is missing');
    }

    if (!architecture.techStack.database) {
      issues.push('Database technology is missing');
    }

    // Validate API specs
    if (!architecture.apiSpecs || architecture.apiSpecs.length === 0) {
      issues.push('API specifications are missing');
    } else {
      for (const api of architecture.apiSpecs) {
        if (!api.endpoint || !api.method || !api.description) {
          issues.push(`API spec missing required fields: ${JSON.stringify(api)}`);
        }
      }
    }

    // Validate database schema
    if (!architecture.databaseSchema || architecture.databaseSchema.length === 0) {
      issues.push('Database schema is missing');
    } else {
      for (const table of architecture.databaseSchema) {
        if (!table.table || !table.columns || table.columns.length === 0) {
          issues.push(`Database table missing required fields: ${JSON.stringify(table)}`);
        }
      }
    }

    // Validate project structure
    if (!architecture.projectStructure || architecture.projectStructure.length === 0) {
      issues.push('Project structure is missing');
    }

    // Check for technology conflicts
    const techConflicts = this.checkTechnologyConflicts(architecture);
    issues.push(...techConflicts);

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private checkTechnologyConflicts(architecture: Architecture): string[] {
    const issues: string[] = [];

    // Check for incompatible frontend/backend combinations
    const frontend = architecture.techStack.frontend;
    const backend = architecture.techStack.backend;

    // Example: React Native with server-side rendering
    if (frontend.includes('React Native') && backend.includes('Next.js')) {
      issues.push('React Native is not compatible with Next.js server-side rendering');
    }

    // Check for database compatibility
    const database = architecture.techStack.database;
    
    if (database === 'SQLite' && architecture.techStack.deployment.includes('Kubernetes')) {
      issues.push('SQLite is not suitable for Kubernetes deployment (use PostgreSQL or MongoDB)');
    }

    if (database === 'MongoDB' && backend.includes('Prisma')) {
      issues.push('Prisma has limited MongoDB support, consider using Mongoose instead');
    }

    return issues;
  }

  async createArchitectureDocumentation(architecture: Architecture): Promise<string> {
    const systemPrompt = `You are a Technical Lead creating comprehensive architecture documentation.

Your role is to:
1. Document architectural decisions and rationale
2. Explain technology choices and trade-offs
3. Provide implementation guidelines
4. Document security and performance considerations
5. Create deployment and scaling strategies`;

    const prompt = `Please create comprehensive architecture documentation for the following system:

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create documentation covering:
1. System Overview
2. Technology Stack Rationale
3. Architecture Patterns
4. API Design Principles
5. Database Design
6. Security Considerations
7. Performance Optimization
8. Deployment Strategy
9. Scaling Considerations
10. Monitoring and Observability

Format the documentation in Markdown with clear sections and examples.`;

    try {
      const response = await this.llm.generateResponse(prompt, systemPrompt, 0.3);
      return response.content;
    } catch (error) {
      console.error('Tech Lead Agent - Documentation creation failed:', error);
      throw new Error(`Failed to create architecture documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}