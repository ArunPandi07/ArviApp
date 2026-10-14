import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, SafeAreaView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS, LANGUAGES, LangCode } from '../constants';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Language'>;

export default function LanguageScreen({ navigation }: Props) {
  const { setLang, setHasSelectedLanguage } = useAppStore();
  const [selected, setSelected] = useState<LangCode | null>(null);

  const cardAnims = useRef(
    LANGUAGES.map(() => ({ opacity: new Animated.Value(0), y: new Animated.Value(20) }))
  ).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(16)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerY,       { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();

    cardAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim.y,       { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      }, 80 + i * 60);
    });

    setTimeout(() => {
      Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 550);
  }, []);

  const handleContinue = () => {
    if (!selected) return;
    setLang(selected);
    setHasSelectedLanguage(true);
    navigation.replace('Login');
  };

  const selectedLang = LANGUAGES.find(l => l.code === selected);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
          <View style={styles.headerIcon}>
            <Text style={{ fontSize: 22 }}>🌐</Text>
          </View>
          <Text style={styles.title}>Choose your language</Text>
          <Text style={styles.subtitle}>The app speaks, listens & bills{'\n'}in your language</Text>
        </Animated.View>

        <View style={styles.grid}>
          {LANGUAGES.map((lang, i) => {
            const isSelected = selected === lang.code;
            return (
              <Animated.View
                key={lang.code}
                style={{ opacity: cardAnims[i].opacity, transform: [{ translateY: cardAnims[i].y }], width: '48%' }}
              >
                <TouchableOpacity
                  style={[styles.langCard, isSelected && styles.langCardSelected]}
                  onPress={() => setSelected(lang.code)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.flag}>{lang.flag}</Text>
                  <Text style={[styles.langLabel, isSelected && styles.langLabelSel]}>{lang.label}</Text>
                  <Text style={[styles.langName,  isSelected && styles.langNameSel]}>{lang.name}</Text>
                  {isSelected && (
                    <View style={styles.tick}>
                      <Text style={{ fontSize: 11, color: COLORS.white, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <Animated.View style={[styles.btnWrap, { opacity: btnOpacity }]}>
        <TouchableOpacity
          style={[styles.btn, !selected && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!selected}
          activeOpacity={0.85}
        >
          <Text style={[styles.btnText, !selected && { color: COLORS.muted }]}>
            {selectedLang ? `Continue in ${selectedLang.name}  →` : 'Select a language'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.white },
  scroll:  { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  header:         { marginTop: 12, marginBottom: 28 },
  headerIcon:     { width: 48, height: 48, borderRadius: 14, backgroundColor: COLORS.tealLight, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title:          { fontSize: 24, fontWeight: '700', color: COLORS.ink, letterSpacing: -0.4 },
  subtitle:       { fontSize: 13, color: COLORS.muted, marginTop: 8, lineHeight: 20 },
  grid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  langCard:       { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, padding: 16, backgroundColor: COLORS.bg, alignItems: 'center', gap: 6, position: 'relative', minHeight: 110, justifyContent: 'center' },
  langCardSelected: { borderColor: COLORS.teal, backgroundColor: COLORS.teal, elevation: 6 },
  flag:           { fontSize: 24 },
  langLabel:      { fontSize: 17, fontWeight: '600', color: COLORS.ink },
  langLabelSel:   { color: COLORS.white },
  langName:       { fontSize: 11, color: COLORS.muted },
  langNameSel:    { color: 'rgba(255,255,255,0.8)' },
  tick:           { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  btnWrap:        { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 34, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  btn:            { backgroundColor: COLORS.teal, borderRadius: 16, paddingVertical: 16, alignItems: 'center', elevation: 6 },
  btnDisabled:    { backgroundColor: COLORS.border, elevation: 0 },
  btnText:        { fontSize: 16, fontWeight: '600', color: COLORS.white },
});
