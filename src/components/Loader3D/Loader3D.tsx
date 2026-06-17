/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./Loader3D.css";

interface Loader3DProps {
  progress?: number; // 0 to 100
  onComplete?: () => void;
}

/**
 * P-1: Replaced Three.js (~600KB) atom spinner with a pure CSS/Framer Motion
 * orbital loader. Same premium feel, ~0KB additional bundle cost.
 */
export function Loader3D({ progress = 0, onComplete }: Loader3DProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (progress >= 100 && !isExiting) {
      setIsExiting(true);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 800);
    }
  }, [progress, isExiting, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="up-loader-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <div className="up-content-wrapper">
            {/* CSS Orbital Spinner */}
            <div className="up-canvas-wrapper">
              <div className="css-atom-loader">
                <div className="atom-ring ring-1" />
                <div className="atom-ring ring-2" />
                <div className="atom-ring ring-3" />
                <div className="atom-core" />
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="up-progress-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <div className="up-progress-bar-bg">
                <motion.div
                  className="up-progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="up-progress-shimmer" />
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
