import { BaseAgent } from './base-agent.js';
import { AgentContext, AgentResponse, ProjectRequirement, UserStory } from '../types/shared.js';

export class ProductManager extends BaseAgent {
  constructor(context: AgentContext) {
    super(context, 'ProductManager', 'Requirements Analysis and User Story Creation');
  }

  async execute(input: { prd: string }): Promise<AgentResponse> {
    this.log('Analyzing Product Requirements Document...');

    try {
      // Parse the PRD and extract requirements
      const analysisPrompt = this.createAnalysisPrompt(input.prd);
      const llmResponse = await this.callLLM(analysisPrompt);
      
      const analysis = this.parseAnalysisResponse(llmResponse);
      
      // Update project state with requirements and user stories
      this.updateProjectState({
        requirements: analysis.requirements,
        userStories: analysis.userStories,
        currentPhase: 'architecture'
      });

      this.log(`Identified ${analysis.requirements.length} requirements and ${analysis.userStories.length} user stories`);

      return this.createResponse(
        true,
        'Requirements analysis completed successfully',
        {
          requirementsCount: analysis.requirements.length,
          userStoriesCount: analysis.userStories.length,
          highPriorityItems: analysis.requirements.filter(r => r.priority === 'high').length
        },
        'architecture',
        {
          requirements: analysis.requirements,
          userStories: analysis.userStories,
          currentPhase: 'architecture'
        }
      );
    } catch (error) {
      this.log(`Error during requirements analysis: ${error.message}`);
      return this.createResponse(
        false,
        `Requirements analysis failed: ${error.message}`
      );
    }
  }

  private createAnalysisPrompt(prd: string): string {
    return `
You are a Product Manager analyzing a Product Requirements Document (PRD).
Extract structured requirements and create user stories from the following PRD:

${prd}

Please provide your analysis in the following JSON format:
{
  "requirements": [
    {
      "id": "req-1",
      "title": "Requirement Title",
      "description": "Detailed description",
      "priority": "high|medium|low",
      "category": "functional|non-functional|technical",
      "acceptanceCriteria": ["criteria 1", "criteria 2"]
    }
  ],
  "userStories": [
    {
      "id": "story-1",
      "title": "Story Title",
      "description": "As a [user type], I want [goal] so that [benefit]",
      "acceptanceCriteria": ["criteria 1", "criteria 2"],
      "estimatedEffort": 1-10,
      "priority": "high|medium|low",
      "dependencies": ["story-id-1", "story-id-2"]
    }
  ]
}

Focus on:
1. Breaking down complex features into manageable requirements
2. Creating clear, testable acceptance criteria
3. Identifying dependencies between user stories
4. Prioritizing based on business value and technical complexity
`;
  }

  private parseAnalysisResponse(response: string): { requirements: ProjectRequirement[], userStories: UserStory[] } {
    try {
      const parsed = JSON.parse(response);
      
      // Validate and transform the response
      const requirements: ProjectRequirement[] = (parsed.requirements || []).map((req: any, index: number) => ({
        id: req.id || `req-${index + 1}`,
        title: req.title || 'Untitled Requirement',
        description: req.description || '',
        priority: req.priority || 'medium',
        category: req.category || 'functional',
        acceptanceCriteria: req.acceptanceCriteria || []
      }));

      const userStories: UserStory[] = (parsed.userStories || []).map((story: any, index: number) => ({
        id: story.id || `story-${index + 1}`,
        title: story.title || 'Untitled Story',
        description: story.description || '',
        acceptanceCriteria: story.acceptanceCriteria || [],
        estimatedEffort: story.estimatedEffort || 3,
        priority: story.priority || 'medium',
        dependencies: story.dependencies || []
      }));

      return { requirements, userStories };
    } catch (error) {
      this.log(`Warning: Failed to parse LLM response, using fallback analysis`);
      return this.createFallbackAnalysis();
    }
  }

  private createFallbackAnalysis(): { requirements: ProjectRequirement[], userStories: UserStory[] } {
    const requirements: ProjectRequirement[] = [
      {
        id: 'req-1',
        title: 'User Authentication System',
        description: 'Implement secure user registration, login, and session management',
        priority: 'high',
        category: 'functional',
        acceptanceCriteria: [
          'Users can register with email and password',
          'Users can login with valid credentials',
          'User sessions are maintained securely',
          'Password reset functionality is available'
        ]
      },
      {
        id: 'req-2',
        title: 'Data Management',
        description: 'Core data storage and retrieval functionality',
        priority: 'high',
        category: 'functional',
        acceptanceCriteria: [
          'Data is stored persistently',
          'CRUD operations are available',
          'Data validation is enforced',
          'Data backup and recovery procedures'
        ]
      }
    ];

    const userStories: UserStory[] = [
      {
        id: 'story-1',
        title: 'User Registration',
        description: 'As a new user, I want to create an account so that I can access the application features',
        acceptanceCriteria: [
          'Registration form with email and password fields',
          'Email validation and uniqueness check',
          'Password strength requirements enforced',
          'Account activation email sent'
        ],
        estimatedEffort: 5,
        priority: 'high',
        dependencies: []
      },
      {
        id: 'story-2',
        title: 'User Login',
        description: 'As a registered user, I want to login to my account so that I can access personalized content',
        acceptanceCriteria: [
          'Login form with email and password fields',
          'Authentication against stored credentials',
          'Session creation upon successful login',
          'Error handling for invalid credentials'
        ],
        estimatedEffort: 3,
        priority: 'high',
        dependencies: ['story-1']
      }
    ];

    return { requirements, userStories };
  }
}