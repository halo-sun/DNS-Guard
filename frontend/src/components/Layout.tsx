import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Radio,
  ShieldAlert,
  Globe,
  Users,
  BarChart3,
  Sliders,
  Database,
  Settings,
  Menu,
  X,
  RadioTower,
  Eye,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "./ui/Button";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview", path: "/", icon: LayoutDashboard },
  { name: "Live DNS", path: "/live-dns", icon: Radio },
  { name: "Threat Alerts", path: "/alerts", icon: ShieldAlert, badge: "Alerts" },
  { name: "Domain Explorer", path: "/domains", icon: Globe },
  { name: "Clients", path: "/clients", icon: Users },
  { name: "Analytics", path: "/analytics", icon: BarChart3 },
  { name: "Detection Rules", path: "/rules", icon: Sliders },
  { name: "Data Sources", path: "/sources", icon: Database },
  { name: "Settings", path: "/settings", icon: Settings },
];

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Find active nav item for title
  const currentNav = NAV_ITEMS.find((item) =>
    item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col md:flex-row antialiased">
      {/* Accessibility: Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded focus:ring-2 focus:ring-primary-focus"
      >
        Skip to main content
      </a>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-hairline bg-surface-1 shrink-0 h-screen sticky top-0 select-none">
        {/* Brand / Logo */}
        <div className="p-4 border-b border-hairline flex items-center justify-between">
          <Logo />
        </div>

        {/* Global Operational Mode Banner */}
        <div className="px-4 py-2.5 bg-surface-2/70 border-b border-hairline">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="flex items-center gap-1.5 text-primary-hover font-semibold">
              <Eye className="w-3.5 h-3.5" /> OBSERVE ONLY
            </span>
            <span className="flex items-center gap-1 text-[#4ade80]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="text-[10px] text-ink-subtle mt-1 truncate">
            Source: <span className="text-ink-muted">Authorized Telemetry</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group",
                  isActive
                    ? "bg-surface-3 text-ink border border-hairline-strong font-semibold shadow-sm"
                    : "text-ink-muted hover:text-ink hover:bg-surface-2"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-primary-hover"
                        : "text-ink-subtle group-hover:text-ink"
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-4 text-ink-subtle border border-hairline group-hover:border-hairline-strong">
                    Active
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Status / System Footprint */}
        <div className="p-3 border-t border-hairline bg-surface-2/40 text-[11px] text-ink-subtle space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <RadioTower className="w-3.5 h-3.5 text-ink-tertiary" />
              Resolver Sensor
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">Active</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px]">Heuristics v1.0</span>
            <span className="text-ink-tertiary text-[10px] font-mono">8 Rules</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-3 border-b border-hairline bg-surface-1 sticky top-0 z-40">
        <Logo />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 text-ink-muted hover:text-ink bg-surface-2 rounded-md border border-hairline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-4/5 max-w-xs h-full bg-surface-1 border-r border-hairline p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-hairline mb-4">
                <Logo />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-ink-subtle hover:text-ink rounded"
                  aria-label="Close Navigation Menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-3 px-3 py-2 rounded bg-surface-2 text-[11px] font-mono text-primary-hover flex items-center justify-between">
                <span>MODE: OBSERVE ONLY</span>
                <span className="w-2 h-2 rounded-full bg-[#4ade80]" />
              </div>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-all",
                        isActive
                          ? "bg-surface-3 text-ink border border-hairline-strong font-semibold"
                          : "text-ink-muted hover:text-ink hover:bg-surface-2"
                      )}
                    >
                      <Icon className="w-4 h-4 text-primary" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-hairline text-xs text-ink-subtle">
              DNS Guard • Computer Networks Project
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top bar on desktop */}
        <header className="hidden md:flex items-center justify-between h-14 px-6 border-b border-hairline bg-surface-1/40 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-ink-subtle">
            <span className="font-semibold text-ink">DNS Guard</span>
            <ChevronRight className="w-3.5 h-3.5 text-ink-tertiary" />
            <span className="text-ink-muted">{currentNav?.name || "Console"}</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded bg-surface-2 border border-hairline text-ink-muted">
              <CheckCircle2 className="w-3 h-3 text-[#4ade80]" />
              <span>Engine Status: Nominal</span>
            </div>
          </div>
        </header>

        {/* Main Content Router Target */}
        <main id="main-content" className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
