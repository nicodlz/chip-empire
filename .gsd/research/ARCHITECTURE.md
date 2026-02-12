# Idle Miner Architecture

## Overview

Idle games have unique architectural requirements: frequent state updates, exponentially growing numbers, offline progress calculation, and prestige systems. This document outlines a robust architecture for React + Zustand.

---

## 1. Game Loop Structure

### Tick Rate & Update Batching

**Recommended: Fixed timestep with variable rendering**

```typescript
// Core game loop (runs in requestAnimationFrame or setInterval)
const TICK_RATE = 100; // ms between ticks (10 ticks/sec)
const MAX_CATCHUP_TICKS = 100; // Prevent spiral of death

let lastTick = Date.now();

function gameLoop() {
  const now = Date.now();
  let ticksToProcess = Math.floor((now - lastTick) / TICK_RATE);
  
  // Clamp to prevent freeze on tab return
  ticksToProcess = Math.min(ticksToProcess, MAX_CATCHUP_TICKS);
  
  for (let i = 0; i < ticksToProcess; i++) {
    tick(TICK_RATE / 1000); // Process one tick (in seconds)
  }
  
  lastTick += ticksToProcess * TICK_RATE;
  requestAnimationFrame(gameLoop);
}
```

**Why 100ms (10 ticks/sec)?**
- Fast enough for responsive UI
- Slow enough for efficient batching
- Easy math (10 ticks = 1 second)
- Matches human perception threshold

### Separation of Concerns

```
┌─────────────────────────────────────────────────────┐
│                   GAME ENGINE                        │
│  (Pure logic, no React dependencies)                │
├─────────────────────────────────────────────────────┤
│  • tick(deltaTime) - Core update loop               │
│  • calculateProduction() - Resource math            │
│  • applyUpgrade() - Modifier application            │
│  • processOffline() - Catchup calculation           │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  ZUSTAND STORE                       │
│  (State container, actions trigger engine)          │
├─────────────────────────────────────────────────────┤
│  • State shape (resources, upgrades, etc.)          │
│  • Actions call engine functions                    │
│  • Subscribe to state changes                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 REACT COMPONENTS                     │
│  (Render only, selector-based subscriptions)        │
└─────────────────────────────────────────────────────┘
```

---

## 2. State Shape

### Core State Structure

```typescript
import Decimal from 'break_infinity.js';

interface GameState {
  // Meta
  meta: {
    lastTick: number;        // Unix timestamp
    totalPlaytime: number;   // Seconds
    version: string;         // For migrations
  };

  // Resources
  resources: {
    gold: Decimal;           // Primary currency
    gems: Decimal;           // Premium currency
    prestigePoints: Decimal; // Prestige currency
  };

  // Generators (miners)
  miners: {
    [minerId: string]: {
      owned: Decimal;        // Total owned (including produced)
      purchased: Decimal;    // Manually bought (for cost calc)
      unlocked: boolean;
    };
  };

  // Upgrades
  upgrades: {
    [upgradeId: string]: {
      level: number;
      unlocked: boolean;
    };
  };

  // Achievements
  achievements: {
    [achievementId: string]: {
      unlocked: boolean;
      unlockedAt?: number;
    };
  };

  // Prestige
  prestige: {
    timesReset: number;
    lifetimeGold: Decimal;
    maxGold: Decimal;        // For prestige calculation
    multiplier: Decimal;     // Cumulative prestige bonus
  };

  // Settings
  settings: {
    notation: 'scientific' | 'engineering' | 'letters';
    autoSaveInterval: number;
    offlineProgressEnabled: boolean;
  };
}
```

### Static Data (Separate from State)

```typescript
// gameData.ts - NOT in Zustand store
export const MINERS: Record<string, MinerDefinition> = {
  pickaxe: {
    id: 'pickaxe',
    name: 'Pickaxe',
    baseCost: new Decimal(10),
    costGrowth: 1.15,        // 15% increase per purchase
    baseProduction: new Decimal(1),
    unlockCondition: () => true,
  },
  drill: {
    id: 'drill',
    name: 'Drill',
    baseCost: new Decimal(100),
    costGrowth: 1.14,
    baseProduction: new Decimal(8),
    unlockCondition: (state) => state.resources.gold.gte(50),
  },
  // ... more miners
};

export const UPGRADES: Record<string, UpgradeDefinition> = {
  sharperPicks: {
    id: 'sharperPicks',
    name: 'Sharper Picks',
    description: 'Pickaxes produce 2x more',
    baseCost: new Decimal(100),
    costGrowth: 2.0,
    maxLevel: 10,
    effect: (level) => new Decimal(2).pow(level),
    targets: ['pickaxe'],
  },
  // ...
};
```

