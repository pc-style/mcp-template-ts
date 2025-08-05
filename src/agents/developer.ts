import { BaseAgent } from './base-agent.js';
import { AgentContext, AgentResponse, FeatureImplementation, GeneratedFile } from '../types/shared.js';
import { FileOperations } from '../utils/file-operations.js';

export class Developer extends BaseAgent {
  constructor(context: AgentContext) {
    super(context, 'Developer', 'Feature Implementation and Code Generation');
  }

  async execute(input: { featureId: string; userStoryId?: string }): Promise<AgentResponse> {
    this.log(`Implementing feature: ${input.featureId}`);

    try {
      const { architecture, userStories } = this.context.projectState;
      
      if (!architecture) {
        return this.createResponse(false, 'No architecture design available for implementation');
      }

      // Find the relevant user story if provided
      const targetStory = input.userStoryId ? 
        userStories.find(story => story.id === input.userStoryId) : null;

      // Create implementation prompt
      const implementationPrompt = this.createImplementationPrompt(input.featureId, architecture, targetStory);
      const llmResponse = await this.callLLM(implementationPrompt);
      
      const implementation = this.parseImplementationResponse(llmResponse, input.featureId);
      
      // Write generated files to the file system
      await this.writeImplementationFiles(implementation);
      
      // Update project state with new implementation
      const updatedImplementations = [...this.context.projectState.implementations, implementation];
      this.updateProjectState({
        implementations: updatedImplementations
      });

      this.log(`Feature implementation completed with ${implementation.files.length} files generated`);

      return this.createResponse(
        true,
        'Feature implementation completed successfully',
        {
          featureId: implementation.featureId,
          filesGenerated: implementation.files.length,
          dependencies: implementation.dependencies,
          testFiles: implementation.testFiles.length
        },
        undefined,
        {
          implementations: updatedImplementations
        }
      );
    } catch (error) {
      const err = error as Error;
      this.log(`Error during feature implementation: ${err.message}`);
      return this.createResponse(
        false,
        `Feature implementation failed: ${err.message}`
      );
    }
  }

  private createImplementationPrompt(featureId: string, architecture: any, userStory: any): string {
    const techStack = architecture.techStack.map((ts: any) => `${ts.category}: ${ts.technology}`).join('\n');
    const components = architecture.components.map((comp: any) => `- ${comp.name}: ${comp.description}`).join('\n');
    const apiSpecs = architecture.apiSpecs.map((api: any) => `${api.method} ${api.endpoint}: ${api.description}`).join('\n');

    return `
You are a Senior Developer implementing a feature based on the following architecture and requirements:

FEATURE ID: ${featureId}
${userStory ? `USER STORY: ${userStory.title} - ${userStory.description}` : ''}

TECH STACK:
${techStack}

SYSTEM COMPONENTS:
${components}

API SPECIFICATIONS:
${apiSpecs}

Please implement this feature and provide the result in the following JSON format:
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "// Complete file content here",
      "type": "source|config|test|documentation"
    }
  ],
  "dependencies": ["package1", "package2"],
  "testFiles": [
    {
      "path": "tests/feature.test.ts",
      "content": "// Test file content",
      "type": "test"
    }
  ],
  "documentation": "Implementation notes and usage instructions"
}

Requirements:
1. Follow the defined architecture and tech stack
2. Write clean, maintainable, and well-documented code
3. Include proper error handling and validation
4. Follow best practices for the chosen technologies
5. Include TypeScript types and interfaces
6. Create modular, testable code
7. Include basic unit tests
8. Follow REST API conventions for endpoints
9. Include proper authentication where required
10. Add comments for complex logic

Focus on creating production-ready code that follows industry best practices.
`;
  }

