#!/bin/bash
set -e

# --- Configuration & Argument Parsing ---
TARGET=$1

# Check if a valid target was provided
if [[ "$TARGET" != "review" && "$TARGET" != "package" ]]; then
    echo "Error: Invalid or missing target." >&2
    echo "Usage: $0 [review | package]" >&2
    echo "  review  - Build the source zip for extensions.gnome.org review" >&2
    echo "  package - Build the installable package for GitHub Releases" >&2
    exit 1
fi

# Read the UUID directly from the metadata.json inside the extension directory
if ! EXTENSION_UUID=$(jq -r '.uuid' gnome-extensions/extension/metadata.json); then
    echo "Error: Could not parse UUID from gnome-extensions/extension/metadata.json." >&2
    echo "Please ensure 'jq' is installed and the file is correct." >&2
    exit 1
fi

# --- Build Directory ---
BUILD_DIR="build_temp"

# --- Set Zip Filename ---
if [ "$TARGET" == "review" ]; then
    ZIP_FILE="${EXTENSION_UUID}-review.zip"
    echo "Building SOURCE zip for extensions.gnome.org review..."
else # Target is "package"
    ZIP_FILE="${EXTENSION_UUID}.zip"
    echo "Building installable PACKAGE for distribution..."
fi

# --- Main Script ---
# 1. Clean up previous build artifacts
echo "Cleaning up old build files..."
rm -rf "$BUILD_DIR"
rm -f "${EXTENSION_UUID}.zip" "${EXTENSION_UUID}-review.zip"

# 2. Create a fresh build directory and copy files
echo "Copying all extension files..."
mkdir -p "$BUILD_DIR"
cp -r gnome-extensions/extension/* "$BUILD_DIR/"

# 3. Compile schemas only for the 'package' build
if [ "$TARGET" == "package" ]; then
    if [ -d "$BUILD_DIR/schemas" ]; then
        echo "Compiling GSettings schema for package build..."
        glib-compile-schemas "$BUILD_DIR/schemas/"
        if [ $? -ne 0 ]; then
            echo "Error: Failed to compile schemas. Aborting." >&2
            exit 1
        fi
    else
        echo "No schemas/ directory found. Skipping schema compilation."
    fi
else
    echo "Skipping schema compilation for review build."
fi

# 4. Create the zip archive from the build directory
echo "Creating zip file: $ZIP_FILE..."
(cd "$BUILD_DIR" && zip -r "../$ZIP_FILE" . -x ".*" -x "__MACOSX")

# 5. Clean up the temporary build directory
echo "Cleaning up temporary directory..."
rm -rf "$BUILD_DIR"

# 6. Final success message
echo "Build successful! Archive created at: $ZIP_FILE"