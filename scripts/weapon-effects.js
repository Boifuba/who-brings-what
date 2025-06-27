// Import weapon names configuration
import { WEAPON_INITIAL_NAMES } from '../config/weapon-names.js';

// Function to load default images from the module's images folder
async function loadModuleImages(forceReset = false) {
    try {
        console.log("Who Brings What?: Attempting to load module images...");
        
        const module = game.modules.get("who-brings-what");
        if (!module) {
            console.error("Who Brings What?: Module not found!");
            return {};
        }
        
        console.log("Who Brings What?: Module found, path:", module.path);
        
        // Get existing settings to preserve custom names and enabled states
        // BUT if forceReset is true, ignore existing settings completely
        let existingSettings = {};
        if (!forceReset) {
            existingSettings = game.settings.get("who-brings-what", "weaponImages") || {};
            console.log("Who Brings What?: Existing settings:", existingSettings);
        } else {
            console.log("Who Brings What?: Force reset - ignoring existing settings");
        }
        
        // Try different possible paths
        const possiblePaths = [
            `modules/who-brings-what/images`,
            `${module.path}/images`,
            `modules/${module.id}/images`
        ];
        
        let weaponImages = {};
        let foundImages = false;
        
        for (const imagesPath of possiblePaths) {
            try {
                console.log(`Who Brings What?: Trying to load from: ${imagesPath}`);
                
                // Browse the images folder
                const browseResult = await FilePicker.browse("data", imagesPath);
                
                if (browseResult && browseResult.files && browseResult.files.length > 0) {
                    console.log(`Who Brings What?: Found ${browseResult.files.length} files in ${imagesPath}`);
                    
                    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
                    
                    for (const filePath of browseResult.files) {
                        const fileName = filePath.split('/').pop();
                        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
                        
                        // Check if it's an image file
                        if (imageExtensions.includes(fileExtension)) {
                            // CRITICAL: USE THE FULL FILE PATH AS THE KEY - THIS NEVER CHANGES!
                            const key = filePath; // The file path IS the permanent key
                            
                            // Check if we have existing settings for this exact file path (only if not forcing reset)
                            const existingImage = !forceReset ? existingSettings[key] : null;
                            
                            // Determine display name priority:
                            // 1. Existing custom name (user already customized) - ONLY if not forcing reset
                            // 2. Configured name from weapon-names.js
                            // 3. Auto-generated from filename
                            let displayName;
                            if (!forceReset && existingImage && existingImage.name) {
                                displayName = existingImage.name; // Preserve user's custom name
                                console.log(`Who Brings What?: Preserving user custom name for ${fileName}: ${displayName}`);
                            } else if (WEAPON_INITIAL_NAMES[fileName]) {
                                displayName = WEAPON_INITIAL_NAMES[fileName]; // Use configured name
                                console.log(`Who Brings What?: Using configured name for ${fileName}: ${displayName}`);
                            } else {
                                // Create default display name from filename
                                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                                displayName = nameWithoutExt.split(/[-_\s]+/).map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ');
                                console.log(`Who Brings What?: Using auto-generated name for ${fileName}: ${displayName}`);
                            }
                            
                            // Use existing enabled state if available (and not forcing reset), otherwise default to true
                            const enabled = (!forceReset && existingImage) ? existingImage.enabled : true;
                            
                            // CRITICAL: Key is the file path, URL is always the same as the key
                            weaponImages[key] = {
                                name: displayName,        // Can be changed by user
                                url: filePath,           // ALWAYS the actual file path - NEVER changes
                                enabled: enabled,
                                fileName: fileName       // Store original filename for reference
                            };
                            
                            foundImages = true;
                            console.log(`Who Brings What?: Image loaded - File: ${fileName}, Name: ${displayName}, Path: ${filePath}`);
                        }
                    }
                    
                    if (foundImages) {
                        console.log(`Who Brings What?: Success! Loaded ${Object.keys(weaponImages).length} images from ${imagesPath}`);
                        break; // Stop at first working path
                    }
                }
            } catch (pathError) {
                console.log(`Who Brings What?: Path ${imagesPath} not found or inaccessible:`, pathError.message);
                continue;
            }
        }
        
        if (!foundImages) {
            console.warn("Who Brings What?: No images found in any tested paths");
            console.warn("Who Brings What?: Make sure there's an 'images' folder inside the module with image files");
            
            // Create some example images as fallback
            weaponImages = {
                'icons/weapons/swords/sword-broad-steel.webp': {
                    name: 'Example Sword',
                    url: 'icons/weapons/swords/sword-broad-steel.webp',
                    enabled: true,
                    fileName: 'sword-broad-steel.webp'
                },
                'icons/weapons/bows/bow-recurve-brown.webp': {
                    name: 'Example Bow',
                    url: 'icons/weapons/bows/bow-recurve-brown.webp',
                    enabled: true,
                    fileName: 'bow-recurve-brown.webp'
                },
                'icons/weapons/axes/axe-battle-worn.webp': {
                    name: 'Example Axe',
                    url: 'icons/weapons/axes/axe-battle-worn.webp',
                    enabled: true,
                    fileName: 'axe-battle-worn.webp'
                }
            };
            console.log("Who Brings What?: Using Foundry example images");
        }
        
        console.log("Who Brings What?: Final result:", weaponImages);
        return weaponImages;
        
    } catch (error) {
        console.error("Who Brings What?: Critical error loading images:", error);
        
        // Fallback with default Foundry images
        return {
            'icons/weapons/swords/sword-broad-steel.webp': {
                name: 'Sword',
                url: 'icons/weapons/swords/sword-broad-steel.webp',
                enabled: true,
                fileName: 'sword-broad-steel.webp'
            },
            'icons/weapons/bows/bow-recurve-brown.webp': {
                name: 'Bow',
                url: 'icons/weapons/bows/bow-recurve-brown.webp',
                enabled: true,
                fileName: 'bow-recurve-brown.webp'
            }
        };
    }
}

