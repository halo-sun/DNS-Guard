import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/Button";

export function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="w-12 h-12 rounded-full bg-surface-2 border border-hairline flex items-center justify-center text-primary">
        <ShieldAlert className="w-6 h-6 stroke-[2]" />
      </div>
      <h1 className="text-xl font-bold font-mono text-ink">404 — Route Not Found</h1>
      <p className="text-xs text-ink-subtle max-w-sm">
        The requested security console route does not exist or has been relocated.
      </p>
      <Link to="/">
        <Button variant="primary" size="sm" className="gap-2 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Overview
        </Button>
      </Link>
    </div>
  );
}
