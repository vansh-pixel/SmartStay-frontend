"use client";
import React from "react";
import { motion } from "framer-motion";

export default function FlipCard({ frontContent, backContent, className = "" }) {
  return (
    <div className={`group h-full perspective-1000 ${className}`}>
      <motion.div
        className="relative h-full w-full transition-all duration-500"
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ rotateY: 180, scale: 1.02 }}
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
    </div>
  );
}
