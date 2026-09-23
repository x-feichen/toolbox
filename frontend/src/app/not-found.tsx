import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-[40px] font-semibold text-foreground">404</p>
      <p className="mt-2 text-[14px] text-secondary-text">This page doesn't exist.</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-9 items-center rounded-sm bg-accent px-3 text-[13px] font-medium text-accent-fg hover:bg-accent-hover"
      >
        返回首页
      </Link>
    </div>
  );
}
