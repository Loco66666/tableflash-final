import { Alert, StyleSheet, Text, View } from "react-native";

import { SeniorActionButton } from "../components/SeniorActionButton";

export function SeniorHomeScreen() {
  const openMedication = () => {
    Alert.alert("Médicaments", "Ouverture du suivi des médicaments.");
  };

  const callEmergency = () => {
    Alert.alert("Urgence", "Appel d'urgence demandé.");
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.greeting} accessibilityRole="header">
          Bonjour
        </Text>
        <Text style={styles.instructions}>
          Choisissez une action avec un grand bouton.
        </Text>
      </View>

      <View style={styles.actions}>
        <SeniorActionButton
          title="Mes médicaments"
          subtitle="Voir mes prises"
          icon="💊"
          tone="primary"
          accessibilityHint="Ouvre la liste des médicaments et des prises à venir."
          onPress={openMedication}
        />

        <SeniorActionButton
          title="Urgence"
          subtitle="Appeler de l'aide"
          icon="☎️"
          tone="danger"
          accessibilityHint="Demande un appel d'urgence."
          onPress={callEmergency}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    justifyContent: "space-between",
    backgroundColor: "#f7faf8",
  },
  header: {
    alignItems: "center",
    gap: 8,
  },
  greeting: {
    color: "#10221a",
    fontSize: 40,
    lineHeight: 48,
    fontWeight: "800",
    textAlign: "center",
  },
  instructions: {
    color: "#263b31",
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    textAlign: "center",
  },
  actions: {
    flex: 1,
    justifyContent: "center",
    gap: 26,
    width: "100%",
  },
});
