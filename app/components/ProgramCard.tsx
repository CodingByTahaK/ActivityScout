'use client';

import { motion } from 'framer-motion';
import { EnhancedProgram, ChildProfile } from '@/app/lib/types';
import {
  IoPersonOutline,
  IoCashOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoMailOutline,
  IoCallOutline,
  IoGlobeOutline,
  IoTrophyOutline,
  IoSparklesOutline,
  IoCheckmarkCircle,
  IoStar,
} from 'react-icons/io5';

interface ProgramCardProps {
  program: EnhancedProgram;
  index?: number;
  profile?: ChildProfile | null;
}

export default function ProgramCard({ program, index = 0, profile }: ProgramCardProps) {
  // Calculate match score badge color
  const getMatchColor = (score?: number) => {
    if (!score) return '#6b7280';
    if (score >= 80) return '#00ff88'; // Excellent - green
    if (score >= 60) return '#08d9d6'; // Good - cyan
    if (score >= 40) return '#ffa500'; // Fair - orange
    return '#ff2e63'; // Weak - red
  };

  const getMatchLabel = (score?: number) => {
    if (!score) return '';
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Weak Match';
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group"
    >
      <div className="relative h-full">
        {/* Card Content */}
        <motion.div
          className="relative glass rounded-2xl overflow-hidden hover-lift h-full"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Header with match score and category badge */}
          <div className="relative bg-gradient-to-r from-[#1a1a2e] to-[#2a2a3e] px-6 py-5 border-b border-[#00ff88]/20">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-white mb-1 gradient-text truncate">
                  {program.name}
                </h3>
                <p className="text-[#08d9d6] text-sm font-medium">{program.organization}</p>
              </div>

              <div className="flex-shrink-0 flex gap-2">
                {/* Match Score Badge */}
                {profile && program.matchScore !== undefined && (
                  <motion.div
                    className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${getMatchColor(program.matchScore)}20, ${getMatchColor(program.matchScore)}40)`,
                      border: `2px solid ${getMatchColor(program.matchScore)}`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    whileHover={{ scale: 1.05 }}
                  >
                    <IoTrophyOutline
                      className="text-lg"
                      style={{ color: getMatchColor(program.matchScore) }}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col items-end">
                      <span
                        className="text-2xl font-black leading-none"
                        style={{ color: getMatchColor(program.matchScore) }}
                      >
                        {program.matchScore}
                      </span>
                      <span className="text-xs text-gray-300 uppercase tracking-wide leading-none mt-0.5">
                        {getMatchLabel(program.matchScore)}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Category Badge */}
                {program.category && (
                  <motion.span
                    className="flex-shrink-0 bg-gradient-to-r from-[#ff2e63] to-[#ff6b9d] px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-lg"
                    whileHover={{ scale: 1.1 }}
                  >
                    {program.category}
                  </motion.span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            {/* Match Reasons - Show first if profile exists */}
            {profile && program.matchReasons && program.matchReasons.length > 0 && (
              <motion.div
                className="p-4 rounded-xl border-2 border-[#00ff88]/30 bg-gradient-to-r from-[#00ff88]/5 to-[#08d9d6]/5"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <IoSparklesOutline className="text-[#00ff88] text-xl" />
                  <span className="font-bold text-[#00ff88] text-sm uppercase tracking-wide">
                    Why This Matches {profile.name}
                  </span>
                </div>
                <ul className="space-y-2">
                  {program.matchReasons.map((reason, i) => (
                    <motion.li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-300"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <IoCheckmarkCircle className="text-[#00ff88] mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            )}

            {/* Description */}
            {program.description && (
              <motion.p
                className="text-gray-300 text-sm leading-relaxed pb-4 border-b border-[#00ff88]/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {program.description}
              </motion.p>
            )}

            <div className="space-y-4">
              {/* Age Range */}
              <InfoRow
                icon={<IoPersonOutline className="text-[#00ff88]" />}
                label="Ages"
                value={
                  program.ageRange.min === program.ageRange.max
                    ? `${program.ageRange.min} years old`
                    : `${program.ageRange.min}-${program.ageRange.max} years old`
                }
              />

              {/* Cost */}
              {program.cost && (
                <div className="space-y-3">
                  <InfoRow
                    icon={<IoCashOutline className="text-[#08d9d6]" />}
                    label="Cost"
                    value={(() => {
                      const amount =
                        typeof program.cost.amount === 'number'
                          ? program.cost.amount
                          : Number(program.cost.amount);

                      if (isNaN(amount)) {
                        return `Contact for pricing • ${program.cost.frequency}`;
                      }

                      const currency =
                        program.cost.currency === 'USD' ? '$' :
                        program.cost.currency === 'CAD' ? '$' :
                        program.cost.currency;

                      return `${currency}${amount.toFixed(2)} ${program.cost.frequency}`;
                    })()}
                    note={program.cost.note}
                  />

                  {/* Affordability Badges - Track 2 Feature */}
                  <div className="flex flex-wrap gap-2 ml-9">
                    {/* FREE Badge */}
                    {(() => {
                      const amount =
                        typeof program.cost.amount === 'number'
                          ? program.cost.amount
                          : Number(program.cost.amount);
                      return !isNaN(amount) && amount === 0;
                    })() && (
                      <motion.div
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-full shadow-lg border-2 border-[#00ff88]"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-2xl">🆓</span>
                        <span className="font-black text-[#0f0f23] text-sm uppercase tracking-wide">
                          FREE
                        </span>
                      </motion.div>
                    )}

                    {/* Financial Aid Available Badge */}
                    {program.hasFinancialAid && (
                      <motion.div
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffd700] to-[#ffed4e] rounded-full shadow-lg border-2 border-[#ffd700]"
                        initial={{ scale: 0, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-xl">💰</span>
                        <span className="font-bold text-[#0f0f23] text-xs uppercase tracking-wide">
                          Financial Aid Available
                        </span>
                      </motion.div>
                    )}

                    {/* Sliding Scale Badge */}
                    {program.cost.note &&
                      (program.cost.note.toLowerCase().includes('sliding scale') ||
                       program.cost.note.toLowerCase().includes('income-based') ||
                       program.cost.note.toLowerCase().includes('subsidy') ||
                       program.cost.note.toLowerCase().includes('subsidized')) && (
                      <motion.div
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#08d9d6] to-[#3fedec] rounded-full shadow-lg border-2 border-[#08d9d6]"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-xl">📋</span>
                        <span className="font-bold text-[#0f0f23] text-xs uppercase tracking-wide">
                          Sliding Scale
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Schedule */}
              {program.schedule && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5">
                    <IoCalendarOutline className="text-[#ff2e63] text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-white block mb-2">Schedule</span>
                    <div className="text-gray-300 space-y-1.5">
                      {program.schedule.days && (
                        <div className="flex flex-wrap gap-2">
                          {program.schedule.days.map((day, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-full text-xs font-medium text-[#00ff88]"
                            >
                              {day}
                            </span>
                          ))}
                        </div>
                      )}
                      {program.schedule.times && <div>{program.schedule.times}</div>}
                      {program.schedule.duration && (
                        <div className="text-xs text-gray-400">Duration: {program.schedule.duration}</div>
                      )}
                      {program.schedule.startDate && (
                        <div className="text-xs text-[#08d9d6]">
                          Starts: {new Date(program.schedule.startDate).toLocaleDateString()}
                          {program.schedule.endDate &&
                            ` - Ends: ${new Date(program.schedule.endDate).toLocaleDateString()}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              {program.location && (
                <div className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5">
                    <IoLocationOutline className="text-[#ff2e63] text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white">Location</span>
                      {program.distance !== undefined && (
                        <motion.div
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#08d9d6]/10 border border-[#08d9d6]/30 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.3 }}
                        >
                          <svg className="w-4 h-4 text-[#08d9d6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-[#08d9d6] font-bold text-xs">
                            {program.distance.toFixed(1)} km
                          </span>
                        </motion.div>
                      )}
                    </div>
                    <div className="text-gray-300 space-y-0.5">
                      {program.location.address && <div>{program.location.address}</div>}
                      {program.location.city && (
                        <div>
                          {program.location.city}
                          {program.location.neighborhood && ` (${program.location.neighborhood})`}
                        </div>
                      )}
                    </div>

                    {/* Google Rating */}
                    {program.googlePlaces && program.googlePlaces.rating > 0 ? (
                      <a
                        href={program.googlePlaces.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                        aria-label={`Rated ${program.googlePlaces.rating.toFixed(1)} out of 5 stars based on ${program.googlePlaces.userRatingsTotal.toLocaleString()} reviews on Google Maps`}
                      >
                        <div className="flex items-center" aria-hidden="true">
                          {[...Array(5)].map((_, i) => (
                            <IoStar
                              key={i}
                              className={
                                i < Math.round(program.googlePlaces!.rating)
                                  ? 'text-yellow-400'
                                  : 'text-gray-600'
                              }
                              size={14}
                            />
                          ))}
                        </div>
                        <span className="text-yellow-400 font-bold text-xs">
                          {program.googlePlaces.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          ({program.googlePlaces.userRatingsTotal.toLocaleString()} reviews)
                        </span>
                      </a>
                    ) : (
                      <div className="mt-2 text-gray-500 text-xs italic">
                        No rating available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {program.contact && (
              <div className="pt-5 border-t border-[#00ff88]/20 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <IoMailOutline className="text-[#08d9d6] text-lg" />
                  <span className="font-bold text-white text-sm uppercase tracking-wide">Contact</span>
                </div>

                <div className="grid gap-2">
                  {/* Apply Now Button - Track 3 Feature */}
                  {program.applicationUrl && (
                    <motion.a
                      href={program.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Apply to ${program.name} program`}
                      className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#ff2e63] to-[#ff6b9d] rounded-xl font-bold text-white hover:shadow-2xl hover:shadow-[#ff2e63]/50 transition-all group/link border-2 border-[#ff2e63]"
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <span className="flex items-center gap-3">
                        <IoSparklesOutline className="text-2xl" />
                        <span className="text-lg">Apply Now</span>
                      </span>
                      <svg className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </motion.a>
                  )}

                  {program.contact.phone && (
                    <motion.a
                      href={`tel:${program.contact.phone}`}
                      aria-label={`Call ${program.organization}`}
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a2e] rounded-lg border border-[#00ff88]/20 hover:border-[#00ff88] transition-all group/link"
                      whileHover={{ x: 5 }}
                    >
                      <IoCallOutline className="text-[#00ff88] text-lg" />
                      <span className="text-gray-300 group-hover/link:text-[#00ff88] transition-colors">
                        {program.contact.phone}
                      </span>
                    </motion.a>
                  )}

                  {program.contact.email && (
                    <motion.a
                      href={`mailto:${program.contact.email}`}
                      aria-label={`Email ${program.organization}`}
                      className="flex items-center gap-3 px-4 py-2.5 bg-[#1a1a2e] rounded-lg border border-[#08d9d6]/20 hover:border-[#08d9d6] transition-all group/link"
                      whileHover={{ x: 5 }}
                    >
                      <IoMailOutline className="text-[#08d9d6] text-lg" />
                      <span className="text-gray-300 group-hover/link:text-[#08d9d6] transition-colors text-sm truncate">
                        {program.contact.email}
                      </span>
                    </motion.a>
                  )}

                  {program.contact.website && (
                    <motion.a
                      href={program.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Visit ${program.organization} website`}
                      className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#00ff88] to-[#08d9d6] rounded-lg font-bold text-[#0f0f23] hover:shadow-lg hover:shadow-[#00ff88]/50 transition-all group/link"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center gap-3">
                        <IoGlobeOutline className="text-xl" />
                        <span>Visit Website</span>
                      </span>
                      <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </motion.a>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Helper component for info rows
function InfoRow({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="text-xl" aria-hidden="true">{icon}</div>
      <div className="flex-1">
        <span className="font-bold text-white">{label}:</span>
        <span className="text-gray-300 ml-2">{value}</span>
        {note && <span className="block text-xs text-[#00ff88] italic mt-1">({note})</span>}
      </div>
    </div>
  );
}
