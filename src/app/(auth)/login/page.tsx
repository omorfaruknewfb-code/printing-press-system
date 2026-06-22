import { LoginForm } from "@/components/login-form";
import { getSettings } from "@/lib/settings-data";

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          {settings.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoUrl}
              alt={settings.orgName}
              className="mb-3 h-16 w-16 rounded-full object-cover"
            />
          )}
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{settings.orgName}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sign in to manage your business</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
