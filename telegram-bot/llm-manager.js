// =========================================
// LLM MANAGER - MOTOR INTELIGENTE PRINCIPAL
// Reemplaza toda la "fake intelligence" actual
// =========================================

const OpenAI = require('openai');
const { Anthropic } = require('@anthropic-ai/sdk');

class LLMManager {
  constructor() {
    // Configurar múltiples proveedores
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    
    // Configuraciones específicas por proveedor
    this.providers = {
      'gpt-4-turbo': {
        client: this.openai,
        model: 'gpt-4-turbo-preview',
        maxTokens: 2048,
        temperature: 0.7,
        cost_per_token: 0.00001
      },
      'gpt-3.5-turbo': {
        client: this.openai,
        model: 'gpt-3.5-turbo',
        maxTokens: 1500,
        temperature: 0.6,
        cost_per_token: 0.000002
      },
      'claude-3-opus': {
        client: this.anthropic,
        model: 'claude-3-opus-20240229',
        maxTokens: 2000,
        temperature: 0.7,
        cost_per_token: 0.000015
      }
    };
    
    // Estrategia de fallback
    this.fallbackChain = ['gpt-4-turbo', 'gpt-3.5-turbo', 'claude-3-opus'];
    this.currentProvider = this.fallbackChain[0];
    
    // Tracking de uso y costos
    this.usage = {
      daily_tokens: 0,
      daily_cost: 0,
      last_reset: new Date().toDateString(),
      total_requests: 0,
      failed_requests: 0
    };
  }

  // Método principal para generar respuestas inteligentes
  async generate(prompt, options = {}) {
    const {
      preferredProvider = this.currentProvider,
      maxRetries = 3,
      timeout = 30000
    } = options;

    // Reset daily usage if needed
    this.resetDailyUsageIfNeeded();
    
    // Check daily limits
    if (this.usage.daily_cost > 50) { // $50 daily limit
      throw new Error('Daily cost limit reached');
    }

    const providers = [preferredProvider, ...this.fallbackChain.filter(p => p !== preferredProvider)];
    
    for (const providerName of providers) {
      try {
        console.log(`🤖 Generando con ${providerName}...`);
        
        const startTime = Date.now();
        const provider = this.providers[providerName];
        
        let response;
        let tokens_used = 0;
        
        if (providerName.includes('gpt')) {
          const completion = await Promise.race([
            provider.client.chat.completions.create({
              model: provider.model,
              messages: [{ 
                role: 'user', 
                content: prompt 
              }],
              max_tokens: provider.maxTokens,
              temperature: provider.temperature
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          
          response = completion.choices[0].message.content;
          tokens_used = completion.usage.total_tokens;
          
        } else if (providerName.includes('claude')) {
          const completion = await Promise.race([
            provider.client.messages.create({
              model: provider.model,
              max_tokens: provider.maxTokens,
              temperature: provider.temperature,
              messages: [{ 
                role: 'user', 
                content: prompt 
              }]
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          
          response = completion.content[0].text;
          tokens_used = completion.usage.input_tokens + completion.usage.output_tokens;
        }
        
        // Update usage metrics
        const cost = tokens_used * provider.cost_per_token;
        this.usage.daily_tokens += tokens_used;
        this.usage.daily_cost += cost;
        this.usage.total_requests += 1;
        this.currentProvider = providerName;
        
        console.log(`✅ Respuesta generada con ${providerName}:
          📊 Tokens: ${tokens_used}
          💰 Costo: $${cost.toFixed(4)}
          ⏱️ Tiempo: ${Date.now() - startTime}ms`);
        
        return {
          response: response,
          provider: providerName,
          tokens_used: tokens_used,
          cost: cost,
          response_time: Date.now() - startTime
        };
        
      } catch (error) {
        console.error(`❌ Error con ${providerName}:`, error.message);
        this.usage.failed_requests += 1;
        
        if (providers.indexOf(providerName) === providers.length - 1) {
          throw new Error(`Todos los proveedores LLM fallaron. Último error: ${error.message}`);
        }
        continue;
      }
    }
  }

  // Reset daily usage counter
  resetDailyUsageIfNeeded() {
    const today = new Date().toDateString();
    if (this.usage.last_reset !== today) {
      this.usage.daily_tokens = 0;
      this.usage.daily_cost = 0;
      this.usage.last_reset = today;
      console.log('📊 Daily usage reset');
    }
  }

  // Get usage statistics
  getUsageStats() {
    return {
      ...this.usage,
      current_provider: this.currentProvider,
      providers_available: Object.keys(this.providers),
      success_rate: this.usage.total_requests > 0 ? 
        ((this.usage.total_requests - this.usage.failed_requests) / this.usage.total_requests * 100).toFixed(2) + '%' : 'N/A'
    };
  }

  // Test all providers
  async testAllProviders() {
    const testPrompt = "Responde solo: 'Proveedor funcionando correctamente'";
    const results = {};
    
    for (const providerName of Object.keys(this.providers)) {
      try {
        const result = await this.generate(testPrompt, { 
          preferredProvider: providerName,
          maxRetries: 1 
        });
        results[providerName] = {
          status: 'OK',
          response_time: result.response_time,
          cost: result.cost
        };
      } catch (error) {
        results[providerName] = {
          status: 'ERROR',
          error: error.message
        };
      }
    }
    
    return results;
  }
}

module.exports = LLMManager;