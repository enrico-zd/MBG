import { Container } from "@/components/ui/Container";
import { Suspense } from "react";
import { AdJobDetailClient } from "@/app/ad-jobs/[jobId]/AdJobDetailClient";

type Params = { params: Promise<{ jobId: string }> };

export default async function AdJobDetailPage(ctx: Params) {
  const { jobId } = await ctx.params;

  return (
    <main>
      <Container>
        <Suspense>
          <AdJobDetailClient jobId={jobId} />
        </Suspense>
      </Container>
    </main>
  );
}
