import { NextResponse } from 'next/server';
import { carregarSnapshot } from '@/lib/estoque-estado';

export async function GET() {
  const snapshot = carregarSnapshot();
  if (!snapshot) {
    return NextResponse.json({ snapshot: null, totais: null });
  }
  return NextResponse.json({
    snapshot,
    totais: snapshot.totais,
  });
}