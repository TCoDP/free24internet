import { createHash } from "crypto";

/**
 * Подпись запроса в MONETA.Assistant (как в payanyway-python / SDK PayAnyWay).
 * MD5(MNT_ID + MNT_TRANSACTION_ID + MNT_AMOUNT + MNT_CURRENCY_CODE + MNT_TEST_MODE + secret)
 */
export function monetaAssistantRequestSignature(params: {
  accountId: string;
  transactionId: string;
  amountRub: number;
  currencyCode: string;
  testMode: boolean;
  secret: string;
}): string {
  const amount = Number(params.amountRub).toFixed(2);
  const test = params.testMode ? "1" : "0";
  const raw =
    String(params.accountId) +
    String(params.transactionId) +
    amount +
    String(params.currencyCode) +
    test +
    String(params.secret);
  return createHash("md5").update(raw, "utf8").digest("hex");
}

/**
 * Подпись входящего уведомления об оплате (документация Монета + payanyway-python).
 * MD5(MNT_ID + MNT_TRANSACTION_ID + MNT_OPERATION_ID + MNT_AMOUNT + MNT_CURRENCY_CODE + MNT_TEST_MODE + secret)
 */
export function monetaPaymentNotificationSignature(params: {
  accountId: string;
  transactionId: string;
  operationId: string;
  amountStr: string;
  currencyCode: string;
  testModeStr: string;
  secret: string;
}): string {
  const amount = Number(params.amountStr).toFixed(2);
  const raw =
    String(params.accountId) +
    String(params.transactionId) +
    String(params.operationId) +
    amount +
    String(params.currencyCode) +
    String(params.testModeStr) +
    String(params.secret);
  return createHash("md5").update(raw, "utf8").digest("hex");
}

export function buildMonetaAssistantPaymentUrl(params: {
  accountId: string;
  transactionId: string;
  amountRub: number;
  currencyCode: string;
  testMode: boolean;
  useDemoHost: boolean;
  secret: string;
  successUrl: string;
  description: string;
  locale: "ru" | "en";
  /** Возвращается в Pay URL; не участвует в MNT_SIGNATURE запроса (как в SDK). */
  custom1?: string;
}): string {
  const base = params.useDemoHost
    ? "https://demo.moneta.ru/assistant.htm"
    : "https://moneta.ru/assistant.htm";
  const amount = Number(params.amountRub).toFixed(2);
  const test = params.testMode ? "1" : "0";
  const mntSignature = monetaAssistantRequestSignature({
    accountId: params.accountId,
    transactionId: params.transactionId,
    amountRub: params.amountRub,
    currencyCode: params.currencyCode,
    testMode: params.testMode,
    secret: params.secret,
  });

  const q = new URLSearchParams({
    MNT_ID: params.accountId,
    MNT_TRANSACTION_ID: params.transactionId,
    MNT_AMOUNT: amount,
    MNT_CURRENCY_CODE: params.currencyCode,
    MNT_TEST_MODE: test,
    MNT_DESCRIPTION: params.description,
    MNT_SUCCESS_URL: params.successUrl,
    MNT_SIGNATURE: mntSignature,
    "moneta.locale": params.locale === "en" ? "en" : "ru",
  });

  const c1 = params.custom1?.trim();
  if (c1) q.set("MNT_CUSTOM1", c1);

  return `${base}?${q.toString()}`;
}
