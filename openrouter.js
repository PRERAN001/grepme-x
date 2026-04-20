/**
 * OpenRouter integration for generating AI descriptions
 * Uses OpenRouter API to generate controller/function descriptions in Copilot style
 */
class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.model = process.env.OPENROUTER_MODEL || "gpt-3.5-turbo";
  }

  /**
   * Generate a description for a controller/function
   * @param {string} functionName - Name of the function
   * @param {string} functionCode - The function code
   * @param {string} context - Additional context about what the function does
   * @returns {Promise<string>} AI-generated description
   */
  async generateDescription(functionName, functionCode, context = "") {
    if (!this.apiKey) {
      console.warn("⚠️  OpenRouter API key not provided. Skipping AI descriptions.");
      return null;
    }

    try {
      const prompt = `You are a technical documentation expert. Generate a concise, professional description for this JavaScript/TypeScript function in Copilot style (brief and clear). 

Function name: ${functionName}
${context ? `Context: ${context}` : ""}
Code:
\`\`\`
${functionCode}
\`\`\`

Generate a one-line description (max 80 chars) that explains what this function does. Be specific about inputs, outputs, and purpose. Do not include the function name. Just the description.`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://github.com/yourusername/grepme-x",
          "X-Title": "grepme-x Documentation Generator",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("OpenRouter API error:", error);
        return null;
      }

      const data = await response.json();
      const description = data.choices?.[0]?.message?.content?.trim();
      return description || null;
    } catch (error) {
      console.error("Failed to generate description:", error.message);
      return null;
    }
  }

  /**
   * Batch generate descriptions for multiple functions
   * @param {Array} functions - Array of {name, code, context} objects
   * @returns {Promise<Object>} Map of function name to description
   */
  async generateDescriptions(functions) {
    const descriptions = {};

    for (const func of functions) {
      const desc = await this.generateDescription(func.name, func.code, func.context);
      if (desc) {
        descriptions[func.name] = desc;
      }
      // Rate limiting - small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    return descriptions;
  }
}

export default OpenRouterClient;
