import { Check, FileText, Sparkles, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center text-center h-full gap-6 px-6">
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
        className="relative"
      >
        <motion.div 
          className="w-24 h-24 bg-gradient-to-r from-green-100 to-blue-100 rounded-full flex items-center justify-center"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
          >
            <Check size={40} className="text-green-600" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute -top-2 -right-2"
        >
          <Sparkles size={24} className="text-yellow-400" />
        </motion.div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="absolute -bottom-2 -left-2"
        >
          <Star size={24} className="text-pink-400" />
        </motion.div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.h1 
          className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          Submission received!
        </motion.h1>
        <motion.p 
          className="text-gray-600 text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          You&apos;re helping us all stay in sync 🙌
        </motion.p>
      </motion.div>
      
      <motion.div 
        className="flex flex-col gap-4 w-full max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button 
          onClick={() => router.push('/history')}
          className="group relative bg-white border border-gray-200 hover:border-blue-300 px-6 py-3 rounded-lg font-medium flex items-center gap-2 justify-center shadow-sm hover:shadow-md transition-all duration-300"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{ 
            boxShadow: [
              "0 1px 2px rgba(0,0,0,0.1)",
              "0 4px 8px rgba(0,0,0,0.1)",
              "0 1px 2px rgba(0,0,0,0.1)"
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" /> 
            View My History
          </span>
          <motion.span 
            className="absolute inset-0 bg-gradient-to-r from-blue-50 to-green-50 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"
            initial={false}
          />
        </motion.button>
      </motion.div>
    </div>
  );
} 