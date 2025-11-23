import { ChildProfile, EnhancedProgram, ProgramValues } from './types';

/**
 * Match Scoring Algorithm - Track 2 & 3 Core Feature
 * Calculates how well a child's profile matches a program's values
 */

interface MatchAnalysis {
  score: number; // 0-100 overall match score
  reasons: string[]; // Why this is a good (or poor) match
  strengths: string[]; // Child's strengths that align with program values
  gaps: string[]; // Areas where child might need to grow
}

/**
 * Maps child interests to program value categories
 */
const INTEREST_TO_VALUE_MAP: Record<string, keyof ProgramValues> = {
  'Sports': 'athleticism',
  'Martial Arts': 'athleticism',
  'Swimming': 'athleticism',
  'Dance': 'athleticism',
  'Arts & Crafts': 'creativity',
  'Music': 'creativity',
  'Drama': 'creativity',
  'STEM': 'academicExcellence',
  'Coding': 'innovation',
  'Robotics': 'innovation',
  'Science': 'academicExcellence',
  'Reading': 'academicExcellence',
};

/**
 * Maps child strengths to program value categories
 */
const STRENGTH_TO_VALUE_MAP: Record<string, keyof ProgramValues> = {
  'Teamwork': 'teamwork',
  'Creativity': 'creativity',
  'Leadership': 'leadership',
  'Problem Solving': 'innovation',
  'Communication': 'teamwork',
  'Perseverance': 'independence',
  'Empathy': 'communityService',
  'Critical Thinking': 'academicExcellence',
};

/**
 * Calculates match score between child profile and program values
 */
export function calculateMatchScore(
  profile: ChildProfile,
  program: EnhancedProgram
): MatchAnalysis {
  if (!program.values) {
    return {
      score: 50, // Neutral score if no values data
      reasons: ['No values analysis available for this program'],
      strengths: [],
      gaps: [],
    };
  }

  const values = program.values;
  const scores: number[] = [];
  const matchReasons: string[] = [];
  const strengths: string[] = [];
  const gaps: string[] = [];

  // 1. Interest Alignment (40% of score)
  let interestScore = 0;
  let interestCount = 0;

  profile.interests.forEach(interest => {
    const valueKey = INTEREST_TO_VALUE_MAP[interest];
    if (valueKey && valueKey !== 'analysis') {
      const programValue = values[valueKey];
      if (typeof programValue === 'number') {
        interestScore += programValue;
        interestCount++;

        if (programValue > 75) {
          strengths.push(`${interest} aligns strongly with program focus`);
          matchReasons.push(`Strong match: Program highly values ${valueKey} (score: ${programValue})`);
        }
      }
    }
  });

  if (interestCount > 0) {
    scores.push((interestScore / interestCount) * 0.4);
  }

  // 2. Strengths Alignment (40% of score)
  let strengthScore = 0;
  let strengthCount = 0;

  profile.strengths.forEach(strength => {
    const valueKey = STRENGTH_TO_VALUE_MAP[strength];
    if (valueKey && valueKey !== 'analysis') {
      const programValue = values[valueKey];
      if (typeof programValue === 'number') {
        strengthScore += programValue;
        strengthCount++;

        if (programValue > 80) {
          strengths.push(`${strength} is highly valued by this program`);
          matchReasons.push(`Excellent fit: ${strength} matches program's emphasis on ${valueKey}`);
        } else if (programValue < 40) {
          gaps.push(`Program doesn't emphasize ${valueKey} as much`);
        }
      }
    }
  });

  if (strengthCount > 0) {
    scores.push((strengthScore / strengthCount) * 0.4);
  }

  // 3. Special Needs Consideration (10% of score)
  let needsScore = 100; // Default to full score

  if (profile.needs.includes('Special Needs Support')) {
    // Check if program emphasizes diversity and inclusion
    if (values.diversity > 70) {
      needsScore = 100;
      strengths.push('Program shows strong commitment to diversity and inclusion');
    } else {
      needsScore = 50;
      gaps.push('Program diversity commitment unclear - verify accessibility support');
    }
  }

  if (profile.needs.includes('Scholarship/Financial Aid')) {
    if (program.hasFinancialAid) {
      needsScore = Math.max(needsScore, 100);
      strengths.push('Financial aid available!');
      matchReasons.push('Program offers financial assistance');
    } else {
      needsScore = Math.min(needsScore, 60);
      gaps.push('No financial aid information found');
    }
  }

  scores.push(needsScore * 0.1);

  // 4. Price Compatibility (10% of score)
  let priceScore = 100;

  if (profile.maxPrice && typeof program.cost.amount === 'number' && !isNaN(program.cost.amount)) {
    const monthlyCost = program.cost.frequency.includes('month')
      ? program.cost.amount
      : program.cost.amount / 4; // Rough monthly estimate

    if (monthlyCost <= profile.maxPrice) {
      priceScore = 100;
      matchReasons.push(`Within budget: $${monthlyCost}/month`);
    } else {
      const overBudget = ((monthlyCost - profile.maxPrice) / profile.maxPrice) * 100;
      priceScore = Math.max(0, 100 - overBudget);

      if (overBudget > 50) {
        gaps.push(`Program cost ($${monthlyCost}/mo) exceeds budget by ${overBudget.toFixed(0)}%`);
      }
    }
  }

  scores.push(priceScore * 0.1);

  // Calculate final score
  const finalScore = Math.round(scores.reduce((sum, score) => sum + score, 0));

  // Add overall assessment
  if (finalScore >= 80) {
    matchReasons.unshift('⭐ Excellent Match - Highly recommended!');
  } else if (finalScore >= 60) {
    matchReasons.unshift('✓ Good Match - Worth exploring');
  } else if (finalScore >= 40) {
    matchReasons.unshift('~ Fair Match - May require more research');
  } else {
    matchReasons.unshift('⚠ Weak Match - Consider alternatives');
  }

  return {
    score: finalScore,
    reasons: matchReasons.slice(0, 5), // Top 5 reasons
    strengths: strengths.slice(0, 3), // Top 3 strengths
    gaps: gaps.slice(0, 2), // Top 2 gaps
  };
}

/**
 * Sorts programs by match score (highest first)
 */
export function sortProgramsByMatch(
  programs: EnhancedProgram[],
  profile: ChildProfile | null
): EnhancedProgram[] {
  if (!profile) return programs;

  return programs
    .map(program => {
      const match = calculateMatchScore(profile, program);
      return {
        ...program,
        matchScore: match.score,
        matchReasons: match.reasons,
      };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
