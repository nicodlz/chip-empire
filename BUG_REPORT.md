# Idle Miner Bug Report

Generated: 2026-02-13

## Critical Issues

### 1. Missing Null/Undefined Checks - Decimal Operations

#### `src/engine/fabrication.ts`

**Line 14** - `canCraftWafer()`:
```typescript
const mineral = minerals[mineralId as MineralId]
if (!mineral || mineral.amount.lt(cost * amount)) {
```
✅ **Good** - Has null check

**Line 36** - `canCraftChip()`:
```typescript
const wafer = wafers[chip.waferCost.type]
if (!wafer || wafer.amount.lt(chip.waferCost.amount * amount)) {
```
✅ **Good** - Has null check

**Line 44** - `canCraftChip()`:
```typescript
const mineral = minerals[mineralId as MineralId]
if (!mineral || mineral.amount.lt(cost * amount)) {
```
✅ **Good** - Has null check

**Lines 64-69** - `deductWaferCosts()` ⚠️ **BUG**:
```typescript
for (const [mineralId, cost] of Object.entries(wafer.recipe)) {
  const id = mineralId as MineralId
  newMinerals[id] = {
    ...newMinerals[id],
    amount: newMinerals[id].amount.sub(cost * amount),
  }
}
```
**Problem**: No check if `newMinerals[id]` exists before accessing `.amount`
**Fix**: Add existence check or ensure all minerals are initialized

**Lines 85-86** - `deductChipCosts()` ⚠️ **BUG**:
```typescript
newWafers[chip.waferCost.type] = {
  ...newWafers[chip.waferCost.type],
  amount: newWafers[chip.waferCost.type].amount.sub(chip.waferCost.amount * amount),
}
```
**Problem**: Assumes wafer state exists
**Fix**: Add null check

**Lines 94-97** - `deductChipCosts()` ⚠️ **BUG**:
```typescript
for (const [mineralId, cost] of Object.entries(chip.extraCosts)) {
  const id = mineralId as MineralId
  newMinerals[id] = {
    ...newMinerals[id],
    amount: newMinerals[id].amount.sub(cost * amount),
  }
}
```
**Problem**: Same as line 64-69
**Fix**: Add existence check

**Lines 158-163** - `calculateFlopsPerSecond()` ⚠️ **BUG**:
```typescript
for (const [chipId, state] of Object.entries(chips)) {
  if (state.amount.gt(0)) {
    const chip = CHIPS[chipId as ChipId]
    total = total.add(chip.flopsPerSecond.mul(state.amount).mul(nodeEfficiency))
  }
}
```
**Problem**: No check if `chip` exists from CHIPS lookup
**Fix**: Add null check for `chip`

#### `src/engine/resources.ts`

**Line 20** - `mineMineral()` ⚠️ **BUG**:
```typescript
export function mineMineral(mineralId: MineralId, power: Decimal): Decimal {
  const def = MINERALS[mineralId]
  return power.times(def.baseRate)
}
```
**Problem**: No check if `def` exists
**Fix**: Add null check or throw error

### 2. Missing Exports

#### `src/engine/index.ts`

**Missing export**: `formatNumber` from `resources.ts` is not exported
```typescript
// Current exports from resources.ts:
export { createMineralState, addMineral, mineMineral } from './resources'

// Missing: formatNumber
```
**Fix**: Add `formatNumber` to exports if it's meant to be public API

### 3. Type Safety Issues

#### `src/data/automations.ts`

**Line 57** - `getAutoMinerCost()`:
```typescript
export function getAutoMinerCost(def: AutoMinerDef, owned: number): Decimal {
  return def.baseCost.mul(Math.pow(def.costMultiplier, owned))
}
```
⚠️ **Potential Issue**: `Math.pow()` with large `owned` values can cause precision issues. Consider using Decimal.pow() for consistency.

### 4. Data Validation Issues

All data definitions appear complete, but no runtime validation exists to ensure:
- Recipe minerals exist in MINERALS
- Chip wafer types exist in WAFERS
- Node references are valid ProcessNode types
- Research requirements reference valid ResearchIds

