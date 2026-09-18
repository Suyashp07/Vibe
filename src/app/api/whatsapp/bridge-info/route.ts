import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const bridgeUrl = (process.env.WHATSAPP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
  const fallbackPhone = process.env.WHATSAPP_HOST_PHONE || '916264984285';

  try {
    const res = await fetch(bridgeUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        ok: true,
        connected: data.status === 'connected',
        phone: data.phone || fallbackPhone,
        status: data.status,
      });
    }
  } catch (e) {
    // Bridge might be offline or warming up
  }

  return NextResponse.json({
    ok: true,
    connected: false,
    phone: fallbackPhone,
    status: 'disconnected',
  });
}
