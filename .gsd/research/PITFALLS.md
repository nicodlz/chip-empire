# Idle Game Pitfalls Research

Common failures in idle/incremental games and how to prevent them.

---

## 1. Game Design Pitfalls

### 1.1 The Mid-Game Desert
**What**: Players hit a dead zone where nothing new happens for hours/days. Early game has constant unlocks, late game has prestige—middle is empty.

**Warning Signs**:
- Players quit between hours 2-10 of gameplay
- No new mechanics unlock for extended periods
- Upgrade costs grow faster than income

**Prevention**:
- Map out unlock timeline: something new every 15-30 min of active play
- Add "milestone" bonuses that break up long waits
- Stagger mechanic reveals (don't front-load everything)

**Phase**: Design (content pacing), Alpha (playtest timing)

---

### 1.2 Meaningless Choices
**What**: All upgrades feel the same. Players just click the cheapest one without thinking.

**Warning Signs**:
- Players never read upgrade descriptions
- No "build diversity"—everyone plays identically
- Upgrades are just "+X% to thing"

**Prevention**:
- Create upgrade synergies (A + B = better than 2A)
- Add mutually exclusive choices (pick one path)
- Make upgrades change gameplay, not just numbers

**Phase**: Design (upgrade system), Beta (player feedback)

---

### 1.3 Prestige Too Early or Too Late
**What**: Reset mechanic comes before players understand the game, or so late they've already quit.

**Warning Signs**:
- Players confused about why they'd reset
- First prestige takes 20+ hours
- Prestige bonuses feel worthless

**Prevention**:
- First prestige achievable in 1-4 hours of play
- Make prestige benefits OBVIOUS (2-3x faster minimum)
- Soft-introduce concept before requiring it

**Phase**: Design (progression curve), Alpha (timing tests)

---

### 1.4 Infinite Scaling Without Purpose
**What**: Numbers keep going up but there's no goal. "Why am I doing this?"

**Warning Signs**:
- No endgame content or achievements
- Players ask "is there an ending?"
- Late-game is just watching numbers

**Prevention**:
- Define a "soft ending" with achievements
- Add challenge modes or alternate goals
- Create meaningful milestones with rewards

**Phase**: Design (endgame vision), Beta (retention data)

---

## 2. Technical Pitfalls

### 2.1 Number Overflow
**What**: JavaScript's Number.MAX_SAFE_INTEGER (9 quadrillion) gets exceeded. Numbers become NaN or Infinity.

**Warning Signs**:
- Display shows "NaN" or "Infinity"
- Math starts giving wrong results
- Comparisons fail silently

**Prevention**:
- Use a big number library (break_infinity.js, decimal.js)
- Plan notation system (K, M, B, T, Qa, Qi... or scientific)
- Test with extreme values early

**Phase**: Foundation (number system), Alpha (stress tests)

---

### 2.2 Save Corruption
**What**: localStorage save becomes unreadable, players lose all progress.

**Warning Signs**:
- Players report "lost everything"
- JSON.parse errors in console
- Saves don't load after updates

**Prevention**:
- Version your save format (add schema version)
- Write migration code for each version
- Keep backup saves (multiple slots, cloud sync)
- Validate saves on load, fallback gracefully
- Never store computed values—recompute them

**Phase**: Foundation (save system), Every release (migration tests)

---

### 2.3 Offline Progress Exploits
**What**: Players manipulate device clock to gain infinite offline progress.

**Warning Signs**:
- Ridiculous offline gains reported
- Players advance weeks in "one night"
- Economy breaks for time-travelers

**Prevention**:
- Server-side time validation (if online)
- Cap offline gains (max 24h, diminishing returns)
- Use relative timestamps, not absolute
- Detect backwards time travel, handle gracefully

**Phase**: Design (offline system), Alpha (exploit testing)

---

### 2.4 Performance Death Spiral
**What**: Game slows down as player progresses. More entities = more lag.

**Warning Signs**:
- FPS drops after hours of play
- Mobile devices heat up
- UI becomes unresponsive

**Prevention**:
- Profile early and often
- Batch state updates (don't re-render every tick)
- Use requestAnimationFrame, not setInterval
- Throttle calculations when tab is hidden
- Virtualize long lists (don't render 1000 upgrades)

**Phase**: Foundation (game loop), Alpha (performance tests)

---

### 2.5 Memory Leaks
**What**: Game consumes more RAM over time until browser crashes.

**Warning Signs**:
- Performance degrades over long sessions
- Browser tab uses GB of memory
- Mobile browser force-closes game

**Prevention**:
- Clean up intervals/timeouts on unmount
- Avoid closures that capture large objects
- Profile memory with DevTools
- Test 8+ hour sessions

**Phase**: Foundation (architecture), Alpha (long-session tests)

---

## 3. UX Pitfalls

### 3.1 Information Overload
**What**: Screen filled with numbers, buttons, and mechanics. New players paralyzed.

**Warning Signs**:
- Players don't know what to click first
- Tutorial takes 20 minutes
- UI requires scrolling in multiple directions

**Prevention**:
- Progressive disclosure: hide advanced stuff initially
- Show 1-3 actions at a time for new players
- Use clear visual hierarchy
- Group related elements

**Phase**: Design (UI structure), MVP (usability tests)

---

### 3.2 Mobile Touch Disasters
**What**: Buttons too small, can't scroll properly, misclicks everywhere.

**Warning Signs**:
- Touch targets under 44px
- Horizontal scroll conflicts with swipe
- Users accidentally buy wrong upgrades
- Text unreadable without zooming

**Prevention**:
- Design mobile-first, not mobile-adapted
- Minimum 44x44px touch targets
- Add confirmation for expensive actions
- Test on real devices, not just emulators
- Support both portrait and landscape (or pick one)

**Phase**: Foundation (responsive design), Every feature

---

### 3.3 Notification Spam
**What**: Game begs for attention constantly. Players disable notifications or uninstall.

**Warning Signs**:
- Multiple notifications per hour
- Notifications for trivial events
- No way to customize notification types

**Prevention**:
- Notifications only for significant events
- Let players control notification frequency
- Batch notifications (daily summary option)
- Never notify just to get players to open the app

**Phase**: Design (engagement systems), Beta (user feedback)

---

### 3.4 Unclear Feedback
**What**: Player clicks button, nothing visibly happens. Did it work?

**Warning Signs**:
- Players click same button repeatedly
- "Is the game frozen?"
- No indication of progress/purchase

**Prevention**:
- Visual feedback for every action (animation, sound, number change)
- Show +amount floating numbers on gains
- Progress bars for long operations
- Clear "you can't afford this" states

**Phase**: MVP (interaction design), Polish

---

### 3.5 No Offline Progress Indication
**What**: Player returns, numbers are higher, but why? What happened?

**Warning Signs**:
- Players confused about their gains
- Can't tell if offline progress worked
- "Did it save?"

**Prevention**:
- Show "welcome back" screen with offline summary
- Break down earnings by source
- Show time elapsed

**Phase**: MVP (offline system UI)

---

## 4. Balancing Pitfalls

### 4.1 Exponential Cost, Linear Reward
**What**: Each upgrade costs 10x more but only gives +10% boost. Math doesn't math.

**Warning Signs**:
- Late upgrades feel pointless
- Players stop buying after certain level
- Optimal strategy is "buy lowest level"

**Prevention**:
- Model your economy in a spreadsheet
- Costs and rewards should scale similarly
- Soft caps with breakthrough bonuses
- Test at 1h, 10h, 100h, 1000h points

**Phase**: Design (economy model), Alpha (balance iteration)

---

### 4.2 Pay-to-Win Perception
**What**: Even if fair, game FEELS like it requires money to progress.

**Warning Signs**:
- F2P players hit walls P2P players skip
- Premium currency is the only way past certain points
- Time gates measured in days

**Prevention**:
- Everything achievable without paying (patience, not paywalls)
- Premium = convenience/cosmetics, not power
- Avoid "wait 24h or pay $1" patterns

**Phase**: Design (monetization), Beta (F2P playtests)

---

### 4.3 Early Game Too Fast
**What**: First hour gives 1000% boost, then player expects that pace forever.

**Warning Signs**:
- Players complain "game slowed down"
- Tutorial gives too many freebies
- Can't sustain early momentum

**Prevention**:
- Set pacing expectations from the start
- Early game should feel good but not unsustainable
- Graph your progression curve, avoid hockey stick

**Phase**: Design (early game), Alpha (new player tests)

---

### 4.4 Late Game Staleness
**What**: After prestige loop is mastered, nothing new to discover or optimize.

**Warning Signs**:
- Veterans quit after "completing" the game
- No variation between runs
- Optimal path is solved and boring

**Prevention**:
- Add layers: prestige 2, challenges, achievements
- Randomized elements between runs
- Community events or seasons
- New content updates

**Phase**: Design (endgame), Post-launch

---

### 4.5 Broken Automation
**What**: Auto-buyers/managers make the game play itself. Player becomes observer.

**Warning Signs**:
- Game runs optimally with zero input
- Players open game just to close it
- No meaningful decisions remain

**Prevention**:
- Automation should optimize, not replace decisions
- Always leave some manual benefit
- Automation unlocks gradually
- New mechanics need manual input before automation

**Phase**: Design (automation systems), Alpha (engagement tests)

---

## 5. Cross-Cutting Concerns

### 5.1 Testing Strategy
| Phase | Test Type | Focus |
|-------|-----------|-------|
| Foundation | Unit tests | Numbers, save/load, time calculations |
| MVP | Integration | Game loops, progression |
| Alpha | Playtests | Pacing, fun, confusion points |
| Beta | Long-term | 100+ hour gameplay, retention |
| Polish | Performance | Memory, battery, loading |

### 5.2 Key Metrics to Track
- **Session length**: How long do people play?
- **Return rate**: Do they come back?
- **Quit points**: Where do players abandon?
- **Prestige timing**: When do players first prestige?
- **Upgrade distribution**: What do players buy?

### 5.3 Red Flags During Development
- [ ] Can't explain the core loop in one sentence
- [ ] Economy needs constant rebalancing
- [ ] Playtesters check phone during sessions
- [ ] "We'll fix it in post-launch" becomes the answer
- [ ] Numbers grow but nothing feels different

---

## Summary: Phase Responsibilities

| Phase | Must Address |
|-------|--------------|
| **Design** | Economy model, prestige timing, progression curve, UI structure, monetization |
| **Foundation** | Big numbers, save system, game loop performance, responsive layout |
| **MVP** | Core feedback, offline summary, touch targets, progressive disclosure |
| **Alpha** | Balance iteration, exploit testing, playtesting, performance profiling |
| **Beta** | Long-term retention, F2P experience, notification tuning, real-device testing |
| **Polish** | Memory leaks, battery usage, load times, edge cases |

---

*Research compiled from common failure patterns in Cookie Clicker, Adventure Capitalist, Idle Heroes, Antimatter Dimensions, and dozens of failed idle games.*
