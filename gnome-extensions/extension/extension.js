import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const GTK3_DIR_PATH = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0']);
const GTK3_CSS_PATH = GLib.build_filenamev([GTK3_DIR_PATH, 'gtk.css']);
const GTK3_BACKUP_PATH = GTK3_CSS_PATH + '.bak';

const GTK4_DIR_PATH = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-4.0']);
const GTK4_CSS_PATH = GLib.build_filenamev([GTK4_DIR_PATH, 'gtk.css']);
const GTK4_BACKUP_PATH = GTK4_CSS_PATH + '.bak';

// Markers for the CSS block managed by this extension
const START_MARKER = '/* adw-gtk3 Colorizer Extension Start */';
const END_MARKER = '/* adw-gtk3 Colorizer Extension End */';

const KNOWN_ACCENT_NAMES = ['blue', 'teal', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'slate'];
const ACCENT_MAP = { blue: '#3584e4', teal: '#2190a4', green: '#3a944a', yellow: '#c88800', orange: '#ed5b00', red: '#e62d42', pink: '#d56199', purple: '#9141ac', slate: '#6f8396'};
const DEFAULT_HEX = '#3584e4'; // Default Adwaita Blue

// Log detailed errors
function detailedLogError(e, context, uuid) {
    const id = uuid || 'adw-gtk3-colorizer@NiffirgkcaJ.github.com';
    let message = `[${id}] Error during ${context}: ${e.message || e.toString()}`;
    if (e.code) {
        message += ` (Code: ${e.code}, Domain: ${e.domain})`;
    }
    if (e.stack) {
        message += `\nStack: ${e.stack}`;
    }
    console.error(message);
}

