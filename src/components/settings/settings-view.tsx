"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploadField } from "@/components/shared/image-upload-field";
import { updateOrgSettings } from "@/actions/profile-actions";

export function SettingsView({
  orgName: initialOrgName,
  logoUrl: initialLogoUrl,
}: {
  orgName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const [orgName, setOrgName] = useState(initialOrgName);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const result = await updateOrgSettings({ orgName, logoUrl });
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert>
              <AlertDescription>Settings updated. Changes appear across the app.</AlertDescription>
            </Alert>
          )}

          <ImageUploadField label="Organization Logo" value={logoUrl} onChange={setLogoUrl} shape="square" />

          <div className="space-y-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
