'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  messages: string[];
}

export default function LoadingAnimation({ messages }: LoadingAnimationProps) {
  const [searchCount, setSearchCount] = useState(0);

  useEffect(() => {
    // Count web searches from messages
    const count = messages.filter(m => m.toLowerCase().includes('search')).length;
    setSearchCount(count);
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 md:mt-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-8 md:p-10 lg:p-12 relative overflow-hidden"
        role="status"
        aria-live="polite"
        aria-label="Searching for programs"
      >
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00ff88]/10 via-[#08d9d6]/10 to-[#ff2e63]/10 animate-pulse"></div>

        <div className="relative z-10">
          {/* Header with Search Counter */}
          <div className="flex items-center justify-between mb-8">
            <motion.h3
              className="text-2xl font-bold gradient-text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Searching the Web...
            </motion.h3>

            {searchCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="bg-[#00ff88] text-[#0f0f23] px-4 py-2 rounded-full font-bold text-sm"
              >
                {searchCount} {searchCount === 1 ? 'Search' : 'Searches'}
              </motion.div>
            )}
          </div>

          {/* Radar Animation */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-48 h-48">
              {/* Outer rings */}
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 border-2 border-[#00ff88]/30 rounded-full"
                  style={{
                    transform: `scale(${i * 0.33})`,
                  }}
                  animate={{
                    scale: [i * 0.33, i * 0.33 + 0.5],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.4,
                  }}
                />
              ))}

              {/* Center pulse */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-[#00ff88] to-[#08d9d6] rounded-full glow-primary"
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-[#0f0f23]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </motion.div>
              </div>

              {/* Radar sweep line */}
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <div className="w-full h-full relative">
                  <div
                    className="absolute top-1/2 left-1/2 w-1/2 h-0.5 origin-left"
                    style={{
                      background: 'linear-gradient(90deg, #00ff88 0%, transparent 100%)',
                      filter: 'blur(1px)',
                    }}
                  />
                </div>
              </motion.div>

              {/* Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-[#08d9d6] rounded-full"
                  style={{
                    left: `${50 + 40 * Math.cos((i * Math.PI * 2) / 8)}%`,
                    top: `${50 + 40 * Math.sin((i * Math.PI * 2) / 8)}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.25,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 text-sm"
              >
                <motion.div
                  className="w-2 h-2 rounded-full bg-[#00ff88]"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
                <span className="text-gray-300">{message}</span>
              </motion.div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00ff88] via-[#08d9d6] to-[#ff2e63]"
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                style={{ width: '50%' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
