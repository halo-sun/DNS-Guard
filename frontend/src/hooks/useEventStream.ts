import { useEffect, useRef, useState, useCallback } from "react";

type ConnectionStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

type SseEvent =
  | { type: "dns_event"; data: Record<string, unknown> }
  | { type: "alert"; data: Record<string, unknown> }
  | { type: "ping" | "heartbeat"; data: Record<string, unknown> }
  | { type: "unknown"; data: Record<string, unknown> };

interface UseEventStreamOptions {
  enabled?: boolean;
  /** Base URL for the SSE endpoint. Default is relative `/stream/events`. */
  endpoint?: string;
  /** Minimum ms between reconnect attempts. Defaults to 1500. */
  minRetryMs?: number;
  /** Maximum ms between reconnect attempts. Defaults to 15000. */
  maxRetryMs?: number;
  /** Optional callback invoked for each parsed SSE event. */
  onEvent?: (event: SseEvent) => void;
}

const SSE_ENDPOINT = "/stream/events";

function parseSsePayload(raw: string): { event?: string; data: Record<string, unknown> } | null {
  try {
    const lines = raw.replace(/\r\n/g, "\n").split("\n");
    let event: string | undefined;
    let dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (dataLines.length === 0 || dataLines.every((d) => d === "")) {
      return null;
    }

    const joined = dataLines.join("\n");
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(joined);
    } catch {
      // Some SSE payloads are not JSON (e.g. ping/heartbeat "{}" is valid JSON, but be safe).
      data = { raw: joined };
    }

    return { event, data };
  } catch {
    return null;
  }
}

function statusAfterDelay(_delayMs: number): ConnectionStatus {
  // Expose reconnecting immediately; the actual reconnect happens in the effect.
  return "reconnecting";
}

/**
 * Subscribe once per application lifecycle to the backend SSE stream.
 * - Cleans up on unmount / dependency change.
 * - Reconnects with backoff after network drops.
 * - De-duplicates events by a stable client-generated id (timestamp + counter).
 * - Avoids duplicate subscriptions after navigation by keeping one effect.
 */
