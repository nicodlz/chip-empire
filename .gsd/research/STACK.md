# Idle Miner - Tech Stack Research (2025)

> Optimal stack for an idle/incremental game. Mobile-first, no backend, React + TypeScript.

## TL;DR - The Stack

```
Framework:     React 19.x + TypeScript 5.x
Build:         Vite 7.3.x
State:         Zustand 5.x + persist middleware
Styling:       Tailwind CSS 4.x (Vite plugin)
Big Numbers:   break_eternity.js 2.1.x
Animation:     Framer Motion 12.x
Persistence:   localStorage (Zustand persist) + optional IndexedDB (idb 8.x)
```

---

## 1. Framework: React 19

### Recommendation: **React 19.2.x**

**Why React over alternatives:**
- **Preact**: Smaller (3KB vs 40KB), but loses React 19 features (use transitions, Server Components). Not worth it for a game that'll be 500KB+ anyway.
- **Solid**: Faster runtime, but smaller ecosystem. Zustand doesn't exist for Solid. You'd need to learn a new mental model.
- **Vue/Svelte**: Fine choices, but the project spec says React. Stick with it.

**Why React 19 specifically:**
- `useTransition` for non-blocking UI updates (perfect for game ticks)
- Improved hydration (if you ever add SSR)
- Better concurrent rendering for smooth 60fps updates

```bash
npm install react@^19.2.4 react-dom@^19.2.4
npm install -D @types/react@^19 @types/react-dom@^19
```

### ⚠️ Avoid
- **React 18**: Missing `use` hook and improved transitions
- **Class components**: Dead pattern, hooks only
- **Create React App**: Deprecated, use Vite

---

## 2. Build Tool: Vite 7

### Recommendation: **Vite 7.3.x**

**Why Vite:**
- 10-100x faster than Webpack
- Native ESM dev server (no bundling during dev)
- First-class TypeScript support
- Rollup-based production builds (tree-shaking)
- Perfect React + Tailwind integration

```bash
npm create vite@latest idle-miner -- --template react-swc-ts
```

**Use `react-swc-ts` template** - SWC is 20x faster than Babel for transpilation.

### Configuration (`vite.config.ts`)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2022',
    minify: 'esbuild',
  },
})
```

### ⚠️ Avoid
- **Webpack**: Slow, complex config
- **Parcel**: Less ecosystem support
- **Turbopack**: Still experimental
- **Bun**: Not stable enough for production

---

## 3. State Management: Zustand 5

### Recommendation: **Zustand 5.0.x + persist middleware**

**Why Zustand for idle games:**
- Minimal boilerplate (no reducers, no actions, no providers)
- Built-in `persist` middleware for save/load
- Subscriptions with selectors (only re-render what changes)
- Works outside React (for game loop)
- Tiny: 1.2KB gzipped

**Why NOT Redux/MobX/Jotai:**
- **Redux**: Overkill boilerplate for a game
- **MobX**: Proxy-based, harder to serialize for save files
- **Jotai**: Good, but atoms don't fit game state shape as well

### Game State Pattern

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Decimal from 'break_eternity.js'

interface GameState {
  // Resources
  ore: Decimal
  money: Decimal
  
  // Upgrades (purchased count)
  pickaxes: number
  miners: number
  
  // Computed rates (derived, not stored)
  
  // Actions
  tick: (deltaMs: number) => void
  buyUpgrade: (id: string) => void
  
  // Meta
  lastSave: number
  version: number
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ore: new Decimal(0),
      money: new Decimal(0),
      pickaxes: 0,
      miners: 0,
      lastSave: Date.now(),
      version: 1,
      
      tick: (deltaMs) => {
        const state = get()
        const seconds = deltaMs / 1000
        const orePerSecond = calculateOreRate(state)
        
        set({
          ore: state.ore.add(orePerSecond.mul(seconds)),
          lastSave: Date.now(),
        })
      },
      
      buyUpgrade: (id) => {
        // ... upgrade logic
      },
    }),
    {
      name: 'idle-miner-save',
      version: 1,
      storage: createJSONStorage(() => localStorage, {
        // Custom serialization for Decimal
        replacer: (key, value) => 
          value instanceof Decimal ? { __decimal: value.toString() } : value,
        reviver: (key, value) =>
          value?.__decimal ? new Decimal(value.__decimal) : value,
      }),
      partialize: (state) => ({
        // Only persist these fields
        ore: state.ore,
        money: state.money,
        pickaxes: state.pickaxes,
        miners: state.miners,
        lastSave: state.lastSave,
        version: state.version,
      }),
    }
  )
)
```

### Game Loop (outside React)

```typescript
// game-loop.ts
let lastTick = performance.now()

function gameLoop() {
  const now = performance.now()
  const delta = now - lastTick
  lastTick = now
  
  useGameStore.getState().tick(delta)
  
  requestAnimationFrame(gameLoop)
}

// Start on app load
gameLoop()
```

