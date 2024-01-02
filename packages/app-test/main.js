import { FormulaController } from './complie/parser'

console.log(
  new FormulaController({ formula: '1 + 2 > 3  且 {a} < 10 或 {a} > 1', factorList: ['a'] })
);
