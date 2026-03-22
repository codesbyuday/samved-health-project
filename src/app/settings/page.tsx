import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SettingsPage from "@/components/common/SettingsPage";

export default function AccountSettingsRoute() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950">
        <div className="mx-auto max-w-5xl">
          <SettingsPage />
        </div>
      </main>
    </ProtectedRoute>
  );
}
