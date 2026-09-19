import { getCurrentOrganization } from "@/features/organizations/queries";
import { OrganizationSettingsForm } from "./organization-settings-form";
import { PageHeader } from "@/components/page-header";

export default async function OrganizationSettingsPage() {
  const organization = await getCurrentOrganization();

  return (
    <div className="max-w-lg space-y-5">
      <PageHeader title="Organization settings" description={`Slug: ${organization.slug}`} />

      <OrganizationSettingsForm
        organization={{
          name: organization.name,
          timezone: organization.timezone,
          currency: organization.currency,
        }}
      />
    </div>
  );
}
