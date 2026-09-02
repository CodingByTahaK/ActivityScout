# ActivityScout

An AI-powered search tool that helps parents find recreational programs for their kids, with a focus on surfacing financial aid that conventional search misses.

Built for the U of T Anthropic Hackathon 2025, Track 2 (Human-Centered AI).

<!-- TODO: add a screenshot here. A single image of the results view with match scores
     and affordability badges visible does more than the rest of this README combined. -->

---

## The problem

Recreational programs for kids are hard to find on three separate axes, and general search engines only help with one of them.

**Affordability is buried.** Scholarships, bursaries, sliding-scale pricing, and subsidy programs exist, but the information tends to live in PDFs, footnotes, or a phone number you have to call during business hours. Search engines index the program page, not the funding note halfway down it.

**Fit is unknowable from a listing.** A search returns hundreds of programs. Nothing in a typical listing tells you whether a program is competitive or collaborative, beginner-friendly or advanced, or whether a specific kid would thrive there.

**Applications are scattered.** Registration lives on each organization's own site, behind different platforms and accounts.

ActivityScout addresses all three by using Claude's web search tool to read program pages rather than just rank them.

---

## How it works

### 1. Profile creation

The parent optionally builds a profile for their child, which drives the match scoring later.

```typescript
interface ChildProfile {
  name: string;
  age: number;
  interests: string[];      // e.g. ["soccer", "arts", "friends"]
  strengths: string[];      // e.g. ["teamwork", "creativity"]
  needs: string[];          // e.g. ["beginner-friendly", "scholarship"]
  goals: string;            // parent's narrative
  location: string;
  maxPrice?: number;
}
```

### 2. Multi-search discovery

Rather than one query, the app has Claude run three to four web searches with deliberately varied phrasing. Affordability language is inconsistent across organizations — one site says "bursary," another says "sliding scale," another says "fee assistance" — so a single query systematically misses programs.

```
"soccer programs 8 year olds Toronto financial aid"
"youth soccer Toronto scholarship sliding scale"
"affordable soccer classes kids Toronto subsidy"
"Toronto recreation soccer free low income"
```

When equity filters are active, the prompt explicitly instructs the model to prioritize programs with aid and to look for that keyword set.

### 3. Extraction

For each program found, Claude returns structured JSON:

```typescript
{
  name: "Exact program name",
  organization: "Organization name",
  cost: {
    amount: 40,
    currency: "CAD",
    frequency: "per month",
    note: "Sliding scale available, scholarships for low-income families"
  },
  hasFinancialAid: true,
  applicationUrl: "https://...",
  values: {              // 9 dimensions, inferred from the program's own site
    diversity: 75,
    teamwork: 100,
    creativity: 85,
    // ...
  }
}
```

The `values` object is the non-obvious part: the model reads the program's mission statement and description and scores what the program actually emphasizes across nine dimensions (diversity, leadership, creativity, academic excellence, community service, athleticism, innovation, teamwork, independence).

### 4. Match scoring

Scoring happens locally in `app/lib/matchScoring.ts`, not in the model, so it's deterministic and inspectable.

```typescript
const finalScore =
  interestScore   * 0.4 +   // profile interests vs. program values
  strengthsScore  * 0.4 +   // profile strengths vs. program values
  needsScore      * 0.1 +   // diversity score + financial aid bonus
  budgetScore     * 0.1;    // within maxPrice
```

Each result also carries generated match reasons so the parent can see why a program scored the way it did, rather than trusting an opaque number.

### 5. Streaming results

Results stream back over Server-Sent Events (`app/api/search/route.ts`) so programs appear as they're found instead of after all searches complete. Web search over four queries takes long enough that a blocking request feels broken.

---

## Architecture

```
app/
├── page.tsx                      # main search interface
├── layout.tsx
├── globals.css
├── api/
│   └── search/route.ts           # SSE streaming endpoint
├── components/
│   ├── SearchBar.tsx             # search input + equity filters
│   ├── ChildProfileForm.tsx      # profile creation modal
│   ├── ProgramCard.tsx           # match score + affordability badges
│   ├── ResultsDisplay.tsx        # results grid
│   ├── LocationAutocomplete.tsx  # Google Places-backed location input
│   ├── LoadingAnimation.tsx
│   └── LoadingThinking.tsx
└── lib/
    ├── claude.ts                 # Anthropic API integration + prompts
    ├── matchScoring.ts           # scoring algorithm
    ├── googlePlaces.ts           # ratings enrichment
    ├── geocoding.ts              # batch address → coordinates
    └── types.ts
```

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 3.4, Framer Motion 12.

**AI:** `@anthropic-ai/sdk` 0.70, model `claude-sonnet-4-20250514`, with the `web_search_20250305` server tool for live program discovery.

**External APIs:** Google Places (optional) for ratings and geocoding.

---

## Running locally

**Prerequisites:** Node.js 18+, an Anthropic API key with web search enabled.

```bash
git clone https://github.com/CodingByTahaK/ActivityScout.git
cd ActivityScout
npm install
```

Create `.env.local`:

```bash
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional — enables ratings and map coordinates
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

```bash
npm run dev
```

Open http://localhost:3000. Create a profile or skip it, enter a query and location, optionally enable affordability filters, and search.

Note that each search issues multiple web search calls, so expect real API cost per query and a few seconds before the first result streams in.

---

## What I'd do differently

<!-- TODO: replace these with your own. This section is the most useful part of the
     README for anyone evaluating you — it shows you can assess your own work.
     Two or three honest items beat ten generic ones. Some candidates below; keep
     only the ones you actually believe. -->

- **The scoring weights are unvalidated.** The 40/40/10/10 split was chosen by intuition during a hackathon, not derived from any feedback data. Without parents rating whether matches were good, there's no evidence this weighting beats a simpler one.
- **No caching.** Identical searches re-run the full multi-search pipeline, which is slow and costs real money. A cache keyed on query plus location plus filters would cut both substantially.
- **Extraction isn't verified.** The model returns structured cost and financial-aid data read off program websites, but nothing validates it against the source. A wrong `hasFinancialAid: true` sends a family down a dead end, which is worse than omitting the program.
- **No tests.** Match scoring is pure and deterministic, so it's the obvious place to start.

---

## License

<!-- TODO: the previous README claimed MIT but there is no LICENSE file in the repo.
     Either add one (github.com/new → Add a license, or copy the MIT text into
     LICENSE) or delete this section. Don't claim a license you haven't included. -->

---

Built by Taha Karim — [GitHub](https://github.com/CodingByTahaK) · [LinkedIn](https://linkedin.com/in/tahakarim1)
