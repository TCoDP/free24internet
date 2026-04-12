/** PM2: `pm2 start ecosystem.config.cjs` из каталога vpn_bot; автозапуск: pm2 save + pm2 startup */
const path = require("path");

const root = __dirname;

module.exports = {
  apps: [
    {
      name: "vpn_bot",
      script: "bot.py",
      cwd: root,
      interpreter: path.join(root, "venv", "bin", "python"),
      autorestart: true,
      watch: false,
      max_restarts: 30,
      min_uptime: "5s",
      exp_backoff_restart_delay: 2000,
    },
  ],
};
