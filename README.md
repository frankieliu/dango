# 🍡 Dango

A modern, offline-first flashcard application built with SvelteKit and powered by intelligent spaced repetition.

## Features

✨ **Core Functionality**
- Create and organize flashcard decks
- Smart spaced repetition using FSRS algorithm
- Offline-first (all data stored locally)
- Full CRUD operations for decks and cards
- Keyboard shortcuts for efficient reviewing

🎨 **User Experience**
- Dark/light/system theme support
- Clean, responsive interface
- Real-time interval predictions
- Progress tracking during reviews

🔧 **Technical Highlights**
- Built with SvelteKit & TypeScript (strict mode)
- IndexedDB storage via Dexie.js
- FSRS (Free Spaced Repetition Scheduler) algorithm
- Tailwind CSS v4 for styling
- Type-safe throughout

## Quick Start

### Prerequisites
- Node.js 18+
- npm, pnpm, or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/dango.git
cd dango

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173 in your browser
```

### Building for Production

```bash
# Create optimized build
npm run build

# Preview production build
npm run preview
```

## Usage

### Creating Your First Deck

1. Click "Create Deck" on the welcome screen
2. Enter a deck name (e.g., "Spanish Vocabulary")
3. Click "Create"

### Adding Cards

1. Select a deck from the sidebar
2. Fill in the "Front" (question) and "Back" (answer) fields
3. Optionally add tags (comma-separated)
4. Click "Add Card"

### Reviewing Cards

1. Click "Start Review →" from the deck view
2. Read the question, press **Space** to reveal the answer
3. Rate your recall:
   - Press **1** for "Again" (forgot)
   - Press **2** for "Hard" (difficult)
   - Press **3** for "Good" (correct)
   - Press **4** for "Easy" (too easy)

The FSRS algorithm learns from your ratings to optimize review intervals.

### Managing Content

- **Edit Card/Deck:** Click the ✏️ icon
- **Delete Card/Deck:** Click the 🗑️ icon (with confirmation)
- **Switch Theme:** Click the theme toggle in the top-right

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Reveal answer (during review) |
| `1` | Rate "Again" |
| `2` | Rate "Hard" |
| `3` | Rate "Good" |
| `4` | Rate "Easy" |
| `Esc` | Close modals |

## Architecture

Dango follows a clean, modular architecture:

```
src/
├── lib/
│   ├── algorithms/     # FSRS & SM-2 spaced repetition
│   ├── components/     # Atomic design (atoms, organisms)
│   ├── db/             # Dexie.js database operations
│   ├── stores/         # Svelte stores (theme, etc.)
│   └── types/          # TypeScript definitions
└── routes/             # SvelteKit file-based routing
```

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Technology Stack

- **Framework:** SvelteKit with Svelte 5
- **Language:** TypeScript (strict mode)
- **Database:** IndexedDB via Dexie.js
- **Styling:** Tailwind CSS v4
- **Algorithm:** FSRS (with SM-2 fallback)
- **Build Tool:** Vite

## Roadmap

### Current (MVP - Phase 1) ✅
- [x] Deck and card management
- [x] FSRS spaced repetition
- [x] Review sessions with keyboard shortcuts
- [x] Dark/light theme
- [x] Edit/delete functionality

### Next (Phase 2-3)
- [ ] Statistics dashboard
- [ ] Search and filtering
- [ ] Tag-based organization
- [ ] Markdown editor (Milkdown)
- [ ] Math equations (KaTeX)
- [ ] Code syntax highlighting

### Future (Phase 4+)
- [ ] Nested deck hierarchy
- [ ] Import/Export (Anki, CSV)
- [ ] Multiple view modes (table, kanban)
- [ ] Cloud sync (optional)
- [ ] Mobile apps (Tauri)

See [DANGO_REFACTORING_PLAN.md](../DANGO_REFACTORING_PLAN.md) for the full roadmap.

## Development

### Project Structure

```
dango/
├── src/
│   ├── lib/                    # Shared library code
│   │   ├── algorithms/         # Spaced repetition logic
│   │   ├── components/         # Reusable UI components
│   │   ├── db/                 # Database layer
│   │   ├── stores/             # State management
│   │   └── types/              # TypeScript definitions
│   ├── routes/                 # Page components (file-based routing)
│   ├── app.css                 # Global styles
│   └── app.html                # HTML template
├── static/                     # Static assets
├── ARCHITECTURE.md             # Architecture documentation
└── package.json
```

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Run svelte-check for type errors
npm run lint         # Lint code (if configured)
npm run format       # Format code (if configured)
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Why "Dango"?

Dango (団子) are Japanese sweet dumplings served on a skewer. Like the stacked dumplings, this app helps you stack knowledge in your memory, one card at a time! Plus, it's a playful nod to the original app (Mochi = Japanese rice cake).

## License

[MIT License](LICENSE) - feel free to use this project however you'd like!

## Acknowledgments

- Inspired by [Mochi](https://mochi.cards) and [Anki](https://apps.ankiweb.net)
- FSRS algorithm by [open-spaced-repetition](https://github.com/open-spaced-repetition)
- Built with [SvelteKit](https://kit.svelte.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)

---

**Built with ❤️ and Claude Code**
