import { Container } from "@/components/ui/Container";
import { AdJobsDashboardClient } from "@/app/ad-jobs/AdJobsDashboardClient";

export default function AdJobsPage() {
  return (
    <main>
      <Container>
        <AdJobsDashboardClient />
      </Container>
    </main>
  );
}
