import httpx
from fastapi import Request, Response
from fastapi.responses import StreamingResponse

from app.config import SPRING_SERVICE_URL

HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "content-length",
    "host",
}


def _filtered_headers(headers) -> dict[str, str]:
    return {
        key: value
        for key, value in headers.items()
        if key.lower() not in HOP_BY_HOP
    }


def _build_url(path: str, query: str | None) -> str:
    url = f"{SPRING_SERVICE_URL}{path}"
    if query:
        url = f"{url}?{query}"
    return url


async def _stream_response(client: httpx.AsyncClient, request: httpx.Request):
    async with client.stream(
        request.method,
        request.url,
        headers=request.headers,
        content=request.content,
    ) as response:
        response_headers = _filtered_headers(response.headers)
        media_type = response.headers.get("content-type")

        async def iterator():
            async for chunk in response.aiter_bytes():
                yield chunk

        return StreamingResponse(
            iterator(),
            status_code=response.status_code,
            headers=response_headers,
            media_type=media_type,
        )


async def forward(request: Request, path: str) -> Response:
    url = _build_url(path, request.url.query)
    headers = _filtered_headers(request.headers)
    body = await request.body()
    accept = request.headers.get("accept", "")
    is_sse = "text/event-stream" in accept

    timeout = httpx.Timeout(120.0, read=None if is_sse else 120.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        if is_sse:
            upstream = client.build_request(
                request.method,
                url,
                headers=headers,
                content=body,
            )
            return await _stream_response(client, upstream)

        response = await client.request(
            request.method,
            url,
            headers=headers,
            content=body,
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=_filtered_headers(response.headers),
        media_type=response.headers.get("content-type"),
    )
