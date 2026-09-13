import { NextRequest, NextResponse } from 'next/server';
import { verifyStaffSession } from '@/lib/adminAuth';
import { scrapeUrlMetadata, extractEventFromText } from '@/lib/ai/eventExtractor';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyStaffSession(req);
    if (!auth.authorized || !auth.user) {
      return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json({ error: 'Please provide a valid http or https URL' }, { status: 400 });
    }

    // Step 1: Scrape raw metadata, OpenGraph tags, JSON-LD, prices
    const scraped = await scrapeUrlMetadata(url.trim());

    // Step 2: Use Gemini AI to structure and normalize
    let extracted = null;
    let aiError = null;
    try {
      const snippet = (scraped.bodySnippet || '').slice(0, 3000);
      extracted = await extractEventFromText(
        `Event URL: ${url}\nTitle: ${scraped.title}\nDescription: ${scraped.description}\nPlatform: ${scraped.platform}\nDetected Price: ${scraped.price || 'None'}\nPage Snippet:\n${snippet}`
      );
    } catch (e: any) {
      aiError = e.message || 'AI parsing exception';
    }

    return NextResponse.json({
      success: true,
      url,
      scraped,
      extracted,
      aiError,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Scraping failed' }, { status: 500 });
  }
}
