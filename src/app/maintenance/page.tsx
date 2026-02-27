import { prisma } from "@/lib/prisma";

export default async function MaintenancePage() {
  const messageSetting = await prisma.siteSettings.findUnique({
    where: { key: "maintenanceMessage" },
  });
  const message =
    messageSetting?.value ?? "Site şu anda bakımda. Lütfen daha sonra tekrar deneyin.";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-base)] px-4 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#c4a24b]/20 bg-[#c4a24b]/10">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c4a24b"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Bakım Modu</h1>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}
