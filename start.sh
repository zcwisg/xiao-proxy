#!/bin/bash
echo "======================================="
echo "  UART NodeJS Service"
echo "======================================="
echo



if [ ! -d "node_modules" ]; then
    echo "[Info] Installing dependencies..."
    ./install.sh
fi

# 读取配置文件中的端口号
PORT=3000
if [ -f "config.json" ]; then
    PORT=$(grep "port" config.json | awk -F":" '{print $2}' | sed 's/,//g' | sed 's/}//g' | tr -d ' ')
fi

echo "[Service] http://localhost:$PORT"
echo "Press Ctrl+C to stop."
echo
node/bin/node server.js
