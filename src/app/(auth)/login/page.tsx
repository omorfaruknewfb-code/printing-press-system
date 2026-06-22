import { LoginForm } from "@/components/login-form";
import { getSettings } from "@/lib/settings-data";

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-emerald-950 via-green-900 to-teal-950">
        <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMzAgMTVjLTggMC0xNSA3LTE1IDE1czcgMTUgMTUgMTUgMTUtNyAxNS0xNS03LTE1LTE1LTE1eiIgZmlsbD0icmdiYSgyMSwxMjgsMTEyLDAuMDcpIi8+PC9zdmc+')] bg-repeat"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm sm:max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt={settings.orgName}
                className="mb-3 h-16 w-16 rounded-full object-cover"
              />
            )}
            <h1 className="text-2xl font-semibold text-white">{settings.orgName}</h1>
            <p className="mt-1 text-sm text-emerald-200">Sign in to manage your business</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </>
  );
}