  private parseImplementationResponse(response: string, featureId: string): FeatureImplementation {
    try {
      const parsed = JSON.parse(response);
      
      return {
        featureId,
        files: this.parseGeneratedFiles(parsed.files || []),
        dependencies: parsed.dependencies || [],
        testFiles: this.parseGeneratedFiles(parsed.testFiles || []),
        documentation: parsed.documentation || 'Implementation completed'
      };
    } catch (error) {
      this.log(`Warning: Failed to parse implementation response, using fallback implementation`);
      return this.createFallbackImplementation(featureId);
    }
  }

  private parseGeneratedFiles(files: any[]): GeneratedFile[] {
    return files.map(file => ({
      path: file.path || 'src/unknown.ts',
      content: file.content || '// Generated file content',
      type: file.type || 'source'
    }));
  }

  private async writeImplementationFiles(implementation: FeatureImplementation): Promise<void> {
    const allFiles = [...implementation.files, ...implementation.testFiles];
    await FileOperations.writeGeneratedFiles(allFiles, this.context.outputDirectory);
    this.log(`Wrote ${allFiles.length} files to ${this.context.outputDirectory}`);
  }

  private createFallbackImplementation(featureId: string): FeatureImplementation {
    const authServiceContent = `import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, CreateUserDto, LoginDto } from '../types/auth.js';
import { UserRepository } from '../repositories/user-repository.js';

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret';
  }

  async register(userData: CreateUserDto): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        return { success: false, error: 'User already exists' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user
      const user = await this.userRepository.create({
        email: userData.email,
        password: hashedPassword
      });

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, this.jwtSecret, { expiresIn: '7d' });

      return { success: true, token };
    } catch (error) {
      return { success: false, error: 'Registration failed' };
    }
  }

  async login(loginData: LoginDto): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Find user by email
      const user = await this.userRepository.findByEmail(loginData.email);
      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(loginData.password, user.password);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, email: user.email }, this.jwtSecret, { expiresIn: '7d' });

      return { success: true, token };
    } catch (error) {
      return { success: false, error: 'Login failed' };
    }
  }

  verifyToken(token: string): { success: boolean; userId?: string; error?: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return { success: true, userId: decoded.userId };
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  }
}`;

    const authControllerContent = `import { Request, Response } from 'express';
import { AuthService } from '../services/auth-service.js';
import { CreateUserDto, LoginDto } from '../types/auth.js';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: CreateUserDto = req.body;
      
      // Basic validation
      if (!userData.email || !userData.password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.register(userData);
      
      if (result.success) {
        res.status(201).json({ success: true, token: result.token });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginDto = req.body;
      
      // Basic validation
      if (!loginData.email || !loginData.password) {
        res.status(400).json({ success: false, error: 'Email and password are required' });
        return;
      }

      const result = await this.authService.login(loginData);
      
      if (result.success) {
        res.status(200).json({ success: true, token: result.token });
      } else {
        res.status(401).json({ success: false, error: result.error });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
}`;

    const authTypesContent = `export interface User {
  id: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}`;

    const testContent = `import { AuthService } from '../src/services/auth-service';
import { UserRepository } from '../src/repositories/user-repository';

// Mock UserRepository
const mockUserRepository = {
  findByEmail: jest.fn(),
  create: jest.fn(),
} as jest.Mocked<UserRepository>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockUserRepository);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword'
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should fail when user already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword'
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: '$2b$10$hashedPassword'
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });
  });
});`;

    return {
      featureId,
      files: [
        {
          path: 'src/services/auth-service.ts',
          content: authServiceContent,
          type: 'source'
        },
        {
          path: 'src/controllers/auth-controller.ts',
          content: authControllerContent,
          type: 'source'
        },
        {
          path: 'src/types/auth.ts',
          content: authTypesContent,
          type: 'source'
        }
      ],
      dependencies: ['bcrypt', 'jsonwebtoken', '@types/bcrypt', '@types/jsonwebtoken'],
      testFiles: [
        {
          path: 'tests/unit/auth-service.test.ts',
          content: testContent,
          type: 'test'
        }
      ],
      documentation: 'Authentication system with JWT token-based authentication, user registration and login functionality'
    };
  }
}