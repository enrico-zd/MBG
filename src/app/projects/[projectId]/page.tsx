import { Container } from "@/components/ui/Container";
import { ProjectDetailClient } from "@/app/projects/[projectId]/ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <main>
      <Container>
        <ProjectDetailClient projectId={projectId} />
      </Container>
    </main>
  );
}

