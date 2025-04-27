#!/bin/bash
set -e

EXTENSION_UUID="adw-gtk3-colorizer@NiffirgkcaJ.github.com"
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "Uninstalling extension from $INSTALL_DIR..."

# Remove the installed extension
rm -rf "$INSTALL_DIR"

echo "Extension uninstalled successfully."

echo "You may need to restart GNOME Shell (Alt+F2, type 'r' and press Enter) or log out and back in."