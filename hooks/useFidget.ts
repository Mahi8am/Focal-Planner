import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

const TIRED_THRESHOLD = 15;
const TIRED_WINDOW    = 3000;

export function useFidget(scale: Animated.Value) {
  const tapTimestamps = useRef<number[]>([]);
  const tiredLock     = useRef(false);

  const normalFidget = useCallback(() => {
    if (tiredLock.current) return;
    scale.stopAnimation();
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.93, duration: 55, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.04, duration: 55, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 40, useNativeDriver: true }),
    ]).start();
  }, [scale]);

  const tiredFidget = useCallback((onTiredStart?: () => void, onTiredEnd?: () => void) => {
    tiredLock.current = true;
    onTiredStart?.(); // fire immediately at start
    scale.stopAnimation();
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, tension: 300, friction: 7 }),
      Animated.spring(scale, { toValue: 1.16, useNativeDriver: true, tension: 200, friction: 6 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 180, friction: 8 }),
    ]).start(() => {
      tiredLock.current = false;
      onTiredEnd?.();
    });
  }, [scale]);

  const onTap = useCallback((onTiredStart?: () => void, onTiredEnd?: () => void) => {
    const now = Date.now();
    tapTimestamps.current = tapTimestamps.current
      .filter(t => now - t < TIRED_WINDOW)
      .concat(now);

    if (tapTimestamps.current.length >= TIRED_THRESHOLD && !tiredLock.current) {
      tapTimestamps.current = [];
      tiredFidget(onTiredStart, onTiredEnd);
    } else {
      normalFidget();
    }
  }, [normalFidget, tiredFidget]);

  const resetTaps = useCallback(() => {
    tapTimestamps.current = [];
  }, []);

  return { onTap, tiredLock, normalFidget };
}
