import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, SafeAreaView,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'HomeTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

// ── Mock data (replace with WatermelonDB queries) ─────────────────
const MOCK_STATS = {
  billsToday: 24,
  revenueToday: 6840,
  pendingSync: 2,
};

const MOCK_LOW_STOCK = [
  { id: '1', name: 'Tata Salt',     qty: 2,  unit: 'kg'  },
  { id: '2', name: 'Sunflower Oil', qty: 1,  unit: 'L'   },
  { id: '3', name: 'Parle-G',       qty: 4,  unit: 'pkt' },
];

const MOCK_RECENT_BILLS = [
  { id: 'b1', name: 'Kamala Devi', time: '2:14 PM', amount: 340,  synced: true  },
  { id: 'b2', name: 'Rajan',       time: '1:52 PM', amount: 215,  synced: true  },
  { id: 'b3', name: 'Selvi Amma',  time: '1:38 PM', amount: 480,  synced: false },
  { id: 'b4', name: 'Murugesan',   time: '12:05 PM',amount: 125,  synced: true  },
];

// ── Sub-components ────────────────────────────────────────────────

function ConnectivityBar({ isOnline, t }: { isOnline: boolean; t: (k:string)=>string }) {
  return (
    <View style={[styles.connBar, { backgroundColor: isOnline ? COLORS.tealLight : COLORS.amberLight }]}>
      <View style={[styles.connDot, { backgroundColor: isOnline ? COLORS.teal : COLORS.amber }]} />
      <Text style={[styles.connText, { color: isOnline ? COLORS.tealDark : '#633806' }]}>
        {isOnline ? t('syncedMsg') : t('offlineMsg')}
      </Text>
    </View>
  );
}

