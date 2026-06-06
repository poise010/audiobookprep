# AudiobookPrep Guide Generator

Automated narrator preparation guide generator for AudiobookPrep.com.

## How It Works

1. Upload a manuscript PDF
2. All 5 guide sections generate in parallel (Plot Summary, Character Breakdown, Perspective Guide, Chapter-by-Chapter, Pronunciation Guide)
3. Edit any section in the browser before exporting
4. Export a branded PDF ready for delivery
5. Save the finished guide to the style library — future guides learn your voice

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- API keys (see below)

### 1. Clone and install

```bash
git clone https://github.com/poise010/audiobookprep.git
cd audiobookprep
make install
```

### 2. Set up API keys

```bash
cp .env.example .env
```

Edit `.env` with your keys:

| Key | Where to get it | Required? |
|-----|-----------------|-----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com | **Required** |
| `MW_API_KEY` | dictionaryapi.com/register | Recommended |
| `FORVO_API_KEY` | api.forvo.com/plans | Optional |
| `BTN_API_KEY` | behindthename.com/api | Optional |

### 3. (Optional) Seed the style library with past guides

If you have completed prep guides you want the AI to learn from, add them to `sample_guides/`:

- File format: `.txt` or `.md`
- File naming: `BookTitle_AuthorName.txt` (e.g. `The-Name-of-the-Wind_Patrick-Rothfuss.md`)
- Section headings must be: `## Plot Summary`, `## Character Breakdown`, `## Perspective Guide`, `## Chapter Summary`, `## Pronunciation Guide`

Then run:
```bash
make seed-corpus
```

### 4. Start the app

```bash
make dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

## Usage

1. Open http://localhost:5173
2. Click **New Guide** and upload a manuscript PDF
3. Add title and author (optional — auto-detected from filename)
4. Click **Generate Guide** and watch all 5 sections generate in parallel
5. Edit any section using the rich text editor
6. Click **Export PDF** to download the finished guide
7. Click **Save to Library** to add this guide to the style corpus

## Changing the Claude Model

Edit `CLAUDE_MODEL` in your `.env` file:
- `claude-opus-4-8` — highest quality (default)
- `claude-sonnet-4-6` — faster and cheaper, good for testing

## Running Tests

```bash
make test
```

## Troubleshooting

**Every section shows "Error" / "Your credit balance is too low"**
Your Anthropic account has no credit. Go to **console.anthropic.com → Plans & Billing** and add credit, then click **Regenerate** on each section. The app now shows the exact API error inside each section so you always know what's wrong.

**"vite: command not found"**
The frontend packages aren't installed. Run `cd frontend && npm install`.

**WeasyPrint / `libgobject-2.0-0` error on macOS**
Install the native graphics library: `brew install pango`.

## Cost note

By default this uses `claude-opus-4-8` (highest quality). A full guide is 5 long generations per book, so Opus can get expensive. To cut cost ~5× with near-identical quality, set this in `.env` and restart:

```
CLAUDE_MODEL=claude-sonnet-4-6
```
