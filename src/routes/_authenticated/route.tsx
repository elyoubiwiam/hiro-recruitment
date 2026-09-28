import { createFileRoute, Outlet } from "@tanstack/react-router";

// Accounts temporarily disabled: workspace is open without sign-in (demo mode).
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => <Outlet />,
});
