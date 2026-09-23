import { redirect } from "next/navigation";

/**
 * Deep links keep working: /tools/<slug> redirects into the workbench.
 */
export default async function ToolRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/tools?slug=${encodeURIComponent(slug)}`);
}
