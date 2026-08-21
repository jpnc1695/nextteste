export type Status = 'ABERTO' | 'VENCIDO' | 'LIQUIDADO';

export interface Titulo {
  cedente: string;
  sacado: string;
  nf: string;
  valor: number;
  vencimento: string; // YYYY-MM-DD
  status: Status;
}

export interface TituloProcessado extends Titulo {
  linha: number;            // número da linha no CSV (1 = primeira linha de dados)
  valido: boolean;
  erro?: string;
  // campos calculados
  vencidoOperacional?: boolean;
  pdd?: number;             // valor da provisão para esta linha
}

export interface EstoqueSnapshot {
  titulos: TituloProcessado[];  // apenas os válidos (ativos + liquidados)
  importados: number;           // quantidade de linhas válidas (não duplicadas e válidas)
  rejeitados: number;           // quantidade de linhas com erro
  erros: { linha: number; motivo: string }[];
  totais: {
    ativoQuantidade: number;
    ativoSoma: number;
    percentualVencido: number;
    pddTotal: number;
    maiorSacado: { nome: string; percentual: number } | null;
    concentracaoAlertas: { sacado: string; percentual: number }[];
  };
  dataReferencia: string; // "2026-08-21"
}

export interface ImportResponse {
  importados: number;
  rejeitados: number;
  erros: { linha: number; motivo: string }[];
  totais: EstoqueSnapshot['totais'];
}