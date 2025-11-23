import Anthropic from '@anthropic-ai/sdk';
import { SearchQuery, SearchResponse, CacheStore, EnhancedProgram } from './types';
import { googlePlacesService } from './googlePlaces';
import { batchGeocodeAddresses, filterAndSortByDistance } from './geocoding';

// In-memory cache (will be replaced with Redis later)
const cache: CacheStore = {};
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export class ClaudeService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generates a cache key from the search query
   */
  private getCacheKey(searchQuery: SearchQuery): string {
    return JSON.stringify({
      query: searchQuery.query.toLowerCase().trim(),
      place_id: searchQuery.location.place_id, // Use place_id for consistent caching
      radius: searchQuery.location.radius,
      ageRange: searchQuery.ageRange,
      maxPrice: searchQuery.maxPrice,
      startDate: searchQuery.startDate,
    });
  }

  /**
   * Retrieves cached results if available and not expired
   */
  private getFromCache(key: string): SearchResponse | null {
    const entry = cache[key];
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL;
    if (isExpired) {
      delete cache[key];
      return null;
    }

    return entry.data;
  }

  /**
   * Stores results in cache
   */
  private setCache(key: string, data: SearchResponse): void {
    cache[key] = {
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Builds the system prompt for Claude
   */
  private buildSystemPrompt(searchQuery: SearchQuery): string {
    const filters = [];

    if (searchQuery.ageRange) {
      filters.push(`Age range: ${searchQuery.ageRange.min}-${searchQuery.ageRange.max} years old`);
    }

    if (searchQuery.maxPrice) {
      filters.push(`Maximum price: $${searchQuery.maxPrice}`);
    }

    if (searchQuery.startDate) {
      filters.push(`Start date: on or after ${searchQuery.startDate}`);
    }

    // Equity/Affordability Filters (Track 2)
    const equityFilters = [];
    if (searchQuery.freeOnly) {
      equityFilters.push('PRIORITIZE: Free programs only (cost: $0)');
    }
    if (searchQuery.showFinancialAidOnly) {
      equityFilters.push('PRIORITIZE: Programs with financial aid, scholarships, or subsidies');
    }
    if (searchQuery.subsidizedOnly) {
      equityFilters.push('PRIORITIZE: Income-based or sliding scale pricing programs');
    }

    const filtersText = filters.length > 0
      ? `\n\nFilters to apply:\n${filters.map(f => `- ${f}`).join('\n')}`
      : '';

    const equityText = equityFilters.length > 0
      ? `\n\n🎯 EQUITY FILTERS (CRITICAL - Track 2 Feature):\n${equityFilters.map(f => `- ${f}`).join('\n')}\n\nIMPORTANT: Search specifically for programs matching these affordability criteria. Look for keywords: "free", "scholarship", "financial aid", "subsidy", "sliding scale", "income-based", "no cost". Prioritize these results.`
      : '';

    return `Find kids programs: "${searchQuery.query}" in ${searchQuery.location.formatted_address}${filtersText}

CRITICAL: Search web 3-4 times with different terms. Visit program websites to get COMPLETE details.

Required for EACH program:
- Exact program name
- Organization name
- Specific age range (e.g., 7-9, not 5-12)
- ACTUAL cost with amount (if free, say "Free" not 0)
- Exact schedule: specific days + times + dates
- Full address (street, city, postal code)
- Contact: phone AND/or email AND website
- APPLICATION URL if available (look for "apply", "register", "sign up" links)
- hasFinancialAid: true/false (search for "scholarship", "financial aid", "bursary", "subsidy" mentions)
- If program offers financial aid, include details in cost.note

NEW - Program Values Analysis:
For each program, analyze the description, mission, and website content to detect what qualities they VALUE in applicants:
- Score 0-100 for: diversity, leadership, creativity, academicExcellence, communityService, athleticism, innovation, teamwork, independence
- Provide 1-2 sentence analysis of what the program truly values
- Note if they explicitly mention financial aid/scholarships

Return ONLY this JSON (no extra text):
{"programs":[{"id":"1","name":"Full Program Name","organization":"Org Name","ageRange":{"min":7,"max":9},"cost":{"amount":150,"currency":"USD","frequency":"per month","note":"sibling discount"},"schedule":{"days":["Monday","Wednesday"],"times":"6:00 PM - 7:00 PM","duration":"10 weeks","startDate":"2025-09-15"},"location":{"address":"123 Street Name","city":"${searchQuery.location}"},"contact":{"phone":"416-123-4567","email":"info@org.com","website":"https://website.com"},"description":"What kids do in this program","category":"soccer","applicationUrl":"https://website.com/apply","hasFinancialAid":true,"values":{"diversity":75,"leadership":85,"creativity":90,"academicExcellence":60,"communityService":40,"athleticism":95,"innovation":70,"teamwork":100,"independence":50,"analysis":"This program highly values teamwork and athleticism based on their emphasis on collaborative sports activities and competitive spirit."}}],"searchMetadata":{"query":"${searchQuery.query}","location":"${searchQuery.location}","timestamp":"${new Date().toISOString()}","resultsCount":1}}

Must include: real prices, full addresses, phone/email, specific schedules, values analysis, and application URLs. No generic/vague info.`;
  }

  /**
   * Searches for programs using Claude with web search
   */
  async searchPrograms(searchQuery: SearchQuery): Promise<SearchResponse> {
    // Check cache first
    const cacheKey = this.getCacheKey(searchQuery);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      return cachedResult;
    }

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        tools: [{
          type: 'web_search_20250305' as const,
          name: 'web_search'
        }],
        messages: [{
          role: 'user',
          content: this.buildSystemPrompt(searchQuery)
        }]
      });

      // Extract the text content from the response
      let resultText = '';
      for (const block of response.content) {
        if (block.type === 'text') {
          resultText += block.text;
        }
      }

      // Parse the JSON response - try to extract valid JSON
      let result: SearchResponse;
      try {
        // First try to find JSON between markers
        const jsonMatch = resultText.match(/\{[\s\S]*"searchMetadata"[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON structure found in response');
        }

        // Clean the JSON string
        let jsonStr = jsonMatch[0];
        // Remove any trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', resultText);
        throw new Error(`Failed to parse Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Cache the result
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error searching programs:', error);
      throw error;
    }
  }

  /**
   * Streams the search process, yielding thinking updates and final results
   */
  async* streamSearch(searchQuery: SearchQuery): AsyncGenerator<{
    type: 'thinking' | 'result' | 'error';
    content?: string;
    data?: SearchResponse;
    error?: string;
  }> {
    // Check cache first
    const cacheKey = this.getCacheKey(searchQuery);
    const cachedResult = this.getFromCache(cacheKey);

    if (cachedResult) {
      yield { type: 'thinking', content: 'Found cached results...' };
      yield { type: 'result', data: cachedResult };
      return;
    }

    try {
      yield { type: 'thinking', content: 'Initializing search...' };

      const stream = await this.client.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        tools: [{
          type: 'web_search_20250305' as const,
          name: 'web_search'
        }],
        messages: [{
          role: 'user',
          content: this.buildSystemPrompt(searchQuery)
        }]
      });

      let resultText = '';
      let searchCount = 0;

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            searchCount++;
            yield {
              type: 'thinking',
              content: `Performing web search ${searchCount}...`
            };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            resultText += event.delta.text;
          }
        } else if (event.type === 'message_stop') {
          yield { type: 'thinking', content: 'Processing results...' };
        }
      }

      // Parse the final response - try to extract valid JSON
      let result: SearchResponse;
      try {
        // First try to find JSON between markers
        const jsonMatch = resultText.match(/\{[\s\S]*"searchMetadata"[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON structure found in response');
        }

        // Clean the JSON string
        let jsonStr = jsonMatch[0];
        // Remove any trailing commas before closing braces/brackets
        jsonStr = jsonStr.replace(/,(\s*[}\]])/g, '$1');

        result = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', resultText);
        throw new Error(`Failed to parse Claude response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }

      // Enrich programs with Google Places ratings
      yield { type: 'thinking', content: 'Fetching Google ratings...' };
      try {
        const ratingsData = await googlePlacesService.batchGetRatings(
          result.programs.map(p => ({
            organization: p.organization,
            location: p.location,
          }))
        );

        // Attach ratings to programs
        let enrichedPrograms: EnhancedProgram[] = result.programs.map((program, index) => ({
          ...program,
          googlePlaces: ratingsData[index] || undefined,
        }));

        // Calculate distances and filter by radius if specified
        if (searchQuery.location.radius !== undefined && searchQuery.location.radius > 0) {
          yield { type: 'thinking', content: 'Calculating distances...' };

          const apiKey = process.env.GOOGLE_PLACES_API_KEY || '';

          // Geocode program addresses
          const programAddresses = enrichedPrograms.map(p =>
            `${p.location.address}, ${p.location.city}`
          );
          const programCoordinates = await batchGeocodeAddresses(programAddresses, apiKey);

          // Filter and sort by distance
          enrichedPrograms = filterAndSortByDistance(
            enrichedPrograms,
            programCoordinates,
            { lat: searchQuery.location.lat, lng: searchQuery.location.lng },
            searchQuery.location.radius
          );
        } else {
          // Still calculate distances but don't filter
          yield { type: 'thinking', content: 'Calculating distances...' };

          const apiKey = process.env.GOOGLE_PLACES_API_KEY || '';

          const programAddresses = enrichedPrograms.map(p =>
            `${p.location.address}, ${p.location.city}`
          );
          const programCoordinates = await batchGeocodeAddresses(programAddresses, apiKey);

          enrichedPrograms = filterAndSortByDistance(
            enrichedPrograms,
            programCoordinates,
            { lat: searchQuery.location.lat, lng: searchQuery.location.lng },
            undefined // No radius filtering, just calculate distances
          );
        }

        result = {
          ...result,
          programs: enrichedPrograms,
        };
      } catch (ratingsError) {
        console.error('Error fetching Google ratings or calculating distances:', ratingsError);
        // Continue without ratings/distances - don't fail the entire search
      }

      // Cache the result
      this.setCache(cacheKey, result);

      yield { type: 'result', data: result };
    } catch (error) {
      console.error('Error streaming search:', error);
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
