"use client";

import { useEffect, useRef, useState } from "react";
import { motion, MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number; // ms per character
  delay?: number; // initial delay before first type
  as?: React.ElementType;
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  children,
  className,
  duration = 200,
  delay = 0,
  as: Component = "div",
  ...props
}) => {
  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let typingTimer: NodeJS.Timeout;
    let loopTimer: NodeJS.Timeout;

    const startTyping = () => {
      let i = 0;
      typingTimer = setInterval(() => {
        if (i < children.length) {
          setDisplayedText(children.substring(0, i + 1));
          i++;
        } else {
          clearInterval(typingTimer);
          // Wait 3 seconds, then clear and restart
          loopTimer = setTimeout(() => {
            setDisplayedText("");
            setIndex((prev) => prev + 1); // Trigger rerender
          }, 3000);
        }
      }, duration);
    };

    const startDelay = setTimeout(startTyping, delay);

    return () => {
      clearTimeout(startDelay);
      clearInterval(typingTimer);
      clearTimeout(loopTimer);
    };
  }, [index, children, duration, delay]);

  return (
    <MotionComponent
      className={cn(
        "text-4xl font-bold leading-[5rem] tracking-[-0.02em]",
        className
      )}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};
