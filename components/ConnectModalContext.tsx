"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { TELEGRAM_BOT_URL } from "@/lib/constants";

type Labels = { title: string; body: string; cta: string };

type Ctx = {
  openModal: () => void;
  closeModal: () => void;
};

const ConnectModalContext = createContext<Ctx | null>(null);

export function ConnectModalProvider({
  children,
  labels,
}: {
  children: React.ReactNode;
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const value = useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  useEffect(() => {
    const onLeave = (e: MouseEvent) => {
      if (e.clientY >= 0) return;
      if (sessionStorage.getItem("exitModalShown")) return;
      sessionStorage.setItem("exitModalShown", "1");
      setOpen(true);
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  return (
    <ConnectModalContext.Provider value={value}>
      {children}
      <div
        className={`modal-overlay fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/80 p-4 backdrop-blur-sm ${open ? "active" : ""}`}
        onClick={(e) => e.target === e.currentTarget && closeModal()}
        role="presentation"
      >
        <div className="modal-content relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl md:p-12">
          <button
            type="button"
            className="absolute right-4 top-4 text-3xl text-slate-400 transition-colors hover:text-dark"
            onClick={closeModal}
            aria-label="Close"
          >
            &times;
          </button>
          <h2 className="mb-4 text-3xl font-black text-primary">{labels.title}</h2>
          <p className="mb-8 text-lg text-slate-600">{labels.body}</p>
          <a
            href={TELEGRAM_BOT_URL}
            className="animate-pulse-custom inline-block w-full rounded-full bg-primary py-4 text-lg font-extrabold text-white transition-all hover:bg-primary-hover"
          >
            {labels.cta}
          </a>
        </div>
      </div>
    </ConnectModalContext.Provider>
  );
}

export function useConnectModal() {
  const ctx = useContext(ConnectModalContext);
  if (!ctx) {
    throw new Error("useConnectModal must be used within ConnectModalProvider");
  }
  return ctx;
}
