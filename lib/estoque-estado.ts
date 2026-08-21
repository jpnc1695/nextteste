import { EstoqueSnapshot } from '@/types/estoque';
import fs from 'fs';
import path from 'path';

const SNAPSHOT_FILE = path.join(process.cwd(), 'estoque-snapshot.json');

let memoria: EstoqueSnapshot | null = null;

export function salvarSnapshot(snapshot: EstoqueSnapshot): void {
  memoria = snapshot;
  // Persiste em JSON para manter entre reinícios
  try {
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
  } catch {
    // ignore se não houver permissão
  }
}

export function carregarSnapshot(): EstoqueSnapshot | null {
  if (memoria) return memoria;
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      const data = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
      memoria = JSON.parse(data);
      return memoria;
    }
  } catch {
    // ignore
  }
  return null;
}

export function limparSnapshot(): void {
  memoria = null;
  try {
    if (fs.existsSync(SNAPSHOT_FILE)) {
      fs.unlinkSync(SNAPSHOT_FILE);
    }
  } catch {
    // ignore
  }
}