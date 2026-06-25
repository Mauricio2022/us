"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

const PRIORITY_META: Record<Priority, { label: string; fg: string; soft: string }> = {
  alta: { label: "Importante", fg: "var(--red)", soft: "var(--red-soft)" },
  media: { label: "Pendiente", fg: "var(--amber)", soft: "var(--amber-soft)" },
  baja: { label: "Con calma", fg: "var(--green)", soft: "var(--green-soft)" },
};

const CATEGORIES: Category[] = ["Actitud", "Acción", "Salida", "Comunicación", "Otra"];
const STORAGE_KEY = "nosotros-items-v2";

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
    <main className="min-h-screen px-5 py-12 sm:py-20">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Nosotros
          </h1>
          <p className="mt-2 text-[15px] text-[var(--muted)]">
            Lo que queremos cuidar y mejorar, juntos.
          </p>
        </header>

        {/* Progress */}
        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-3xl bg-[var(--surface)] p-5"
            style={{ boxShadow: "var(--shadow)" }}
          >
            <div className="flex items-baseline justify-between mb-3">
              <span className="font-display text-2xl font-bold">{progress}%</span>
              <span className="text-sm text-[var(--muted)]">
                {doneCount} de {total} lograd{doneCount === 1 ? "o" : "os"}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}

        {/* Add form */}
        <div
          className="mb-8 rounded-3xl bg-[var(--surface)] p-5"
          style={{ boxShadow: "var(--shadow)" }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
            placeholder="¿Qué quieren cuidar o cambiar?"
            className="w-full bg-transparent text-[15px] placeholder:text-[var(--muted)] focus:outline-none"
          />
          <div className="my-4 h-px bg-[var(--border)]" />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="rounded-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2 text-sm text-[var(--ink)] cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex gap-1 rounded-full bg-[var(--bg)] border border-[var(--border)] p-1">
              {(["alta", "media", "baja"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: priority === p ? PRIORITY_META[p].soft : "transparent",
                    color: priority === p ? PRIORITY_META[p].fg : "var(--muted)",
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: PRIORITY_META[p].fg }}
                  />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={addItem}
              className="ml-auto rounded-full px-5 py-2 text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Agregar
            </motion.button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {(["todas", "alta", "media", "baja"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: filter === f ? "var(--ink)" : "var(--surface)",
                color: filter === f ? "white" : "var(--muted)",
                boxShadow: filter === f ? "none" : "var(--shadow)",
              }}
            >
              {f === "todas" ? "Todas" : PRIORITY_META[f as Priority].label}
            </button>
          ))}
        </div>

        {/* List */}
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {visible.length === 0 && (
              <motion.li
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-3xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--muted)]"
              >
                Todavía no hay nada aquí. Escriban lo primero que quieran cuidar.
              </motion.li>
            )}
            {visible.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: item.done ? 0.55 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className="group flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4"
                style={{ boxShadow: "var(--shadow)" }}
                whileHover={{ boxShadow: "var(--shadow-hover)" }}
              >
                <button
                  onClick={() => toggleDone(item.id)}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: item.done ? PRIORITY_META[item.priority].fg : PRIORITY_META[item.priority].soft,
                  }}
                  aria-label="Marcar como logrado"
                >
                  {item.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] leading-snug ${item.done ? "line-through" : ""}`}>
                    {item.text}
                  </p>
                  <span
                    className="mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "var(--bg)", color: "var(--muted)" }}
                  >
                    {item.category}
                  </span>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="shrink-0 text-[var(--border)] opacity-0 transition-opacity hover:text-[var(--muted)] group-hover:opacity-100"
                  aria-label="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <footer className="mt-12 text-center text-xs text-[var(--muted)]">
          Guardado solo en este dispositivo
        </footer>
      </div>
    </main>
  );
}
