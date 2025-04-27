#!/bin/bash
set -e

EXTENSION_UUID="adw-gtk3-colorizer@NiffirgkcaJ.github.com"
BUILD_DIR="build"
ZIP_FILE="$EXTENSION_UUID.zip"

# Create build directory
mkdir -p "$BUILD_DIR"

# Copy necessary files
cp extension.js metadata.json "$BUILD_DIR/"

# Create zip
cd "$BUILD_DIR"
zip -r "../$ZIP_FILE" *
cd ..

# Message to indicate the build was successful
echo "Build successful: $ZIP_FILE"

# Clean build directory
rm -rf "$BUILD_DIR"