import React from "react";
import { motion } from "framer-motion";

interface FloatingDocumentsProps {
  count?: number;
  className?: string;
}

const FloatingDocuments: React.FC<FloatingDocumentsProps> = ({ count = 6, className = "" }) => {
  const documents = [
    {
      size: "w-40 h-52",
      position: "top-1/4 right-1/4",
      rotation: "rotate-12",
      opacity: "opacity-40",
      animate: {
        rotate: [0, 2, -2, 0],
        y: [0, -20, 0],
        opacity: [0.1, 0.2, 0.1],
      },
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
      lines: [
        { width: "w-3/4", color: "bg-aces-green/20", height: "h-2" },
        { width: "w-1/2", color: "bg-gray-200", height: "h-1" },
        { width: "w-2/3", color: "bg-gray-200", height: "h-1" },
        { width: "w-full", color: "bg-gray-200", height: "h-1" },
        { width: "w-4/5", color: "bg-gray-200", height: "h-1" },
      ],
    },
    {
      size: "w-32 h-40",
      position: "bottom-1/4 left-1/5",
      rotation: "-rotate-8",
      opacity: "opacity-30",
      animate: {
        rotate: [0, -1.5, 1.5, 0],
        y: [0, -25, 0],
        opacity: [0.08, 0.15, 0.08],
      },
      transition: {
        duration: 15,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 3,
      },
      lines: [
        { width: "w-2/3", color: "bg-aces-blue/20", height: "h-1.5" },
        { width: "w-full", color: "bg-gray-200", height: "h-1" },
        { width: "w-3/4", color: "bg-gray-200", height: "h-1" },
        { width: "w-5/6", color: "bg-gray-200", height: "h-1" },
      ],
    },
    {
      size: "w-20 h-28",
      position: "top-1/3 right-1/6",
      rotation: "rotate-6",
      opacity: "opacity-20",
      animate: {
        rotate: [0, 1, -1, 0],
        y: [0, -15, 0],
        opacity: [0.06, 0.12, 0.06],
      },
      transition: {
        duration: 18,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 5,
      },
      lines: [
        { width: "w-3/4", color: "bg-aces-green/25", height: "h-1" },
        { width: "w-full", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-2/3", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-4/5", color: "bg-gray-200", height: "h-0.5" },
      ],
    },
    {
      size: "w-16 h-24",
      position: "bottom-1/3 right-1/4",
      rotation: "-rotate-4",
      opacity: "opacity-10",
      animate: {
        rotate: [0, -0.8, 0.8, 0],
        y: [0, -18, 0],
        opacity: [0.05, 0.1, 0.05],
      },
      transition: {
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 7,
      },
      lines: [
        { width: "w-2/3", color: "bg-aces-blue/30", height: "h-0.5" },
        { width: "w-full", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-3/4", color: "bg-gray-200", height: "h-0.5" },
      ],
    },
    {
      size: "w-18 h-26",
      position: "top-1/2 left-1/6",
      rotation: "rotate-10",
      opacity: "opacity-20",
      animate: {
        rotate: [0, 1.2, -1.2, 0],
        y: [0, -12, 0],
        opacity: [0.07, 0.13, 0.07],
      },
      transition: {
        duration: 22,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 9,
      },
      lines: [
        { width: "w-4/5", color: "bg-aces-green/20", height: "h-0.5" },
        { width: "w-full", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-2/3", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-3/4", color: "bg-gray-200", height: "h-0.5" },
      ],
    },
    {
      size: "w-14 h-20",
      position: "top-3/4 right-1/3",
      rotation: "rotate-3",
      opacity: "opacity-15",
      animate: {
        rotate: [0, -0.6, 0.6, 0],
        y: [0, -20, 0],
        opacity: [0.04, 0.09, 0.04],
      },
      transition: {
        duration: 16,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: 11,
      },
      lines: [
        { width: "w-3/4", color: "bg-aces-blue/25", height: "h-0.5" },
        { width: "w-full", color: "bg-gray-200", height: "h-0.5" },
        { width: "w-2/3", color: "bg-gray-200", height: "h-0.5" },
      ],
    },
  ];

  return (
    <>
      {documents.slice(0, count).map((doc, index) => (
        <motion.div
          key={index}
          animate={doc.animate}
          transition={doc.transition}
          className={`absolute ${doc.position} ${doc.size} bg-gradient-to-b from-gray-50 to-white pdf-shadow ${doc.opacity} transform ${doc.rotation} rounded-lg ${className}`}
        >
          <div
            className={`${
              doc.size.includes("w-40")
                ? "p-4"
                : doc.size.includes("w-32")
                ? "p-3"
                : doc.size.includes("w-20")
                ? "p-2"
                : "p-1.5"
            } space-y-${doc.size.includes("w-40") ? "2" : doc.size.includes("w-32") ? "2" : "1"}`}
          >
            {doc.lines.map((line, lineIndex) => (
              <div key={lineIndex} className={`${line.height} ${line.color} rounded ${line.width}`} />
            ))}
          </div>
        </motion.div>
      ))}
    </>
  );
};

export default FloatingDocuments;
