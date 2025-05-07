'use client';

import { User } from '@supabase/supabase-js';
import { getWeekDates, getSubmissionWindow } from '@/lib/utils/date';
import { motion } from 'framer-motion';
import { Calendar, Clock, Sparkles, ArrowRight, Star, Sun, Moon } from 'lucide-react';
import { format } from 'date-fns';

interface WelcomeScreenProps {
  user: User;
  onNext: () => void;
  weekNumber: number;
}

export default function WelcomeScreen({ user, onNext, weekNumber }: WelcomeScreenProps) {
  const { formattedRange } = getWeekDates(weekNumber);
  const { submissionStart, submissionEnd, lateSubmissionEnd } = getSubmissionWindow(weekNumber);

  // Format dates with day names
  const formatDateWithDay = (date: Date) => {
    return format(date, 'EEEE, MMMM d, h:mm a');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-8 flex flex-col items-center text-center relative overflow-hidden"
    >
      {/* Enhanced background decorative elements */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.5 }}
        className="absolute inset-0 pointer-events-none z-0"
      >
        {/* Sparkles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            initial={{ 
              x: Math.random() * 800 - 400,
              y: Math.random() * 800 - 400,
              rotate: 0,
              opacity: 0.4 + Math.random() * 0.4
            }}
            animate={{ 
              rotate: 360,
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.3, 1]
            }}
            transition={{ 
              duration: 6 + Math.random() * 4,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "linear"
            }}
            className="absolute text-5xl text-yellow-400 select-none drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
          >
            {i % 3 === 0 ? '✨' : i % 3 === 1 ? '⭐' : '🌟'}
          </motion.div>
        ))}
        
        {/* Floating icons */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`icon-${i}`}
            initial={{ 
              x: Math.random() * 600 - 300,
              y: Math.random() * 600 - 300,
              rotate: 0,
              opacity: 0.2
            }}
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 10, 0],
              opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ 
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut"
            }}
            className="absolute text-3xl text-blue-300 select-none"
          >
            {i % 2 === 0 ? '☀️' : '🌙'}
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 w-full"
      >
        <motion.h1 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl font-bold mb-6 text-blue-600"
        >
          Welcome back, {user.email}!
        </motion.h1>
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <motion.h2 
            whileHover={{ scale: 1.05 }}
            className="text-3xl font-semibold mb-2 text-gray-800 flex items-center justify-center gap-2"
          >
            <Star className="w-6 h-6 text-yellow-400" />
            Week {weekNumber}
          </motion.h2>
          <motion.p 
            whileHover={{ scale: 1.02 }}
            className="text-gray-600 font-medium"
          >
            {formattedRange.start} - {formattedRange.end}
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 p-8 rounded-2xl mb-8 w-full shadow-lg border border-blue-100"
        >
          <motion.h3 
            whileHover={{ scale: 1.02 }}
            className="font-semibold mb-6 text-blue-800 flex items-center justify-center gap-2 text-xl"
          >
            <Calendar className="w-6 h-6" />
            Submission Window
          </motion.h3>
          <div className="space-y-4">
            <motion.div 
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg"
            >
              <Sun className="w-5 h-5 text-yellow-500" />
              <span className="font-medium">Opens: {formatDateWithDay(submissionStart)}</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg"
            >
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-medium">Due by: {formatDateWithDay(submissionEnd)}</span>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 text-sm text-gray-700 bg-white/50 p-3 rounded-lg"
            >
              <Moon className="w-5 h-5 text-purple-500" />
              <span className="font-medium">Late submissions until: {formatDateWithDay(lateSubmissionEnd)}</span>
            </motion.div>
          </div>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02, rotate: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNext}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-3 group shadow-lg"
        >
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.span>
          Start Weekly Pulse
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ArrowRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </motion.div>
        </motion.button>
      </motion.div>
    </motion.div>
  );
} 