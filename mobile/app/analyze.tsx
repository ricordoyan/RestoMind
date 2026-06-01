import { useState } from "react";
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme";
import { postJson, type AnalyzePayload, type AnalyzeReport } from "@/api";

const VERDICT = {
  good_deal: { label: "Good Deal", color: colors.emerald },
  proceed_with_caution: { label: "Proceed with Caution", color: colors.amber },
  avoid: { label: "Avoid", color: colors.rose },
} as const;

export default function Analyze() {
  const [address, setAddress] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [model, setModel] = useState<"lease" | "takeover">("lease");
  const [monthlyRent, setMonthlyRent] = useState("");
  const [squareFootage, setSquareFootage] = useState("");
  const [leaseTerm, setLeaseTerm] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [budget, setBudget] = useState("");
  const [targetRevenue, setTargetRevenue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<AnalyzeReport | null>(null);

  function validate(): string | null {
    if (!address.trim()) return "Location address is required.";
    if (!cuisine.trim()) return "Cuisine type is required.";
    if (model === "lease") {
      if (!(Number(monthlyRent) > 0)) return "Monthly rent must be a positive number.";
      if (!(Number(squareFootage) > 0)) return "Square footage must be a positive number.";
      if (!(Number(leaseTerm) > 0)) return "Lease term must be a positive number.";
    } else if (!(Number(askingPrice) > 0)) {
      return "Asking price must be a positive number.";
    }
    if (!(Number(budget) > 0)) return "Budget must be a positive number.";
    if (!(Number(targetRevenue) > 0)) return "Target revenue must be a positive number.";
    return null;
  }

  async function submit() {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setLoading(true);
    setReport(null);
    const payload: AnalyzePayload = {
      address: address.trim(),
      cuisine: cuisine.trim(),
      model,
      takeoverDetails: model === "takeover" ? { askingPrice: Number(askingPrice) } : null,
      leaseDetails:
        model === "lease"
          ? {
              monthlyRent: Number(monthlyRent),
              squareFootage: Number(squareFootage),
              leaseTerm: Number(leaseTerm),
              condition: "good",
            }
          : null,
      budget: Number(budget),
      targetRevenue: Number(targetRevenue),
    };
    try {
      const data = await postJson<AnalyzeReport>("/api/analyze", payload);
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  if (report) {
    const v = VERDICT[report.verdict] ?? VERDICT.proceed_with_caution;
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={[styles.scoreCard, { borderColor: v.color }]}>
          <Text style={[styles.score, { color: v.color }]}>{report.score}/10</Text>
          <View style={[styles.verdictPill, { backgroundColor: `${v.color}22`, borderColor: v.color }]}>
            <Text style={[styles.verdictText, { color: v.color }]}>{v.label}</Text>
          </View>
        </View>

        <Section title="Summary">
          <Text style={styles.body}>{report.summary}</Text>
          <Text style={styles.muted}>{report.scoreRationale}</Text>
        </Section>

        <View style={styles.statRow}>
          <Stat label="Est. Revenue" value={report.revenue.monthlyEstimate} />
          <Stat label="Foot Traffic" value={report.footTraffic.estimatedDaily} />
        </View>

        <Section title={`Competitors (${report.competitors?.length ?? 0})`}>
          {(report.competitors ?? []).map((c, i) => (
            <View key={i} style={styles.compRow}>
              <Text style={styles.compName}>{c.name}</Text>
              <Text style={styles.muted}>
                {c.rating ? `★ ${c.rating.toFixed(1)}` : "No rating"} · {c.distanceKm.toFixed(2)} km
              </Text>
            </View>
          ))}
          {(report.competitors?.length ?? 0) === 0 && (
            <Text style={styles.muted}>No competitors found within 1 km.</Text>
          )}
        </Section>

        <Section title="Top Risks">
          {(report.risks ?? []).map((r, i) => (
            <View key={i} style={styles.riskRow}>
              <Ionicons name="alert-circle" size={16} color={colors.rose} />
              <Text style={styles.body}>{r.risk}</Text>
            </View>
          ))}
        </Section>

        <Section title="Negotiation Advice">
          <Text style={styles.body}>{report.negotiationAdvice}</Text>
        </Section>

        <Pressable style={styles.secondaryBtn} onPress={() => setReport(null)}>
          <Text style={styles.secondaryBtnText}>Run another analysis</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Location address">
        <TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="123 Main St, City, State" placeholderTextColor={colors.textFaint} />
      </Field>
      <Field label="Cuisine">
        <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} placeholder="e.g. Italian" placeholderTextColor={colors.textFaint} />
      </Field>

      <Field label="Business model">
        <View style={styles.toggle}>
          {(["lease", "takeover"] as const).map((m) => (
            <Pressable
              key={m}
              style={[styles.toggleBtn, model === m && styles.toggleActive]}
              onPress={() => setModel(m)}
            >
              <Text style={[styles.toggleText, model === m && styles.toggleTextActive]}>
                {m === "lease" ? "Lease empty space" : "Takeover existing"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>

      {model === "lease" ? (
        <>
          <Field label="Monthly rent ($)">
            <TextInput style={styles.input} value={monthlyRent} onChangeText={setMonthlyRent} keyboardType="numeric" placeholder="5000" placeholderTextColor={colors.textFaint} />
          </Field>
          <Field label="Square footage">
            <TextInput style={styles.input} value={squareFootage} onChangeText={setSquareFootage} keyboardType="numeric" placeholder="1500" placeholderTextColor={colors.textFaint} />
          </Field>
          <Field label="Lease term (years)">
            <TextInput style={styles.input} value={leaseTerm} onChangeText={setLeaseTerm} keyboardType="numeric" placeholder="5" placeholderTextColor={colors.textFaint} />
          </Field>
        </>
      ) : (
        <Field label="Asking price ($)">
          <TextInput style={styles.input} value={askingPrice} onChangeText={setAskingPrice} keyboardType="numeric" placeholder="150000" placeholderTextColor={colors.textFaint} />
        </Field>
      )}

      <Field label="Total budget ($)">
        <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="200000" placeholderTextColor={colors.textFaint} />
      </Field>
      <Field label="Target monthly revenue ($)">
        <TextInput style={styles.input} value={targetRevenue} onChangeText={setTargetRevenue} keyboardType="numeric" placeholder="50000" placeholderTextColor={colors.textFaint} />
      </Field>

      {!!error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable style={[styles.primaryBtn, loading && styles.btnDisabled]} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Generate AI Report</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  field: { marginBottom: spacing.lg },
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
  toggle: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  toggleActive: { borderColor: colors.indigo, backgroundColor: "rgba(99,102,241,0.15)" },
  toggleText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  toggleTextActive: { color: colors.text },
  primaryBtn: {
    backgroundColor: colors.indigo,
    borderRadius: radius.full,
    paddingVertical: spacing.lg,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  btnDisabled: { opacity: 0.6 },
  secondaryBtn: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  secondaryBtnText: { color: colors.text, fontSize: 15, fontWeight: "600" },
  error: {
    backgroundColor: "rgba(251,113,133,0.1)",
    borderColor: "rgba(251,113,133,0.3)",
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorText: { color: colors.rose, fontSize: 13 },
  scoreCard: {
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  score: { fontSize: 48, fontWeight: "800" },
  verdictPill: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginTop: spacing.sm },
  verdictText: { fontSize: 13, fontWeight: "700" },
  section: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  body: { color: colors.text, fontSize: 14, lineHeight: 21 },
  muted: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs },
  statRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  stat: { flex: 1, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg },
  statLabel: { color: colors.textFaint, fontSize: 12, marginBottom: spacing.xs },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "700" },
  compRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.sm, borderBottomColor: colors.border, borderBottomWidth: 1 },
  compName: { color: colors.text, fontSize: 14, flex: 1, marginRight: spacing.sm },
  riskRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start", marginBottom: spacing.sm },
});
