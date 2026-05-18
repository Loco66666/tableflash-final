import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

import { SeniorHomeScreen } from "./src/screens/SeniorHomeScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf8" />
      <SeniorHomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7faf8",
  },
});
