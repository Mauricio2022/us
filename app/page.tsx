"use client";

import { useEffect, useState } from "react";

type Priority = "alta" | "media" | "baja";
type Category = "Actitud" | "Acción" | "Salida" | "Comunicación" | "Otra";

type Item = {
  id: string;
  text: string;
  category: Category;
  priority: Priority;
  done: boolean;
  createdAt: number;
};

const PRIORITY_META: Record<Priority, { label: string; color: string; ring: string }> = {
  alta: { label: "Importante", color: "var(--red-priority)", ring: "rgba(193,85,74,0.35)" },
  media: { label: "Pendiente", color: "var(--gold)", ring: "rgba(207,154,78,0.35)" },
  baja: { label: "Con calma", color: "var(--sage)", ring: "rgba(124,148,115,0.35)" },
};

const CATEGORIES: Category[] = ["Actitud", "Acción", "Salida", "Comunicación", "Otra"];
const STORAGE_KEY = "nosotros-items-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("Actitud");
  const [priority, setPriority] = useState<Priority>("media");
  const [filter, setFilter] = useState<Priority | "todas">("todas");

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {}
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function addItem() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setItems((prev) => [
      { id: uid(), text: trimmed, category, priority, done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setText("");
  }

  function toggleDone(id: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const total = items.length;
  const doneCount = items.filter((i) => i.done).length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  const visible = items
    .filter((i) => filter === "todas" || i.priority === filter)
    .sort((a, b) => {
      const order: Priority[] = ["alta", "media", "baja"];
      if (a.done !== b.done) return a.done ? 1 : -1;
      return order.indexOf(a.priority) - order.indexOf(b.priority);
    });

  return (
    <main className="min-h-screen px-5 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--rose)] mb-3">
            un espacio para los dos
          </p>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-tight">
            Nosotros
          </h1>
          <p className="mt-3 text-[15px] text-[var(--bone)]/70 max-w-md mx-auto">
            Las actitudes, acciones y salidas que queremos cuidar — anotadas,
            priorizadas y celebradas cuando las logramos.
          </p>
        </header>

        {total > 0 && (
          <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--plum)]/60 p-5">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-display text-2xl">{progress}%</span>
              <span className="text-xs text-[var(--bone)]/60">
                {doneCount} de {total} logrado{doneCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[var(--plum-deep)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--rose), var(--gold))",
                }}
              />
            </div>
          </div>
        )}

        <div className="mb-10 rounded-2xl border border-[var(--line)] bg-[var(--plum)]/60 p-5">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="¿Qué quieren cuidar o cambiar juntos?"
            className="w-full bg-transparent border-b border-[var(--line)] pb-3 text-[15px] placeholder:text-[var(--bone)]/40 focus:outline-none focus:border-[var(--rose)] transition-colors"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="rounded-full bg-[var(--plum-deep)] border border-[var(--line)] px-4 py-2 text-sm focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex gap-1.5 rounded-full bg-[var(--plum-deep)] border border-[var(--line)] p-1">
              {(["alta", "media", "baja"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors"
                  style={{
                    background: priority === p ? PRIORITY_META[p].ring : "transparent",
                    color: "var(--bone)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PRIORITY_META[p].color }}
                  />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>

            <button
              onClick={addItem}
              className="ml-auto rounded-full px-5 py-2 text-sm font-medium transition-transform hover:scale-[1.03]"
              style={{ background: "var(--rose)", color: "var(--plum-deep)" }}
            >
              Agregar
            </button>
          </div>
        </div>

        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {(["todas", "alta", "media", "baja"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="whitespace-nowrap rounded-full border px-4 py-1.5 text-xs transition-colors"
              style={{
                borderColor: filter === f ? "var(--rose)" : "var(--line)",
                color: "var(--bone)",
              }}
            >
              {f === "todas" ? "Todas" : PRIORITY_META[f as Priority].label}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {visible.length === 0 && (
            <li className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--bone)]/50">
              Todavía no hay nada aquí. Escriban lo primero que quieran cuidar juntos.
            </li>
          )}
          {visible.map((item) => (
            <li
              key={item.id}
              className="group relative flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--plum)]/50 p-4 pl-5 transition-opacity"
              style={{ opacity: item.done ? 0.5 : 1 }}
            >
              <span
                className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
                style={{ background: PRIORITY_META[item.priority].color }}
              />
              <button
                onClick={() => toggleDone(item.id)}
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors"
                style={{
                  borderColor: PRIORITY_META[item.priority].color,
                  background: item.done ? PRIORITY_META[item.priority].color : "transparent",
                }}
                aria-label="Marcar como logrado"
              >
                {item.done && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6.5L4.5 9L10 3" stroke="var(--plum-deep)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>

              <div className="min-w-0 flex-1">
                <p className={`text-[15px] leading-snug ${item.done ? "line-through" : ""}`}>
                  {item.text}
                </p>
                <span className="mt-1 inline-block text-xs text-[var(--bone)]/50">
                  {item.category}
                </span>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="text-[var(--bone)]/30 opacity-0 transition-opacity hover:text-[var(--bone)]/70 group-hover:opacity-100"
                aria-label="Eliminar"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>

        <footer className="mt-14 text-center text-xs text-[var(--bone)]/35">
          Guardado solo en este dispositivo · hecho con cariño para ustedes dos
        </footer>
      </div>
    </main>
  );
}
