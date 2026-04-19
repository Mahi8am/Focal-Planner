/**
 * App.tsx
 * ROOT COMPONENT — navigation, modals, tab management.
 *
 * [ONBOARDING_MODAL]  Welcome popup (first install + after reset + help icon)
 * [RESET_MODAL]       Confirmation before wiping data
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Keyboard,
  Modal,
  ScrollView,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalendarDays,
  BookOpen,
  Settings,
  CalendarCheck,
  CheckSquare,
  Palette,
  BookMarked,
  Sparkles,
  Skull,
  AlertTriangle,
  Zap,
  FlameKindling,
} from "lucide-react-native";
import DayView from "./components/DayView";
import CalendarView from "./components/CalendarView";
import SettingsView from "./components/SettingsView";
import FocalModal from "./components/FocalModal";
import { useStorage } from "./hooks/useStorage";
import { useTheme } from "./hooks/useTheme";
import { useFidget } from "./hooks/useFidget";
import { todayKey, fromDateKey, toDateKey } from "./utils/dateUtils";
import {
  FUNNY_NAMES,
  STORAGE_KEY,
  INSTALL_DATE_KEY,
  ONBOARDING_KEY,
} from "./constants";
import { Colors } from "./constants";
import { SlotId } from "./types";

type Tab = "planner" | "calendar" | "settings";
const TABS: { id: Tab; icon: any; label: string }[] = [
  { id: "planner", icon: BookOpen, label: "PLANNER" },
  { id: "calendar", icon: CalendarDays, label: "CALENDAR" },
  { id: "settings", icon: Settings, label: "SETTINGS" },
];

const REAL_NAME = { title: "FOCAL", sub: "PLANNER" };

// ── Onboarding feature lists ─────────────────────────────────────────────────

const NORMAL_FEATURES = [
  {
    icon: CalendarCheck,
    title: "THREE DAILY SLOTS",
    desc: "Plan your Morning, Afternoon, and Evening. One task per block keeps you focused.",
  },
  {
    icon: CheckSquare,
    title: "TRACK COMPLETION",
    desc: "Check off tasks as you complete them. Tap the circle on today's tasks to mark them done.",
  },
  {
    icon: CalendarDays,
    title: "CALENDAR VIEW",
    desc: "Review your history at a glance. Tap any day to see what you planned.",
  },
  {
    icon: Palette,
    title: "THEMES & COLORS",
    desc: "Customize accent, completion, and skipped task colors in Settings.",
  },
  {
    icon: BookMarked,
    title: "PAST DAY LOGGING",
    desc: "Browse back to past days and fill in what you accomplished retroactively.",
  },
  {
    icon: Zap,
    title: "EASTER EGGS",
    desc: "Try tapping frantically. On Everything. Maybe try Long-pressing too. Try the quote card, the navigation cards, the header. The calendar details card has a secret too. And perhaps this very card too.",
  },
];

const GOOFY_FEATURES = [
  {
    icon: Skull,
    title: "IT REMEMBERS EVERYTHING",
    desc: "Every skipped task is stored in a vault deep within the app. The app has feelings. They are hurt.",
  },
  {
    icon: AlertTriangle,
    title: "THE SLOTS ARE ALIVE",
    desc: "Morning. Afternoon. Evening. They are waiting. Always waiting. They know when you don't show up.",
  },
  {
    icon: Zap,
    title: "TAP THE HEADER 15 TIMES",
    desc: "Something happens. We won't say what. You'll know when it's too late.",
  },
  {
    icon: FlameKindling,
    title: "THE QUOTE CARD KNOWS",
    desc: "Tap it enough and it will say something deeply personal. Or unhinged. Same thing.",
  },
  {
    icon: Sparkles,
    title: "THE CALENDAR DETAIL CARD",
    desc: "Tap it like you mean it. Then tap it more. Something will break. Beautifully.",
  },
];

// ── Onboarding modal ─────────────────────────────────────────────────────────

function OnboardingModal({
  visible,
  colors,
  onClose,
}: {
  visible: boolean;
  colors: Colors;
  onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const [goofy, setGoofy] = useState(false);
  const { onTap } = useFidget(cardScale);

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      setGoofy(false);
      cardScale.setValue(1);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleTap = () => onTap(() => setGoofy(true), undefined);

  const bg = goofy ? "#1a1008" : colors.bgCard;
  const accent = goofy ? "#c42e00" : colors.red;
  const textCol = goofy ? "#e8873a" : colors.text;
  const subCol = goofy ? "#c44e00" : colors.textSub;
  const mutedCol = goofy ? "#c44e00" : colors.textMuted;
  const divider = goofy ? "#3a2010" : colors.border;
  const features = goofy ? GOOFY_FEATURES : NORMAL_FEATURES;
  const title = goofy ? "YOU FOUND IT" : "WELCOME TO FOCAL";
  const subtitle = goofy
    ? "this app is watching you. it knows about the tasks you didn't do. it has been waiting for you to find this."
    : "Your personal daily planner — built around three focused time blocks each day.";
  const btnLabel = goofy ? "I UNDERSTAND. (I DON'T)" : "LET'S GO";

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar
        backgroundColor={goofy ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0)'}
        barStyle="light-content"
        translucent
      />
      {/* Backdrop — tapping outside closes */}
      <View style={[onboardStyles.backdrop, { backgroundColor: goofy ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.72)' }]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Card wrapper — stop propagation so taps on card don't hit backdrop */}
        <Animated.View
          style={[
            onboardStyles.card,
            {
              backgroundColor: bg,
              borderColor: accent,
              transform: [{ scale: Animated.multiply(scaleAnim, cardScale) }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Tappable stripe at top — counts toward fidget */}
          <TouchableOpacity onPress={handleTap} activeOpacity={0.8}>
            <View style={[onboardStyles.stripe, { backgroundColor: accent }]} />
          </TouchableOpacity>

          <View style={onboardStyles.inner}>
            {/* Tappable title row — counts toward fidget */}
            <TouchableOpacity onPress={handleTap} activeOpacity={1}>
              <View style={onboardStyles.titleRow}>
                <View
                  style={[
                    onboardStyles.titleAccent,
                    { backgroundColor: accent },
                  ]}
                />
                <Text style={[onboardStyles.titleText, { color: textCol }]}>
                  {title}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Scrollable body — scrolling does NOT count as taps */}
            <ScrollView
              style={onboardStyles.scroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              onStartShouldSetResponder={() => false}
            >
              <TouchableOpacity
                onPress={handleTap}
                activeOpacity={1}
                delayPressIn={100}
                delayLongPress={500}
              >
                <Text style={[onboardStyles.subtitle, { color: subCol }]}>
                  {subtitle}
                </Text>
                {features.map(({ icon: Icon, title: ftitle, desc }, i) => (
                  <View key={i} style={onboardStyles.featureRow}>
                    <View style={onboardStyles.featureIconWrap}>
                      <Icon size={18} color={accent} />
                    </View>
                    <View style={onboardStyles.featureText}>
                      <Text
                        style={[onboardStyles.featureTitle, { color: textCol }]}
                      >
                        {ftitle}
                      </Text>
                      <Text
                        style={[onboardStyles.featureDesc, { color: mutedCol }]}
                      >
                        {desc}
                      </Text>
                    </View>
                  </View>
                ))}
              </TouchableOpacity>
            </ScrollView>

            {/* Divider */}
            <View
              style={[onboardStyles.divider, { backgroundColor: divider }]}
            />

            {/* Close button */}
            <TouchableOpacity
              style={[
                onboardStyles.btn,
                { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={onClose}
              activeOpacity={0.75}
            >
              <Text style={onboardStyles.btnText}>{btnLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const onboardStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    elevation: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  stripe: { height: 4, width: "100%" },
  inner: { padding: 20 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  titleAccent: { width: 4, height: 22, borderRadius: 2 },
  titleText: { fontSize: 16, fontWeight: "900", letterSpacing: 2, flex: 1 },
  scroll: { maxHeight: 340 },
  subtitle: { fontSize: 12, lineHeight: 18, marginBottom: 16 },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  featureIconWrap: { width: 28, alignItems: "center", marginTop: 1 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  featureDesc: { fontSize: 12, lineHeight: 17 },
  divider: { height: 1, marginVertical: 16 },
  btn: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: "#FFF",
  },
});

// ── Main app ─────────────────────────────────────────────────────────────────

function AppInner() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("planner");
  const [currentDateKey, setCurrentDateKey] = useState(todayKey());
  const [resetKey, setResetKey] = useState(0);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const {
    colors,
    toggleTheme,
    isDark,
    colorTheme,
    setColorTheme,
    completedColor,
    setCompletedColor,
    failedColor,
    setFailedColor,
  } = useTheme();
  const {
    data,
    loaded,
    installDate,
    getDay,
    addTask,
    editTask,
    completeTask,
    failTask,
    deleteTask,
  } = useStorage(resetKey);

  // Show onboarding on first install
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (!val) {
        setShowOnboarding(true);
        AsyncStorage.setItem(ONBOARDING_KEY, "true");
      }
    });
  }, []);

  // ── Header easter egg ────────────────────────────────────────────────────
  const tabScales = useRef(TABS.map(() => new Animated.Value(1))).current;
  const [headerName, setHeaderName] = useState(REAL_NAME);
  const usedFunnyIdx = useRef<number[]>([]);
  const headerInnerScale = useRef(new Animated.Value(1)).current;
  const headerTapTimes = useRef<number[]>([]);
  const headerTiredLock = useRef(false);

  const getNextFunnyName = () => {
    if (usedFunnyIdx.current.length >= FUNNY_NAMES.length)
      usedFunnyIdx.current = [];
    const available = FUNNY_NAMES.filter(
      (_, i) => !usedFunnyIdx.current.includes(i),
    );
    const pick = available[Math.floor(Math.random() * available.length)];
    usedFunnyIdx.current.push(FUNNY_NAMES.indexOf(pick));
    return pick;
  };

  const handleHeaderPress = () => {
    if (headerTiredLock.current) return;
    const now = Date.now();
    headerTapTimes.current = headerTapTimes.current
      .filter((t) => now - t < 3000)
      .concat(now);
    if (headerTapTimes.current.length >= 15) {
      headerTapTimes.current = [];
      headerTiredLock.current = true;
      setHeaderName(getNextFunnyName());
      headerInnerScale.stopAnimation();
      Animated.sequence([
        Animated.spring(headerInnerScale, {
          toValue: 0.82,
          useNativeDriver: true,
          tension: 300,
          friction: 7,
        }),
        Animated.spring(headerInnerScale, {
          toValue: 1.16,
          useNativeDriver: true,
          tension: 200,
          friction: 6,
        }),
        Animated.spring(headerInnerScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 180,
          friction: 8,
        }),
      ]).start(() => {
        headerTiredLock.current = false;
      });
    } else {
      headerInnerScale.stopAnimation();
      Animated.sequence([
        Animated.timing(headerInnerScale, {
          toValue: 0.93,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(headerInnerScale, {
          toValue: 1.04,
          duration: 55,
          useNativeDriver: true,
        }),
        Animated.timing(headerInnerScale, {
          toValue: 1,
          duration: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const resetHeaderName = useCallback(() => setHeaderName(REAL_NAME), []);

  const switchTab = useCallback(
    (newTab: Tab) => {
      const idx = TABS.findIndex((t) => t.id === newTab);
      Animated.sequence([
        Animated.timing(tabScales[idx], {
          toValue: 1.2,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(tabScales[idx], {
          toValue: 1,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
      if (newTab === "planner") {
        setCurrentDateKey(todayKey());
        resetHeaderName();
      }
      setTab(newTab);
    },
    [resetHeaderName],
  );

  // Reset — also shows onboarding again
  const handleReset = useCallback(async () => {
    const today = todayKey();
    await AsyncStorage.multiSet([
      [STORAGE_KEY, JSON.stringify({ days: {} })],
      [INSTALL_DATE_KEY, today],
    ]);
    setCurrentDateKey(today);
    resetHeaderName();
    setTab("planner");
    setResetKey((k) => k + 1);
    setShowOnboarding(true);
  }, [resetHeaderName]);

  const handleGoToToday = useCallback(() => {
    setCurrentDateKey(todayKey());
    resetHeaderName();
  }, [resetHeaderName]);

  if (!loaded)
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: colors.bg, paddingTop: insets.top },
        ]}
      >
        <ActivityIndicator color={colors.red} size="large" />
      </View>
    );

  const dayData = getDay(currentDateKey);

  const handlePrev = () => {
    Keyboard.dismiss();
    const d = fromDateKey(currentDateKey);
    d.setDate(d.getDate() - 1);
    setCurrentDateKey(toDateKey(d));
    resetHeaderName();
  };
  const handleNext = () => {
    Keyboard.dismiss();
    const d = fromDateKey(currentDateKey);
    d.setDate(d.getDate() + 1);
    setCurrentDateKey(toDateKey(d));
    resetHeaderName();
  };
  const handleGoToDay = (dateKey: string) => {
    const idx = TABS.findIndex((t) => t.id === "planner");
    Animated.sequence([
      Animated.timing(tabScales[idx], {
        toValue: 1.2,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(tabScales[idx], {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentDateKey(dateKey);
    resetHeaderName();
    setTab("planner");
  };

  const isFunnyName = headerName.title !== REAL_NAME.title;
  const warningColor = isDark ? "#FFFFFF" : colors.red;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bgCard}
        translucent={false}
      />

      {/* ── [ONBOARDING_MODAL] ── first install, after reset, help icon */}
      <OnboardingModal
        visible={showOnboarding}
        colors={colors}
        onClose={() => setShowOnboarding(false)}
      />

      {/* ── [RESET_MODAL] */}
      <FocalModal
        visible={showResetModal}
        colors={colors}
        title="RESET EVERYTHING?"
        onDismiss={() => setShowResetModal(false)}
        buttons={[
          {
            label: "CANCEL",
            variant: "ghost",
            onPress: () => setShowResetModal(false),
          },
          {
            label: "RESET ALL DATA",
            variant: "danger",
            onPress: () => {
              setShowResetModal(false);
              handleReset();
            },
          },
        ]}
      >
        <Text style={{ color: colors.textSub, fontSize: 13, lineHeight: 20 }}>
          This will permanently delete all your tasks, diary entries, and
          history — resetting the app as if it were freshly installed.
        </Text>
        <Text
          style={{
            color: colors.red,
            fontSize: 12,
            fontWeight: "700",
            marginTop: 12,
          }}
        >
          This action cannot be undone.
        </Text>
      </FocalModal>

      {/* ── Header */}
      <TouchableOpacity activeOpacity={1} onPress={handleHeaderPress}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.bgCard,
              borderBottomColor: colors.red,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.headerInner,
              { transform: [{ scale: headerInnerScale }] },
            ]}
          >
            {isFunnyName ? (
              <>
                <Text style={[styles.funnyEmoji, { color: warningColor }]}>
                  ⚠
                </Text>
                <View style={styles.headerCenter}>
                  <Text
                    style={[
                      styles.appName,
                      { color: colors.red, letterSpacing: 4, fontSize: 20 },
                    ]}
                  >
                    {headerName.title}
                  </Text>
                  <View style={styles.appSubRow}>
                    <View
                      style={[
                        styles.appSubLine,
                        { backgroundColor: colors.red },
                      ]}
                    />
                    <Text
                      style={[
                        styles.appSub,
                        { color: colors.text, letterSpacing: 4 },
                      ]}
                    >
                      {headerName.sub}
                    </Text>
                    <View
                      style={[
                        styles.appSubLine,
                        { backgroundColor: colors.red },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.funnyEmoji, { color: warningColor }]}>
                  ⚠
                </Text>
              </>
            ) : (
              <>
                <View style={styles.headerSlashes}>
                  <View
                    style={[styles.slash, { backgroundColor: colors.red }]}
                  />
                  <View
                    style={[
                      styles.slash,
                      {
                        backgroundColor: colors.red,
                        opacity: 0.4,
                        marginLeft: 5,
                      },
                    ]}
                  />
                </View>
                <View style={styles.headerCenter}>
                  <Text style={[styles.appName, { color: colors.text }]}>
                    FOCAL
                  </Text>
                  <View style={styles.appSubRow}>
                    <View
                      style={[
                        styles.appSubLine,
                        { backgroundColor: colors.red },
                      ]}
                    />
                    <Text style={[styles.appSub, { color: colors.red }]}>
                      PLANNER
                    </Text>
                    <View
                      style={[
                        styles.appSubLine,
                        { backgroundColor: colors.red },
                      ]}
                    />
                  </View>
                </View>
                <View style={[styles.diamond, { borderColor: colors.red }]} />
              </>
            )}
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* ── Body */}
      <View style={styles.body}>
        {tab === "planner" && (
          <DayView
            dateKey={currentDateKey}
            dayData={dayData}
            installDate={installDate}
            canGoBack={true}
            canGoForward={true}
            onPrev={handlePrev}
            onNext={handleNext}
            onGoToToday={handleGoToToday}
            onAdd={(s, t) => addTask(currentDateKey, s, t)}
            onEdit={(s, t) => editTask(currentDateKey, s, t)}
            onComplete={(s) => completeTask(currentDateKey, s)}
            onFail={(s) => failTask(currentDateKey, s)}
            onDelete={(s) => deleteTask(currentDateKey, s)}
            colors={colors}
          />
        )}
        {tab === "calendar" && (
          <CalendarView data={data} onGoToDay={handleGoToDay} colors={colors} />
        )}
        {tab === "settings" && (
          <SettingsView
            colors={colors}
            isDark={isDark}
            toggleTheme={toggleTheme}
            colorTheme={colorTheme}
            setColorTheme={setColorTheme}
            completedColor={completedColor}
            setCompletedColor={setCompletedColor}
            failedColor={failedColor}
            setFailedColor={setFailedColor}
            onReset={() => setShowResetModal(true)}
            onShowHelp={() => setShowOnboarding(true)}
          />
        )}
      </View>

      {/* ── Tab bar */}
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.bgCard,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 4,
          },
        ]}
      >
        {TABS.map((t, idx) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <Animated.View
              key={t.id}
              style={[
                styles.tabWrap,
                { transform: [{ scale: tabScales[idx] }] },
              ]}
            >
              <TouchableOpacity
                style={styles.tab}
                onPress={() => switchTab(t.id)}
                activeOpacity={1}
              >
                {active && (
                  <View
                    style={[styles.tabTopBar, { backgroundColor: colors.red }]}
                  />
                )}
                <Icon
                  size={20}
                  color={active ? colors.red : colors.textMuted}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: active ? colors.red : colors.textMuted },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    borderBottomWidth: 2,
    paddingBottom: 10,
    paddingHorizontal: 16,
    elevation: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerSlashes: { flexDirection: "row", alignItems: "center" },
  slash: {
    width: 4,
    height: 34,
    borderRadius: 2,
    transform: [{ skewX: "-18deg" }],
  },
  headerCenter: { flex: 1, alignItems: "center" },
  appName: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 8,
    lineHeight: 26,
  },
  appSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  appSubLine: { flex: 1, height: 1, opacity: 0.5 },
  appSub: { fontSize: 10, fontWeight: "700", letterSpacing: 8 },
  diamond: {
    width: 12,
    height: 12,
    borderWidth: 2,
    transform: [{ rotate: "45deg" }],
    borderRadius: 2,
  },
  funnyEmoji: { fontSize: 20, fontWeight: "900" },
  body: { flex: 1 },
  tabBar: { flexDirection: "row", borderTopWidth: 1, elevation: 10 },
  tabWrap: { flex: 1 },
  tab: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 3,
    position: "relative",
  },
  tabTopBar: {
    position: "absolute",
    top: 0,
    left: "22%",
    right: "22%",
    height: 2,
    borderRadius: 1,
  },
  tabLabel: { fontSize: 8, fontWeight: "800", letterSpacing: 1.5 },
});
