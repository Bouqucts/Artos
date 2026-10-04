import { StyleSheet, Text, View } from 'react-native';

export default function TabPlaceholder() {
  return (
    <View style={styles.screen}>
      <Text style={styles.logo}>Artos</Text>
      <Text style={styles.title}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef3f5' },
  logo: { fontFamily: 'Georgia', color: '#3484c2', fontSize: 45, fontWeight: 'bold', letterSpacing: -2 },
  title: { marginTop: 10, color: '#71808c', fontSize: 16 },
});
