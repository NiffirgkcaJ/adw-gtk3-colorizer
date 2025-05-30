# adw-gtk3 Colorizer GNOME Extension

Synchronize your GTK3 (with adw-gtk3 theme) and certain Adwaita-based GTK4 application accent colors (for named colors) with your chosen system accent color.

This GNOME Shell extension automatically reads your system's accent color setting. It dynamically updates your `~/.config/gtk-3.0/gtk.css` file to apply the color to the **adw-gtk3 theme** for GTK3 applications and, for **named colors only**, updates your `~/.config/gtk-4.0/gtk.css` file to set the `--accent-bg-color` variable for use by the **Adwaita theme** in GTK4 applications.

**Note:** Custom hex colors are only applicable to GTK3 applications.

## Features

* Automatically applies your GNOME system accent color to the **adw-gtk3 theme** for GTK3 applications and, for **named colors only**, sets the accent background color variable for use by the **Adwaita theme** in GTK4 applications.
* Supports predefined GNOME accent colors and custom hex color codes (custom hex colors only apply to GTK3).
* Manages the necessary CSS definitions in `~/.config/gtk-3.0/gtk.css` and `~/.config/gtk-4.0/gtk.css` safely.
* Creates backups (`gtk.css.bak`) for both files before modifying them (if no backup exists).
* Removes the injected CSS blocks and cleans up on extension disable.

## Compatibility

Requires GNOME Shell version 47 and up.

## Installation

### From extensions.gnome.org (Recommended)

The easiest way to install the extension is from the official GNOME Extensions website:

<a href="https://extensions.gnome.org/extension/8084/adw-gtk3-colorizer/">
<img src="https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.svg" alt="Get it on EGO" width="200" />
</a>

Simply visit the page and toggle the installation switch.

### Manual Installation (Using Scripts)

If you prefer to install manually from the source code and use the provided scripts:

1.  Clone the repository anywhere you like:
    ```bash
    git clone https://github.com/NiffirgkcaJ/adw-gtk3-colorizer.git
    cd adw-gtk3-colorizer
    ```
2.  Run the installation script to copy the extension into the correct GNOME Shell directory:
    ```bash
    ./install.sh
    ```
3.  Enable the extension using the GNOME Extensions app, GNOME Tweaks, or the command line:
    ```bash
    gnome-extensions enable adw-gtk3-colorizer@NiffirgkcaJ.github.com
    ```

**Note:** If you are installing manually without using the `./install.sh` script, ensure the cloned directory is named exactly `adw-gtk3-colorizer@NiffirgkcaJ.github.com` and is placed in `~/.local/share/gnome-shell/extensions/`.

## Usage

Once the extension is installed and enabled, it will automatically detect your system's accent color preference and apply it to your adw-gtk3 theme. Changes to the accent color setting should be reflected automatically (you might need to restart affected GTK3 apps).

## Uninstallation

You can uninstall the extension using the GNOME Extensions app or the command line.

### Using the Extensions App (Recommended)

1.  Open the "Extensions" application (or "GNOME Tweaks" / "Tweaks" if you are using an older setup).
2.  Find "adw-gtk3 Colorizer" in the list of installed extensions.
3.  Click the "Uninstall" or "Remove" button next to the extension entry.

### Manual Uninstallation

If you installed manually, you can uninstall using the provided script or standard command-line tools.

* **Using the Uninstall Script:**
    If you installed using the `./install.sh` script, you can often use the corresponding uninstall script from the *cloned repository directory*:
    ```bash
    # Make sure you are in the directory where you cloned the repository
    cd adw-gtk3-colorizer
    ./uninstall.sh
    ```

* **Using GNOME Extensions Command Line:**
    This method works for extensions installed via extensions.gnome.org or enabled manually.
    1. Disable the extension:
        ```bash
        gnome-extensions disable adw-gtk3-colorizer@NiffirgkcaJ.github.com
        ```
    2. Uninstall the extension:
        ```bash
        gnome-extensions uninstall adw-gtk3-colorizer@NiffirgkcaJ.github.com
        ```

* **Manual Directory Removal:**
    If other methods fail or for manual installations without scripts, you can directly delete the extension directory:
    ```bash
    rm -rf ~/.local/share/gnome-shell/extensions/adw-gtk3-colorizer@NiffirgkcaJ.github.com
    ```

**Note:** When the extension is disabled or uninstalled, it automatically removes the CSS block it added to `~/.config/gtk-3.0/gtk.css` and `~/.config/gtk-4.0/gtk.css`, and then attempts to restore from the backup if applicable, ensuring a clean removal.

## Flatpak Compatibility

Flatpak applications are sandboxed and do not have access to user configuration directories like `~/.config/gtk-3.0/` or `~/.config/gtk-4.0/` by default. To allow Flatpak GTK3 (using adw-gtk3) and GTK4 apps to pick up the CSS changes made by this extension, you need to grant them filesystem access to these directories.

You can grant access to the specific directories managed by this extension for all Flatpak applications using the following commands:

```bash
sudo flatpak override --filesystem=xdg-config/gtk-3.0
sudo flatpak override --filesystem=xdg-config/gtk-4.0
```

This command grants full filesystem access to the `~/.config/gtk-3.0/` and `~/.config/gtk-4.0/` directories for all Flatpak applications.

## Credits

Special thanks to **lassekongo83** for creating the excellent **adw-gtk3** theme, which this extension aims to complement.

You can find the `adw-gtk3` project here: [**Github**](https://github.com/lassekongo83/adw-gtk3)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements, bug fixes, or new features.

## License

This project is licensed under the **GPLv3** - see the [LICENSE](LICENSE) file for details.