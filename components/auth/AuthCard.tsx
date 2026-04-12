export function AuthCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-light px-4 pb-20 pt-32 md:pt-40">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl md:p-10">
          <h1 className="mb-8 text-center text-3xl font-black tracking-tight text-dark">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
