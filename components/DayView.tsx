/**
 * DayView.tsx
 * Main planner view — three time-slot cards for a given day.
 * - Keyboard dismissed when navigating between days
 * - Quote card pulses both on day change AND on first mount (tab switch)
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, PanResponder, Keyboard,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import SlotCard from './SlotCard';
import AllCompleteOverlay from './AllCompleteOverlay';
import { DayData, SlotId } from '../types';
import { SLOTS, Colors, FUNNY_QUOTES, SPAM_RESPONSES } from '../constants';
import { formatDisplayDate, isPast, isToday, isFuture } from '../utils/dateUtils';
import { useFidget } from '../hooks/useFidget';

interface Props {
  dateKey: string; dayData: DayData; installDate: string;
  canGoBack: boolean; canGoForward: boolean;
  onPrev: () => void; onNext: () => void;
  onGoToToday: () => void;
  onAdd: (s: SlotId, t: string) => void;
  onEdit: (s: SlotId, t: string) => void;
  onComplete: (s: SlotId) => void;
  onFail: (s: SlotId) => void;
  onDelete: (s: SlotId) => void;
  colors: Colors;
}

const DAILY_QUOTES = [
  'Every moment is a chance to act.',
  'The past is written. The future is yours.',
  'Plan well. Execute with purpose.',
  'Small steps compound into great journeys.',
  'Discipline is freedom.',
  'Be the protagonist of your own story.',
  'Clarity of purpose beats intensity of effort.',
  'You do not rise to your goals. You fall to your systems.',
  'One task at a time. That is enough.',
  'Show up. That is half the battle.',
  'Be Intentional.',
  'Build to a Goal.',
  'Stack good habits. Decrease bad habits',
  'Create Habits. Create a flow of habits ',
];

function getQuote(): string {
  if (Math.random() < 0.20) return FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
  return DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
}

function pulseScale(anim: Animated.Value) {
  anim.stopAnimation();
  Animated.sequence([
    Animated.timing(anim, { toValue: 0.93, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 1.04, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 1,    duration: 40, useNativeDriver: true }),
  ]).start();
}

export default function DayView({
  dateKey, dayData, installDate,
  canGoBack, canGoForward,
  onPrev, onNext, onGoToToday, onAdd, onEdit, onComplete, onFail, onDelete,
  colors,
}: Props) {

  const past    = isPast(dateKey);
  const today   = isToday(dateKey);
  const future  = isFuture(dateKey);
  const isBeforeInstall = !!installDate && dateKey < installDate;

  const completedCount = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'completed').length;
  const failedCount    = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'failed').length;
  const resolvedCount  = completedCount + failedCount;
  const plannedCount   = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'planned').length;
  const allDone        = resolvedCount === SLOTS.length;

  const [showOverlay, setShowOverlay] = useState(false);
  const [animKey, setAnimKey]         = useState(dateKey);
  const [currentQuote, setCurrentQuote] = useState(() => getQuote());
  const [spamQuote, setSpamQuote]     = useState<string | null>(null);

  const prevCompletedRef = useRef(resolvedCount);
  const prevDateKeyRef   = useRef(dateKey);
  const overlayShownRef  = useRef(false);

  const siblingTiredRefs = useRef<Array<(() => void) | null>>([null, null, null]);

  // Stable refs for PanResponder
  const onPrevRef       = useRef(onPrev);
  const onNextRef       = useRef(onNext);
  const onGoToTodayRef  = useRef(onGoToToday);
  const canGoBackRef    = useRef(canGoBack);
  const canGoForwardRef = useRef(canGoForward);
  useEffect(() => { onPrevRef.current = onPrev; },             [onPrev]);
  useEffect(() => { onNextRef.current = onNext; },             [onNext]);
  useEffect(() => { onGoToTodayRef.current = onGoToToday; },   [onGoToToday]);
  useEffect(() => { canGoBackRef.current = canGoBack; },       [canGoBack]);
  useEffect(() => { canGoForwardRef.current = canGoForward; }, [canGoForward]);

  // All-resolved detection
  useEffect(() => {
    const dayChanged = prevDateKeyRef.current !== dateKey;
    if (dayChanged) {
      prevCompletedRef.current = resolvedCount;
      prevDateKeyRef.current   = dateKey;
      overlayShownRef.current  = false;
      return;
    }
    if (completedCount === SLOTS.length && prevCompletedRef.current < SLOTS.length && !overlayShownRef.current) {
      overlayShownRef.current = true;
      setShowOverlay(true);
    }
    prevCompletedRef.current = resolvedCount;
  }, [resolvedCount, dateKey]);

  // Day transition animation
  const fadeAnim   = useRef(new Animated.Value(1)).current;
  const textSlideY = useRef(new Animated.Value(0)).current;
  const prevKey    = useRef(dateKey);

  useEffect(() => {
    if (prevKey.current !== dateKey) {
      prevKey.current = dateKey;
      setAnimKey(dateKey);
      setSpamQuote(null);
      setCurrentQuote(getQuote());
      textSlideY.setValue(18);
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0.35, duration: 80,  useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]).start();
      Animated.spring(textSlideY, { toValue: 0, tension: 160, friction: 12, useNativeDriver: true }).start();
    }
  }, [dateKey]);

  // Progress bar
  const progressAnim    = useRef(new Animated.Value(0)).current;
  const prevProgressDay = useRef(dateKey);
  useEffect(() => {
    const target = resolvedCount / SLOTS.length;
    if (prevProgressDay.current !== dateKey) {
      prevProgressDay.current = dateKey;
      progressAnim.setValue(0);
      if (resolvedCount > 0) {
        Animated.spring(progressAnim, { toValue: target, useNativeDriver: false, tension: 60, friction: 10 }).start();
      }
    } else {
      if (resolvedCount > 0) {
        Animated.spring(progressAnim, { toValue: target, useNativeDriver: false, tension: 80, friction: 10 }).start();
      } else {
        progressAnim.setValue(0);
      }
    }
  }, [resolvedCount, dateKey]);

  // Seesaw on all-done
  const seesawAnim  = useRef(new Animated.Value(0)).current;
  const hasSeesawed = useRef(false);
  useEffect(() => {
    if (allDone && !showOverlay && !hasSeesawed.current && overlayShownRef.current) {
      hasSeesawed.current = true;
      Animated.sequence([
        Animated.timing(seesawAnim, { toValue: 1,   duration: 110, useNativeDriver: true }),
        Animated.timing(seesawAnim, { toValue: -1,  duration: 110, useNativeDriver: true }),
        Animated.timing(seesawAnim, { toValue: 0.5, duration: 90,  useNativeDriver: true }),
        Animated.timing(seesawAnim, { toValue: 0,   duration: 80,  useNativeDriver: true }),
      ]).start();
    }
    if (!allDone) hasSeesawed.current = false;
  }, [allDone, showOverlay]);

  const seesawRotate = seesawAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });

  // Quote fidget — also pulse on mount (tab switch) and on day change
  const quoteScale = useRef(new Animated.Value(1)).current;
  const { onTap: quoteOnTap } = useFidget(quoteScale);

  // Pulse on mount (when navigating TO this tab)
  useEffect(() => {
    pulseScale(quoteScale);
  }, []);

  // Pulse on day change
  const quotePrevRef = useRef(currentQuote);
  useEffect(() => {
    if (quotePrevRef.current !== currentQuote) {
      quotePrevRef.current = currentQuote;
      pulseScale(quoteScale);
    }
  }, [currentQuote]);

  const handleQuoteTap = () => {
    quoteOnTap(
      () => {
        const msg = SPAM_RESPONSES[Math.floor(Math.random() * SPAM_RESPONSES.length)];
        setSpamQuote(msg);
      },
      undefined,
    );
  };

  // Swipe PanResponder
  const SWIPE_THRESH = 40;
  const swipePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 40,
      onPanResponderRelease: (_, g) => {
        if (g.dx < -SWIPE_THRESH && canGoForwardRef.current) onNextRef.current();
        else if (g.dx > SWIPE_THRESH && canGoBackRef.current) onPrevRef.current();
      },
    })
  ).current;

  // Nav card fidget + long-press to go to today
  const navCardScale = useRef(new Animated.Value(1)).current;
  const badgeScale   = useRef(new Animated.Value(1)).current;
  const { onTap: navCardTap } = useFidget(navCardScale);
  const longPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired    = useRef(false);

  const handleBadgeTired = useCallback(() => {
    badgeScale.stopAnimation();
    Animated.sequence([
      Animated.spring(badgeScale, { toValue: 2.8, useNativeDriver: true, tension: 60, friction: 5 }),
      Animated.delay(120),
      Animated.spring(badgeScale, { toValue: 1,   useNativeDriver: true, tension: 180, friction: 8 }),
    ]).start();
  }, [badgeScale]);

  const handleMiddlePressIn = useCallback(() => {
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      onGoToTodayRef.current();
    }, 500);
  }, []);

  const handleMiddlePressOut = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleMiddlePress = useCallback(() => {
    // Only fire fidget if long press did NOT fire
    if (!longPressFired.current) {
      navCardTap(handleBadgeTired, undefined);
    }
  }, [navCardTap, handleBadgeTired]);

  const getDayLabel = () => today ? 'TODAY' : past ? 'PAST' : 'UPCOMING';
  const progressColor = failedCount > 0 && completedCount === 0 ? colors.failed : colors.red;

  return (
    <View style={{ flex: 1 }}>
      <AllCompleteOverlay visible={showOverlay} colors={colors} onDone={() => setShowOverlay(false)} />
      <ScrollView
          style={[styles.container, { backgroundColor: colors.bg }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...swipePan.panHandlers}
        >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Nav card */}
          <View>
            <Animated.View style={[styles.navCard, { backgroundColor: colors.bgCard, borderColor: colors.border, transform: [{ scale: navCardScale }] }]}>
              <TouchableOpacity
                onPress={onPrev} disabled={!canGoBack}
                style={styles.navBtnLarge} activeOpacity={0.6}
              >
                <ChevronLeft size={24} color={canGoBack ? colors.text : colors.grey} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navMiddle} activeOpacity={1}
                onPressIn={handleMiddlePressIn}
                onPressOut={handleMiddlePressOut}
                onPress={handleMiddlePress}
                delayPressIn={0}
              >
                <Animated.View style={styles.navMiddleContent}>
                  <Animated.View style={[styles.dayBadge, {
                    backgroundColor: today ? colors.red : colors.bgElevated,
                    borderColor: today ? colors.red : colors.border,
                    transform: [{ scale: badgeScale }],
                  }]}>
                    <Text style={[styles.dayBadgeText, { color: today ? '#FFF' : colors.red }]}>
                      {getDayLabel()}
                    </Text>
                  </Animated.View>
                  <Animated.Text style={[styles.dateText, { color: colors.text, transform: [{ translateY: textSlideY }] }]}>
                    {formatDisplayDate(dateKey)}
                  </Animated.Text>
                  <View style={styles.allDoneContainer}>
                    {allDone && (
                      <Animated.Text style={[styles.allDoneText, {
                        color: failedCount === SLOTS.length ? colors.failed : colors.completed,
                        transform: [{ rotate: seesawRotate }],
                      }]}>
                        {failedCount === SLOTS.length ? '✦ ALL SKIPPED ✦' : failedCount > 0 ? '✦ DAY RESOLVED ✦' : '✦ ALL COMPLETE ✦'}
                      </Animated.Text>
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onNext} disabled={!canGoForward}
                style={styles.navBtnLarge} activeOpacity={0.6}
              >
                <ChevronRight size={24} color={canGoForward ? colors.text : colors.grey} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Progress */}
          <View style={[styles.progressTrack, { backgroundColor: colors.bgElevated }]}>
            <Animated.View style={[styles.progressFill, {
              backgroundColor: progressColor,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            }]} />
          </View>
          <View style={styles.progressMeta}>
            <Animated.Text style={[styles.progressText, { color: colors.textMuted, transform: [{ translateY: textSlideY }] }]}>
              {completedCount}/{SLOTS.length} COMPLETE
              {failedCount > 0 ? `  ·  ${failedCount} SKIPPED` : ''}
            </Animated.Text>
            {plannedCount > 0 && (
              <Text style={[styles.progressText, { color: colors.textMuted }]}>{plannedCount} PLANNED</Text>
            )}
          </View>

          {/* Slot cards */}
          
          {SLOTS.map((slot, index) => (
            <SlotCard
              key={slot.id} slotId={slot.id} label={slot.label} timeRange={slot.timeRange}
              task={dayData.tasks[slot.id]} dateKey={dateKey}
              isToday={today} isPast={past} isFuture={future}
              isBeforeInstall={isBeforeInstall}
              onAdd={onAdd} onEdit={onEdit} onComplete={onComplete}
              onFail={onFail} onDelete={onDelete}
              blocked={false} colors={colors} index={index} animKey={animKey}
              cardIndex={index}
              onSiblingTired={(excludeIndex) => {
                SLOTS.forEach((_, i) => {
                  if (i !== excludeIndex) siblingTiredRefs.current[i]?.();
                });
              }}
              registerMoodSwing={(fn) => { siblingTiredRefs.current[index] = fn; }}
            />
          ))}

          {/* Quote card */}
          <TouchableOpacity activeOpacity={1} onPress={handleQuoteTap}>
            <Animated.View style={[styles.quoteCard, {
              backgroundColor: colors.bgCard, borderColor: colors.border,
              transform: [{ scale: quoteScale }],
            }]}>
              <Text style={[styles.quoteSymbol, { color: colors.red }]}>✦</Text>
              <Text style={[styles.quoteText, {
                color: spamQuote ? colors.red : colors.textMuted,
                fontStyle: spamQuote ? 'normal' : 'italic',
                fontWeight: spamQuote ? '700' : '400',
              }]}>
                {spamQuote ?? currentQuote}
              </Text>
              <Text style={[styles.quoteSymbol, { color: colors.red }]}>✦</Text>
            </Animated.View>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },
  navCard:   { flexDirection: 'row', alignItems: 'stretch', borderRadius: 10, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  navBtnLarge: { width: 56, alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  navMiddle:   { flex: 1 },
  navMiddleContent: { alignItems: 'center', gap: 5, paddingVertical: 14 },
  dayBadge:    { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  dayBadgeText:{ fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  dateText:    { fontSize: 16, fontWeight: '700', letterSpacing: 0.4, textAlign: 'center' },
  allDoneContainer: { height: 16, justifyContent: 'center', alignItems: 'center' },
  allDoneText: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  progressTrack: { height: 3, borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 2 },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressText:  { fontSize: 10, letterSpacing: 1.5, fontWeight: '600' },
  quoteCard:     { marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  quoteSymbol:   { fontSize: 16, fontWeight: '900' },
  quoteText:     { flex: 1, fontSize: 12, letterSpacing: 0.4, textAlign: 'center', lineHeight: 18 },
});
