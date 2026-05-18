import { Pressable, StyleSheet, Text, View } from "react-native";

type SeniorActionButtonProps = {
  title: string;
  subtitle: string;
  icon: string;
  tone: "primary" | "danger";
  accessibilityHint: string;
  onPress: () => void;
};

const COLORS = {
  primary: {
    background: "#0f7a4b",
    pressed: "#0b5f3a",
    border: "#074d2f",
  },
  danger: {
    background: "#d7263d",
    pressed: "#ac1e30",
    border: "#8f1828",
  },
};

export function SeniorActionButton({
  title,
  subtitle,
  icon,
  tone,
  accessibilityHint,
  onPress,
}: SeniorActionButtonProps) {
  const colors = COLORS[tone];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed ? colors.pressed : colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.iconCircle}>
        <Text style={[styles.icon, { color: colors.background }]}>{icon}</Text>
      </View>
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2} adjustsFontSizeToFit>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2} adjustsFontSizeToFit>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: 190,
    borderRadius: 32,
    borderWidth: 3,
    paddingHorizontal: 22,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  iconCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 52,
    lineHeight: 60,
  },
  textBlock: {
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
    textAlign: "center",
    opacity: 0.96,
  },
});
