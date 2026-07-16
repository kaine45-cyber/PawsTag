import { useState, useCallback } from "react";
import { getCurrentCoords, GeoError, type GeoErrorKind } from "@/lib/geolocation";

type State = "idle" | "loading" | "success" | "denied";

export function useLocation() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<GeoErrorKind | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const request = useCallback(async () => {
    setState("loading");
    setError(null);
    try {
      setCoords(await getCurrentCoords());
      setState("success");
    } catch (e) {
      setError(e instanceof GeoError ? e.kind : "unavailable");
      setState("denied");
    }
  }, []);

  return { state, error, coords, request };
}
