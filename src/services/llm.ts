import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMConfig, LLMConfigSchema } from '../types.js';

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class LLMService {
  private config: LLMConfig;
  private openai?: OpenAI;
  private anthropic?: Anthropic;

  constructor(config: LLMConfig) {
    this.config = LLMConfigSchema.parse(config);
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.config.provider) {
      case 'openai':
        if (!this.config.apiKey) {
          throw new Error('OpenAI API key is required');
        }
        this.openai = new OpenAI({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl,
        });
        break;
      case 'anthropic':
        if (!this.config.apiKey) {
          throw new Error('Anthropic API key is required');
        }
        this.anthropic = new Anthropic({
          apiKey: this.config.apiKey,
          baseURL: this.config.baseUrl,
        });
        break;
      case 'local':
        // For local models, we'll use OpenAI-compatible API
        if (!this.config.baseUrl) {
          throw new Error('Base URL is required for local models');
        }
        this.openai = new OpenAI({
          apiKey: 'dummy-key',
          baseURL: this.config.baseUrl,
        });
        break;
    }
  }

  async generateResponse(
    prompt: string,
    systemPrompt?: string,
    temperature?: number
  ): Promise<LLMResponse> {
    const temp = temperature ?? this.config.temperature;

    try {
      if (this.openai) {
        return await this.generateOpenAIResponse(prompt, systemPrompt, temp);
      } else if (this.anthropic) {
        return await this.generateAnthropicResponse(prompt, systemPrompt, temp);
      } else {
        throw new Error('No LLM provider configured');
      }
    } catch (error) {
      console.error('LLM generation error:', error);
      throw new Error(`Failed to generate response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateOpenAIResponse(
    prompt: string,
    systemPrompt?: string,
    temperature?: number
  ): Promise<LLMResponse> {
    if (!this.openai) throw new Error('OpenAI client not initialized');

    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages,
      temperature,
      max_tokens: this.config.maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };
  }

  private async generateAnthropicResponse(
    prompt: string,
    systemPrompt?: string,
    temperature?: number
  ): Promise<LLMResponse> {
    if (!this.anthropic) throw new Error('Anthropic client not initialized');

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const response = await this.anthropic.completions.create({
      model: this.config.model,
      max_tokens_to_sample: this.config.maxTokens,
      temperature,
      prompt: fullPrompt,
    });

    return {
      content: response.completion || '',
      usage: response.stop_reason ? {
        promptTokens: 0, // Older API doesn't provide token usage
        completionTokens: 0,
        totalTokens: 0,
      } : undefined,
    };
  }

  async generateStructuredResponse<T>(
    prompt: string,
    schema: any,
    systemPrompt?: string,
    temperature?: number
  ): Promise<T> {
    const structuredPrompt = `${prompt}

Please respond with valid JSON that matches this schema:
${JSON.stringify(schema, null, 2)}

Response:`;

    const response = await this.generateResponse(structuredPrompt, systemPrompt, temperature);
    
    try {
      return JSON.parse(response.content) as T;
    } catch (error) {
      throw new Error(`Failed to parse structured response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  async generateCode(
    prompt: string,
    language: string,
    systemPrompt?: string
  ): Promise<string> {
    const codePrompt = `${prompt}

Please generate clean, production-ready ${language} code. Include proper error handling, comments, and follow best practices.

Code:`;

    const response = await this.generateResponse(codePrompt, systemPrompt, 0.3);
    return this.extractCodeFromResponse(response.content, language);
  }

  private extractCodeFromResponse(response: string, language: string): string {
    // Try to extract code blocks
    const codeBlockRegex = new RegExp(`\`\`\`${language}\\n([\\s\\S]*?)\`\`\``, 'i');
    const match = response.match(codeBlockRegex);
    
    if (match) {
      return match[1].trim();
    }

    // If no code block found, try to extract between ``` markers
    const genericCodeBlockRegex = /```\n([\s\S]*?)```/;
    const genericMatch = response.match(genericCodeBlockRegex);
    
    if (genericMatch) {
      return genericMatch[1].trim();
    }

    // If still no match, return the entire response
    return response.trim();
  }
}