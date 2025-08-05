import { AgentContext, AgentResponse, ProjectState } from '../types/shared.js';

export abstract class BaseAgent {
  protected context: AgentContext;
  protected name: string;
  protected role: string;

  constructor(context: AgentContext, name: string, role: string) {
    this.context = context;
    this.name = name;
    this.role = role;
  }

  abstract execute(input: any): Promise<AgentResponse>;

  protected updateProjectState(updates: Partial<ProjectState>): void {
    this.context.projectState = { ...this.context.projectState, ...updates };
  }

  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }

  protected createResponse(
    success: boolean,
    message: string,
    data?: any,
    nextPhase?: string,
    updatedState?: Partial<ProjectState>
  ): AgentResponse {
    return {
      success,
      message,
      data,
      nextPhase,
      updatedState
    };
  }

  protected generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  protected async callLLM(prompt: string, options: any = {}): Promise<string> {
    // This is a placeholder for LLM integration
    // In a real implementation, this would call OpenAI, Anthropic, or local models
    // For now, we'll provide structured responses based on the agent type
    
    this.log(`LLM Prompt: ${prompt.substring(0, 100)}...`);
    
    // Return a simulated response based on the agent type and prompt content
    return this.generateMockLLMResponse(prompt, options);
  }

  private generateMockLLMResponse(prompt: string, options: any): string {
    // Generate appropriate mock responses based on prompt content and agent role
    if (prompt.includes('requirements') || prompt.includes('PRD')) {
      return this.getMockRequirementsResponse();
    } else if (prompt.includes('architecture') || prompt.includes('design')) {
      return this.getMockArchitectureResponse();
    } else if (prompt.includes('implement') || prompt.includes('code')) {
      return this.getMockImplementationResponse();
    } else if (prompt.includes('test')) {
      return this.getMockTestResponse();
    } else if (prompt.includes('deploy')) {
      return this.getMockDeploymentResponse();
    }
    
    return "Task completed successfully with appropriate technical decisions.";
  }

  private getMockRequirementsResponse(): string {
    return JSON.stringify({
      requirements: [
        {
          id: "req-1",
          title: "User Authentication",
          description: "Users should be able to register, login, and manage their accounts",
          priority: "high",
          category: "functional",
          acceptanceCriteria: [
            "User can register with email and password",
            "User can login with valid credentials",
            "User can reset password",
            "User session is maintained securely"
          ]
        }
      ],
      userStories: [
        {
          id: "story-1",
          title: "User Registration",
          description: "As a new user, I want to create an account so that I can access the application",
          acceptanceCriteria: [
            "Registration form with email and password fields",
            "Email validation",
            "Password strength requirements",
            "Confirmation email sent"
          ],
          estimatedEffort: 5,
          priority: "high",
          dependencies: []
        }
      ]
    });
  }

  private getMockArchitectureResponse(): string {
    return JSON.stringify({
      overview: "Modern web application with React frontend and Node.js backend",
      techStack: [
        {
          category: "frontend",
          technology: "React + TypeScript",
          reasoning: "Strong ecosystem, type safety, component reusability",
          alternatives: ["Vue.js", "Angular"]
        },
        {
          category: "backend",
          technology: "Node.js + Express",
          reasoning: "JavaScript consistency, excellent npm ecosystem",
          alternatives: ["Python Flask", "Go Gin"]
        }
      ],
      components: [
        {
          name: "AuthService",
          type: "backend",
          description: "Handles user authentication and authorization",
          dependencies: ["UserRepository", "TokenService"],
          interfaces: ["/api/auth/login", "/api/auth/register"]
        }
      ]
    });
  }

  private getMockImplementationResponse(): string {
    return JSON.stringify({
      files: [
        {
          path: "src/services/auth.ts",
          content: "// Authentication service implementation\nexport class AuthService {\n  // Implementation here\n}",
          type: "source"
        }
      ],
      dependencies: ["bcrypt", "jsonwebtoken"],
      documentation: "Authentication service with JWT token support"
    });
  }

  private getMockTestResponse(): string {
    return JSON.stringify({
      testSuites: [
        {
          name: "AuthService Tests",
          type: "unit",
          framework: "Jest",
          files: [
            {
              path: "tests/unit/auth.test.ts",
              content: "// Unit tests for AuthService",
              type: "test"
            }
          ],
          coverage: ["AuthService"]
        }
      ]
    });
  }

  private getMockDeploymentResponse(): string {
    return JSON.stringify({
      platform: "docker",
      configurations: [
        {
          path: "Dockerfile",
          content: "FROM node:18-alpine\n# Docker configuration",
          type: "config"
        },
        {
          path: "docker-compose.yml",
          content: "version: '3.8'\nservices:\n  app:\n    build: .",
          type: "config"
        }
      ]
    });
  }
}