import { BaseAgent } from './base-agent.js';
import { AgentContext, AgentResponse, ArchitectureDesign, TechStackDecision, ComponentSpec, APISpec, DatabaseSchema } from '../types/shared.js';

export class TechLead extends BaseAgent {
  constructor(context: AgentContext) {
    super(context, 'TechLead', 'System Architecture and Technical Design');
  }

  async execute(input: any): Promise<AgentResponse> {
    this.log('Creating system architecture and technical design...');

    try {
      const { requirements, userStories } = this.context.projectState;
      
      if (!requirements.length) {
        return this.createResponse(false, 'No requirements available for architecture design');
      }

      // Create architecture design prompt
      const architecturePrompt = this.createArchitecturePrompt(requirements, userStories);
      const llmResponse = await this.callLLM(architecturePrompt);
      
      const architecture = this.parseArchitectureResponse(llmResponse);
      
      // Update project state with architecture design
      this.updateProjectState({
        architecture,
        currentPhase: 'implementation'
      });

      this.log(`Architecture design completed with ${architecture.components.length} components and ${architecture.techStack.length} technology decisions`);

      return this.createResponse(
        true,
        'Architecture design completed successfully',
        {
          componentsCount: architecture.components.length,
          apiEndpoints: architecture.apiSpecs.length,
          databaseTables: architecture.databaseSchema.length,
          techStackDecisions: architecture.techStack.length
        },
        'implementation',
        {
          architecture,
          currentPhase: 'implementation'
        }
      );
    } catch (error) {
      this.log(`Error during architecture design: ${error.message}`);
      return this.createResponse(
        false,
        `Architecture design failed: ${error.message}`
      );
    }
  }

  private createArchitecturePrompt(requirements: any[], userStories: any[]): string {
    const requirementsSummary = requirements.map(r => `- ${r.title}: ${r.description}`).join('\n');
    const storiesSummary = userStories.map(s => `- ${s.title}: ${s.description}`).join('\n');

    return `
You are a Tech Lead designing system architecture based on the following requirements and user stories:

REQUIREMENTS:
${requirementsSummary}

USER STORIES:
${storiesSummary}

Please provide a comprehensive architecture design in the following JSON format:
{
  "overview": "High-level system overview and architectural approach",
  "components": [
    {
      "name": "ComponentName",
      "type": "frontend|backend|service|utility",
      "description": "Component description and responsibilities",
      "dependencies": ["dependency1", "dependency2"],
      "interfaces": ["interface1", "interface2"]
    }
  ],
  "dataFlow": "Description of how data flows through the system",
  "apiSpecs": [
    {
      "endpoint": "/api/endpoint",
      "method": "GET|POST|PUT|DELETE|PATCH",
      "description": "Endpoint description",
      "requestSchema": {},
      "responseSchema": {},
      "authentication": true|false
    }
  ],
  "databaseSchema": [
    {
      "tableName": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "data_type",
          "nullable": true|false,
          "primaryKey": true|false,
          "unique": true|false,
          "defaultValue": "default_value"
        }
      ],
      "indexes": ["index1", "index2"],
      "relationships": [
        {
          "type": "oneToOne|oneToMany|manyToMany",
          "targetTable": "target_table",
          "foreignKey": "foreign_key_column"
        }
      ]
    }
  ],
  "techStack": [
    {
      "category": "frontend|backend|database|deployment|testing",
      "technology": "Technology Name",
      "reasoning": "Why this technology was chosen",
      "alternatives": ["alternative1", "alternative2"]
    }
  ]
}

Focus on:
1. Scalable and maintainable architecture
2. Modern technology stack choices
3. Clear separation of concerns
4. RESTful API design
5. Normalized database design
6. Security considerations
7. Performance optimization opportunities
`;
  }

  private parseArchitectureResponse(response: string): ArchitectureDesign {
    try {
      const parsed = JSON.parse(response);
      
      return {
        overview: parsed.overview || 'Modern web application architecture',
        components: this.parseComponents(parsed.components || []),
        dataFlow: parsed.dataFlow || 'Standard request-response flow with database persistence',
        apiSpecs: this.parseAPISpecs(parsed.apiSpecs || []),
        databaseSchema: this.parseDatabaseSchema(parsed.databaseSchema || []),
        techStack: this.parseTechStack(parsed.techStack || [])
      };
    } catch (error) {
      this.log(`Warning: Failed to parse architecture response, using fallback design`);
      return this.createFallbackArchitecture();
    }
  }

