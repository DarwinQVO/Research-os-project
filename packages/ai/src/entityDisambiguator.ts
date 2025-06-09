import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface EntitySuggestion {
  name: string;
  type: 'person' | 'company' | 'industry' | 'other';
  confidence: number;
  primaryUrl: string;
}

const PROMPT_TEMPLATE = `ENTITY: {entity}
CONTEXT: {context}
NICHES: {niches}

List top 3 real-world matches as JSON array:
[{{ "name":"", "type":"person|company|industry|other", "confidence":0-1, "primaryUrl":"" }}]`;

export async function disambiguate(
  entity: string,
  context: string,
  niches: string[]
): Promise<EntitySuggestion[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
    maxTokens: 512,
    timeout: 60000,
    streaming: false,
  });

  const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE);
  
  const chain = prompt.pipe(model);
  
  try {
    const result = await chain.invoke({
      entity,
      context,
      niches: niches.join(', ')
    });

    const content = result.content as string;
    
    // Parse JSON response
    let suggestions: EntitySuggestion[];
    try {
      suggestions = JSON.parse(content);
    } catch (parseError) {
      throw new Error('Failed to parse AI response as JSON');
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('No suggestions returned');
    }

    // Validate and clean suggestions
    const validSuggestions = suggestions
      .filter((s) => s.name && s.type && typeof s.confidence === 'number')
      .slice(0, 3)
      .map((s) => ({
        name: s.name.trim(),
        type: s.type as 'person' | 'company' | 'industry' | 'other',
        confidence: Math.max(0, Math.min(1, s.confidence)),
        primaryUrl: s.primaryUrl || ''
      }));

    if (validSuggestions.length === 0) {
      throw new Error('No valid suggestions found');
    }

    return validSuggestions;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during disambiguation');
  }
}