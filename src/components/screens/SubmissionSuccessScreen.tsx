'use client';

import { CheckCircle2, FileText, Trophy, Calendar, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SubmissionSuccessScreenProps {
  user: User;
  currentWeek: number;
}

interface SubmissionStatus {
  week: number;
  submitted: boolean;
}

export default function SubmissionSuccessScreen({ user, currentWeek }: SubmissionSuccessScreenProps) {
  const router = useRouter();
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti] = useState(true);
  
  useEffect(() => {
    async function fetchSubmissionStatus() {
      try {
        const response = await fetch('/api/submissions/status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            currentWeek,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch submission status');
        }

        const data = await response.json();
        setSubmissionStatus(data);
      } catch (error) {
        console.error('Error fetching submission status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubmissionStatus();
  }, [user.id, currentWeek]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-8 w-8 border-b-2 border-blue-600"
        />
      </div>
    );
  }

  // Calculate stats based on submission status
  const totalWeeks = submissionStatus.length;
  const submittedWeeks = submissionStatus.filter(s => s.submitted).length;
  const completionRate = Math.round((submittedWeeks / totalWeeks) * 100);
  const consecutiveWeeks = calculateConsecutiveWeeks(submissionStatus);

  const DOTS_PER_ROW = 8;
  const weekChunks = chunkArray(submissionStatus, DOTS_PER_ROW);

  return (
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md h-full flex flex-col relative overflow-hidden p-8">
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 400 - 200,
                  y: -20,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  y: 400,
                  rotate: 360,
                  opacity: 0
                }}
                transition={{ 
                  duration: 2 + Math.random(),
                  delay: Math.random() * 0.5
                }}
                className="absolute text-2xl"
              >
                ✨
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.2
          }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-4 text-gray-800"
        >
          <motion.span
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.4
            }}
            className="inline-block"
          >
            You&apos;re on fire! 🔥
          </motion.span>
        </motion.h2>
        
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-600 mb-6"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-block mr-1"
          >
            Week {currentWeek} conquered! 
          </motion.span>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="inline-block"
          >
            Keep the momentum going! 💪
          </motion.span>
        </motion.p>
        
        {/* Progress Section */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-end items-center mb-2">
            <motion.span 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm font-semibold text-blue-600"
            >
              {submittedWeeks}/{totalWeeks} weeks
            </motion.span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${completionRate}%` }}
              transition={{ duration: 1, delay: 0.6 }}
              className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600"
            />
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="relative mb-8"
        >
          <div className="flex flex-col gap-2 relative">
            {weekChunks.map((chunk, rowIdx) => (
              <div className="mb-2" key={rowIdx}>
                {/* Dots and line */}
                <div className="relative h-6">
                  <div className="absolute left-0 right-0 h-0.5 bg-gray-200 z-0" style={{ top: '50%' }}></div>
                  <div
                    className={`grid relative z-10`}
                    style={{
                      gridTemplateColumns: `repeat(${DOTS_PER_ROW}, minmax(0, 1fr))`,
                    }}
                  >
                    {chunk.map(({ week, submitted }, index) => (
                      <div className="flex items-center justify-center w-6 mx-auto" key={week}>
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + (rowIdx * DOTS_PER_ROW + index) * 0.1 }}
                          className="flex items-center justify-center w-6"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.2, rotate: 360 }}
                            transition={{ duration: 0.3 }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              submitted ? 'bg-gradient-to-br from-green-400 to-green-500' : 
                              week === currentWeek ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-4 ring-blue-200' : 
                              'bg-gray-300'
                            }`}
                          >
                            {submitted && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 1 + (rowIdx * DOTS_PER_ROW + index) * 0.1 }}
                              >
                                <Sparkles className="w-3 h-3 text-white" />
                              </motion.div>
                            )}
                          </motion.div>
                        </motion.div>
                      </div>
                    ))}
                    {/* Fill empty cells for last row to keep spacing */}
                    {rowIdx === weekChunks.length - 1 &&
                      Array.from({ length: DOTS_PER_ROW - chunk.length }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                  </div>
                </div>
                {/* Week numbers */}
                <div
                  className="grid mt-1"
                  style={{
                    gridTemplateColumns: `repeat(${DOTS_PER_ROW}, minmax(0, 1fr))`,
                  }}
                >
                  {chunk.map(({ week }) => (
                    <span key={week} className="text-xs text-gray-600 w-6 text-center mx-auto">{week}</span>
                  ))}
                  {/* Fill empty cells for last row to keep spacing */}
                  {rowIdx === weekChunks.length - 1 &&
                    Array.from({ length: DOTS_PER_ROW - chunk.length }).map((_, i) => (
                      <span key={`empty-label-${i}`} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-8"
        >
          <div className="flex items-center justify-center gap-8 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg shadow-sm">
            <div className="flex flex-col items-center min-w-[100px]">
              <div className="flex items-center mb-1">
                <Trophy className="w-5 h-5 text-blue-600 mr-1" />
                <span className="text-xl font-bold text-gray-800">{completionRate}%</span>
              </div>
              <div className="text-xs text-gray-600">Completion</div>
            </div>
            <div className="h-8 w-px bg-blue-200 mx-2" />
            <div className="flex flex-col items-center min-w-[100px]">
              <div className="flex items-center mb-1">
                <Calendar className="w-5 h-5 text-blue-600 mr-1" />
                <span className="text-xl font-bold text-gray-800">{consecutiveWeeks}</span>
              </div>
              <div className="text-xs text-gray-600">Consecutive Weeks</div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Call-to-Action Button */}
        <div className="relative mt-6">
          {/* Animated badge */}
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow animate-bounce z-10">
            💬 See Comments!
          </span>
          <motion.button
            whileHover={{ scale: 1.05, rotate: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/history')}
            className="w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex flex-col items-center justify-center gap-2 group shadow-2xl border-2 border-blue-200"
            style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.01em' }}
          >
            <motion.div
              animate={{ rotate: 360, scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <FileText className="w-7 h-7 group-hover:scale-125 transition-transform" />
            </motion.div>
            View Your Pulses
            <span className="text-xs text-blue-100 font-normal mt-1">
              See your submissions &amp; add comments
            </span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function calculateConsecutiveWeeks(submissionStatus: SubmissionStatus[]): number {
  let maxStreak = 0;
  let currentStreak = 0;

  // Sort by week number to ensure correct order
  const sortedStatus = [...submissionStatus].sort((a, b) => a.week - b.week);

  for (const status of sortedStatus) {
    if (status.submitted) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

// Helper to chunk array
function chunkArray<T>(arr: T[], size: number): T[][] {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
} 