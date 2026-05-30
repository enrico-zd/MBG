import { Container } from "@/components/ui/Container";
import { ProjectsClient } from "@/app/projects/ProjectsClient";

export default function ProjectsPage() {
  return (
    <main>
      <Container>
        <ProjectsClient />
      </Container>
    </main>
  );
}
