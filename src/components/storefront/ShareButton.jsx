import { useState } from "react";
import { Check, LinkSimple, ShareNetwork } from "@phosphor-icons/react";

// Shares one bag's link. The link's preview in Telegram, WhatsApp and similar apps shows that
// bag's photo, name and price (see vercel.json and the server's /share route).
//
//   copyOnly   always copies the link (the bag cards in the shop)
//   otherwise  the phone's share sheet on touch devices, a copy on a laptop (the bag's page)
const canShareNatively = () => typeof navigator.share === "function" && window.matchMedia?.("(pointer: coarse)").matches;

export default function ShareButton({ bag, copyOnly = false, className = "" }) {
    const [native] = useState(() => !copyOnly && canShareNatively());
    const [copied, setCopied] = useState(false);

    const share = async () => {
        const url = `${window.location.origin}/gallery/${bag._id}`;
        if (native) {
            try { await navigator.share({ title: bag.title, url }); return; }
            catch (err) { if (err?.name === "AbortError") return; }   // closed the sheet: nothing to do
        }
        try { await navigator.clipboard.writeText(url); }
        catch { window.prompt("Copy this link", url); return; }       // clipboard blocked: show it to copy by hand
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const Icon = copied ? Check : native || copyOnly ? ShareNetwork : LinkSimple;
    const label = copied ? "Link copied" : native || copyOnly ? "Share" : "Copy link";
    return (
        <button type="button" className={className} onClick={share} aria-label={copied ? undefined : `${label}: ${bag.title}`}>
            <Icon size={16} weight={copied ? "bold" : "regular"} />
            <span aria-live="polite">{label}</span>
        </button>
    );
}
