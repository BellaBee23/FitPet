import { useState, useEffect, useCallback } from "react";

interface UseTimerProps {
  initialTime: number;  // in seconds
  onComplete?: () => void;
}

export const useTimer = ({ initialTime, onComplete }: UseTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Format time to mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Reset timer
  const reset = useCallback((newTime?: number) => {
    setTimeLeft(newTime !== undefined ? newTime : initialTime);
    setIsActive(false);
    setIsPaused(false);
  }, [initialTime]);

  // Start timer
  const start = useCallback(() => {
    setIsActive(true);
    setIsPaused(false);
  }, []);

  // Pause timer
  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setTimeLeft((timeLeft) => {
          if (timeLeft <= 1) {
            if (interval) clearInterval(interval);
            if (onComplete) onComplete();
            return 0;
          }
          return timeLeft - 1;
        });
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, isPaused, onComplete]);

  return {
    timeLeft,
    timeDisplay: formatTime(timeLeft),
    isActive,
    isPaused,
    start,
    pause,
    resume,
    reset
  };
};
