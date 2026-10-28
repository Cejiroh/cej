import { useEffect, useState } from "react";

export const parseHash = () => {
  const h = (location.hash || "#/hub").replace(/^#\/?/, "");
  const [view, ...rest] = h.split("/");
  return { view: view || "hub", arg: rest.join("/") };
};

export const go = (path: string) => {
  location.hash = "#/" + path.replace(/^\//, "");
};
export const back = () => {
  if (history.length > 1) history.back();
  else go("hub");
};

export function useRoute() {
  const [r, setR] = useState(parseHash());
  useEffect(() => {
    const on = () => setR(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return r;
}
