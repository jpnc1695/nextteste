import { Titulo, TituloProcessado, Status, EstoqueSnapshot, ImportResponse } from '@/types/estoque';
import { DATA_REFERENCIA, parseDate, isVencido, calcularPDD } from '@/utils/date';

// Validação de uma linha (retorna erro ou null)
function validarLinha(
  obj: any,
  linhaNum: number,
  cabecalho: string[]
): { valido: boolean; titulo?: Titulo; erro?: string } {
  if (cabecalho.length !== 6) {
    return { valido: false, erro: 'Cabeçalho inválido' };
  }

  const cedente = String(obj.cedente || '').trim();
  const sacado = String(obj.sacado || '').trim();
  const nf = String(obj.nf || '').trim();
  const valorStr = String(obj.valor || '').trim().replace(',', '.');
  const vencimento = String(obj.vencimento || '').trim();
  const status = String(obj.status || '').trim().toUpperCase() as Status;

  // Validações
  if (!nf) return { valido: false, erro: 'NF vazia' };

  const valor = parseFloat(valorStr);
  if (isNaN(valor) || valor <= 0) return { valido: false, erro: 'Valor inválido (deve ser > 0)' };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(vencimento)) {
    return { valido: false, erro: 'Data de vencimento fora do formato YYYY-MM-DD' };
  }
  const dataValida = parseDate(vencimento);
  if (!dataValida) return { valido: false, erro: 'Data de vencimento inválida' };

  if (!['ABERTO', 'VENCIDO', 'LIQUIDADO'].includes(status)) {
    return { valido: false, erro: `Status inválido (${status})` };
  }

  return {
    valido: true,
    titulo: {
      cedente,
      sacado,
      nf,
      valor,
      vencimento,
      status,
    },
  };
}

// Função principal de processamento do CSV
export function processarCSV(
  csvContent: string
): {
  snapshot: EstoqueSnapshot | null; // null se arquivo for rejeitado
  response: ImportResponse;
  erroGlobal?: string; // se cabeçalho errado
} {
  const linhas = csvContent.split('\n').filter(line => line.trim() !== '');
  if (linhas.length === 0) {
    return {
      snapshot: null,
      response: { importados: 0, rejeitados: 0, erros: [], totais: totaisVazios() },
      erroGlobal: 'Arquivo vazio',
    };
  }

  const cabecalho = linhas[0].split(',').map(h => h.trim().toLowerCase());
  const esperado = ['cedente', 'sacado', 'nf', 'valor', 'vencimento', 'status'];
  if (cabecalho.length !== esperado.length || !esperado.every((e, i) => e === cabecalho[i])) {
    return {
      snapshot: null,
      response: { importados: 0, rejeitados: 0, erros: [], totais: totaisVazios() },
      erroGlobal: 'Cabeçalho inválido. Esperado: cedente,sacado,nf,valor,vencimento,status',
    };
  }

  const dadosLinhas = linhas.slice(1);
  const titulosValidos: Titulo[] = [];
  const erros: { linha: number; motivo: string }[] = [];
  const duplicatas = new Map<string, boolean>(); // chave: cedente+nf (lowercase, trim)

  for (let i = 0; i < dadosLinhas.length; i++) {
    const linha = dadosLinhas[i].trim();
    if (linha === '') continue; // linhas em branco ignoradas

    const cols = linha.split(',').map(c => c.trim());
    if (cols.length < 6) {
      erros.push({ linha: i + 1, motivo: 'Número de colunas insuficiente' });
      continue;
    }

    const obj = {
      cedente: cols[0],
      sacado: cols[1],
      nf: cols[2],
      valor: cols[3],
      vencimento: cols[4],
      status: cols[5],
    };

    const resultado = validarLinha(obj, i + 1, cabecalho);
    if (!resultado.valido) {
      erros.push({ linha: i + 1, motivo: resultado.erro || 'Erro de validação' });
      continue;
    }

    // Duplicata
    const chave = `${resultado.titulo!.cedente.toLowerCase().trim()}|${resultado.titulo!.nf.toLowerCase().trim()}`;
    if (duplicatas.has(chave)) {
      erros.push({ linha: i + 1, motivo: 'NF duplicada' });
      continue;
    }
    duplicatas.set(chave, true);
    titulosValidos.push(resultado.titulo!);
  }

  // Verificar taxa de erro (sobre linhas não vazias)
  const totalLinhasNaoVazias = dadosLinhas.filter(l => l.trim() !== '').length;
  const taxaErro = totalLinhasNaoVazias > 0 ? erros.length / totalLinhasNaoVazias : 0;

  if (taxaErro > 0.2) {
    // Arquivo rejeitado - não gera snapshot
    return {
      snapshot: null,
      response: {
        importados: 0,
        rejeitados: erros.length,
        erros,
        totais: totaisVazios(),
      },
      erroGlobal: `Arquivo rejeitado por excesso de erros (${(taxaErro * 100).toFixed(1)}% > 20%)`,
    };
  }

  // Processar titulos válidos (aplicar PDD, vencido, concentração)
  const processados = processarTitulos(titulosValidos);
  const totais = calcularTotais(processados);

  const snapshot: EstoqueSnapshot = {
    titulos: processados,
    importados: processados.filter(t => t.valido).length,
    rejeitados: erros.length,
    erros,
    totais,
    dataReferencia: DATA_REFERENCIA,
  };

  return {
    snapshot,
    response: {
      importados: snapshot.importados,
      rejeitados: snapshot.rejeitados,
      erros: snapshot.erros,
      totais: snapshot.totais,
    },
  };
}

