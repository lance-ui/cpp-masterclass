import { PageContainer, PageHeader, Button } from "@/components/ui";

export function TermsPage({ onBack }: { onBack: () => void }) {
  return (
    <PageContainer narrow className="!py-8">
      <PageHeader
        title="Terms of service"
        description="Placeholder terms for the C++ MasterClass learning platform."
        action={
          <Button variant="secondary" size="sm" onClick={onBack}>
            Back
          </Button>
        }
      />
      <div className="page-prose space-y-4 text-sm text-[var(--app-muted)]">
        <p>
          These terms are a placeholder. By using this application you agree to
          use the sandboxed compiler and curriculum materials for learning
          purposes. Do not attempt to escape the sandbox or abuse shared
          infrastructure.
        </p>
        <p>
          Course progress, bookmarks, and quiz scores are stored with your
          account on the server. Content and branding remain the property of
          their respective owners.
        </p>
        <p>Contact the course administrator for questions about these terms.</p>
      </div>
    </PageContainer>
  );
}

export function PrivacyPage({ onBack }: { onBack: () => void }) {
  return (
    <PageContainer narrow className="!py-8">
      <PageHeader
        title="Privacy policy"
        description="Placeholder privacy notice for the C++ MasterClass learning platform."
        action={
          <Button variant="secondary" size="sm" onClick={onBack}>
            Back
          </Button>
        }
      />
      <div className="page-prose space-y-4 text-sm text-[var(--app-muted)]">
        <p>
          This privacy notice is a placeholder. We store account identity
          (name, email, optional avatar), learning progress, bookmarks, quiz
          scores, and activity needed to operate the product.
        </p>
        <p>
          Code you submit to the sandbox is executed on the server for compilation
          and short-lived runs. Submissions are not published to other students.
        </p>
        <p>
          Authentication uses Google OAuth. We do not sell personal data. Replace
          this page with a production policy before a public launch.
        </p>
      </div>
    </PageContainer>
  );
}
