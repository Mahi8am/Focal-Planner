/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * ROOT COMPONENT — handles navigation, modals, and tab management.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  TEXT YOU CAN EDIT — search for the section tags below                 ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  [ONBOARDING_MODAL]   Welcome popup shown on first install             ║
 * ║  [PAST_DAY_MODAL]     Warning shown when past days need filling        ║
 * ║  [RESET_MODAL]        Confirmation shown before wiping all data        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CalendarDays, BookOpen, Settings, HelpCircle } from 'lucide-react-native';
import DayView from './components/DayView';
import CalendarView from './components/CalendarView';
import SettingsView from './components/SettingsView';
import FocalModal, { FeatureRow } from './components/FocalModal';
import { useStorage } from './hooks/useStorage';
import { useTheme } from './hooks/useTheme';
import { todayKey, isFuture, fromDateKey, toDateKey } from './utils/dateUtils';
import { FUNNY_NAMES, STORAGE_KEY, INSTALL_DATE_KEY, ONBOARDING_KEY } from './constants';
import { SlotId } from './types';

type Tab = 'planner' | 'calendar' | 'settings';
const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: 'planner',  icon: BookOpen,     label: 'PLANNER'  },
  { id: 'calendar', icon: CalendarDays, label: 'CALENDAR' },
  { id: 'settings', icon: Settings,     label: 'SETTINGS' },
];

const REAL_NAME = { title: 'FOCAL', sub: 'PLANNER' };

