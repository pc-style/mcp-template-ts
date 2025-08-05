import { BaseAgent } from './base-agent.js';
import { AgentTask, Requirement, UserStory, RequirementSchema, UserStorySchema } from '../types.js';
import { FileSystemService } from '../services/filesystem.js';

export class ProductManagerAgent extends BaseAgent {
  private fs: FileSystemService;

  constructor(context: any) {
    super('product_manager', context);
    this.fs = new FileSystemService();
  }

  protected getRoleResponsibilities(): string {
    return `- Analyze Product Requirements Documents (PRDs) and extract structured requirements
- Create detailed user stories with acceptance criteria
- Define functional and non-functional requirements
- Prioritize requirements based on business value and technical feasibility
- Ensure requirements are clear, testable, and actionable
- Collaborate with stakeholders to clarify ambiguous requirements
- Maintain traceability between requirements and user stories`;
  }

  async execute(task: AgentTask): Promise<any> {
    this.logTaskStart(task);

    try {
      switch (task.title.toLowerCase()) {
        case 'analyze_requirements':
          return await this.analyzeRequirements(task);
        case 'create_user_stories':
          return await this.createUserStories(task);
        case 'prioritize_requirements':
          return await this.prioritizeRequirements(task);
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

  private async analyzeRequirements(task: AgentTask): Promise<{ requirements: Requirement[] }> {
    const prdContent = task.result?.prd_content;
    if (!prdContent) {
      throw new Error('PRD content is required for requirements analysis');
    }

    const prompt = `Analyze the following Product Requirements Document and extract structured requirements:

${prdContent}

Please identify and structure the requirements into:
1. Functional requirements (what the system should do)
2. Non-functional requirements (performance, security, usability, etc.)
3. Technical requirements (infrastructure, integrations, etc.)

For each requirement, provide:
- Clear title and description
- Priority (high/medium/low)
- Acceptance criteria
- Dependencies (if any)

Focus on making requirements specific, measurable, and testable.`;

    const requirements = await this.generateStructuredResponse<Requirement[]>(
      prompt,
      RequirementSchema.array(),
      [
        {
          id: 'req_001',
          title: 'User Authentication',
          description: 'Users must be able to authenticate using email and password',
          priority: 'high',
          type: 'functional',
          acceptance_criteria: [
            'User can register with email and password',
            'User can login with valid credentials',
            'User receives error for invalid credentials',
            'Password is securely hashed'
          ],
          dependencies: []
        }
      ]
    );

    this.updateContext({ requirements });
    this.addDecision(
      'Requirements Analysis Complete',
      `Extracted ${requirements.length} requirements from PRD`,
      'Requirements have been structured and prioritized for development team'
    );

    this.logTaskComplete(task, { requirements: requirements.length });
    return { requirements };
  }

  private async createUserStories(task: AgentTask): Promise<{ user_stories: UserStory[] }> {
    const requirements = this.context.requirements;
    if (!requirements || requirements.length === 0) {
      throw new Error('Requirements must be analyzed before creating user stories');
    }

    const prompt = `Based on the following requirements, create detailed user stories:

Requirements:
${JSON.stringify(requirements, null, 2)}

For each requirement, create one or more user stories following the format:
"As a [type of user], I want [goal/desire], so that [benefit/value]"

Each user story should include:
- Clear acceptance criteria
- Priority level
- Story points estimation (1-13)
- Associated requirements

Focus on user value and business outcomes.`;

    const userStories = await this.generateStructuredResponse<UserStory[]>(
      prompt,
      UserStorySchema.array(),
      [
        {
          id: 'us_001',
          title: 'User Registration',
          description: 'As a new user, I want to create an account so that I can access the application',
          as_a: 'new user',
          i_want: 'to create an account',
          so_that: 'I can access the application',
          acceptance_criteria: [
            'I can enter my email and password',
            'I receive confirmation when registration is successful',
            'I cannot register with an existing email',
            'Password meets security requirements'
          ],
          priority: 'high',
          story_points: 3,
          requirements: ['req_001']
        }
      ]
    );

    this.updateContext({ user_stories: userStories });
    this.addDecision(
      'User Stories Created',
      `Created ${userStories.length} user stories from requirements`,
      'User stories provide clear development targets for the team'
    );

    // Create documentation
    await this.createRequirementsDocumentation(requirements, userStories);

    this.logTaskComplete(task, { user_stories: userStories.length });
    return { user_stories: userStories };
  }

  private async prioritizeRequirements(task: AgentTask): Promise<{ prioritized_requirements: Requirement[] }> {
    const requirements = this.context.requirements;
    if (!requirements || requirements.length === 0) {
      throw new Error('No requirements to prioritize');
    }

    const prompt = `Prioritize the following requirements based on business value, technical feasibility, and dependencies:

Requirements:
${JSON.stringify(requirements, null, 2)}

Consider:
- Business impact and user value
- Technical complexity and risk
- Dependencies between requirements
- Market timing and competitive factors

Assign priorities: high (must have), medium (should have), low (nice to have)`;

    const prioritizedRequirements = await this.generateStructuredResponse<Requirement[]>(
      prompt,
      RequirementSchema.array(),
      requirements
    );

    this.updateContext({ requirements: prioritizedRequirements });
    this.addDecision(
      'Requirements Prioritized',
      'Requirements have been prioritized based on business value and technical feasibility',
      'Prioritization helps the development team focus on high-value features first'
    );

    this.logTaskComplete(task, { prioritized_requirements: prioritizedRequirements.length });
    return { prioritized_requirements: prioritizedRequirements };
  }

  private async validateRequirements(task: AgentTask): Promise<{ validationResults: any }> {
    const requirements = this.context.requirements;
    const userStories = this.context.user_stories;

    if (!requirements || requirements.length === 0) {
      throw new Error('No requirements to validate');
    }

    const prompt = `Validate the following requirements and user stories for completeness, clarity, and feasibility:

Requirements:
${JSON.stringify(requirements, null, 2)}

User Stories:
${JSON.stringify(userStories, null, 2)}

Check for:
- Completeness: All requirements have corresponding user stories
- Clarity: Requirements are specific and unambiguous
- Testability: Each requirement has clear acceptance criteria
- Feasibility: Requirements are technically achievable
- Consistency: No conflicting requirements
- Traceability: Clear mapping between requirements and user stories`;

    const validationResults = await this.generateResponse(prompt);

    this.addDecision(
      'Requirements Validation Complete',
      'Requirements and user stories have been validated',
      'Validation ensures quality and completeness of project specifications'
    );

    this.logTaskComplete(task, { validationResults: validationResults });
    return { validationResults: validationResults };
  }

  private async createRequirementsDocumentation(requirements: Requirement[], userStories: UserStory[]): Promise<void> {
    const docsPath = `${this.context.id}/docs`;
    await this.fs.ensureDirectory(docsPath);

    // Create requirements document
    const requirementsDoc = this.generateRequirementsMarkdown(requirements);
    await this.fs.writeFile(`${docsPath}/requirements.md`, requirementsDoc);
    this.addArtifact('Requirements Document', 'markdown', `${docsPath}/requirements.md`);

    // Create user stories document
    const userStoriesDoc = this.generateUserStoriesMarkdown(userStories);
    await this.fs.writeFile(`${docsPath}/user-stories.md`, userStoriesDoc);
    this.addArtifact('User Stories Document', 'markdown', `${docsPath}/user-stories.md`);

    // Create traceability matrix
    const traceabilityMatrix = this.generateTraceabilityMatrix(requirements, userStories);
    await this.fs.writeFile(`${docsPath}/traceability-matrix.md`, traceabilityMatrix);
    this.addArtifact('Traceability Matrix', 'markdown', `${docsPath}/traceability-matrix.md`);
  }

  private generateRequirementsMarkdown(requirements: Requirement[]): string {
    let markdown = `# Requirements Specification\n\n`;
    markdown += `**Project:** ${this.context.name}\n`;
    markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

    const byType = {
      functional: requirements.filter(r => r.type === 'functional'),
      non_functional: requirements.filter(r => r.type === 'non_functional'),
      technical: requirements.filter(r => r.type === 'technical'),
    };

    Object.entries(byType).forEach(([type, reqs]) => {
      if (reqs.length > 0) {
        markdown += `## ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')} Requirements\n\n`;
        
        reqs.forEach(req => {
          markdown += `### ${req.title} (${req.priority.toUpperCase()})\n\n`;
          markdown += `**ID:** ${req.id}\n\n`;
          markdown += `**Description:** ${req.description}\n\n`;
          markdown += `**Acceptance Criteria:**\n`;
          req.acceptance_criteria.forEach(criteria => {
            markdown += `- ${criteria}\n`;
          });
          markdown += `\n`;
        });
      }
    });

    return markdown;
  }

  private generateUserStoriesMarkdown(userStories: UserStory[]): string {
    let markdown = `# User Stories\n\n`;
    markdown += `**Project:** ${this.context.name}\n`;
    markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

    const byPriority = {
      high: userStories.filter(us => us.priority === 'high'),
      medium: userStories.filter(us => us.priority === 'medium'),
      low: userStories.filter(us => us.priority === 'low'),
    };

    Object.entries(byPriority).forEach(([priority, stories]) => {
      if (stories.length > 0) {
        markdown += `## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority Stories\n\n`;
        
        stories.forEach(story => {
          markdown += `### ${story.title}\n\n`;
          markdown += `**ID:** ${story.id}\n\n`;
          markdown += `**As a** ${story.as_a}\n`;
          markdown += `**I want** ${story.i_want}\n`;
          markdown += `**So that** ${story.so_that}\n\n`;
          markdown += `**Acceptance Criteria:**\n`;
          story.acceptance_criteria.forEach(criteria => {
            markdown += `- ${criteria}\n`;
          });
          markdown += `\n**Story Points:** ${story.story_points || 'TBD'}\n\n`;
        });
      }
    });

    return markdown;
  }

  private generateTraceabilityMatrix(requirements: Requirement[], userStories: UserStory[]): string {
    let markdown = `# Requirements Traceability Matrix\n\n`;
    markdown += `**Project:** ${this.context.name}\n`;
    markdown += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;

    markdown += `| Requirement ID | Requirement Title | User Story IDs | Coverage |\n`;
    markdown += `|----------------|-------------------|----------------|----------|\n`;

    requirements.forEach(req => {
      const relatedStories = userStories.filter(us => 
        us.requirements.includes(req.id)
      );
      const storyIds = relatedStories.map(us => us.id).join(', ');
      const coverage = relatedStories.length > 0 ? '✓' : '✗';
      
      markdown += `| ${req.id} | ${req.title} | ${storyIds || 'None'} | ${coverage} |\n`;
    });

    return markdown;
  }
}