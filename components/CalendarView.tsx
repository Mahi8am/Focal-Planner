/**
 * CalendarView.tsx
 * Calendar grid + day detail panel.
 *
 * Changes:
 * - BrokenTaskText: ALL text on the card falls (slot label + task/dash), not just task title
 * - Detail card pulses on mount (tab switch) AND on selected day change
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Modal, Pressable, PanResponder,
} from 'react-native';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle, XCircle } from 'lucide-react-native';
import { AppStorage } from '../types';
import { Colors, SLOTS } from '../constants';
import {
  toDateKey, todayKey, getDaysInMonth, getFirstDayOfMonth,
  isPast, formatDisplayDate, fromDateKey,
} from '../utils/dateUtils';
import { useFidget } from '../hooks/useFidget';

interface Props { data: AppStorage; onGoToDay: (d: string) => void; colors: Colors; }

const WEEKDAYS     = ['S','M','T','W','T','F','S'];
const MONTHS       = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/** A single piece of text that can fall/scatter as part of the broken animation */
function BrokenChar({ char, broken, color, fontSize, fontWeight, delay }: {
  char: string; broken: boolean; color: string;
  fontSize: number; fontWeight: string; delay: number;
}) {
  const y   = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const op  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (broken) {
      Animated.parallel([
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(y, { toValue: 40 + Math.random() * 30, useNativeDriver: true, tension: 80, friction: 6 }),
        ]),
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(rot, { toValue: (Math.random() - 0.5) * 60, duration: 300, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(delay + 100),
          Animated.timing(op, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      ]).start();
    } else {
      y.setValue(0); rot.setValue(0); op.setValue(1);
    }
  }, [broken]);

  const rotate = rot.interpolate({ inputRange: [-60, 60], outputRange: ['-60deg', '60deg'] });

  return (
    <Animated.Text style={{
      fontSize, fontWeight: fontWeight as any, color,
      opacity: op,
      transform: [{ translateY: y }, { rotate }],
    }}>
      {char}
    </Animated.Text>
  );
}

/** Renders a line of text character-by-character so each can fall individually */
function BrokenLine({ text, broken, color, fontSize, fontWeight, delayOffset = 0 }: {
  text: string; broken: boolean; color: string;
  fontSize: number; fontWeight: string; delayOffset?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {text.split('').map((char, i) => (
        <BrokenChar
          key={i} char={char} broken={broken} color={color}
          fontSize={fontSize} fontWeight={fontWeight}
          delay={delayOffset + Math.random() * 120}
        />
      ))}
    </View>
  );
}

function pulseScale(anim: Animated.Value) {
  anim.stopAnimation();
  Animated.sequence([
    Animated.timing(anim, { toValue: 0.93, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 1.04, duration: 55, useNativeDriver: true }),
    Animated.timing(anim, { toValue: 1,    duration: 40, useNativeDriver: true }),
  ]).start();
}

