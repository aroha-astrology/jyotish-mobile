import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { colors } from '@/constants/theme';

interface Customer { id: string; name: string; dob: string; birth_place: string | null; gender: string | null; }

export default function CustomersTab() {
  const router = useRouter();
  const profile = useStore((s) => s.profile);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', dob: '', birth_time: '', birth_place: '', gender: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('astrologer_customers')
      .select('id, name, dob, birth_place, gender')
      .eq('astrologer_id', profile.id)
      .order('created_at', { ascending: false });
    setCustomers(data ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!form.name || !form.dob) { Alert.alert('Required', 'Name and date of birth are required'); return; }
    if (!profile) return;
    if (customers.length >= (profile.customer_limit ?? 0)) {
      Alert.alert('Limit Reached', 'Upgrade your plan to add more clients.');
      return;
    }
    setAdding(true);
    const { data, error } = await supabase
      .from('astrologer_customers')
      .insert({ astrologer_id: profile.id, ...form })
      .select()
      .single();
    if (error) { Alert.alert('Error', error.message); }
    else { setCustomers(prev => [data, ...prev]); setShowModal(false); setForm({ name: '', dob: '', birth_time: '', birth_place: '', gender: '' }); }
    setAdding(false);
  }

  async function handleDelete(id: string) {
    Alert.alert('Remove Client', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('astrologer_customers').delete().eq('id', id).eq('astrologer_id', profile?.id ?? '');
        setCustomers(prev => prev.filter(c => c.id !== id));
      }},
    ]);
  }

  const atLimit = customers.length >= (profile?.customer_limit ?? 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Clients</Text>
            <Text style={styles.subtitle}>{customers.length} of {profile?.customer_limit ?? 0} slots used</Text>
          </View>
          {atLimit ? (
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => router.push('/(tabs)/upgrade')}>
              <Text style={styles.upgradeBtnText}>Upgrade</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
              <Text style={styles.addBtnText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : customers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={{ fontSize: 32, textAlign: 'center', marginBottom: 8 }}>👥</Text>
            <Text style={styles.empty}>No clients yet. Add your first one.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {customers.map((c, i) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.clientRow, i < customers.length - 1 && styles.clientBorder]}
                onPress={() => router.push(`/customer/${c.id}` as never)}
                activeOpacity={0.7}
              >
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{c.name}</Text>
                  <Text style={styles.clientMeta}>
                    {new Date(c.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {c.birth_place ? ` · ${c.birth_place}` : ''}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(c.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </ScrollView>

      {/* Add client modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>New Client</Text>
            {[
              { key: 'name', placeholder: 'Full Name *' },
              { key: 'dob', placeholder: 'Date of Birth (YYYY-MM-DD) *' },
              { key: 'birth_time', placeholder: 'Time of Birth (HH:MM)' },
              { key: 'birth_place', placeholder: 'Place of Birth' },
            ].map(({ key, placeholder }) => (
              <TextInput
                key={key}
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                value={form[key as keyof typeof form]}
                onChangeText={v => setForm(prev => ({ ...prev, [key]: v }))}
              />
            ))}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAdd} disabled={adding}>
                <Text style={styles.confirmBtnText}>{adding ? 'Adding…' : 'Add Client'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: 16, gap: 14, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 20, color: colors.text },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.bg },
  upgradeBtn: { backgroundColor: 'rgba(168,127,255,0.12)', borderWidth: 1, borderColor: 'rgba(168,127,255,0.3)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  upgradeBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 12, color: colors.accent },
  emptyCard: { backgroundColor: colors.bgSurface, borderRadius: 16, padding: 32, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  empty: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  list: { backgroundColor: colors.bgSurface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  clientRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 14 },
  clientBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  clientInfo: { flex: 1 },
  clientName: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: colors.text },
  clientMeta: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  deleteBtn: { color: colors.destructive, fontSize: 14, paddingLeft: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  modalTitle: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 18, color: colors.text },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: colors.borderWhite, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.text },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: colors.border, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: colors.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: colors.bg },
});
