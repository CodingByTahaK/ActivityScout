'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoClose, IoPerson, IoHeart, IoStar, IoSchool, IoCash } from 'react-icons/io5';
import { ChildProfile } from '../lib/types';

interface ChildProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: ChildProfile) => void;
  existingProfile?: ChildProfile;
}

const INTEREST_OPTIONS = [
  'Sports', 'Arts & Crafts', 'Music', 'STEM', 'Dance', 'Drama',
  'Swimming', 'Martial Arts', 'Coding', 'Reading', 'Science', 'Robotics'
];

const STRENGTH_OPTIONS = [
  'Teamwork', 'Creativity', 'Leadership', 'Problem Solving',
  'Communication', 'Perseverance', 'Empathy', 'Critical Thinking'
];

const NEED_OPTIONS = [
  'Special Needs Support', 'Beginner Friendly', 'Scholarship/Financial Aid',
  'Flexible Schedule', 'Transportation Assistance', 'Small Group Size'
];

export default function ChildProfileForm({ isOpen, onClose, onSave, existingProfile }: ChildProfileFormProps) {
  const [profile, setProfile] = useState<Partial<ChildProfile>>(existingProfile || {
    name: '',
    age: 8,
    interests: [],
    strengths: [],
    needs: [],
    goals: '',
  });
  const [error, setError] = useState<string>('');

  // Add Escape key handler for accessibility
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile.name) {
      setError('Please fill in required field (name)');
      return;
    }
    setError('');

    const fullProfile: ChildProfile = {
      id: existingProfile?.id || `profile_${Date.now()}`,
      name: profile.name,
      age: profile.age || 8,
      interests: profile.interests || [],
      strengths: profile.strengths || [],
      needs: profile.needs || [],
      goals: profile.goals || '',
      maxPrice: profile.maxPrice,
    };

    onSave(fullProfile);
    onClose();
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center py-8">
          <motion.div
            className="glass rounded-2xl p-6 md:p-8 max-w-3xl w-full border-2 border-[#00ff88]/30 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#00ff88] to-[#08d9d6] flex items-center justify-center">
                <IoPerson className="text-2xl text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold gradient-text">Create Child Profile</h2>
                <p className="text-gray-400 text-sm">Help us find the perfect programs for your child</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <IoClose className="text-3xl" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div role="alert" className="p-4 bg-red-500/20 border-2 border-red-500 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Child's Name *
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border-2 border-[#00ff88]/30 rounded-lg text-white focus:border-[#00ff88] outline-none transition-all"
                  placeholder="Enter child's name"
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age *
                </label>
                <input
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-[#1a1a2e] border-2 border-[#00ff88]/30 rounded-lg text-white focus:border-[#00ff88] outline-none transition-all"
                  min="3"
                  max="18"
                  required
                />
              </div>
            </div>

            {/* Max Price */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <IoCash className="text-[#ff2e63]" />
                Maximum Price (Optional)
              </label>
              <input
                type="number"
                value={profile.maxPrice || ''}
                onChange={(e) => setProfile({ ...profile, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-4 py-3 bg-[#1a1a2e] border-2 border-[#00ff88]/30 rounded-lg text-white focus:border-[#00ff88] outline-none transition-all"
                placeholder="Budget per month (e.g., 200)"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <IoHeart className="text-[#ff2e63]" />
                Interests (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => setProfile({
                      ...profile,
                      interests: toggleArrayItem(profile.interests || [], interest)
                    })}
                    aria-pressed={(profile.interests || []).includes(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (profile.interests || []).includes(interest)
                        ? 'bg-[#ff2e63] text-white border-2 border-[#ff2e63]'
                        : 'bg-[#1a1a2e] text-gray-300 border-2 border-gray-600 hover:border-[#ff2e63]'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <IoStar className="text-[#00ff88]" />
                Strengths (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {STRENGTH_OPTIONS.map((strength) => (
                  <button
                    key={strength}
                    type="button"
                    onClick={() => setProfile({
                      ...profile,
                      strengths: toggleArrayItem(profile.strengths || [], strength)
                    })}
                    aria-pressed={(profile.strengths || []).includes(strength)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (profile.strengths || []).includes(strength)
                        ? 'bg-[#00ff88] text-black border-2 border-[#00ff88]'
                        : 'bg-[#1a1a2e] text-gray-300 border-2 border-gray-600 hover:border-[#00ff88]'
                    }`}
                  >
                    {strength}
                  </button>
                ))}
              </div>
            </div>

            {/* Needs */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <IoSchool className="text-[#08d9d6]" />
                Special Needs or Requirements
              </label>
              <div className="flex flex-wrap gap-2">
                {NEED_OPTIONS.map((need) => (
                  <button
                    key={need}
                    type="button"
                    onClick={() => setProfile({
                      ...profile,
                      needs: toggleArrayItem(profile.needs || [], need)
                    })}
                    aria-pressed={(profile.needs || []).includes(need)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      (profile.needs || []).includes(need)
                        ? 'bg-[#08d9d6] text-black border-2 border-[#08d9d6]'
                        : 'bg-[#1a1a2e] text-gray-300 border-2 border-gray-600 hover:border-[#08d9d6]'
                    }`}
                  >
                    {need}
                  </button>
                ))}
              </div>
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Goals for This Child
              </label>
              <textarea
                value={profile.goals}
                onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                className="w-full px-4 py-3 bg-[#1a1a2e] border-2 border-[#00ff88]/30 rounded-lg text-white focus:border-[#00ff88] outline-none transition-all resize-none"
                placeholder="e.g., Build confidence, make friends, develop new skills..."
                rows={3}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-4 rounded-xl font-bold text-black bg-gradient-to-r from-[#00ff88] to-[#08d9d6] hover:from-[#08d9d6] hover:to-[#00ff88] transition-all duration-300 transform hover:scale-105 glow-primary"
              >
                Save Profile
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-4 rounded-xl font-bold text-gray-300 border-2 border-gray-600 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
