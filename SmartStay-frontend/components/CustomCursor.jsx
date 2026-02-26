"use client"
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    window.addEventListener("mousemove", mouseMove);

    // Add listeners to interactive elements
    const interactiveElements = document.querySelectorAll("a, button, input, textarea, select, .interactive");
    interactiveElements.forEach(el => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      window.removeEventListener("mousemove", mouseMove);
      interactiveElements.forEach(el => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  // Re-attach listeners on DOM changes (simple approach)
  useEffect(() => {
    const handleMouseOver = (e) => {
       if (e.target.closest("a, button, input, textarea, select, .interactive")) {
           setIsHovering(true);
       } else {
           setIsHovering(false);
       }
    };
    window.addEventListener("mouseover", handleMouseOver);
    return () => window.removeEventListener("mouseover", handleMouseOver);
  }, []);

  const variants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1,
      opacity: 1,
    },
    hover: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1.5,
      opacity: 0.8,
      backgroundColor: "rgba(255, 140, 66, 0.2)", // Orange tint on hover
      borderColor: "rgba(255, 140, 66, 0.8)",
    }
  };

  const dotVariants = {
    default: {
      x: mousePosition.x - 4,
      y: mousePosition.y - 4,
      opacity: 1,
    },
    hover: {
        x: mousePosition.x - 4,
        y: mousePosition.y - 4,
        opacity: 0, // Hide dot on hover if we want a different effect, or keep it
    }
  };

  return (
    <>
      <style jsx global>{`
        /* Hide default cursor only on devices with a fine pointer (mouse/trackpad) */
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }
        
        /* Hide custom cursor on touch devices */
        @media (pointer: coarse), (hover: none) {
           .custom-cursor-visual { display: none !important; }
           /* Restore default cursor interactions if needed */
           * {
             cursor: auto !important;
           }
        }
      `}</style>
      <div className="custom-cursor-container pointer-events-none">
      {/* Outer Ring */}
      <motion.div
        className="custom-cursor-visual fixed top-0 left-0 w-8 h-8 rounded-full border border-orange-500 pointer-events-none z-[9999999]"
        variants={variants}
        animate={isHovering ? "hover" : "default"}
        transition={{
            type: "spring",
            stiffness: 150,
            damping: 15,
            mass: 0.5
        }}
        style={{
             mixBlendMode: "difference" 
        }}
      />
      {/* Inner Dot */}
      <motion.div
        className="custom-cursor-visual fixed top-0 left-0 w-2 h-2 bg-orange-500 rounded-full pointer-events-none z-[9999999]"
        variants={dotVariants}
        animate="default"
        transition={{
            type: "tween",
            ease: "linear",
            duration: 0
        }}
      />
      </div>
    </>
  );
}
