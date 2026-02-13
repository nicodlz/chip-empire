# Project State

## Project Reference

See: .gsd/PROJECT.md (updated 2025-02-12)

**Core value:** La satisfaction de la progression technologique
**Current focus:** Phase 3 - Compute & Research

## Current Position

Phase: 2 of 5 (Fabrication) ✓ COMPLETE
Plan: Fabrication complete
Status: Ready for Phase 3
Last activity: 2025-02-12 — Phase 2 executed

Progress: [████░░░░░░] 40%

## Performance Metrics

**Phase 1:**
- Plans completed: 3
- Build: SUCCESS
- Commit: 2997fff

**Phase 2:**
- Wafers: basic_wafer, refined_wafer, pure_wafer, quantum_wafer
- Chips: 12 types (CPU/GPU/Memory/ASIC/QPU)
- Nodes: 90nm → 3nm progression
- FLOPS: Generation system implemented
- Build: SUCCESS
- Commit: cd1fbb1

## Accumulated Context

### Architecture

```
src/
├── types/
│   ├── game.ts          # MineralId, MineralState, GameState
│   └── fabrication.ts   # WaferId, ChipId, ProcessNode, FabState
├── data/
│   ├── minerals.ts      # 14 minerals (5 tiers)
│   ├── wafers.ts        # 4 wafer types
│   ├── chips.ts         # 12 chip types
│   └── nodes.ts         # 8 process nodes
├── engine/
│   ├── resources.ts     # Mining logic
│   └── fabrication.ts   # Crafting logic, FLOPS calculation
├── store/
│   └── gameStore.ts     # Zustand store (v2 with fab state)
└── components/
    ├── TabNav.tsx       # Navigation tabs
    ├── MineArea.tsx     # Tap mining
    ├── MineralDisplay.tsx
    ├── FabPanel.tsx     # Wafer/chip crafting UI
    ├── ChipsPanel.tsx   # Inventory + FLOPS display
    └── CraftingProgress.tsx
```

### Decisions

- Stack: React 19 + Vite 7 + Zustand 5 + Tailwind 4
- 14 real minerals (Si, Cu, Al, Au, Li, Co, Nd, Hf...)
- Tier system 1-5 for progression
- Neon accents on dark theme
- Mobile-first touch handling
- FLOPS = universal currency for research
- Process nodes unlock progressively with FLOPS

### Next Phase

Phase 3: Compute & Research
- Research tree UI
- Spend FLOPS to unlock research
- Research unlocks: new nodes, minerals, efficiency
- Node upgrade system
- Better FLOPS visualization

## Session Continuity

Last session: 2025-02-12 23:58
Stopped at: Phase 2 complete, ready for Phase 3
