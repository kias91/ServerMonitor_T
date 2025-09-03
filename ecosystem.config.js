module.exports = {
  apps: [{
    name: 'server-monitor-mcp',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      MCP_PORT: 8300
    },
    env_development: {
      NODE_ENV: 'development',
      MCP_PORT: 8300
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
