import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

// Utility function to log detailed errors
function detailedLogError(e, context) {
    let message = `Error during ${context}: ${e.message || e.toString()}`;
    if (e.code) {
        message += ` (Code: ${e.code}, Domain: ${e.domain})`;
    }
    if (e.stack) {
        message += `\nStack: ${e.stack}`;
    }
    // Use log() so it appears in journalctl
    log(message);
}

// Add escape method to RegExp prototype if it doesn't exist
if (typeof RegExp.escape !== 'function') {
    RegExp.escape = function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
}

export default class AccentColorExtension extends Extension {
    enable() {
        try {
            // Get the interface settings for accent color
            this._settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface' });

            // Connect to the 'accent-color' change signal
            this._accentChangedId = this._settings.connect('changed::accent-color', () => {
                const newAccentSetting = this._settings.get_string('accent-color');
                this._updateGtkCss(newAccentSetting);
            });

            // Initialize with the current accent color
            const currentAccentSetting = this._settings.get_string('accent-color');
            this._updateGtkCss(currentAccentSetting);

        } catch (e) {
             detailedLogError(e, 'Extension Enable');
        }
    }

    disable() {
        // Disconnect the settings listener
        if (this._accentChangedId) {
            if (this._settings) {
                 this._settings.disconnect(this._accentChangedId);
            }
            this._accentChangedId = null;
        }
        // Release the settings object
        this._settings = null;

        // Remove the custom CSS block
        try {
            this._removeCustomBlock();
        } catch(e) {
             detailedLogError(e, 'Disable (during _removeCustomBlock call)');
        }
    }

    _updateGtkCss(accentSettingValue) {
        let hexCode = '';
        const defaultHex = '#3584e4'; // Adwaita Blue

        // Determine the hex code based on the setting value
        if (accentSettingValue === '') {
            hexCode = defaultHex;
        } else if (accentSettingValue.startsWith('#')) {
            if (/^#[0-9a-fA-F]{6}$/.test(accentSettingValue)) {
                hexCode = accentSettingValue;
            } else {
                detailedLogError(new Error(`Invalid custom hex color format: ${accentSettingValue}`), 'Color Parsing');
                hexCode = defaultHex; // Fallback
            }
        } else {
            const accentMap = { blue: '#3584e4', teal: '#2190a4', green: '#3a944a', yellow: '#c88800', orange: '#ed5b00', red: '#e62d42', pink: '#d56199', purple: '#9141ac', slate: '#6f8396'};
            hexCode = accentMap[accentSettingValue];
            if (!hexCode) {
                detailedLogError(new Error(`Unknown predefined accent color name: '${accentSettingValue}'`), 'Color Parsing');
                hexCode = defaultHex; // Fallback
            }
        }

        if (!hexCode) {
            detailedLogError(new Error(`Failed to determine a valid hex code`), 'Color Determination Fallback');
            return;
        }

        // Setup paths and file objects
        let cssFilePath, backupFilePath, cssFile, backupFile, cssDirFile;
        try {
            const cssDir = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0']);
            cssFilePath = GLib.build_filenamev([cssDir, 'gtk.css']);
            backupFilePath = cssFilePath + '.bak';

            cssDirFile = Gio.File.new_for_path(cssDir);
            cssFile = Gio.File.new_for_path(cssFilePath);
            backupFile = Gio.File.new_for_path(backupFilePath);

        } catch (e) {
            detailedLogError(e, 'Path/File Object Creation');
            return;
        }

        // Main file operations
        let originalContents = '';
        try {
            // Ensure directory exists
            if (!cssDirFile.query_exists(null)) {
                try {
                    cssDirFile.make_directory_with_parents(null);
                    if (!cssDirFile.query_exists(null)) {
                        throw new Error("Directory creation failed.");
                    }
                } catch (e) {
                    detailedLogError(e, `Directory Creation (${cssDirFile.get_path()})`);
                    return;
                }
            }

            const fileExists = cssFile.query_exists(null);

            if (fileExists) {
                try {
                    originalContents = this._readFile(cssFile);

                    // Create backup if it doesn't exist
                    if (!backupFile.query_exists(null)) {
                        try {
                            cssFile.copy(backupFile, Gio.FileCopyFlags.OVERWRITE, null, null);
                        } catch (e) {
                            detailedLogError(e, `Backup Creation (${backupFilePath})`);
                            // Non-fatal
                        }
                    }
                } catch (e) {
                     detailedLogError(e, `Reading file or handling backup`);
                     return;
                }
            } else {
                 originalContents = '';
            }

            // Define the markers and the new CSS block
            const startMarker = '/* adw-gtk3 Colorizer Extension Start */';
            const endMarker = '/* adw-gtk3 Colorizer Extension End */';
            const newBlock = `${startMarker}\n@define-color accent_bg_color ${hexCode};\n@define-color accent_color @accent_bg_color;\n${endMarker}`;

            // Replace or append the block
            const updatedContents = this._replaceOrAppendBlock(originalContents, startMarker, endMarker, newBlock);

            // Write the updated content to the file
            this._writeFile(cssFile, updatedContents);

        } catch (e) {
            detailedLogError(e, `Main File Operations Block (_updateGtkCss)`);
        }
    }

