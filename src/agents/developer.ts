import { LLMService } from '../services/llm.js';
import { Feature, FeatureSchema, Architecture, UserStory, AgentRole } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class DeveloperAgent {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async implementFeature(
    feature: string,
    architecture: Architecture,
    userStories: UserStory[]
  ): Promise<Feature> {
    const systemPrompt = `You are an experienced Software Developer implementing features based on user stories and system architecture.

Key responsibilities:
1. Write clean, production-ready code following best practices
2. Implement features according to user stories and acceptance criteria
3. Follow the defined architecture and technology stack
4. Include proper error handling and validation
5. Write self-documenting code with appropriate comments
6. Ensure code is testable and maintainable
7. Follow security best practices
8. Implement proper logging and monitoring

Guidelines:
- Use the specified technology stack
- Follow coding standards and conventions
- Include comprehensive error handling
- Write unit tests for critical functionality
- Use proper naming conventions
- Include JSDoc/TSDoc comments for functions
- Implement proper input validation
- Follow the defined API contracts
- Consider performance and scalability`;

    const prompt = `Please implement the following feature based on the architecture and user stories:

FEATURE: ${feature}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

USER STORIES:
${JSON.stringify(userStories, null, 2)}

Please implement this feature with:

1. FEATURE IDENTIFICATION:
   - id: unique identifier
   - name: descriptive feature name
   - description: detailed feature description

2. FILE IMPLEMENTATIONS:
   - Array of files with path, content, and type
   - Include all necessary code files
   - Follow the project structure defined in architecture
   - Use the specified technology stack

3. DEPENDENCIES:
   - Array of feature IDs this depends on (if any)

4. TESTS:
   - Array of test files with path, content, and type
   - Include unit tests, integration tests, and e2e tests as appropriate

Focus on:
1. Clean, readable code
2. Proper error handling
3. Input validation
4. Security considerations
5. Performance optimization
6. Testability
7. Documentation

Respond with a JSON object matching the Feature schema.`;

    try {
      const featureImplementation = await this.llm.generateStructuredResponse<Feature>(
        prompt,
        FeatureSchema,
        systemPrompt,
        0.3
      );

      // Add ID if not provided
      return {
        ...featureImplementation,
        id: featureImplementation.id || uuidv4()
      };
    } catch (error) {
      console.error('Developer Agent - Feature implementation failed:', error);
      throw new Error(`Failed to implement feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateBackendCode(
    apiSpec: any,
    architecture: Architecture,
    featureName: string
  ): Promise<string> {
    const systemPrompt = `You are a backend developer creating production-ready code for API endpoints.

Your role is to:
1. Implement RESTful API endpoints
2. Include proper error handling and validation
3. Follow the specified technology stack
4. Implement security best practices
5. Add comprehensive logging
6. Include input validation and sanitization`;

    const prompt = `Please generate backend code for the following API specification:

API SPEC:
${JSON.stringify(apiSpec, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

FEATURE: ${featureName}

Please generate:
1. Route handler implementation
2. Input validation middleware
3. Error handling
4. Database operations (if applicable)
5. Response formatting
6. Logging and monitoring

Use the backend technology: ${architecture.techStack.backend.join(', ')}
Database: ${architecture.techStack.database}

Generate clean, production-ready code with proper error handling and validation.`;

    try {
      return await this.llm.generateCode(prompt, 'javascript', systemPrompt);
    } catch (error) {
      console.error('Developer Agent - Backend code generation failed:', error);
      throw new Error(`Failed to generate backend code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateFrontendCode(
    feature: string,
    architecture: Architecture,
    apiSpecs: any[]
  ): Promise<string> {
    const systemPrompt = `You are a frontend developer creating production-ready UI components and pages.

Your role is to:
1. Create responsive and accessible UI components
2. Implement proper state management
3. Handle API calls and error states
4. Follow the specified frontend technology stack
5. Implement proper form validation
6. Add loading states and user feedback
7. Ensure accessibility compliance`;

    const prompt = `Please generate frontend code for the following feature:

FEATURE: ${feature}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

API SPECS:
${JSON.stringify(apiSpecs, null, 2)}

Please generate:
1. React/Vue component implementation
2. State management (if needed)
3. API integration
4. Form handling and validation
5. Error handling and user feedback
6. Loading states
7. Responsive design considerations

Use the frontend technology: ${architecture.techStack.frontend.join(', ')}

Generate clean, production-ready code with proper error handling and user experience.`;

    try {
      const frontendTech = architecture.techStack.frontend[0]?.toLowerCase();
      const language = frontendTech?.includes('react') ? 'jsx' : 
                      frontendTech?.includes('vue') ? 'vue' : 
                      frontendTech?.includes('angular') ? 'typescript' : 'javascript';
      
      return await this.llm.generateCode(prompt, language, systemPrompt);
    } catch (error) {
      console.error('Developer Agent - Frontend code generation failed:', error);
      throw new Error(`Failed to generate frontend code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDatabaseCode(
    tableSchema: any,
    architecture: Architecture,
    featureName: string
  ): Promise<string> {
    const systemPrompt = `You are a database developer creating database operations and migrations.

Your role is to:
1. Create database models/schemas
2. Implement CRUD operations
3. Handle database connections
4. Include proper error handling
5. Implement data validation
6. Add database indexes for performance`;

    const prompt = `Please generate database code for the following table schema:

TABLE SCHEMA:
${JSON.stringify(tableSchema, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

FEATURE: ${featureName}

Please generate:
1. Database model/schema definition
2. CRUD operations
3. Database connection setup
4. Migration scripts (if applicable)
5. Index creation
6. Data validation

Database: ${architecture.techStack.database}
Backend: ${architecture.techStack.backend.join(', ')}

Generate clean, production-ready database code with proper error handling and performance optimization.`;

    try {
      const language = architecture.techStack.database === 'mongodb' ? 'javascript' : 'sql';
      return await this.llm.generateCode(prompt, language, systemPrompt);
    } catch (error) {
      console.error('Developer Agent - Database code generation failed:', error);
      throw new Error(`Failed to generate database code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateTests(
    feature: Feature,
    architecture: Architecture
  ): Promise<Feature> {
    const systemPrompt = `You are a developer creating comprehensive test suites for features.

Your role is to:
1. Write unit tests for individual functions
2. Create integration tests for API endpoints
3. Implement end-to-end tests for user workflows
4. Ensure good test coverage
5. Use proper testing frameworks
6. Include test data and mocks`;

    const prompt = `Please generate comprehensive tests for the following feature:

FEATURE:
${JSON.stringify(feature, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please generate:
1. Unit tests for individual functions
2. Integration tests for API endpoints
3. End-to-end tests for user workflows
4. Test utilities and helpers
5. Mock data and fixtures

Testing frameworks to use:
- Unit tests: Jest/Mocha
- Integration tests: Supertest
- E2E tests: Playwright/Cypress

Generate comprehensive test suites with good coverage and proper test organization.`;

    try {
      const testFeature = await this.llm.generateStructuredResponse<Feature>(
        prompt,
        FeatureSchema,
        systemPrompt,
        0.3
      );

      // Merge tests with existing feature
      return {
        ...feature,
        tests: testFeature.tests || []
      };
    } catch (error) {
      console.error('Developer Agent - Test generation failed:', error);
      throw new Error(`Failed to generate tests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refactorCode(
    feature: Feature,
    feedback?: string,
    improvements?: string[]
  ): Promise<Feature> {
    const systemPrompt = `You are a developer refactoring code based on feedback and improvement suggestions.

Your role is to:
1. Improve code quality and readability
2. Address performance issues
3. Fix security vulnerabilities
4. Enhance error handling
5. Improve test coverage
6. Follow best practices`;

    const prompt = `Please refactor the following feature based on feedback and improvements:

FEATURE:
${JSON.stringify(feature, null, 2)}

FEEDBACK:
${feedback || 'No specific feedback provided. Please review and improve the code quality.'}

IMPROVEMENTS:
${improvements ? improvements.join('\n') : 'No specific improvements requested.'}

Please refactor by:
1. Improving code quality and readability
2. Addressing performance issues
3. Fixing security vulnerabilities
4. Enhancing error handling
5. Improving test coverage
6. Following best practices

Respond with the refactored feature implementation.`;

    try {
      return await this.llm.generateStructuredResponse<Feature>(
        prompt,
        FeatureSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Developer Agent - Code refactoring failed:', error);
      throw new Error(`Failed to refactor code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateFeature(feature: Feature): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate feature structure
    if (!feature.id || !feature.name || !feature.description) {
      issues.push('Feature missing required fields (id, name, description)');
    }

    // Validate files
    if (!feature.files || feature.files.length === 0) {
      issues.push('Feature has no implementation files');
    } else {
      for (const file of feature.files) {
        if (!file.path || !file.content || !file.type) {
          issues.push(`File missing required fields: ${JSON.stringify(file)}`);
        }
      }
    }

    // Check for common code quality issues
    const codeQualityIssues = this.checkCodeQuality(feature);
    issues.push(...codeQualityIssues);

    // Validate tests
    if (feature.tests) {
      for (const test of feature.tests) {
        if (!test.path || !test.content || !test.type) {
          issues.push(`Test missing required fields: ${JSON.stringify(test)}`);
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private checkCodeQuality(feature: Feature): string[] {
    const issues: string[] = [];

    for (const file of feature.files) {
      const content = file.content;

      // Check for basic code quality issues
      if (content.includes('console.log(') && !content.includes('// TODO: Remove console.log')) {
        issues.push(`File ${file.path}: Contains console.log statements that should be removed`);
      }

      if (content.includes('TODO:') || content.includes('FIXME:')) {
        issues.push(`File ${file.path}: Contains TODO/FIXME comments`);
      }

      if (content.includes('password') && content.includes('hardcoded')) {
        issues.push(`File ${file.path}: Contains hardcoded credentials`);
      }

      if (content.includes('eval(') || content.includes('innerHTML')) {
        issues.push(`File ${file.path}: Contains potentially unsafe code`);
      }

      // Check for proper error handling
      if (file.type === 'code' && !content.includes('try') && !content.includes('catch')) {
        if (content.includes('async') || content.includes('Promise')) {
          issues.push(`File ${file.path}: Async code should include proper error handling`);
        }
      }
    }

    return issues;
  }
}