import { getToken } from './api';
import type { AgentEvent } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Enable debug logging
const DEBUG_SSE = true;

function debugLog(...args: unknown[]) {
  if (DEBUG_SSE) {
    console.log('[SSE]', ...args);
  }
}

/**
 * Connect to an Agent SSE endpoint and stream events.
 *
 * @param endpoint - The API endpoint (e.g., '/agent/analyze')
 * @param body - The request body to POST
 * @param onEvent - Callback for each parsed event
 * @param onError - Callback for errors
 * @returns A cleanup function to abort the connection
 */
export function connectAgentSSE(
  endpoint: string,
  body: unknown,
  onEvent: (event: AgentEvent) => void,
  onError: (error: Error) => void
): () => void {
  const controller = new AbortController();

  const connect = async () => {
    debugLog('Connecting to', endpoint);
    debugLog('Request body:', body);

    try {
      const token = getToken();
      debugLog('Token present:', !!token);

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      debugLog('Response status:', response.status);
      debugLog('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        debugLog('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      debugLog('Got reader, starting to read stream...');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = '';
      let currentData = '';
      let eventCount = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          debugLog('Stream ended. Total events received:', eventCount);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        debugLog('Received chunk:', chunk.length, 'bytes');
        if (chunk.length < 500) {
          debugLog('Chunk content:', chunk);
        }

        buffer += chunk;

        // Parse SSE events from buffer - split by double newlines (event boundaries)
        // SSE format can use LF (\n\n) or CRLF (\r\n\r\n) as boundaries
        // Normalize CRLF to LF for consistent parsing
        buffer = buffer.replace(/\r\n/g, '\n');

        const eventBoundary = '\n\n';
        let boundaryIndex;

        while ((boundaryIndex = buffer.indexOf(eventBoundary)) !== -1) {
          const eventBlock = buffer.slice(0, boundaryIndex);
          buffer = buffer.slice(boundaryIndex + eventBoundary.length);

          debugLog('Processing event block:', eventBlock.substring(0, 200) + (eventBlock.length > 200 ? '...' : ''));

          // Parse the event block
          const lines = eventBlock.split('\n');
          currentEvent = '';
          currentData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              currentData = line.slice(5).trim();
            }
          }

          if (currentData) {
            eventCount++;
            debugLog(`Event #${eventCount}: type=${currentEvent}, data length=${currentData.length}`);

            try {
              const parsed = JSON.parse(currentData) as AgentEvent;
              // The type should already be in the data from the backend
              debugLog('Parsed event:', parsed.type);
              onEvent(parsed);
            } catch (e) {
              console.warn('[SSE] Failed to parse event:', currentData.substring(0, 200), e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        debugLog('Connection aborted');
        return;
      }
      console.error('[SSE] Error:', error);
      onError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  connect();

  // Return cleanup function
  return () => {
    debugLog('Aborting connection');
    controller.abort();
  };
}

/**
 * Parse event type from SSE event
 */
export function getEventType(event: AgentEvent): string {
  return event.type;
}

/**
 * Check if an event signals completion
 */
export function isTerminalEvent(event: AgentEvent): boolean {
  return event.type === 'done' || event.type === 'error';
}
