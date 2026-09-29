import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/today")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
