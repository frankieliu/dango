# Dango Architecture Documentation

## Overview

Dango is a modern, offline-first flashcard application built with SvelteKit. It implements spaced repetition learning using the FSRS (Free Spaced Repetition Scheduler) algorithm, providing an intelligent way to optimize memory retention.

**Key Principles:**
- Offline-first: All data stored locally in IndexedDB
- Type-safe: Strict TypeScript throughout
- Component-based: Atomic design pattern
- Modern: SvelteKit with Svelte 5 runes
- Fast: Minimal bundle size, instant local operations

## Technology Stack

### Core Framework
- **SvelteKit** - Meta-framework with routing, SSR capability
- **Svelte 5** - Component framework with runes ($state, $derived, $props)
- **TypeScript** - Type safety (strict mode)
- **Vite** - Build tool and dev server

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **@tailwindcss/postcss** - PostCSS plugin for Tailwind v4

### Data Layer
- **Dexie.js** - Modern IndexedDB wrapper
  - Promise-based API
  - TypeScript support
  - Efficient querying
  - ~10KB (vs PouchDB's 54KB)

### Algorithms
- **FSRS** - Free Spaced Repetition Scheduler (2023)
  - Modern alternative to SM-2
  - Research-backed, optimized parameters
  - Predictive interval calculation
  - Better retention optimization
- **SM-2** - Legacy fallback (SuperMemo-2)

## Project Structure

```
dango/
├── src/
│   ├── lib/
│   │   ├── algorithms/          # Spaced repetition logic
│   │   │   ├── fsrs.ts         # FSRS implementation
│   │   │   └── scheduler.ts    # Algorithm abstraction layer
│   │   ├── components/         # UI components (Atomic Design)
│   │   │   ├── atoms/          # Basic building blocks
│   │   │   │   ├── Button.svelte
│   │   │   │   ├── Input.svelte
│   │   │   │   ├── Textarea.svelte
│   │   │   │   └── ThemeToggle.svelte
│   │   │   ├── molecules/      # (Future: SearchBar, Modal)
│   │   │   └── organisms/      # Complex components
│   │   │       ├── CardForm.svelte
│   │   │       ├── CardEditModal.svelte
│   │   │       ├── DeckEditModal.svelte
│   │   │       └── ReviewSession.svelte
│   │   ├── db/                 # Database layer
│   │   │   ├── schema.ts       # Dexie schema & DB class
│   │   │   ├── cards.ts        # Card CRUD operations
│   │   │   ├── decks.ts        # Deck CRUD operations
│   │   │   └── index.ts        # Public exports
│   │   ├── stores/             # Svelte stores
│   │   │   └── theme.ts        # Theme state management
│   │   └── types/              # TypeScript definitions
│   │       ├── card.ts
│   │       ├── deck.ts
│   │       ├── review.ts
│   │       └── index.ts
│   ├── routes/                 # SvelteKit file-based routing
│   │   ├── +layout.svelte      # Root layout (theme init)
│   │   ├── +page.svelte        # Dashboard (deck/card management)
│   │   └── review/
│   │       └── [deckId]/
│   │           └── +page.svelte # Review session page
│   ├── app.css                 # Global styles (Tailwind imports)
│   ├── app.html                # HTML template
│   └── app.d.ts                # App-level type declarations
├── static/                     # Static assets
├── tests/                      # (Future: Vitest + Playwright)
├── .gitignore
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Data Models

### Database Schema (Dexie.js)

```typescript
// src/lib/db/schema.ts
export class DangoDB extends Dexie {
  cards: EntityTable<Card, 'id'>;
  decks: EntityTable<Deck, 'id'>;
  reviews: EntityTable<Review, 'id'>;
}

// Indexes for efficient querying:
cards: '++id, deckId, nextReview, created, *tags'
decks: '++id, name, parentId, created, archived'
reviews: '++id, cardId, date'
```

### Card Model

```typescript
interface Card {
  id?: number;              // Auto-incremented primary key
  deckId: number;           // Foreign key to Deck

  // Content
  front: string;            // Question (Markdown support planned)
  back: string;             // Answer (Markdown support planned)

  // Spaced Repetition State
  created: number;          // Unix timestamp
  modified: number;         // Unix timestamp
  nextReview: number;       // Unix timestamp for next review
  interval: number;         // Days until next review
  easeFactor: number;       // Difficulty (FSRS) or ease (SM-2)
  repetitions: number;      // Successful repetitions count

  // Organization
  tags: string[];           // Multi-value index for filtering
  fields?: Record<string, string>;  // Custom fields (future)
  attachments?: string[];   // File attachments (future)
}
```

### Deck Model

```typescript
interface Deck {
  id?: number;
  name: string;
  description?: string;
  parentId?: number;        // For nested deck hierarchy
  created: number;
  modified: number;
  settings: DeckSettings;   // Per-deck configuration
  archived: boolean;
}

interface DeckSettings {
  newCardsPerDay: number;
  reviewsPerDay: number;
  algorithm: 'fsrs' | 'sm2';
}
```

### Review Model

```typescript
interface Review {
  id?: number;
  cardId: number;
  date: number;
  result: 'again' | 'hard' | 'good' | 'easy';
  interval: number;         // Interval after this review
  timeSpent: number;        // Milliseconds spent on card
}
```

## Component Architecture

### Atomic Design Pattern

**Atoms** - Basic, reusable UI elements
- `Button.svelte` - Primary, secondary, danger variants
- `Input.svelte` - Text input with label
- `Textarea.svelte` - Multi-line input
- `ThemeToggle.svelte` - Light/dark/system theme switcher

**Organisms** - Complex, feature-complete components
- `CardForm.svelte` - Create new cards
- `CardEditModal.svelte` - Edit existing cards
- `DeckEditModal.svelte` - Edit deck properties
- `ReviewSession.svelte` - Full review interface with keyboard shortcuts

### Component Communication

**Props (one-way data flow):**
```typescript
// Parent passes data down
interface Props {
  deckId: number;
  onComplete?: () => void;
}
let { deckId, onComplete }: Props = $props();
```

**Events (callbacks):**
```typescript
// Child calls parent function
<CardForm deckId={selectedDeck.id} onSuccess={handleCardAdded} />
```

**Stores (shared state):**
```typescript
// Global theme state
import { theme } from '$lib/stores/theme';
theme.set('dark');
```

## State Management

### Svelte 5 Runes

**$state** - Reactive state
```typescript
let cards = $state<Card[]>([]);
let currentIndex = $state(0);
```

**$derived** - Computed values
```typescript
let currentCard = $derived(cards[currentIndex]);
let progress = $derived((reviewedCount / cards.length) * 100);
```

**$props** - Component props
```typescript
let { deckId, onComplete }: Props = $props();
```

### Svelte Stores

**Theme Store** (`src/lib/stores/theme.ts`)
- Writable store with custom methods
- Persists to localStorage
- Applies CSS classes to `<html>` element
- Supports system preference detection

```typescript
export const theme = createThemeStore();
// Methods: subscribe, set, init
```

## Spaced Repetition Algorithm

### FSRS (Free Spaced Repetition Scheduler)

**Core Concepts:**
- **Stability (S):** How long the memory will last
- **Difficulty (D):** How hard the card is (1-10 scale)
- **Retrievability (R):** Probability of recall at time t

**Key Functions:**

1. **First Review (New Card):**
   - Initialize stability based on rating
   - Initialize difficulty based on rating
   - Return short intervals (6h, 6h, 1d, 3d)

2. **Subsequent Reviews:**
   - Calculate retrievability from elapsed time and stability
   - Update difficulty based on rating
   - Update stability based on whether card was recalled
   - Calculate optimal interval for target retention (90%)

3. **Interval Prediction:**
   - Uses 19 weight parameters (optimized from research)
   - Predicts next intervals for all 4 buttons
   - Shows intervals in human-readable format

**Parameters:**
```typescript
const DEFAULT_PARAMETERS = {
  w: [0.4072, 1.1829, ...], // 19 weight parameters
  requestRetention: 0.9,     // 90% retention target
  maximumInterval: 36500,    // 100 years max
  enableFuzz: true           // Add randomness to prevent clustering
};
```

### Scheduler Abstraction

`src/lib/algorithms/scheduler.ts` provides a unified interface:

```typescript
// Switch algorithms
setAlgorithm('fsrs' | 'sm2');

// Calculate next review
calculateNextReview(card, 'good')
  → { interval, easeFactor, repetitions, nextReview }

// Get button labels
getButtonLabels(card)
  → { again: '6h', hard: '2d', good: '1w', easy: '2w' }
```

## Data Flow

### Creating a Card

1. User fills `CardForm.svelte`
2. Form validates input
3. Calls `cardOperations.create()` from `src/lib/db/cards.ts`
4. Dexie adds to IndexedDB `cards` table
5. Returns auto-generated ID
6. Parent reloads cards via `cardOperations.getByDeck()`
7. UI updates reactively

### Review Session Flow

1. Route: `/review/[deckId]`
2. Load due cards: `cardOperations.getDueCards(deckId)`
   - Query: `where('deckId').equals(id).filter(c => c.nextReview <= now)`
3. Display first card (front only)
4. User presses Space → reveal back
5. User rates card (1-4)
6. Call `calculateNextReview(card, rating)`
7. Update card with new schedule
8. Create `Review` record
9. Move to next card
10. Show completion when done

### Theme Switching

1. User clicks `ThemeToggle.svelte`
2. Cycles through: light → dark → system
3. Calls `theme.set(newTheme)`
4. Store saves to localStorage
5. Store calls `applyTheme()`
6. `applyTheme()` toggles `dark` class on `<html>`
7. Tailwind CSS applies dark: variants
8. On app load: `theme.init()` reads localStorage and applies

## Database Operations

### CRUD Pattern

Each entity (cards, decks) has a dedicated operations file:

**Create:**
```typescript
await cardOperations.create({
  deckId, front, back, tags,
  // Auto-populated: id, created, modified, nextReview, etc.
});
```

**Read:**
```typescript
const card = await cardOperations.getById(id);
const cards = await cardOperations.getByDeck(deckId);
const due = await cardOperations.getDueCards(deckId);
```

**Update:**
```typescript
await cardOperations.update(id, {
  front: 'New question',
  modified: Date.now()
});
```

**Delete:**
```typescript
await cardOperations.delete(id);
```

### Queries

Dexie provides efficient indexed queries:

```typescript
// Get cards due for review
db.cards
  .where('deckId').equals(deckId)
  .filter(c => c.nextReview <= Date.now())
  .toArray();

// Search cards by tags (multi-value index)
db.cards.where('tags').equals('vocabulary').toArray();

// Get archived decks
db.decks.filter(d => d.archived).toArray();
```

## Routing

### SvelteKit File-Based Routing

```
src/routes/
  +layout.svelte          → Wraps all pages, initializes theme
  +page.svelte            → Dashboard (/)
  review/
    [deckId]/
      +page.svelte        → Review session (/review/123)
```

### Route Parameters

```typescript
// In review/[deckId]/+page.svelte
import { page } from '$app/stores';
const deckId = Number($page.params.deckId);
```

### Navigation

```svelte
<a href="/review/{selectedDeck.id}">Start Review →</a>
```

## Styling System

### Tailwind CSS v4

**Import in `src/app.css`:**
```css
@import 'tailwindcss';
```

**Dark Mode:**
- Class-based strategy: `class="dark:bg-gray-900"`
- Toggle via `<html class="dark">`

**Component Styles:**
```svelte
<button class="px-3 py-2 rounded-lg
  bg-blue-600 hover:bg-blue-700
  dark:bg-blue-500 dark:hover:bg-blue-600
  text-white transition-colors">
  Button
</button>
```

**Responsive:**
```svelte
<div class="grid md:grid-cols-3 gap-6">
  <!-- Mobile: 1 column, Desktop: 3 columns -->
</div>
```

## Type Safety

### Strict TypeScript

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Exports

```typescript
// src/lib/types/index.ts
export type { Card } from './card';
export type { Deck } from './deck';
export type { Review, ReviewResult } from './review';

// Usage
import type { Card, Deck } from '$lib/types';
```

### Dexie Type Safety

```typescript
import type { EntityTable } from 'dexie';

export class DangoDB extends Dexie {
  cards!: EntityTable<Card, 'id'>;
  //      ^^^^^^^^^^^^^^^^^^^^^^^^
  //      EntityTable<Type, PrimaryKeyField>
}
```

## Performance Considerations

### Bundle Size
- Dexie.js: ~10KB gzipped
- Tailwind CSS: JIT compiler (only used classes)
- SvelteKit: Code splitting by route
- Target: < 500KB total bundle

### Database Performance
- Indexed queries for O(log n) lookups
- Multi-value index on `tags` for fast filtering
- Compound index on `deckId + nextReview` for due cards

### Rendering
- Svelte compiles to vanilla JS (no virtual DOM)
- Fine-grained reactivity (only changed elements update)
- CSS animations via Tailwind transitions

## Keyboard Shortcuts

### Review Session
- **Space** - Reveal answer
- **1** - Rate "Again" (forgot)
- **2** - Rate "Hard"
- **3** - Rate "Good"
- **4** - Rate "Easy"

### Implementation
```typescript
document.addEventListener('keydown', handleKeyPress);

function handleKeyPress(e: KeyboardEvent) {
  if (e.code === 'Space' && !showAnswer) {
    e.preventDefault();
    showAnswer = true;
  }
  if (showAnswer && e.code === 'Digit1') {
    rateCard('again');
  }
}
```

## Accessibility

### ARIA Roles
- Modals have `role="button"` on backdrop
- Buttons have `aria-label` for icon-only actions

### Keyboard Navigation
- All interactive elements keyboard-accessible
- Escape key closes modals
- Tab order follows visual order

### Screen Readers
- Semantic HTML (`<button>`, `<header>`, not `<div onclick>`)
- Labels on all form inputs
- Status messages announced

## Future Enhancements

### Phase 2: Rich Text (Weeks 5-7)
- Milkdown markdown editor integration
- KaTeX for math equations
- Shiki for syntax highlighting
- Image attachments

### Phase 3: Organization (Weeks 8-10)
- Nested deck hierarchy
- Advanced tagging system
- Full-text search (Lunr.js or MiniSearch)
- Statistics dashboard

### Phase 4: Views (Weeks 11-12)
- Column view (Kanban)
- Table view (spreadsheet)
- Grid view

### Phase 5: Advanced (Weeks 13-16)
- Note-taking system
- Import/Export (Anki, CSV, Mochi)
- Custom keyboard shortcuts
- Review history visualization

### Phase 6: Sync (Future)
- Backend API (Supabase/Firebase)
- Authentication
- Multi-device sync
- Conflict resolution

## Development Workflow

### Local Development
```bash
npm install       # Install dependencies
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run preview   # Preview production build
```

### Code Organization Guidelines
1. Keep components small and focused
2. Extract shared logic into functions
3. Use TypeScript interfaces for all data shapes
4. Prefer composition over inheritance
5. Write self-documenting code (clear names)

### Testing Strategy (Future)
- **Unit tests:** Vitest for algorithms and utilities
- **Component tests:** Svelte Testing Library
- **E2E tests:** Playwright for critical user flows
- **Target:** 80% code coverage

## Design Decisions

### Why Offline-First?
- No server costs
- Instant operations (no network latency)
- Privacy: data never leaves device
- Simpler architecture
- Can add sync later without breaking changes

### Why Dexie.js over PouchDB?
- Smaller bundle (10KB vs 54KB)
- Better TypeScript support
- Modern Promise API
- Simpler for single-device use case
- Active maintenance

### Why FSRS over SM-2?
- Research-backed (2023 papers)
- Better retention optimization
- More accurate predictions
- Maintained by active community
- Backward compatible (can switch back)

### Why SvelteKit over React/Vue?
- Smaller bundle size
- Simpler mental model
- Better performance (compiled)
- Built-in routing and SSR
- Svelte 5 runes = excellent DX

### Why Tailwind CSS?
- Rapid prototyping
- Consistent design system
- Tree-shaking (only used classes)
- Dark mode built-in
- No CSS specificity issues

## Maintenance

### Updating Dependencies
```bash
npm outdated              # Check for updates
npm update                # Update to compatible versions
npm install <pkg>@latest  # Major version upgrades
```

### Database Migrations

When schema changes:
```typescript
// src/lib/db/schema.ts
this.version(2).stores({
  cards: '++id, deckId, nextReview, created, *tags, state',
  //                                               ^^^^^^ New field
});
```

Dexie handles migrations automatically.

## Security Considerations

### Data Storage
- IndexedDB is origin-scoped (no cross-origin access)
- Data persists in browser storage (not on servers)
- Users should backup important decks (export feature planned)

### Input Validation
- All user input sanitized before storage
- Markdown rendering will use DOMPurify
- No `eval()` or `innerHTML` usage

### XSS Prevention
- Svelte auto-escapes all interpolated values
- Use `{@html}` sparingly and with DOMPurify

## Troubleshooting

### Common Issues

**Cards not showing in review:**
- Check `nextReview` timestamp is in the past
- Verify card's `deckId` matches selected deck

**Dark mode not persisting:**
- Check localStorage permissions
- Verify `theme.init()` called in `+layout.svelte`

**Database errors:**
- Clear IndexedDB via DevTools → Application → Storage
- Check Dexie version compatibility

### Debug Tools

**Browser DevTools:**
- Application tab → IndexedDB → DangoDB
- Console → Check for errors
- Network tab → Should be empty (offline-first)

**Svelte DevTools:**
- Install browser extension
- Inspect component state and props

---

**Last Updated:** 2026-01-01
**Version:** 1.0.0 (MVP)
**Contributors:** Built with Claude Code