```bash
npm install zustand@^5.0.11
```

### ⚠️ Avoid
- **useState for game state**: No persistence, no external access
- **useContext**: Performance nightmare for frequent updates
- **Redux Toolkit**: Unnecessary complexity

---

## 4. Big Number Library: break_eternity.js

### Recommendation: **break_eternity.js 2.1.x**

**Why break_eternity over alternatives:**

| Library | Max Value | Speed | Use Case |
|---------|-----------|-------|----------|
| `break_infinity.js` | 1e1e308 | Fast | Most idle games |
| `break_eternity.js` | 10^^1e308 | Fast | Extreme growth (recommended) |
| `decimal.js` | 1e1e308 | Slow | Financial apps (accuracy) |

**break_eternity.js** handles numbers up to 10^^1e308 (tetration). Even if you think you won't need it, idle games always grow faster than expected.

### Key Features
- Drop-in replacement for decimal.js API
- 2-3x faster than decimal.js
- Supports tetration (`tetrate`), pentation (`pentate`)
- TypeScript definitions included

### Usage

```typescript
import Decimal from 'break_eternity.js'

const ore = new Decimal(0)
const perSecond = new Decimal('1e308')

// Arithmetic
const newOre = ore.add(perSecond.mul(deltaSeconds))

// Comparisons
if (ore.gte(cost)) { /* can afford */ }

// Formatting
ore.toExponential(2)  // "1.23e456"
ore.toFixed(2)        // Works for small numbers

// Display helper
function formatNumber(n: Decimal): string {
  if (n.lt(1000)) return n.toFixed(1)
  if (n.lt(1e6)) return n.toFixed(0)
  if (n.lt(1e9)) return `${n.div(1e6).toFixed(2)}M`
  if (n.lt(1e12)) return `${n.div(1e9).toFixed(2)}B`
  return n.toExponential(2)
}
```

```bash
npm install break_eternity.js@^2.1.3
```

### ⚠️ Avoid
- **Native BigInt**: Can't do decimals, no exponential notation
- **decimal.js**: 100x slower for log/exp/pow operations
- **bignumber.js**: Same issues as decimal.js
- **break_infinity.js**: Use break_eternity for future-proofing

---

## 5. Styling: Tailwind CSS 4

### Recommendation: **Tailwind CSS 4.x via Vite plugin**

**Why Tailwind for games:**
- Rapid prototyping (critical for game feel iteration)
- Zero runtime CSS-in-JS overhead
- Mobile-first by default
- Easy dark mode
- Consistent spacing/colors

**Why NOT CSS-in-JS (styled-components, Emotion):**
- Runtime overhead on every render
- Harder to optimize for 60fps games
- Bundle size bloat

### Setup (Tailwind v4 + Vite)

```bash
npm install tailwindcss @tailwindcss/vite
```

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";

/* Custom game theme */
@theme {
  --color-ore: #f59e0b;
  --color-money: #10b981;
  --color-gem: #8b5cf6;
}
```

### Mobile-First Patterns

```tsx
// Responsive game UI
<div className="
  grid grid-cols-1 gap-4 p-4
  md:grid-cols-2 
  lg:grid-cols-3
">
  <ResourceCard />
  <UpgradePanel />
  <StatsPanel />
</div>

// Touch-friendly buttons (44px minimum)
<button className="
  min-h-[44px] min-w-[44px] 
  px-4 py-2 
  active:scale-95 
  transition-transform
">
  Mine!
</button>
```

### ⚠️ Avoid
- **Tailwind v3**: v4 has better Vite integration
- **@apply everywhere**: Defeats the purpose
- **CSS Modules**: Unnecessary with Tailwind

---

## 6. Animation: Framer Motion 12

### Recommendation: **Framer Motion 12.x (now "Motion")**

**Why Framer Motion for game feedback:**
- Hardware-accelerated (transform/opacity)
- Gesture support (drag, tap, pan) - crucial for mobile
- Layout animations (for UI reorganization)
- AnimatePresence for enter/exit
- Spring physics feel natural

### Install

```bash
npm install framer-motion@^12.34.0
```

### Game Animation Patterns

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Number pop animation (satisfying feedback)
function ResourceCounter({ value }: { value: Decimal }) {
  return (
    <motion.span
      key={value.toString()} // Re-animate on change
      initial={{ scale: 1.2, color: '#fbbf24' }}
      animate={{ scale: 1, color: '#ffffff' }}
      transition={{ type: 'spring', stiffness: 500 }}
    >
      {formatNumber(value)}
    </motion.span>
  )
}

// Floating +1 particles
function FloatingNumber({ amount, onComplete }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 0, y: -50 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      onAnimationComplete={onComplete}
      className="absolute text-yellow-400 font-bold pointer-events-none"
    >
      +{formatNumber(amount)}
    </motion.div>
  )
}

// Button press feedback
<motion.button
  whileTap={{ scale: 0.95 }}
  whileHover={{ scale: 1.02 }}
  transition={{ type: 'spring', stiffness: 400 }}
>
  Mine
</motion.button>

// Progress bar
<motion.div
  className="h-2 bg-amber-500 rounded"
  initial={{ width: 0 }}
  animate={{ width: `${percent}%` }}
  transition={{ ease: 'easeOut' }}
/>
```

