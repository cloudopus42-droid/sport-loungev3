module.exports = {
  apps: [
    {
      name: 'sport-lounge',
      script: './dist/server.js',
      cwd: '/var/www/sport-lounge/server',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_file: '.env',
      watch: false,
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/sport-lounge-error.log',
      out_file: '/var/log/pm2/sport-lounge-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
