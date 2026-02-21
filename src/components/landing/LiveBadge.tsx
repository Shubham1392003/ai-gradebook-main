import { motion } from "framer-motion";
import { Users } from "lucide-react";

const LiveBadge = () => (
  <motion.div
    className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl px-5 py-2.5"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-400" />
      </span>
      <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Live</span>
    </div>
    <div className="h-4 w-px bg-white/20" />
    <div className="flex -space-x-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-7 w-7 rounded-full border-2 border-hero-bg bg-gradient-to-br from-blue-gray to-slate-brand flex items-center justify-center"
        >
          <Users className="h-3 w-3 text-hero-fg" />
        </div>
      ))}
    </div>
    <div className="text-left">
      <span className="text-sm font-bold text-hero-fg">2,500+</span>
      <p className="text-[10px] text-hero-muted leading-none">Active users today</p>
    </div>
  </motion.div>
);

export default LiveBadge;
