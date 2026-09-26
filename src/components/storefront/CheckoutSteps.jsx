// Where the customer is in checkout: Bag, Delivery, Payment.
const STEPS = ["Bag", "Delivery", "Payment"];

export default function CheckoutSteps({ step }) {
    return (
        <ol aria-label="Checkout progress" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {STEPS.map((label, i) => {
                const n = i + 1;
                const state = n < step ? "done" : n === step ? "current" : "next";
                return (
                    <li key={label} aria-current={state === "current" ? "step" : undefined}
                        style={{
                            height: 30, padding: "0 12px", borderRadius: 999, display: "inline-flex", alignItems: "center", gap: 8,
                            fontSize: 13, fontWeight: 500,
                            color: state === "next" ? "var(--sf-text-3)" : state === "current" ? "var(--sf-on-gold)" : "var(--sf-text-2)",
                            background: state === "current" ? "var(--sf-gold)" : "transparent",
                            border: state === "current" ? "1px solid var(--sf-gold)" : "1px solid var(--sf-line)",
                        }}>
                        {label}
                    </li>
                );
            })}
        </ol>
    );
}
