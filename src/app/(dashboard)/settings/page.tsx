import { getSettings } from "@/lib/settings-data";
import { SettingsView } from "@/components/settings/settings-view";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500">Your business name and logo, shown app-wide</p>
      </div>

      <SettingsView orgName={settings.orgName} logoUrl={settings.logoUrl} />
    </div>
  );
}
