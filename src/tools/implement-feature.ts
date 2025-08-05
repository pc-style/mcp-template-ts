import { z } from 'zod';
import { Developer } from '../agents/developer.js';
import { AgentContext, ArchitectureDesign } from '../types/shared.js';

export const implementFeatureSchema = z.object({
  featureId: z.string().describe('Unique identifier for the feature to implement'),
  userStoryId: z.string().optional().describe('Related user story ID'),
  architecture: z.object({
    overview: z.string(),
    components: z.array(z.any()),
    dataFlow: z.string(),
    apiSpecs: z.array(z.any()),
    databaseSchema: z.array(z.any()),
    techStack: z.array(z.any())
  }).describe('System architecture design'),
  outputDirectory: z.string().describe('Output directory for generated code files'),
  existingImplementations: z.array(z.object({
    featureId: z.string(),
    files: z.array(z.object({
      path: z.string(),
      content: z.string(),
      type: z.string()
    })),
    dependencies: z.array(z.string()),
    testFiles: z.array(z.any()),
    documentation: z.string()
  })).optional().describe('Previously implemented features')
});

export async function implementFeature(args: z.infer<typeof implementFeatureSchema>) {
  try {
    // Initialize agent context
    const context: AgentContext = {
      projectState: {
        requirements: [],
        userStories: [],
        architecture: args.architecture as ArchitectureDesign,
        implementations: args.existingImplementations || [],
        tests: [],
        deployment: null,
        currentPhase: 'implementation',
        decisions: {}
      },
      outputDirectory: args.outputDirectory
    };

    // Create and execute Developer agent
    const developer = new Developer(context);
    const result = await developer.execute({
      featureId: args.featureId,
      userStoryId: args.userStoryId
    });

    if (result.success) {
      // Find the newly implemented feature
      const newImplementation = context.projectState.implementations.find(
        impl => impl.featureId === args.featureId
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: result.message,
              data: {
                implementation: newImplementation,
                summary: {
                  featureId: args.featureId,
                  filesGenerated: newImplementation?.files.length || 0,
                  testFilesGenerated: newImplementation?.testFiles.length || 0,
                  dependencies: newImplementation?.dependencies || [],
                  documentation: newImplementation?.documentation || ''
                },
                generatedFiles: newImplementation?.files.map(file => ({
                  path: file.path,
                  type: file.type,
                  size: file.content.length
                })) || []
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
            error: `Feature implementation failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}