interface ErrorPanelProps {
  erros: { linha: number; motivo: string }[];
}

export default function ErrorPanel({ erros }: ErrorPanelProps) {
  if (erros.length === 0) return null;
  return (
    <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
      <h3 className="text-red-800 font-semibold">Erros ({erros.length})</h3>
      <ul className="list-disc list-inside text-sm text-red-700 max-h-60 overflow-y-auto">
        {erros.map((e, i) => (
          <li key={i}>
            Linha {e.linha}: {e.motivo}
          </li>
        ))}
      </ul>
    </div>
  );
}