"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";

export default function FlipCard({ frontContent, backContent, className = "" }) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <motion.div 
      className={`group h-full perspective-1000 cursor-pointer ${className}`}
      onHoverStart={() => setIsFlipped(true)}
      onHoverEnd={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative h-full w-full transition-all duration-500"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0, scale: isFlipped ? 1.02 : 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Front Face */}
        <div 
          className="absolute inset-0 h-full w-full"
          style={{ backfaceVisibility: "hidden" }}
        >
          {frontContent}
        </div>

        {/* Back Face */}
        <div 
          className="absolute inset-0 h-full w-full"
          style={{ 
            backfaceVisibility: "hidden", 
            transform: "rotateY(180deg)" 
          }}
        >
          {backContent}
        </div>
      </motion.div>
    </motion.div>
  );
}
