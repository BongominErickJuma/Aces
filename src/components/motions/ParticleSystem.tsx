import React from "react";
import { motion } from "framer-motion";

interface ParticleSystemProps {
  particleCount?: number;
  extraParticleCount?: number;
  className?: string;
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  particleCount = 12,
  extraParticleCount = 6,
  className = "",
}) => {
  return (
    <>
      {/* Enhanced Particle System - Rising Particles */}
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -window.innerHeight || -800],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 12 + i * 1.5,
            repeat: Infinity,
            delay: i * 2,
            ease: "easeOut",
          }}
          className={`absolute w-1 h-1 rounded-full shadow-sm ${
            i % 3 === 0 ? "bg-aces-green/50" : i % 3 === 1 ? "bg-aces-blue/45" : "bg-gray-400/40"
          } ${className}`}
          style={{
            left: `${8 + i * 8}%`,
            bottom: 0,
          }}
        />
      ))}

      {/* Additional Floating Particles */}
      {[...Array(extraParticleCount)].map((_, i) => (
        <motion.div
          key={`extra-${i}`}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -100, -50, 0],
            opacity: [0, 0.4, 0.2, 0],
          }}
          transition={{
            duration: 20 + i * 3,
            repeat: Infinity,
            delay: i * 4,
            ease: "easeInOut",
          }}
          className={`absolute w-1.5 h-1.5 rounded-full ${
            i % 2 === 0 ? "bg-aces-green/35 shadow-md" : "bg-aces-blue/40 shadow-md"
          } ${className}`}
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
        />
      ))}
    </>
  );
};

export default ParticleSystem;
