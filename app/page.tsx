'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Confetti from 'react-confetti';
import SearchBar from './components/SearchBar';
import LoadingAnimation from './components/LoadingAnimation';
import ResultsDisplay from './components/ResultsDisplay';
import ChildProfileForm from './components/ChildProfileForm';
import { SearchResponse, StreamChunk, ChildProfile, EnhancedProgram, LocationData } from './lib/types';
import { sortProgramsByMatch } from './lib/matchScoring';
import { IoFootball, IoColorPalette, IoMusicalNotes, IoRocket, IoPerson, IoAdd } from 'react-icons/io5';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingMessages, setThinkingMessages] = useState<string[]>([]);
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Profile management
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ChildProfile | null>(null);
  const [isProfileFormOpen, setIsProfileFormOpen] = useState(false);

  // Window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load profiles from localStorage
  useEffect(() => {
    try {
      const savedProfiles = localStorage.getItem('childProfiles');
      if (savedProfiles) {
        const parsed = JSON.parse(savedProfiles);
        setProfiles(parsed);
        if (parsed.length > 0) {
          setSelectedProfile(parsed[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load profiles from localStorage:', error);
      // localStorage might be disabled (private browsing) - continue with empty state
    }
  }, []);

  // Save profile
  const handleSaveProfile = (profile: ChildProfile) => {
    const existingIndex = profiles.findIndex(p => p.id === profile.id);
    let newProfiles;

    if (existingIndex >= 0) {
      // Update existing
      newProfiles = [...profiles];
      newProfiles[existingIndex] = profile;
    } else {
      // Add new
      newProfiles = [...profiles, profile];
    }

    setProfiles(newProfiles);
    setSelectedProfile(profile);

    try {
      localStorage.setItem('childProfiles', JSON.stringify(newProfiles));
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error);
      // Profile still works in memory for this session
    }
  };

  const handleSearch = async (searchParams: {
    query: string;
    location: LocationData;
    startDate?: string;
    showFinancialAidOnly?: boolean;
    freeOnly?: boolean;
    subsidizedOnly?: boolean;
  }) => {
    setIsLoading(true);
    setThinkingMessages([]);
    setResults(null);
    setError(null);
    setShowConfetti(false);

    // Enrich search params with profile data
    const enrichedParams = {
      ...searchParams,
      // Auto-populate age range from profile
      ageRange: selectedProfile ? {
        min: selectedProfile.age,
        max: selectedProfile.age,
      } : undefined,
      // Auto-populate max price from profile
      maxPrice: selectedProfile?.maxPrice,
    };

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(enrichedParams),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Invalid search request. Please check your inputs.');
        } else if (response.status === 429) {
          throw new Error('Too many searches. Please wait a moment and try again.');
        } else if (response.status >= 500) {
          throw new Error('Our servers are experiencing issues. Please try again in a moment.');
        }
        throw new Error('Search failed. Please try again.');
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('text/event-stream')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed. Please try again.');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Unable to start search. Please refresh and try again.');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const chunk: StreamChunk = JSON.parse(data);

              if (chunk.type === 'thinking' && chunk.content) {
                setThinkingMessages((prev) => [...prev, chunk.content!]);
              } else if (chunk.type === 'result' && chunk.data) {
                // Apply match scoring if profile exists
                const enhancedPrograms = selectedProfile
                  ? sortProgramsByMatch(chunk.data.programs as EnhancedProgram[], selectedProfile)
                  : chunk.data.programs;

                const enhancedResults = {
                  ...chunk.data,
                  programs: enhancedPrograms,
                };

                setResults(enhancedResults);
                setIsLoading(false);
                // Show confetti on successful search
                if (chunk.data.programs.length > 0) {
                  setShowConfetti(true);
                  setTimeout(() => setShowConfetti(false), 5000);
                }
              } else if (chunk.type === 'error') {
                setError(chunk.error || 'Search failed. Please try again.');
                setIsLoading(false);
              } else if (chunk.type === 'done') {
                setIsLoading(false);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
              // Don't show parsing errors to users - they're technical
            }
          }
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen animated-bg relative overflow-hidden">
      {/* Success Confetti */}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          colors={['#00ff88', '#08d9d6', '#ff2e63', '#ffffff']}
        />
      )}

      {/* Floating Icons */}
      <FloatingIcon
        icon={<IoFootball />}
        delay={0}
        duration={20}
        initialX="-10%"
        initialY="20%"
        color="#00ff88"
      />
      <FloatingIcon
        icon={<IoColorPalette />}
        delay={2}
        duration={25}
        initialX="80%"
        initialY="60%"
        color="#ff2e63"
      />
      <FloatingIcon
        icon={<IoMusicalNotes />}
        delay={4}
        duration={22}
        initialX="15%"
        initialY="70%"
        color="#08d9d6"
      />
      <FloatingIcon
        icon={<IoRocket />}
        delay={1}
        duration={18}
        initialX="70%"
        initialY="30%"
        color="#00ff88"
      />

      {/* Main Content Container */}
      <div className="relative z-10 w-full px-6 md:px-8 lg:px-12 py-12 md:py-20 lg:py-24 flex flex-col items-center">
        {/* Hero Section */}
        <motion.header
          className="text-center mb-20 md:mb-24 w-full flex flex-col items-center"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-8 md:mb-10"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          >
            <h1 className="text-6xl md:text-8xl font-black mb-6 px-4">
              <span className="gradient-text">Activity</span>
              <span className="text-white">Scout</span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-3xl px-6 md:px-8"
          >
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed mb-6 text-center">
              Find programs <span className="text-[#00ff88] font-bold">kids love</span>.{' '}
              Parents can <span className="text-[#08d9d6] font-bold">afford</span>.{' '}
              Applications made <span className="text-[#ff2e63] font-bold">easy</span>.
            </p>
            <p className="text-base md:text-lg text-gray-400 italic text-center max-w-2xl">
              Making quality programs accessible to all families through smart search and personalized matching
            </p>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-400 flex-wrap mt-6">
              <motion.div
                className="w-2 h-2 rounded-full bg-[#00ff88]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span>Smart Matching</span>
              <motion.div
                className="w-2 h-2 rounded-full bg-[#08d9d6]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <span>Values Analysis</span>
              <motion.div
                className="w-2 h-2 rounded-full bg-[#ff2e63]"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
              <span>Quick Applications</span>
            </div>
          </motion.div>
        </motion.header>

        {/* Profile Benefits Banner - Shows when no profile */}
        {!selectedProfile && (
          <motion.div
            className="w-full max-w-4xl mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass rounded-xl p-5 border-2 border-[#08d9d6]/30 bg-gradient-to-r from-[#08d9d6]/5 to-[#00ff88]/5">
              <div className="flex items-start gap-4">
                <div className="text-3xl">✨</div>
                <div className="flex-1">
                  <h3 className="text-[#08d9d6] font-bold text-lg mb-2">Why Create a Profile?</h3>
                  <ul className="text-gray-300 text-sm space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00ff88] mt-0.5">•</span>
                      <span><strong className="text-white">Smart Match Scores:</strong> See how well each program fits your child&apos;s interests and strengths</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#08d9d6] mt-0.5">•</span>
                      <span><strong className="text-white">Auto-Filtered Results:</strong> Programs automatically match your child&apos;s age and budget</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#ff2e63] mt-0.5">•</span>
                      <span><strong className="text-white">Personalized Reasons:</strong> Understand WHY each program is recommended</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Profile Management */}
        <motion.div
          className="w-full max-w-4xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="glass rounded-2xl p-6 border-2 border-[#00ff88]/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00ff88] to-[#08d9d6] flex items-center justify-center flex-shrink-0">
                  <IoPerson className="text-2xl text-white" />
                </div>
                <div className="flex-1">
                  {selectedProfile ? (
                    <div>
                      <p className="text-sm text-gray-400">Searching for</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedProfile.id}
                          onChange={(e) => {
                            const profile = profiles.find(p => p.id === e.target.value);
                            setSelectedProfile(profile || null);
                          }}
                          className="bg-transparent text-[#00ff88] font-bold text-lg outline-none cursor-pointer hover:text-[#08d9d6] transition-colors"
                        >
                          {profiles.map(profile => (
                            <option key={profile.id} value={profile.id} className="bg-[#1a1a2e] text-white">
                              {profile.name}, {profile.age}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[#ff2e63] font-bold text-lg">Profile Required</p>
                      <p className="text-sm text-gray-400">Create a profile to start searching for programs</p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsProfileFormOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-[#08d9d6] to-[#00ff88] text-black hover:from-[#00ff88] hover:to-[#08d9d6] transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
              >
                <IoAdd className="text-xl" />
                {selectedProfile ? 'Edit Profile' : 'Create Profile'}
              </button>
            </div>

            {selectedProfile && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.interests.slice(0, 5).map((interest, i) => (
                    <span key={i} className="px-3 py-1 bg-[#ff2e63]/20 border border-[#ff2e63]/50 rounded-full text-xs text-[#ff2e63]">
                      {interest}
                    </span>
                  ))}
                  {selectedProfile.interests.length > 5 && (
                    <span className="px-3 py-1 text-xs text-gray-400">
                      +{selectedProfile.interests.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Search Interface */}
        <SearchBar onSearch={handleSearch} isLoading={isLoading} disabled={!selectedProfile} />

        {/* Loading State */}
        {isLoading && <LoadingAnimation messages={thinkingMessages} />}

        {/* Results or Error */}
        {!isLoading && <ResultsDisplay results={results} error={error} profile={selectedProfile} />}

        {/* Footer */}
        <motion.footer
          className="mt-32 md:mt-40 text-center w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div className="inline-block glass rounded-full px-8 md:px-10 py-5 md:py-6 border border-[#00ff88]/20">
            <p className="text-gray-400 text-sm">
              Search results generated in real-time from web sources
            </p>
          </div>
        </motion.footer>
      </div>

      {/* Profile Form Modal */}
      <ChildProfileForm
        isOpen={isProfileFormOpen}
        onClose={() => setIsProfileFormOpen(false)}
        onSave={handleSaveProfile}
        existingProfile={selectedProfile || undefined}
      />
    </main>
  );
}

// Floating Icon Component
function FloatingIcon({
  icon,
  delay,
  duration,
  initialX,
  initialY,
  color,
}: {
  icon: React.ReactNode;
  delay: number;
  duration: number;
  initialX: string;
  initialY: string;
  color: string;
}) {
  return (
    <motion.div
      className="absolute text-6xl opacity-10"
      style={{
        left: initialX,
        top: initialY,
        color,
      }}
      animate={{
        y: [0, -30, 0],
        rotate: [0, 10, -10, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: 'easeInOut',
      }}
    >
      {icon}
    </motion.div>
  );
}
