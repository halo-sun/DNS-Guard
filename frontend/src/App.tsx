import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { LiveDns } from "./pages/LiveDns";
import { ThreatAlerts } from "./pages/ThreatAlerts";
import { DomainExplorer } from "./pages/DomainExplorer";
import { Clients } from "./pages/Clients";
import { Analytics } from "./pages/Analytics";
import { DetectionRules } from "./pages/DetectionRules";
import { DataSources } from "./pages/DataSources";
import { Settings } from "./pages/Settings";
import { NotFound } from "./pages/NotFound";
import { ErrorBoundary } from "./components/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="live-dns" element={<LiveDns />} />
          <Route path="alerts" element={<ThreatAlerts />} />
          <Route path="domains" element={<DomainExplorer />} />
          <Route path="clients" element={<Clients />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="rules" element={<DetectionRules />} />
          <Route path="sources" element={<DataSources />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
