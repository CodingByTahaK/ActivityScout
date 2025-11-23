# ActivityScout 🎯

> **Find programs kids love. Parents can afford. Applications made easy.**

Built for the **Anthropic AI Hackathon 2025** - Track 2 (Human-Centered AI)

[![Built with Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Powered by Claude](https://img.shields.io/badge/Claude-Sonnet_4.5-orange?style=flat-square)](https://www.anthropic.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## 💡 The Problem

**Sarah is a single parent with two kids in Toronto, working two jobs to make ends meet.**

She wants her 8-year-old daughter Maya to join a soccer program. Maya loves being active, thrives in team environments, and needs to build confidence. But Sarah faces three impossible challenges:

### 1️⃣ **The Affordability Maze**
- low-income families report difficulty finding affordable recreational programs
- Financial aid information is buried in PDFs, hidden in footnotes, or requires calling during business hours
- Scholarships exist, but finding them requires insider knowledge

### 2️⃣ **The Fit Problem**
- Generic search shows 200+ programs, but which one is right for Maya's personality?
- Some programs value competition; Maya needs collaboration
- Some are for advanced players; Maya is a beginner
- Parents spend hours reading descriptions trying to guess if their child will thrive

### 3️⃣ **The Application Burden**
- Once you find a program, where do you apply?
- Registration links are scattered across organization websites
- Multiple platforms, multiple accounts, multiple frustrations
- Low-income families give up before reaching the finish line

**Result:** Kids like Maya miss out on opportunities that could change their lives. Not because programs don't exist. But because finding them is too hard.

---

## 🚀 The Solution

**ActivityScout** is an AI-powered program finder that solves all three problems:

### ✅ **Track 2: Equity-Focused Search** (Human-Centered AI)
- **Explicit affordability filters**: Free only, Financial aid available, Subsidized/sliding scale
- **AI-powered scholarship detection**: Claude searches program websites for keywords like "scholarship," "financial aid," "bursary," "sliding scale," "income-based" that traditional search engines miss
- **Visual affordability badges**: Instant recognition of FREE, Financial Aid, Sliding Scale programs
- **Real impact**: Families find hidden opportunities in seconds, not hours

### ✅ **Smart Personalization**
- **9-dimensional program values analysis**: AI analyzes each program's website, mission, and content to detect what they truly value (diversity, leadership, creativity, academic excellence, community service, athleticism, innovation, teamwork, independence)
- **4-factor match scoring**: 40% interest alignment + 40% strengths alignment + 10% special needs + 10% budget compatibility = personalized fit score (0-100)
- **Transparent match reasons**: Parents see WHY each program is a good fit for their child
- **One-click applications**: AI extracts direct application URLs from program websites

---

## 🏗️ Technical Architecture

### **Frontend: Next.js 14 + TypeScript**
```
app/
├── page.tsx                    # Main search interface
├── components/
│   ├── SearchBar.tsx          # Search + equity filters UI
│   ├── ProgramCard.tsx        # Match scores + affordability badges
│   ├── ResultsDisplay.tsx     # Results grid layout
│   └── ChildProfileForm.tsx   # Profile creation modal
├── lib/
│   ├── claude.ts              # Claude API integration
│   ├── types.ts               # TypeScript interfaces
│   └── matchScoring.ts        # Match algorithm
└── api/
    └── search/route.ts         # SSE streaming endpoint
```

### **Backend: Claude Sonnet 4.5 API**
- **Model**: `claude-sonnet-4-20250514`
- **Tool**: `web_search_20250305` for real-time program discovery
- **Strategy**: Multi-search approach (3-4 web searches per query with different terms)
- **Output**: Structured JSON with program details, values, and financial aid info

### **Key Technologies**
- **Next.js 14**: App Router, Server-Sent Events (SSE), TypeScript
- **Claude API**: Web search, structured outputs, streaming
- **Tailwind CSS v3**: Utility-first styling with custom cyber theme
- **Framer Motion**: Spring animations and micro-interactions
- **React Icons**: io5 icon set for consistent UI

---

## 🧠 How It Works

### **1. Profile Creation**
```typescript
interface ChildProfile {
  name: string;
  age: number;
  interests: string[];      // e.g., ["soccer", "arts", "friends"]
  strengths: string[];      // e.g., ["teamwork", "creativity"]
  needs: string[];          // e.g., ["beginner-friendly", "scholarship"]
  goals: string;            // Parent's narrative
  location: string;
  maxPrice?: number;
}
```

### **2. Equity-Focused Search (Track 2)**
```typescript
// User selects affordability filters
const searchParams = {
  query: "soccer classes for 8 year olds",
  location: "Toronto, Ontario",
  freeOnly: false,
  showFinancialAidOnly: true,
  subsidizedOnly: true,
};

// Claude receives enhanced prompt
const equityPrompt = `
🎯 EQUITY FILTERS (CRITICAL):
- PRIORITIZE: Programs with financial aid, scholarships, or subsidies
- PRIORITIZE: Income-based or sliding scale pricing programs

IMPORTANT: Search specifically for programs matching these affordability
criteria. Look for keywords: "free", "scholarship", "financial aid",
"subsidy", "sliding scale", "income-based", "no cost".
`;
```

### **3. AI-Powered Program Discovery**
```typescript
// Claude performs 3-4 web searches with different terms
Search 1: "soccer programs 8 year olds Toronto financial aid"
Search 2: "youth soccer Toronto scholarship sliding scale"
Search 3: "affordable soccer classes kids Toronto subsidy"
Search 4: "Toronto recreation soccer free low income"

// For each program found, Claude extracts:
{
  name: "Exact program name",
  organization: "Organization name",
  cost: {
    amount: 40,
    currency: "CAD",
    frequency: "per month",
    note: "Sliding scale available, scholarships for low-income families"
  },
  hasFinancialAid: true,  // 🔑 Affordability tracking
  applicationUrl: "https://...",  // 🔑 Direct application links
  values: {  // 🔑 Program values analysis
    diversity: 75,
    teamwork: 100,
    creativity: 85,
    // ... 9 dimensions total
  }
}
```

### **4. Match Scoring Algorithm**
```typescript
function calculateMatchScore(profile: ChildProfile, program: EnhancedProgram) {
  // 1. Interest Alignment (40%)
  const interestScore = matchInterestsToValues(profile.interests, program.values);

  // 2. Strengths Alignment (40%)
  const strengthsScore = matchStrengthsToValues(profile.strengths, program.values);

  // 3. Special Needs (10%)
  const needsScore = program.values.diversity + (program.hasFinancialAid ? 20 : 0);

  // 4. Budget Compatibility (10%)
  const budgetScore = program.cost.amount <= profile.maxPrice ? 100 : 0;

  const finalScore = interestScore * 0.4 + strengthsScore * 0.4 +
                     needsScore * 0.1 + budgetScore * 0.1;

  return {
    score: Math.round(finalScore),
    reasons: generateMatchReasons(profile, program),
  };
}
```

### **5. Results Display**
- Programs sorted by match score (highest first)
- Affordability badges rendered based on cost data
- Match reasons explain the AI's reasoning
- Apply Now button extracted from program websites

---

## 🚦 Getting Started

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Anthropic API key with Claude Sonnet 4.5 access

### **Installation**

#### **1. Clone the repository**
```bash
git clone https://github.com/CodingByTahaK/ActivityScout.git
cd ActivityScout
```

#### **2. Install dependencies**
```bash
npm install
```

#### **3. Set up environment variables**
Create a `.env.local` file in the root directory:
```bash
# Required
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional (for Google Places ratings and enhanced search)
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

**Getting API Keys:**
- **Anthropic API Key:** Sign up at https://console.anthropic.com/ and create an API key
- **Google Places API Key (Optional):**
  1. Go to https://console.cloud.google.com/
  2. Create a new project or select existing
  3. Enable "Places API"
  4. Create credentials → API Key

#### **4. Run the development server**
```bash
npm run dev
```

The application will be available at **http://localhost:3000**

#### **5. Build for production** (optional)
```bash
npm run build
npm start
```

### **Usage**
1. Open http://localhost:3000
2. Create a child profile (or skip for generic search)
3. Enter search query and location
4. (Optional) Enable affordability filters
5. Click "Find Programs"
6. View match scores, affordability badges, and apply directly

---

## 🏆 Hackathon Submission

### **Track 2: Human-Centered AI** 
**Problem Solved:** Low-income families struggle to find affordable programs

**AI Innovation:**
- Claude searches program websites for financial aid keywords that humans would miss
- Explicit affordability filters (free, financial aid, subsidized)
- Visual badges for instant affordability recognition
- Multi-search strategy to find hidden opportunities

**Impact:** Makes recreational programs accessible to families who need them most

### **Smart Personalization Features** 
**Problem Solved:** Parents waste hours guessing which programs fit their child

**AI Innovation:**
- 9-dimensional program values analysis (AI analyzes mission, content, descriptions)
- 4-factor personalized match scoring (interests, strengths, needs, budget)
- Transparent match reasons for explainability
- Direct application links for easy signup

**Impact:** Helps kids find programs where they'll thrive, not just attend

---

## 🛣️ Roadmap

### **v1.1 - Enhanced Application Support**
- Pre-fill application forms with saved profile data
- Email templates for program inquiries
- Application deadline tracking and reminders

### **v1.2 - Multi-Language Support**
- Spanish, French, Mandarin, Arabic translations
- Expand accessibility to immigrant families

### **v1.3 - SMS Notifications**
- Application deadline reminders
- New program alerts based on saved profiles
- Financial aid announcement notifications

### **v2.0 - Partner Integration**
- Direct API integration with program registration systems
- One-click signup (not just application links)
- Real-time availability and waitlist data

---

## 🙏 Acknowledgments

Built with:
- **Claude Sonnet 4.5** by Anthropic - The AI that makes this possible
- **Next.js** by Vercel - The React framework for production
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library for React


---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🤝 Contributing

This project was built for the Anthropic AI Hackathon, but contributions are welcome! Please open an issue or submit a pull request.

---

## 📧 Contact

**Built by:** Taha Karim
**GitHub:** https://github.com/CodingByTahaK/ActivityScout
**Live Demo:** https://activity-scout.vercel.app/

---

**ActivityScout** - Because every child deserves to take part in extracurricular activities. 🎯
