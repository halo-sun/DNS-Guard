from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from ..streaming.event_bus import sse_generator

router = APIRouter(prefix="/stream", tags=["Streaming"])


@router.get("/events")
async def stream_dns_events():
    """
    Server-Sent Events endpoint streaming real-time events and alerts.
    Clients receive 'dns_event', 'alert', 'ping', and 'heartbeat'.
    """
    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
