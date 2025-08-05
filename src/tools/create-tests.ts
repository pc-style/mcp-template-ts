import { z } from 'zod';
import { QAEngineer } from '../agents/qa-engineer.js';
import { AgentContext, ArchitectureDesign, FeatureImplementation, UserStory } from '../types/shared.js';

export const createTestsSchema = z.object({
  architecture: z.object({
    overview: z.string(),
    components: z.array(z.any()),
    dataFlow: z.string(),
    apiSpecs: z.array(z.any()),
    databaseSchema: z.array(z.any()),
    techStack: z.array(z.any())
  }).describe('System architecture design'),
  implementations: z.array(z.object({
    featureId: z.string(),
    files: z.array(z.object({
      path: z.string(),
      content: z.string(),
      type: z.string()
    })),
    dependencies: z.array(z.string()),
    testFiles: z.array(z.any()),
    documentation: z.string()
  })).describe('Implemented features to test'),
  userStories: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    estimatedEffort: z.number(),
    priority: z.enum(['high', 'medium', 'low']),
    dependencies: z.array(z.string())
  })).describe('User stories with acceptance criteria'),
  outputDirectory: z.string().describe('Output directory for test files'),
  testType: z.enum(['unit', 'integration', 'e2e']).optional().describe('Specific type of tests to focus on'),
  targetFeature: z.string().optional().describe('Specific feature to create tests for')
});

export async function createTests(args: z.infer<typeof createTestsSchema>) {
  try {
    // Initialize agent context
    const context: AgentContext = {
      projectState: {
        requirements: [],
        userStories: args.userStories as UserStory[],
        architecture: args.architecture as ArchitectureDesign,
        implementations: args.implementations as FeatureImplementation[],
        tests: [],
        deployment: null,
        currentPhase: 'testing',
        decisions: {}
      },
      outputDirectory: args.outputDirectory
    };

    // Create and execute QA Engineer agent
    const qaEngineer = new QAEngineer(context);
    const result = await qaEngineer.execute({
      targetFeature: args.targetFeature,
      testType: args.testType
    });

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: result.message,
              data: {
                testSuites: context.projectState.tests,
                summary: {
                  testSuitesCount: context.projectState.tests.length,
                  totalTestFiles: context.projectState.tests.reduce((acc, suite) => acc + suite.files.length, 0),
                  testTypes: [...new Set(context.projectState.tests.map(suite => suite.type))],
                  frameworks: [...new Set(context.projectState.tests.map(suite => suite.framework))],
                  coverageAreas: context.projectState.tests.flatMap(suite => suite.coverage)
                },
                generatedTestFiles: context.projectState.tests.flatMap(suite => 
                  suite.files.map(file => ({
                    suiteName: suite.name,
                    testType: suite.type,
                    framework: suite.framework,
                    path: file.path,
                    size: file.content.length
                  }))
                )
              }
            }, null, 2)
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: result.message
            }, null, 2)
          }
        ]
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `Test creation failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}