    // Remove the custom accent block from gtk.css
     _removeCustomBlock() {
        let cssFilePath, cssFile, backupFile;
        try {
            const cssDir = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0']);
            cssFilePath = GLib.build_filenamev([cssDir, 'gtk.css']);
            cssFile = Gio.File.new_for_path(cssFilePath);
            backupFile = Gio.File.new_for_path(cssFilePath + '.bak');
        } catch (e) {
            detailedLogError(e, 'Path/File Object Creation in _removeCustomBlock');
            return;
        }

        // Check if gtk.css exists
        if (!cssFile.query_exists(null)) {
            // Clean up potential orphaned backup file
            if (backupFile.query_exists(null)) {
                try {
                    backupFile.delete(null);
                } catch (e) {
                    detailedLogError(e, `Deleting orphaned backup file ${backupFile.get_path()}`);
                }
            }
            return;
        }

        try {
            // Read file content
            let contents = this._readFile(cssFile);

            const startMarker = '/* adw-gtk3 Colorizer Extension Start */';
            const endMarker = '/* adw-gtk3 Colorizer Extension End */';

            // Regex to find the block including surrounding whitespace
            const regex = new RegExp(
                '\\s*' + RegExp.escape(startMarker) + '[\\s\\S]*?' + RegExp.escape(endMarker) + '\\s*',
                'gs'
            );

            // If the block is not found, do nothing
            if (!regex.test(contents)) {
                 return;
            }

            // Remove the block
            const updatedContents = contents.replace(regex, '');

            // Trim any leading/trailing whitespace from the result
            const cleanedContents = updatedContents.trim();

            // If the file is empty after removal, handle backup or write empty
            if (cleanedContents === '') {
                if (backupFile.query_exists(null)) {
                    try {
                        backupFile.copy(cssFile, Gio.FileCopyFlags.OVERWRITE, null, null);
                        backupFile.delete(null);
                    } catch (e) {
                        detailedLogError(e, `Restoring from backup or deleting backup ${backupFile.get_path()}`);
                        // Fallback to writing empty content
                        this._writeFile(cssFile, '');
                    }
                } else {
                    // Write the truly empty string
                    this._writeFile(cssFile, cleanedContents);
                }
            } else {
                // Write the trimmed content
                this._writeFile(cssFile, cleanedContents);
            }

        } catch (e) {
            detailedLogError(e, 'Custom Block Removal / Restore Process');
            // Attempt to restore from backup if an error occurred
            if (backupFile.query_exists(null)) {
                 try {
                    backupFile.copy(cssFile, Gio.FileCopyFlags.OVERWRITE, null, null);
                    backupFile.delete(null);
                 } catch (restoreError) {
                     detailedLogError(restoreError, `Restoring backup after error in _removeCustomBlock`);
                 }
            }
        }
    }

    // Helper to read file content using GLib
    _readFile(file) {
        const filePath = file.get_path();
        try {
            const [success, contentsBytes] = GLib.file_get_contents(filePath);

            if (!success) {
                throw new Error(`GLib.file_get_contents failed for ${filePath}.`);
            }

            if (!contentsBytes || contentsBytes.length === 0) {
                return '';
            }

            const decoder = new TextDecoder('utf-8');
            const contentsString = decoder.decode(contentsBytes);
            return contentsString;

        } catch (e) {
            detailedLogError(e, `Reading File via GLib (${filePath})`);
            throw e;
        }
    }

    // Helper to write file content using Gio for atomic replace
    _writeFile(file, contents) {
        const filePath = file.get_path();
        try {
            // Use replace_contents for atomic write
            const bytes = new TextEncoder().encode(contents);

            const [writeSuccess, newEtag] = file.replace_contents(
                bytes,
                null,
                false,
                Gio.FileCreateFlags.REPLACE_DESTINATION,
                null
             );

             if (!writeSuccess) {
                 throw new Error(`GIO replace_contents reported failure for ${filePath}`);
             }

        } catch(e) {
             detailedLogError(e, `Writing File (${filePath})`);
             throw e;
         }
    }

    // Helper to replace existing block or append if not found
    _replaceOrAppendBlock(contents, startMarker, endMarker, newBlock) {
        const regex = new RegExp(
            RegExp.escape(startMarker) + '[\\s\\S]*?' + RegExp.escape(endMarker),
            'gs'
        );

        let testResult = false;
        try {
            if (typeof contents === 'string') {
                testResult = regex.test(contents);
            }
        } catch(e) {
            detailedLogError(e, 'Regex test in _replaceOrAppendBlock');
            testResult = false;
        }

        if (testResult) {
            try {
                if (typeof contents !== 'string') {
                     throw new Error("Cannot replace in non-string content.");
                }
                return contents.replace(regex, newBlock);
            } catch (e) {
                 detailedLogError(e, 'String replace in _replaceOrAppendBlock');
                 // Fallback to appending
            }
        }

        // Append logic
        const baseContent = (typeof contents === 'string') ? contents.trimEnd() : '';

        if (baseContent === '') {
            // Ensure the new block ends with a newline
            return newBlock.endsWith('\n') ? newBlock : newBlock + '\n';
        } else {
             // Add two newlines for separation
             const separator = '\n\n';
             return baseContent + separator + newBlock + '\n'; // Ensure final newline
        }
    }
}