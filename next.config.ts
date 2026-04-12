import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Нативный драйвер: не тащить через webpack (node: URL внутри зависимостей). */
  serverExternalPackages: ["mysql2"],
  /**
   * Dev: защита от cross-origin к `/_next/*`. Браузер часто ходит на localhost как на [::1] —
   * без этого Origin не совпадает с "localhost", часть чанков (CSS/JS) режется → «сломанная» вёрстка.
   * LAN-IP добавляйте под свою сеть.
   */
  allowedDevOrigins: [
    "185.216.87.152",
    "46.48.87.124",
    "10.50.10.30",
    "127.0.0.1",
    "::1",
    "[::1]",
  ],
  /** Единый канонический хост (www → apex). */
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.free24internet.vip" }],
        destination: "https://free24internet.vip/:path*",
        permanent: true,
      },
    ];
  },
  /**
   * Dev: страница на `127.0.0.1`, а часть `/_next/*` уходит на `localhost` (другой «site»).
   * Без полного Referer Next иногда режет запрос (403) → нет CSS/JS. Только development.
   */
  async headers() {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "unsafe-url" }],
      },
    ];
  },
};

export default nextConfig;
