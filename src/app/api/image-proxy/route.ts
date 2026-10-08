import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/image-proxy?url=<encoded_url>
 * 
 * Proxies external images to bypass hotlink restrictions (e.g. bmscdn.com, lumacdn, etc.),
 * handle CORS, and support arbitrary resolution posters across all platforms.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Valid image URL is required' }, { status: 400 });
    }

    // Server-side fetch with browser-like headers
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: '', // Empty referer bypasses anti-hotlink referer checks
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `Upstream image fetch failed: ${upstreamRes.status} ${upstreamRes.statusText}` },
        { status: upstreamRes.status }
      );
    }

    const contentType = upstreamRes.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await upstreamRes.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=2592000, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('Image proxy error:', err);
    return NextResponse.json({ error: err.message || 'Failed to proxy image' }, { status: 500 });
  }
}
