import { Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { LargeActionButton } from "../components/LargeActionButton";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Accueil Santé</Text>
        <LargeActionButton
          title="Prendre mes médicaments"
          subtitle="Voir mes rappels"
          icon="💊"
          accessibilityHint="Ouvre les rappels et le suivi des médicaments."
          onPress={() => Alert.alert("Médicaments", "Rappel envoyé.")}
        />
        <LargeActionButton
          title="URGENCE"
          subtitle="Appeler de l'aide"
          icon="☎️"
          variant="danger"
          accessibilityHint="Lance un appel d'urgence."
          onPress={() => Alert.alert("Urgence", "Appel d’urgence en cours...")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F5F7FB" },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "space-evenly",
    gap: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    color: "#1F2937",
  },
});
