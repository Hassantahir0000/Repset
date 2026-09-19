import { getCurrentOrganization } from "@/features/organizations/queries";
import { OrganizationSettingsForm } from "./organization-settings-form";

export default async function OrganizationSettingsPage() {
  const organization = await getCurrentOrganization();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Organization settings</h1>
        <p className="text-sm text-gray-500">Slug: {organization.slug}</p>
      </div>

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
