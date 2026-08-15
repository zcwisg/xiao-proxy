# Xiao Proxy - 微设备免流服务

## Quick Start

1. Run: chmod +x start.sh install.sh
2. Run: ./start.sh
3. Open browser: http://localhost:3000 (or custom port from config.json)

## Notes

- Node.js is included (no installation needed)
- First run will auto-install dependencies
- Press Ctrl+C to stop

## Configuration

Edit config.json to customize settings:
- web.enabled: true/false (enable/disable Express server)
- web.port: port number (default: 3000)
- logging.console: true/false (enable/disable console logs)

## Files

- start.sh - Start service
- install.sh - Install dependencies
- node/ - Node.js runtime (included)
- server.js, etc. - Source files
- public/ - Web frontend
- config.json - Configuration file
