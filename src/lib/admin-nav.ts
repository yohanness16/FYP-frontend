import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bus,
  LayoutDashboard,
  Map,
  Radio,
  Route,
  Settings,
  Truck,
  Users,
  ScanEye,
} from "lucide-react";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type AdminNavGroup = {
  group: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    group: "MONITOR",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/map", label: "Live Map", icon: Map },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/crowd", label: "Crowd Density", icon: ScanEye },
    ],
  },
  {
    group: "FLEET",
    items: [
      { href: "/vehicles", label: "Vehicles", icon: Truck },
      { href: "/routes", label: "Routes & Stops", icon: Route },
      { href: "/assignments", label: "Live Trips", icon: Radio },
    ],
  },
  {
    group: "ADMIN",
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/settings", label: "Settings & ML", icon: Settings },
    ],
  },
];

export const ADMIN_BRAND = {
  name: "BusTrack",
  icon: Bus,
  tagline: "Fleet intelligence for Addis Ababa",
};