// Polyfill for RegExp.escape
if (typeof RegExp.escape !== 'function') {
    RegExp.escape = function(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
}

export default class AccentColorExtension extends Extension {
    // Track backups created *this session* to safely clean them up on disable
    _backupsCreatedThisSession = { gtk3: false, gtk4: false };
    _settings = null;
    _accentChangedId = null;

    enable() {
        console.log(`[${this.uuid}] Enabling extension...`);
        this._backupsCreatedThisSession = { gtk3: false, gtk4: false };

        try {
            this._settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.interface' });

            // Listen for accent color changes
            this._accentChangedId = this._settings.connect('changed::accent-color', () => {
                console.log(`[${this.uuid}] Accent color setting changed, updating CSS...`);
                this._triggerUpdate();
            });

            this._triggerUpdate(); // Apply CSS on initial enable
        } catch (e) {
            detailedLogError(e, 'Extension Enable', this.uuid);
        }
    }

    disable() {
        console.log(`[${this.uuid}] Disabling extension...`);
        if (this._accentChangedId && this._settings) {
            try {
                this._settings.disconnect(this._accentChangedId);
                console.log(`[${this.uuid}] Disconnected settings listener.`);
            } catch (e) {
                detailedLogError(e, 'Disconnecting settings listener', this.uuid);
            }
        }
        this._accentChangedId = null;
        this._settings = null;

        // Remove the CSS blocks from both GTK versions
        try {
            this._removeCssBlock(GTK3_CSS_PATH, GTK3_BACKUP_PATH, 'gtk3');
        } catch(e) {
            detailedLogError(e, 'Disable (during GTK3 _removeCssBlock)', this.uuid);
        }
        try {
            this._removeCssBlock(GTK4_CSS_PATH, GTK4_BACKUP_PATH, 'gtk4');
        } catch(e) {
            detailedLogError(e, 'Disable (during GTK4 _removeCssBlock)', this.uuid);
        }
        console.log(`[${this.uuid}] Disable complete.`);
    }

    // Get current accent setting and trigger update
    _triggerUpdate() {
        if (!this._settings) {
            console.warn(`[${this.uuid}] Settings object not available. Skipping update.`);
            return;
        }
        try {
            const currentAccentSetting = this._settings.get_string('accent-color');
            this._updateCssFiles(currentAccentSetting);
        } catch (e) {
            detailedLogError(e, 'Getting accent setting in _triggerUpdate', this.uuid);
        }
    }

    // Determine CSS content and apply to GTK3/GTK4
    _updateCssFiles(accentSettingValue) {
        let hexCode = DEFAULT_HEX;
        let isNamedColor = false;
        let colorName = 'blue';

        // Determine hex code and if it's a known named color
        if (accentSettingValue === '') {
            hexCode = DEFAULT_HEX;
            isNamedColor = true;
        } else if (accentSettingValue.startsWith('#')) {
            if (/^#[0-9a-fA-F]{6}$/.test(accentSettingValue)) {
                hexCode = accentSettingValue;
                isNamedColor = false;
            } else {
                detailedLogError(new Error(`Invalid custom hex color format: ${accentSettingValue}`), 'Color Parsing', this.uuid);
                hexCode = DEFAULT_HEX; // Fallback
                isNamedColor = true; // Treat fallback as 'blue'
            }
        } else {
            hexCode = ACCENT_MAP[accentSettingValue];
            if (hexCode && KNOWN_ACCENT_NAMES.includes(accentSettingValue)) {
                isNamedColor = true;
                colorName = accentSettingValue;
            } else {
                detailedLogError(new Error(`Unknown or unsupported predefined accent color name: '${accentSettingValue}'`), 'Color Parsing', this.uuid);
                hexCode = DEFAULT_HEX; // Fallback
                isNamedColor = true; // Treat fallback as 'blue'
            }
        }

        // GTK3 needs explicit hex
        const gtk3CssContent = `@define-color accent_bg_color ${hexCode};\n@define-color accent_color @accent_bg_color;`;

        // Apply/Remove for GTK3
        try {
            console.log(`[${this.uuid}] Processing GTK3 CSS...`);
            this._applyCssBlock(GTK3_CSS_PATH, GTK3_BACKUP_PATH, GTK3_DIR_PATH, gtk3CssContent, 'gtk3');
        } catch (e) {
            console.warn(`[${this.uuid}] Failed to process GTK3 CSS.`);
        }

        // Apply/Remove for GTK4
        try {
            console.log(`[${this.uuid}] Processing GTK4 CSS...`);
            if (isNamedColor) {
                // Use GTK4's built-in variable for named colors
                const gtk4CssContent = `:root {\n  --accent-bg-color: var(--accent-${colorName});\n}`;
                this._applyCssBlock(GTK4_CSS_PATH, GTK4_BACKUP_PATH, GTK4_DIR_PATH, gtk4CssContent, 'gtk4');
            } else {
                // Don't override GTK4 with custom hex
                console.log(`[${this.uuid}] Accent color is custom hex. Removing GTK4 block if present.`);
                this._removeCssBlock(GTK4_CSS_PATH, GTK4_BACKUP_PATH, 'gtk4');
            }
        } catch (e) {
            console.warn(`[${this.uuid}] Failed to process GTK4 CSS.`);
        }
    }

    // Apply/Update CSS block in a file
    _applyCssBlock(cssFilePath, backupFilePath, dirPath, cssBlockContent, backupFlagKey) {
        const uuid = this.uuid;
        let cssFile, backupFile, cssDirFile;

        try {
            cssDirFile = Gio.File.new_for_path(dirPath);
            cssFile = Gio.File.new_for_path(cssFilePath);
            backupFile = Gio.File.new_for_path(backupFilePath);
        } catch (e) {
            detailedLogError(e, `File Object Creation in _applyCssBlock (${cssFilePath})`, uuid);
            throw e;
        }

        let originalContents = '';
        try {
            // Ensure target directory exists
            if (!cssDirFile.query_exists(null)) {
                console.log(`[${uuid}] Creating directory ${dirPath}...`);
                cssDirFile.make_directory_with_parents(null);
            }

            const fileExists = cssFile.query_exists(null);
            const backupExists = backupFile.query_exists(null);

            if (fileExists) {
                originalContents = this._readFile(cssFile);
                // Create backup only if file exists and backup doesn't
                if (!backupExists) {
                    console.log(`[${uuid}] Creating backup for ${cssFilePath}`);
                    try {
                        cssFile.copy(backupFile, Gio.FileCopyFlags.NONE, null, null);
                        this._backupsCreatedThisSession[backupFlagKey] = true; // Mark OUR backup
                    } catch (e) {
                        detailedLogError(e, `Backup Creation Failed (${backupFilePath}) - Proceeding.`, uuid);
                        this._backupsCreatedThisSession[backupFlagKey] = false;
                    }
                } else {
                    console.log(`[${uuid}] Backup file already exists: ${backupFilePath}`);
                }
            } else {
                originalContents = '';
                this._backupsCreatedThisSession[backupFlagKey] = false;
            }

            const newBlockWithMarkers = `${START_MARKER}\n${cssBlockContent}\n${END_MARKER}\n`;
            const updatedContents = this._replaceOrAppendBlock(originalContents, START_MARKER, END_MARKER, newBlockWithMarkers);

            // Write back atomically
            this._writeFile(cssFile, updatedContents);
            console.log(`[${uuid}] Successfully updated ${cssFilePath}`);
        } catch (e) {
            throw e;
        }
    }

    // Remove CSS block and cleanup backup if created this session
    _removeCssBlock(cssFilePath, backupFilePath, backupFlagKey) {
        const uuid = this.uuid;
        let cssFile, backupFile;

        try {
            cssFile = Gio.File.new_for_path(cssFilePath);
            backupFile = Gio.File.new_for_path(backupFilePath);
        } catch (e) {
            detailedLogError(e, `File Object Creation in _removeCssBlock (${cssFilePath})`, uuid);
            throw e;
        }

        let cssExists = false;
        let bakExists = false;
        try {
            cssExists = cssFile.query_exists(null);
            bakExists = backupFile.query_exists(null);
        } catch (qerr) {
            detailedLogError(qerr, `Error querying file existence for ${cssFilePath}`, uuid);
            cssExists = true; // Assume exists to attempt cleanup
            bakExists = true;
        }

        const backupCreatedThisSession = this._backupsCreatedThisSession[backupFlagKey];

        if (!cssExists) {
            console.log(`[${uuid}] CSS file not found: ${cssFilePath}.`);
            // Clean up orphaned backup if WE created it
            if (bakExists && backupCreatedThisSession) {
                console.log(`[${uuid}] Found session backup for missing CSS file. Deleting backup.`);
                try { backupFile.delete(null); } catch (e) { detailedLogError(e, `Failed to remove orphaned session backup ${backupFilePath}`, uuid); }
            } else if (bakExists) {
                console.log(`[${uuid}] Found backup, but not from this session. Leaving: ${backupFilePath}`);
            }
            return;
        }

        let successfullyCleaned = false;
        try {
            let contents = this._readFile(cssFile);
            const startIndex = contents.indexOf(START_MARKER);
            const endIndex = contents.indexOf(END_MARKER);
            const blockFound = startIndex !== -1 && endIndex !== -1 && endIndex > startIndex;

            if (blockFound) {
                console.log(`[${uuid}] Found block in ${cssFilePath}. Removing...`);
                const before = contents.substring(0, startIndex);
                const after = contents.substring(endIndex + END_MARKER.length);
                const finalContents = (before + after).trim();

                if (finalContents === '') {
                    console.log(`[${uuid}] CSS file is empty after removing block. Deleting file.`);
                    try { cssFile.delete(null); successfullyCleaned = true; } catch (e) { detailedLogError(e, `Failed to delete empty CSS file ${cssFilePath}`, uuid); }
                } else {
                    console.log(`[${uuid}] Writing cleaned content back.`);
                    try { this._writeFile(cssFile, finalContents + '\n'); successfullyCleaned = true; } catch (e) { detailedLogError(e, `Failed to write cleaned content to ${cssFilePath}`, uuid); }
                }
            } else {
                console.log(`[${uuid}] Block markers not found in ${cssFilePath}. No removal needed.`);
            }

            // Delete backup ONLY if cleanup succeeded AND backup was created this session
            if (successfullyCleaned && bakExists && backupCreatedThisSession) {
                console.log(`[${uuid}] Cleanup successful. Deleting session backup: ${backupFilePath}`);
                try { backupFile.delete(null); } catch (e) { detailedLogError(e, `Failed to remove session backup ${backupFilePath}`, uuid); }
            } else if (successfullyCleaned && bakExists && !backupCreatedThisSession) {
                console.log(`[${uuid}] Cleanup successful. Leaving pre-existing backup: ${backupFilePath}`);
            }
        } catch (e) {
            throw e;
        }
    }

    // Read file contents using GLib
    _readFile(file) {
        const filePath = file.get_path();
        try {
            const [success, contentsBytes] = GLib.file_get_contents(filePath);
            if (!success) throw new Error(`GLib.file_get_contents failed for ${filePath}.`);
            if (!contentsBytes || contentsBytes.length === 0) return '';
            return new TextDecoder('utf-8', { fatal: false }).decode(contentsBytes);
        } catch (e) {
            throw e;
        }
    }

    // Write file contents atomically using GIO
    _writeFile(file, contents) {
        const filePath = file.get_path();
        try {
            if (typeof contents !== 'string') throw new Error(`_writeFile expects a string, received ${typeof contents}`);
            const bytes = new TextEncoder().encode(contents);
            const [writeSuccess, newEtag] = file.replace_contents(
                bytes, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null
            );
            if (!writeSuccess) throw new Error(`GIO replace_contents reported failure for ${filePath}.`);
        } catch(e) {
            throw e;
        }
    }

    // Replace block or append if not found
    _replaceOrAppendBlock(contents, startMarker, endMarker, newBlockWithMarkers) {
        const currentContent = (typeof contents === 'string') ? contents : '';

        // Regex to find the entire block
        const selfBlockRegex = new RegExp(
            '(^|\\n)[\\s\\t]*' + RegExp.escape(startMarker) + '\\n' +
            '[\\s\\S]*?' +
            '\\n' + RegExp.escape(endMarker) +
            '[\\s\\t]*(\\n|$)',
            'g'
        );

        let blockExists = false;
        try {
            selfBlockRegex.lastIndex = 0;
            blockExists = selfBlockRegex.test(currentContent);
        } catch(e) {
            detailedLogError(e, 'Regex test failed in _replaceOrAppendBlock', this.uuid);
            blockExists = false;
        }

        if (blockExists) {
            try {
                selfBlockRegex.lastIndex = 0;
                // Replace, preserving leading newline if present
                return currentContent.replace(selfBlockRegex, (match, p1) => (p1 === '\n' ? '\n' : '') + newBlockWithMarkers);
            } catch (e) {
                detailedLogError(e, 'String replace failed in _replaceOrAppendBlock', this.uuid);
                return currentContent; // Fallback
            }
        } else {
            const baseContent = currentContent.trimEnd();
            if (baseContent === '') return newBlockWithMarkers; // File was empty
            return baseContent + '\n\n' + newBlockWithMarkers; // Append with separation
        }
    }
}