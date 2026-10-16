import asyncio
import json
from typing import AsyncGenerator, Set


class SSEEventBus:
    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=100)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue):
        self._subscribers.discard(q)

    async def broadcast(self, event_type: str, data: dict):
        if not self._subscribers:
            return
        payload = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
        dead_queues = set()
        for q in self._subscribers:
            try:
                q.put_nowait(payload)
            except asyncio.QueueFull:
                dead_queues.add(q)
        for dead in dead_queues:
            self.unsubscribe(dead)


event_bus = SSEEventBus()


async def sse_generator() -> AsyncGenerator[str, None]:
    q = event_bus.subscribe()
    # Send initial connection heartbeat
    yield "event: heartbeat\ndata: {\"status\": \"connected\"}\n\n"
    try:
        while True:
            # Wait for next event or heartbeat
            try:
                msg = await asyncio.wait_for(q.get(), timeout=15.0)
                yield msg
            except asyncio.TimeoutError:
                # Keep-alive heartbeat every 15s
                yield "event: ping\ndata: {}\n\n"
    finally:
        event_bus.unsubscribe(q)
