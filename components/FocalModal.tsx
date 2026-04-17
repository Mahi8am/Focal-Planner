/**
 * FocalModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable themed modal. All copy lives in App.tsx — this file is structural.
 * FeatureRow now accepts a lucide icon component instead of an emoji string.
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, Pressable, ScrollView,
} from 'react-native';
import { Colors } from '../constants';

export interface FocalModalButton {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'skip';
}

interface Props {
  visible: boolean;
  colors: Colors;
  title: string;
  children: React.ReactNode;
  buttons: FocalModalButton[];
  onDismiss?: () => void;
  accentStripe?: boolean;
}

export default function FocalModal({
  visible, colors, title, children, buttons, onDismiss, accentStripe = true,
}: Props) {
  const scaleAnim   = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1, tension: 200, friction: 10, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onDismiss}>
      <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.72)' }]} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.box,
            { backgroundColor: colors.bgCard, borderColor: colors.red, transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          <Pressable onPress={() => {}}>
            {accentStripe && <View style={[styles.stripe, { backgroundColor: colors.red }]} />}
            <View style={styles.inner}>

              {/* Title */}
              <View style={styles.titleRow}>
                <View style={[styles.titleAccent, { backgroundColor: colors.red }]} />
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              </View>

              {/* Body */}
              <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.body}>
                  {typeof children === 'string'
                    ? <Text style={[styles.bodyText, { color: colors.textSub }]}>{children}</Text>
                    : children}
                </View>
              </ScrollView>

              {/* Divider */}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Buttons */}
              <View style={styles.btnRow}>
                {buttons.map((btn, i) => {
                  const isDanger  = btn.variant === 'danger';
                  const isPrimary = btn.variant === 'primary' || (!btn.variant && i === buttons.length - 1);
                  const isGhost   = btn.variant === 'ghost';
                  const isSkip    = btn.variant === 'skip';

                  const bgColor  = isDanger ? colors.red : isPrimary ? colors.red : 'transparent';
                  const txtColor = (isDanger || isPrimary) ? '#FFF' : isSkip ? colors.textMuted : colors.red;
                  const borderCol = isGhost || isSkip ? colors.border : colors.red;

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.btn, { backgroundColor: bgColor, borderColor: borderCol }, isSkip && styles.btnSkip]}
                      onPress={btn.onPress}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.btnText, { color: txtColor }, isSkip && styles.btnTextSkip]}>
                        {btn.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

/**
 * FeatureRow — icon is a Lucide component (e.g. CalendarDays), not an emoji.
 */
export function FeatureRow({
  icon: Icon, title, desc, colors,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  desc: string;
  colors: Colors;
}) {
  return (
    <View style={featureStyles.row}>
      <View style={featureStyles.iconWrap}>
        <Icon size={18} color={colors.red} />
      </View>
      <View style={featureStyles.text}>
        <Text style={[featureStyles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[featureStyles.desc,  { color: colors.textMuted }]}>{desc}</Text>
      </View>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  iconWrap: { width: 28, alignItems: 'center', marginTop: 1 },
  text:     { flex: 1 },
  title:    { fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: 2 },
  desc:     { fontSize: 12, lineHeight: 17 },
});

const styles = StyleSheet.create({
  overlay:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  box:        { width: '100%', maxWidth: 400, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden',
                elevation: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 },
  stripe:     { height: 4, width: '100%' },
  inner:      { padding: 20 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  titleAccent:{ width: 4, height: 22, borderRadius: 2 },
  title:      { fontSize: 16, fontWeight: '900', letterSpacing: 2, flex: 1 },
  bodyScroll: { maxHeight: 340 },
  body:       { paddingBottom: 4 },
  bodyText:   { fontSize: 13, lineHeight: 20 },
  divider:    { height: 1, marginVertical: 16 },
  btnRow:     { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  btn:        { flex: 1, minWidth: 90, borderRadius: 8, borderWidth: 1.5,
                paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  btnSkip:    { borderStyle: 'dashed' },
  btnText:    { fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  btnTextSkip:{ fontWeight: '600', letterSpacing: 1 },
});
