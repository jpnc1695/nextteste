import { EstoqueSnapshot } from '@/types/estoque';

interface CardsProps {
  totais: EstoqueSnapshot['totais'] | null;
}

export default function Cards({ totais }: CardsProps) {
  if (!totais) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gray-100 p-4 rounded shadow">Nenhum dado</div>
      </div>
    );
  }

  const {
    ativoQuantidade,
    ativoSoma,
    percentualVencido,
    pddTotal,
    maiorSacado,
    concentracaoAlertas,
  } = totais;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <Card title="Qtde Ativa" value={ativoQuantidade} />
      <Card title="Soma Ativa" value={`R$ ${ativoSoma.toFixed(2)}`} />
      <Card title="% Vencido" value={`${percentualVencido.toFixed(1)}%`} />
      <Card title="PDD Total" value={`R$ ${pddTotal.toFixed(2)}`} />
      <Card
        title="Maior Sacado"
        value={maiorSacado ? `${maiorSacado.nome} (${maiorSacado.percentual.toFixed(1)}%)` : '-'}
      />
      {concentracaoAlertas.length > 0 && (
        <div className="col-span-full bg-yellow-100 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-700 font-semibold">⚠️ Alertas de concentração:</p>
          <ul className="list-disc list-inside">
            {concentracaoAlertas.map((a, i) => (
              <li key={i}>
                {a.sacado}: {a.percentual.toFixed(1)}% (limite 25%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white p-4 rounded shadow border border-gray-200">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}