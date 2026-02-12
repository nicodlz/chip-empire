# Chip Empire

## What This Is

Un idle game sur la course aux semi-conducteurs. Le joueur mine des minerais réels (silicium, cuivre, terres rares), fabrique des puces de plus en plus avancées (90nm → 3nm), accumule de la puissance de calcul, et débloque des recherches scientifiques. Mobile-first, satisfaisant, moderne et épuré.

## Core Value

**La satisfaction de la progression technologique** — Passer de puces primitives à des processeurs cutting-edge, débloquer des découvertes qui changent le jeu. Le joueur doit ressentir qu'il construit quelque chose de réel.

## Thème & Hook

**Le hook:** Les vrais minerais et la vraie course aux nanomètres.
- Pas de "fantasy ore" — du vrai: Silicium, Cuivre, Or, Lithium, Cobalt, Tantale, Néodyme, Gallium...
- Les procédés de gravure réels: 90nm → 65nm → 45nm → 28nm → 14nm → 7nm → 5nm → 3nm
- La puissance de calcul qui débloque des recherches (IA, quantique, fusion...)

**Inspiration:** Universal Paperclips (progression qui change le jeu) + Factorio (satisfaction de l'optimisation) + réalité des semi-conducteurs

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Core Loop**
- [ ] Miner des minerais en tapant
- [ ] Minerais réels avec vraies propriétés (conductivité, rareté)
- [ ] Feedback satisfaisant sur chaque tap

**Ressources (Minerais)**
- [ ] Tier 1 - Communs: Silicium, Cuivre, Aluminium
- [ ] Tier 2 - Métaux: Or, Argent, Étain
- [ ] Tier 3 - Terres rares: Lithium, Cobalt, Tantale
- [ ] Tier 4 - Exotiques: Néodyme, Gallium, Indium
- [ ] Tier 5 - Ultra-rares: Germanium, Hafnium (pour les nodes avancés)

**Fabrication de Puces**
- [ ] Combiner minerais → Wafers → Puces
- [ ] Différents types de puces (CPU, GPU, Mémoire)
- [ ] Procédés de gravure: 90nm → 65nm → 45nm → 28nm → 14nm → 7nm → 5nm → 3nm
- [ ] Chaque node nécessite des minerais + recherches spécifiques

**Puissance de Calcul**
- [ ] Les puces génèrent des FLOPS (unité de calcul)
- [ ] FLOPS = monnaie pour la recherche
- [ ] Scaling exponentiel satisfaisant

**Recherches**
- [ ] Arbre de recherche avec découvertes réelles
- [ ] Débloquer nouveaux minerais, procédés, automatisations
- [ ] Recherches marquantes: IA, Quantique, Fusion...

**Automatisation**
- [ ] Mines automatiques
- [ ] Chaînes de fabrication
- [ ] Datacenters (génèrent FLOPS passifs)

**Prestige (optionnel v1)**
- [ ] "Nouvelle ère technologique" — reset avec bonus
- [ ] Débloquer de nouvelles branches de recherche

### UI/UX
- [ ] Mobile-first (touch optimisé)
- [ ] Design moderne, épuré, satisfaisant
- [ ] Animations fluides
- [ ] Pas de clutter — clarté avant tout

## Out of Scope (v1)

- Multijoueur
- Backend/serveur
- Microtransactions
- Réalisme économique (c'est un jeu, pas une simulation)

## Context

**Réalité des semi-conducteurs:**
- TSMC, Intel, Samsung = la vraie course aux nm
- Terres rares = enjeu géopolitique (Chine contrôle 60%)
- Loi de Moore = doublement tous les 2 ans (ralentit)
- EUV lithography = tech nécessaire pour < 7nm

**Références visuelles:**
- Minimaliste comme Paperclip
- Couleurs: tons sombres + accents néon (style tech)
- Icônes simples, typo moderne

## Constraints

- **Mobile-first**: Jouable d'une main, gros boutons
- **Performance**: Smooth même avec beaucoup de ressources
- **Clarté**: Pas de surcharge d'info, progression évidente
- **Offline**: Le jeu avance quand on n'est pas là

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Minerais réels | Hook unique, éducatif, satisfaisant | — Pending |
| Progression en nm | Réaliste, milestones clairs | — Pending |
| FLOPS comme monnaie | Lie puces → recherche logiquement | — Pending |
| React + Zustand | Stack moderne, persist facile | — Pending |

---
*Last updated: 2025-02-12 après discussion avec Nicolas*
