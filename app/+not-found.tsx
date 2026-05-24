import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <Text style={styles.om}>ॐ</Text>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.subtitle}>The cosmos couldn't locate this screen.</Text>
      <Pressable onPress={() => router.replace('/(tabs)')} style={styles.btn}>
        <Text style={styles.btnText}>Return Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 32, gap: 12 },
  om: { fontSize: 64, color: colors.primary, marginBottom: 12 },
  title: { fontSize: 22, fontFamily: 'Poppins_700Bold', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'Poppins_400Regular', color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  btn: {
    marginTop: 8, backgroundColor: 'rgba(212,168,67,0.12)', borderWidth: 1, borderColor: 'rgba(212,168,67,0.30)',
    borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12,
  },
  btnText: { fontSize: 14, fontFamily: 'Poppins_600SemiBold', color: colors.primary },
});
