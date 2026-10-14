import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, StatusBar, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';
import { database } from '../db';
import Bill from '../db/models/Bill';
import BillItem from '../db/models/BillItem';

type Props = NativeStackScreenProps<RootStackParamList, 'NewBill'>;

interface CartItem {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

// ── Cart Row ──────────────────────────────────────────────────────
function CartRow({ item, index, onQtyChange, onRemove }: {
  item: CartItem;
  index: number;
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(translateX,  { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(opacity,     { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateX,  { toValue: 40, duration: 200, useNativeDriver: true }),
    ]).start(() => onRemove(item.id));
  };

  const total = item.qty * item.unitPrice;

  return (
    <Animated.View style={[styles.cartRow, { opacity, transform: [{ translateX }] }]}>
      {/* Left — name + price */}
      <View style={styles.cartLeft}>
        <Text style={styles.cartName} numberOfLines={1}>{item.productName}</Text>
        <Text style={styles.cartPrice}>₹{item.unitPrice} per unit</Text>
      </View>

      {/* Qty controls */}
      <View style={styles.qtyControls}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => item.qty > 1 ? onQtyChange(item.id, item.qty - 1) : handleRemove()}
        >
          <Text style={styles.qtyBtnText}>{item.qty > 1 ? '−' : '🗑'}</Text>
        </TouchableOpacity>
        <Text style={styles.qtyVal}>{item.qty}</Text>
        <TouchableOpacity
          style={[styles.qtyBtn, styles.qtyBtnPlus]}
          onPress={() => onQtyChange(item.id, item.qty + 1)}
        >
          <Text style={[styles.qtyBtnText, { color: COLORS.white }]}>＋</Text>
        </TouchableOpacity>
      </View>

      {/* Total */}
      <Text style={styles.cartTotal}>₹{total.toLocaleString('en-IN')}</Text>
    </Animated.View>
  );
}

// ── Add Product Row ───────────────────────────────────────────────
function AddProductRow({ onAdd }: { onAdd: (name: string, price: number) => void }) {
  const [name,  setName]  = useState('');
  const [price, setPrice] = useState('');
  const priceRef = useRef<TextInput>(null);

  const handleAdd = () => {
    const p = parseFloat(price);
    if (!name.trim())   { Alert.alert('', 'Enter product name'); return; }
    if (!p || p <= 0)   { Alert.alert('', 'Enter valid price');  return; }
    onAdd(name.trim(), p);
    setName(''); setPrice('');
  };

  return (
    <View style={styles.addRow}>
      <TextInput
        style={[styles.addInput, { flex: 2 }]}
        placeholder="Product name"
        placeholderTextColor={COLORS.muted}
        value={name}
        onChangeText={setName}
        returnKeyType="next"
        onSubmitEditing={() => priceRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextInput
        ref={priceRef}
        style={[styles.addInput, { flex: 1 }]}
        placeholder="Price ₹"
        placeholderTextColor={COLORS.muted}
        value={price}
        onChangeText={setPrice}
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity
        style={[styles.addBtn, (!name.trim() || !price) && styles.addBtnDisabled]}
        onPress={handleAdd}
        disabled={!name.trim() || !price}
        activeOpacity={0.85}
      >
        <Text style={styles.addBtnText}>Add</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function NewBillScreen({ navigation }: Props) {
  const { shopId, shopName } = useAppStore();

  const [customerName, setCustomerName] = useState('');
  const [cart,         setCart]         = useState<CartItem[]>([]);
  const [saving,       setSaving]       = useState(false);

  const slideAnim  = useRef(new Animated.Value(30)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      Animated.timing(footerAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, 200);
  }, []);

  // ── Cart ops ──
  const addToCart = (productName: string, unitPrice: number) => {
    const existing = cart.find(i => i.productName.toLowerCase() === productName.toLowerCase());
    if (existing) {
      setCart(c => c.map(i => i.id === existing.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart(c => [...c, { id: Date.now().toString(), productName, qty: 1, unitPrice }]);
    }
  };

  const updateQty = (id: string, qty: number) =>
    setCart(c => c.map(i => i.id === id ? { ...i, qty } : i));

  const removeItem = (id: string) =>
    setCart(c => c.filter(i => i.id !== id));

  // ── Totals ──
  const totalAmount = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const totalItems  = cart.reduce((s, i) => s + i.qty, 0);

  // ── Save Bill ──
  const saveBill = async () => {
    if (cart.length === 0) {
      Alert.alert('Empty Bill', 'Add at least one product to save a bill.');
      return;
    }

    setSaving(true);
    try {
      await database.write(async () => {
        const bill = await database.get<Bill>('bills').create((b: any) => {
          b.shopId        = shopId ?? 'SHOP_001';
          b.customerName  = customerName.trim() || 'Walk-in Customer';
          b.customerPhone = '';
          b.totalAmount   = totalAmount;
          b.itemsCount    = totalItems;
          b.createdAt     = Date.now();
          b.isSynced      = false;
        });

        for (const item of cart) {
          await database.get<BillItem>('bill_items').create((bi: any) => {
            bi.billId       = bill.id;
            bi.productName  = item.productName;
            bi.qty          = item.qty;
            bi.unitPrice    = item.unitPrice;
            bi.totalPrice   = item.qty * item.unitPrice;
          });
        }
      });

      navigation.goBack();
    } catch (e) {
      console.error('[NewBill] save error:', e);
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
        <Text style={styles.topTitle}>New Bill</Text>
        <View style={styles.shopBadge}>
          <Text style={styles.shopBadgeTxt}>🛒 {shopName.slice(0, 10)}</Text>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Customer Name ── */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionLabel}>CUSTOMER</Text>
            <View style={styles.customerRow}>
              <Text style={styles.customerIcon}>👤</Text>
              <TextInput
                style={styles.customerInput}
                placeholder="Walk-in Customer (optional)"
                placeholderTextColor={COLORS.muted}
                value={customerName}
                onChangeText={setCustomerName}
                returnKeyType="done"
              />
            </View>
          </Animated.View>

          {/* ── Add Product ── */}
          <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
            <Text style={styles.sectionLabel}>ADD PRODUCT</Text>
            <AddProductRow onAdd={addToCart} />
          </Animated.View>

          {/* ── Cart ── */}
          {cart.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ITEMS IN BILL ({totalItems})</Text>
              <View style={styles.cartCard}>
                {cart.map((item, idx) => (
                  <CartRow
                    key={item.id}
                    item={item}
                    index={idx}
                    onQtyChange={updateQty}
                    onRemove={removeItem}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── Empty cart hint ── */}
          {cart.length === 0 && (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartEmoji}>📦</Text>
              <Text style={styles.emptyCartText}>
                Add products above to start building this bill
              </Text>
            </View>
          )}

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* ── Sticky Footer ── */}
        <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
          <View style={styles.footerRow}>
            <View>
              <Text style={styles.footerSub}>{cart.length} product{cart.length !== 1 ? 's' : ''} · {totalItems} items</Text>
              <Text style={styles.footerTotal}>₹{totalAmount.toLocaleString('en-IN')}</Text>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, (saving || cart.length === 0) && styles.saveBtnDisabled]}
              onPress={saveBill}
              disabled={saving || cart.length === 0}
              activeOpacity={0.88}
            >
              {saving ? (
                <Text style={styles.saveBtnText}>Saving...</Text>
              ) : (
                <Text style={styles.saveBtnText}>💾  Save Bill</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.white },
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16 },

  // Top bar
  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.white, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { fontSize: 14, color: COLORS.muted, fontWeight: '600' },
  topTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink },
  shopBadge:{ backgroundColor: COLORS.tealLight, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  shopBadgeTxt: { fontSize: 11, fontWeight: '600', color: COLORS.teal },

  // Sections
  section:      { marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.muted, letterSpacing: 0.8, marginBottom: 8, textTransform: 'uppercase' },

  // Customer
  customerRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  customerIcon: { fontSize: 18 },
  customerInput:{ flex: 1, fontSize: 15, color: COLORS.ink },

  // Add product
  addRow:   { flexDirection: 'row', gap: 8 },
  addInput: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14, color: COLORS.ink },
  addBtn:   { backgroundColor: COLORS.teal, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center' },
  addBtnDisabled: { backgroundColor: COLORS.border },
  addBtnText:     { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Cart
  cartCard: { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', elevation: 2 },
  cartRow:  { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, gap: 10 },
  cartLeft: { flex: 1 },
  cartName: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  cartPrice:{ fontSize: 11, color: COLORS.muted, marginTop: 2 },
  cartTotal:{ fontSize: 14, fontWeight: '800', color: COLORS.ink, minWidth: 60, textAlign: 'right' },

  // Qty controls
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn:      { width: 30, height: 30, borderRadius: 8, backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnPlus:  { backgroundColor: COLORS.teal, borderColor: COLORS.teal },
  qtyBtnText:  { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  qtyVal:      { fontSize: 15, fontWeight: '800', color: COLORS.ink, minWidth: 22, textAlign: 'center' },

  // Empty cart
  emptyCart:     { alignItems: 'center', paddingVertical: 40 },
  emptyCartEmoji:{ fontSize: 48, marginBottom: 12 },
  emptyCartText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 22 },

  // Footer
  footer:     { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border, padding: 16, paddingBottom: 24, elevation: 16 },
  footerRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerSub:  { fontSize: 11, color: COLORS.muted },
  footerTotal:{ fontSize: 24, fontWeight: '800', color: COLORS.ink, marginTop: 2 },
  saveBtn:    { backgroundColor: COLORS.teal, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 14, elevation: 6, shadowColor: COLORS.teal, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  saveBtnDisabled: { backgroundColor: COLORS.border, elevation: 0, shadowOpacity: 0 },
  saveBtnText:     { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