function processarTitulos(titulos: Titulo[]): TituloProcessado[] {
  return titulos.map((t, index) => {
    const ativo = t.status !== 'LIQUIDADO';
    const vencidoOp = ativo && (t.status === 'VENCIDO' || isVencido(t.vencimento));
    const pdd = ativo ? calcularPDD(t.vencimento, t.valor) : 0;
    return {
      ...t,
      linha: index + 1,
      valido: true,
      vencidoOperacional: vencidoOp,
      pdd,
    };
  });
}

function calcularTotais(titulos: TituloProcessado[]): EstoqueSnapshot['totais'] {
  const ativos = titulos.filter(t => t.status !== 'LIQUIDADO');
  const ativoQuantidade = ativos.length;
  const ativoSoma = ativos.reduce((sum, t) => sum + t.valor, 0);

  const vencidos = ativos.filter(t => t.vencidoOperacional);
  const somaVencidos = vencidos.reduce((sum, t) => sum + t.valor, 0);
  const percentualVencido = ativoSoma > 0 ? (somaVencidos / ativoSoma) * 100 : 0;

  const pddTotal = ativos.reduce((sum, t) => sum + (t.pdd || 0), 0);

  // Concentração por sacado
  const mapSacado = new Map<string, number>();
  ativos.forEach(t => {
    const chave = t.sacado.toLowerCase().trim();
    mapSacado.set(chave, (mapSacado.get(chave) || 0) + t.valor);
  });

  let maiorSacado: { nome: string; percentual: number } | null = null;
  const alertas: { sacado: string; percentual: number }[] = [];
  if (ativoSoma > 0) {
    for (const [chave, valor] of mapSacado) {
      const pct = (valor / ativoSoma) * 100;
      if (pct > 25) {
        alertas.push({ sacado: chave, percentual: pct });
      }
      if (!maiorSacado || pct > maiorSacado.percentual) {
        maiorSacado = { nome: chave, percentual: pct };
      }
    }
  }

  return {
    ativoQuantidade,
    ativoSoma,
    percentualVencido,
    pddTotal,
    maiorSacado,
    concentracaoAlertas: alertas,
  };
}

function totaisVazios(): EstoqueSnapshot['totais'] {
  return {
    ativoQuantidade: 0,
    ativoSoma: 0,
    percentualVencido: 0,
    pddTotal: 0,
    maiorSacado: null,
    concentracaoAlertas: [],
  };
}