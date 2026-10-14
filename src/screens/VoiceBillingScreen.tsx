import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, StatusBar, SafeAreaView, ScrollView,
  KeyboardAvoidingView, Platform, Alert, Easing,
} from 'react-native';
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';
import { extractBillItems, ExtractedItem } from '../services/llm';
import { database } from '../db';
import Bill from '../db/models/Bill';
import BillItem from '../db/models/BillItem';

type Props = NativeStackScreenProps<RootStackParamList, 'VoiceBilling'>;

type VoiceState = 'idle' | 'listening' | 'processing' | 'done';

// ── Cart Item Row ─────────────────────────────────────────────────
function CartItemRow({ item, index, onUpdate, onRemove }: {
  item: ExtractedItem & { id: string };
  index: number;
  onUpdate: (id: string, field: keyof ExtractedItem, value: any) => void;
  onRemove: (id: string) => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.cartRow, { opacity, transform: [{ translateY }] }]}>
      {/* Product name */}
      <TextInput
        style={styles.cartName}
        value={item.name}
        onChangeText={v => onUpdate(item.id, 'name', v)}
        placeholder="Product name"
        placeholderTextColor={COLORS.muted}
      />

      {/* Qty + unit */}
      <View style={styles.cartQtyRow}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => item.qty > 1 ? onUpdate(item.id, 'qty', item.qty - 1) : onRemove(item.id)}
        >
          <Text style={styles.qtyBtnTxt}>{item.qty > 1 ? '−' : '🗑'}</Text>
        </TouchableOpacity>
        <Text style={styles.qtyVal}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, { backgroundColor: COLORS.teal, borderColor: COLORS.teal }]}
          onPress={() => onUpdate(item.id, 'qty', item.qty + 1)}
        >
          <Text style={[styles.qtyBtnTxt, { color: COLORS.white }]}>＋</Text>
        </TouchableOpacity>
        <Text style={styles.unitText}>{item.unit}</Text>
      </View>

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={styles.priceRupee}>₹</Text>
        <TextInput
          style={styles.priceInput}
          value={item.price > 0 ? String(item.price) : ''}
          onChangeText={v => onUpdate(item.id, 'price', parseFloat(v) || 0)}
          keyboardType="number-pad"
          placeholder="Price"
          placeholderTextColor={COLORS.muted}
        />
      </View>
    </Animated.View>
  );
}

