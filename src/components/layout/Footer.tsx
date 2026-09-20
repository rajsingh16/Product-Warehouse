const DESIGNER_COMPANY = 'ABC@company.com';

export function Footer() {
  return (
    <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex flex-col gap-1 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium text-slate-700">© 2026 ShanConnects</p>
        <p>Version 1.0 · Created/Maintained by - {DESIGNER_COMPANY}</p>
      </div>
    </footer>
  );
}