---

## 3. Big Number Handling

### Use break_infinity.js

```bash
npm install break_infinity.js
```

**Why break_infinity.js?**
- Handles numbers up to 1e9e15 (far beyond JavaScript's 1e308)
- 2-400x faster than decimal.js for common operations
- Drop-in replacement for decimal.js API
- Used by Antimatter Dimensions, proven in production

```typescript
import Decimal from 'break_infinity.js';

// Always use Decimal for game values
const gold = new Decimal(1000);
const production = gold.times(1.5).plus(100);

// Comparisons
if (gold.gte(cost)) { /* can afford */ }

// Formatting
function formatNumber(value: Decimal, precision = 2): string {
  if (value.lt(1000)) return value.toFixed(precision);
  if (value.lt(1e6)) return value.toFixed(0);
  if (value.lt(1e9)) return (value.div(1e6).toFixed(2)) + 'M';
  return value.toExponential(precision);
}
```

---

## 4. Cost & Production Formulas

### Generator Cost (Exponential)

```typescript
// Cost for next generator
function getNextCost(miner: MinerDefinition, purchased: Decimal): Decimal {
  return miner.baseCost.times(
    Decimal.pow(miner.costGrowth, purchased)
  );
}

// Cost to buy N generators (closed form - much faster than loop)
function getBulkCost(miner: MinerDefinition, owned: Decimal, count: number): Decimal {
  const r = miner.costGrowth;
  const b = miner.baseCost;
  const k = owned.toNumber();
  
  // b * (r^k * (r^n - 1)) / (r - 1)
  return b.times(
    Decimal.pow(r, k).times(Decimal.pow(r, count).minus(1)).div(r - 1)
  );
}

// Max affordable
function getMaxAffordable(miner: MinerDefinition, owned: Decimal, currency: Decimal): number {
  const r = miner.costGrowth;
  const b = miner.baseCost;
  const k = owned.toNumber();
  const c = currency;
  
  // floor(log_r((c*(r-1))/(b*r^k) + 1))
  const inner = c.times(r - 1).div(b.times(Decimal.pow(r, k))).plus(1);
  return Math.floor(inner.log(r));
}
```

### Production Calculation

```typescript
function calculateTotalProduction(state: GameState): Decimal {
  let total = new Decimal(0);

  for (const [minerId, minerState] of Object.entries(state.miners)) {
    if (!minerState.unlocked) continue;
    
    const def = MINERS[minerId];
    const baseProduction = def.baseProduction.times(minerState.owned);
    
    // Apply multipliers
    let multiplier = new Decimal(1);
    
    // From upgrades
    for (const [upgradeId, upgradeState] of Object.entries(state.upgrades)) {
      const upgDef = UPGRADES[upgradeId];
      if (upgDef.targets.includes(minerId) && upgradeState.level > 0) {
        multiplier = multiplier.times(upgDef.effect(upgradeState.level));
      }
    }
    
    // From prestige
    multiplier = multiplier.times(state.prestige.multiplier);
    
    // From achievements (global bonus)
    const achievementBonus = calculateAchievementBonus(state);
    multiplier = multiplier.times(achievementBonus);
    
    total = total.plus(baseProduction.times(multiplier));
  }

  return total;
}
```

---

## 5. Offline Progress

### Calculation Strategy

**Option A: Simulation (more accurate, slower)**
```typescript
function calculateOfflineProgress(state: GameState, offlineSeconds: number): GameState {
  const OFFLINE_TICK = 1; // 1 second per simulated tick
  const MAX_OFFLINE = 86400; // Cap at 24 hours
  
  let simState = { ...state };
  const ticksToSimulate = Math.min(offlineSeconds, MAX_OFFLINE);
  
  for (let i = 0; i < ticksToSimulate; i++) {
    const production = calculateTotalProduction(simState);
    simState.resources.gold = simState.resources.gold.plus(production);
    // Don't auto-buy during offline (too complex/slow)
  }
  
  return simState;
}
```

**Option B: Analytical (faster, simpler)**
```typescript
function calculateOfflineProgress(state: GameState, offlineSeconds: number): Decimal {
  const MAX_OFFLINE = 86400;
  const effectiveSeconds = Math.min(offlineSeconds, MAX_OFFLINE);
  
  // Simple: production * time * efficiency
  const OFFLINE_EFFICIENCY = 0.5; // 50% of online production
  const production = calculateTotalProduction(state);
  
  return production.times(effectiveSeconds).times(OFFLINE_EFFICIENCY);
}
```

**Recommended: Hybrid approach**
- Use analytical for simple games
- Use simulation with coarse timesteps for games with auto-buy

### Offline Progress UI

```typescript
function showOfflineProgress(gained: Decimal, duration: number) {
  // Show modal with:
  // - Time away (formatted)
  // - Resources gained
  // - Option to watch ad for bonus (mobile)
}
```

---

## 6. Save/Load System

### Save Structure

```typescript
interface SaveData {
  version: string;
  timestamp: number;
  state: SerializedGameState;
  checksum?: string;
}

// Decimals must be serialized
interface SerializedGameState {
  // Same shape as GameState, but Decimals become strings
  resources: {
    gold: string;  // "1.5e100"
    gems: string;
    prestigePoints: string;
  };
  // ...
}
```

### Serialization

```typescript
function serializeState(state: GameState): SerializedGameState {
  return JSON.parse(JSON.stringify(state, (key, value) => {
    if (value instanceof Decimal) {
      return { __decimal: value.toString() };
    }
    return value;
  }));
}

function deserializeState(data: SerializedGameState): GameState {
  return JSON.parse(JSON.stringify(data), (key, value) => {
    if (value && value.__decimal) {
      return new Decimal(value.__decimal);
    }
    return value;
  });
}
```

### Save Triggers

```typescript
// Auto-save every 30 seconds
const AUTO_SAVE_INTERVAL = 30000;

// Also save on:
// - Prestige
// - Major purchases
// - Tab visibility change (beforeunload is unreliable on mobile)
// - App backgrounding (for PWA/Capacitor)

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveGame();
  }
});
```

### Migrations

```typescript
const MIGRATIONS: Record<string, (state: any) => any> = {
  '0.1.0': (state) => {
    // Add new field
    state.settings.notation = state.settings.notation || 'scientific';
    return state;
  },
  '0.2.0': (state) => {
    // Rename field
    state.prestige.multiplier = state.prestige.bonus;
    delete state.prestige.bonus;
    return state;
  },
};

function migrateState(saveData: SaveData): GameState {
  const versions = Object.keys(MIGRATIONS).sort(semverCompare);
  let state = saveData.state;
  
  for (const version of versions) {
    if (semverCompare(saveData.version, version) < 0) {
      state = MIGRATIONS[version](state);
    }
  }
  
  return deserializeState(state);
}
```

---

## 7. Zustand Store Architecture

### Store Setup

```typescript
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface GameActions {
  // Core
  tick: (deltaTime: number) => void;
  
  // Resources
  addResource: (resource: keyof Resources, amount: Decimal) => void;
  
  // Miners
  buyMiner: (minerId: string, count?: number) => void;
  
  // Upgrades
  buyUpgrade: (upgradeId: string) => void;
  
  // Prestige
  prestige: () => void;
  
  // Save/Load
  save: () => void;
  load: (data: SaveData) => void;
  reset: () => void;
}

export const useGameStore = create<GameState & GameActions>()(
  subscribeWithSelector(
    persist(
      immer((set, get) => ({
        // Initial state
        ...createInitialState(),
        
        // Actions
        tick: (deltaTime) => set((state) => {
          const production = calculateTotalProduction(state);
          state.resources.gold = state.resources.gold.plus(
            production.times(deltaTime)
          );
          state.meta.lastTick = Date.now();
          state.meta.totalPlaytime += deltaTime;
          
          // Update max gold for prestige
          if (state.resources.gold.gt(state.prestige.maxGold)) {
            state.prestige.maxGold = state.resources.gold;
          }
        }),
        
        buyMiner: (minerId, count = 1) => set((state) => {
          const def = MINERS[minerId];
          const miner = state.miners[minerId];
          const cost = getBulkCost(def, miner.purchased, count);
          
          if (state.resources.gold.gte(cost)) {
            state.resources.gold = state.resources.gold.minus(cost);
            miner.owned = miner.owned.plus(count);
            miner.purchased = miner.purchased.plus(count);
          }
        }),
        
        prestige: () => set((state) => {
          const gained = calculatePrestigeGain(state);
          if (gained.lte(0)) return;
          
          // Add prestige currency
          state.resources.prestigePoints = state.resources.prestigePoints.plus(gained);
          state.prestige.timesReset += 1;
          state.prestige.lifetimeGold = state.prestige.lifetimeGold.plus(
            state.resources.gold
          );
          
          // Reset (keep prestige stuff)
          const preserved = {
            prestige: state.prestige,
            resources: { prestigePoints: state.resources.prestigePoints },
            achievements: state.achievements,
            settings: state.settings,
          };
          
          Object.assign(state, createInitialState(), preserved);
          state.prestige.multiplier = calculatePrestigeMultiplier(
            state.resources.prestigePoints
          );
        }),
        
        // ... more actions
      })),
      {
        name: 'idle-miner-save',
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => serializeState(state),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Calculate offline progress
            const now = Date.now();
            const offlineTime = (now - state.meta.lastTick) / 1000;
            if (offlineTime > 60) { // More than 1 minute
              const gained = calculateOfflineProgress(state, offlineTime);
              state.resources.gold = state.resources.gold.plus(gained);
              // Show offline modal
            }
          }
        },
      }
    )
  )
);
```

### Selectors for Performance

```typescript
// ❌ Bad: Subscribes to entire store
function MinerDisplay({ minerId }) {
  const state = useGameStore();
  return <div>{state.miners[minerId].owned.toString()}</div>;
}

// ✅ Good: Subscribes only to specific slice
function MinerDisplay({ minerId }) {
  const owned = useGameStore((state) => state.miners[minerId].owned);
  return <div>{owned.toString()}</div>;
}

// ✅ Best: Memoized selector for derived data
const selectProductionRate = (state: GameState) => 
  calculateTotalProduction(state);

function ProductionDisplay() {
  const production = useGameStore(selectProductionRate);
  return <div>{formatNumber(production)}/s</div>;
}
```

### External Actions (No Hook Required)

```typescript
// For game loop - doesn't need React context
export const gameTick = (deltaTime: number) => 
  useGameStore.getState().tick(deltaTime);

export const gameSave = () => 
  useGameStore.getState().save();

// Start game loop outside React
let animationId: number;

export function startGameLoop() {
  let lastTime = performance.now();
  
  function loop(currentTime: number) {
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    gameTick(deltaTime);
    animationId = requestAnimationFrame(loop);
  }
  
  animationId = requestAnimationFrame(loop);
}

export function stopGameLoop() {
  cancelAnimationFrame(animationId);
}
```

---

## 8. React Component Structure

```
src/
├── components/
│   ├── game/
│   │   ├── ResourceDisplay.tsx      # Shows gold, gems, etc.
│   │   ├── MinerList.tsx            # List of miners
│   │   ├── MinerCard.tsx            # Individual miner
│   │   ├── UpgradeList.tsx          # Available upgrades
│   │   ├── UpgradeCard.tsx          # Individual upgrade
│   │   ├── PrestigePanel.tsx        # Prestige info/button
│   │   └── OfflineModal.tsx         # Offline progress popup
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── ProgressBar.tsx
│   │   └── NumberDisplay.tsx        # Formatted big numbers
│   └── layout/
│       ├── GameHeader.tsx
│       ├── TabNavigation.tsx
│       └── GameScreen.tsx
├── engine/
│   ├── gameLoop.ts                  # RAF loop, tick logic
│   ├── production.ts                # Production calculations
│   ├── costs.ts                     # Cost formulas
│   ├── prestige.ts                  # Prestige calculations
│   ├── offline.ts                   # Offline progress
│   └── serialization.ts             # Save/load
├── store/
│   ├── gameStore.ts                 # Zustand store
│   ├── selectors.ts                 # Memoized selectors
│   └── actions.ts                   # External actions
├── data/
│   ├── miners.ts                    # Miner definitions
│   ├── upgrades.ts                  # Upgrade definitions
│   ├── achievements.ts              # Achievement definitions
│   └── prestige.ts                  # Prestige upgrade definitions
└── utils/
    ├── format.ts                    # Number formatting
    ├── decimal.ts                   # Decimal helpers
    └── time.ts                      # Time formatting
```

---

## 9. Performance Optimization

### 1. Throttle UI Updates

```typescript
// Only update UI at 10fps even if game ticks faster
const RENDER_INTERVAL = 100; // ms

function useThrottledSelector<T>(selector: (state: GameState) => T): T {
  const [value, setValue] = useState(() => selector(useGameStore.getState()));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setValue(selector(useGameStore.getState()));
    }, RENDER_INTERVAL);
    return () => clearInterval(interval);
  }, [selector]);
  
  return value;
}
```

### 2. Memo Everything

```typescript
// Memoize expensive components
const MinerCard = memo(function MinerCard({ minerId }: Props) {
  const owned = useGameStore((s) => s.miners[minerId].owned);
  const canAfford = useGameStore((s) => {
    const cost = getNextCost(MINERS[minerId], s.miners[minerId].purchased);
    return s.resources.gold.gte(cost);
  });
  
  return (
    <div className={canAfford ? 'affordable' : 'too-expensive'}>
      {/* ... */}
    </div>
  );
});
```

### 3. Use CSS for Animations

```css
/* Don't animate with JS/React state */
.resource-gain {
  animation: pulse 0.3s ease-out;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### 4. Virtualize Long Lists

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function MinerList() {
  const minerIds = Object.keys(MINERS);
  
  const virtualizer = useVirtualizer({
    count: minerIds.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={containerRef} style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <MinerCard key={minerIds[item.index]} minerId={minerIds[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

### 5. Batch State Updates

```typescript
// Zustand automatically batches in React 18
// But for non-React code (game loop), use:
import { unstable_batchedUpdates } from 'react-dom';

function processTick(deltaTime: number) {
  unstable_batchedUpdates(() => {
    useGameStore.getState().tick(deltaTime);
    useGameStore.getState().checkAchievements();
    useGameStore.getState().checkUnlocks();
  });
}
```

---

## 10. Prestige System

### Prestige Currency Calculation

```typescript
// Based on max gold (Realm Grinder style)
function calculatePrestigeGain(state: GameState): Decimal {
  const maxGold = state.prestige.maxGold;
  const threshold = new Decimal(1e12); // Need 1 trillion to prestige
  
  if (maxGold.lt(threshold)) return new Decimal(0);
  
  // Square root formula: p = sqrt(1 + 8*m/t) - 1) / 2
  // Where m = maxGold, t = threshold
  const inner = maxGold.div(threshold).times(8).plus(1);
  return inner.sqrt().minus(1).div(2).floor();
}

// Multiplier from prestige points
function calculatePrestigeMultiplier(prestigePoints: Decimal): Decimal {
  // Each point = 5% bonus, multiplicative
  return Decimal.pow(1.05, prestigePoints);
}
```

### Prestige Upgrades

```typescript
interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  cost: Decimal;
  effect: (level: number) => Decimal;
  maxLevel: number;
}

