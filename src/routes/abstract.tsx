import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "@/features/crop-care/meta";
import { AbstractPage } from "@/features/crop-care/pages/Abstract";

export const Route = createFileRoute("/abstract")({
  head: () => ({
    meta: pageMeta(
      "Research Abstract",
      "KisanAI: An Offline-First Edge Artificial Intelligence Architecture for Real-Field Rice & Chilli Crop Pathology and Vernacular Diagnostics."
    ),
  }),
  component: AbstractPage,
});
