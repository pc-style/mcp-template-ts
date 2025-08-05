import { z } from 'zod';
import { Orchestrator } from '../agents/orchestrator.js';
import { AgentContext } from '../types/shared.js';
import path from 'node:path';

export const generatePrototypeSchema = z.object({
  prd: z.string().describe('Product Requirements Document content'),
  projectName: z.string().optional().describe('Name of the project to generate'),
  outputDirectory: z.string().optional().describe('Output directory for the generated prototype'),
  llmProvider: z.enum(['openai', 'anthropic', 'local']).optional().describe('LLM provider to use'),
  preferences: z.object({
    frontend: z.string().optional().describe('Preferred frontend technology (e.g., React, Vue)'),
    backend: z.string().optional().describe('Preferred backend technology (e.g., Node.js, Python)'),
    database: z.string().optional().describe('Preferred database (e.g., PostgreSQL, MongoDB)'),
    deployment: z.string().optional().describe('Preferred deployment platform (e.g., Docker, Kubernetes)')
  }).optional().describe('Technology preferences for the prototype')
});

export async function generatePrototype(args: z.infer<typeof generatePrototypeSchema>) {
  try {
    // Determine output directory
    const outputDir = args.outputDirectory || path.join(process.cwd(), 'generated-prototype');
    const projectName = args.projectName || 'Generated Prototype';

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
        decisions: {
          projectName,
          preferences: args.preferences || {},
          startTime: new Date().toISOString()
        }
      },
      llmProvider: args.llmProvider,
      outputDirectory: outputDir,
      gitRepository: undefined
    };

    // Create and execute Orchestrator
    const orchestrator = new Orchestrator(context);
    const result = await orchestrator.execute({
      prd: args.prd,
      projectName,
      outputPath: outputDir
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
                summary: result.data,
                outputDirectory: outputDir,
                projectState: context.projectState,
                generatedFiles: await getGeneratedFilesSummary(outputDir),
                nextSteps: [
                  'Navigate to the output directory',
                  'Install dependencies: npm install',
                  'Set up environment variables: cp .env.example .env',
                  'Start development server: npm run dev',
                  'Run tests: npm test'
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
            error: `Prototype generation failed: ${error.message}`
          }, null, 2)
        }
      ]
    };
  }
}

async function getGeneratedFilesSummary(outputDir: string): Promise<any> {
  try {
    const { FileOperations } = await import('../utils/file-operations.js');
    const files = await FileOperations.listFiles(outputDir, true);
    
    const summary = {
      totalFiles: files.length,
      fileTypes: {} as Record<string, number>,
      directories: new Set<string>(),
      estimatedSize: 0
    };

    for (const file of files) {
      const ext = FileOperations.getFileExtension(file) || 'no-extension';
      summary.fileTypes[ext] = (summary.fileTypes[ext] || 0) + 1;
      summary.directories.add(path.dirname(file.replace(outputDir, '')));
      
      try {
        const content = await FileOperations.readFile(file);
        summary.estimatedSize += content.length;
      } catch {
        // Skip files that can't be read
      }
    }

    return {
      ...summary,
      directories: Array.from(summary.directories).sort(),
      estimatedSizeKB: Math.round(summary.estimatedSize / 1024)
    };
  } catch (error) {
    return {
      error: `Could not analyze generated files: ${error.message}`
    };
  }
}