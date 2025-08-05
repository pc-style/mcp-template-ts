import { LLMService } from '../services/llm.js';
import { TestPlan, TestPlanSchema, Feature, Architecture, AgentRole } from '../types.js';

export class QAEngineerAgent {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async createTestPlan(
    features: Feature[],
    architecture: Architecture
  ): Promise<TestPlan> {
    const systemPrompt = `You are an experienced QA Engineer creating comprehensive test plans and test suites.

Key responsibilities:
1. Create comprehensive test strategies
2. Design test cases covering all scenarios
3. Write unit, integration, and end-to-end tests
4. Ensure proper test coverage
5. Create test data and fixtures
6. Design performance and security tests
7. Implement automated testing frameworks
8. Ensure quality gates and validation

Guidelines:
- Cover all user stories and acceptance criteria
- Include positive and negative test cases
- Test edge cases and error conditions
- Ensure proper test isolation
- Use appropriate testing frameworks
- Create reusable test utilities
- Include performance and security testing
- Document test procedures and expected results`;

    const prompt = `Please create a comprehensive test plan for the following features and architecture:

FEATURES:
${JSON.stringify(features, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please create a test plan with:

1. UNIT TESTS:
   - Array of test files with comprehensive unit tests
   - Test individual functions and components
   - Include edge cases and error conditions
   - Use appropriate testing frameworks

2. INTEGRATION TESTS:
   - Array of integration tests for API endpoints
   - Test database operations and external services
   - Verify data flow between components
   - Test authentication and authorization

3. END-TO-END TESTS:
   - Array of e2e tests for complete user workflows
   - Test full user journeys from start to finish
   - Verify UI interactions and API integrations
   - Test cross-browser compatibility

Focus on:
1. Complete test coverage
2. Edge cases and error conditions
3. Performance testing
4. Security testing
5. Accessibility testing
6. Cross-platform compatibility
7. Data validation
8. Error handling

Respond with a JSON object matching the TestPlan schema.`;

    try {
      return await this.llm.generateStructuredResponse<TestPlan>(
        prompt,
        TestPlanSchema,
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('QA Engineer Agent - Test plan creation failed:', error);
      throw new Error(`Failed to create test plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateUnitTests(
    feature: Feature,
    architecture: Architecture
  ): Promise<string[]> {
    const systemPrompt = `You are a QA Engineer creating comprehensive unit tests for features.

Your role is to:
1. Write unit tests for individual functions
2. Test all code paths and branches
3. Include edge cases and error conditions
4. Use proper testing frameworks
5. Create mock data and fixtures
6. Ensure test isolation`;

    const unitTests: string[] = [];

    for (const file of feature.files) {
      if (file.type === 'code') {
        const prompt = `Please generate comprehensive unit tests for the following code:

CODE FILE: ${file.path}
CONTENT:
${file.content}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

FEATURE: ${feature.name}

Please generate:
1. Unit tests for all functions
2. Test edge cases and error conditions
3. Mock external dependencies
4. Test data validation
5. Error handling tests
6. Performance tests where applicable

Use the testing framework appropriate for the technology stack.
Generate clean, comprehensive unit tests with proper assertions and error handling.`;

        try {
          const testCode = await this.llm.generateCode(prompt, 'javascript', systemPrompt);
          unitTests.push(testCode);
        } catch (error) {
          console.error(`QA Engineer Agent - Unit test generation failed for ${file.path}:`, error);
        }
      }
    }

    return unitTests;
  }

  async generateIntegrationTests(
    features: Feature[],
    architecture: Architecture
  ): Promise<string[]> {
    const systemPrompt = `You are a QA Engineer creating integration tests for API endpoints and database operations.

Your role is to:
1. Test API endpoints and their responses
2. Verify database operations and data integrity
3. Test authentication and authorization
4. Validate request/response schemas
5. Test error handling and status codes
6. Ensure proper data flow between components`;

    const prompt = `Please generate comprehensive integration tests for the following features and architecture:

FEATURES:
${JSON.stringify(features, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please generate:
1. API endpoint tests for all routes
2. Database integration tests
3. Authentication and authorization tests
4. Request/response validation tests
5. Error handling tests
6. Performance tests for API endpoints

Use Supertest or similar framework for API testing.
Generate comprehensive integration tests with proper setup and teardown.`;

    try {
      const integrationTests = await this.llm.generateCode(prompt, 'javascript', systemPrompt);
      return [integrationTests];
    } catch (error) {
      console.error('QA Engineer Agent - Integration test generation failed:', error);
      return [];
    }
  }

  async generateE2ETests(
    features: Feature[],
    architecture: Architecture
  ): Promise<string[]> {
    const systemPrompt = `You are a QA Engineer creating end-to-end tests for complete user workflows.

Your role is to:
1. Test complete user journeys
2. Verify UI interactions and API integrations
3. Test cross-browser compatibility
4. Validate user experience flows
5. Test accessibility features
6. Ensure responsive design functionality`;

    const prompt = `Please generate comprehensive end-to-end tests for the following features and architecture:

FEATURES:
${JSON.stringify(features, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please generate:
1. Complete user workflow tests
2. UI interaction tests
3. Form submission and validation tests
4. Navigation and routing tests
5. Cross-browser compatibility tests
6. Accessibility tests
7. Responsive design tests

Use Playwright or Cypress for e2e testing.
Generate comprehensive e2e tests covering all user scenarios.`;

    try {
      const e2eTests = await this.llm.generateCode(prompt, 'javascript', systemPrompt);
      return [e2eTests];
    } catch (error) {
      console.error('QA Engineer Agent - E2E test generation failed:', error);
      return [];
    }
  }

  async createPerformanceTests(
    features: Feature[],
    architecture: Architecture
  ): Promise<string[]> {
    const systemPrompt = `You are a QA Engineer creating performance tests for features and API endpoints.

Your role is to:
1. Test API response times and throughput
2. Verify database query performance
3. Test concurrent user scenarios
4. Validate memory usage and resource consumption
5. Test load handling capabilities
6. Identify performance bottlenecks`;

    const prompt = `Please generate performance tests for the following features and architecture:

FEATURES:
${JSON.stringify(features, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please generate:
1. API performance tests
2. Database performance tests
3. Load testing scenarios
4. Stress testing scenarios
5. Memory usage tests
6. Response time benchmarks

Use Artillery, k6, or similar performance testing tools.
Generate comprehensive performance tests with proper metrics and thresholds.`;

    try {
      const performanceTests = await this.llm.generateCode(prompt, 'javascript', systemPrompt);
      return [performanceTests];
    } catch (error) {
      console.error('QA Engineer Agent - Performance test generation failed:', error);
      return [];
    }
  }

  async createSecurityTests(
    features: Feature[],
    architecture: Architecture
  ): Promise<string[]> {
    const systemPrompt = `You are a QA Engineer creating security tests for features and API endpoints.

Your role is to:
1. Test authentication and authorization
2. Validate input sanitization and validation
3. Test for common security vulnerabilities
4. Verify data encryption and protection
5. Test access control and permissions
6. Validate secure communication protocols`;

    const prompt = `Please generate security tests for the following features and architecture:

FEATURES:
${JSON.stringify(features, null, 2)}

ARCHITECTURE:
${JSON.stringify(architecture, null, 2)}

Please generate:
1. Authentication and authorization tests
2. Input validation and sanitization tests
3. SQL injection tests
4. XSS prevention tests
5. CSRF protection tests
6. Access control tests
7. Data encryption tests

Use OWASP testing guidelines.
Generate comprehensive security tests covering common vulnerabilities.`;

    try {
      const securityTests = await this.llm.generateCode(prompt, 'javascript', systemPrompt);
      return [securityTests];
    } catch (error) {
      console.error('QA Engineer Agent - Security test generation failed:', error);
      return [];
    }
  }

  async validateTestPlan(testPlan: TestPlan): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate unit tests
    if (!testPlan.unitTests || testPlan.unitTests.length === 0) {
      issues.push('No unit tests defined');
    } else {
      for (const unitTest of testPlan.unitTests) {
        if (!unitTest.file || !unitTest.tests || unitTest.tests.length === 0) {
          issues.push(`Unit test missing required fields: ${JSON.stringify(unitTest)}`);
        }
      }
    }

    // Validate integration tests
    if (!testPlan.integrationTests || testPlan.integrationTests.length === 0) {
      issues.push('No integration tests defined');
    } else {
      for (const integrationTest of testPlan.integrationTests) {
        if (!integrationTest.name || !integrationTest.description || !integrationTest.code) {
          issues.push(`Integration test missing required fields: ${JSON.stringify(integrationTest)}`);
        }
      }
    }

    // Validate e2e tests
    if (!testPlan.e2eTests || testPlan.e2eTests.length === 0) {
      issues.push('No end-to-end tests defined');
    } else {
      for (const e2eTest of testPlan.e2eTests) {
        if (!e2eTest.name || !e2eTest.description || !e2eTest.code) {
          issues.push(`E2E test missing required fields: ${JSON.stringify(e2eTest)}`);
        }
      }
    }

    // Check for test coverage completeness
    const coverageIssues = this.checkTestCoverage(testPlan);
    issues.push(...coverageIssues);

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private checkTestCoverage(testPlan: TestPlan): string[] {
    const issues: string[] = [];

    // Check if tests cover common scenarios
    const unitTestContent = testPlan.unitTests.map(ut => ut.tests.map(t => t.name).join(' ')).join(' ');
    const integrationTestContent = testPlan.integrationTests.map(it => it.name).join(' ');
    const e2eTestContent = testPlan.e2eTests.map(et => et.name).join(' ');

    const allTestContent = `${unitTestContent} ${integrationTestContent} ${e2eTestContent}`.toLowerCase();

    // Check for common test scenarios
    const requiredTestScenarios = [
      'error', 'validation', 'authentication', 'authorization', 'input', 'output',
      'success', 'failure', 'edge', 'boundary', 'performance', 'security'
    ];

    for (const scenario of requiredTestScenarios) {
      if (!allTestContent.includes(scenario)) {
        issues.push(`Missing tests for ${scenario} scenarios`);
      }
    }

    return issues;
  }

  async createTestDocumentation(testPlan: TestPlan): Promise<string> {
    const systemPrompt = `You are a QA Engineer creating comprehensive test documentation.

Your role is to:
1. Document test strategies and approaches
2. Explain test scenarios and coverage
3. Provide test execution instructions
4. Document test data and fixtures
5. Explain test environment setup
6. Provide troubleshooting guides`;

    const prompt = `Please create comprehensive test documentation for the following test plan:

TEST PLAN:
${JSON.stringify(testPlan, null, 2)}

Please create documentation covering:
1. Test Strategy Overview
2. Test Environment Setup
3. Test Execution Instructions
4. Test Data Management
5. Test Coverage Analysis
6. Performance Testing Guidelines
7. Security Testing Approach
8. Troubleshooting Guide
9. Test Reporting
10. Continuous Integration Setup

Format the documentation in Markdown with clear sections and examples.`;

    try {
      const response = await this.llm.generateResponse(prompt, systemPrompt, 0.3);
      return response.content;
    } catch (error) {
      console.error('QA Engineer Agent - Test documentation creation failed:', error);
      throw new Error(`Failed to create test documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}