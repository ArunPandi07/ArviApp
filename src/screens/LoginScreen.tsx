import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type Step = 'phone' | 'otp';

const OTP_LENGTH = 6;

export default function LoginScreen({ navigation }: Props) {
  const { t, setAuth } = useAppStore();

  const hiddenInputRef = useRef<TextInput | null>(null);

  const [step, setStep] = useState<Step>('phone');

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [timer, setTimer] = useState(0);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ─────────────────────────────────────────────
  // Animation
  // ─────────────────────────────────────────────

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [step]);

  // ─────────────────────────────────────────────
  // OTP Timer
  // ─────────────────────────────────────────────

  useEffect(() => {
    if (timer <= 0) return;

    const id = setTimeout(() => {
      setTimer(v => v - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timer]);

  // ─────────────────────────────────────────────
  // Send OTP
  // ─────────────────────────────────────────────

  const handleSendOtp = () => {
    setError('');

    if (phone.length < 10) {
      setError('Enter valid phone number');
      return;
    }

    setSending(true);

    setTimeout(() => {
      setSending(false);

      setStep('otp');

      setTimer(30);

      setTimeout(() => {
        hiddenInputRef.current?.focus();
      }, 300);
    }, 1000);
  };

  // ─────────────────────────────────────────────
  // OTP Change
  // ─────────────────────────────────────────────

  const handleOtpChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, OTP_LENGTH);

    setOtp(cleaned);

    if (cleaned.length === OTP_LENGTH) {
      verifyOtp(cleaned);
    }
  };

  // ─────────────────────────────────────────────
  // Verify OTP
  // ─────────────────────────────────────────────

  const verifyOtp = (code: string) => {
    setVerifying(true);

    setTimeout(() => {
      setVerifying(false);

      setAuth(
        'SHOP_001',
        phone,
        'Murugan Stores'
      );

      navigation.replace('MainTabs');
    }, 1000);
  };

  const filledOtp = otp;

  // ─────────────────────────────────────────────
  // PHONE STEP
  // ─────────────────────────────────────────────

  const PhoneStep = () => (
    <Animated.View
      style={[
        styles.stepWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Brand */}

      <View style={styles.brandRow}>
        <View style={styles.brandLogo}>
          <Text style={{ fontSize: 18 }}>🛒</Text>
        </View>

        <View>
          <Text style={styles.brandName}>
            AI Store Assistant
          </Text>

          <Text style={styles.brandTag}>
            Smart Voice Billing
          </Text>
        </View>
      </View>

      {/* Heading */}

      <Text style={styles.stepTitle}>
        Welcome 👋
      </Text>

      <Text style={styles.stepSub}>
        Login with phone number
      </Text>

      {/* Phone */}

      <Text style={styles.fieldLabel}>
        PHONE NUMBER
      </Text>

      <View style={styles.phoneRow}>
        <View style={styles.countryCode}>
          <Text style={styles.countryCodeText}>
            🇮🇳 +91
          </Text>
        </View>

        <TextInput
          style={[
            styles.phoneInput,
            phone.length === 10 &&
              styles.phoneInputValid,
          ]}
          keyboardType="number-pad"
          maxLength={10}
          value={phone}
          onChangeText={v => {
            setPhone(v.replace(/\D/g, ''));
            setError('');
          }}
          placeholder="Enter mobile number"
          placeholderTextColor={COLORS.muted}
          autoFocus
          blurOnSubmit={false}
        />
      </View>

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* Button */}

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          phone.length < 10 &&
            styles.primaryBtnDisabled,
        ]}
        onPress={handleSendOtp}
        disabled={phone.length < 10 || sending}
        activeOpacity={0.85}
      >
        {sending ? (
          <ActivityIndicator
            color={COLORS.white}
            size="small"
          />
        ) : (
          <Text style={styles.primaryBtnText}>
            Send OTP →
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // ─────────────────────────────────────────────
  // OTP STEP
  // ─────────────────────────────────────────────

  const OtpStep = () => (
    <Animated.View
      style={[
        styles.stepWrap,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Back */}

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          setStep('phone');
          setOtp('');
        }}
      >
        <Text style={styles.backText}>
          ← Back
        </Text>
      </TouchableOpacity>

      {/* Title */}

      <Text style={styles.stepTitle}>
        Verify OTP
      </Text>

      <Text style={styles.stepSub}>
        Sent to +91 {phone}
      </Text>

      {/* OTP UI */}

      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          hiddenInputRef.current?.focus()
        }
      >
        <View style={styles.otpRow}>
          {[...Array(OTP_LENGTH)].map((_, i) => {
            const digit = otp[i] || '';

            return (
              <View
                key={i}
                style={[
                  styles.otpBox,
                  digit &&
                    styles.otpBoxFilled,
                ]}
              >
                <Text style={styles.otpText}>
                  {digit}
                </Text>
              </View>
            );
          })}
        </View>
      </TouchableOpacity>

      {/* Hidden Input */}

      <TextInput
        ref={hiddenInputRef}
        value={otp}
        onChangeText={handleOtpChange}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        style={styles.hiddenInput}
      />

      {/* Error */}

      {error ? (
        <Text style={styles.error}>
          {error}
        </Text>
      ) : null}

      {/* Resend */}

      <View style={styles.resendRow}>
        {timer > 0 ? (
          <Text style={styles.timerText}>
            Resend in {timer}s
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => {
              setOtp('');
              setTimer(30);
            }}
          >
            <Text style={styles.resendText}>
              Resend OTP
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Verify */}

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          (filledOtp.length < OTP_LENGTH ||
            verifying) &&
            styles.primaryBtnDisabled,
        ]}
        onPress={() =>
          verifyOtp(filledOtp)
        }
        disabled={
          filledOtp.length < OTP_LENGTH ||
          verifying
        }
      >
        {verifying ? (
          <ActivityIndicator
            color={COLORS.white}
          />
        ) : (
          <Text style={styles.primaryBtnText}>
            Verify →
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  // ─────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.white}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.container}>
          {step === 'phone' ? (
            <PhoneStep />
          ) : (
            <OtpStep />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },

  stepWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
  },

  brandLogo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: COLORS.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.ink,
  },

  brandTag: {
    fontSize: 11,
    color: COLORS.muted,
  },

  stepTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },

  stepSub: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    marginBottom: 28,
  },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.ink2,
    marginBottom: 8,
  },

  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },

  countryCode: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },

  countryCodeText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.ink2,
  },

  phoneInput: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: COLORS.ink,
  },

  phoneInputValid: {
    borderColor: COLORS.teal,
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },

  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },

  otpBoxFilled: {
    borderColor: COLORS.teal,
    backgroundColor: COLORS.tealLight,
  },

  otpText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.teal,
  },

  hiddenInput: {
    position: 'absolute',
    opacity: 0,
  },

  resendRow: {
    alignItems: 'center',
    marginBottom: 24,
  },

  timerText: {
    fontSize: 13,
    color: COLORS.muted,
  },

  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.teal,
  },

  error: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 10,
  },

  primaryBtn: {
    backgroundColor: COLORS.teal,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },

  primaryBtnDisabled: {
    backgroundColor: COLORS.border,
  },

  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },

  backBtn: {
    marginBottom: 24,
  },

  backText: {
    fontSize: 13,
    color: COLORS.muted,
  },
});