// Global variable to store the current dialog instance
let currentWeaponDialog = null;

Hooks.once('init', async function() {
    console.log("Who Brings What?: Initializing module...");
    
    // Register module settings with empty default - images will be loaded in 'ready' hook
    game.settings.register("who-brings-what", "weaponImages", {
        name: "Weapon Images",
        hint: "Manage weapon images for the module",
        scope: "world",
        config: false, // We'll handle this with our custom interface
        type: Object,
        default: {}, // Start with empty object - will be populated in 'ready' hook
        onChange: settings => {
            console.log("Who Brings What?: Image settings changed:", settings);
            // Refresh the dialog if it's open
            if (currentWeaponDialog && currentWeaponDialog.rendered) {
                console.log("Who Brings What?: Refreshing open dialog due to settings change");
                currentWeaponDialog.close();
                // Re-open the dialog with updated data
                setTimeout(() => {
                    window.WhoBringsWhat.showDialog();
                }, 100);
            }
        }
    });

    // Register a menu for managing images
    game.settings.registerMenu("who-brings-what", "manageImages", {
        name: "Manage Weapon Images",
        label: "Open Manager",
        hint: "Add, remove and configure weapon images",
        icon: "fas fa-cogs",
        type: WeaponImageManager,
        restricted: true
    });
    
    console.log("Who Brings What?: Module initialized successfully!");
});

