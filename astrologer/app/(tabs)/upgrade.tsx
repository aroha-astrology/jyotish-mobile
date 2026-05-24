import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { ASTRO_PLANS, ASTRO_ADDONS } from '@aroha-astrology/shared';
import type { AstroPlan } from '@aroha-astrology/shared';
import { colors } from '@/constants/theme';

const WA_NUMBER = '919535960988';

export default function UpgradeTab() {
  const profile = useStore((s) => s.profile);
  const currentPlan = profile?.astro_plan ? ASTRO_PLANS[profile.astro_plan] : null;

  function contact(label: string, price: number) {
    const msg = `Hi, I want to upgrade my Jyotish AI astrologer account.%0AUpgrade: ${label} (₹${price})%0APlease share payment details.`;
    Linking.openURL(`https://wa.me/${WA_NUMBER}?text=${msg}`);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <Text style={styles.title}>Upgrade</Text>
          <Text style={styles.subtitle}>
            {currentPlan
              ? `Current: ${currentPlan.label} · ${currentPlan.customers} clients`
              : 'No plan assigned'}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>SWITCH PLAN</Text>
        {(Object.entries(ASTRO_PLANS) as [AstroPlan, { price: number; customers: number; label: string }][]).map(([key, plan]) => {
          const isCurrent = key === profile?.astro_plan;
          return (
            <View key={key} style={[styles.planCard, isCurrent && styles.planCardActive]}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.planName}>{plan.label}</Text>
                  {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current</Text></View>}
                </View>
                <Text style={styles.planDetail}>{plan.customers} clients · ₹{plan.price}/mo</Text>
              </View>
              {!isCurrent && (
                <TouchableOpacity style={styles.upgradeBtn} onPress={() => contact(`${plan.label} Plan`, plan.price)} activeOpacity={0.8}>
                  <Text style={styles.upgradeBtnText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>ADD-ON PACKS</Text>
        {ASTRO_ADDONS.map(addon => (
          <View key={addon.id} style={styles.planCard}>
            <View>
              <Text style={styles.planName}>{addon.label}</Text>
              <Text style={styles.planDetail}>One-time · ₹{addon.price}</Text>
            </View>
            <TouchableOpacity style={styles.addonBtn} onPress={() => contact(`${addon.label} Add-on`, addon.price)} activeOpacity={0.8}>
              <Text style={styles.addonBtnText}>Buy</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.note}>Tapping Upgrade or Buy opens WhatsApp to complete payment with the admin.</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: 16, gap: 10, paddingBottom: 32 },
  header: { marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontFamily: 'Poppins_700Bold', fontSize: 10, color: colors.textMuted, letterSpacing: 1.5, marginTop: 4 },
  planCard: { backgroundColor: colors.bgSurface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planCardActive: { borderColor: colors.primary },
  planName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  planDetail: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  currentBadge: { backgroundColor: 'rgba(212,175,55,0.12)', borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { fontFamily: 'Poppins_700Bold', fontSize: 9, color: colors.primary, letterSpacing: 1 },
  upgradeBtn: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  upgradeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.bg },
  addonBtn: { backgroundColor: 'rgba(168,127,255,0.1)', borderWidth: 1, borderColor: 'rgba(168,127,255,0.25)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  addonBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.accent },
  note: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: 8 },
});
