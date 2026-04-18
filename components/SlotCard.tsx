/**
 * SlotCard.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Individual time-slot card on the Planner page.
 *
 * CARD BEHAVIOUR RULES:
 *   FUTURE  → Task name editable at any time. No tick button.
 *   TODAY   → Task name editable. Tick button to mark complete/incomplete.
 *   PAST    → If named but not ticked → auto-completed on transition.
 *             If unnamed → becomes "skipped" (cross icon, failed color).
 *             If skipped and then named → becomes completed.
 *             If before install date and unnamed → stays empty (no skipped).
 *
 * TEXT YOU CAN EDIT:
 *   "SKIPPED"              → badge shown on skipped tasks (search: SKIPPED_BADGE)
 *   "What did you do?"     → past-day input placeholder (search: PAST_PLACEHOLDER)
 *   "Plan your task..."    → future input placeholder   (search: FUTURE_PLACEHOLDER)
 *   "Fill in what you did" → empty past slot prompt     (search: EMPTY_PAST_PROMPT)
 *   "Add task"             → empty future slot prompt   (search: EMPTY_FUTURE_PROMPT)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Keyboard,
} from 'react-native';
import { CheckCircle, Circle, Edit3, Trash2, Plus, Clock, XCircle } from 'lucide-react-native';
import { Task, SlotId } from '../types';
import { Colors } from '../constants';
import { useFidget } from '../hooks/useFidget';

interface Props {
  slotId: SlotId; label: string; timeRange: string;
  task?: Task; dateKey: string;
  isToday: boolean; isPast: boolean; isFuture: boolean;
  isBeforeInstall: boolean;
  onAdd: (slotId: SlotId, title: string) => void;
  onEdit: (slotId: SlotId, title: string) => void;
  onComplete: (slotId: SlotId) => void;
  onFail: (slotId: SlotId) => void;
  onDelete: (slotId: SlotId) => void;
  blocked?: boolean; colors: Colors; index: number; animKey: string;
}

const ENTRY_OFFSETS = [{ x: -80, y: -20 }, { x: 80, y: -20 }, { x: 0, y: 60 }];

export default function SlotCard({
  slotId, label, timeRange, task, isToday, isPast, isFuture,
  isBeforeInstall,
  onAdd, onEdit, onComplete, onFail, onDelete, blocked, colors, index, animKey,
}: Props) {

  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<TextInput>(null);

  // Entry animation
  const entryX       = useRef(new Animated.Value(ENTRY_OFFSETS[index].x)).current;
  const entryY       = useRef(new Animated.Value(ENTRY_OFFSETS[index].y)).current;
  const entryOpacity = useRef(new Animated.Value(0)).current;
  const entryScale   = useRef(new Animated.Value(0.88)).current;

  // Complete flash
  const flashAnim  = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(1)).current;

  // Fidget
  const cardScale = useRef(new Animated.Value(1)).current;
  const { onTap } = useFidget(cardScale);

  // Button press
  const btnScale    = useRef(new Animated.Value(1)).current;
  const pressBtnIn  = () => Animated.timing(btnScale, { toValue: 0.88, duration: 60, useNativeDriver: true }).start();
  const pressBtnOut = () => Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 7 }).start();

  useEffect(() => {
    entryX.setValue(ENTRY_OFFSETS[index].x);
    entryY.setValue(ENTRY_OFFSETS[index].y);
    entryOpacity.setValue(0);
    entryScale.setValue(0.88);
    const delay = index * 90;
    Animated.parallel([
      Animated.timing(entryOpacity, { toValue: 1, duration: 220, delay, useNativeDriver: true }),
      Animated.spring(entryX,    { toValue: 0, delay, useNativeDriver: true, tension: 140, friction: 10 }),
      Animated.spring(entryY,    { toValue: 0, delay, useNativeDriver: true, tension: 140, friction: 10 }),
      Animated.spring(entryScale,{ toValue: 1, delay, useNativeDriver: true, tension: 160, friction: 9 }),
    ]).start();
  }, [animKey]);

  const animateComplete = () => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60,  useNativeDriver: false }),
      Animated.timing(flashAnim, { toValue: 0, duration: 220, useNativeDriver: false }),
    ]).start();
    Animated.sequence([
      Animated.timing(checkScale, { toValue: 1.5, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start();
  };

  const isSkipped   = task?.status === 'failed';
  const isCompleted = task?.status === 'completed';
  const isPlanned   = task?.status === 'planned';
  const isEmpty     = !task;

  // All tasks have editable names at all times
  // Show input when empty OR actively editing
  const showInput = isEmpty || editing;

  // Tick/complete toggle: today only, task must exist and not be skipped
  const canComplete = isToday && !!task && !isSkipped;

  // Edit pencil: shown whenever a task exists (all days, all states)
  const canEdit = !!task;

  // Delete: future planned tasks only
  const canDelete = isFuture && isPlanned;

  const handleSubmit = () => {
    Keyboard.dismiss();
    const val = inputVal.trim();

    if (editing && task) {
      if (!val) {
        // Name erased:
        // Future or Today → delete back to empty slot
        // Past → becomes skipped with no name
        if (isPast) {
          onFail(slotId);
        } else {
          onDelete(slotId);
        }
      } else {
        onEdit(slotId, val);
      }
    } else {
      if (val) onAdd(slotId, val);
    }

    setInputVal(''); setEditing(false);
  };

  // Stripe colour: skipped = failed color, completed = completed color, else accent
  const stripeColor = isSkipped
    ? colors.failed
    : isCompleted ? colors.completed : colors.red;

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', `${colors.red}30`],
  });

  const combinedScale = Animated.multiply(entryScale, cardScale);

  return (
    <Animated.View style={[styles.cardWrap, {
      opacity: entryOpacity,
      transform: [{ translateX: entryX }, { translateY: entryY }, { scale: combinedScale }],
    }]}>
      <TouchableOpacity activeOpacity={1} onPress={() => onTap()}>
        <View style={[
          styles.card,
          { backgroundColor: colors.bgCard, borderColor: colors.border },
        ]}>
          <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: flashBg, zIndex: 1 }]} pointerEvents="none" />

          <View style={styles.inner}>
            {/* Header row */}
            <View style={styles.header}>
              <View style={styles.labelRow}>
                <Clock size={10} color={colors.textMuted} />
                <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeRange}</Text>
              </View>

              {/* Badges */}
              {isCompleted && (
                <View style={[styles.badge, { backgroundColor: colors.completedGlow }]}>
                  <Text style={[styles.badgeText, { color: colors.completed }]}>DONE</Text>
                </View>
              )}
              {/* SKIPPED_BADGE */}
              {isSkipped && (
                <View style={[styles.badge, { backgroundColor: `${colors.failed}22` }]}>
                  <XCircle size={10} color={colors.failed} style={{ marginRight: 3 }} />
                  <Text style={[styles.badgeText, { color: colors.failed }]}>SKIPPED</Text>
                </View>
              )}
            </View>

            {/* Content area */}
            {showInput && !blocked ? (
              <View style={styles.inputRow}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { color: colors.text, borderBottomColor: colors.red }]}
                  value={inputVal}
                  onChangeText={setInputVal}
                  placeholder={isPast ? 'What did you do?' : 'Plan your task...'}/* PAST_PLACEHOLDER / FUTURE_PLACEHOLDER */
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  blurOnSubmit={false}
                  autoFocus={editing}
                />
                <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: colors.red }]}
                    onPress={handleSubmit} onPressIn={pressBtnIn} onPressOut={pressBtnOut} activeOpacity={1}
                  >
                    <Plus size={18} color="#FFF" />
                  </TouchableOpacity>
                </Animated.View>
              </View>

            ) : task ? (
              <View style={styles.taskRow}>
                <Text
                  style={[
                    styles.taskTitle,
                    { color: isSkipped ? colors.failed : isCompleted ? colors.textSub : colors.text },
                    isSkipped && styles.taskTitleSkipped,
                  ]}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>

                <View style={styles.actions}>
                  {/* Complete toggle (today only, not skipped) */}
                  {canComplete && (
                    <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                      <TouchableOpacity
                        onPress={() => { animateComplete(); onComplete(slotId); }}
                        onPressIn={pressBtnIn} onPressOut={pressBtnOut} activeOpacity={1}
                      >
                        {isCompleted
                          ? <CheckCircle size={26} color={colors.completed} />
                          : <Circle     size={26} color={colors.red} />}
                      </TouchableOpacity>
                    </Animated.View>
                  )}

                  {/* Completed icon for non-today completed */}
                  {!isToday && isCompleted && (
                    <CheckCircle size={20} color={colors.completed} />
                  )}

                  {/* Skipped icon for past skipped tasks */}
                  {!isToday && isSkipped && (
                    <XCircle size={20} color={colors.failed} />
                  )}

                  {/* Edit pencil — available for ALL tasks at all times */}
                  {canEdit && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => {
                        // For skipped tasks: start with empty input so user can give it a name
                        setInputVal(isSkipped ? '' : task.title);
                        setEditing(true);
                        setTimeout(() => inputRef.current?.focus(), 80);
                      }}
                      onPressIn={pressBtnIn} onPressOut={pressBtnOut} activeOpacity={1}
                    >
                      <Edit3 size={15} color={isSkipped ? colors.failed : colors.textMuted} />
                    </TouchableOpacity>
                  )}

                  {/* Delete future planned tasks */}
                  {canDelete && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onDelete(slotId)}
                      onPressIn={pressBtnIn} onPressOut={pressBtnOut} activeOpacity={1}
                    >
                      <Trash2 size={15} color={colors.red} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

            ) : blocked ? (
              <View style={styles.emptySlot}>
                <Text style={[styles.blockedText, { color: colors.textMuted }]}>LOCKED</Text>
              </View>
            ) : (
              /* Empty slot — tap to open input */
              <TouchableOpacity
                style={styles.emptySlot}
                onPress={() => {
                  setEditing(false);
                  setInputVal('');
                  setTimeout(() => inputRef.current?.focus(), 80);
                }}
                activeOpacity={0.6}
              >
                <Plus size={14} color={colors.red} />
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  {isPast ? 'Fill in what you did' : 'Add task'}{/* EMPTY_PAST_PROMPT / EMPTY_FUTURE_PROMPT */}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap:  { marginBottom: 14 },
  card:      { borderRadius: 8, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', minHeight: 100, elevation: 3, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
  stripe:    { width: 5 },
  inner:     { flex: 1, padding: 14, zIndex: 2 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  label:     { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  timeText:  { fontSize: 10, letterSpacing: 0.5 },
  badge:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input:     { flex: 1, fontSize: 15, borderBottomWidth: 1.5, paddingVertical: 6, fontWeight: '500' },
  submitBtn: { borderRadius: 8, padding: 9 },
  taskRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: '700', flex: 1, lineHeight: 22 },
  taskTitleSkipped: { fontStyle: 'italic', opacity: 0.9 },
  actions:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 10 },
  actionBtn: { padding: 4 },
  emptySlot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  emptyText: { fontSize: 13, fontStyle: 'italic' },
  blockedText: { fontSize: 10, letterSpacing: 2, fontWeight: '700' },
});
