import { NextRequest, NextResponse } from 'next/server';
import { recordTelemetryHeartbeat, getTelemetrySummary } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';

/**
 * POST /api/telemetry/heartbeat
 * Records an active user session ping
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      sessionId = 'anon-' + Math.random().toString(36).slice(2, 9),
      pathname = '/',
      durationSeconds = 30,
      userEmail,
    } = body;

    const activeVisitors = await recordTelemetryHeartbeat({
      sessionId,
      pathname,
      durationSeconds,
      userEmail,
    });

    return NextResponse.json({ ok: true, activeVisitors });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/telemetry/heartbeat
 * Retrieves time-spent summary for admin analytics
 */
export async function GET() {
  const summary = getTelemetrySummary();
  return NextResponse.json(summary);
}
