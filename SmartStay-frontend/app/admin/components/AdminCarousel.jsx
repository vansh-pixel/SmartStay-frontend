"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const IMAGES = [
  "/maldives.png", // Maldives Resort
  "/pool-side.png", // Pool Side
  "/luxury-room.png"  // Luxury Room
];

export default function AdminCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % IMAGES.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[300px] lg:h-[400px] overflow-hidden rounded-2xl shadow-lg mb-8 group">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={IMAGES[index]}
          alt="Resort View"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover will-change-transform"
        />
      </AnimatePresence>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
         <motion.div
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           transition={{ delay: 0.5 }}
         >
           <h2 className="text-white text-3xl font-bold mb-2">Welcome to SmartStay Admin</h2>
           <p className="text-white/90 text-lg">Manage your premium resort with ease.</p>
         </motion.div>
      </div>

      {/* Indicators */}
      <div className="absolute bottom-6 right-8 flex gap-2">
        {IMAGES.map((_, i) => (
          <div 
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