function StatCard({ value, label, icon, color, delay }: {
  value: string; label: string; icon: string; color: string; delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y       = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(y,       { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }, delay);
  }, []);

  return (
    <Animated.View style={[styles.statCard, { opacity, transform: [{ translateY: y }] }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function LowStockCard({ items, t, delay }: {
  items: typeof MOCK_LOW_STOCK; t: (k:string)=>string; delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, delay);
  }, []);

  if (items.length === 0) return null;

  return (
    <Animated.View style={[styles.lowStockCard, { opacity }]}>
      <View style={styles.lowStockHeader}>
        <Text style={styles.lowStockTitle}>⚠️  {t('lowStock')}</Text>
        <View style={styles.lowStockBadge}>
          <Text style={styles.lowStockBadgeText}>{items.length} items</Text>
        </View>
      </View>
      {items.map((item, i) => (
        <View key={item.id} style={[styles.lowStockRow, i > 0 && styles.lowStockRowBorder]}>
          <Text style={styles.lowStockName}>{item.name}</Text>
          <Text style={styles.lowStockQty}>{item.qty} {item.unit}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

function VoiceBillBtn({ t, onPress, delay }: {
  t: (k:string)=>string; onPress: () => void; delay: number;
}) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const scale     = useRef(new Animated.Value(0.96)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(scale,   { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
      ]).start();
    }, delay);

    // Pulse ring
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <TouchableOpacity style={styles.voiceBtn} onPress={onPress} activeOpacity={0.88}>
        <Animated.View style={[styles.voiceMic, { transform: [{ scale: pulseScale }] }]}>
          <Text style={{ fontSize: 26 }}>🎙️</Text>
        </Animated.View>
        <View>
          <Text style={styles.voiceBtnTitle}>{t('voiceBill')}</Text>
          <Text style={styles.voiceBtnSub}>{t('voiceHint')}</Text>
        </View>
        <Text style={styles.voiceArrow}>→</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function RecentBillsSection({ bills, t, onSeeAll, delay }: {
  bills: typeof MOCK_RECENT_BILLS;
  t: (k:string)=>string;
  onSeeAll: () => void;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    setTimeout(() => {
      Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, delay);
  }, []);

  return (
    <Animated.View style={{ opacity }}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t('recentBills')}</Text>
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>{t('seeAll')} →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.billsCard}>
        {bills.map((bill, i) => (
          <View key={bill.id} style={[styles.billRow, i > 0 && styles.billRowBorder]}>
            <View style={styles.billLeft}>
              <View style={[styles.syncDot, { backgroundColor: bill.synced ? COLORS.teal : COLORS.amber }]} />
              <View>
                <Text style={styles.billName}>{bill.name}</Text>
                <Text style={styles.billTime}>{bill.time}</Text>
              </View>
            </View>
            <Text style={styles.billAmt}>₹{bill.amount}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Main Dashboard Screen ─────────────────────────────────────────
export default function DashboardScreen({ navigation }: Props) {
  const { t, shopName, shopCity, isOnline } = useAppStore();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerY,       { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const initials = shopName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />
      <ConnectivityBar isOnline={isOnline} t={t} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop header */}
        <Animated.View style={[styles.shopHeader, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
          <View>
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopCity}>{shopCity}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </Animated.View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(MOCK_STATS.billsToday)}
            label={t('todayBills')}
            icon="📋"
            color={COLORS.teal}
            delay={80}
          />
          <StatCard
            value={`₹${MOCK_STATS.revenueToday.toLocaleString('en-IN')}`}
            label={t('todayRevenue')}
            icon="💰"
            color="#185FA5"
            delay={140}
          />
        </View>

        {/* Low stock alert */}
        <LowStockCard items={MOCK_LOW_STOCK} t={t} delay={180} />

        {/* Voice bill CTA */}
        <VoiceBillBtn
          t={t}
          onPress={() => navigation.navigate('VoiceBilling')}
          delay={220}
        />

        {/* Recent bills */}
        <RecentBillsSection
          bills={MOCK_RECENT_BILLS}
          t={t}
          onSeeAll={() => {
            // TODO: navigate to bills tab
          }}
          delay={280}
        />

        {/* Bottom padding */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 90 },

  // Connectivity bar
  connBar:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7 },
  connDot:  { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 11, fontWeight: '500' },

  // Shop header
  shopHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 6 },
  shopName:   { fontSize: 17, fontWeight: '700', color: COLORS.ink },
  shopCity:   { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  avatar:     { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.white },

  // Stats
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:   { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14, borderWidth: 0.5, borderColor: COLORS.border, gap: 4, elevation: 2 },
  statIcon:   { fontSize: 20, marginBottom: 4 },
  statValue:  { fontSize: 22, fontWeight: '700' },
  statLabel:  { fontSize: 11, color: COLORS.muted },

  // Low stock
  lowStockCard:    { backgroundColor: '#FEF3E2', borderWidth: 1, borderColor: '#F5D49A', borderRadius: 16, padding: 14, marginBottom: 14 },
  lowStockHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  lowStockTitle:   { fontSize: 13, fontWeight: '600', color: '#633806' },
  lowStockBadge:   { backgroundColor: COLORS.amber, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  lowStockBadgeText:{ fontSize: 10, fontWeight: '700', color: COLORS.white },
  lowStockRow:     { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  lowStockRowBorder:{ borderTopWidth: 0.5, borderTopColor: '#F5D49A' },
  lowStockName:    { fontSize: 12, color: '#633806' },
  lowStockQty:     { fontSize: 12, fontWeight: '700', color: COLORS.red },

  // Voice bill
  voiceBtn:  {
    backgroundColor: COLORS.teal,
    borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginBottom: 18,
    elevation: 8,
    shadowColor: COLORS.teal, shadowOpacity: 0.35,
    shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
  },
  voiceMic:      { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  voiceBtnTitle: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  voiceBtnSub:   { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  voiceArrow:    { marginLeft: 'auto', fontSize: 20, color: 'rgba(255,255,255,0.7)' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle:  { fontSize: 12, fontWeight: '600', color: COLORS.ink2, letterSpacing: 0.5, textTransform: 'uppercase' },
  seeAll:        { fontSize: 12, color: COLORS.teal, fontWeight: '500' },

  // Recent bills
  billsCard:   { backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden', elevation: 2 },
  billRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  billRowBorder:{ borderTopWidth: 0.5, borderTopColor: COLORS.border },
  billLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncDot:     { width: 8, height: 8, borderRadius: 4 },
  billName:    { fontSize: 13, fontWeight: '500', color: COLORS.ink },
  billTime:    { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  billAmt:     { fontSize: 14, fontWeight: '600', color: COLORS.ink },
});

// Missing constants referenced in styles
const extra = StyleSheet.create({});
