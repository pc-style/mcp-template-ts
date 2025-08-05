import { z } from 'zod';
import { DevOps } from '../agents/devops.js';
import { AgentContext, ArchitectureDesign, FeatureImplementation } from '../types/shared.js';

export const setupDeploymentSchema = z.object({
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
  })).describe('Implemented features'),
  outputDirectory: z.string().describe('Output directory for deployment files'),
  platform: z.enum(['docker', 'kubernetes', 'serverless', 'traditional']).optional().describe('Target deployment platform'),
  environment: z.enum(['development', 'staging', 'production']).optional().describe('Target environment')
});

export async function setupDeployment(args: z.infer<typeof setupDeploymentSchema>) {
  try {
    // Initialize agent context
    const context: AgentContext = {
      projectState: {
        requirements: [],
        userStories: [],
        architecture: args.architecture as ArchitectureDesign,
        implementations: args.implementations as FeatureImplementation[],
        tests: [],
        deployment: null,
        currentPhase: 'deployment',
        decisions: {}
      },
      outputDirectory: args.outputDirectory
    };

    // Create and execute DevOps agent
    const devOps = new DevOps(context);
    const result = await devOps.execute({
      platform: args.platform,
      environment: args.environment
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
                deployment: context.projectState.deployment,
                summary: {
                  platform: context.projectState.deployment?.platform || 'not configured',
                  environment: context.projectState.deployment?.environment || 'not configured',
                  configurationFiles: context.projectState.deployment?.configurations.length || 0,
                  cicdFiles: context.projectState.deployment?.cicdPipeline.length || 0
                },
                generatedFiles: [
                  ...(context.projectState.deployment?.configurations.map(file => ({
                    category: 'configuration',
                    path: file.path,
                    type: file.type,
                    size: file.content.length
                  })) || []),
                  ...(context.projectState.deployment?.cicdPipeline.map(file => ({
                    category: 'ci/cd',
                    path: file.path,
                    type: file.type,
                    size: file.content.length
                  })) || [])
                ]
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
            error: `Deployment setup failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}