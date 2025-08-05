import { BaseAgent } from './base-agent.js';
import { AgentTask, TestSuite, CodeFile, TestSuiteSchema, CodeFileSchema } from '../types.js';
import { FileSystemService } from '../services/filesystem.js';
import path from 'path';

export class QAEngineerAgent extends BaseAgent {
  private fs: FileSystemService;

  constructor(context: any) {
    super('qa_engineer', context);
    this.fs = new FileSystemService();
  }

  protected getRoleResponsibilities(): string {
    return `- Create comprehensive test plans and strategies
- Write unit, integration, and end-to-end tests
- Ensure high test coverage and quality
- Perform manual and automated testing
- Identify and report bugs and issues
- Validate requirements and user stories
- Ensure software quality and reliability
- Create test documentation and reports`;
  }

  async execute(task: AgentTask): Promise<any> {
    this.logTaskStart(task);

    try {
      switch (task.title.toLowerCase()) {
        case 'create_test_plan':
          return await this.createTestPlan(task);
        case 'write_unit_tests':
          return await this.writeUnitTests(task);
        case 'write_integration_tests':
          return await this.writeIntegrationTests(task);
        case 'write_e2e_tests':
          return await this.writeE2ETests(task);
        case 'run_test_suite':
          return await this.runTestSuite(task);
        case 'generate_test_report':
          return await this.generateTestReport(task);
        case 'validate_requirements':
          return await this.validateRequirements(task);
        default:
          throw new Error(`Unknown task: ${task.title}`);
      }
    } catch (error) {
      this.logTaskError(task, error as Error);
      throw error;
    }
  }

