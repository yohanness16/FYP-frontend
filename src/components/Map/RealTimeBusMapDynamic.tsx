"use client";

import dynamic from "next/dynamic";

const MapLoading = () => (
  <div
    className="card"
    style={{
      height: "100%",
      minHeight: 400,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-3)",
      fontSize: 14,
    }}
  >
    Loading map…
  </div>
);

/** Leaflet requires `window`; load only on the client. */
export const RealTimeBusMapDynamic = dynamic(
  () => import("./RealTimeBusMap").then((m) => m.default),
  { ssr: false, loading: () => <MapLoading /> }
);
