'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SearchResponse, ChildProfile, EnhancedProgram } from '@/app/lib/types';
import ProgramCard from './ProgramCard';
import { IoSad, IoAlert, IoCheckmarkCircle } from 'react-icons/io5';

interface ResultsDisplayProps {
  results: SearchResponse | null;
  error: string | null;
  profile: ChildProfile | null;
}

type SortOption = 'match' | 'rating' | 'reviews';

export default function ResultsDisplay({ results, error, profile }: ResultsDisplayProps) {
  const [sortBy, setSortBy] = useState<SortOption>(profile ? 'match' : 'rating');
  const [minRating, setMinRating] = useState<number>(0);
  // Show error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mt-16 md:mt-20 px-4"
      >
        <div className="glass rounded-2xl p-8 md:p-10 border-2 border-[#ff2e63]/50">
          <div className="flex items-start gap-4">
            <IoAlert className="w-8 h-8 text-[#ff2e63] flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-[#ff2e63] mb-2">Search Error</h3>
              <p className="text-gray-300 leading-relaxed">{error}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Show empty state when no search has been performed
  if (!results) {
    return null;
  }

  // Sort and filter programs based on selected options
  const sortedPrograms = useMemo(() => {
    let programs = [...(results.programs as EnhancedProgram[])];

    // Filter by minimum rating
    if (minRating > 0) {
      programs = programs.filter(program => {
        const rating = program.googlePlaces?.rating || 0;
        return rating >= minRating;
      });
    }

    // Sort programs
    switch (sortBy) {
      case 'rating':
        return programs.sort((a, b) => {
          const ratingA = a.googlePlaces?.rating || 0;
          const ratingB = b.googlePlaces?.rating || 0;
          return ratingB - ratingA; // Descending order
        });
      case 'reviews':
        return programs.sort((a, b) => {
          const reviewsA = a.googlePlaces?.userRatingsTotal || 0;
          const reviewsB = b.googlePlaces?.userRatingsTotal || 0;
          return reviewsB - reviewsA; // Descending order
        });
      case 'match':
      default:
        return programs.sort((a, b) => {
          const scoreA = a.matchScore || 0;
          const scoreB = b.matchScore || 0;
          return scoreB - scoreA; // Descending order
        });
    }
  }, [results.programs, sortBy, minRating]);

  // Show no results state
  if (results.programs.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl mx-auto mt-16 md:mt-20 px-4"
      >
        <div className="glass rounded-2xl p-12 md:p-16 text-center border-2 border-[#08d9d6]/30">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <IoSad className="w-20 h-20 text-[#08d9d6] mx-auto mb-6" />
          </motion.div>
          <h3 className="text-3xl font-bold gradient-text mb-4">No Programs Found</h3>
          <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
            We couldn&apos;t find any programs matching your search criteria. Try adjusting your
            filters or searching with different keywords.
          </p>
        </div>
      </motion.div>
    );
  }

  // Show results
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-6xl mx-auto mt-16 md:mt-20 px-4"
    >
      {/* Results header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 md:mb-12"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <IoCheckmarkCircle className="text-[#00ff88] text-3xl" />
              <h2 className="text-4xl font-bold gradient-text">
                Found {results.searchMetadata.resultsCount}{' '}
                {results.searchMetadata.resultsCount === 1 ? 'Program' : 'Programs'}
              </h2>
            </div>
            <p className="text-gray-400 text-sm ml-11">
              <span className="text-[#00ff88]">&quot;{results.searchMetadata.query}&quot;</span> in{' '}
              <span className="text-[#08d9d6]">{results.searchMetadata.location}</span>
            </p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Sort dropdown */}
            <div>
              <label htmlFor="sort-select" className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Sort By
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-[#1a1a2e] border border-[#00ff88]/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#00ff88] cursor-pointer"
              >
                {profile && <option value="match">Best Match</option>}
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>

            {/* Minimum rating filter */}
            <div>
              <label htmlFor="rating-filter" className="text-xs text-gray-500 uppercase tracking-wider mb-1 block">
                Min Rating
              </label>
              <select
                id="rating-filter"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="bg-[#1a1a2e] border border-[#08d9d6]/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#08d9d6] cursor-pointer"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>

            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Search Time</div>
              <div className="text-sm text-gray-400">
                {new Date(results.searchMetadata.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative line */}
        <motion.div
          className="h-1 bg-gradient-to-r from-[#00ff88] via-[#08d9d6] to-transparent rounded-full mt-6"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1, delay: 0.3 }}
        />
      </motion.div>

      {/* Match scoring indicator */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 glass rounded-xl border border-[#00ff88]/30"
        >
          <p className="text-sm text-gray-300">
            <span className="text-[#00ff88] font-bold">✨ Personalized Results</span>
            {' '}- Programs ranked by match score for {profile.name}
          </p>
        </motion.div>
      )}

      {/* Results grid */}
      <div className="grid grid-cols-1 gap-8 md:gap-10">
        {sortedPrograms.map((program, index) => (
          <ProgramCard key={program.id} program={program} index={index} profile={profile} />
        ))}
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 md:mt-20 p-8 md:p-10 glass rounded-2xl text-center border border-[#00ff88]/20"
      >
        <p className="text-gray-300 text-sm leading-relaxed mb-4">
          <span className="text-[#00ff88] font-bold">Found what you&apos;re looking for?</span>
          <br />
          Contact the organization directly to register or learn more about their programs.
        </p>
        <p className="text-gray-500 text-xs">
          Ratings powered by{' '}
          <a
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#08d9d6] hover:underline"
          >
            Google Maps
          </a>
        </p>
      </motion.div>
    </motion.div>
  );
}
