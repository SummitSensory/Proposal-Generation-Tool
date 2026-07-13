import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555" },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6, textTransform: "uppercase", color: "#333" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#333", paddingBottom: 4, marginBottom: 2 },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1, textAlign: "right" },
  colTotal: { flex: 1, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsLabel: { color: "#555" },
  grandTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 1, borderTopColor: "#333" },
  notes: { marginTop: 20, fontSize: 9, color: "#555" },
});

type Section = {
  name: string;
  items: { description: string; quantity: string; unitPrice: string; lineTotal: string }[];
};

export function ProposalPdfDocument(props: {
  proposalNumber: string;
  revisionNumber: number;
  customerName: string;
  projectName: string;
  sections: Section[];
  subtotal: string;
  discountTotal: string;
  freightTotal: string;
  taxTotal: string;
  total: string;
  notes?: string | null;
  termsAndConditions?: string | null;
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Summit Sensory Gym</Text>
          <Text style={styles.subtitle}>
            Proposal {props.proposalNumber} (rev {props.revisionNumber}) — {props.projectName}
          </Text>
          <Text style={styles.subtitle}>Prepared for: {props.customerName}</Text>
        </View>

        {props.sections
          .filter((s) => s.items.length > 0) // empty sections are never included
          .map((section) => (
            <View key={section.name} wrap={false}>
              <Text style={styles.sectionTitle}>{section.name}</Text>
              <View style={styles.headerRow}>
                <Text style={styles.colDesc}>Description</Text>
                <Text style={styles.colQty}>Qty</Text>
                <Text style={styles.colPrice}>Unit Price</Text>
                <Text style={styles.colTotal}>Total</Text>
              </View>
              {section.items.map((item, i) => (
                <View key={i} style={styles.row}>
                  <Text style={styles.colDesc}>{item.description}</Text>
                  <Text style={styles.colQty}>{item.quantity}</Text>
                  <Text style={styles.colPrice}>${Number(item.unitPrice).toFixed(2)}</Text>
                  <Text style={styles.colTotal}>${Number(item.lineTotal).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ))}

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>${Number(props.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Discount</Text>
            <Text>-${Number(props.discountTotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Freight</Text>
            <Text>${Number(props.freightTotal).toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tax</Text>
            <Text>${Number(props.taxTotal).toFixed(2)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text>Total</Text>
            <Text>${Number(props.total).toFixed(2)}</Text>
          </View>
        </View>

        {props.notes && (
          <View style={styles.notes}>
            <Text>{props.notes}</Text>
          </View>
        )}
        {props.termsAndConditions && (
          <View style={styles.notes}>
            <Text style={{ fontWeight: 700, marginBottom: 2 }}>Terms &amp; Conditions</Text>
            <Text>{props.termsAndConditions}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
