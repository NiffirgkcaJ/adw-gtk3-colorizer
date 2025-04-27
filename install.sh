#!/bin/bash
set -e

EXTENSION_UUID="adw-gtk3-colorizer@NiffirgkcaJ.github.com"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Installing extension to $INSTALL_DIR..."

# Create the target directory
mkdir -p "$INSTALL_DIR"

# Copy necessary files
cp extension.js metadata.json "$INSTALL_DIR/"

echo "Extension installed successfully."

echo "You may need to restart GNOME Shell (Alt+F2, type 'r' and press Enter) or log out and back in."