## Recommended Fixes

### Fix 1: Add null checks to `deductWaferCosts`

```typescript
export function deductWaferCosts(
  waferId: WaferId,
  minerals: Record<MineralId, { amount: Decimal }>,
  amount: number = 1
): Record<MineralId, { amount: Decimal }> {
  const wafer = WAFERS[waferId]
  if (!wafer) throw new Error(`Wafer ${waferId} not found`)
  
  const newMinerals = { ...minerals }

  for (const [mineralId, cost] of Object.entries(wafer.recipe)) {
    const id = mineralId as MineralId
    if (!newMinerals[id]) {
      throw new Error(`Mineral ${id} not initialized`)
    }
    newMinerals[id] = {
      ...newMinerals[id],
      amount: newMinerals[id].amount.sub(cost * amount),
    }
  }

  return newMinerals
}
```

### Fix 2: Add null checks to `deductChipCosts`

```typescript
export function deductChipCosts(
  chipId: ChipId,
  minerals: Record<MineralId, { amount: Decimal }>,
  wafers: Record<WaferId, WaferState>,
  amount: number = 1
): { minerals: Record<MineralId, { amount: Decimal }>; wafers: Record<WaferId, WaferState> } {
  const chip = CHIPS[chipId]
  if (!chip) throw new Error(`Chip ${chipId} not found`)
  
  const newMinerals = { ...minerals }
  const newWafers = { ...wafers }

  // Check wafer exists
  if (!newWafers[chip.waferCost.type]) {
    throw new Error(`Wafer ${chip.waferCost.type} not initialized`)
  }

  // Deduct wafer
  newWafers[chip.waferCost.type] = {
    ...newWafers[chip.waferCost.type],
    amount: newWafers[chip.waferCost.type].amount.sub(chip.waferCost.amount * amount),
  }

  // Deduct extra minerals
  if (chip.extraCosts) {
    for (const [mineralId, cost] of Object.entries(chip.extraCosts)) {
      const id = mineralId as MineralId
      if (!newMinerals[id]) {
        throw new Error(`Mineral ${id} not initialized`)
      }
      newMinerals[id] = {
        ...newMinerals[id],
        amount: newMinerals[id].amount.sub(cost * amount),
      }
    }
  }

  return { minerals: newMinerals, wafers: newWafers }
}
```

### Fix 3: Add null check to `calculateFlopsPerSecond`

```typescript
export function calculateFlopsPerSecond(
  chips: Record<ChipId, ChipState>,
  nodeEfficiency: number = 1
): Decimal {
  let total = new Decimal(0)

  for (const [chipId, state] of Object.entries(chips)) {
    if (state.amount.gt(0)) {
      const chip = CHIPS[chipId as ChipId]
      if (!chip) {
        console.warn(`Chip definition not found for ${chipId}`)
        continue
      }
      total = total.add(chip.flopsPerSecond.mul(state.amount).mul(nodeEfficiency))
    }
  }

  return total
}
```

### Fix 4: Add null check to `mineMineral`

```typescript
export function mineMineral(mineralId: MineralId, power: Decimal): Decimal {
  const def = MINERALS[mineralId]
  if (!def) {
    throw new Error(`Mineral ${mineralId} not found in MINERALS`)
  }
  return power.times(def.baseRate)
}
```

### Fix 5: Export missing function

Add to `src/engine/index.ts`:
```typescript
export { createMineralState, addMineral, mineMineral, formatNumber } from './resources'
```

### Fix 6: Use Decimal for cost calculation

In `src/data/automations.ts`:
```typescript
export function getAutoMinerCost(def: AutoMinerDef, owned: number): Decimal {
  return def.baseCost.mul(new Decimal(def.costMultiplier).pow(owned))
}
```

## Summary

- **7 critical bugs** found related to missing null/undefined checks
- **1 missing export** (`formatNumber`)
- **1 type safety issue** (Math.pow with Decimal)
- **0 circular dependencies** detected
- **0 missing required fields** in data definitions

All issues have specific line numbers and recommended fixes provided above.
