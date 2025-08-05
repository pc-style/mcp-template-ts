import { LLMService } from '../services/llm.js';
import { UserStory, UserStorySchema, AgentRole } from '../types.js';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export class ProductManagerAgent {
  private llm: LLMService;

  constructor(llm: LLMService) {
    this.llm = llm;
  }

  async analyzeRequirements(prd: string, projectName?: string, projectDescription?: string): Promise<UserStory[]> {
    const systemPrompt = `You are an experienced Product Manager. Your role is to analyze Product Requirements Documents (PRDs) and break them down into clear, actionable user stories with acceptance criteria.

Key responsibilities:
1. Extract user needs and business requirements from PRDs
2. Create user stories that follow the format: "As a [user type], I want [goal], so that [benefit]"
3. Define clear acceptance criteria for each user story
4. Prioritize stories based on business value and dependencies
5. Ensure stories are testable and implementable

Guidelines:
- Each user story should be independent, negotiable, valuable, estimable, small, and testable (INVEST)
- Acceptance criteria should be specific and measurable
- Prioritize stories as high, medium, or low
- Consider dependencies between stories
- Focus on user value and business outcomes`;

    const prompt = `Please analyze the following Product Requirements Document and create user stories:

PROJECT: ${projectName || 'Unnamed Project'}
DESCRIPTION: ${projectDescription || 'No description provided'}

PRD:
${prd}

Please create user stories with the following structure:
- id: unique identifier
- title: concise user story title
- description: full user story in "As a... I want... so that..." format
- acceptanceCriteria: array of specific, testable criteria
- priority: high, medium, or low
- storyPoints: optional complexity estimate (1-13)
- dependencies: array of story IDs this depends on (if any)

Focus on:
1. Core user workflows
2. Essential features for MVP
3. Clear acceptance criteria
4. Logical priority ordering
5. Identifying dependencies

Respond with a JSON array of user stories.`;

    try {
      const userStories = await this.llm.generateStructuredResponse<UserStory[]>(
        prompt,
        UserStorySchema.array(),
        systemPrompt,
        0.3
      );

      // Add IDs if not provided
      return userStories.map(story => ({
        ...story,
        id: story.id || uuidv4()
      }));
    } catch (error) {
      console.error('Product Manager Agent - Requirements analysis failed:', error);
      throw new Error(`Failed to analyze requirements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refineUserStories(userStories: UserStory[], feedback?: string): Promise<UserStory[]> {
    const systemPrompt = `You are an experienced Product Manager refining user stories based on feedback and technical constraints.

Your role is to:
1. Improve clarity and specificity of user stories
2. Adjust acceptance criteria based on feedback
3. Re-prioritize stories if needed
4. Add missing stories or remove unnecessary ones
5. Ensure stories are properly sized and testable`;

    const prompt = `Please refine the following user stories based on the feedback provided:

CURRENT USER STORIES:
${JSON.stringify(userStories, null, 2)}

FEEDBACK:
${feedback || 'No specific feedback provided. Please review and improve the stories for clarity and completeness.'}

Please refine the stories by:
1. Improving descriptions and acceptance criteria
2. Adjusting priorities if needed
3. Adding missing stories
4. Removing or combining stories if appropriate
5. Ensuring all stories follow INVEST principles

Respond with the refined JSON array of user stories.`;

    try {
      const refinedStories = await this.llm.generateStructuredResponse<UserStory[]>(
        prompt,
        UserStorySchema.array(),
        systemPrompt,
        0.3
      );

      return refinedStories.map(story => ({
        ...story,
        id: story.id || uuidv4()
      }));
    } catch (error) {
      console.error('Product Manager Agent - Story refinement failed:', error);
      throw new Error(`Failed to refine user stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createEpics(userStories: UserStory[]): Promise<{ name: string; stories: string[] }[]> {
    const systemPrompt = `You are a Product Manager organizing user stories into epics for better project management.

Your role is to:
1. Group related user stories into logical epics
2. Create meaningful epic names that represent major feature areas
3. Ensure stories within epics are cohesive and related
4. Consider dependencies and logical flow between epics`;

    const prompt = `Please organize the following user stories into logical epics:

USER STORIES:
${JSON.stringify(userStories, null, 2)}

Please group these stories into epics based on:
1. Functional similarity
2. User workflow relationships
3. Technical dependencies
4. Business domain alignment

For each epic, provide:
- name: descriptive epic name
- stories: array of story IDs that belong to this epic

Respond with a JSON array of epics.`;

    try {
      return await this.llm.generateStructuredResponse<{ name: string; stories: string[] }[]>(
        prompt,
        z.array(z.object({
          name: z.string(),
          stories: z.array(z.string())
        })),
        systemPrompt,
        0.3
      );
    } catch (error) {
      console.error('Product Manager Agent - Epic creation failed:', error);
      throw new Error(`Failed to create epics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateUserStories(userStories: UserStory[]): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Validate each story
    for (const story of userStories) {
      if (!story.title || story.title.length < 5) {
        issues.push(`Story ${story.id}: Title too short or missing`);
      }

      if (!story.description || !story.description.includes('As a')) {
        issues.push(`Story ${story.id}: Description should follow "As a... I want... so that..." format`);
      }

      if (!story.acceptanceCriteria || story.acceptanceCriteria.length === 0) {
        issues.push(`Story ${story.id}: Missing acceptance criteria`);
      }

      if (!story.priority || !['high', 'medium', 'low'].includes(story.priority)) {
        issues.push(`Story ${story.id}: Invalid priority value`);
      }

      if (story.storyPoints && (story.storyPoints < 1 || story.storyPoints > 13)) {
        issues.push(`Story ${story.id}: Story points should be between 1-13`);
      }
    }

    // Check for duplicate IDs
    const ids = userStories.map(s => s.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      issues.push(`Duplicate story IDs found: ${duplicateIds.join(', ')}`);
    }

    // Check for circular dependencies
    const dependencyIssues = this.checkCircularDependencies(userStories);
    issues.push(...dependencyIssues);

    return {
      valid: issues.length === 0,
      issues
    };
  }

  private checkCircularDependencies(userStories: UserStory[]): string[] {
    const issues: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (storyId: string): boolean => {
      if (recursionStack.has(storyId)) {
        return true;
      }

      if (visited.has(storyId)) {
        return false;
      }

      visited.add(storyId);
      recursionStack.add(storyId);

      const story = userStories.find(s => s.id === storyId);
      if (story?.dependencies) {
        for (const depId of story.dependencies) {
          if (hasCycle(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(storyId);
      return false;
    };

    for (const story of userStories) {
      if (!visited.has(story.id) && hasCycle(story.id)) {
        issues.push(`Circular dependency detected involving story: ${story.id}`);
      }
    }

    return issues;
  }
}