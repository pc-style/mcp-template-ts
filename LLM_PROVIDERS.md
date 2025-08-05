# LLM Provider Configuration Guide

This document provides detailed configuration information for all supported LLM providers in the Autonomous Development Team MCP Server.

## Supported Providers

The MCP server supports the following LLM providers:

1. **OpenAI** - GPT models (GPT-4, GPT-3.5-turbo, etc.)
2. **Anthropic** - Claude models (Claude-3, Claude-2, etc.)
3. **OpenRouter** - Unified API for multiple models
4. **Gemini** - Google's Gemini models
5. **Local** - Local models via OpenAI-compatible API

## Configuration Examples

### 1. OpenAI

**Best for**: High-quality code generation, complex reasoning
**Models**: GPT-4, GPT-3.5-turbo, GPT-4-turbo

```json
{
  "provider": "openai",
  "apiKey": "your-openai-api-key",
  "model": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Environment Variables**:
```bash
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=4000
```

### 2. Anthropic

**Best for**: Detailed analysis, safety-focused responses
**Models**: Claude-3-sonnet, Claude-3-opus, Claude-2

```json
{
  "provider": "anthropic",
  "apiKey": "your-anthropic-api-key",
  "model": "claude-3-sonnet-20240229",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Environment Variables**:
```bash
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_TEMPERATURE=0.7
ANTHROPIC_MAX_TOKENS=4000
```

### 3. OpenRouter

**Best for**: Access to multiple models through a single API
**Models**: GPT-4, Claude-3, Llama, and many others

```json
{
  "provider": "openrouter",
  "apiKey": "your-openrouter-api-key",
  "model": "openai/gpt-4",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Popular OpenRouter Models**:
- `openai/gpt-4` - OpenAI's GPT-4
- `openai/gpt-3.5-turbo` - OpenAI's GPT-3.5-turbo
- `anthropic/claude-3-sonnet` - Anthropic's Claude-3-sonnet
- `anthropic/claude-3-opus` - Anthropic's Claude-3-opus
- `meta-llama/llama-2-70b-chat` - Meta's Llama-2-70b
- `google/palm-2-chat-bison` - Google's PaLM-2

**Environment Variables**:
```bash
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=openai/gpt-4
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_MAX_TOKENS=4000
```

### 4. Gemini

**Best for**: Google's latest AI models, multimodal capabilities
**Models**: gemini-1.5-pro, gemini-1.5-flash, gemini-pro

```json
{
  "provider": "gemini",
  "apiKey": "your-google-api-key",
  "model": "gemini-1.5-pro",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Available Gemini Models**:
- `gemini-1.5-pro` - Most capable model, best for complex tasks
- `gemini-1.5-flash` - Faster, more efficient model
- `gemini-pro` - Previous generation model

**Environment Variables**:
```bash
GEMINI_API_KEY=your-google-api-key-here
GEMINI_MODEL=gemini-1.5-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=4000
```

### 5. Local Models

**Best for**: Privacy, offline development, custom models
**Models**: Any model running locally (Ollama, LM Studio, etc.)

```json
{
  "provider": "local",
  "baseUrl": "http://localhost:11434/v1",
  "model": "llama2",
  "temperature": 0.7,
  "maxTokens": 4000
}
```

**Popular Local Models**:
- `llama2` - Meta's Llama-2
- `llama2:13b` - Llama-2 13B parameter model
- `llama2:70b` - Llama-2 70B parameter model
- `codellama` - Code-optimized Llama model
- `mistral` - Mistral AI models
- `neural-chat` - Intel's Neural Chat

**Environment Variables**:
```bash
LOCAL_MODEL_BASE_URL=http://localhost:11434/v1
LOCAL_MODEL_NAME=llama2
LOCAL_MODEL_TEMPERATURE=0.7
LOCAL_MODEL_MAX_TOKENS=4000
```

## Usage Examples

### Basic Usage with Different Providers

```javascript
// Initialize with OpenAI
initialize_services({
  llmConfig: {
    provider: "openai",
    apiKey: "your-openai-api-key",
    model: "gpt-4"
  }
});

// Initialize with OpenRouter
initialize_services({
  llmConfig: {
    provider: "openrouter",
    apiKey: "your-openrouter-api-key",
    model: "anthropic/claude-3-sonnet"
  }
});

// Initialize with Gemini
initialize_services({
  llmConfig: {
    provider: "gemini",
    apiKey: "your-google-api-key",
    model: "gemini-1.5-pro"
  }
});
```

### Execute Project with Different Providers

```javascript
// Using OpenAI
execute_project({
  prd: "Create a task management application...",
  projectName: "TaskManager",
  llmConfig: {
    provider: "openai",
    apiKey: "your-openai-api-key",
    model: "gpt-4"
  }
});

// Using OpenRouter with Claude
execute_project({
  prd: "Create a task management application...",
  projectName: "TaskManager",
  llmConfig: {
    provider: "openrouter",
    apiKey: "your-openrouter-api-key",
    model: "anthropic/claude-3-sonnet"
  }
});

// Using Gemini
execute_project({
  prd: "Create a task management application...",
  projectName: "TaskManager",
  llmConfig: {
    provider: "gemini",
    apiKey: "your-google-api-key",
    model: "gemini-1.5-pro"
  }
});
```

## Provider Comparison

| Provider | Strengths | Best For | Cost | Speed |
|----------|-----------|----------|------|-------|
| **OpenAI** | High quality, reliable | Complex reasoning, code generation | Medium-High | Fast |
| **Anthropic** | Safety-focused, detailed | Analysis, documentation | Medium-High | Medium |
| **OpenRouter** | Multiple models, unified API | Model comparison, cost optimization | Variable | Variable |
| **Gemini** | Latest Google models, multimodal | Google ecosystem integration | Low-Medium | Fast |
| **Local** | Privacy, offline, customizable | Development, experimentation | Free | Variable |

## Model Selection Guide

### For Code Generation
- **Best**: OpenAI GPT-4, Anthropic Claude-3-opus
- **Good**: Gemini 1.5-pro, OpenRouter models
- **Budget**: Local models, Gemini 1.5-flash

### For Requirements Analysis
- **Best**: Anthropic Claude-3-sonnet, OpenAI GPT-4
- **Good**: Gemini 1.5-pro, OpenRouter models
- **Budget**: Local models

### For Architecture Design
- **Best**: OpenAI GPT-4, Anthropic Claude-3-opus
- **Good**: Gemini 1.5-pro, OpenRouter models
- **Budget**: Local models

### For Testing
- **Best**: Any high-quality model
- **Good**: Most models work well
- **Budget**: Local models

## Setup Instructions

### 1. OpenAI Setup
1. Get API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to environment: `OPENAI_API_KEY=your-key`
3. Use provider: `"provider": "openai"`

### 2. Anthropic Setup
1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Add to environment: `ANTHROPIC_API_KEY=your-key`
3. Use provider: `"provider": "anthropic"`

### 3. OpenRouter Setup
1. Get API key from [OpenRouter](https://openrouter.ai/)
2. Add to environment: `OPENROUTER_API_KEY=your-key`
3. Use provider: `"provider": "openrouter"`
4. Choose model from their catalog

### 4. Gemini Setup
1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to environment: `GEMINI_API_KEY=your-key`
3. Use provider: `"provider": "gemini"`

### 5. Local Setup
1. Install [Ollama](https://ollama.ai/) or similar
2. Pull model: `ollama pull llama2`
3. Use provider: `"provider": "local"`
4. Set base URL to your local server

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Verify API key is correct
   - Check if key has sufficient credits
   - Ensure key has proper permissions

2. **Model Not Found**
   - Verify model name is correct
   - Check if model is available in your region
   - For OpenRouter, check their model catalog

3. **Rate Limiting**
   - Reduce request frequency
   - Use a different model
   - Check your API plan limits

4. **Local Model Issues**
   - Ensure local server is running
   - Check if model is downloaded
   - Verify base URL is correct

### Performance Tips

1. **Choose the Right Model**
   - Use faster models for simple tasks
   - Use more capable models for complex reasoning

2. **Optimize Parameters**
   - Lower temperature for more focused responses
   - Adjust max tokens based on task complexity

3. **Batch Operations**
   - Group related tasks together
   - Use the same model for related operations

## Security Considerations

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Data Privacy**
   - Local models provide the most privacy
   - Check provider privacy policies
   - Consider data residency requirements

3. **Cost Management**
   - Monitor API usage
   - Set up billing alerts
   - Use cost-effective models for development

---

For more information, see the main [README.md](README.md) and [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md).