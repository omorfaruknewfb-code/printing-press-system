import { LoginForm } from "@/components/login-form";
import { getSettings } from "@/lib/settings-data";

export default async function LoginPage() {
  const settings = await getSettings();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)
        `,
        backgroundSize: '40px 40px'
      }}
    >
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
          <p className="mt-1 text-sm text-slate-300">Sign in to manage your business</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
