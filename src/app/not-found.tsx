import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-3 px-6 py-24">
      <h1 className="text-title font-semibold">Страница не найдена</h1>
      <p className="text-fg-secondary">Проект или пространство не существует, либо у вас нет к нему доступа.</p>
      <Link href="/" className="text-accent hover:underline">На главную</Link>
    </main>
  );
}
