/**
 * SettingsView.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * App settings: dark mode, accent color, completed color, failed task color,
 * about card with help icon, and reset button.
 *
 * TEXT YOU CAN EDIT:
 *   Section labels          → strings like 'APPEARANCE', 'ACCENT COLOR', etc.
 *   About subtitle          → search: ABOUT_SUBTITLE
 *   Reset button subtitle   → search: RESET_SUBTITLE
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Animated, Switch,
} from 'react-native';
import { Sun, Moon, Info, RotateCcw, HelpCircle } from 'lucide-react-native';
import {
  Colors, THEMES, ColorTheme, COMPLETED_COLORS, CompletedColor,
  FAILED_COLORS, FailedColor, ABOUT_SPAM_RESPONSES,
} from '../constants';
import { useFidget } from '../hooks/useFidget';

interface Props {
  colors: Colors; isDark: boolean; toggleTheme: () => void;
  colorTheme: ColorTheme; setColorTheme: (c: ColorTheme) => void;
  completedColor: CompletedColor; setCompletedColor: (c: CompletedColor) => void;
  failedColor: FailedColor; setFailedColor: (c: FailedColor) => void;
  onReset: () => void;
  onShowHelp: () => void;
}

function PopCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { onTap } = useFidget(scale);
  return (
    <TouchableOpacity activeOpacity={1} onPress={() => onTap()}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </TouchableOpacity>
  );
}

function AboutCard({ colors, style, onShowHelp }: { colors: Colors; style?: any; onShowHelp: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { onTap } = useFidget(scale);
  const [funnyText, setFunnyText] = useState<string | null>(null);

  const handleTap = () => {
    onTap(
      () => {
        const msg = ABOUT_SPAM_RESPONSES[Math.floor(Math.random() * ABOUT_SPAM_RESPONSES.length)];
        setFunnyText(msg);
      },
      undefined,
    );
  };

  return (
    <TouchableOpacity activeOpacity={1} onPress={handleTap}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        <View style={[styles.cardStripe, { backgroundColor: colors.red }]} />
        <View style={styles.cardInner}>
          <View style={styles.row}>
            <Info size={18} color={colors.red} />
            <View style={styles.rowText}>
              {funnyText ? (
                <>
                  <Text style={[styles.rowTitle, { color: colors.red }]}>Focal Planner</Text>
                  <Text style={[styles.rowSub, { color: colors.red }]}>{funnyText}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.rowTitle, { color: colors.text }]}>Focal Planner</Text>
                  {/* ABOUT_SUBTITLE */}
                  <Text style={[styles.rowSub, { color: colors.textMuted }]}>Persona 5 inspired daily diary · v1.0</Text>
                </>
              )}
            </View>
            {/* Help icon — opens onboarding modal again */}
            <TouchableOpacity
              onPress={onShowHelp}
              activeOpacity={0.7}
              style={styles.helpBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <HelpCircle size={20} color={colors.red} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function SettingsView({
  colors, isDark, toggleTheme,
  colorTheme, setColorTheme,
  completedColor, setCompletedColor,
  failedColor, setFailedColor,
  onReset, onShowHelp,
}: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* APPEARANCE */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APPEARANCE</Text>
        <PopCard style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.cardStripe, { backgroundColor: colors.red }]} />
          <View style={styles.cardInner}>
            <View style={styles.row}>
              {isDark ? <Moon size={18} color={colors.red} /> : <Sun size={18} color={colors.red} />}
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>{isDark ? 'Switch to light' : 'Switch to dark'}</Text>
              </View>
              <Switch
                value={isDark} onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.red }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </PopCard>

        {/* ACCENT COLOR */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCENT COLOR</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.cardStripe, { backgroundColor: colors.red }]} />
          <View style={styles.cardInner}>
            {(Object.entries(THEMES) as [ColorTheme, typeof THEMES[ColorTheme]][]).map(([key, val], i) => (
              <TouchableOpacity key={key}
                style={[styles.themeRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, colorTheme === key && { backgroundColor: colors.redGlow }]}
                onPress={() => setColorTheme(key)} activeOpacity={0.7}
              >
                <View style={[styles.themeSwatch, { backgroundColor: val.accent }]} />
                <Text style={[styles.themeLabel, { color: colors.text }]}>{val.name}</Text>
                {colorTheme === key && (
                  <View style={[styles.activeChip, { backgroundColor: colors.red }]}>
                    <Text style={styles.activeChipText}>ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* COMPLETED COLOR */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>COMPLETED COLOR</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.cardStripe, { backgroundColor: colors.completed }]} />
          <View style={styles.cardInner}>
            {(Object.entries(COMPLETED_COLORS) as [CompletedColor, typeof COMPLETED_COLORS[CompletedColor]][]).map(([key, val], i) => (
              <TouchableOpacity key={key}
                style={[styles.themeRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, completedColor === key && { backgroundColor: `${val.hex}22` }]}
                onPress={() => setCompletedColor(key)} activeOpacity={0.7}
              >
                <View style={[styles.themeSwatch, { backgroundColor: val.hex }]} />
                <Text style={[styles.themeLabel, { color: colors.text }]}>{val.name}</Text>
                {completedColor === key && (
                  <View style={[styles.activeChip, { backgroundColor: val.hex }]}>
                    <Text style={styles.activeChipText}>ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FAILED TASK COLOR */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>FAILED TASK COLOR</Text>
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.cardStripe, { backgroundColor: colors.failed }]} />
          <View style={styles.cardInner}>
            {(Object.entries(FAILED_COLORS) as [FailedColor, typeof FAILED_COLORS[FailedColor]][]).map(([key, val], i) => (
              <TouchableOpacity key={key}
                style={[styles.themeRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border }, failedColor === key && { backgroundColor: `${val.hex}22` }]}
                onPress={() => setFailedColor(key)} activeOpacity={0.7}
              >
                <View style={[styles.themeSwatch, { backgroundColor: val.hex }]} />
                <Text style={[styles.themeLabel, { color: colors.text }]}>{val.name}</Text>
                {failedColor === key && (
                  <View style={[styles.activeChip, { backgroundColor: val.hex }]}>
                    <Text style={styles.activeChipText}>ACTIVE</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ABOUT */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ABOUT</Text>
        <AboutCard
          colors={colors}
          style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
          onShowHelp={onShowHelp}
        />

        {/* DANGER ZONE */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DANGER ZONE</Text>
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: colors.bgCard, borderColor: colors.red }]}
          onPress={onReset} activeOpacity={0.7}
        >
          <RotateCcw size={18} color={colors.red} />
          <View style={styles.rowText}>
            <Text style={[styles.rowTitle, { color: colors.red }]}>Reset App</Text>
            {/* RESET_SUBTITLE */}
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>Wipe all data and start fresh</Text>
          </View>
        </TouchableOpacity>

      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 8, marginTop: 16, marginLeft: 4 },
  card:      { borderRadius: 10, borderWidth: 1, flexDirection: 'row', overflow: 'hidden', marginBottom: 4 },
  cardStripe:{ width: 4 },
  cardInner: { flex: 1, paddingHorizontal: 14, paddingVertical: 4 },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowText:   { flex: 1 },
  rowTitle:  { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  rowSub:    { fontSize: 11 },
  themeRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 2, borderRadius: 6 },
  themeSwatch: { width: 22, height: 22, borderRadius: 11 },
  themeLabel:  { flex: 1, fontSize: 14, fontWeight: '600' },
  activeChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeChipText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  resetBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 4 },
  helpBtn:   { padding: 4 },
});
