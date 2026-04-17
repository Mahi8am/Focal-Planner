/**
 * DayView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Main planner view — shows the three time-slot cards for a given day.
 *
 * TEXT YOU CAN EDIT:
 *   "SKIP DAY"         → label on the skip-day button   (search: SKIP_DAY_BTN)
 *   Block warning text → search: BLOCK_WARNING_TEXT
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Animated, PanResponder,
} from 'react-native';
import { ChevronLeft, ChevronRight, AlertTriangle, SkipForward } from 'lucide-react-native';
import SlotCard from './SlotCard';
import AllCompleteOverlay from './AllCompleteOverlay';
import { DayData, SlotId } from '../types';
import { SLOTS, Colors, FUNNY_QUOTES, SPAM_RESPONSES } from '../constants';
import { formatDisplayDate, isPast, isToday, isFuture } from '../utils/dateUtils';
import { useFidget } from '../hooks/useFidget';

interface Props {
  dateKey: string; dayData: DayData;
  canGoBack: boolean; canGoForward: boolean;
  onPrev: () => void; onNext: () => void;
  onGoToToday: () => void;
  onAdd: (s: SlotId, t: string) => void;
  onEdit: (s: SlotId, t: string) => void;
  onComplete: (s: SlotId) => void;
  onFail: (s: SlotId) => void;
  onFailDay: () => void;
  onDelete: (s: SlotId) => void;
  blockingDays: string[]; colors: Colors;
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
];

function getQuote(): string {
  if (Math.random() < 0.20) return FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)];
  return DAILY_QUOTES[Math.floor(Math.random() * DAILY_QUOTES.length)];
}

export default function DayView({
  dateKey, dayData, canGoBack, canGoForward,
  onPrev, onNext, onGoToToday, onAdd, onEdit, onComplete, onFail, onFailDay, onDelete,
  blockingDays, colors,
}: Props) {

  const past    = isPast(dateKey);
  const today   = isToday(dateKey);
  const future  = isFuture(dateKey);
  const isBlocked = future && blockingDays.length > 0;

  const completedCount = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'completed').length;
  const failedCount    = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'failed').length;
  const resolvedCount  = completedCount + failedCount;
  const plannedCount   = SLOTS.filter(s => dayData.tasks[s.id]?.status === 'planned').length;
  const allDone        = resolvedCount === SLOTS.length;

  // A past day is "fully resolved" when every slot has a non-pending status
  const hasUnresolvedPast = (past) && SLOTS.some(s => {
    const t = dayData.tasks[s.id];
    return !t || t.status === 'planned';
  });

  const [showOverlay, setShowOverlay] = useState(false);
  const [animKey, setAnimKey]         = useState(dateKey);
  const [currentQuote, setCurrentQuote] = useState(() => getQuote());
  const [spamQuote, setSpamQuote]     = useState<string | null>(null);

  const prevCompletedRef = useRef(resolvedCount);
  const prevDateKeyRef   = useRef(dateKey);
  const overlayShownRef  = useRef(false);

  // Stable refs for PanResponder callbacks
  const onPrevRef       = useRef(onPrev);
  const onNextRef       = useRef(onNext);
  const onGoToTodayRef  = useRef(onGoToToday);
  const canGoBackRef    = useRef(canGoBack);
  const canGoForwardRef = useRef(canGoForward);
  useEffect(() => { onPrevRef.current = onPrev; },       [onPrev]);
  useEffect(() => { onNextRef.current = onNext; },       [onNext]);
  useEffect(() => { onGoToTodayRef.current = onGoToToday; }, [onGoToToday]);
  useEffect(() => { canGoBackRef.current = canGoBack; },  [canGoBack]);
  useEffect(() => { canGoForwardRef.current = canGoForward; }, [canGoForward]);

  // All-resolved detection (completed OR failed counts)
  useEffect(() => {
    const dayChanged = prevDateKeyRef.current !== dateKey;
    if (dayChanged) {
      prevCompletedRef.current = resolvedCount;
      prevDateKeyRef.current   = dateKey;
      overlayShownRef.current  = false;
      return;
    }
    // Only show the overlay if ALL slots are completed (not failed)
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

  // Progress bar — counts both completed and failed as "resolved"
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

  // Quote fidget
  const quoteScale = useRef(new Animated.Value(1)).current;
  const { onTap: quoteOnTap } = useFidget(quoteScale);
  const handleQuoteTap = () => {
    quoteOnTap(
      () => {
        const msg = SPAM_RESPONSES[Math.floor(Math.random() * SPAM_RESPONSES.length)];
        setSpamQuote(msg);
      },
      undefined,
    );
  };

  // Quote pop on day change
  const quotePrevRef = useRef(currentQuote);
  useEffect(() => {
    if (quotePrevRef.current !== currentQuote) {
      quotePrevRef.current = currentQuote;
      quoteScale.stopAnimation();
      Animated.sequence([
        Animated.timing(quoteScale, { toValue: 0.93, duration: 55, useNativeDriver: true }),
        Animated.timing(quoteScale, { toValue: 1.04, duration: 55, useNativeDriver: true }),
        Animated.timing(quoteScale, { toValue: 1,    duration: 40, useNativeDriver: true }),
      ]).start();
    }
  }, [currentQuote]);

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
  const { onTap: navCardTap } = useFidget(navCardScale);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMiddlePressIn  = useCallback(() => {
    longPressTimer.current = setTimeout(() => { onGoToTodayRef.current(); }, 500);
  }, []);
  const handleMiddlePressOut = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  }, []);
  const handleMiddlePress    = useCallback(() => {
    if (longPressTimer.current !== null) navCardTap();
  }, [navCardTap]);

  // Skip all unresolved slots on this past day — uses a single atomic save
  const handleSkipDay = useCallback(() => {
    onFailDay();
  }, [onFailDay]);

  const getDayLabel = () => today ? 'TODAY' : past ? 'PAST' : 'UPCOMING';

  // Progress bar colour — mixed failed/complete days use failed colour
  const progressColor = failedCount > 0 && completedCount === 0 ? colors.failed : colors.red;

  return (
    <View style={{ flex: 1 }}>
      <AllCompleteOverlay visible={showOverlay} colors={colors} onDone={() => setShowOverlay(false)} />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Nav card */}
          <View {...swipePan.panHandlers}>
            <View style={[styles.navCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
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
                <Animated.View style={[styles.navMiddleContent, { transform: [{ scale: navCardScale }] }]}>
                  <View style={[styles.dayBadge, {
                    backgroundColor: today ? colors.red : colors.bgElevated,
                    borderColor: today ? colors.red : colors.border,
                  }]}>
                    <Text style={[styles.dayBadgeText, { color: today ? '#FFF' : colors.red }]}>
                      {getDayLabel()}
                    </Text>
                  </View>
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
            </View>
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

          {/* Future-blocked warning */}
          {isBlocked && (
            <View style={[styles.blockWarning, { backgroundColor: colors.redDeep, borderColor: colors.red }]}>
              <AlertTriangle size={14} color={colors.red} />
              {/* BLOCK_WARNING_TEXT */}
              <Text style={[styles.blockText, { color: colors.red }]}>
                Fill in {blockingDays.length} past {blockingDays.length > 1 ? 'days' : 'day'} before planning ahead
              </Text>
            </View>
          )}

          {/* SKIP_DAY_BTN — shown on past days that still have unresolved slots */}
          {past && hasUnresolvedPast && (
            <TouchableOpacity
              style={[styles.skipDayBtn, { borderColor: colors.failed, backgroundColor: `${colors.failed}12` }]}
              onPress={handleSkipDay}
              activeOpacity={0.75}
            >
              <SkipForward size={14} color={colors.failed} />
              <Text style={[styles.skipDayText, { color: colors.failed }]}>SKIP DAY</Text>
              <Text style={[styles.skipDaySubText, { color: colors.failed }]}>  — mark all unfilled slots as failed</Text>
            </TouchableOpacity>
          )}

          {/* Slot cards */}
          {SLOTS.map((slot, index) => (
            <SlotCard
              key={slot.id} slotId={slot.id} label={slot.label} timeRange={slot.timeRange}
              task={dayData.tasks[slot.id]} dateKey={dateKey}
              isToday={today} isPast={past} isFuture={future}
              onAdd={onAdd} onEdit={onEdit} onComplete={onComplete}
              onFail={onFail} onDelete={onDelete}
              blocked={isBlocked} colors={colors} index={index} animKey={animKey}
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
  blockWarning:  { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, padding: 12, marginBottom: 14, borderWidth: 1 },
  blockText:     { fontSize: 12, fontWeight: '600', flex: 1 },
  skipDayBtn:    { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1.5, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14 },
  skipDayText:   { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  skipDaySubText:{ fontSize: 11, fontWeight: '400', opacity: 0.8 },
  quoteCard:     { marginTop: 8, borderRadius: 8, borderWidth: 1, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  quoteSymbol:   { fontSize: 16, fontWeight: '900' },
  quoteText:     { flex: 1, fontSize: 12, letterSpacing: 0.4, textAlign: 'center', lineHeight: 18 },
});
