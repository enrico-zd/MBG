import { Container } from "@/components/ui/Container";
import { AdJobNewClient } from "@/app/ad-jobs/new/AdJobNewClient";
import { Suspense } from "react";

export default function AdJobNewPage() {
  return (
    <main>
      <Container>
        <Suspense>
          <AdJobNewClient />
        </Suspense>
      </Container>
    </main>
  );
}
