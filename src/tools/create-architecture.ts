import { z } from 'zod';
import { TechLead } from '../agents/tech-lead.js';
import { AgentContext, ProjectRequirement, UserStory } from '../types/shared.js';

export const createArchitectureSchema = z.object({
  requirements: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    category: z.enum(['functional', 'non-functional', 'technical']),
    acceptanceCriteria: z.array(z.string())
  })).describe('Project requirements'),
  userStories: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    acceptanceCriteria: z.array(z.string()),
    estimatedEffort: z.number(),
    priority: z.enum(['high', 'medium', 'low']),
    dependencies: z.array(z.string())
  })).describe('User stories'),
  outputDirectory: z.string().optional().describe('Output directory for generated files'),
  preferences: z.object({
    frontend: z.string().optional().describe('Preferred frontend technology'),
    backend: z.string().optional().describe('Preferred backend technology'),
    database: z.string().optional().describe('Preferred database technology'),
    deployment: z.string().optional().describe('Preferred deployment platform')
  }).optional().describe('Technology preferences')
});

export async function createArchitecture(args: z.infer<typeof createArchitectureSchema>) {
  try {
    // Initialize agent context with existing requirements and user stories
    const context: AgentContext = {
      projectState: {
        requirements: args.requirements as ProjectRequirement[],
        userStories: args.userStories as UserStory[],
        architecture: null,
        implementations: [],
        tests: [],
        deployment: null,
        currentPhase: 'architecture',
        decisions: {
          preferences: args.preferences || {}
        }
      },
      outputDirectory: args.outputDirectory || process.cwd()
    };

    // Create and execute Tech Lead agent
    const techLead = new TechLead(context);
    const result = await techLead.execute({ preferences: args.preferences });

    if (result.success) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: result.message,
              data: {
                architecture: context.projectState.architecture,
                summary: {
                  componentsCount: context.projectState.architecture?.components.length || 0,
                  apiEndpoints: context.projectState.architecture?.apiSpecs.length || 0,
                  databaseTables: context.projectState.architecture?.databaseSchema.length || 0,
                  techStackDecisions: context.projectState.architecture?.techStack.length || 0,
                  overview: context.projectState.architecture?.overview || ''
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
            error: `Architecture creation failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}