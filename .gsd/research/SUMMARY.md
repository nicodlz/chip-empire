# Research Summary: Idle Miner

## Key Findings

### Stack
React 19 + Vite 7 + Zustand 5 + Tailwind 4 + break_eternity.js + Framer Motion 12. Mobile-first, no backend, localStorage persistence.

### Table Stakes Features
1. **Core click loop** — Satisfying feedback on every tap
2. **Automation** — Miners that work while you're away
3. **Upgrades** — Exponential cost scaling (15-20% per level)
4. **Prestige** — First reset at 1-4h, 2-3x minimum bonus
5. **Offline progress** — Calculate gains on return
6. **Achievements** — Milestones every 15-30 min

### Critical Pitfalls to Avoid
1. **Mid-game desert** — Keep unlocking new content
2. **Meaningless choices** — Upgrades must feel different
3. **Prestige timing** — Not too early, not too late
4. **Number overflow** — Use break_eternity.js from day 1
5. **Mobile UX** — Big tap targets, no hover states

### Architecture
- **10 ticks/sec** game loop (100ms interval)
- **Engine/Store/UI** separation
- **Pure functions** for game logic (testable)
- **Zustand persist** for saves
- **Offline calc** on app return (batch tick processing)

## Recommended Approach

Build in layers:
1. Core engine (tick, resources, production) — pure TypeScript
2. Zustand store wrapping engine
3. Minimal UI for testing
4. Add upgrades, miners, achievements
5. Polish: animations, sounds, prestige
6. Mobile optimization pass

## Quick Reference

| Aspect | Choice |
|--------|--------|
| Framework | React 19.2.x |
| Build | Vite 7.3.x (SWC) |
| State | Zustand 5.x + persist |
| Styling | Tailwind CSS 4.x |
| Big numbers | break_eternity.js |
| Animation | Framer Motion 12.x |
| Icons | Lucide React |

## Files

- `STACK.md` — Full tech recommendations (14KB)
- `FEATURES.md` — Feature categorization (10KB)
- `ARCHITECTURE.md` — Game loop & state design (24KB)
- `PITFALLS.md` — Common mistakes & prevention (11KB)

---
*Synthesized from 4 parallel research agents*
