import { NextRequest, NextResponse } from 'next/server';
import { processarCSV } from '@/lib/estoque-regras';
import { salvarSnapshot } from '@/lib/estoque-estado';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const content = await file.text();
    const result = processarCSV(content);

    if (result.erroGlobal || !result.snapshot) {
      return NextResponse.json(
        { error: result.erroGlobal || 'Arquivo rejeitado', response: result.response },
        { status: 400 }
      );
    }

    salvarSnapshot(result.snapshot);
    return NextResponse.json(result.response, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}