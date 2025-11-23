'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSearch, IoFilter, IoChevronForward } from 'react-icons/io5';
import LocationAutocomplete, { LocationData } from './LocationAutocomplete';

interface SearchBarProps {
  onSearch: (params: {
    query: string;
    location: LocationData;
    startDate?: string;
    showFinancialAidOnly?: boolean;
    freeOnly?: boolean;
    subsidizedOnly?: boolean;
  }) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, isLoading, disabled = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [radius, setRadius] = useState<number>(10); // Default 10km
  const [startDate, setStartDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Equity/Affordability Filters (Track 2)
  const [showFinancialAidOnly, setShowFinancialAidOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
  const [subsidizedOnly, setSubsidizedOnly] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim() || !location) {
      setError('Please enter both a search query and location');
      return;
    }

    setError('');

    const locationWithRadius: LocationData = radius > 0
      ? ({
          ...location,
          radius,
        } as LocationData)
      : location;

    const searchParams: {
      query: string;
      location: LocationData;
      startDate?: string;
      showFinancialAidOnly?: boolean;
      freeOnly?: boolean;
      subsidizedOnly?: boolean;
    } = {
      query: query.trim(),
      location: locationWithRadius,
    };

    if (startDate) {
      searchParams.startDate = startDate;
    }

    // Add equity filters
    if (showFinancialAidOnly) {
      searchParams.showFinancialAidOnly = true;
    }
    if (freeOnly) {
      searchParams.freeOnly = true;
    }
    if (subsidizedOnly) {
      searchParams.subsidizedOnly = true;
    }

    onSearch(searchParams);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Main Search Container */}
        <div className="glass rounded-2xl p-6 md:p-8 space-y-6 relative overflow-hidden gradient-border-animated">
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/5 via-transparent to-[#08d9d6]/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />

          <div className="relative z-10 space-y-6">
            {/* Query Input */}
            <div>
              <label htmlFor="query" className="block text-sm font-bold text-[#00ff88] mb-3 uppercase tracking-wide">
                What are you looking for?
              </label>
              <motion.div
                className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                  focused === 'query' ? 'glow-primary' : ''
                }`}
              >
                <input
                  id="query"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setFocused('query')}
                  onBlur={() => setFocused(null)}
                  placeholder="e.g., soccer classes"
                  aria-label="Search query for programs and activities"
                  className="w-full px-6 py-4 bg-[#1a1a2e] text-white border-2 border-[#00ff88]/30 rounded-xl focus:border-[#00ff88] outline-none transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || disabled}
                />
                <motion.div
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  animate={{ rotate: focused === 'query' ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <IoSearch className="text-[#00ff88] text-xl" />
                </motion.div>
              </motion.div>
            </div>

            {/* Location Input with Autocomplete */}
            <div>
              <label htmlFor="location" className="block text-sm font-bold text-[#08d9d6] mb-3 uppercase tracking-wide">
                Location
              </label>
              <LocationAutocomplete
                value={location}
                onChange={setLocation}
                placeholder="e.g., Toronto, Ontario"
                disabled={isLoading || disabled}
                required
              />
            </div>

            {/* Radius Selector */}
            <div>
              <label className="block text-sm font-bold text-[#ff2e63] mb-3 uppercase tracking-wide">
                Search Radius
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { value: 5, label: '5 km' },
                  { value: 10, label: '10 km' },
                  { value: 25, label: '25 km' },
                  { value: 50, label: '50 km' },
                  { value: 0, label: 'Any distance' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRadius(option.value)}
                    disabled={isLoading || disabled}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all border-2 ${
                      radius === option.value
                        ? 'bg-[#ff2e63] border-[#ff2e63] text-white shadow-lg shadow-[#ff2e63]/50'
                        : 'bg-[#1a1a2e] border-[#ff2e63]/30 text-gray-300 hover:border-[#ff2e63] hover:text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Start Date Input */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-bold text-[#ff2e63] mb-3 uppercase tracking-wide">
                Start Date (optional)
              </label>
              <motion.div
                className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                  focused === 'startDate' ? 'glow-secondary' : ''
                }`}
              >
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onFocus={() => setFocused('startDate')}
                  onBlur={() => setFocused(null)}
                  aria-label="Earliest start date for programs"
                  className="w-full px-6 py-4 bg-[#1a1a2e] text-white border-2 border-[#ff2e63]/30 rounded-xl focus:border-[#ff2e63] outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || disabled}
                />
              </motion.div>
            </div>

            {/* Filters Toggle */}
            <motion.button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-[#ff2e63] hover:text-[#ff6b9d] font-bold text-sm uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || disabled}
              aria-expanded={showFilters}
              aria-label="Toggle advanced filters"
              whileHover={{ scale: (isLoading || disabled) ? 1 : 1.05 }}
              whileTap={{ scale: (isLoading || disabled) ? 1 : 0.95 }}
            >
              <IoFilter className="text-lg" />
              <span>{showFilters ? 'Hide' : 'Show'} Advanced Filters</span>
              <motion.div
                animate={{ rotate: showFilters ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <IoChevronForward />
              </motion.div>
            </motion.button>

            {/* Optional Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 pt-4 border-t border-[#00ff88]/20"
                >
                  {/* Affordability & Equity Filters */}
                  <div className="pt-4 border-t border-[#ff2e63]/30">
                    <label className="block text-sm font-bold text-[#ff2e63] mb-4 uppercase tracking-wide flex items-center gap-2">
                      <span className="text-lg" role="img" aria-label="Money">💰</span>
                      <span>Affordability</span>
                    </label>
                    <div className="space-y-3">
                      {/* Free Programs Only */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] border-2 border-transparent hover:border-[#00ff88]/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={freeOnly}
                          onChange={(e) => setFreeOnly(e.target.checked)}
                          disabled={isLoading}
                          className="w-5 h-5 rounded border-2 border-gray-600 bg-[#0f0f23] checked:bg-[#00ff88] checked:border-[#00ff88] focus:ring-2 focus:ring-[#00ff88] transition-all cursor-pointer"
                        />
                        <span className="flex-1 text-sm text-gray-300">
                          <span className="font-bold text-white">Free Programs Only</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Show only programs with no cost</span>
                        </span>
                      </label>

                      {/* Financial Aid Available */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] border-2 border-transparent hover:border-[#08d9d6]/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={showFinancialAidOnly}
                          onChange={(e) => setShowFinancialAidOnly(e.target.checked)}
                          disabled={isLoading}
                          className="w-5 h-5 rounded border-2 border-gray-600 bg-[#0f0f23] checked:bg-[#08d9d6] checked:border-[#08d9d6] focus:ring-2 focus:ring-[#08d9d6] transition-all cursor-pointer"
                        />
                        <span className="flex-1 text-sm text-gray-300">
                          <span className="font-bold text-white">Financial Aid/Scholarships Only</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Programs offering financial assistance</span>
                        </span>
                      </label>

                      {/* Subsidized Programs */}
                      <label className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a2e] border-2 border-transparent hover:border-[#ff2e63]/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={subsidizedOnly}
                          onChange={(e) => setSubsidizedOnly(e.target.checked)}
                          disabled={isLoading}
                          className="w-5 h-5 rounded border-2 border-gray-600 bg-[#0f0f23] checked:bg-[#ff2e63] checked:border-[#ff2e63] focus:ring-2 focus:ring-[#ff2e63] transition-all cursor-pointer"
                        />
                        <span className="flex-1 text-sm text-gray-300">
                          <span className="font-bold text-white">Subsidized Programs</span>
                          <span className="block text-xs text-gray-500 mt-0.5">Income-based or sliding scale pricing</span>
                        </span>
                      </label>
                    </div>

                    {/* Active Filters Count */}
                    {(freeOnly || showFinancialAidOnly || subsidizedOnly) && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 p-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-xs text-[#00ff88] text-center font-bold"
                      >
                        ✓ Affordability filters active - focusing on accessible programs
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[#ff2e63]/10 border border-[#ff2e63]/30 rounded-xl text-[#ff2e63] text-sm flex items-center gap-2"
                role="alert"
              >
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Search Button */}
            <motion.button
              type="submit"
              disabled={isLoading || disabled}
              className="w-full relative overflow-hidden rounded-xl font-bold text-lg uppercase tracking-wider py-4 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: (isLoading || disabled) ? 1 : 1.02 }}
              whileTap={{ scale: (isLoading || disabled) ? 1 : 0.98 }}
            >
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88] via-[#08d9d6] to-[#00ff88] bg-[length:200%_100%] animate-pulse" />

              {/* Button content */}
              <div className="relative z-10 flex items-center justify-center gap-3 text-[#0f0f23]">
                {isLoading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <IoSearch className="text-2xl" />
                    </motion.div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <IoSearch className="text-2xl" />
                    <span>Find Programs</span>
                  </>
                )}
              </div>

              {/* Glow effect */}
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88] to-[#08d9d6] blur-xl opacity-50" />
              )}
            </motion.button>
          </div>
        </div>
      </motion.form>
    </div>
  );
}
