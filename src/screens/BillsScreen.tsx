import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, StatusBar, SafeAreaView,
  TextInput, FlatList,
} from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList, RootStackParamList } from '../navigation/types';
import { COLORS } from '../constants';
import { useAppStore } from '../store/appStore';
import { database } from '../db';
import Bill from '../db/models/Bill';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'BillsTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

type FilterType = 'today' | 'week' | 'all';

// ── Helpers ───────────────────────────────────────────────────────
function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function isToday(ts: number): boolean {
  const d = new Date(ts), now = new Date();
  return d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
}

function isThisWeek(ts: number): boolean {
  const d = new Date(ts), now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
}

// ── Bill Card ─────────────────────────────────────────────────────
function BillCard({ bill, index, onPress }: {
  bill: Bill; index: number; onPress: () => void;
}) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const scale    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity,     { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(translateY,  { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();
    }, index * 60);
  }, []);

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();

  const initials = (bill.customerName || 'W')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const avatarColors = ['#0D9E75', '#185FA5', '#7C3AED', '#DB2777', '#D97706'];
  const avatarColor  = avatarColors[bill.customerName.charCodeAt(0) % avatarColors.length];

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }, { scale }] }}>
      <TouchableOpacity
        style={styles.billCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Avatar */}
        <View style={[styles.billAvatar, { backgroundColor: avatarColor + '20' }]}>
          <Text style={[styles.billAvatarText, { color: avatarColor }]}>{initials}</Text>
        </View>

        {/* Info */}
        <View style={styles.billInfo}>
          <Text style={styles.billCustomer} numberOfLines={1}>
            {bill.customerName}
          </Text>
          <View style={styles.billMeta}>
            <View style={[styles.syncDot, { backgroundColor: bill.isSynced ? COLORS.teal : COLORS.amber }]} />
            <Text style={styles.billMetaText}>{bill.itemsCount} items</Text>
            <Text style={styles.billMetaDot}>·</Text>
            <Text style={styles.billMetaText}>{formatTime(bill.createdAt)}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.billRight}>
          <Text style={styles.billAmount}>₹{bill.totalAmount.toLocaleString('en-IN')}</Text>
          <Text style={styles.billDate}>{formatDate(bill.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Filter Tab ────────────────────────────────────────────────────
function FilterTabs({ active, onChange }: {
  active: FilterType; onChange: (f: FilterType) => void;
}) {
  const tabs: { key: FilterType; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'all',   label: 'All' },
  ];
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth   = 88;

  useEffect(() => {
    const idx = tabs.findIndex(t => t.key === active);
    Animated.spring(indicatorX, {
      toValue: idx * (tabWidth + 8),
      tension: 120, friction: 10, useNativeDriver: true,
    }).start();
  }, [active]);

  return (
    <View style={styles.filterWrap}>
      <Animated.View style={[styles.filterIndicator, { transform: [{ translateX: indicatorX }] }]} />
      {tabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.filterTab, { width: tabWidth }]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.75}
        >
          <Text style={[styles.filterLabel, active === tab.key && styles.filterLabelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ filter }: { filter: FilterType }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const msgs: Record<FilterType, string> = {
    today: "No bills today yet.\nTap + to create your first bill!",
    week:  "No bills this week.\nStart billing to see them here.",
    all:   "No bills found.\nTap + to create your first bill!",
  };

  return (
    <Animated.View style={[styles.emptyState, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.emptyEmoji}>🧾</Text>
      <Text style={styles.emptyText}>{msgs[filter]}</Text>
    </Animated.View>
  );
}

// ── FAB ───────────────────────────────────────────────────────────
function FAB({ onPress }: { onPress: () => void }) {
  const scale      = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 80, friction: 6, delay: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0,   duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1,   duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  const handlePressIn  = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1,   useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[styles.fabWrap, { transform: [{ scale }] }]}>
      {/* Pulse ring */}
      <Animated.View style={[
        styles.fabPulse,
        { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
      ]} />
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────
export default function BillsScreen({ navigation }: Props) {
  const { shopName, shopId } = useAppStore();

  const [bills,        setBills]        = useState<Bill[]>([]);
  const [filter,       setFilter]       = useState<FilterType>('today');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [searchOpen,   setSearchOpen]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY       = useRef(new Animated.Value(-12)).current;
  const searchWidth   = useRef(new Animated.Value(0)).current;

  // ── Load bills from WatermelonDB ──
  const loadBills = useCallback(async () => {
    try {
      const allBills = await database
        .get<Bill>('bills')
        .query()
        .fetch();
      // Sort newest first
      allBills.sort((a, b) => b.createdAt - a.createdAt);
      setBills(allBills);
    } catch (e) {
      console.error('[BillsScreen] load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
    // Re-load whenever screen is focused
    const unsubscribe = navigation.addListener('focus', loadBills);
    return unsubscribe;
  }, [navigation, loadBills]);

  // ── Header animation ──
  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(headerY,       { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Search bar expand/collapse ──
  const openSearch = () => {
    setSearchOpen(true);
    Animated.spring(searchWidth, { toValue: 1, tension: 80, friction: 9, useNativeDriver: false }).start();
  };
  const closeSearch = () => {
    setSearchQuery('');
    Animated.timing(searchWidth, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setSearchOpen(false));
  };

  // ── Filter + search ──
  const filteredBills = bills.filter(b => {
    const matchFilter =
      filter === 'all'   ? true :
      filter === 'today' ? isToday(b.createdAt) :
      isThisWeek(b.createdAt);

    const matchSearch = searchQuery
      ? b.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return matchFilter && matchSearch;
  });

  // ── Stats ──
  const todayBills   = bills.filter(b => isToday(b.createdAt));
  const todayRevenue = todayBills.reduce((s, b) => s + b.totalAmount, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.bg} />

      {/* ── Header ── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerY }] }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Bills</Text>
            <Text style={styles.headerSub}>{shopName}</Text>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={openSearch}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        {searchOpen && (
          <Animated.View style={[styles.searchBar, {
            maxWidth: searchWidth.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            opacity: searchWidth,
          }]}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by customer name..."
              placeholderTextColor={COLORS.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={closeSearch} style={styles.searchClose}>
              <Text style={{ fontSize: 16, color: COLORS.muted }}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipVal}>{todayBills.length}</Text>
            <Text style={styles.statChipLabel}>Bills Today</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={[styles.statChipVal, { color: COLORS.teal }]}>
              ₹{todayRevenue.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statChipLabel}>Today's Revenue</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={[styles.statChipVal, { color: COLORS.amber }]}>
              {bills.filter(b => !b.isSynced).length}
            </Text>
            <Text style={styles.statChipLabel}>Pending Sync</Text>
          </View>
        </View>

        {/* Filter tabs */}
        <FilterTabs active={filter} onChange={f => { setFilter(f); }} />
      </Animated.View>

      {/* ── Bills List ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 32 }}>⏳</Text>
          <Text style={styles.loadingText}>Loading bills...</Text>
        </View>
      ) : filteredBills.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <BillCard
              bill={item}
              index={index}
              onPress={() => navigation.navigate('BillDetail', { billId: item.id })}
            />
          )}
        />
      )}

      {/* ── FAB ── */}
      <FAB onPress={() => navigation.navigate('NewBill')} />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header:    { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, borderBottomWidth: 0.5, borderBottomColor: COLORS.border, elevation: 2 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.ink, letterSpacing: -0.5 },
  headerSub:   { fontSize: 11, color: COLORS.muted, marginTop: 1 },
  searchBtn:   { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },

  // Search
  searchBar:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 10, overflow: 'hidden' },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: COLORS.ink },
  searchClose: { paddingHorizontal: 12, paddingVertical: 9 },

  // Stats
  statsRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statChip:       { flex: 1, alignItems: 'center' },
  statChipVal:    { fontSize: 17, fontWeight: '800', color: COLORS.ink },
  statChipLabel:  { fontSize: 10, color: COLORS.muted, marginTop: 2 },
  statDivider:    { width: 1, height: 28, backgroundColor: COLORS.border },

  // Filter tabs
  filterWrap:      { flexDirection: 'row', marginBottom: 12, position: 'relative', gap: 8 },
  filterIndicator: { position: 'absolute', bottom: 0, height: 2, width: 88, backgroundColor: COLORS.teal, borderRadius: 1 },
  filterTab:       { paddingVertical: 6, alignItems: 'center' },
  filterLabel:     { fontSize: 13, fontWeight: '500', color: COLORS.muted },
  filterLabelActive:{ color: COLORS.teal, fontWeight: '700' },

  // List
  listContent: { padding: 14, paddingBottom: 100 },

  // Bill card
  billCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 0.5, borderColor: COLORS.border, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
  billAvatar:     { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  billAvatarText: { fontSize: 15, fontWeight: '800' },
  billInfo:       { flex: 1 },
  billCustomer:   { fontSize: 14, fontWeight: '600', color: COLORS.ink, marginBottom: 4 },
  billMeta:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  syncDot:        { width: 6, height: 6, borderRadius: 3 },
  billMetaText:   { fontSize: 11, color: COLORS.muted },
  billMetaDot:    { fontSize: 11, color: COLORS.border },
  billRight:      { alignItems: 'flex-end' },
  billAmount:     { fontSize: 16, fontWeight: '800', color: COLORS.ink },
  billDate:       { fontSize: 10, color: COLORS.muted, marginTop: 3 },

  // Empty state
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyText:  { fontSize: 15, color: COLORS.muted, textAlign: 'center', lineHeight: 24 },

  // Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14, color: COLORS.muted },

  // FAB
  fabWrap:  { position: 'absolute', bottom: 24, right: 20, alignItems: 'center', justifyContent: 'center' },
  fabPulse: { position: 'absolute', width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.teal },
  fab:      { width: 58, height: 58, borderRadius: 29, backgroundColor: COLORS.teal, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: COLORS.teal, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
  fabIcon:  { fontSize: 26, color: COLORS.white, lineHeight: 30 },
});
