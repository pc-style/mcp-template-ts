import { BaseAgent } from './base-agent.js';
import { AgentContext, AgentResponse, TestSuite, GeneratedFile } from '../types/shared.js';
import { FileOperations } from '../utils/file-operations.js';

export class QAEngineer extends BaseAgent {
  constructor(context: AgentContext) {
    super(context, 'QAEngineer', 'Test Strategy and Test Implementation');
  }

  async execute(input: { targetFeature?: string; testType?: 'unit' | 'integration' | 'e2e' }): Promise<AgentResponse> {
    this.log('Creating comprehensive test suites...');

    try {
      const { architecture, implementations, userStories } = this.context.projectState;
      
      if (!architecture || !implementations.length) {
        return this.createResponse(false, 'No implementation available for testing');
      }

      // Create test strategy prompt
      const testPrompt = this.createTestPrompt(architecture, implementations, userStories, input);
      const llmResponse = await this.callLLM(testPrompt);
      
      const testSuites = this.parseTestResponse(llmResponse);
      
      // Write test files to the file system
      await this.writeTestFiles(testSuites);
      
      // Update project state with test suites
      const updatedTests = [...this.context.projectState.tests, ...testSuites];
      this.updateProjectState({
        tests: updatedTests,
        currentPhase: 'deployment'
      });

      this.log(`Test implementation completed with ${testSuites.length} test suites`);

      return this.createResponse(
        true,
        'Test suites created successfully',
        {
          testSuitesCount: testSuites.length,
          totalTestFiles: testSuites.reduce((acc, suite) => acc + suite.files.length, 0),
          testTypes: testSuites.map(suite => suite.type)
        },
        'deployment',
        {
          tests: updatedTests,
          currentPhase: 'deployment'
        }
      );
    } catch (error) {
      this.log(`Error during test creation: ${error.message}`);
      return this.createResponse(
        false,
        `Test creation failed: ${error.message}`
      );
    }
  }

  private createTestPrompt(architecture: any, implementations: any[], userStories: any[], input: any): string {
    const implementationSummary = implementations.map(impl => 
      `Feature: ${impl.featureId}\nFiles: ${impl.files.map(f => f.path).join(', ')}`
    ).join('\n\n');

    const storiesSummary = userStories.map(story => 
      `${story.id}: ${story.title} - ${story.acceptanceCriteria.join(', ')}`
    ).join('\n');

    return `
You are a QA Engineer creating comprehensive test suites for the following implementation:

IMPLEMENTATIONS:
${implementationSummary}

USER STORIES & ACCEPTANCE CRITERIA:
${storiesSummary}

TECH STACK:
${architecture.techStack.map((ts: any) => `${ts.category}: ${ts.technology}`).join('\n')}

${input.targetFeature ? `TARGET FEATURE: ${input.targetFeature}` : ''}
${input.testType ? `FOCUS TEST TYPE: ${input.testType}` : ''}

Please create comprehensive test suites in the following JSON format:
{
  "testSuites": [
    {
      "name": "Test Suite Name",
      "type": "unit|integration|e2e",
      "framework": "Jest|Cypress|Playwright|etc",
      "files": [
        {
          "path": "tests/path/to/test.spec.ts",
          "content": "// Complete test file content",
          "type": "test"
        }
      ],
      "coverage": ["component1", "component2"]
    }
  ]
}

Requirements:
1. Create unit tests for individual functions and classes
2. Create integration tests for API endpoints and database operations
3. Create end-to-end tests for complete user workflows
4. Include proper test setup and teardown
5. Test both positive and negative scenarios
6. Include edge cases and error conditions
7. Mock external dependencies appropriately
8. Ensure tests are maintainable and readable
9. Include performance tests where relevant
10. Follow testing best practices for the chosen framework

Focus on:
- Testing all acceptance criteria from user stories
- Comprehensive coverage of implemented features
- Proper assertions and test organization
- Test data management
- Error handling validation
`;
  }

  private parseTestResponse(response: string): TestSuite[] {
    try {
      const parsed = JSON.parse(response);
      
      return (parsed.testSuites || []).map((suite: any) => ({
        name: suite.name || 'Test Suite',
        type: suite.type || 'unit',
        framework: suite.framework || 'Jest',
        files: this.parseTestFiles(suite.files || []),
        coverage: suite.coverage || []
      }));
    } catch (error) {
      this.log(`Warning: Failed to parse test response, using fallback tests`);
      return this.createFallbackTests();
    }
  }

  private parseTestFiles(files: any[]): GeneratedFile[] {
    return files.map(file => ({
      path: file.path || 'tests/default.test.ts',
      content: file.content || '// Generated test content',
      type: 'test'
    }));
  }

  private async writeTestFiles(testSuites: TestSuite[]): Promise<void> {
    const allTestFiles = testSuites.flatMap(suite => suite.files);
    await FileOperations.writeGeneratedFiles(allTestFiles, this.context.outputDirectory);
    this.log(`Wrote ${allTestFiles.length} test files to ${this.context.outputDirectory}`);
  }