class WeaponImageManager extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "weapon-image-manager",
            title: "Weapon Image Manager - Who Brings What?",
            template: "modules/who-brings-what/templates/image-manager.html",
            width: 600,
            height: 800,
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: false
        });
    }

    getData() {
        const weaponImages = game.settings.get("who-brings-what", "weaponImages");
        console.log("Who Brings What?: Manager data:", weaponImages);
        
        return {
            images: Object.entries(weaponImages).map(([key, data]) => ({
                key,
                name: data.name,
                url: data.url,
                enabled: data.enabled,
                fileName: data.fileName || key.split('/').pop()
            }))
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add image button
        html.find('#add-image').click(this._onAddImage.bind(this));
        
        // Delete image buttons
        html.find('.delete-image').click(this._onDeleteImage.bind(this));
        
        // Toggle enabled checkboxes
        html.find('.toggle-enabled').change(this._onToggleEnabled.bind(this));
        
        // Reset images button
        html.find('#reset-images').click(this._onResetImages.bind(this));
        
        // Save button
        html.find('#save-settings').click(this._onSave.bind(this));
    }

    async _onAddImage(event) {
        event.preventDefault();
        
        const fp = new FilePicker({
            type: "image",
            callback: async (path) => {
                const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
                
                // Use the full path as the key (this never changes)
                const key = path;
                const fileName = path.split('/').pop();
                
                // Check if image already exists
                if (weaponImages[key]) {
                    ui.notifications.warn(`Image "${fileName}" is already added!`);
                    return;
                }
                
                // Create display name from filename
                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                const displayName = nameWithoutExt.split(/[-_\s]+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                weaponImages[key] = {
                    name: displayName,
                    url: path,
                    enabled: true,
                    fileName: fileName
                };
                
                await game.settings.set("who-brings-what", "weaponImages", weaponImages);
                this.render();
                ui.notifications.info(`Image "${displayName}" added successfully!`);
            }
        });
        
        fp.render(true);
    }

    async _onDeleteImage(event) {
        event.preventDefault();
        const key = event.currentTarget.dataset.key;
        const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
        
        const imageName = weaponImages[key]?.name || key;
        
        const confirmed = await Dialog.confirm({
            title: "Confirm Deletion",
            content: `<p>Are you sure you want to delete the image "<strong>${imageName}</strong>"?</p>`,
            yes: () => true,
            no: () => false
        });
        
        if (confirmed) {
            delete weaponImages[key];
            await game.settings.set("who-brings-what", "weaponImages", weaponImages);
            this.render();
            ui.notifications.info(`Image "${imageName}" removed successfully!`);
        }
    }

    async _onToggleEnabled(event) {
        const key = event.currentTarget.dataset.key;
        const enabled = event.currentTarget.checked;
        const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
        
        if (weaponImages[key]) {
            weaponImages[key].enabled = enabled;
            await game.settings.set("who-brings-what", "weaponImages", weaponImages);
        }
    }

    async _onResetImages(event) {
        event.preventDefault();
        
        const confirmed = await Dialog.confirm({
            title: "Reset Default Images",
            content: `<p>Are you sure you want to reset to the module's default images?</p>
                     <p><strong>Warning:</strong> This will remove all custom images and names you've added!</p>
                     <p><strong>Note:</strong> Names will be restored from config/weapon-names.js or auto-generated from filenames.</p>`,
            yes: () => true,
            no: () => false
        });
        
        if (confirmed) {
            console.log("Who Brings What?: Resetting to default images with force reset...");
            // CRITICAL: Pass forceReset=true to ignore existing settings completely
            const defaultImages = await loadModuleImages(true);
            await game.settings.set("who-brings-what", "weaponImages", defaultImages);
            this.render();
            ui.notifications.info("Images reset to module defaults! Names restored from configuration.");
        }
    }

    async _onSave(event) {
        event.preventDefault();
        
        // Get all image name inputs and update the settings
        const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
        const nameInputs = this.element.find('.image-name-input');
        
        nameInputs.each((index, input) => {
            const key = input.dataset.key;
            const newName = input.value.trim();
            
            if (weaponImages[key] && newName) {
                weaponImages[key].name = newName;
                console.log(`Who Brings What?: Updating name for ${key}: ${newName}`);
            }
        });
        
        await game.settings.set("who-brings-what", "weaponImages", weaponImages);
        ui.notifications.info("Settings saved!");
        this.close();
    }
}

// Effect Manager Dialog Class
class EffectManager extends FormApplication {
    constructor(actor) {
        super();
        this.actor = actor;
    }

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "effect-manager",
            title: "Weapon Effect Manager",
            template: "modules/who-brings-what/templates/effect-manager.html",
            width: 500,
            height: 400,
            resizable: true,
            closeOnSubmit: false,
            submitOnChange: false
        });
    }

    getData() {
        const weaponEffects = this.actor.effects.contents.filter(e => 
            e.statuses && Array.from(e.statuses).some(s => s.startsWith("wbb-weapon-"))
        );
        
        return {
            actorName: this.actor.name,
            effects: weaponEffects.map(effect => ({
                id: effect.id,
                label: effect.label || effect.name,
                icon: effect.icon
            }))
        };
    }

    activateListeners(html) {
        super.activateListeners(html);
        
        // Delete effect buttons
        html.find('.delete-effect').click(this._onDeleteEffect.bind(this));
        
        // Close button
        html.find('#close-manager').click(() => this.close());
    }

    async _onDeleteEffect(event) {
        event.preventDefault();
        const effectId = event.currentTarget.dataset.effectId;
        const effect = this.actor.effects.get(effectId);
        
        if (effect) {
            const confirmed = await Dialog.confirm({
                title: "Confirm Deletion",
                content: `<p>Are you sure you want to remove the effect "<strong>${effect.label || effect.name}</strong>"?</p>`,
                yes: () => true,
                no: () => false
            });
            
            if (confirmed) {
                await this.actor.deleteEmbeddedDocuments("ActiveEffect", [effectId]);
                this.render();
                ui.notifications.info(`Effect "${effect.label || effect.name}" removed!`);
            }
        }
    }
}

