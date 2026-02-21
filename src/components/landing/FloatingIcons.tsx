import { motion } from "framer-motion";
import { FileText, ClipboardCheck, Shield, BarChart3 } from "lucide-react";

const floatingItems = [
  { icon: FileText, x: "10%", y: "20%", delay: 0, size: 18 },
  { icon: ClipboardCheck, x: "85%", y: "15%", delay: 1, size: 16 },
  { icon: Shield, x: "8%", y: "65%", delay: 2, size: 14 },
  { icon: BarChart3, x: "88%", y: "60%", delay: 0.5, size: 16 },
  { icon: FileText, x: "75%", y: "75%", delay: 1.5, size: 12 },
  { icon: ClipboardCheck, x: "20%", y: "80%", delay: 2.5, size: 14 },
];

const FloatingIcons = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {floatingItems.map((item, i) => {
      const Icon = item.icon;
      return (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: item.x, top: item.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ delay: 0.5 + item.delay * 0.3, duration: 0.8 }}
        >
          <div
            className="animate-float-slow"
            style={{ animationDelay: `${item.delay}s` }}
          >
            <div className="rounded-xl bg-muted/60 backdrop-blur-sm border border-border/50 p-3 shadow-sm">
              <Icon size={item.size} className="text-muted-foreground" />
            </div>
          </div>
        </motion.div>
      );
    })}
  </div>
);

export default FloatingIcons;
