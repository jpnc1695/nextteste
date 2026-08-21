import { TituloProcessado } from '@/types/estoque';
import { DATA_REFERENCIA } from '@/utils/date';

interface TabelaProps {
  titulos: TituloProcessado[];
  alertasConcentracao: { sacado: string; percentual: number }[];
}

export default function Tabela({ titulos, alertasConcentracao }: TabelaProps) {
  const alertaMap = new Map(alertasConcentracao.map(a => [a.sacado.toLowerCase().trim(), a.percentual]));

  const getLinhaClass = (t: TituloProcessado) => {
    if (t.status === 'LIQUIDADO') return 'bg-gray-100 text-gray-500';
    if (t.vencidoOperacional) return 'bg-red-100 text-red-800';
    if (alertaMap.has(t.sacado.toLowerCase().trim())) return 'bg-yellow-100 text-yellow-800';
    return '';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cedente</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sacado</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">NF</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">PDD</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {titulos.map((t, idx) => (
            <tr key={idx} className={getLinhaClass(t)}>
              <td className="px-4 py-2 text-sm">{t.cedente}</td>
              <td className="px-4 py-2 text-sm">{t.sacado}</td>
              <td className="px-4 py-2 text-sm">{t.nf}</td>
              <td className="px-4 py-2 text-sm text-right">{t.valor.toFixed(2)}</td>
              <td className="px-4 py-2 text-sm">{t.vencimento}</td>
              <td className="px-4 py-2 text-sm">{t.status}</td>
              <td className="px-4 py-2 text-sm text-right">{t.pdd?.toFixed(2) || '-'}</td>
            </tr>
          ))}
          {titulos.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                Nenhum título importado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}