import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { colors } from '@/constants/theme';

export default function RejectedScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>✖️</Text>
      <Text style={styles.title}>Application Not Approved</Text>
      <Text style={styles.subtitle}>
        Your astrologer application wasn&apos;t approved. Contact us on WhatsApp at +91 95359 60988 for more information or to reapply.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL('https://wa.me/919535960988')}
        activeOpacity={0.8}
      >
        <Text style={styles.btnText}>Contact on WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontFamily: 'PlayfairDisplay_700Bold', fontSize: 22, color: colors.text, textAlign: 'center' },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  btn: { width: '100%', backgroundColor: colors.whatsapp, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  btnText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#fff' },
});
