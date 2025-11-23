import { NextRequest } from 'next/server';
import { ClaudeService } from '@/app/lib/claude';
import { SearchQuery } from '@/app/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/search
 * Handles search requests and streams results using Server-Sent Events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.query || !body.location) {
      return new Response(
        JSON.stringify({ error: 'Query and location are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate query type
    if (typeof body.query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Query must be a string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate location object
    if (typeof body.location !== 'object' ||
        !body.location.formatted_address ||
        typeof body.location.lat !== 'number' ||
        typeof body.location.lng !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Location must include formatted_address, lat, and lng' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional fields
    if (body.ageRange && (typeof body.ageRange.min !== 'number' || typeof body.ageRange.max !== 'number')) {
      return new Response(
        JSON.stringify({ error: 'Age range must contain numbers' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.maxPrice !== undefined && typeof body.maxPrice !== 'number') {
      return new Response(
        JSON.stringify({ error: 'Max price must be a number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate equity filters are booleans
    if (body.freeOnly !== undefined && typeof body.freeOnly !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'freeOnly must be a boolean' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.showFinancialAidOnly !== undefined && typeof body.showFinancialAidOnly !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'showFinancialAidOnly must be a boolean' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (body.subsidizedOnly !== undefined && typeof body.subsidizedOnly !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'subsidizedOnly must be a boolean' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build the search query
    const searchQuery: SearchQuery = {
      query: body.query,
      location: body.location,
      ageRange: body.ageRange,
      maxPrice: body.maxPrice,
      startDate: body.startDate,
      // Equity/Affordability filters (Track 2)
      freeOnly: body.freeOnly,
      showFinancialAidOnly: body.showFinancialAidOnly,
      subsidizedOnly: body.subsidizedOnly,
    };

    // Create a ReadableStream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const claudeService = new ClaudeService();

          // Stream the search process
          for await (const chunk of claudeService.streamSearch(searchQuery)) {
            // Format as SSE
            const data = JSON.stringify(chunk);
            const message = `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(message));
          }

          // Send done event
          const doneMessage = `data: ${JSON.stringify({ type: 'done' })}\n\n`;
          controller.enqueue(encoder.encode(doneMessage));

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);

          // Send error event
          const errorMessage = `data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Unknown error occurred'
          })}\n\n`;
          controller.enqueue(encoder.encode(errorMessage));

          controller.close();
        }
      },
    });

    // Return the stream with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
