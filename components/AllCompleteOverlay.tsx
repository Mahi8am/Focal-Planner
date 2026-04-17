import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants';

const STAR_SIZES  = [22, 32, 44, 32, 22];
const STAR_DELAYS = [0, 60, 120, 60, 0];

function Star({ size, delay, colors }: { size: number; delay: number; colors: Colors }) {
  const dropY   = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(dropY,   { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, tension: 130, friction: 8,  useNativeDriver: true }),
      ]),
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.25, duration: 280, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 0.9,  duration: 280, useNativeDriver: true }),
        ]),
        { iterations: 3 }
      ),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0,  duration: 250, useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 1.7, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: dropY }, { scale }] }}>
      <Text style={{ fontSize: size, color: colors.red, textShadowColor: colors.red, textShadowRadius: 14 }}>✦</Text>
    </Animated.View>
  );
}

interface Props { visible: boolean; colors: Colors; onDone: () => void; }

export default function AllCompleteOverlay({ visible, colors, onDone }: Props) {
  const dimOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textScale   = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    if (!visible) return;
    dimOpacity.setValue(0); textOpacity.setValue(0); textScale.setValue(0.7);
    Animated.sequence([
      Animated.timing(dimOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(textScale,   { toValue: 1, tension: 160, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(1000),
      Animated.parallel([
        Animated.timing(dimOpacity,  { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start(() => onDone());
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: dimOpacity }]} pointerEvents="none">
      <View style={styles.starsRow}>
        {STAR_SIZES.map((size, i) => (
          <Star key={i} size={size} delay={STAR_DELAYS[i]} colors={colors} />
        ))}
      </View>
      <Animated.View style={{ opacity: textOpacity, transform: [{ scale: textScale }] }}>
        <Text style={[styles.completeText, { color: colors.red }]}>ALL COMPLETE</Text>
        <Text style={[styles.completeSub, { color: '#FFFFFF' }]}>Day cleared.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, alignItems: 'center', justifyContent: 'center', gap: 24 },
  starsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10, height: 60 },
  completeText: { fontSize: 28, fontWeight: '900', letterSpacing: 8, textAlign: 'center' },
  completeSub:  { fontSize: 14, fontWeight: '600', letterSpacing: 4, textAlign: 'center', marginTop: 6, opacity: 0.9 },
});
