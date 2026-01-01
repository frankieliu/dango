# Import Examples

This directory contains example markdown files for testing the import feature.

## Files Overview

### 1. `01-simple-cards.md`
Basic flashcards without metadata. Perfect for beginners.
- 4 simple Q&A cards
- No metadata (will use default values)
- No images

**Try this first!**

### 2. `02-cards-with-metadata.md`
Cards with full metadata including review history.
- 3 cards with YAML frontmatter
- Includes tags, dates, FSRS parameters
- Useful for importing cards with existing review history

### 3. `03-markdown-formatting.md`
Demonstrates various markdown features.
- Bold, italic, lists, code blocks
- Math equations using KaTeX
- Different separators (===, ***, ___)
- Blockquotes and formatting

### 4. `04-cards-with-images.md` + Images
Cards that reference external image files.
- Requires: `red-circle.svg` and `blue-square.svg`
- Shows image references on front and back
- Multiple images per card

### 5. `05-comprehensive-example.md` + Images
Complete example combining all features.
- Metadata + formatting + images + code + math
- Real-world card examples
- Multiple tags per card

## How to Import

### Option 1: Simple Cards (No Images)
1. Click "Import Markdown" button
2. Select `01-simple-cards.md`
3. Click "Preview Cards"
4. Click "Import N Card(s)"

### Option 2: Cards with Images
1. Click "Import Markdown" button
2. Select markdown file (e.g., `04-cards-with-images.md`)
3. Select image files (`red-circle.svg` and `blue-square.svg`)
4. Click "Preview Cards"
5. Review cards and click "Import"

## Markdown Format Reference

### Card Structure

```markdown
---
tags: [tag1, tag2]
created: 2024-12-01T10:00:00Z
modified: 2024-12-15T14:30:00Z
nextReview: 2025-01-05T10:00:00Z
interval: 7
easeFactor: 2.8
repetitions: 3
---

Front of the card
(Question or prompt)

===

Back of the card
(Answer or explanation)

---

[Next card...]
```

### Key Points

**Card Separator:** `---` (triple dash on its own line)

**Front/Back Separator:** One of:
- `===` (recommended)
- `***` (alternative)
- `___` (alternative)

**Metadata Block (Optional):**
- Must be at the start of a card
- Enclosed in `---` markers
- YAML format
- All fields are optional

**Image References:**
```markdown
![Description](./filename.png)
![Alt text](./image.jpg)
```

**Markdown Features Supported:**
- **Bold** and *italic*
- `inline code`
- ```code blocks```
- $inline math$
- $$display math$$
- Lists (ordered and unordered)
- > Blockquotes
- # Headers
- Links

## Metadata Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `tags` | Array | Tags for organization | `[spanish, vocabulary]` |
| `created` | ISO Date | When card was created | `2024-12-01T10:00:00Z` |
| `modified` | ISO Date | Last modified date | `2024-12-15T14:30:00Z` |
| `nextReview` | ISO Date | Next review date | `2025-01-05T10:00:00Z` |
| `interval` | Number | Days until next review | `7` |
| `easeFactor` | Number | FSRS ease factor | `2.8` |
| `repetitions` | Number | Number of reviews | `3` |

## Tips

1. **Start Simple:** Try `01-simple-cards.md` first
2. **Test Preview:** Always preview before importing
3. **Image Paths:** Use relative paths with `./` prefix
4. **Line Breaks:** Markdown requires blank lines between paragraphs
5. **Code Blocks:** Specify language for syntax highlighting
6. **Math:** Use single `$` for inline, double `$$` for display

## Creating Your Own

1. Copy one of these examples
2. Modify the content
3. Save as `.md` file
4. Import into Dango!

## Export

When you export cards, they will use the same format as these examples.
This makes it easy to:
- Edit cards in a text editor
- Version control your flashcards (Git)
- Share decks with others
- Backup your cards as plain text

## Need Help?

Check the import modal in the app - it shows a quick reference
of the format.
