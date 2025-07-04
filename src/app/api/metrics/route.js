import { NextResponse } from 'next/server';
import { register, collectDefaultMetrics } from 'prom-client';

// Collecte les métriques par défaut (CPU, mémoire, etc.)
collectDefaultMetrics({ prefix: 'frontend_' });

export async function GET() {
  try {
    const metrics = await register.metrics();
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-type': register.contentType,
      },
    });
  } catch (error) {
    console.error('Error generating metrics:', error);
    return new NextResponse('Error generating metrics', { status: 500 });
  }
} 