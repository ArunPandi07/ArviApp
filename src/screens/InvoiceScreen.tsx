import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar, SafeAreaView, ScrollView, Alert,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';
import { database } from '../db';
import Bill from '../db/models/Bill';
import BillItem from '../db/models/BillItem';
import { generateInvoicePDF, shareToWhatsApp, downloadOrSharePDF, InvoiceItem } from '../services/invoice';

type Props = NativeStackScreenProps<RootStackParamList, 'Invoice'>;

function formatDateTime(ts: number): { date: string; time: string } {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

// ── Invoice Item Row ──────────────────────────────────────────────
function InvoiceRow({ item, index }: { item: BillItem; index: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const x       = useRef(new Animated.Value(-12)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.spring(x,       { toValue: 0, tension: 120, friction: 10, useNativeDriver: true }),
      ]).start();
    }, index * 50);
  }, []);

  return (
    <Animated.View style={[styles.itemRow, index > 0 && styles.itemRowBorder, { opacity, transform: [{ translateX: x }] }]}>
      <View style={styles.itemLeft}>
        <View style={styles.itemNumBadge}>
          <Text style={styles.itemNum}>{index + 1}</Text>
        </View>
        <View>
          <Text style={styles.itemName}>{item.productName}</Text>
          <Text style={styles.itemDetail}>{item.qty} × ₹{item.unitPrice.toFixed(2)}</Text>
        </View>
      </View>
      <Text style={styles.itemTotal}>₹{item.totalPrice.toFixed(2)}</Text>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function InvoiceScreen({ navigation, route }: Props) {
  const { billId } = route.params;
  const { shopName, shopCity } = useAppStore();

  const [bill,       setBill]       = useState<Bill | null>(null);
  const [items,      setItems]      = useState<BillItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pdfPath,    setPdfPath]    = useState<string | null>(null);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerScale   = useRef(new Animated.Value(0.95)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const btnScale      = useRef(new Animated.Value(0)).current;

  // ── Load bill data ──
  useEffect(() => {
    const load = async () => {
      try {
        const b = await database.get<Bill>('bills').find(billId);
        const its = await database.get<BillItem>('bill_items').query().fetch();
        const billItems = its.filter(i => i.billId === billId);
        setBill(b);
        setItems(billItems);
      } catch (e) {
        console.error('[Invoice] load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [billId]);

  // ── Entrance animation ──
  useEffect(() => {
    if (!loading && bill) {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.spring(headerScale,   { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(contentOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.spring(btnScale, { toValue: 1, tension: 80, friction: 8, delay: 100, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [loading, bill]);

  // ── Generate PDF ──
  const handleGeneratePDF = async (): Promise<string> => {
    if (pdfPath) return pdfPath;  // reuse if already generated
    if (!bill) throw new Error('No bill data');

    const invoiceItems: InvoiceItem[] = items.map(i => ({
      name:       i.productName,
      qty:        i.qty,
      unit:       'pcs',
      unitPrice:  i.unitPrice,
      totalPrice: i.totalPrice,
    }));

    const path = await generateInvoicePDF({
      billId:       bill.id,
      billNumber:   bill.id.slice(-6).toUpperCase(),
      shopName,
      shopCity,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      items:        invoiceItems,
      totalAmount:  bill.totalAmount,
      createdAt:    bill.createdAt,
    });

    setPdfPath(path);
    return path;
  };

  const onDownload = async () => {
    setGenerating(true);
    try {
      const path = await handleGeneratePDF();
      await downloadOrSharePDF(path, bill!.id.slice(-6).toUpperCase());
    } catch (e: any) {
      Alert.alert('Error', `Could not generate PDF: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const onWhatsApp = async () => {
    setGenerating(true);
    try {
      const path = await handleGeneratePDF();
      await shareToWhatsApp(path, bill?.customerName ?? '');
    } catch (e: any) {
      Alert.alert('Error', `Could not share: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 40 }}>🧾</Text>
          <Text style={styles.loadingText}>Loading invoice...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 40 }}>❌</Text>
          <Text style={styles.loadingText}>Bill not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { date, time } = formatDateTime(bill.createdAt);
  const billNumber     = bill.id.slice(-6).toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.teal} />

      {/* ── Teal Header ── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={styles.backTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerEmoji}>🧾</Text>
          <Text style={styles.headerTitle}>Invoice</Text>
          <Text style={styles.headerNum}>#{billNumber}</Text>
        </View>

        <View style={[styles.syncBadge, { backgroundColor: bill.isSynced ? 'rgba(255,255,255,0.25)' : 'rgba(255,165,0,0.3)' }]}>
          <Text style={styles.syncText}>{bill.isSynced ? '✓ Synced' : '⏳ Pending'}</Text>
        </View>
      </Animated.View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: contentOpacity }}>

          {/* ── Invoice Card ── */}
          <View style={styles.invoiceCard}>
            {/* Shop info */}
            <View style={styles.shopRow}>
              <View style={styles.shopLogoWrap}>
                <Text style={{ fontSize: 20 }}>🛒</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{shopName}</Text>
                <Text style={styles.shopCity}>{shopCity}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{date}</Text>
                <Text style={styles.metaTime}>{time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Customer */}
            <View style={styles.customerRow}>
              <Text style={styles.metaLabel}>Customer</Text>
              <Text style={styles.customerName}>{bill.customerName}</Text>
            </View>

            <View style={styles.divider} />

            {/* Items */}
            <View style={styles.itemsHeader}>
              <Text style={styles.colItem}>Item</Text>
              <Text style={styles.colAmt}>Amount</Text>
            </View>

            {items.map((item, i) => (
              <InvoiceRow key={item.id} item={item} index={i} />
            ))}

            {/* Total */}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total ({bill.itemsCount} items)</Text>
              </View>
              <Text style={styles.totalAmount}>₹{bill.totalAmount.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          {/* ── Thank you ── */}
          <Text style={styles.thankYou}>🙏  Thank you for shopping!</Text>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* ── Action Buttons ── */}
      <Animated.View style={[styles.actions, { transform: [{ scale: btnScale }] }]}>
        {/* Download */}
        <TouchableOpacity
          style={styles.downloadBtn}
          onPress={onDownload}
          disabled={generating}
          activeOpacity={0.88}
        >
          <Text style={styles.downloadIcon}>⬇️</Text>
          <Text style={styles.downloadText}>{generating ? 'Generating...' : 'Download PDF'}</Text>
        </TouchableOpacity>

        {/* WhatsApp */}
        <TouchableOpacity
          style={styles.waBtn}
          onPress={onWhatsApp}
          disabled={generating}
          activeOpacity={0.88}
        >
          <Text style={styles.waIcon}>📲</Text>
          <Text style={styles.waText}>Share WhatsApp</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: COLORS.muted },

  // Header
  header:        { backgroundColor: COLORS.teal, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  backBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backTxt:       { fontSize: 14, color: COLORS.white, fontWeight: '700' },
  headerCenter:  { alignItems: 'center' },
  headerEmoji:   { fontSize: 28, marginBottom: 4 },
  headerTitle:   { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600', letterSpacing: 1 },
  headerNum:     { fontSize: 20, color: COLORS.white, fontWeight: '900', letterSpacing: 1 },
  syncBadge:     { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  syncText:      { fontSize: 11, color: COLORS.white, fontWeight: '600' },

  // Invoice card
  invoiceCard:  { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginTop: -10, elevation: 6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, marginBottom: 14 },
  shopRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  shopLogoWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.tealLight, alignItems: 'center', justifyContent: 'center' },
  shopName:     { fontSize: 15, fontWeight: '800', color: COLORS.ink },
  shopCity:     { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  metaLabel:    { fontSize: 10, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue:    { fontSize: 12, fontWeight: '600', color: COLORS.ink, textAlign: 'right' },
  metaTime:     { fontSize: 11, color: COLORS.muted, textAlign: 'right' },

  divider:      { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },

  customerRow:  { marginBottom: 4 },
  customerName: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginTop: 2 },

  // Items
  itemsHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  colItem:      { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  colAmt:       { fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  itemRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  itemRowBorder:{ borderTopWidth: 0.5, borderTopColor: COLORS.border },
  itemLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  itemNumBadge: { width: 22, height: 22, borderRadius: 6, backgroundColor: COLORS.tealLight, alignItems: 'center', justifyContent: 'center' },
  itemNum:      { fontSize: 10, fontWeight: '800', color: COLORS.teal },
  itemName:     { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  itemDetail:   { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  itemTotal:    { fontSize: 14, fontWeight: '700', color: COLORS.ink },

  // Total
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: COLORS.teal },
  totalLabel:   { fontSize: 13, fontWeight: '700', color: COLORS.ink },
  totalAmount:  { fontSize: 22, fontWeight: '900', color: COLORS.teal },

  thankYou: { textAlign: 'center', fontSize: 13, color: COLORS.muted, marginBottom: 8 },

  // Action buttons
  actions:     { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 24, backgroundColor: COLORS.white, borderTopWidth: 0.5, borderTopColor: COLORS.border },
  downloadBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.bg, borderRadius: 16, paddingVertical: 15, borderWidth: 1.5, borderColor: COLORS.border },
  downloadIcon:{ fontSize: 18 },
  downloadText:{ fontSize: 14, fontWeight: '700', color: COLORS.ink },
  waBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#25D366', borderRadius: 16, paddingVertical: 15, elevation: 6, shadowColor: '#25D366', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  waIcon:      { fontSize: 18 },
  waText:      { fontSize: 14, fontWeight: '700', color: COLORS.white },
});
