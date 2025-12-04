// Unit conversion utilities

import { Unit } from './types';

// Conversion factors to base unit
export const UNIT_CONVERSIONS: Record<Unit, { base: Unit; factor: number }> = {
  Kg: { base: 'Kg', factor: 1 },
  Gram: { base: 'Kg', factor: 0.001 },
  Litre: { base: 'Litre', factor: 1 },
  Millilitre: { base: 'Litre', factor: 0.001 },
  Piece: { base: 'Piece', factor: 1 },
  Pack: { base: 'Pack', factor: 1 },
  Set: { base: 'Set', factor: 1 },
  Dozen: { base: 'Dozen', factor: 1 },
  Meter: { base: 'Meter', factor: 1 },
};

// Get related units for a base unit
export const UNIT_FAMILIES: Record<string, Unit[]> = {
  Kg: ['Kg', 'Gram'],
  Litre: ['Litre', 'Millilitre'],
  Piece: ['Piece'],
  Pack: ['Pack'],
  Set: ['Set'],
  Dozen: ['Dozen'],
  Meter: ['Meter'],
};

// Get available units for a base unit
export function getAvailableUnits(baseUnit: Unit): Unit[] {
  return UNIT_FAMILIES[baseUnit] || [baseUnit];
}

// Convert quantity from one unit to another
export function convertUnit(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit
): number {
  const fromConversion = UNIT_CONVERSIONS[fromUnit];
  const toConversion = UNIT_CONVERSIONS[toUnit];

  // Check if units are compatible
  if (fromConversion.base !== toConversion.base) {
    throw new Error(`Cannot convert between ${fromUnit} and ${toUnit}`);
  }

  // Convert to base unit first, then to target unit
  const baseQuantity = quantity * fromConversion.factor;
  const targetQuantity = baseQuantity / toConversion.factor;

  return targetQuantity;
}

// Convert to base unit
export function toBaseUnit(quantity: number, unit: Unit): number {
  return quantity * UNIT_CONVERSIONS[unit].factor;
}

// Convert from base unit
export function fromBaseUnit(quantity: number, baseUnit: Unit, targetUnit: Unit): number {
  const toConversion = UNIT_CONVERSIONS[targetUnit];
  
  if (UNIT_CONVERSIONS[baseUnit].base !== toConversion.base) {
    throw new Error(`Cannot convert between ${baseUnit} and ${targetUnit}`);
  }

  return quantity / toConversion.factor;
}

// Format quantity with unit
export function formatQuantity(quantity: number, unit: Unit): string {
  // Round to 2 decimal places for display
  const rounded = Math.round(quantity * 100) / 100;
  return `${rounded} ${unit}`;
}

// Validate if conversion is possible
export function canConvert(fromUnit: Unit, toUnit: Unit): boolean {
  return UNIT_CONVERSIONS[fromUnit].base === UNIT_CONVERSIONS[toUnit].base;
}