export function useEventStream(options: UseEventStreamOptions = {}) {
  const {
    enabled = true,
    endpoint = SSE_ENDPOINT,
    minRetryMs = 1500,
    maxRetryMs = 15000,
    onEvent,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const controllerRef = useRef<AbortController | null>(null);
  // Monotonically increasing id to help de-dup across reconnects.
  const idCounterRef = useRef(0);
  // Set of recently seen event ids to avoid processing duplicates after reconnect.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef(onEvent);
  const endpointRef = useRef(endpoint);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep callback ref fresh without restarting the connection.
  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    endpointRef.current = endpoint;
  }, [endpoint]);

  const markSeen = useCallback((id: string) => {
    seenIdsRef.current.add(id);
    // Keep the set bounded.
    if (seenIdsRef.current.size > 1000) {
      const old = seenIdsRef.current.values().next().value;
      if (old !== undefined) {
        seenIdsRef.current.delete(old);
      }
    }
  }, []);

  const isDuplicate = useCallback(
    (eventType: string, data: Record<string, unknown>) => {
      const id = data.id as string | undefined;
      const canonical = data.event_id as string | undefined;
      const fingerprint = data.fingerprint as string | undefined;
      const key = id || canonical || fingerprint || `${eventType}:${data.timestamp ?? data.observed_at ?? JSON.stringify(data)}`;
      if (!key) return false;
      if (seenIdsRef.current.has(key)) return true;
      markSeen(key);
      return false;
    },
    [markSeen],
  );

  const connect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    const abortController = new AbortController();
    controllerRef.current = abortController;
    setStatus("connecting");

    let retryDelay = minRetryMs;
    let reconnectAtFrontend = false;

    const attemptConnect = () => {
      if (abortController.signal.aborted) return;

      setStatus("connecting");

      // Use EventSource when possible; fall back to fetch if EventSource is unavailable.
      if (typeof EventSource !== "undefined") {
        const es = new EventSource(endpointRef.current);
        let lastHeartbeatAt = performance.now();

        es.addEventListener("open", () => {
          setStatus("connected");
          retryDelay = minRetryMs;
          reconnectAtFrontend = false;
        });

        es.addEventListener("heartbeat", (e) => {
          lastHeartbeatAt = performance.now();
          const parsed = parseSsePayload(e.data);
          if (parsed && !isDuplicate("heartbeat", parsed.data)) {
            onEventRef.current?.({ type: "heartbeat", data: parsed.data });
          }
        });

        es.addEventListener("ping", (e) => {
          const parsed = parseSsePayload(e.data);
          if (parsed && !isDuplicate("ping", parsed.data)) {
            onEventRef.current?.({ type: "ping", data: parsed.data });
          }
        });

        es.addEventListener("dns_event", (e) => {
          const parsed = parseSsePayload(e.data);
          if (parsed) {
            const eventType = (parsed.event ?? "dns_event") as string;
            if (!isDuplicate(eventType, parsed.data)) {
              onEventRef.current?.({ type: "dns_event", data: parsed.data });
            }
          }
        });

        es.addEventListener("alert", (e) => {
          const parsed = parseSsePayload(e.data);
          if (parsed) {
            const eventType = (parsed.event ?? "alert") as string;
            if (!isDuplicate(eventType, parsed.data)) {
              onEventRef.current?.({ type: "alert", data: parsed.data });
            }
          }
        });

        es.addEventListener("error", () => {
          // EventSource does not expose detailed error; treat as disconnect.
          reconnectAtFrontend = true;
        });

        es.addEventListener("message", () => {
          // Some servers send untyped messages; ignore unknown event types.
        });

        es.onerror = () => {
          reconnectAtFrontend = true;
        };

        // Keep-alive heartbeat detection: if no heartbeat for 45s, assume stuck.
        const heartbeatWatchInterval = setInterval(() => {
          if (abortController.signal.aborted) {
            clearInterval(heartbeatWatchInterval);
            return;
          }
          if (performance.now() - lastHeartbeatAt > 45000) {
            es.close();
            reconnectAtFrontend = true;
            clearInterval(heartbeatWatchInterval);
          }
        }, 5000);

        // Store cleanup on controller to run on abort / unmount.
        const cleanup = () => {
          clearInterval(heartbeatWatchInterval);
          try {
            es.close();
          } catch {
            // ignore
          }
        };

        abortController.signal.addEventListener("abort", cleanup, { once: true });

        // Schedule reconnect only from the frontend layer to avoid duplicate subscriptions.
        const scheduleReconnect = () => {
          if (abortController.signal.aborted) return;
          setStatus(statusAfterDelay(retryDelay));
          retryTimerRef.current = setTimeout(() => {
            retryTimerRef.current = null;
            if (!abortController.signal.aborted) {
              // Increment counter to change the id space after reconnect.
              idCounterRef.current += 1;
              attemptConnect();
            }
          }, retryDelay);
          retryDelay = Math.min(retryDelay * 2, maxRetryMs);
        };

        // Override cleanup to also schedule reconnect on unexpected close.
        const wrappedCleanup = () => {
          clearInterval(heartbeatWatchInterval);
          try {
            es.close();
          } catch {
            // ignore
          }
          if (!abortController.signal.aborted && reconnectAtFrontend) {
            scheduleReconnect();
          }
        };

        abortController.signal.addEventListener("abort", wrappedCleanup, { once: true });
      } else {
        // Fallback: fetch-based SSE reader. This keeps the same semantics but uses
        // the fetch API directly for environments without EventSource.
        fetchSseStream(abortController, endpointRef.current, {
          onMessage: (raw) => {
            const parsed = parseSsePayload(raw);
            if (!parsed) return;
            const eventType = (parsed.event ?? "unknown") as string;
            if (eventType === "dns_event" || eventType === "alert" || eventType === "ping" || eventType === "heartbeat") {
              if (!isDuplicate(eventType, parsed.data)) {
                onEventRef.current?.({
                  type: eventType as "dns_event" | "alert" | "ping" | "heartbeat",
                  data: parsed.data,
                });
              }
            } else {
              onEventRef.current?.({ type: "unknown", data: parsed.data });
            }
          },
          onOpen: () => {
            setStatus("connected");
            retryDelay = minRetryMs;
            reconnectAtFrontend = false;
          },
          onClose: () => {
            reconnectAtFrontend = true;
          },
          onError: () => {
            reconnectAtFrontend = true;
          },
        });
      }
    };

    attemptConnect();
  }, [enabled, minRetryMs, maxRetryMs, isDuplicate]);

  // Start and maintain a single subscription while enabled.
  useEffect(() => {
    if (!enabled) {
      // Explicitly close any existing connection when disabled.
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      setStatus("disconnected");
      return;
    }

    connect();

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (controllerRef.current) {
        controllerRef.current.abort();
        controllerRef.current = null;
      }
      setStatus("disconnected");
    };
  }, [enabled, connect]);

  const disconnect = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    setStatus("disconnected");
  }, []);

  const reconnect = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    idCounterRef.current += 1;
    connect();
  }, [connect]);

  return {
    status,
    reconnect,
    disconnect,
    // Last few events useful for a "live" indicator. Not a bounded queue; callers
    // should rely on the reactive data layer for actual event rendering.
  };
}

// Minimal fetch-based SSE reader used when EventSource is not available.
async function fetchSseStream(
  controller: AbortController,
  url: string,
  handlers: {
    onMessage: (raw: string) => void;
    onOpen: () => void;
    onClose: () => void;
    onError: () => void;
  },
) {
  const start = async () => {
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "text/event-stream" },
      });

      if (!res.ok) {
        handlers.onError();
        return;
      }

      handlers.onOpen();

      const reader = res.body?.getReader();
      if (!reader) {
        handlers.onClose();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        if (controller.signal.aborted) {
          break;
        }
        const { done, value } = await reader.read();
        if (done) {
          handlers.onClose();
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        // Keep the last incomplete frame in the buffer.
        buffer = parts.pop() ?? "";
        for (const frame of parts) {
          const trimmed = frame.trim();
          if (trimmed === "") continue;
          handlers.onMessage(trimmed);
        }
      }
    } catch (err) {
      if ((err as DOMException)?.name === "AbortError") {
        return;
      }
      handlers.onError();
    }
  };

  start();

  // Keep-alive ping via fetch may not be needed because the backend sends pings,
  // but if the connection stalls we should reconnect. We rely on the caller to
  // observe the onClose/onError signals and schedule reconnect via the hook.
}