### Alternative: react-spring

If bundle size is critical, **react-spring 10.x** is smaller but less feature-rich:

```bash
npm install @react-spring/web@^10.0.3
```

### ⚠️ Avoid
- **CSS animations for game logic**: Hard to sync with state
- **anime.js**: Not React-native
- **GSAP**: Overkill, licensing concerns
- **Lottie**: Good for complex animations, not micro-interactions

---

## 7. Persistence Strategy

### Primary: Zustand persist + localStorage

- Synchronous (no hydration delay)
- 5-10MB limit (plenty for game state)
- Works offline
- Zero setup

### Secondary (optional): IndexedDB via idb

For large save files (prestige history, statistics):

```bash
npm install idb@^8.0.3
```

```typescript
import { openDB } from 'idb'

const db = await openDB('idle-miner', 1, {
  upgrade(db) {
    db.createObjectStore('saves')
    db.createObjectStore('statistics')
  },
})

// Manual save slots
await db.put('saves', gameState, 'slot-1')
const loaded = await db.get('saves', 'slot-1')
```

### Cloud Sync (future consideration)

If you add accounts later:
- **Supabase**: Free tier, real-time sync
- **Firebase**: Overkill but works
- **Custom**: Simple REST endpoint

---

## 8. Project Structure

```
idle-miner/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Tailwind imports
│   │
│   ├── game/
│   │   ├── store.ts          # Zustand game state
│   │   ├── loop.ts           # Game loop (requestAnimationFrame)
│   │   ├── formulas.ts       # Growth calculations
│   │   ├── upgrades.ts       # Upgrade definitions
│   │   └── prestige.ts       # Reset mechanics
│   │
│   ├── components/
│   │   ├── ui/               # Generic UI (Button, Card, etc.)
│   │   ├── game/             # Game-specific (ResourceBar, UpgradeCard)
│   │   └── layout/           # Layout components
│   │
│   ├── hooks/
│   │   ├── useGameLoop.ts    # React hook for game tick
│   │   └── useOfflineProgress.ts
│   │
│   └── utils/
│       ├── format.ts         # Number formatting
│       └── decimal.ts        # Decimal helpers
│
└── public/
    └── favicon.ico
```

---

## 9. Package.json

```json
{
  "name": "idle-miner",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "zustand": "^5.0.11",
    "break_eternity.js": "^2.1.3",
    "framer-motion": "^12.34.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react-swc": "^3.8.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "typescript": "^5.7.0",
    "vite": "^7.3.1",
    "eslint": "^9.0.0"
  }
}
```

---

## 10. Anti-Patterns to Avoid

### State Management
- ❌ `useState` for game state (no persistence, re-renders)
- ❌ `useReducer` without middleware (reinventing Redux)
- ❌ Global mutable objects (breaks React)
- ❌ Storing derived values (compute on render)

### Performance
- ❌ Re-rendering entire UI every tick
- ❌ Creating new Decimal instances in render
- ❌ `setInterval` for game loop (use `requestAnimationFrame`)
- ❌ Unthrottled saves (batch, save every 5-30s)

### Big Numbers
- ❌ Using `Number` for game values (overflow at 1e308)
- ❌ Comparing Decimals with `===` (use `.eq()`)
- ❌ Not handling `Infinity` and `NaN`

### Mobile
- ❌ Small touch targets (< 44px)
- ❌ Hover-only interactions
- ❌ Blocking the main thread

---

## Summary

| Category | Choice | Version | Why |
|----------|--------|---------|-----|
| Framework | React | 19.2.x | Ecosystem, transitions |
| Build | Vite | 7.3.x | Speed, DX |
| State | Zustand | 5.0.x | Simple, persist, external access |
| Styling | Tailwind | 4.x | Fast iteration, zero runtime |
| Numbers | break_eternity.js | 2.1.x | Handles 10^^1e308 |
| Animation | Framer Motion | 12.x | Springs, gestures |
| Persistence | localStorage | - | Sync, simple |

**Total bundle (estimated):** ~150KB gzipped
- React: ~45KB
- Zustand: ~1KB
- break_eternity: ~30KB
- Framer Motion: ~50KB
- Your code: ~20KB