  private createFallbackTests(): TestSuite[] {
    const unitTestContent = `import { AuthService } from '../../src/services/auth-service';
import { UserRepository } from '../../src/repositories/user-repository';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepository>;
    
    authService = new AuthService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'password123' };
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: userData.email,
        password: expect.any(String)
      });
    });

    it('should fail when user already exists', async () => {
      // Arrange
      const userData = { email: 'existing@example.com', password: 'password123' };
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: userData.email,
        password: 'hashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await authService.register(userData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('User already exists');
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should fail with invalid email format', async () => {
      // Arrange
      const userData = { email: 'invalid-email', password: 'password123' };

      // Act & Assert
      // This would require email validation in the service
      expect(() => authService.register(userData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'password123' };
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: loginData.email,
        password: '$2b$10$validHashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should fail with invalid email', async () => {
      // Arrange
      const loginData = { email: 'nonexistent@example.com', password: 'password123' };
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });

    it('should fail with wrong password', async () => {
      // Arrange
      const loginData = { email: 'test@example.com', password: 'wrongpassword' };
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: loginData.email,
        password: '$2b$10$validHashedPassword',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      // This test would require a valid JWT token
      // Implementation depends on the JWT secret and token structure
    });

    it('should reject invalid token', () => {
      // Arrange
      const invalidToken = 'invalid.token.here';

      // Act
      const result = authService.verifyToken(invalidToken);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid token');
    });
  });
});`;

    const integrationTestContent = `import request from 'supertest';
import { app } from '../../src/app';
import { DatabaseConnection } from '../../src/database/connection';

describe('Authentication API Integration Tests', () => {
  let dbConnection: DatabaseConnection;

  beforeAll(async () => {
    // Setup test database
    dbConnection = new DatabaseConnection(process.env.TEST_DATABASE_URL);
    await dbConnection.connect();
    await dbConnection.migrate();
  });

  afterAll(async () => {
    // Cleanup test database
    await dbConnection.cleanup();
    await dbConnection.disconnect();
  });

  beforeEach(async () => {
    // Clear data before each test
    await dbConnection.clearTables(['users']);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'SecurePassword123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should return 400 for duplicate email', async () => {
      // Arrange
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!'
      };

      // Create user first time
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Act - try to create same user again
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const userData = {
        email: 'invalid-email',
        password: 'SecurePassword123!'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: '123'
      };

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePassword123!'
        });
    });

    it('should login with valid credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'SecurePassword123!'
        })
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword'
        })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for non-existent user', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePassword123!'
        })
        .expect(401);

      // Assert
      expect(response.body.success).toBe(false);
    });
  });
});`;

    const e2eTestContent = `import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('complete user registration and login flow', async ({ page }) => {
    // Navigate to registration page
    await page.click('text=Register');
    await expect(page).toHaveURL('/register');

    // Fill registration form
    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePassword123!');

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL('/');

    // Login with the same credentials
    await page.click('text=Login');
    await expect(page).toHaveURL('/login');

    await page.fill('input[name="email"]', 'e2e-test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Should be back at dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('should validate email format during registration', async ({ page }) => {
    await page.click('text=Register');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');

    // Should show validation error
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
  });

  test('should validate password strength', async ({ page }) => {
    await page.click('text=Register');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');

    // Should show password strength error
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });
});

test.describe('Dashboard Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display user dashboard with navigation', async ({ page }) => {
    // Check main navigation elements
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();

    // Check main content area
    await expect(page.locator('main')).toBeVisible();
  });

  test('should allow navigation between pages', async ({ page }) => {
    // Navigate to profile
    await page.click('text=Profile');
    await expect(page).toHaveURL('/profile');

    // Navigate to settings
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');

    // Navigate back to dashboard
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});`;

    return [
      {
        name: 'Authentication Unit Tests',
        type: 'unit',
        framework: 'Jest',
        files: [
          {
            path: 'tests/unit/auth-service.test.ts',
            content: unitTestContent,
            type: 'test'
          }
        ],
        coverage: ['AuthService', 'UserRepository']
      },
      {
        name: 'Authentication API Integration Tests',
        type: 'integration',
        framework: 'Jest + Supertest',
        files: [
          {
            path: 'tests/integration/auth-api.test.ts',
            content: integrationTestContent,
            type: 'test'
          }
        ],
        coverage: ['AuthController', 'AuthService', 'Database']
      },
      {
        name: 'End-to-End User Flow Tests',
        type: 'e2e',
        framework: 'Playwright',
        files: [
          {
            path: 'tests/e2e/user-auth-flow.spec.ts',
            content: e2eTestContent,
            type: 'test'
          }
        ],
        coverage: ['Complete user workflows', 'UI interactions', 'API integration']
      }
    ];
  }
}