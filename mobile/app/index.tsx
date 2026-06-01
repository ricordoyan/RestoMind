import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";

type Tool = {
  href: "/analyze" | "/copilot" | "/settings";
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  ready: boolean;
};

type Stage = { label: string; tagline: string; tools: Tool[] };

const STAGES: Stage[] = [
  {
    label: "Locate",
    tagline: "Decide where to open — with data, not gut feel.",
    tools: [
      {
        href: "/analyze",
        title: "Location Analysis",
        description: "Score a site, forecast revenue, map competitors, get a verdict.",
        icon: "location",
        color: colors.indigo,
        ready: true,
      },
    ],
  },
  {
    label: "Operate",
    tagline: "Run the day-to-day like a seasoned manager.",
    tools: [
      {
        href: "/copilot",
        title: "Operations Copilot",
        description: "Chat with an AI restaurant manager about cost, staffing, menu, ops.",
        icon: "chatbubbles",
        color: colors.teal,
        ready: true,
      },
    ],
  },
];

export default function Home() {
  const router = useRouter();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>AI Location Intelligence for Restaurants</Text>
        </View>
        <Text style={styles.h1}>Know before you sign the lease.</Text>
        <Text style={styles.sub}>
          Score a site, forecast revenue, and run operations like a seasoned manager — powered by
          GPT-4o and grounded in real Google Places data.
        </Text>
      </View>

      {STAGES.map((stage) => (
        <View key={stage.label} style={styles.stage}>
          <Text style={styles.stageLabel}>{stage.label}</Text>
          <Text style={styles.stageTagline}>{stage.tagline}</Text>
          {stage.tools.map((tool) => (
            <Pressable
              key={tool.href}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => router.push(tool.href)}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${tool.color}22` }]}>
                <Ionicons name={tool.icon} size={22} color={tool.color} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{tool.title}</Text>
                <Text style={styles.cardDesc}>{tool.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </Pressable>
          ))}
        </View>
      ))}

      <Pressable style={styles.settingsRow} onPress={() => router.push("/settings")}>
        <Ionicons name="settings-outline" size={18} color={colors.textMuted} />
        <Text style={styles.settingsText}>API Settings</Text>
      </Pressable>

      <Text style={styles.footer}>
        More tools (Trade Area, Market Scout, Recipe Cost, Inventory, and more) are available in the
        web app and follow the same API.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { marginBottom: spacing.xl },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, marginRight: spacing.sm },
  badgeText: { color: colors.teal, fontSize: 12, fontWeight: "600" },
  h1: { color: colors.text, fontSize: 34, fontWeight: "800", lineHeight: 40, marginBottom: spacing.md },
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  stage: { marginBottom: spacing.xl },
  stageLabel: { color: colors.text, fontSize: 22, fontWeight: "800", marginBottom: 2 },
  stageTagline: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardPressed: { opacity: 0.7 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 2 },
  cardDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  settingsText: { color: colors.textMuted, fontSize: 15, fontWeight: "600" },
  footer: { color: colors.textFaint, fontSize: 12, lineHeight: 18, marginTop: spacing.md },
});
