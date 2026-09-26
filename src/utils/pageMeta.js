import { useEffect } from "react";

// Sets the page title, description, canonical link and share-preview tags, then restores
// the site defaults from index.html when the page unmounts. Updating the existing tags
// (instead of adding new ones) avoids duplicate titles and descriptions.
const TAGS = {
    description: 'meta[name="description"]',
    ogTitle:     'meta[property="og:title"]',
    ogDesc:      'meta[property="og:description"]',
    ogUrl:       'meta[property="og:url"]',
    ogImage:     'meta[property="og:image"]',
    ogType:      'meta[property="og:type"]',
};

const ensureCanonical = () => {
    let el = document.head.querySelector('link[rel="canonical"]');
    if (!el) {
        el = document.createElement("link");
        el.rel = "canonical";
        document.head.appendChild(el);
    }
    return el;
};

export function usePageMeta({ title, description, url, image, type } = {}) {
    useEffect(() => {
        if (!title) return;
        const prev = { title: document.title };
        const set = (key, value) => {
            const el = document.head.querySelector(TAGS[key]);
            if (!el || !value) return;
            prev[key] = el.getAttribute("content");
            el.setAttribute("content", value);
        };
        document.title = title;
        set("description", description);
        set("ogTitle", title);
        set("ogDesc", description);
        set("ogUrl", url);
        set("ogImage", image);
        set("ogType", type);
        const canonical = ensureCanonical();
        const prevCanonical = canonical.getAttribute("href");
        if (url) canonical.setAttribute("href", url);

        return () => {
            document.title = prev.title;
            Object.keys(TAGS).forEach(k => {
                if (k in prev) document.head.querySelector(TAGS[k])?.setAttribute("content", prev[k]);
            });
            if (prevCanonical) canonical.setAttribute("href", prevCanonical);
            else canonical.remove();
        };
    }, [title, description, url, image, type]);
}