  private async createTestPlan(task: AgentTask): Promise<{ test_plan: any }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;
    const features = this.context.features;
    const techStack = this.context.tech_stack;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available before creating test plan');
    }

    const prompt = `Create a comprehensive test plan for the following project:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Features:
${JSON.stringify(features, null, 2)}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Create a detailed test plan that includes:
1. Test strategy and approach
2. Test types (unit, integration, e2e, performance, security)
3. Test environment requirements
4. Test data requirements
5. Test tools and frameworks
6. Test schedule and milestones
7. Risk assessment and mitigation
8. Success criteria and metrics
9. Test automation strategy
10. Manual testing procedures

Focus on ensuring comprehensive coverage and quality assurance.`;

    const testPlan = await this.generateResponse(prompt);

    this.addDecision(
      'Test Plan Created',
      'Comprehensive test plan has been developed',
      'Test plan provides roadmap for quality assurance activities'
    );

    // Create test plan documentation
    await this.createTestPlanDocumentation(testPlan);

    this.logTaskComplete(task, { test_plan: testPlan });
    return { test_plan: testPlan };
  }

  private async writeUnitTests(task: AgentTask): Promise<{ test_suites: TestSuite[] }> {
    const features = this.context.features;
    const techStack = this.context.tech_stack;
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!features || features.length === 0) {
      throw new Error('Features must be available before writing unit tests');
    }

    const prompt = `Write comprehensive unit tests for the following features:

Features:
${JSON.stringify(features, null, 2)}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Create unit tests that include:
1. Test setup and teardown
2. Mocking and stubbing
3. Edge cases and error scenarios
4. Positive and negative test cases
5. Test utilities and helpers
6. Test configuration files
7. Coverage reporting setup

Focus on:
- High test coverage (aim for 90%+)
- Meaningful test cases
- Proper isolation and mocking
- Clear test descriptions
- Performance considerations
- Maintainable test code`;

    const testSuites = await this.generateStructuredResponse<TestSuite[]>(
      prompt,
      TestSuiteSchema.array(),
      [
        {
          name: 'Authentication Unit Tests',
          type: 'unit',
          files: [
            {
              path: 'tests/unit/auth/auth.service.test.ts',
              content: '// Authentication service unit tests',
              language: 'typescript',
              purpose: 'Unit tests for authentication service'
            }
          ],
          coverage_target: 90
        }
      ]
    );

    // Write the actual test files
    for (const suite of testSuites) {
      for (const file of suite.files) {
        const fullPath = path.join(projectPath, file.path);
        await this.fs.writeFile(fullPath, file.content);
        this.addArtifact(`Unit Test: ${file.path}`, file.language, fullPath);
      }
    }

    this.updateContext({ 
      test_suites: [...(this.context.test_suites || []), ...testSuites] 
    });

    this.addDecision(
      'Unit Tests Created',
      `Created ${testSuites.length} unit test suites`,
      'Unit tests ensure code quality and prevent regressions'
    );

    this.logTaskComplete(task, { test_suites: testSuites.length });
    return { test_suites: testSuites };
  }

  private async writeIntegrationTests(task: AgentTask): Promise<{ test_suites: TestSuite[] }> {
    const features = this.context.features;
    const apiSpecs = this.context.api_specs;
    const techStack = this.context.tech_stack;
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!features || features.length === 0) {
      throw new Error('Features must be available before writing integration tests');
    }

    const prompt = `Write comprehensive integration tests for the following features and APIs:

Features:
${JSON.stringify(features, null, 2)}

API Specifications:
${JSON.stringify(apiSpecs, null, 2)}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Create integration tests that include:
1. API endpoint testing
2. Database integration testing
3. External service integration testing
4. Authentication and authorization testing
5. Error handling and edge cases
6. Performance testing
7. Test data setup and cleanup
8. Test environment configuration

Focus on:
- End-to-end workflow testing
- Real-world scenarios
- Error conditions and recovery
- Performance under load
- Security testing
- Data integrity validation`;

    const testSuites = await this.generateStructuredResponse<TestSuite[]>(
      prompt,
      TestSuiteSchema.array(),
      [
        {
          name: 'API Integration Tests',
          type: 'integration',
          files: [
            {
              path: 'tests/integration/api/auth.test.ts',
              content: '// Authentication API integration tests',
              language: 'typescript',
              purpose: 'Integration tests for authentication API'
            }
          ],
          coverage_target: 85
        }
      ]
    );

    // Write the actual test files
    for (const suite of testSuites) {
      for (const file of suite.files) {
        const fullPath = path.join(projectPath, file.path);
        await this.fs.writeFile(fullPath, file.content);
        this.addArtifact(`Integration Test: ${file.path}`, file.language, fullPath);
      }
    }

    this.updateContext({ 
      test_suites: [...(this.context.test_suites || []), ...testSuites] 
    });

    this.addDecision(
      'Integration Tests Created',
      `Created ${testSuites.length} integration test suites`,
      'Integration tests validate system components work together'
    );

    this.logTaskComplete(task, { test_suites: testSuites.length });
    return { test_suites: testSuites };
  }

  private async writeE2ETests(task: AgentTask): Promise<{ test_suites: TestSuite[] }> {
    const userStories = this.context.user_stories;
    const features = this.context.features;
    const techStack = this.context.tech_stack;
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!userStories || userStories.length === 0) {
      throw new Error('User stories must be available before writing e2e tests');
    }

    const prompt = `Write comprehensive end-to-end tests based on the following user stories:

User Stories:
${JSON.stringify(userStories, null, 2)}

Features:
${JSON.stringify(features, null, 2)}

Technology Stack:
${JSON.stringify(techStack, null, 2)}

Create e2e tests that include:
1. Complete user journey testing
2. UI/UX testing
3. Cross-browser compatibility testing
4. Mobile responsiveness testing
5. Accessibility testing
6. Performance testing
7. Security testing
8. Error handling and recovery

Focus on:
- Real user scenarios
- Complete workflows
- User experience validation
- Cross-platform compatibility
- Performance under realistic conditions
- Security and privacy testing`;

    const testSuites = await this.generateStructuredResponse<TestSuite[]>(
      prompt,
      TestSuiteSchema.array(),
      [
        {
          name: 'User Journey E2E Tests',
          type: 'e2e',
          files: [
            {
              path: 'tests/e2e/user-journey/authentication.test.ts',
              content: '// User authentication journey e2e tests',
              language: 'typescript',
              purpose: 'End-to-end tests for user authentication flow'
            }
          ],
          coverage_target: 80
        }
      ]
    );

    // Write the actual test files
    for (const suite of testSuites) {
      for (const file of suite.files) {
        const fullPath = path.join(projectPath, file.path);
        await this.fs.writeFile(fullPath, file.content);
        this.addArtifact(`E2E Test: ${file.path}`, file.language, fullPath);
      }
    }

    this.updateContext({ 
      test_suites: [...(this.context.test_suites || []), ...testSuites] 
    });

    this.addDecision(
      'E2E Tests Created',
      `Created ${testSuites.length} e2e test suites`,
      'E2E tests validate complete user workflows and system behavior'
    );

    this.logTaskComplete(task, { test_suites: testSuites.length });
    return { test_suites: testSuites };
  }

  private async runTestSuite(task: AgentTask): Promise<{ test_results: any }> {
    const testSuiteName = task.result?.test_suite_name;
    const projectPath = task.result?.project_path || `${this.context.id}`;

    if (!testSuiteName) {
      throw new Error('Test suite name is required for running tests');
    }

    const testSuite = this.context.test_suites?.find((ts: TestSuite) => ts.name === testSuiteName);
    if (!testSuite) {
      throw new Error(`Test suite not found: ${testSuiteName}`);
    }

    const prompt = `Run the following test suite and provide detailed results:

Test Suite: ${testSuite.name}
Type: ${testSuite.type}
Files: ${testSuite.files.map(f => f.path).join(', ')}

Project Path: ${projectPath}

Provide test execution results including:
1. Test execution status
2. Pass/fail statistics
3. Test coverage metrics
4. Performance metrics
5. Error details and stack traces
6. Recommendations for improvements
7. Test execution time
8. Resource usage statistics`;

    const testResults = await this.generateResponse(prompt);

    this.addDecision(
      'Test Suite Execution Complete',
      `Executed test suite: ${testSuiteName}`,
      'Test execution validates code quality and functionality'
    );

    // Create test results documentation
    await this.createTestResultsDocumentation(testSuite, testResults);

    this.logTaskComplete(task, { test_results: testResults });
    return { test_results: testResults };
  }

  private async generateTestReport(task: AgentTask): Promise<{ test_report: any }> {
    const testSuites = this.context.test_suites;
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;

    if (!testSuites || testSuites.length === 0) {
      throw new Error('Test suites must be available before generating test report');
    }

    const prompt = `Generate a comprehensive test report based on the following:

Test Suites:
${JSON.stringify(testSuites, null, 2)}

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Create a detailed test report that includes:
1. Executive summary
2. Test coverage analysis
3. Test execution results
4. Quality metrics and KPIs
5. Defect analysis and trends
6. Risk assessment
7. Recommendations
8. Test automation status
9. Performance test results
10. Security test results

Focus on providing actionable insights and clear recommendations.`;

    const testReport = await this.generateResponse(prompt);

    this.addDecision(
      'Test Report Generated',
      'Comprehensive test report has been created',
      'Test report provides insights into software quality and testing effectiveness'
    );

    // Create test report documentation
    await this.createTestReportDocumentation(testReport);

    this.logTaskComplete(task, { test_report: testReport });
    return { test_report: testReport };
  }

  private async validateRequirements(task: AgentTask): Promise<{ validation_results: any }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;
    const testSuites = this.context.test_suites;

    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be available for validation');
    }

    const prompt = `Validate the following requirements and user stories against the test coverage:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Test Suites:
${JSON.stringify(testSuites, null, 2)}

Validate for:
1. Requirement testability
2. Test coverage completeness
3. Acceptance criteria validation
4. Edge case coverage
5. Performance requirements
6. Security requirements
7. Usability requirements
8. Accessibility requirements

Provide validation results with:
- Coverage analysis
- Missing test scenarios
- Recommendations for improvement
- Quality assessment
- Risk identification`;

    const validationResults = await this.generateResponse(prompt);

    this.addDecision(
      'Requirements Validation Complete',
      'Requirements have been validated against test coverage',
      'Validation ensures all requirements are properly tested'
    );

    this.logTaskComplete(task, { validation_results: validationResults });
    return { validation_results: validationResults };
  }

  private async createTestPlanDocumentation(testPlan: string): Promise<void> {
    const docsPath = `${this.context.id}/docs/testing`;
    await this.fs.ensureDirectory(docsPath);

    const testPlanDoc = `# Test Plan

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Test Plan Overview

${testPlan}

## Test Strategy

This document outlines the comprehensive testing strategy for the ${this.context.name} project.
`;

    await this.fs.writeFile(`${docsPath}/test-plan.md`, testPlanDoc);
    this.addArtifact('Test Plan Document', 'markdown', `${docsPath}/test-plan.md`);
  }

  private async createTestResultsDocumentation(testSuite: TestSuite, testResults: string): Promise<void> {
    const docsPath = `${this.context.id}/docs/testing/results`;
    await this.fs.ensureDirectory(docsPath);

    const resultsDoc = `# Test Results: ${testSuite.name}

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}
**Test Suite:** ${testSuite.name}
**Type:** ${testSuite.type}

## Test Results

${testResults}

## Test Coverage

Target Coverage: ${testSuite.coverage_target || 80}%
`;

    await this.fs.writeFile(`${docsPath}/${testSuite.name.toLowerCase().replace(/\s+/g, '-')}-results.md`, resultsDoc);
    this.addArtifact(`Test Results: ${testSuite.name}`, 'markdown', `${docsPath}/${testSuite.name.toLowerCase().replace(/\s+/g, '-')}-results.md`);
  }

  private async createTestReportDocumentation(testReport: string): Promise<void> {
    const docsPath = `${this.context.id}/docs/testing`;
    await this.fs.ensureDirectory(docsPath);

    const reportDoc = `# Test Report

**Project:** ${this.context.name}
**Date:** ${new Date().toISOString().split('T')[0]}

## Test Report

${testReport}

## Quality Metrics

This report provides comprehensive insights into the testing effectiveness and software quality.
`;

    await this.fs.writeFile(`${docsPath}/test-report.md`, reportDoc);
    this.addArtifact('Test Report Document', 'markdown', `${docsPath}/test-report.md`);
  }
}