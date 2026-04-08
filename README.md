# adw-gtk3 Colorizer GNOME Extension

Automatically synchronize your **GTK3** (with adw-gtk3 theme) and certain **Adwaita-based GTK4** application accent colors (for named colors) with your chosen **GNOME Accent Color**.

This GNOME Shell extension automatically reads your system's accent color setting. It dynamically updates your `~/.config/gtk-3.0/gtk.css` file to apply the color to the **adw-gtk3 theme** for GTK3 applications and, for **named colors only**, updates your `~/.config/gtk-4.0/gtk.css` file to set the `--accent-bg-color` variable for use by the **Adwaita theme** in GTK4 applications.

**Note:** Custom hex colors are only applicable to GTK3 applications.

## Features

*   **Auto-Sync:**
    *   Automatically applies your GNOME system accent color.
    *   Supports predefined GNOME accent colors and custom hex color codes.
*   **Adwaita & GTK3 Support:**
    *   Targets the **adw-gtk3 theme** for GTK3 applications.
    *   Sets the `--accent-bg-color` variable for the **Adwaita theme** in GTK4 applications (named colors only).
*   **Safe CSS Management:**
    *   Manages the necessary CSS definitions in `~/.config/gtk-3.0/gtk.css` and `~/.config/gtk-4.0/gtk.css` safely.
    *   Creates backups (`gtk.css.bak`) for both files before modifying them (if no backup exists).
*   **Auto-Cleanup:**
    *   Automatically removes the injected CSS blocks and restores from backups on extension disable.

## Compatibility

Requires GNOME Shell version 47 and up.

## Flatpak Compatibility

Flatpak applications are sandboxed and do not have access to user configuration directories like `~/.config/gtk-3.0/` or `~/.config/gtk-4.0/` by default. To allow Flatpak GTK3 (using adw-gtk3) and GTK4 apps to pick up the CSS changes made by this extension, you need to grant them filesystem access to these directories.

Run the following commands to grant filesystem access to all Flatpak applications:

```bash
sudo flatpak override --filesystem=xdg-config/gtk-3.0
sudo flatpak override --filesystem=xdg-config/gtk-4.0
```

## Installation

### From extensions.gnome.org (Recommended)

The easiest way to install is from the official GNOME Extensions website.

<a href="https://extensions.gnome.org/extension/8084/adw-gtk3-colorizer/">
<img src="https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.svg" alt="Get it on EGO" width="200" />
</a>

### Installing from a ZIP File

1.  **Download the ZIP:** Go to the [Releases](https://github.com/NiffirgkcaJ/adw-gtk3-colorizer/releases) page and download the latest `adw-gtk3-colorizer@NiffirgkcaJ.github.com.zip` file.

2.  **Unzip the File:** Extract the contents of the zip file. This will create a folder with the extension's files inside (like `extension.js`, `metadata.json`, etc.).

3.  **Find the Destination Folder:** The extension needs to be placed in your local extensions directory. You can open it in your file manager or create it if it doesn't exist with this command:
    ```bash
    mkdir -p ~/.local/share/gnome-shell/extensions/
    ```

4.  **Move and Rename:** Move the unzipped folder into the extensions directory and **rename the folder to match the extension's UUID**. This step is crucial. The UUID is: `adw-gtk3-colorizer@NiffirgkcaJ.github.com`.

    For example, if you unzipped the files into a folder named `adw-gtk3-colorizer`, you would run:
    ```bash
    mv adw-gtk3-colorizer ~/.local/share/gnome-shell/extensions/adw-gtk3-colorizer@NiffirgkcaJ.github.com
    ```

5.  **Restart GNOME Shell:**
    *   On **X11**, press `Alt` + `F2`, type `r` into the dialog, and press `Enter`.
    *   On **Wayland**, you must log out and log back in.

6.  **Enable the Extension:** Open the **Extensions** app (or GNOME Tweaks) and enable "adw-gtk3 Colorizer". You can also do this from the command line:
    ```bash
    gnome-extensions enable adw-gtk3-colorizer@NiffirgkcaJ.github.com
    ```

### Install from Source (for Developers)

1.  Clone the repository:
    ```bash
    git clone https://github.com/NiffirgkcaJ/adw-gtk3-colorizer.git
    cd adw-gtk3-colorizer
    ```
2.  Run the installation script:
    ```bash
    ./install.sh
    ```
3.  Restart GNOME Shell (press `Alt` + `F2`, type `r`, and press `Enter`) or log out and back in.
4.  Enable the extension using the Extensions app or the command line:
    ```bash
    gnome-extensions enable adw-gtk3-colorizer@NiffirgkcaJ.github.com
    ```

## Usage

*   **Requirements:** Ensure the **adw-gtk3** theme is installed on your system.
*   **Enable Extension:** Once installed and enabled, it will automatically detect your system's accent color preference.
*   **Change Accent:** Open **Settings** -> **Appearance** (or **Style** depending on your distro) and change the **Accent Color**. Your GTK3 apps will update automatically (you might need to restart affected apps).

## Uninstallation

*   **Using the Extensions App (Recommended):**
    Open the "Extensions" application, find "adw-gtk3 Colorizer", and click the "Uninstall" button.

*   **Using the Script:**
    If you installed from source, navigate to the cloned repository directory and run:
    ```bash
    ./uninstall.sh
    ```

## Credits

Special thanks to **lassekongo83** for creating the excellent **adw-gtk3** theme, which this extension aims to complement.

You can find the `adw-gtk3` project here: [**Github**](https://github.com/lassekongo83/adw-gtk3)

## Contributing

Contributions are welcome! Please feel free to open an issue to report a bug or suggest a feature, or submit a pull request with your improvements.

## License

This project is licensed under the **GPLv3** - see the [LICENSE](LICENSE) file for details.