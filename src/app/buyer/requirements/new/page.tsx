import { PageHeader } from "@/components/ui/misc";
import { RequirementWizard } from "./wizard";

export const metadata = { title: "Post a requirement" };

export default function NewRequirementPage() {
  return (
    <>
      <PageHeader
        title="Post a technology requirement"
        description="Share the problem you need to solve. Elets structures it, identifies suitable verified providers and helps move it to an outcome. Only a few fields are required."
      />
      <RequirementWizard />
    </>
  );
}
