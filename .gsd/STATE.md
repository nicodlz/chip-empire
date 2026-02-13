# Project State

## Project Reference

See: .gsd/PROJECT.md (updated 2025-02-12)

**Core value:** La satisfaction de la progression technologique
**Current focus:** Phase 4 - Scale (Automation)

## Current Position

Phase: 3 of 5 (Compute & Research) ✓ COMPLETE
Plan: Research tree implemented
Status: Ready for Phase 4
Last activity: 2025-02-13 00:05 — Phase 3 executed

Progress: [██████░░░░] 60%

## Performance Metrics

**Phase 1:** Foundation ✓
- Tap mining, minerals, animations
- Commit: 2997fff

**Phase 2:** Fabrication ✓
- Wafers, chips, crafting queue
- Commit: cd1fbb1

**Phase 3:** Research ✓
- 22 research technologies
- Categories: Nodes, Efficiency, Automation, Exotic
- Multipliers: mining, fab speed, FLOPS
- Progressive unlock via prerequisites
- Build: SUCCESS

## Accumulated Context

### Files

```
src/
├── types/
│   ├── game.ts
│   ├── fabrication.ts
│   └── research.ts     # NEW: ResearchId, ResearchDef, ResearchState
├── data/
│   ├── minerals.ts
│   ├── wafers.ts
│   ├── chips.ts
│   ├── nodes.ts
│   └── research.ts     # NEW: 22 research definitions
├── store/
│   └── gameStore.ts    # v3 with research state + multipliers
└── components/
    ├── ResearchPanel.tsx  # NEW: Research UI
    └── ...
```

### Research Tree

**Efficiency (7)**
- mining_2x → mining_5x
- fab_speed_2x → fab_speed_5x
- flops_mult_2x → flops_mult_5x → flops_mult_10x

**Exotic (6)**
- tier2_minerals → tier3_minerals → tier4_minerals → tier5_minerals
- quantum_computing → singularity

**Nodes (7)**
- 90nm (start) → 65nm → 45nm → 28nm → 14nm → 7nm → 5nm → 3nm

**Automation (3)**
- auto_miner → auto_fab → datacenter

### Next Phase

Phase 4: Scale
- Auto-miners (passive resource generation)
- Auto-fab (crafting queues)
- Datacenters (massive passive FLOPS)
- Offline progress
- Achievements

## Session Continuity

Last session: 2025-02-13 00:05
Stopped at: Phase 3 complete, ready for Phase 4 automation