// ── Mic Visualizer ────────────────────────────────────────────────
function MicButton({ state, onPress }: { state: VoiceState; onPress: () => void }) {
  const ring1 = useRef(new Animated.Value(1)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const ring3 = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Opacity = useRef(new Animated.Value(0.35)).current;
  const ring3Opacity = useRef(new Animated.Value(0.2)).current;
  const btnScale = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  useEffect(() => {
    if (isListening) {
      loopRef.current = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ring1, { toValue: 1.4, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring1, { toValue: 1, duration: 800, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(200),
            Animated.timing(ring2, { toValue: 1.65, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring2, { toValue: 1, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.delay(400),
            Animated.timing(ring3, { toValue: 1.9, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(ring3, { toValue: 1, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          ]),
        ])
      );
      loopRef.current.start();
      Animated.spring(btnScale, { toValue: 1.08, tension: 100, friction: 6, useNativeDriver: true }).start();
    } else {
      loopRef.current?.stop();
      [ring1, ring2, ring3].forEach(r => Animated.spring(r, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start());
      Animated.spring(btnScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
    }
    return () => loopRef.current?.stop();
  }, [isListening]);

  const bgColor = isListening ? COLORS.red : isProcessing ? COLORS.amber : COLORS.teal;
  const micEmoji = isListening ? '🎙️' : isProcessing ? '⏳' : '🎤';
  const label = isListening ? 'Listening...' : isProcessing ? 'Processing with AI...' : 'Tap to Speak';

  return (
    <View style={styles.micWrap}>
      {/* Pulse rings */}
      <Animated.View style={[styles.micRing, styles.micRing3, { transform: [{ scale: ring3 }], opacity: ring3Opacity, borderColor: bgColor }]} />
      <Animated.View style={[styles.micRing, styles.micRing2, { transform: [{ scale: ring2 }], opacity: ring2Opacity, borderColor: bgColor }]} />
      <Animated.View style={[styles.micRing, styles.micRing1, { transform: [{ scale: ring1 }], opacity: ring1Opacity, borderColor: bgColor }]} />

      {/* Mic button */}
      <Animated.View style={{ transform: [{ scale: btnScale }] }}>
        <TouchableOpacity
          style={[styles.micBtn, { backgroundColor: bgColor }]}
          onPress={onPress}
          disabled={isProcessing}
          activeOpacity={0.9}
        >
          <Text style={styles.micEmoji}>{micEmoji}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.micLabel, { color: bgColor }]}>{label}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function VoiceBillingScreen({ navigation }: Props) {
  const { shopId, shopName, shopCity, t } = useAppStore();

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [cartItems, setCartItems] = useState<(ExtractedItem & { id: string })[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // ── Entrance animation ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Voice setup ──
  useEffect(() => {
    Voice.onSpeechStart = () => setVoiceState('listening');
    Voice.onSpeechEnd = () => setVoiceState('processing');
    Voice.onSpeechError = (e: SpeechErrorEvent) => {
      console.warn('[Voice] error:', e);
      setVoiceState('idle');
    };
    Voice.onSpeechResults = async (e: SpeechResultsEvent) => {
      const text = e.value?.[0] ?? '';
      setTranscript(text);
      if (text) await processWithLLM(text);
    };

    return () => { Voice.destroy().then(Voice.removeAllListeners); };
  }, []);

  const toggleVoice = async () => {
    if (voiceState === 'listening') {
      await Voice.stop();
    } else if (voiceState === 'idle' || voiceState === 'done') {
      try {
        setTranscript('');
        setVoiceState('listening');
        await Voice.start('en-IN');   // Supports mixed Indian languages
      } catch (e) {
        console.error('[Voice] start error:', e);
        setVoiceState('idle');
        Alert.alert('Microphone Error', 'Could not start voice recognition. Check microphone permissions.');
      }
    }
  };

  const processWithLLM = useCallback(async (text: string) => {
    setVoiceState('processing');
    try {
      const { items, usedFallback: fb } = await extractBillItems(text);
      setUsedFallback(fb);

      // Merge with existing cart (add qty if duplicate)
      setCartItems(prev => {
        const updated = [...prev];
        items.forEach(newItem => {
          const existing = updated.find(i => i.name.toLowerCase() === newItem.name.toLowerCase());
          if (existing) {
            existing.qty += newItem.qty;
          } else {
            updated.push({ ...newItem, id: `${Date.now()}_${Math.random()}` });
          }
        });
        return updated;
      });

      setVoiceState('done');
    } catch (e) {
      console.error('[VoiceBilling] LLM error:', e);
      setVoiceState('idle');
      Alert.alert('AI Error', 'Could not process your voice. Please try again.');
    }
  }, []);

  // ── Cart ops ──
  const updateItem = (id: string, field: keyof ExtractedItem, value: any) => {
    setCartItems(c => c.map(i => i.id === id ? { ...i, [field]: value } : i));
  };
  const removeItem = (id: string) => setCartItems(c => c.filter(i => i.id !== id));

  const totalAmount = cartItems.reduce((s, i) => s + i.qty * i.price, 0);
  const totalItems = cartItems.reduce((s, i) => s + i.qty, 0);

  // ── Save & Generate Invoice ──
  const saveBill = async () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Bill', 'Add at least one product by speaking or typing.');
      return;
    }

    setSaving(true);
    try {
      let savedBillId = '';

      await database.write(async () => {
        const bill = await database.get<Bill>('bills').create((b: any) => {
          b.shopId = shopId ?? 'SHOP_001';
          b.customerName = customerName.trim() || 'Walk-in Customer';
          b.customerPhone = '';
          b.totalAmount = totalAmount;
          b.itemsCount = totalItems;
          b.createdAt = Date.now();
          b.isSynced = false;
        });

        savedBillId = bill.id;

        for (const item of cartItems) {
          await database.get<BillItem>('bill_items').create((bi: any) => {
            bi.billId = bill.id;
            bi.productName = item.name;
            bi.qty = item.qty;
            bi.unitPrice = item.price;
            bi.totalPrice = item.qty * item.price;
          });
        }
      });

      // Navigate to invoice screen
      navigation.replace('Invoice', { billId: savedBillId });
    } catch (e) {
      console.error('[VoiceBilling] save error:', e);
      Alert.alert('Error', 'Failed to save bill. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* ── Top Bar ── */}
      <Animated.View style={[styles.topBar, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>🎙️ Voice Billing</Text>
        <View style={styles.shopBadge}>
          <Text style={styles.shopBadgeTxt}>{shopName.slice(0, 12)}</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Mic Section ── */}
          <MicButton state={voiceState} onPress={toggleVoice} />

          {/* ── Transcript ── */}
          {transcript ? (
            <Animated.View style={[styles.transcriptBox, { opacity: fadeAnim }]}>
              <Text style={styles.transcriptLabel}>You said:</Text>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
              {usedFallback && (
                <Text style={styles.fallbackNote}>⚡ AI offline — used smart parser</Text>
              )}
            </Animated.View>
          ) : (
            <View style={styles.hintBox}>
              <Text style={styles.hintText}>
                Say something like:{'\n'}
                <Text style={styles.hintExample}>"2 kg rice, 3 coke, 1 packet chips"</Text>
              </Text>
            </View>
          )}

          {/* ── Customer Name ── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CUSTOMER (OPTIONAL)</Text>
            <View style={styles.customerRow}>
              <Text style={{ fontSize: 16 }}>👤</Text>
              <TextInput
                style={styles.customerInput}
                placeholder="Walk-in Customer"
                placeholderTextColor={COLORS.muted}
                value={customerName}
                onChangeText={setCustomerName}
              />
            </View>
          </View>

          {/* ── Cart Items ── */}
          {cartItems.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionLabel}>ITEMS ({cartItems.length})</Text>
                <TouchableOpacity onPress={() => { setCartItems([]); setTranscript(''); setVoiceState('idle'); }}>
                  <Text style={styles.clearBtn}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cartCard}>
                {cartItems.map((item, idx) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </View>
              <Text style={styles.priceHint}>
                💡 Set prices above to calculate total
              </Text>
            </View>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ── Sticky Footer ── */}
        <View style={styles.footer}>
          <View style={styles.footerInner}>
            <View>
              <Text style={styles.footerItems}>{totalItems} items · {cartItems.length} products</Text>
              <Text style={styles.footerTotal}>
                {totalAmount > 0 ? `₹${totalAmount.toLocaleString('en-IN')}` : '—'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.genBtn, (saving || cartItems.length === 0) && styles.genBtnDisabled]}
              onPress={saveBill}
              disabled={saving || cartItems.length === 0}
              activeOpacity={0.88}
            >
              <Text style={styles.genBtnText}>
                {saving ? 'Saving...' : '🧾  Generate Bill'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const RING_SIZE = 100;
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingBottom: 20 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  topTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink },
  shopBadge: { backgroundColor: COLORS.tealLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  shopBadgeTxt: { fontSize: 11, fontWeight: '600', color: COLORS.teal },

  // Mic
  micWrap: { alignItems: 'center', paddingVertical: 36 },
  micRing: { position: 'absolute', borderWidth: 2, borderRadius: 999 },
  micRing1: { width: RING_SIZE + 40, height: RING_SIZE + 40 },
  micRing2: { width: RING_SIZE + 80, height: RING_SIZE + 80 },
  micRing3: { width: RING_SIZE + 120, height: RING_SIZE + 120 },
  micBtn: { width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2, alignItems: 'center', justifyContent: 'center', elevation: 12, shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
  micEmoji: { fontSize: 38 },
  micLabel: { marginTop: 80, fontSize: 14, fontWeight: '600' },

  // Transcript
  transcriptBox: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.tealLight },
  transcriptLabel: { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 4 },
  transcriptText: { fontSize: 15, color: COLORS.ink, fontStyle: 'italic', lineHeight: 22 },
  fallbackNote: { fontSize: 11, color: COLORS.amber, marginTop: 6, fontWeight: '500' },

  // Hint
  hintBox: { backgroundColor: COLORS.bg, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  hintText: { fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },
  hintExample: { fontSize: 14, fontWeight: '600', color: COLORS.teal, fontStyle: 'italic' },

  // Sections
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  clearBtn: { fontSize: 12, color: COLORS.red, fontWeight: '600' },

  // Customer
  customerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  customerInput: { flex: 1, fontSize: 15, color: COLORS.ink },

  // Cart
  cartCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', elevation: 2 },
  cartRow: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: 8 },
  cartName: { fontSize: 14, fontWeight: '600', color: COLORS.ink, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 4, marginBottom: 4 },
  cartQtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  qtyBtnTxt: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  qtyVal: { fontSize: 15, fontWeight: '800', color: COLORS.ink, minWidth: 24, textAlign: 'center' },
  unitText: { fontSize: 12, color: COLORS.muted, marginLeft: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, gap: 4, alignSelf: 'flex-start' },
  priceRupee: { fontSize: 14, fontWeight: '700', color: COLORS.teal },
  priceInput: { fontSize: 14, color: COLORS.ink, minWidth: 70 },
  priceHint: { fontSize: 11, color: COLORS.muted, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  footerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerItems: { fontSize: 11, color: COLORS.muted },
  footerTotal: { fontSize: 22, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  genBtn: { backgroundColor: COLORS.teal, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14, elevation: 6, shadowColor: COLORS.teal, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  genBtnDisabled: { backgroundColor: COLORS.border, elevation: 0, shadowOpacity: 0 },
  genBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
