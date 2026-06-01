import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing } from "@/theme";
import { postJson, type ChatMessage } from "@/api";

const SUGGESTIONS = [
  "How do I lower my food cost?",
  "Build me an opening checklist",
  "What labour % should I target?",
  "How much inventory should I hold?",
];

export default function Copilot() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    setError("");
    setInput("");
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setLoading(true);
    try {
      const data = await postJson<{ reply: string }>("/api/copilot", { messages: next });
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles" size={28} color={colors.white} />
            </View>
            <Text style={styles.emptyTitle}>Ask me anything about running your restaurant</Text>
            <Text style={styles.emptySub}>
              Food cost, staffing, inventory, menu, marketing and more.
            </Text>
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <Pressable key={s} style={styles.chip} onPress={() => send(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === "user" ? styles.userBubble : styles.aiBubble]}
          >
            <Text style={m.role === "user" ? styles.userText : styles.aiText}>{m.content}</Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.aiBubble, styles.typing]}>
            <ActivityIndicator color={colors.teal} size="small" />
            <Text style={styles.aiText}>Thinking…</Text>
          </View>
        )}

        {!!error && (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about food cost, staffing, inventory…"
          placeholderTextColor={colors.textFaint}
          multiline
          editable={!loading}
        />
        <Pressable
          style={[styles.send, (!input.trim() || loading) && styles.sendDisabled]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1 },
  listContent: { padding: spacing.lg, gap: spacing.md },
  empty: { alignItems: "center", paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptySub: { color: colors.textMuted, fontSize: 14, textAlign: "center", marginBottom: spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  chip: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipText: { color: colors.text, fontSize: 13 },
  bubble: { maxWidth: "85%", borderRadius: radius.lg, padding: spacing.md },
  userBubble: { alignSelf: "flex-end", backgroundColor: colors.teal },
  aiBubble: { alignSelf: "flex-start", backgroundColor: colors.bgElevated, borderColor: colors.border, borderWidth: 1 },
  userText: { color: "#04201d", fontSize: 15, lineHeight: 21, fontWeight: "500" },
  aiText: { color: colors.text, fontSize: 15, lineHeight: 21 },
  typing: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  error: {
    backgroundColor: "rgba(251,113,133,0.1)",
    borderColor: "rgba(251,113,133,0.3)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.rose, fontSize: 13 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.teal,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: { opacity: 0.4 },
});