const PRESTIGE_UPGRADES: PrestigeUpgrade[] = [
  {
    id: 'startingGold',
    name: 'Golden Start',
    description: 'Start with bonus gold after prestige',
    cost: new Decimal(5),
    effect: (level) => Decimal.pow(10, level + 2), // 100, 1000, 10000...
    maxLevel: 10,
  },
  {
    id: 'productionBoost',
    name: 'Efficient Mining',
    description: 'All production +25%',
    cost: new Decimal(10),
    effect: (level) => new Decimal(1 + 0.25 * level),
    maxLevel: 20,
  },
];
```

---

## Key Takeaways

1. **Separate engine from UI** - Game logic should be pure functions, not tied to React
2. **Use break_infinity.js** - Essential for big number handling
3. **Fixed timestep game loop** - 10 ticks/sec is sweet spot
4. **Coarse selectors** - Subscribe to minimal state slices
5. **Throttle renders** - UI doesn't need 60fps updates
6. **Analytical offline progress** - Simulation is slow, math is fast
7. **Prestige early** - Integrate from start, not as afterthought
8. **Auto-save on visibility change** - beforeunload unreliable on mobile
9. **Version your saves** - Migrations prevent broken games
10. **Static data outside store** - Only mutable state in Zustand

---

## References

- [The Math of Idle Games (Kongregate)](https://blog.kongregate.com/the-math-of-idle-games-part-i/)
- [break_infinity.js](https://github.com/Patashu/break_infinity.js)
- [Zustand Documentation](https://zustand.docs.pmnd.rs/)
- [Derivative Clicker Source](https://github.com/gzgreg/DerivativeClicker)
- [Antimatter Dimensions](https://github.com/IvarK/IvarK.github.io) (reference implementation)
