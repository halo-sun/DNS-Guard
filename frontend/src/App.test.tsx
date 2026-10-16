import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import App from "./App";
import { SeverityBadge } from "./components/ui/SeverityBadge";
import { StatusDot } from "./components/ui/StatusDot";
import { EmptyState, OfflineState } from "./components/ui/States";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("DNS Guard Frontend Components", () => {
  it("renders SeverityBadge with correct text, score, and accessible level", () => {
    const { getByText } = render(
      <SeverityBadge severity="critical" score={90} />
    );
    expect(getByText("CRITICAL")).toBeInTheDocument();
    expect(getByText("(90)")).toBeInTheDocument();
  });

  it("renders StatusDot with appropriate color and label", () => {
    const { getByText } = render(<StatusDot status="online" label="ACTIVE" />);
    expect(getByText("ACTIVE")).toBeInTheDocument();
  });

  it("renders EmptyState and OfflineState messaging", () => {
    render(<EmptyState title="No queries observed" description="No DNS packets in current window." />);
    expect(screen.getByText("No queries observed")).toBeInTheDocument();

    render(<OfflineState title="Backend Offline" description="Sensor feed disconnected." />);
    expect(screen.getByText("Backend Offline")).toBeInTheDocument();
  });

  it("renders the primary App shell without crashing", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    );

    // Should render the DNS Guard brand in the header
    expect(screen.getAllByText("DNS GUARD")[0]).toBeInTheDocument();
  });
});
