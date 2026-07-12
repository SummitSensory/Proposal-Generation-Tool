import { evaluate } from "mathjs";

export type DimensionField = {
  key: string;
  label: string;
  unit?: string;
};

export type BomFormulaEntry = {
  componentName: string;
  unit: string;
  formula: string; // math expression using dimension keys + "quantity"
};

export type ComputedBomLine = {
  componentName: string;
  unit: string;
  quantityPer: number;
  totalQuantity: number;
};

/**
 * Safely evaluates each BOM formula entry against the dimensions + line quantity
 * chosen on a proposal line item. Uses mathjs's sandboxed `evaluate` (no access to
 * Node globals/filesystem) so a malformed or malicious formula string can't do anything
 * beyond arithmetic on the provided scope.
 */
export function computeBom(
  bomFormula: BomFormulaEntry[],
  dimensions: Record<string, number>,
  lineQuantity: number
): ComputedBomLine[] {
  if (!Array.isArray(bomFormula) || bomFormula.length === 0) return [];

  const scope: Record<string, number> = { ...dimensions, quantity: lineQuantity };

  return bomFormula.map((entry) => {
    let quantityPer = 0;
    try {
      const result = evaluate(entry.formula, scope);
      quantityPer = typeof result === "number" && isFinite(result) ? result : 0;
    } catch {
      // Formula error -> surface as 0 so it's visibly wrong rather than crashing the proposal builder.
      quantityPer = 0;
    }
    // Round up: hardware counts should never come in short.
    const roundedPer = Math.ceil(quantityPer * 100) / 100;
    return {
      componentName: entry.componentName,
      unit: entry.unit,
      quantityPer: roundedPer,
      totalQuantity: Math.ceil(roundedPer * lineQuantity),
    };
  });
}
