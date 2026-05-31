module.exports = {
  apps: [
    {
      name: 'sport-lounge-server',
      script: './dist/server.js',
      cwd: './server', // Safety: guarantees that current working directory is set to server folder
      instances: 'max', // Scales automatically to utilize all CPU cores
      exec_mode: 'cluster', // Runs in cluster mode for zero-downtime reloads
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        ALLOWED_ORIGINS: 'http://localhost:3000,https://sportlounge.ru,https://www.sportlounge.ru',
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5000,
        ALLOWED_ORIGINS: 'http://localhost:3000,http://localhost:5173',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
    }
  ]
};
