#!/bin/bash
echo "========================================"
echo "  UART NodeJS - Install Dependencies"
echo "========================================"
echo


if [ -d "node_modules" ]; then
    echo "[Info] Dependencies already installed."
    exit 0
fi

echo "Installing dependencies..."
# Set PATH to use our bundled Node.js
export PATH="$(pwd)/node/bin:$PATH"
# Use bundled npm to install dependencies
node/bin/node node/lib/node_modules/npm/bin/npm-cli.js install --production

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "  Installation Complete!"
    echo "========================================"
else
    echo "[Error] Installation failed."
fi