  private parseComponents(components: any[]): ComponentSpec[] {
    return components.map((comp, index) => ({
      name: comp.name || `Component${index + 1}`,
      type: comp.type || 'service',
      description: comp.description || 'Component description',
      dependencies: comp.dependencies || [],
      interfaces: comp.interfaces || []
    }));
  }

  private parseAPISpecs(apiSpecs: any[]): APISpec[] {
    return apiSpecs.map((api, index) => ({
      endpoint: api.endpoint || `/api/endpoint${index + 1}`,
      method: api.method || 'GET',
      description: api.description || 'API endpoint',
      requestSchema: api.requestSchema || {},
      responseSchema: api.responseSchema || {},
      authentication: api.authentication || false
    }));
  }

  private parseDatabaseSchema(schema: any[]): DatabaseSchema[] {
    return schema.map((table, index) => ({
      tableName: table.tableName || `table${index + 1}`,
      columns: table.columns || [],
      indexes: table.indexes || [],
      relationships: table.relationships || []
    }));
  }

  private parseTechStack(techStack: any[]): TechStackDecision[] {
    return techStack.map((tech, index) => ({
      category: tech.category || 'backend',
      technology: tech.technology || 'Node.js',
      reasoning: tech.reasoning || 'Popular and well-supported technology',
      alternatives: tech.alternatives || []
    }));
  }

  private createFallbackArchitecture(): ArchitectureDesign {
    return {
      overview: 'Modern full-stack web application with React frontend, Node.js backend, and PostgreSQL database',
      components: [
        {
          name: 'Frontend',
          type: 'frontend',
          description: 'React-based user interface with TypeScript',
          dependencies: ['API Gateway'],
          interfaces: ['HTTP REST API']
        },
        {
          name: 'API Gateway',
          type: 'backend',
          description: 'Express.js REST API server',
          dependencies: ['AuthService', 'DataService'],
          interfaces: ['/api/*']
        },
        {
          name: 'AuthService',
          type: 'service',
          description: 'User authentication and authorization service',
          dependencies: ['Database'],
          interfaces: ['/api/auth/*']
        },
        {
          name: 'DataService',
          type: 'service',
          description: 'Core business logic and data operations',
          dependencies: ['Database'],
          interfaces: ['/api/data/*']
        }
      ],
      dataFlow: 'Client → API Gateway → Business Services → Database',
      apiSpecs: [
        {
          endpoint: '/api/auth/register',
          method: 'POST',
          description: 'User registration',
          requestSchema: { email: 'string', password: 'string' },
          responseSchema: { success: 'boolean', token: 'string' },
          authentication: false
        },
        {
          endpoint: '/api/auth/login',
          method: 'POST',
          description: 'User login',
          requestSchema: { email: 'string', password: 'string' },
          responseSchema: { success: 'boolean', token: 'string' },
          authentication: false
        }
      ],
      databaseSchema: [
        {
          tableName: 'users',
          columns: [
            { name: 'id', type: 'UUID', nullable: false, primaryKey: true, unique: true },
            { name: 'email', type: 'VARCHAR(255)', nullable: false, primaryKey: false, unique: true },
            { name: 'password_hash', type: 'VARCHAR(255)', nullable: false, primaryKey: false, unique: false },
            { name: 'created_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, unique: false, defaultValue: 'NOW()' },
            { name: 'updated_at', type: 'TIMESTAMP', nullable: false, primaryKey: false, unique: false, defaultValue: 'NOW()' }
          ],
          indexes: ['email'],
          relationships: []
        }
      ],
      techStack: [
        {
          category: 'frontend',
          technology: 'React + TypeScript',
          reasoning: 'Strong ecosystem, type safety, excellent developer experience',
          alternatives: ['Vue.js', 'Angular', 'Svelte']
        },
        {
          category: 'backend',
          technology: 'Node.js + Express',
          reasoning: 'JavaScript consistency across stack, excellent npm ecosystem',
          alternatives: ['Python Flask', 'Go Gin', 'Java Spring']
        },
        {
          category: 'database',
          technology: 'PostgreSQL',
          reasoning: 'ACID compliance, excellent JSON support, mature ecosystem',
          alternatives: ['MySQL', 'MongoDB', 'SQLite']
        },
        {
          category: 'deployment',
          technology: 'Docker + Docker Compose',
          reasoning: 'Containerization for consistent environments and easy deployment',
          alternatives: ['Kubernetes', 'Traditional VPS', 'Serverless']
        }
      ]
    };
  }
}