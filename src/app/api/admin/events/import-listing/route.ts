import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession } from '@/lib/adminAuth';
import { fetchListingPage, extractEventLinks, detectPlatform } from '@/lib/aggregation/crawler';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { listingUrl, max = 15 } = await req.json();
    if (!listingUrl || typeof listingUrl !== 'string') {
      return NextResponse.json({ error: 'Valid listing URL is required' }, { status: 400 });
    }

    // 1. Fetch listing page text via Jina / direct fetch
    const rawHtml = await fetchListingPage(listingUrl);

    // 2. Extract deep-links for events
    const links = extractEventLinks(rawHtml);
    const selectedLinks = links.slice(0, Math.min(max, 30));

    await logAuditEvent({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      actorRole: auth.role,
      action: 'LISTING_PAGE_CRAWL',
      targetType: 'system',
      targetId: listingUrl,
      metadata: {
        listingUrl,
        foundCount: links.length,
        selectedCount: selectedLinks.length,
      },
    });

    return NextResponse.json({
      ok: true,
      found: links.length,
      links: selectedLinks,
      platform: detectPlatform(listingUrl),
    });
  } catch (err: any) {
    console.error('API /admin/events/import-listing error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to crawl listing page' },
      { status: 500 }
    );
  }
}
