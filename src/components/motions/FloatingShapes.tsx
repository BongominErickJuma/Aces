import React from "react";
import { motion } from "framer-motion";

interface FloatingShapesProps {
  count?: number;
  className?: string;
}

const FloatingShapes: React.FC<FloatingShapesProps> = ({ count = 6, className = "" }) => {
  const shapes = [
    {
      size: "w-3 h-3",
      color: "bg-aces-green/40",
      animate: {
        x: [0, 100, 0],
        y: [0, -50, 0],
        rotate: [0, 180, 360],
      },
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
      position: "top-10 left-10",
    },
    {
      size: "w-2 h-2",
      color: "bg-aces-blue/50",
      animate: {
        x: [0, -80, 0],
        y: [0, 100, 0],
        rotate: [0, -180, -360],
      },
      transition: {
        duration: 25,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 2,
      },
      position: "top-20 right-20",
    },
    {
      size: "w-4 h-4",
      color: "bg-aces-green/35",
      animate: {
        x: [0, 150, 0],
        y: [0, -80, 0],
        scale: [1, 1.2, 1],
      },
      transition: {
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 4,
      },
      position: "bottom-32 left-32",
    },
    {
      size: "w-2 h-2",
      color: "bg-aces-blue/45",
      animate: {
        x: [0, -60, 0],
        y: [0, 80, 0],
        scale: [1, 1.5, 1],
      },
      transition: {
        duration: 22,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 1,
      },
      position: "top-1/3 left-1/4",
    },
    {
      size: "w-3 h-3",
      color: "bg-aces-green/30",
      animate: {
        x: [0, 120, 0],
        y: [0, -70, 0],
        rotate: [0, 270, 360],
      },
      transition: {
        duration: 28,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 6,
      },
      position: "bottom-1/4 right-1/3",
    },
    {
      size: "w-2 h-2",
      color: "bg-aces-blue/40",
      animate: {
        x: [0, -90, 0],
        y: [0, -40, 0],
        scale: [1, 1.3, 1],
      },
      transition: {
        duration: 16,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 8,
      },
      position: "top-2/3 right-1/4",
    },
  ];

  return (
    <>
      {shapes.slice(0, count).map((shape, index) => (
        <motion.div
          key={index}
          animate={shape.animate}
          transition={shape.transition}
          className={`absolute ${shape.position} ${shape.size} ${shape.color} rounded-full shadow-lg ${className}`}
        />
      ))}
    </>
  );
};

export default FloatingShapes;
