// Where an order stands for the shop. A paid order goes: waiting for stock, ready to deliver,
// delivered. Orders paid before these stages existed have none and count as delivered.
export const stageOf = (order) =>
    order?.status === "confirmed" ? (order.fulfilment || "delivered") : (order?.status || "pending");

export const STAGE_LABEL = {
    pending: "Pending",
    waiting: "Waiting for stock",
    ready: "Ready to deliver",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

// Units of one line of a paid order: ready to hand over now, still waiting for stock, already
// handed over. Null for orders that are not tracked (not paid yet, or paid before stages existed).
export const lineUnits = (order, item) => {
    if (order?.status !== "confirmed" || !order.fulfilment) return null;
    const waiting = item.waiting || 0;
    const delivered = item.delivered || 0;
    return { ready: Math.max(0, (item.quantity || 0) - waiting - delivered), waiting, delivered };
};

// The same three numbers for the whole order.
export const orderUnits = (order) =>
    (order?.items || []).reduce((sum, item) => {
        const u = lineUnits(order, item);
        return u ? { ready: sum.ready + u.ready, waiting: sum.waiting + u.waiting, delivered: sum.delivered + u.delivered } : sum;
    }, { ready: 0, waiting: 0, delivered: 0 });
