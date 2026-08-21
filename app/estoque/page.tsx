'use client';

import { useEffect, useState } from 'react';
import ImportButton from './components/ImportButton';
import Cards from './components/Cards';
import Filter from './components/Filter';
import ErrorPanel from './components/ErrorPanel';
import Tabela from './components/Tabela';
import { EstoqueSnapshot } from '@/types/estoque';


type FilterType = 'todos' | 'ABERTO' | 'VENCIDO' | 'LIQUIDADO';

export default function EstoquePage() {
  const [snapshot, setSnapshot] = useState<EstoqueSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Carrega snapshot inicial
  useEffect(() => {
    carregarSnapshot();
  }, []);

  async function carregarSnapshot() {
    try {
      const res = await fetch('/api/estoque');
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data.snapshot || null);
      }
    } catch {
      // ignore
    }
  }

  async function handleImport(file: File) {
    setLoading(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/estoque/import', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        // Arquivo rejeitado ou erro
        setErrorMessage(data.error || 'Erro ao importar');
        // Atualiza os erros para exibição (se houver)
        if (data.response?.erros) {
          // podemos atualizar o snapshot com os erros? Mas não houve gravação.
          // Apenas mostramos o erro.
        }
        // Recarrega o snapshot anterior (pode ser nulo)
        await carregarSnapshot();
      } else {
        // Sucesso: recarrega o snapshot
        await carregarSnapshot();
        setErrorMessage(null);
      }
    } catch (err) {
      setErrorMessage('Erro de rede ao importar');
    } finally {
      setLoading(false);
    }
  }

  // Filtragem
  const titulosFiltrados = snapshot?.titulos?.filter((t) => {
    if (filter === 'todos') return true;
    if (filter === 'VENCIDO') return t.vencidoOperacional === true;
    return t.status === filter;
  }) || [];

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Gestão de Estoque</h1>

      <div className="mb-4 flex items-center gap-4 flex-wrap">
        <ImportButton onImport={handleImport} loading={loading} />
        {errorMessage && (
          <span className="text-red-600 font-medium">{errorMessage}</span>
        )}
        <span className="text-sm text-gray-500">
          Referência: {snapshot?.dataReferencia || '2026-08-21'}
        </span>
      </div>

      {snapshot && (
        <>
          <Cards totais={snapshot.totais} />
          <ErrorPanel erros={snapshot.erros} />
          <Filter filter={filter} onFilterChange={setFilter} />
          <Tabela
            titulos={titulosFiltrados}
            alertasConcentracao={snapshot.totais?.concentracaoAlertas || []}
          />
        </>
      )}

      {!snapshot && !loading && (
        <div className="text-center py-10 text-gray-500">
          Nenhum estoque carregado. Importe um arquivo CSV.
        </div>
      )}
    </div>
  );
}