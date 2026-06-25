"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Priority = "importante" | "moderado" | "bajo" | "opcional";
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
  importante: { label: "Importante", fg: "#ff5d5d", soft: "#ffe9e9" },
  moderado: { label: "Moderado", fg: "#ffb648", soft: "#fff3df" },
  bajo: { label: "Bajo", fg: "#2bb673", soft: "#e3f7ec" },
  opcional: { label: "Opcional", fg: "#6d8aff", soft: "#eaefff" },
};

const PRIORITY_ORDER: Priority[] = ["importante", "moderado", "bajo", "opcional"];
const CATEGORIES: Category[] = ["Actitud", "Acción", "Salida", "Comunicación", "Otra"];
const STORAGE_KEY = "nosotros-items-v3";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [synced, setSynced] = useState<"checking" | "online" | "offline">("checking");
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("Actitud");
  const [priority, setPriority] = useState<Priority>("moderado");
  const [filter, setFilter] = useState<Priority | "todas">("todas");
  const firstLoad = useRef(true);
  const skipNextSave = useRef(false);
  const itemsRef = useRef<Item[]>([]);
  itemsRef.current = items;

  // Trae lo último del servidor (usado al cargar, cada pocos segundos, y al volver a la pestaña)
  async function refreshFromServer(isInitial = false) {
    try {
      const res = await fetch("/api/items", { cache: "no-store" });
      const data = await res.json();
      if (!data.configured) {
        if (isInitial) {
          setSynced("offline");
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setItems(JSON.parse(raw));
        }
        return;
      }
      setSynced("online");
      const serverItems: Item[] = data.items ?? [];
      if (isInitial && serverItems.length === 0) {
        // primera carga sin nada en el servidor: usa lo que haya local
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
        return;
      }
      // Evita pisar cambios si el contenido es idéntico (evita parpadeos)
      if (JSON.stringify(serverItems) !== JSON.stringify(itemsRef.current)) {
        skipNextSave.current = true;
        setItems(serverItems);
      }
    } catch {
      if (isInitial) {
        setSynced("offline");
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      }
    }
  }

  // Carga inicial
  useEffect(() => {
    (async () => {
      await refreshFromServer(true);
      setLoaded(true);
    })();
  }, []);

  // Vuelve a consultar el servidor cada 4s, y al volver a la pestaña/app
  useEffect(() => {
    if (!loaded) return;
    const interval = setInterval(() => refreshFromServer(false), 4000);
    function onFocus() {
      refreshFromServer(false);
    }
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [loaded]);

  // Guarda en localStorage siempre, y en servidor si el cambio fue local (no si vino del polling)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (synced === "online") {
      fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }
  }, [items, loaded, synced]);

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
      if (a.done !== b.done) return a.done ? 1 : -1;
      return PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
    });

  return (
    <main
      className="min-h-screen px-4 sm:px-5 py-8 sm:py-20"
      style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mb-8 sm:mb-10 flex items-start justify-between gap-3"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
              Nosotros
            </h1>
            <p className="mt-2 text-[14px] sm:text-[15px] text-[var(--muted)]">
              Lo que queremos cuidar y mejorar, juntos.
            </p>
          </div>
          <AnimatePresence>
            {loaded && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shrink-0"
                style={{
                  background: synced === "online" ? "#e3f7ec" : "#fff3df",
                  color: synced === "online" ? "#2bb673" : "#c98a1f",
                }}
                title={synced === "online" ? "Sincronizado entre dispositivos" : "Guardado solo en este dispositivo"}
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: synced === "online" ? "#2bb673" : "#ffb648" }}
                  animate={synced === "online" ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="hidden sm:inline">
                  {synced === "online" ? "Sincronizado" : "Solo local"}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.header>

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
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <div className="flex gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="flex-1 sm:flex-none rounded-full bg-[var(--bg)] border border-[var(--border)] px-3.5 py-2.5 sm:py-2 text-sm text-[var(--ink)] cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-1 rounded-full bg-[var(--bg)] border border-[var(--border)] p-1 overflow-x-auto">
              {PRIORITY_ORDER.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 sm:py-1.5 text-xs font-medium transition-colors"
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
              whileHover={{ scale: 1.02 }}
              onClick={addItem}
              className="sm:ml-auto rounded-full px-5 py-2.5 sm:py-2 text-sm font-semibold text-white"
              style={{ background: "var(--accent)" }}
            >
              Agregar
            </motion.button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {(["todas", ...PRIORITY_ORDER] as const).map((f) => (
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
            {visible.map((item, index) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: item.done ? 0.55 : 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95, x: -8, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 350, damping: 28, delay: index * 0.04 }}
                className="group flex items-center gap-3 rounded-2xl bg-[var(--surface)] p-4"
                style={{ boxShadow: "var(--shadow)" }}
                whileHover={{ boxShadow: "var(--shadow-hover)" }}
              >
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => toggleDone(item.id)}
                  className="flex h-7 w-7 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: item.done ? PRIORITY_META[item.priority].fg : PRIORITY_META[item.priority].soft,
                  }}
                  aria-label="Marcar como logrado"
                >
                  <AnimatePresence>
                    {item.done && (
                      <motion.svg
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path d="M2 6.5L4.5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </motion.button>

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

                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={() => removeItem(item.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)]/60 transition-colors opacity-100 sm:opacity-0 hover:bg-[var(--bg)] hover:text-[var(--red)] sm:group-hover:opacity-100"
                  aria-label="Eliminar"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </motion.button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <footer className="mt-12 text-center text-xs text-[var(--muted)]">
          {synced === "online"
            ? "Guardado en la nube · visible desde cualquier dispositivo"
            : "Guardado solo en este dispositivo"}
        </footer>
      </div>
    </main>
  );
}
