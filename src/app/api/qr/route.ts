import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get('data');

  if (!data) {
    return new NextResponse('Missing data parameter', { status: 400 });
  }

  try {
    const pngBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: 280,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    return new NextResponse(new Uint8Array(pngBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: any) {
    console.error('[QR Route Error]:', err);
    return new NextResponse('Failed to generate QR code', { status: 500 });
  }
}
