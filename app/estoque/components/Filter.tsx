'use client';

type FilterType = 'todos' | 'ABERTO' | 'VENCIDO' | 'LIQUIDADO';

interface FilterProps {
  filter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

export default function Filter({ filter, onFilterChange }: FilterProps) {
  const options: FilterType[] = ['todos', 'ABERTO', 'VENCIDO', 'LIQUIDADO'];
  return (
    <div className="flex gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onFilterChange(opt)}
          className={`px-3 py-1 rounded border ${
            filter === opt
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </button>
      ))}
    </div>
  );
}