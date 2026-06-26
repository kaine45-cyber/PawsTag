import { useState, useCallback } from "react";
type State = "idle" | "loading" | "success" | "denied";
export function useLocation() {
  const [state, setState] = useState<State>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const request = useCallback(() => {
    if (!navigator.geolocation) { setState("denied"); return; }
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (p) => { setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }); setState("success"); },
      () => setState("denied"),
      { timeout: 8000 },
    );
  }, []);
  return { state, coords, request };
}
