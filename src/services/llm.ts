import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { LLMProvider, LLMProviderSchema } from '../types.js';
import { config } from '../config.js';

export interface LLMRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class LLMService {
  private openai: OpenAI | null = null;
  private anthropic: Anthropic | null = null;
  private provider: LLMProvider;

  constructor(provider: LLMProvider = 'openai') {
    this.provider = LLMProviderSchema.parse(provider);
    this.initializeProvider();
  }

  private initializeProvider() {
    switch (this.provider) {
      case 'openai':
        if (config.openai.apiKey) {
          this.openai = new OpenAI({
            apiKey: config.openai.apiKey,
            organization: config.openai.organization,
          });
        } else {
          throw new Error('OpenAI API key not configured');
        }
        break;

      case 'anthropic':
        if (config.anthropic.apiKey) {
          this.anthropic = new Anthropic({
            apiKey: config.anthropic.apiKey,
          });
        } else {
          throw new Error('Anthropic API key not configured');
        }
        break;

      case 'local':
        // For local models, we'll implement a simple HTTP client
        // This could be extended to support Ollama, LM Studio, etc.
        console.log('Local model provider initialized');
        break;

      default:
        throw new Error(`Unsupported LLM provider: ${this.provider}`);
    }
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        switch (this.provider) {
          case 'openai':
            return await this.generateOpenAI(request);
          case 'anthropic':
            return await this.generateAnthropic(request);
          case 'local':
            return await this.generateLocal(request);
          default:
            throw new Error(`Unsupported provider: ${this.provider}`);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`LLM request failed (attempt ${attempt}/${maxRetries}):`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`LLM request failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  private async generateOpenAI(request: LLMRequest): Promise<LLMResponse> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const model = request.model || config.openai.model || 'gpt-4';
    const messages = [];

    if (request.system) {
      messages.push({ role: 'system' as const, content: request.system });
    }

    messages.push({ role: 'user' as const, content: request.prompt });

    const response = await this.openai.chat.completions.create({
      model,
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens || 4000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    return {
      content,
      usage: response.usage ? {
        prompt_tokens: response.usage.prompt_tokens,
        completion_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
      model: response.model,
    };
  }

  private async generateAnthropic(request: LLMRequest): Promise<LLMResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const model = request.model || config.anthropic.model || 'claude-3-sonnet-20240229';
    
    let systemPrompt = request.system || '';
    if (systemPrompt) {
      systemPrompt += '\n\n';
    }

    const response = await this.anthropic.messages.create({
      model,
      max_tokens: request.max_tokens || 4000,
      temperature: request.temperature || 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: request.prompt }],
    });

    const content = response.content[0]?.text;
    if (!content) {
      throw new Error('No content received from Anthropic');
    }

    return {
      content,
      usage: response.usage ? {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      } : undefined,
      model: response.model,
    };
  }

  private async generateLocal(request: LLMRequest): Promise<LLMResponse> {
    // This is a placeholder for local model integration
    // In a real implementation, you would connect to Ollama, LM Studio, etc.
    const localEndpoint = config.local?.endpoint || 'http://localhost:11434';
    
    try {
      const response = await fetch(`${localEndpoint}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: request.model || 'llama2',
          prompt: request.system ? `${request.system}\n\n${request.prompt}` : request.prompt,
          temperature: request.temperature || 0.7,
          max_tokens: request.max_tokens || 4000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Local model request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response || '',
        model: request.model || 'local',
      };
    } catch (error) {
      throw new Error(`Local model request failed: ${error}`);
    }
  }

  async generateStructured<T>(
    request: LLMRequest,
    schema: any,
    example?: T
  ): Promise<T> {
    const structuredPrompt = this.buildStructuredPrompt(request.prompt, schema, example);
    
    const response = await this.generate({
      ...request,
      prompt: structuredPrompt,
      temperature: request.temperature || 0.1, // Lower temperature for structured output
    });

    try {
      // Try to parse JSON from the response
      const jsonMatch = response.content.match(/```json\n([\s\S]*?)\n```/);
      const jsonContent = jsonMatch ? jsonMatch[1] : response.content;
      
      const parsed = JSON.parse(jsonContent);
      return schema.parse(parsed);
    } catch (error) {
      throw new Error(`Failed to parse structured response: ${error}. Response: ${response.content}`);
    }
  }

  private buildStructuredPrompt(prompt: string, schema: any, example?: any): string {
    let structuredPrompt = `${prompt}\n\nPlease respond with valid JSON that matches the following schema:\n\n`;
    
    // Add schema description
    structuredPrompt += `Schema: ${JSON.stringify(schema, null, 2)}\n\n`;
    
    if (example) {
      structuredPrompt += `Example:\n${JSON.stringify(example, null, 2)}\n\n`;
    }
    
    structuredPrompt += `Respond with only the JSON object, wrapped in a code block:\n\`\`\`json\n`;
    
    return structuredPrompt;
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  isAvailable(): boolean {
    switch (this.provider) {
      case 'openai':
        return !!this.openai && !!config.openai.apiKey;
      case 'anthropic':
        return !!this.anthropic && !!config.anthropic.apiKey;
      case 'local':
        return true; // Local models are always available if configured
      default:
        return false;
    }
  }
}