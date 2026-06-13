// Lista canónica de los 66 libros bíblicos en español.
// Se usa tanto para popular bible_books en la BD como para el parser de
// referencias (nombre/abreviatura → número de libro).

export interface BookMeta {
  numero: number
  nombre: string
  abreviatura: string
  testamento: 'AT' | 'NT'
  alternativas: string[] // formas adicionales que reconoce el parser
}

export const BIBLE_BOOKS: BookMeta[] = [
  // ── Antiguo Testamento ───────────────────────────────────
  { numero: 1,  nombre: 'Génesis',        abreviatura: 'Gn',   testamento: 'AT', alternativas: ['genesis', 'gen'] },
  { numero: 2,  nombre: 'Éxodo',          abreviatura: 'Éx',   testamento: 'AT', alternativas: ['exodo', 'ex'] },
  { numero: 3,  nombre: 'Levítico',       abreviatura: 'Lv',   testamento: 'AT', alternativas: ['levitico', 'lev'] },
  { numero: 4,  nombre: 'Números',        abreviatura: 'Nm',   testamento: 'AT', alternativas: ['numeros', 'num'] },
  { numero: 5,  nombre: 'Deuteronomio',   abreviatura: 'Dt',   testamento: 'AT', alternativas: ['deut'] },
  { numero: 6,  nombre: 'Josué',          abreviatura: 'Jos',  testamento: 'AT', alternativas: ['josue'] },
  { numero: 7,  nombre: 'Jueces',         abreviatura: 'Jue',  testamento: 'AT', alternativas: [] },
  { numero: 8,  nombre: 'Rut',            abreviatura: 'Rt',   testamento: 'AT', alternativas: [] },
  { numero: 9,  nombre: '1 Samuel',       abreviatura: '1 S',  testamento: 'AT', alternativas: ['1s', '1sam', 'i samuel', 'i s'] },
  { numero: 10, nombre: '2 Samuel',       abreviatura: '2 S',  testamento: 'AT', alternativas: ['2s', '2sam', 'ii samuel', 'ii s'] },
  { numero: 11, nombre: '1 Reyes',        abreviatura: '1 R',  testamento: 'AT', alternativas: ['1r', '1rey', 'i reyes'] },
  { numero: 12, nombre: '2 Reyes',        abreviatura: '2 R',  testamento: 'AT', alternativas: ['2r', '2rey', 'ii reyes'] },
  { numero: 13, nombre: '1 Crónicas',     abreviatura: '1 Cr', testamento: 'AT', alternativas: ['1cr', '1cron', 'i cronicas', 'i crónicas'] },
  { numero: 14, nombre: '2 Crónicas',     abreviatura: '2 Cr', testamento: 'AT', alternativas: ['2cr', '2cron', 'ii cronicas'] },
  { numero: 15, nombre: 'Esdras',         abreviatura: 'Esd',  testamento: 'AT', alternativas: [] },
  { numero: 16, nombre: 'Nehemías',       abreviatura: 'Neh',  testamento: 'AT', alternativas: ['nehemias'] },
  { numero: 17, nombre: 'Ester',          abreviatura: 'Est',  testamento: 'AT', alternativas: [] },
  { numero: 18, nombre: 'Job',            abreviatura: 'Job',  testamento: 'AT', alternativas: [] },
  { numero: 19, nombre: 'Salmos',         abreviatura: 'Sal',  testamento: 'AT', alternativas: ['salmo', 'ps', 'psa'] },
  { numero: 20, nombre: 'Proverbios',     abreviatura: 'Pr',   testamento: 'AT', alternativas: ['prov'] },
  { numero: 21, nombre: 'Eclesiastés',    abreviatura: 'Ec',   testamento: 'AT', alternativas: ['eclesiastes', 'ecl'] },
  { numero: 22, nombre: 'Cantares',       abreviatura: 'Cnt',  testamento: 'AT', alternativas: ['cantar', 'canticos'] },
  { numero: 23, nombre: 'Isaías',         abreviatura: 'Is',   testamento: 'AT', alternativas: ['isaias'] },
  { numero: 24, nombre: 'Jeremías',       abreviatura: 'Jer',  testamento: 'AT', alternativas: ['jeremias'] },
  { numero: 25, nombre: 'Lamentaciones',  abreviatura: 'Lm',   testamento: 'AT', alternativas: ['lam'] },
  { numero: 26, nombre: 'Ezequiel',       abreviatura: 'Ez',   testamento: 'AT', alternativas: [] },
  { numero: 27, nombre: 'Daniel',         abreviatura: 'Dn',   testamento: 'AT', alternativas: ['dan'] },
  { numero: 28, nombre: 'Oseas',          abreviatura: 'Os',   testamento: 'AT', alternativas: [] },
  { numero: 29, nombre: 'Joel',           abreviatura: 'Jl',   testamento: 'AT', alternativas: [] },
  { numero: 30, nombre: 'Amós',           abreviatura: 'Am',   testamento: 'AT', alternativas: ['amos'] },
  { numero: 31, nombre: 'Abdías',         abreviatura: 'Abd',  testamento: 'AT', alternativas: ['abdias'] },
  { numero: 32, nombre: 'Jonás',          abreviatura: 'Jon',  testamento: 'AT', alternativas: ['jonas'] },
  { numero: 33, nombre: 'Miqueas',        abreviatura: 'Mi',   testamento: 'AT', alternativas: [] },
  { numero: 34, nombre: 'Nahúm',          abreviatura: 'Nah',  testamento: 'AT', alternativas: ['nahum'] },
  { numero: 35, nombre: 'Habacuc',        abreviatura: 'Hab',  testamento: 'AT', alternativas: [] },
  { numero: 36, nombre: 'Sofonías',       abreviatura: 'Sof',  testamento: 'AT', alternativas: ['sofonias'] },
  { numero: 37, nombre: 'Hageo',          abreviatura: 'Hag',  testamento: 'AT', alternativas: [] },
  { numero: 38, nombre: 'Zacarías',       abreviatura: 'Zac',  testamento: 'AT', alternativas: ['zacarias'] },
  { numero: 39, nombre: 'Malaquías',      abreviatura: 'Mal',  testamento: 'AT', alternativas: ['malaquias'] },
  // ── Nuevo Testamento ─────────────────────────────────────
  { numero: 40, nombre: 'Mateo',          abreviatura: 'Mt',   testamento: 'NT', alternativas: ['mat'] },
  { numero: 41, nombre: 'Marcos',         abreviatura: 'Mr',   testamento: 'NT', alternativas: ['marc', 'mk'] },
  { numero: 42, nombre: 'Lucas',          abreviatura: 'Lc',   testamento: 'NT', alternativas: ['luc'] },
  { numero: 43, nombre: 'Juan',           abreviatura: 'Jn',   testamento: 'NT', alternativas: ['jua'] },
  { numero: 44, nombre: 'Hechos',         abreviatura: 'Hch',  testamento: 'NT', alternativas: ['act', 'hechos de los apostoles'] },
  { numero: 45, nombre: 'Romanos',        abreviatura: 'Ro',   testamento: 'NT', alternativas: ['rom'] },
  { numero: 46, nombre: '1 Corintios',    abreviatura: '1 Co', testamento: 'NT', alternativas: ['1co', '1cor', 'i corintios'] },
  { numero: 47, nombre: '2 Corintios',    abreviatura: '2 Co', testamento: 'NT', alternativas: ['2co', '2cor', 'ii corintios'] },
  { numero: 48, nombre: 'Gálatas',        abreviatura: 'Gá',   testamento: 'NT', alternativas: ['galatas', 'gal', 'ga'] },
  { numero: 49, nombre: 'Efesios',        abreviatura: 'Ef',   testamento: 'NT', alternativas: [] },
  { numero: 50, nombre: 'Filipenses',     abreviatura: 'Fil',  testamento: 'NT', alternativas: ['php', 'flp'] },
  { numero: 51, nombre: 'Colosenses',     abreviatura: 'Col',  testamento: 'NT', alternativas: [] },
  { numero: 52, nombre: '1 Tesalonicenses', abreviatura: '1 Ts', testamento: 'NT', alternativas: ['1ts', '1tes', 'i tesalonicenses'] },
  { numero: 53, nombre: '2 Tesalonicenses', abreviatura: '2 Ts', testamento: 'NT', alternativas: ['2ts', '2tes', 'ii tesalonicenses'] },
  { numero: 54, nombre: '1 Timoteo',      abreviatura: '1 Ti', testamento: 'NT', alternativas: ['1ti', '1tim', 'i timoteo'] },
  { numero: 55, nombre: '2 Timoteo',      abreviatura: '2 Ti', testamento: 'NT', alternativas: ['2ti', '2tim', 'ii timoteo'] },
  { numero: 56, nombre: 'Tito',           abreviatura: 'Tit',  testamento: 'NT', alternativas: [] },
  { numero: 57, nombre: 'Filemón',        abreviatura: 'Flm',  testamento: 'NT', alternativas: ['filemon'] },
  { numero: 58, nombre: 'Hebreos',        abreviatura: 'He',   testamento: 'NT', alternativas: ['heb'] },
  { numero: 59, nombre: 'Santiago',       abreviatura: 'Stg',  testamento: 'NT', alternativas: ['sant', 'jm'] },
  { numero: 60, nombre: '1 Pedro',        abreviatura: '1 P',  testamento: 'NT', alternativas: ['1p', '1pe', 'i pedro'] },
  { numero: 61, nombre: '2 Pedro',        abreviatura: '2 P',  testamento: 'NT', alternativas: ['2p', '2pe', 'ii pedro'] },
  { numero: 62, nombre: '1 Juan',         abreviatura: '1 Jn', testamento: 'NT', alternativas: ['1jn', 'i juan'] },
  { numero: 63, nombre: '2 Juan',         abreviatura: '2 Jn', testamento: 'NT', alternativas: ['2jn', 'ii juan'] },
  { numero: 64, nombre: '3 Juan',         abreviatura: '3 Jn', testamento: 'NT', alternativas: ['3jn', 'iii juan'] },
  { numero: 65, nombre: 'Judas',          abreviatura: 'Jud',  testamento: 'NT', alternativas: [] },
  { numero: 66, nombre: 'Apocalipsis',    abreviatura: 'Ap',   testamento: 'NT', alternativas: ['apoc', 'rev', 'revelacion'] },
]

// Mapa normalizado nombre/abreviatura/alternativa → número de libro.
// Normalización: minúsculas, sin tildes, sin espacios extra.
function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export const BOOK_LOOKUP: Map<string, number> = new Map()

for (const book of BIBLE_BOOKS) {
  BOOK_LOOKUP.set(norm(book.nombre), book.numero)
  BOOK_LOOKUP.set(norm(book.abreviatura), book.numero)
  for (const alt of book.alternativas) {
    BOOK_LOOKUP.set(norm(alt), book.numero)
  }
}
