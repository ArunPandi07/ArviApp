import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const { isLoggedIn, hasSelectedLanguage, _hasHydrated } = useAppStore();

  const logoScale     = useRef(new Animated.Value(0)).current;
  const logoOpacity   = useRef(new Animated.Value(0)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textY         = useRef(new Animated.Value(20)).current;
  const dotsOpacity   = useRef(new Animated.Value(0)).current;
  const dot1Scale     = useRef(new Animated.Value(0.4)).current;
  const dot2Scale     = useRef(new Animated.Value(0.4)).current;
  const dot3Scale     = useRef(new Animated.Value(0.4)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Logo springs in
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Text fades up after logo
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(textY,       { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, 400);

    // Dots pulse
    setTimeout(() => {
      Animated.timing(dotsOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const dotAnim = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, { toValue: 1,   duration: 300, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.4, duration: 300, useNativeDriver: true }),
          ])
        );
      Animated.parallel([
        dotAnim(dot1Scale, 0),
        dotAnim(dot2Scale, 200),
        dotAnim(dot3Scale, 400),
      ]).start();
    }, 700);

    // Fade out and navigate — wait for store hydration first
    setTimeout(() => {
      Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true })
        .start(() => {
          // Wait until AsyncStorage has loaded into the store
          const checkAndNavigate = () => {
            const { _hasHydrated: hydrated, isLoggedIn: loggedIn, hasSelectedLanguage: langPicked } =
              useAppStore.getState();

            if (!hydrated) {
              // Not ready yet — retry after a short delay
              setTimeout(checkAndNavigate, 50);
              return;
            }

            if (!langPicked) {
              navigation.replace('Language');
            } else if (!loggedIn) {
              navigation.replace('Login');
            } else {
              navigation.replace('MainTabs');
            }
          };

          checkAndNavigate();
        });
    }, 2400);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />

      <View style={styles.glowCircle} />

      {/* Logo card */}
      <Animated.View style={[
        styles.logoWrap,
        { opacity: logoOpacity, transform: [{ scale: logoScale }] },
      ]}>
        <Text style={styles.logoEmoji}>🛒</Text>
      </Animated.View>

      {/* App name */}
      <Animated.View style={{ opacity: textOpacity, transform: [{ translateY: textY }], alignItems: 'center', marginTop: 20 }}>
        <Text style={styles.appName}>AI Store</Text>
        <Text style={styles.appSub}>ASSISTANT</Text>
      </Animated.View>

      {/* Dots */}
      <Animated.View style={[styles.dotsRow, { opacity: dotsOpacity }]}>
        {[dot1Scale, dot2Scale, dot3Scale].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { transform: [{ scale: dot }] }]} />
        ))}
      </Animated.View>

      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        Voice • Billing • Inventory
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: '30%',
  },
  logoWrap: {
    width: 90, height: 90, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji:  { fontSize: 40 },
  appName:    { fontSize: 32, fontWeight: '700', color: '#fff', letterSpacing: -0.8 },
  appSub:     { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 4, marginTop: 4 },
  dotsRow:    { flexDirection: 'row', gap: 8, marginTop: 36 },
  dot:        { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  tagline:    { position: 'absolute', bottom: 48, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
});
