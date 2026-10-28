import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';

interface DownwardCyberStreamProps {
  targetId?: string;
  label?: string;
}

export const DownwardCyberStream: React.FC<DownwardCyberStreamProps> = ({
  targetId = 'core-modules-section',
  label = 'EXPLORE ARCHITECTURE & MODULES',
}) => {
  const scrollToTarget = () => {
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollBy({ top: window.innerHeight * 0.85, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative py-8 flex flex-col items-center justify-center pointer-events-auto select-none">
      {/* Vertical Animated Cybernetic Laser Guide */}
      <div className="relative w-0.5 h-20 bg-gradient-to-b from-[#8DFFCB]/0 via-[#8DFFCB]/40 to-[#8DFFCB]">
        {/* Downward traveling pulse droplet */}
        <motion.div
          animate={{
            y: [0, 80],
            opacity: [0, 1, 0],
            scale: [0.8, 1.4, 0.8],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -left-1 w-2.5 h-2.5 rounded-full bg-[#8DFFCB] shadow-[0_0_15px_#8DFFCB]"
        />

        {/* Second offset micro pulse */}
        <motion.div
          animate={{
            y: [0, 80],
            opacity: [0, 0.8, 0],
            scale: [0.6, 1.2, 0.6],
          }}
          transition={{
            duration: 2.2,
            delay: 1.1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -left-0.5 w-1.5 h-1.5 rounded-full bg-[#D9FF72] shadow-[0_0_12px_#D9FF72]"
        />
      </div>

      {/* Interactive Interactive Scroll Pill */}
      <motion.button
        onClick={scrollToTarget}
        whileHover={{ scale: 1.05, y: 3 }}
        whileTap={{ scale: 0.96 }}
        className="group relative mt-3 px-4 py-2 rounded-full bg-[#0D1919]/90 border border-[#8DFFCB]/30 hover:border-[#8DFFCB] text-[#8DFFCB] hover:text-white transition-all shadow-[0_0_20px_rgba(141,255,203,0.15)] hover:shadow-[0_0_30px_rgba(141,255,203,0.35)] flex items-center gap-2 font-mono text-[11px] tracking-wider cursor-pointer"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[#8DFFCB] animate-ping" />
        <span>{label}</span>
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-[#8DFFCB] group-hover:translate-y-0.5 transition-transform" />
        </motion.div>
      </motion.button>
    </div>
  );
};
