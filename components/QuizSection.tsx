"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import type { SiteMessages } from "@/lib/messages/types";
import { TELEGRAM_BOT_URL } from "@/lib/constants";

function stepLabel(locale: Locale, step: number) {
  return locale === "en" ? `Question ${step} of 3` : `Вопрос ${step} из 3`;
}

export function QuizSection({
  quiz,
  locale,
}: {
  quiz: SiteMessages["quiz"];
  locale: Locale;
}) {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<"quiz" | "loading" | "result">("quiz");

  const progress = (step / 3) * 100;

  const next = (from: number) => {
    if (from < 3) setStep(from + 1);
  };

  const finish = () => {
    setPhase("loading");
    setTimeout(() => setPhase("result"), 2000);
  };

  const options = [quiz.q1Options, quiz.q2Options, quiz.q3Options];

  return (
    <section className="bg-slate-200 py-16 md:py-24" id="quiz">
      <div className="mx-auto max-w-[700px] px-4 md:px-8">
        <div className="relative flex min-h-[400px] flex-col justify-center rounded-3xl bg-white p-8 shadow-xl md:p-12">
          {phase === "quiz" ? (
            <>
              <div className="quiz-header mb-8 text-center">
                <h2 className="mb-2 text-2xl font-extrabold text-dark md:text-3xl">{quiz.title}</h2>
                <p className="mb-6 text-slate-600">{quiz.subtitle}</p>
                <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-sm font-bold text-slate-400">{stepLabel(locale, step)}</div>
              </div>
              {[1, 2, 3].map((s) => (
                <div key={s} className={`quiz-step ${step === s ? "active" : ""}`}>
                  <p className="mb-6 text-center text-xl font-extrabold text-dark">
                    {s === 1 ? quiz.q1 : s === 2 ? quiz.q2 : quiz.q3}
                  </p>
                  <div className="flex flex-col gap-4">
                    {options[s - 1].map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="w-full rounded-xl border-2 border-slate-300 bg-slate-50 p-4 text-left font-bold text-slate-700 transition-all hover:translate-x-1 hover:border-primary hover:bg-slate-100 hover:text-primary"
                        onClick={() => (s === 3 ? finish() : next(s))}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : null}
          {phase === "loading" ? (
            <div className="flex flex-col items-center gap-6 py-8">
              <div className="spinner" />
              <p className="text-lg font-bold text-slate-600">{quiz.loading}</p>
            </div>
          ) : null}
          {phase === "result" ? (
            <div className="animate-fade-in text-center">
              <h3 className="mb-4 text-3xl font-extrabold text-primary">{quiz.resultTitle}</h3>
              <p className="mb-8 text-lg text-slate-600">{quiz.resultBody}</p>
              <a
                href={TELEGRAM_BOT_URL}
                className="animate-pulse-custom inline-block w-full rounded-full bg-primary py-4 text-xl font-extrabold text-white transition-all hover:bg-primary-hover"
              >
                {quiz.resultCta}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
