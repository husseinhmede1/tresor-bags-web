import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const GOLD = "#dfa94b", GOLD_L = "#E5C48A", MUTED = "#6B6560", BORDER = "rgba(201,168,106,0.2)";

// Gold SVG pin so we don't depend on Leaflet's (bundler-broken) default marker images.
const pinIcon = L.divIcon({
    className: "",
    html: `<svg width="34" height="34" viewBox="0 0 24 24" fill="${GOLD}" stroke="#080808" stroke-width="1"><path d="M12 2C8.1 2 5 5.1 5 9c0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#080808"/></svg>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
});

// Lebanon-ish default view until the customer sets a point.
const DEFAULT_CENTER = [33.85, 35.86];
const DEFAULT_ZOOM = 8;

export default function LocationPicker({ value, onChange }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const markerRef = useRef(null);
    const [locating, setLocating] = useState(false);
    const [error, setError] = useState("");

    const placeMarker = (lat, lng) => {
        const map = mapRef.current;
        if (!map) return;
        if (!markerRef.current) {
            markerRef.current = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(map);
            markerRef.current.on("dragend", () => {
                const p = markerRef.current.getLatLng();
                onChange({ lat: +p.lat.toFixed(6), lng: +p.lng.toFixed(6) });
            });
        } else {
            markerRef.current.setLatLng([lat, lng]);
        }
        onChange({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    };

    useEffect(() => {
        const map = L.map(containerRef.current, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap", maxZoom: 19,
        }).addTo(map);
        map.on("click", (e) => placeMarker(e.latlng.lat, e.latlng.lng));
        mapRef.current = map;
        // Restore a previously-set point (e.g. navigating back to this step)
        if (value?.lat != null && value?.lng != null) {
            placeMarker(value.lat, value.lng);
            map.setView([value.lat, value.lng], 16);
        }
        setTimeout(() => map.invalidateSize(), 200);
        return () => { map.remove(); mapRef.current = null; markerRef.current = null; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const useMyLocation = () => {
        setError("");
        if (!navigator.geolocation) { setError("Location isn't available on this device."); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                mapRef.current?.setView([latitude, longitude], 16);
                placeMarker(latitude, longitude);
                setLocating(false);
            },
            () => { setError("Couldn't get your location — please drop a pin on the map instead."); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const hasPoint = value?.lat != null && value?.lng != null;

    return (
        <div>
            <button type="button" onClick={useMyLocation} disabled={locating} style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%", justifyContent: "center",
                background: "rgba(201,168,106,0.08)", border: `1px solid ${BORDER}`, borderRadius: 4,
                color: GOLD_L, padding: "12px 14px", fontSize: 14, cursor: locating ? "default" : "pointer",
                fontFamily: "'Inter', sans-serif", marginBottom: 10, letterSpacing: "0.03em",
            }}>
                📍 {locating ? "Locating…" : "Use my current location"}
            </button>
            <div ref={containerRef} style={{ height: 260, width: "100%", borderRadius: 6, overflow: "hidden", border: `1px solid ${BORDER}` }} />
            <p style={{ fontSize: 12, color: hasPoint ? GOLD_L : MUTED, margin: "8px 0 0", letterSpacing: "0.02em" }}>
                {hasPoint
                    ? `✓ Location set (${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}) — drag the pin to fine-tune`
                    : "Tap “Use my current location”, or tap the map to drop a pin."}
            </p>
            {error && <p style={{ fontSize: 12, color: "#e05", margin: "6px 0 0" }}>{error}</p>}
        </div>
    );
}