// Function to generate a stable, unique status ID from file path
function generateStatusId(filePath) {
    // Create a hash from the file path that's more stable and unique
    // Remove special characters and create a more readable but unique ID
    const cleanPath = filePath.replace(/[^a-zA-Z0-9]/g, '');
    const hash = btoa(filePath).replace(/[^a-zA-Z0-9]/g, '');
    
    // Use the full hash instead of truncating to avoid collisions
    return `wbb-weapon-${hash}`;
}

Hooks.once('ready', async function() {
    console.log("Who Brings What?: System ready, registering global functions...");
    
    // Check if weaponImages setting is empty and populate it with default images
    const currentWeaponImages = game.settings.get("who-brings-what", "weaponImages");
    if (!currentWeaponImages || Object.keys(currentWeaponImages).length === 0) {
        console.log("Who Brings What?: weaponImages setting is empty, loading default images...");
        const defaultImages = await loadModuleImages();
        await game.settings.set("who-brings-what", "weaponImages", defaultImages);
        console.log("Who Brings What?: Default images loaded and saved to settings");
    } else {
        console.log("Who Brings What?: weaponImages setting already populated with", Object.keys(currentWeaponImages).length, "images");
    }
    
    // Register the macro function globally so it can be called from a Foundry macro
    window.WhoBringsWhat = {
        showDialog: async function() {
            const weaponImages = game.settings.get("who-brings-what", "weaponImages");
            const enabledImages = Object.entries(weaponImages)
                .filter(([key, data]) => data.enabled)
                .map(([key, data]) => ({ key, ...data }));

            console.log("Who Brings What?: Opening dialog with", enabledImages.length, "enabled images");

            if (!enabledImages.length) {
                return ui.notifications.warn("No weapon images enabled. Configure in module settings.");
            }

            // Render the template with data
            const template = "modules/who-brings-what/templates/weapon-selection-dialog.html";
            const content = await renderTemplate(template, {
                enabledImages
            });

            // Close existing dialog if open
            if (currentWeaponDialog) {
                currentWeaponDialog.close();
            }

            currentWeaponDialog = new Dialog({
                title: "Who Brings What? - Apply Weapon Effect",
                content,
                buttons: {},
                render: html => {
                    // Handle weapon card clicks
                    html.find(".weapon-card").on("click", async function () {
                        const tokens = canvas.tokens.controlled;
                        if (!tokens.length) return ui.notifications.warn("Select a token!");

                        const key = $(this).data("key"); // This is the file path
                        const weaponName = $(this).data("name");
                        const weaponData = weaponImages[key];
                        
                        // Create status ID from the file path (more stable and unique)
                        const statusId = generateStatusId(key);

                        console.log(`Who Brings What?: Applying weapon effect - Key: ${key}, Name: ${weaponName}, URL: ${weaponData.url}, StatusID: ${statusId}`);

                        for (let token of tokens) {
                            const actor = token.actor;

                            // Check if effect already exists using the status ID
                            const existingEffect = actor.effects.find(e => 
                                e.statuses && e.statuses.has(statusId)
                            );

                            if (existingEffect) {
                                ui.notifications.warn(`Effect "${weaponName}" is already active on this token!`);
                                continue;
                            }

                            // Create new effect using the EXACT file URL (never changes)
                            await ActiveEffect.create({
                                icon: weaponData.url, // ALWAYS use the original file URL
                                label: weaponName, // Use the custom display name
                                name: weaponName,
                                statuses: [statusId],
                                origin: actor.uuid,
                                flags: { 
                                    "who-brings-what": { 
                                        weaponKey: key, // Store the file path as reference
                                        weaponFileName: weaponData.fileName
                                    }
                                }
                            }, { parent: actor });

                            ui.notifications.info(`Effect "${weaponName}" added to ${actor.name}.`);
                        }
                    });

                    // Handle action buttons
                    html.find("[data-action='manage-effects']").on("click", () => {
                        const tokens = canvas.tokens.controlled;
                        if (!tokens.length) return ui.notifications.warn("Select a token!");
                        
                        if (tokens.length > 1) {
                            return ui.notifications.warn("Select only one token to manage effects!");
                        }
                        
                        new EffectManager(tokens[0].actor).render(true);
                    });

                    html.find("[data-action='remove-all']").on("click", async () => {
                        const tokens = canvas.tokens.controlled;
                        if (!tokens.length) return ui.notifications.warn("Select a token!");

                        for (let token of tokens) {
                            const weaponEffects = token.actor.effects.contents.filter(e => 
                                e.statuses && Array.from(e.statuses).some(s => s.startsWith("wbb-weapon-"))
                            );
                            
                            if (weaponEffects.length > 0) {
                                const ids = weaponEffects.map(e => e.id);
                                await token.actor.deleteEmbeddedDocuments("ActiveEffect", ids);
                                ui.notifications.info(`Removed ${weaponEffects.length} weapon effects from ${token.actor.name}.`);
                            } else {
                                ui.notifications.info(`No weapon effects found on ${token.actor.name}.`);
                            }
                        }
                    });

                    html.find("[data-action='manage-images']").on("click", () => {
                        new WeaponImageManager().render(true);
                    });
                },
                close: () => {
                    currentWeaponDialog = null;
                }
            }, { width: 600, height: "auto" });
            
            currentWeaponDialog.render(true);
        },

        // Function to open the image manager directly
        openImageManager: function() {
            new WeaponImageManager().render(true);
        },

        // Function to open effect manager for selected token
        openEffectManager: function() {
            const tokens = canvas.tokens.controlled;
            if (!tokens.length) return ui.notifications.warn("Select a token!");
            
            if (tokens.length > 1) {
                return ui.notifications.warn("Select only one token to manage effects!");
            }
            
            new EffectManager(tokens[0].actor).render(true);
        },
        
        // Function to reload images manually (for debugging)
        reloadImages: async function() {
            console.log("Who Brings What?: Reloading images manually...");
            const defaultImages = await loadModuleImages();
            await game.settings.set("who-brings-what", "weaponImages", defaultImages);
            ui.notifications.info("Images reloaded!");
            return defaultImages;
        }
    };
    
    console.log("Who Brings What?: Module fully loaded and ready for use!");
});