function AppInner() {
  const manualNavRef = useRef(false);
  const insets = useSafeAreaInsets();
  const [tab, setTab]                       = useState<Tab>('planner');
  const [currentDateKey, setCurrentDateKey] = useState(todayKey());
  const [resetKey, setResetKey]             = useState(0);

  // ── Modal visibility ───────────────────────────────────────────────────────
  const [showOnboarding,  setShowOnboarding]  = useState(false);
  const [showPastWarning, setShowPastWarning] = useState(false);
  const [showResetModal,  setShowResetModal]  = useState(false);
  const pastWarningShownRef = useRef(false);

  const {
    colors, toggleTheme, isDark, colorTheme, setColorTheme,
    completedColor, setCompletedColor,
    failedColor, setFailedColor,
  } = useTheme();
  const {
    data, loaded, getDay, addTask, editTask, completeTask,
    failTask, failAllUnresolvedSlots, deleteTask, getBlockingDays, canPlanFuture,
  } = useStorage(resetKey);

  // ── Check onboarding on first load ─────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(val => {
      if (!val) {
        setShowOnboarding(true);
        AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      }
    });
  }, []);

  // ── Navigate to first blocking past day once data is loaded ────────────────
  useEffect(() => {
  if (!loaded) return;

  // 🚫 Skip override if user manually navigated
  if (manualNavRef.current) {
    manualNavRef.current = false;
    return;
  }

  const blocking = getBlockingDays();
  if (blocking.length > 0) {
    setCurrentDateKey(blocking[0]);
    setTab('planner');

    if (!pastWarningShownRef.current) {
      pastWarningShownRef.current = true;
      setShowPastWarning(true);
    }
  }
}, [loaded]);

  // ── Header easter egg ──────────────────────────────────────────────────────
  const tabScales        = useRef(TABS.map(() => new Animated.Value(1))).current;
  const [headerName, setHeaderName] = useState(REAL_NAME);
  const usedFunnyIdx     = useRef<number[]>([]);
  const headerInnerScale = useRef(new Animated.Value(1)).current;
  const headerTapTimes   = useRef<number[]>([]);
  const headerTiredLock  = useRef(false);

  const getNextFunnyName = () => {
    if (usedFunnyIdx.current.length >= FUNNY_NAMES.length) usedFunnyIdx.current = [];
    const available = FUNNY_NAMES.filter((_, i) => !usedFunnyIdx.current.includes(i));
    const pick = available[Math.floor(Math.random() * available.length)];
    usedFunnyIdx.current.push(FUNNY_NAMES.indexOf(pick));
    return pick;
  };

  const handleHeaderPress = () => {
    if (headerTiredLock.current) return;
    const now = Date.now();
    headerTapTimes.current = headerTapTimes.current.filter(t => now - t < 3000).concat(now);
    if (headerTapTimes.current.length >= 15) {
      headerTapTimes.current = [];
      headerTiredLock.current = true;
      setHeaderName(getNextFunnyName());
      headerInnerScale.stopAnimation();
      Animated.sequence([
        Animated.spring(headerInnerScale, { toValue: 0.82, useNativeDriver: true, tension: 300, friction: 7 }),
        Animated.spring(headerInnerScale, { toValue: 1.16, useNativeDriver: true, tension: 200, friction: 6 }),
        Animated.spring(headerInnerScale, { toValue: 1,    useNativeDriver: true, tension: 180, friction: 8 }),
      ]).start(() => { headerTiredLock.current = false; });
    } else {
      headerInnerScale.stopAnimation();
      Animated.sequence([
        Animated.timing(headerInnerScale, { toValue: 0.93, duration: 55, useNativeDriver: true }),
        Animated.timing(headerInnerScale, { toValue: 1.04, duration: 55, useNativeDriver: true }),
        Animated.timing(headerInnerScale, { toValue: 1,    duration: 40, useNativeDriver: true }),
      ]).start();
    }
  };

  const resetHeaderName = useCallback(() => setHeaderName(REAL_NAME), []);

  const switchTab = useCallback((newTab: Tab) => {
    const idx = TABS.findIndex(t => t.id === newTab);
    Animated.sequence([
      Animated.timing(tabScales[idx], { toValue: 1.2, duration: 80, useNativeDriver: true }),
      Animated.spring(tabScales[idx], { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    // if (newTab === 'planner') {
    //   // Respect the hard lock — if there are blocking past days, go there, not today
    //   const blocking = getBlockingDays();
    //   setCurrentDateKey(blocking.length > 0 ? blocking[0] : todayKey());
    //   resetHeaderName();
    // }
    setTab(newTab);
  },  [tabScales]);

  // ── Reset (now uses themed modal instead of system Alert) ─────────────────
  const handleReset = useCallback(async () => {
    const today = todayKey();
    await AsyncStorage.multiSet([
      [STORAGE_KEY,      JSON.stringify({ days: {} })],
      [INSTALL_DATE_KEY, today],
    ]);
    setCurrentDateKey(today);
    resetHeaderName();
    setTab('planner');
    pastWarningShownRef.current = false;
    setResetKey(k => k + 1);
  }, [resetHeaderName]);

  const handleGoToToday = useCallback(() => {
    setCurrentDateKey(todayKey());
    resetHeaderName();
  }, [resetHeaderName]);

  if (!loaded) return (
    <View style={[styles.loading, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <ActivityIndicator color={colors.red} size="large" />
    </View>
  );

  const dayData      = getDay(currentDateKey);
  const blockingDays = getBlockingDays();

  const handlePrev = () => {
    const d = fromDateKey(currentDateKey); d.setDate(d.getDate() - 1);
    setCurrentDateKey(toDateKey(d)); resetHeaderName();
  };
  const handleNext = () => {
    if (!isFuture(currentDateKey) && !canPlanFuture()) return;
    const d = fromDateKey(currentDateKey); d.setDate(d.getDate() + 1);
    setCurrentDateKey(toDateKey(d)); resetHeaderName();
  };
  const handleGoToDay = (dateKey: string) => {
  manualNavRef.current = true;   // 👈 IMPORTANT
  setCurrentDateKey(dateKey);
  resetHeaderName();
  switchTab('planner');
};

  const isFunnyName  = headerName.title !== REAL_NAME.title;
  const warningColor = isDark ? '#FFFFFF' : colors.red;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgCard}
        translucent={false}
      />

      {/* ── [ONBOARDING_MODAL] ─────────────────────────────────────────────
           Edit the title, FeatureRow entries, and button label here.
      ─────────────────────────────────────────────────────────────────────── */}
      <FocalModal
        visible={showOnboarding}
        colors={colors}
        title="WELCOME TO FOCAL"
        buttons={[
          {
            label: "LET'S GO",
            variant: 'primary',
            onPress: () => setShowOnboarding(false),
          },
        ]}
      >
        <Text style={{ color: colors.textSub, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
          Your personal daily planner — built around three focused time blocks each day.
        </Text>
        <FeatureRow
          colors={colors}
          icon="📅"
          title="THREE DAILY SLOTS"
          desc="Plan your Morning, Afternoon, and Evening. One task per block keeps you focused."
        />
        <FeatureRow
          colors={colors}
          icon="✅"
          title="TRACK COMPLETION"
          desc="Check off tasks as you complete them. Finished days are saved to your calendar."
        />
        <FeatureRow
          colors={colors}
          icon="📆"
          title="CALENDAR VIEW"
          desc="Review your history at a glance. Tap any day to see what you planned."
        />
        <FeatureRow
          colors={colors}
          icon="⚠️"
          title="PAST DAY REVIEW"
          desc="If you missed logging a day, you'll be taken there first so nothing is left unrecorded."
        />
        <FeatureRow
          colors={colors}
          icon="🎨"
          title="THEMES & COLORS"
          desc="Customize accent colors, completion colors, and failed task colors in Settings."
        />
      </FocalModal>

      {/* ── [PAST_DAY_MODAL] ───────────────────────────────────────────────
           Edit the title, body text, and button labels here.
           The skip button dismisses the modal and stays on the blocking day.
      ─────────────────────────────────────────────────────────────────────── */}
      <FocalModal
        visible={showPastWarning}
        colors={colors}
        title="PAST DAYS PENDING"
        buttons={[
          {
            label: 'SKIP FOR NOW',
            variant: 'skip',
            onPress: () => setShowPastWarning(false),
          },
          {
            label: 'GOT IT',
            variant: 'primary',
            onPress: () => setShowPastWarning(false),
          },
        ]}
      >
        <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 20 }}>
          You have <Text style={{ color: colors.red, fontWeight: '800' }}>{blockingDays.length} past {blockingDays.length === 1 ? 'day' : 'days'}</Text> with unrecorded tasks.
        </Text>
        <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 20, marginTop: 10 }}>
          You've been taken to the earliest pending day. Fill in what you accomplished, or mark tasks as failed to move on. You can also skip a day entirely using the <Text style={{ color: colors.red, fontWeight: '700' }}>SKIP DAY</Text> button.
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 12 }}>
          Planning future days will be unlocked once all past days are resolved.
        </Text>
      </FocalModal>

      {/* ── [RESET_MODAL] ──────────────────────────────────────────────────
           Edit the title, body text, and button labels here.
      ─────────────────────────────────────────────────────────────────────── */}
      <FocalModal
        visible={showResetModal}
        colors={colors}
        title="RESET EVERYTHING?"
        onDismiss={() => setShowResetModal(false)}
        buttons={[
          {
            label: 'CANCEL',
            variant: 'ghost',
            onPress: () => setShowResetModal(false),
          },
          {
            label: 'RESET ALL DATA',
            variant: 'danger',
            onPress: () => {
              setShowResetModal(false);
              handleReset();
            },
          },
        ]}
      >
        <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 20 }}>
          This will permanently delete all your tasks, diary entries, and history — resetting the app as if it were freshly installed.
        </Text>
        <Text style={{ color: colors.red, fontSize: 12, fontWeight: '700', marginTop: 12 }}>
          This action cannot be undone.
        </Text>
      </FocalModal>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <TouchableOpacity activeOpacity={1} onPress={handleHeaderPress}>
        <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.red, paddingTop: insets.top + 8 }]}>
          <Animated.View style={[styles.headerInner, { transform: [{ scale: headerInnerScale }] }]}>
            {isFunnyName ? (
              <>
                <Text style={[styles.funnyEmoji, { color: warningColor }]}>⚠</Text>
                <View style={styles.headerCenter}>
                  <Text style={[styles.appName, { color: colors.red, letterSpacing: 4, fontSize: 20 }]}>{headerName.title}</Text>
                  <View style={styles.appSubRow}>
                    <View style={[styles.appSubLine, { backgroundColor: colors.red }]} />
                    <Text style={[styles.appSub, { color: colors.text, letterSpacing: 4 }]}>{headerName.sub}</Text>
                    <View style={[styles.appSubLine, { backgroundColor: colors.red }]} />
                  </View>
                </View>
                <Text style={[styles.funnyEmoji, { color: warningColor }]}>⚠</Text>
              </>
            ) : (
              <>
                <View style={styles.headerSlashes}>
                  <View style={[styles.slash, { backgroundColor: colors.red }]} />
                  <View style={[styles.slash, { backgroundColor: colors.red, opacity: 0.4, marginLeft: 5 }]} />
                </View>
                <View style={styles.headerCenter}>
                  <Text style={[styles.appName, { color: colors.text }]}>FOCAL</Text>
                  <View style={styles.appSubRow}>
                    <View style={[styles.appSubLine, { backgroundColor: colors.red }]} />
                    <Text style={[styles.appSub, { color: colors.red }]}>PLANNER</Text>
                    <View style={[styles.appSubLine, { backgroundColor: colors.red }]} />
                  </View>
                </View>
                <View style={[styles.diamond, { borderColor: colors.red }]} />
              </>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <View style={styles.body}>
        {tab === 'planner' && (
          <DayView
            dateKey={currentDateKey} dayData={dayData}
            canGoBack={true} canGoForward={isFuture(currentDateKey) || canPlanFuture()}
            onPrev={handlePrev} onNext={handleNext}
            onGoToToday={handleGoToToday}
            onAdd={(s, t) => addTask(currentDateKey, s, t)}
            onEdit={(s, t) => editTask(currentDateKey, s, t)}
            onComplete={s => completeTask(currentDateKey, s)}
            onFail={s => failTask(currentDateKey, s)}
            onFailDay={() => failAllUnresolvedSlots(currentDateKey)}
            onDelete={s => deleteTask(currentDateKey, s)}
            blockingDays={blockingDays} colors={colors}
          />
        )}
        {tab === 'calendar' && (
          <CalendarView data={data} onGoToDay={handleGoToDay} colors={colors} />
        )}
        {tab === 'settings' && (
          <SettingsView
            colors={colors} isDark={isDark} toggleTheme={toggleTheme}
            colorTheme={colorTheme} setColorTheme={setColorTheme}
            completedColor={completedColor} setCompletedColor={setCompletedColor}
            failedColor={failedColor} setFailedColor={setFailedColor}
            onReset={() => setShowResetModal(true)}
            onShowHelp={() => setShowOnboarding(true)}
          />
        )}
      </View>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <View style={[styles.tabBar, { backgroundColor: colors.bgCard, borderTopColor: colors.border, paddingBottom: insets.bottom + 4 }]}>
        {TABS.map((t, idx) => {
          const active = tab === t.id;
          const Icon   = t.icon;
          return (
            <Animated.View key={t.id} style={[styles.tabWrap, { transform: [{ scale: tabScales[idx] }] }]}>
              <TouchableOpacity style={styles.tab} onPress={() => switchTab(t.id)} activeOpacity={1}>
                {active && <View style={[styles.tabTopBar, { backgroundColor: colors.red }]} />}
                <Icon size={20} color={active ? colors.red : colors.textMuted} />
                <Text style={[styles.tabLabel, { color: active ? colors.red : colors.textMuted }]}>{t.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export default function App() { return <SafeAreaProvider><AppInner /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  root:    { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header:  { borderBottomWidth: 2, paddingBottom: 10, paddingHorizontal: 16, elevation: 6, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  headerInner:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerSlashes: { flexDirection: 'row', alignItems: 'center' },
  slash:   { width: 4, height: 34, borderRadius: 2, transform: [{ skewX: '-18deg' }] },
  headerCenter:  { flex: 1, alignItems: 'center' },
  appName: { fontSize: 24, fontWeight: '900', letterSpacing: 8, lineHeight: 26 },
  appSubRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  appSubLine: { flex: 1, height: 1, opacity: 0.5 },
  appSub:  { fontSize: 10, fontWeight: '700', letterSpacing: 8 },
  diamond: { width: 12, height: 12, borderWidth: 2, transform: [{ rotate: '45deg' }], borderRadius: 2 },
  funnyEmoji: { fontSize: 20, fontWeight: '900' },
  body:    { flex: 1 },
  tabBar:  { flexDirection: 'row', borderTopWidth: 1, elevation: 10 },
  tabWrap: { flex: 1 },
  tab:     { alignItems: 'center', paddingVertical: 8, gap: 3, position: 'relative' },
  tabTopBar: { position: 'absolute', top: 0, left: '22%', right: '22%', height: 2, borderRadius: 1 },
  tabLabel:  { fontSize: 8, fontWeight: '800', letterSpacing: 1.5 },
});
