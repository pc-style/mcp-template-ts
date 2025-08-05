import { LLMService } from '../services/llm.js';
import { AgentRole, ProjectContext, AgentTask } from '../types.js';
import { getAgentConfig } from '../config.js';
import { Logger } from '../utils/logger.js';

export abstract class BaseAgent {
  protected llm: LLMService;
  protected role: AgentRole;
  protected logger: Logger;
  protected context: ProjectContext;

  constructor(role: AgentRole, context: ProjectContext) {
    this.role = role;
    this.context = context;
    this.logger = new Logger(`Agent:${role}`);
    
    const agentConfig = getAgentConfig(role);
    const provider = agentConfig.model ? 'openai' : 'openai'; // Default to OpenAI for now
    
    this.llm = new LLMService(provider);
  }

  abstract execute(task: AgentTask): Promise<any>;

  protected async generateResponse(prompt: string, system?: string): Promise<string> {
    const agentConfig = getAgentConfig(this.role);
    
    const response = await this.llm.generate({
      prompt,
      system: system || this.getSystemPrompt(),
      temperature: agentConfig.temperature,
      max_tokens: 4000,
      model: agentConfig.model,
    });

    return response.content;
  }

  protected async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    example?: T,
    system?: string
  ): Promise<T> {
    const agentConfig = getAgentConfig(this.role);
    
    const response = await this.llm.generateStructured(
      {
        prompt,
        system: system || this.getSystemPrompt(),
        temperature: agentConfig.temperature,
        max_tokens: 4000,
        model: agentConfig.model,
      },
      schema,
      example
    );

    return response;
  }

  protected getSystemPrompt(): string {
    return `You are a ${this.role.replace('_', ' ')} in an autonomous development team. 
    
Your responsibilities include:
${this.getRoleResponsibilities()}

Current project context:
- Project: ${this.context.name}
- Description: ${this.context.description}
- Phase: ${this.context.phase}

Always provide clear, actionable responses and maintain consistency with the project's technical decisions and architecture.`;
  }

  protected abstract getRoleResponsibilities(): string;

  protected logTaskStart(task: AgentTask): void {
    this.logger.info(`Starting task: ${task.title}`, {
      taskId: task.id,
      priority: task.priority,
      dependencies: task.dependencies,
    });
  }

  protected logTaskComplete(task: AgentTask, result: any): void {
    this.logger.info(`Completed task: ${task.title}`, {
      taskId: task.id,
      result: typeof result === 'object' ? Object.keys(result) : result,
    });
  }

  protected logTaskError(task: AgentTask, error: Error): void {
    this.logger.error(`Failed task: ${task.title}`, {
      taskId: task.id,
      error: error.message,
      stack: error.stack,
    });
  }

  protected updateContext(updates: Partial<ProjectContext>): void {
    this.context = { ...this.context, ...updates };
  }

  protected addDecision(title: string, description: string, rationale: string): void {
    const decision = {
      id: `decision_${Date.now()}`,
      title,
      description,
      rationale,
      date: new Date().toISOString(),
      agent: this.role,
    };

    this.context.decisions.push(decision);
  }

  protected addArtifact(name: string, type: string, path: string): void {
    const artifact = {
      id: `artifact_${Date.now()}`,
      name,
      type,
      path,
      created_by: this.role,
      created_at: new Date().toISOString(),
    };

    this.context.artifacts.push(artifact);
  }

  getRole(): AgentRole {
    return this.role;
  }

  getContext(): ProjectContext {
    return this.context;
  }

  isEnabled(): boolean {
    const agentConfig = getAgentConfig(this.role);
    return agentConfig.enabled;
  }
}