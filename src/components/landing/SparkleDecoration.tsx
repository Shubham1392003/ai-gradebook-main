import { motion } from "framer-motion";

const sparkles = [
  { x: "15%", y: "25%", size: 20, delay: 0 },
  { x: "80%", y: "20%", size: 28, delay: 0.5 },
  { x: "70%", y: "70%", size: 16, delay: 1 },
  { x: "25%", y: "75%", size: 22, delay: 1.5 },
  { x: "90%", y: "45%", size: 14, delay: 2 },
];

const SparkleDecoration = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {sparkles.map((s, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: s.x, top: s.y }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 + s.delay * 0.3, duration: 0.6 }}
      >
        <div className="animate-sparkle" style={{ animationDelay: `${s.delay}s` }}>
          <svg width={s.size} height={s.size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.5 9.5L21 12L13.5 14.5L12 22L10.5 14.5L3 12L10.5 9.5L12 2Z"
              fill="currentColor"
              className="text-blue-gray/30"
            />
          </svg>
        </div>
      </motion.div>
    ))}
  </div>
);

export default SparkleDecoration;
