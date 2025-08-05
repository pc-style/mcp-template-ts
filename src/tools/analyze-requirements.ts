import { z } from 'zod';
import { ProductManager } from '../agents/product-manager.js';
import { AgentContext, ProjectState } from '../types/shared.js';

export const analyzeRequirementsSchema = z.object({
  prd: z.string().describe('Product Requirements Document content'),
  outputDirectory: z.string().optional().describe('Output directory for generated files'),
  llmProvider: z.enum(['openai', 'anthropic', 'local']).optional().describe('LLM provider to use')
});

export async function analyzeRequirements(args: z.infer<typeof analyzeRequirementsSchema>) {
  try {
    // Initialize agent context
    const context: AgentContext = {
      projectState: {
        requirements: [],
        userStories: [],
        architecture: null,
        implementations: [],
        tests: [],
        deployment: null,
        currentPhase: 'analysis',
        decisions: {}
      },
      llmProvider: args.llmProvider,
      outputDirectory: args.outputDirectory || process.cwd()
    };

    // Create and execute Product Manager agent
    const productManager = new ProductManager(context);
    const result = await productManager.execute({ prd: args.prd });

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: result.message,
              data: {
                requirements: context.projectState.requirements,
                userStories: context.projectState.userStories,
                summary: {
                  requirementsCount: context.projectState.requirements.length,
                  userStoriesCount: context.projectState.userStories.length,
                  highPriorityRequirements: context.projectState.requirements.filter(r => r.priority === 'high').length,
                  estimatedTotalEffort: context.projectState.userStories.reduce((sum, story) => sum + story.estimatedEffort, 0)
                }
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
            error: `Requirements analysis failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}