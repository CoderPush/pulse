'use client';

import { CheckCircle2, FileText, Trophy, Calendar, Sparkles } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubmissionSuccessScreenProps {
  user: User;
  currentWeek: number;
}

interface SubmissionStatus {
  week: number;
  submitted: boolean;
}

export default function SubmissionSuccessScreen({ user, currentWeek }: SubmissionSuccessScreenProps) {
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
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-12 h-12 text-green-600" />
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
            You're on fire! 🔥
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
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Your completion rate</span>
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
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200"></div>
          <div className="flex justify-between relative">
            {submissionStatus.map(({ week, submitted }, index) => (
              <motion.div 
                key={week}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div 
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  transition={{ duration: 0.3 }}
                  className={`w-6 h-6 rounded-full mb-2 flex items-center justify-center ${
                    submitted ? 'bg-gradient-to-br from-green-400 to-green-500' : 
                    week === currentWeek ? 'bg-gradient-to-br from-blue-500 to-blue-600 ring-4 ring-blue-200' : 
                    'bg-gray-300'
                  }`}
                >
                  {submitted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.1 }}
                    >
                      <Sparkles className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </motion.div>
                <span className="text-xs text-gray-600">Week {week}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 2 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center shadow-sm"
          >
            <motion.div 
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ 
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1
              }}
              className="flex justify-center mb-2"
            >
              <Trophy className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div className="text-2xl font-bold text-gray-800">{completionRate}%</div>
            <div className="text-xs text-gray-600">Completion Rate</div>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: -2 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center shadow-sm"
          >
            <motion.div 
              initial={{ y: 0 }}
              animate={{ y: -5 }}
              transition={{ 
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1
              }}
              className="flex justify-center mb-2"
            >
              <Calendar className="w-6 h-6 text-blue-600" />
            </motion.div>
            <div className="text-2xl font-bold text-gray-800">{consecutiveWeeks}</div>
            <div className="text-xs text-gray-600">Consecutive Weeks</div>
          </motion.div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02, rotate: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/history'}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 group shadow-lg"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <FileText className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.div>
          View My Submission History
        </motion.button>
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