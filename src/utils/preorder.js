// A bag with no stock left is not sold out: it can still be ordered, and arrives later.
export const PREORDER_ETA = "about 2 weeks";
export const PREORDER_FLAG = "Pre-order · 2 weeks";

// The server accepts at most this many of one bag in an order.
export const MAX_PER_BAG = 99;

// How many of `quantity` the stock does not cover.
export const preorderCount = (bag, quantity) =>
    Math.max(0, quantity - Math.max(0, Number(bag?.stock) || 0));

// What to tell the customer about a line with `late` pre-ordered units. Null when all is in stock.
export const preorderNote = (quantity, late) => {
    if (!(late > 0)) return null;
    if (late >= quantity) return `Pre-order: arrives in ${PREORDER_ETA}`;
    return `${quantity - late} now, ${late} in ${PREORDER_ETA}`;
};
