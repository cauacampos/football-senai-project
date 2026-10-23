export const POSICOES = ['GOL', 'ZAG', 'LAT', 'MEI', 'ATA'] as const;
export const CONDICOES = ['APTO', 'MAL_CONDICIONADO', 'DOENTE'] as const;

export type Posicao = (typeof POSICOES)[number];
export type Condicao = (typeof CONDICOES)[number];