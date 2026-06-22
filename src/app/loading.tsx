export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center justify-center animate-in fade-in duration-300">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-500" />
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}
