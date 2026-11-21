// The occasion the shop is decorated for (see components/storefront/SeasonDecor). The server
// sends it with the bags the shop loads anyway; the last answer is remembered on the device,
// so a returning visitor sees the decoration at once instead of a moment later.
// A season is { name, until }: `until` is its last day (YYYY-MM-DD in Lebanon), or null.

const KEY = "tresor-season";
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Beirut" }).format(new Date());

// What this device last heard, if it is still in force. Null means the plain site.
export const rememberedSeason = () => {
    try {
        const s = JSON.parse(localStorage.getItem(KEY));
        return s?.name && (!s.until || s.until >= today()) ? s.name : null;
    } catch {
        return null;
    }
};

// Keeps the server's answer for the next visit and gives back the name to show now.
export const rememberSeason = (season) => {
    try {
        if (season?.name) localStorage.setItem(KEY, JSON.stringify({ name: season.name, until: season.until || null }));
        else localStorage.removeItem(KEY);
    } catch { /* private mode: nothing is kept */ }
    return season?.name || null;
};

// For the admin's choice. "" is the plain site.
export const SEASON_CHOICES = [
    { value: "", label: "Default (no decoration)" },
    { value: "christmas", label: "Christmas" },
    { value: "ramadan", label: "Ramadan" },
    { value: "fitr", label: "Eid al-Fitr" },
    { value: "easter", label: "Easter" },
    { value: "independence", label: "Independence Day" },
];
