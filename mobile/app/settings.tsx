import { useEffect, useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";
import { getApiBaseUrl, setApiBaseUrl, defaultApiBaseUrl } from "@/storage";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    getApiBaseUrl().then((v) => {
      if (active) setUrl(v);
    });
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    await setApiBaseUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>API Base URL</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder={defaultApiBaseUrl()}
        placeholderTextColor={colors.textFaint}
      />
      <Text style={styles.help}>
        Where the Next.js web app is running. Use the deployed URL (e.g.
        https://your-app.vercel.app), or — for local dev — your computer&apos;s LAN IP and port,
        like http://192.168.1.20:3000. A phone cannot reach &quot;localhost&quot;; that points at the
        phone itself.
      </Text>

      <Pressable style={styles.btn} onPress={save}>
        <Ionicons name={saved ? "checkmark" : "save-outline"} size={18} color={colors.white} />
        <Text style={styles.btnText}>{saved ? "Saved" : "Save"}</Text>
      </Pressable>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Note</Text>
        <Text style={styles.help}>
          The server must have its OPENAI_API_KEY (and Google Maps key for Location Analysis)
          configured. The mobile app never holds those keys — it only calls your server&apos;s API
          routes.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: "600", marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  help: { color: colors.textFaint, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.indigo,
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  btnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  note: { marginTop: spacing.xl, padding: spacing.lg, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg },
  noteTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
});