function DayCell({ day, dateKey, isTodayCell, isSelected, past, data, colors, onPress, entryDelay }: {
  day: number; dateKey: string; isTodayCell: boolean; isSelected: boolean;
  past: boolean; data: AppStorage; colors: Colors; onPress: () => void; entryDelay: number;
}) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacity   = useRef(new Animated.Value(0)).current;
  const rot       = useRef(new Animated.Value((Math.random() - 0.5) * 28)).current;
  const bounce    = useRef(new Animated.Value(1)).current;
  const mounted   = useRef(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.timing(opacity,   { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(rot,       { toValue: 0, tension: 180, friction: 9, useNativeDriver: true }),
      ]).start();
    }, entryDelay);
  }, []);

  const handlePress = () => {
    bounce.stopAnimation();
    Animated.sequence([
      Animated.timing(bounce, { toValue: 0.88, duration: 55, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1.06, duration: 55, useNativeDriver: true }),
      Animated.timing(bounce, { toValue: 1,    duration: 40, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const rotate  = rot.interpolate({ inputRange: [-28, 28], outputRange: ['-28deg', '28deg'] });
  const dayData = data.days[dateKey];

  return (
    <Animated.View style={[styles.cellOuter, { opacity, transform: [{ scale: Animated.multiply(scaleAnim, bounce) }, { rotate }] }]}>
      <TouchableOpacity
        style={[
          styles.cellInner,
          isSelected  && { borderWidth: 1.5, borderColor: colors.red, backgroundColor: colors.redGlow, borderRadius: 8 },
          isTodayCell && !isSelected && { backgroundColor: colors.bgElevated, borderRadius: 8 },
        ]}
        onPress={handlePress} activeOpacity={1}
      >
        <Text style={[styles.dayNum, { color: isTodayCell ? colors.red : !past ? colors.textMuted : colors.text }, (isTodayCell || isSelected) && { fontWeight: '900' }]}>
          {day}
        </Text>
        <View style={styles.dots}>
          {SLOTS.map(slot => {
            const t = dayData?.tasks[slot.id];
            const dotColor = t?.status === 'completed'
              ? colors.completed
              : t?.status === 'failed'
                ? colors.failed
                : t?.status === 'planned'
                  ? colors.red
                  : 'transparent';
            return <View key={slot.id} style={[styles.dot, { backgroundColor: dotColor }]} />;
          })}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function CalendarView({ data, onGoToDay, colors }: Props) {
  const now   = new Date();
  const today = todayKey();

  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(today);
  const [showYearPicker,  setShowYearPicker]  = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [gridKey, setGridKey] = useState(0);
  const [broken, setBroken]   = useState(false);
  const brokenLockRef         = useRef(false);

  const selectedDateKeyRef = useRef(selectedDateKey);
  const viewMonthRef       = useRef(viewMonth);
  const viewYearRef        = useRef(viewYear);
  useEffect(() => { selectedDateKeyRef.current = selectedDateKey; }, [selectedDateKey]);
  useEffect(() => { viewMonthRef.current = viewMonth; },           [viewMonth]);
  useEffect(() => { viewYearRef.current  = viewYear;  },           [viewYear]);

  const monthScale = useRef(new Animated.Value(1)).current;
  const yearScale  = useRef(new Animated.Value(1)).current;

  const bounceLabel = (anim: Animated.Value) => {
    anim.stopAnimation();
    Animated.sequence([
      Animated.timing(anim, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, tension: 180, friction: 8, useNativeDriver: true }),
    ]).start();
  };

  const detailSlideX  = useRef(new Animated.Value(0)).current;
  const detailOpacity = useRef(new Animated.Value(1)).current;
  const detailScale   = useRef(new Animated.Value(1)).current;
  const prevSelectedRef = useRef(selectedDateKey);

  // Pulse the detail card on mount (tab switch)
  useEffect(() => {
    pulseScale(detailScale);
  }, []);

  const animateDetailChange = useCallback((newKey: string) => {
    const dir = newKey > prevSelectedRef.current ? -1 : 1;
    prevSelectedRef.current = newKey;
    if (brokenLockRef.current) { setBroken(false); brokenLockRef.current = false; }

    detailSlideX.setValue(dir * 40);
    detailOpacity.setValue(0.5);
    setSelectedDateKey(newKey);

    Animated.parallel([
      Animated.timing(detailSlideX,  { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(detailOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Also pulse the scale on day change
    pulseScale(detailScale);
  }, []);

  const changeMonthFn = useCallback((newYear: number, newMonth: number, prevYear: number, prevMonth: number) => {
    const isCurrentMonth = newYear === now.getFullYear() && newMonth === now.getMonth();
    const newSelected = isCurrentMonth ? today : toDateKey(new Date(newYear, newMonth, 1));
    if (newMonth !== prevMonth) bounceLabel(monthScale);
    if (newYear  !== prevYear)  bounceLabel(yearScale);
    setViewYear(newYear);
    setViewMonth(newMonth);
    setSelectedDateKey(newSelected);
    prevSelectedRef.current = newSelected;
    setGridKey(k => k + 1);
    pulseScale(detailScale);
  }, [today, now]);

  const changeMonthRef  = useRef(changeMonthFn);
  useEffect(() => { changeMonthRef.current = changeMonthFn; }, [changeMonthFn]);
  const animateDetailRef = useRef(animateDetailChange);
  useEffect(() => { animateDetailRef.current = animateDetailChange; }, [animateDetailChange]);

  const prevMonth = useCallback(() => {
    const y = viewYearRef.current, m = viewMonthRef.current;
    if (m === 0) changeMonthRef.current(y - 1, 11, y, m);
    else         changeMonthRef.current(y, m - 1, y, m);
  }, []);
  const nextMonth = useCallback(() => {
    const y = viewYearRef.current, m = viewMonthRef.current;
    if (m === 11) changeMonthRef.current(y + 1, 0, y, m);
    else          changeMonthRef.current(y, m + 1, y, m);
  }, []);

  const navigateSelectedDay = useCallback((dir: number) => {
    const cur = fromDateKey(selectedDateKeyRef.current);
    cur.setDate(cur.getDate() + dir);
    const newKey = toDateKey(cur);
    if (cur.getMonth() !== viewMonthRef.current || cur.getFullYear() !== viewYearRef.current) {
      changeMonthRef.current(cur.getFullYear(), cur.getMonth(), viewYearRef.current, viewMonthRef.current);
    }
    animateDetailRef.current(newKey);
  }, []);

  const SWIPE_THRESH = 45;
  const gridPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 50,
    onPanResponderRelease: (_, g) => {
      if      (g.dx < -SWIPE_THRESH) nextMonth();
      else if (g.dx >  SWIPE_THRESH) prevMonth();
    },
  })).current;

  const detailPan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dy) < 50,
    onPanResponderRelease: (_, g) => {
      if      (g.dx < -SWIPE_THRESH) navigateSelectedDay(1);
      else if (g.dx >  SWIPE_THRESH) navigateSelectedDay(-1);
    },
  })).current;

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay    = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const years = Array.from({ length: 21 }, (_, i) => now.getFullYear() - 5 + i);

  const { onTap: detailTap } = useFidget(detailScale);
  const handleDetailTap = () => {
    if (brokenLockRef.current) return;
    detailTap(() => { setBroken(true); brokenLockRef.current = true; }, undefined);
  };

  const selectedDayData = data.days[selectedDateKey];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Year Picker */}
      <Modal visible={showYearPicker} transparent animationType="fade" onRequestClose={() => setShowYearPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowYearPicker(false)}>
          <View style={[styles.pickerBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.textMuted }]}>SELECT YEAR</Text>
            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {years.map(y => (
                <TouchableOpacity key={y} style={[styles.pickerItem, y === viewYear && { backgroundColor: colors.red }]}
                  onPress={() => { changeMonthFn(y, viewMonth, viewYear, viewMonth); setShowYearPicker(false); }}>
                  <Text style={[styles.pickerItemText, { color: y === viewYear ? '#FFF' : colors.text }]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Month Picker */}
      <Modal visible={showMonthPicker} transparent animationType="fade" onRequestClose={() => setShowMonthPicker(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowMonthPicker(false)}>
          <View style={[styles.pickerBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.pickerTitle, { color: colors.textMuted }]}>SELECT MONTH</Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {MONTHS.map((m, i) => (
                <TouchableOpacity key={m} style={[styles.pickerItem, i === viewMonth && { backgroundColor: colors.red }]}
                  onPress={() => { changeMonthFn(viewYear, i, viewYear, viewMonth); setShowMonthPicker(false); }}>
                  <Text style={[styles.pickerItemText, { color: i === viewMonth ? '#FFF' : colors.text }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Month nav */}
      <View style={[styles.monthNav, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthYearRow}>
          <TouchableOpacity onPress={() => setShowMonthPicker(true)} style={[styles.monthBtn, { borderColor: colors.red }]} activeOpacity={0.7}>
            <Animated.Text style={[styles.monthBtnText, { color: colors.text, transform: [{ scale: monthScale }] }]}>
              {MONTHS_SHORT[viewMonth]}
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowYearPicker(true)} style={[styles.monthBtn, { borderColor: colors.border }]} activeOpacity={0.7}>
            <Animated.Text style={[styles.monthBtnText, { color: colors.red, transform: [{ scale: yearScale }] }]}>
              {viewYear}
            </Animated.Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
          <ChevronRight size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d, i) => <Text key={i} style={[styles.weekday, { color: colors.textMuted }]}>{d}</Text>)}
      </View>

      {/* Grid */}
      <View style={styles.grid} {...gridPan.panHandlers}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}-${gridKey}`} style={styles.cellOuter} />;
          const dateKey     = toDateKey(new Date(viewYear, viewMonth, day));
          const isTodayCell = dateKey === today;
          const isSelected  = dateKey === selectedDateKey;
          const past        = isPast(dateKey);
          const row = Math.floor(idx / 7);
          const col = idx % 7;
          return (
            <DayCell key={`${dateKey}-${gridKey}`}
              day={day} dateKey={dateKey} isTodayCell={isTodayCell}
              isSelected={isSelected} past={past} data={data} colors={colors}
              onPress={() => animateDetailChange(dateKey)}
              entryDelay={row * 35 + col * 10}
            />
          );
        })}
      </View>

      {/* Legend */}
      <View style={[styles.legend, { borderTopColor: colors.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.completed }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Done</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.red }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Planned</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.failed }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Skipped</Text>
        </View>
      </View>

      {/* Detail panel */}
      <Animated.View style={[styles.dayDetail, {
        backgroundColor: colors.bgCard, borderColor: colors.border,
        transform: [{ translateX: detailSlideX }, { scale: detailScale }],
        opacity: detailOpacity, overflow: 'hidden',
      }]} {...detailPan.panHandlers}>
        <TouchableOpacity activeOpacity={1} onPress={handleDetailTap} style={{ flexDirection: 'row', flex: 1 }}>
          <View style={[styles.dayDetailStripe, { backgroundColor: colors.red }]} />
          <View style={styles.dayDetailInner}>

            {/* Header — date text also falls when broken */}
            <View style={styles.dayDetailHeader}>
              {broken ? (
                <BrokenLine
                  text={formatDisplayDate(selectedDateKey)}
                  broken={broken} color={colors.text}
                  fontSize={13} fontWeight="700" delayOffset={0}
                />
              ) : (
                <Text style={[styles.dayDetailDate, { color: colors.text }]}>
                  {formatDisplayDate(selectedDateKey)}
                </Text>
              )}
              <TouchableOpacity style={[styles.goBtn, { backgroundColor: colors.red }]} onPress={() => onGoToDay(selectedDateKey)} activeOpacity={0.8}>
                <Text style={styles.goBtnText}>OPEN</Text>
                <ArrowRight size={13} color="#FFF" />
              </TouchableOpacity>
            </View>

            {SLOTS.map((slot, i) => {
              const task       = selectedDayData?.tasks[slot.id];
              const isFailed    = task?.status === 'failed';
              const isCompleted = task?.status === 'completed';

              const dotColor = isFailed
                ? colors.failed
                : isCompleted ? colors.completed
                : task?.status === 'planned' ? colors.red
                : colors.bgElevated;

              const taskColor  = isFailed ? colors.failed : task ? colors.text : colors.textMuted;
              const labelColor = colors.textMuted;

              return (
                <View key={slot.id} style={[styles.detailSlot, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <View style={[styles.detailDot, { backgroundColor: dotColor }]} />
                  <View style={styles.detailContent}>
                    {/* Slot label — also falls when broken */}
                    {broken ? (
                      <BrokenLine
                        text={slot.label}
                        broken={broken} color={labelColor}
                        fontSize={9} fontWeight="700" delayOffset={i * 40}
                      />
                    ) : (
                      <Text style={[styles.detailLabel, { color: labelColor }]}>{slot.label}</Text>
                    )}

                    {/* Task text or dash — falls when broken */}
                    {broken ? (
                      <BrokenLine
                        text={task?.title ?? '—'}
                        broken={broken}
                        color={taskColor}
                        fontSize={13} fontWeight="600"
                        delayOffset={i * 40 + 20}
                      />
                    ) : (
                      <Text style={[styles.detailTask, {
                        color: taskColor,
                        fontStyle: isFailed ? 'italic' : 'normal',
                      }]}>
                        {task?.title ?? '—'}
                      </Text>
                    )}
                  </View>
                  {isCompleted && <CheckCircle size={16} color={colors.completed} />}
                  {isFailed    && <XCircle     size={16} color={colors.failed} />}
                  {task?.status === 'planned' && <View style={[styles.plannedDot, { backgroundColor: colors.red }]} />}
                </View>
              );
            })}
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },
  monthNav:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  navBtn:    { paddingHorizontal: 18, paddingVertical: 14 },
  monthYearRow: { flexDirection: 'row', gap: 8 },
  monthBtn:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 20, paddingVertical: 10 },
  monthBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  weekRow:   { flexDirection: 'row', marginBottom: 4 },
  weekday:   { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  cellOuter: { width: `${100 / 7}%`, aspectRatio: 0.88, padding: 2 },
  cellInner: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  dayNum:    { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  dots:      { flexDirection: 'row', gap: 2 },
  dot:       { width: 4, height: 4, borderRadius: 2 },
  legend:    { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 10, borderTopWidth: 1, marginBottom: 14 },
  legendItem:{ flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText:{ fontSize: 11 },
  dayDetail: { borderRadius: 10, borderWidth: 1 },
  dayDetailStripe: { width: 5 },
  dayDetailInner:  { flex: 1, padding: 14 },
  dayDetailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dayDetailDate:   { fontSize: 13, fontWeight: '700', flex: 1 },
  goBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  goBtnText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  detailSlot:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  detailDot:     { width: 8, height: 8, borderRadius: 4 },
  detailContent: { flex: 1 },
  detailLabel:   { fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 2 },
  detailTask:    { fontSize: 13, fontWeight: '600' },
  plannedDot:    { width: 10, height: 10, borderRadius: 5 },
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', alignItems: 'center' },
  pickerBox:     { width: 260, borderRadius: 14, borderWidth: 1, padding: 8 },
  pickerTitle:   { fontSize: 10, fontWeight: '800', letterSpacing: 2, textAlign: 'center', paddingVertical: 10 },
  pickerItem:    { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 8 },
  pickerItemText:{ fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
