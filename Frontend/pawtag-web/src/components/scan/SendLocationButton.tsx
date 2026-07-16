"use client";
import { useState } from "react";
import { MapPin, Check, Loader2 } from "lucide-react";
import { getCurrentCoords, GeoError, type GeoErrorKind } from "@/lib/geolocation";
import { copyCurrentPageUrl, isInAppBrowser, openInBrowserUrl } from "@/lib/browser";

type LocationState = "idle" | "loading" | "shared" | "denied";

export function SendLocationButton() {
  const [locState, setLocState] = useState<LocationState>("idle");
  const [geoErr,   setGeoErr]   = useState<GeoErrorKind>("denied");
  const [coords,   setCoords]   = useState<{ lat: number; lng: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSendLocation() {
    setLocState("loading");
    try {
      setCoords(await getCurrentCoords());
      setLocState("shared");
    } catch (e) {
      setGeoErr(e instanceof GeoError ? e.kind : "unavailable");
      setLocState("denied");
    }
  }

  if (locState === "shared") {
    return (
      <div className="w-full flex items-center px-4 h-[72px] rounded-2xl bg-[#EDF7F2] border-2 border-[#22C55E] shadow-card">
        <div className="w-12 h-12 rounded-xl bg-[#22C55E]/20 flex items-center justify-center mr-4 shrink-0">
          <Check size={24} className="text-[#22C55E]" />
        </div>
        <div className="flex-1">
          <p className="text-[#22C55E] font-black text-[15px] font-display">Location Sent!</p>
          <p className="text-[#6B7A8D] text-[12px] font-body">
            {coords ? `${coords.lat.toFixed(4)}° N, ${coords.lng.toFixed(4)}° E` : "GPS shared with owner"}
          </p>
        </div>
      </div>
    );
  }

  if (locState === "denied") {
    if (isInAppBrowser()) {
      const url = openInBrowserUrl();
      return (
        <div className="w-full flex flex-col gap-2 px-4 py-3 rounded-2xl bg-[#FEF2F2] border-2 border-[#EF4444] shadow-card">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-xl bg-[#EF4444]/20 flex items-center justify-center mr-4 shrink-0">
              <MapPin size={24} className="text-[#EF4444]" />
            </div>
            <div className="flex-1">
              <p className="text-[#EF4444] font-bold text-[14px] font-display">Location unavailable</p>
              <p className="text-[#6B7A8D] text-[12px] font-body">This in-app browser can&apos;t share location — open in Chrome or Safari</p>
            </div>
          </div>
          {url ? (
            <a href={url} className="self-center px-4 py-2 rounded-xl bg-[#EF4444] text-white font-bold text-[12px] font-display">Open in browser</a>
          ) : (
            <button type="button" onClick={async () => { if (await copyCurrentPageUrl()) { setCopied(true); window.setTimeout(() => setCopied(false), 2000); } }} className="self-center px-4 py-2 rounded-xl bg-[#EF4444] text-white font-bold text-[12px] font-display">{copied ? "Link copied" : "Copy link for Safari"}</button>
          )}
        </div>
      );
    }
    const desc = geoErr === "insecure"
      ? "Location requires a secure HTTPS page"
      : geoErr === "timeout"
      ? "Getting your location took too long — tap to try again"
      : geoErr === "denied"
        ? "Allow location in site settings, then tap to try again"
        : "Couldn't determine a location — tap to try again";
    return (
      <button
        type="button"
        onClick={() => { if (geoErr !== "insecure") handleSendLocation(); }}
        className="w-full flex items-center px-4 h-[72px] rounded-2xl bg-[#FEF2F2] border-2 border-[#EF4444] shadow-card text-left"
      >
        <div className="w-12 h-12 rounded-xl bg-[#EF4444]/20 flex items-center justify-center mr-4 shrink-0">
          <MapPin size={24} className="text-[#EF4444]" />
        </div>
        <div className="flex-1">
          <p className="text-[#EF4444] font-bold text-[14px] font-display">Location unavailable</p>
          <p className="text-[#6B7A8D] text-[12px] font-body">{desc}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSendLocation}
      disabled={locState === "loading"}
      className="w-full flex items-center px-4 h-[72px] rounded-2xl gradient-location shadow-loc transition-all active:scale-95 disabled:opacity-80"
    >
      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mr-4 shrink-0">
        {locState === "loading"
          ? <Loader2 size={24} color="#fff" className="animate-spin" />
          : <MapPin size={24} color="#fff" />
        }
      </div>
      <div className="flex-1">
        <p className="text-white font-black text-[17px] font-display">
          {locState === "loading" ? "Getting location..." : "Send My Location"}
        </p>
        <p className="text-white/70 text-[12px] font-body">Share GPS location with owner</p>
      </div>
      {locState !== "loading" && (
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <MapPin size={18} color="#fff" />
        </div>
      )}
    </button>
  );
}
