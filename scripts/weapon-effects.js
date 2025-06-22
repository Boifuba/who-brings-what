// Function to load default images from the module's images folder
async function loadModuleImages() {
    try {
        console.log("Who Brings What?: Attempting to load module images...");
        
        const module = game.modules.get("who-brings-what");
        if (!module) {
            console.error("Who Brings What?: Module not found!");
            return {};
        }
        
        console.log("Who Brings What?: Module found, path:", module.path);
        
        // Get existing settings to preserve custom names and enabled states
        const existingSettings = game.settings.get("who-brings-what", "weaponImages") || {};
        console.log("Who Brings What?: Existing settings:", existingSettings);
        
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
                            const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                            // Create key from filename (always based on actual file)
                            const key = nameWithoutExt.toLowerCase().replace(/\s+/g, '-');
                            
                            // Check if we have existing settings for this key
                            const existingImage = existingSettings[key];
                            
                            // Use existing custom name if available, otherwise create default display name
                            let displayName;
                            if (existingImage && existingImage.name) {
                                displayName = existingImage.name; // Preserve custom name
                                console.log(`Who Brings What?: Preserving custom name for ${key}: ${displayName}`);
                            } else {
                                // Create default display name from filename
                                displayName = nameWithoutExt.split(/[-_\s]+/).map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ');
                                console.log(`Who Brings What?: Using default name for ${key}: ${displayName}`);
                            }
                            
                            // Use existing enabled state if available, otherwise default to true
                            const enabled = existingImage ? existingImage.enabled : true;
                            
                            weaponImages[key] = {
                                name: displayName,
                                url: filePath, // Always use the actual file path
                                enabled: enabled
                            };
                            
                            foundImages = true;
                            console.log(`Who Brings What?: Image loaded: ${displayName} -> ${filePath}`);
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
                'example-sword': {
                    name: 'Example Sword',
                    url: 'icons/weapons/swords/sword-broad-steel.webp',
                    enabled: true
                },
                'example-bow': {
                    name: 'Example Bow',
                    url: 'icons/weapons/bows/bow-recurve-brown.webp',
                    enabled: true
                },
                'example-axe': {
                    name: 'Example Axe',
                    url: 'icons/weapons/axes/axe-battle-worn.webp',
                    enabled: true
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
            'fallback-sword': {
                name: 'Sword',
                url: 'icons/weapons/swords/sword-broad-steel.webp',
                enabled: true
            },
            'fallback-bow': {
                name: 'Bow',
                url: 'icons/weapons/bows/bow-recurve-brown.webp',
                enabled: true
            }
        };
    }
}

Hooks.once('init', async function() {
    console.log("Who Brings What?: Initializing module...");
    
    // Load default images
    const defaultImages = await loadModuleImages();
    
    // Register module settings
    game.settings.register("who-brings-what", "weaponImages", {
        name: "Weapon Images",
        hint: "Manage weapon images for the module",
        scope: "world",
        config: false, // We'll handle this with our custom interface
        type: Object,
        default: defaultImages,
        onChange: settings => {
            console.log("Who Brings What?: Image settings changed:", settings);
        }
    });

    // Register setting for multiple effects mode
    game.settings.register("who-brings-what", "allowMultipleEffects", {
        name: "Allow Multiple Effects",
        hint: "Allow multiple weapon effects to be applied to the same token",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
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
                enabled: data.enabled
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
                
                // Extract filename without extension for the key
                const filename = path.split('/').pop();
                const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
                const key = nameWithoutExt.toLowerCase().replace(/\s+/g, '-');
                
                // Create display name (first letter uppercase)
                const displayName = nameWithoutExt.split(/[-_\s]+/).map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                weaponImages[key] = {
                    name: displayName,
                    url: path,
                    enabled: true
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
                     <p><strong>Warning:</strong> This will remove all custom images you've added!</p>`,
            yes: () => true,
            no: () => false
        });
        
        if (confirmed) {
            console.log("Who Brings What?: Resetting to default images...");
            const defaultImages = await loadModuleImages();
            await game.settings.set("who-brings-what", "weaponImages", defaultImages);
            this.render();
            ui.notifications.info("Images reset to module defaults!");
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

Hooks.once('ready', async function() {
    console.log("Who Brings What?: System ready, registering global functions...");
    
    // Register the macro function globally so it can be called from a Foundry macro
    window.WhoBringsWhat = {
        showDialog: async function() {
            const weaponImages = game.settings.get("who-brings-what", "weaponImages");
            const enabledImages = Object.entries(weaponImages)
                .filter(([key, data]) => data.enabled)
                .map(([key, data]) => ({ key, ...data }));
            const allowMultiple = game.settings.get("who-brings-what", "allowMultipleEffects");

            console.log("Who Brings What?: Opening dialog with", enabledImages.length, "enabled images");

            if (!enabledImages.length) {
                return ui.notifications.warn("No weapon images enabled. Configure in module settings.");
            }

            // Render the template with data
            const template = "modules/who-brings-what/templates/weapon-selection-dialog.html";
            const content = await renderTemplate(template, {
                enabledImages,
                allowMultiple
            });

            new Dialog({
                title: "Who Brings What? - Apply Weapon Effect",
                content,
                buttons: {},
                render: html => {
                    // Handle weapon card clicks
                    html.find(".weapon-card").on("click", async function () {
                        const tokens = canvas.tokens.controlled;
                        if (!tokens.length) return ui.notifications.warn("Select a token!");

                        const key = $(this).data("key");
                        const weaponName = $(this).data("name");
                        const weaponData = weaponImages[key];
                        const statusId = `wbb-weapon-${key}`;

                        console.log(`Who Brings What?: Applying weapon effect - Key: ${key}, Name: ${weaponName}, URL: ${weaponData.url}`);

                        for (let token of tokens) {
                            const actor = token.actor;

                            // Check if effect already exists
                            const existingEffect = actor.effects.find(e => 
                                e.statuses && e.statuses.has(statusId)
                            );

                            if (existingEffect) {
                                ui.notifications.warn(`Effect "${weaponName}" is already active on this token!`);
                                continue;
                            }

                            // If multiple effects not allowed, remove existing weapon effects
                            if (!allowMultiple) {
                                const existingWeaponEffects = actor.effects.contents.filter(e => 
                                    e.statuses && Array.from(e.statuses).some(s => s.startsWith("wbb-weapon-"))
                                );
                                
                                if (existingWeaponEffects.length > 0) {
                                    const ids = existingWeaponEffects.map(e => e.id);
                                    await actor.deleteEmbeddedDocuments("ActiveEffect", ids);
                                }
                            }

                            // Create new effect using modern approach
                            await ActiveEffect.create({
                                icon: weaponData.url, // Always use the original file URL
                                label: weaponName, // Use the custom display name
                                name: weaponName,
                                statuses: [statusId],
                                origin: actor.uuid,
                                flags: { 
                                    "who-brings-what": { weaponKey: key }
                                }
                            }, { parent: actor });
                        }

                        const modeText = allowMultiple ? "added" : "applied";
                        ui.notifications.info(`Effect "${weaponName}" ${modeText} to token(s).`);
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
                            }
                        }
                        ui.notifications.info("All weapon effects removed from token(s).");
                    });

                    html.find("[data-action='manage-images']").on("click", () => {
                        new WeaponImageManager().render(true);
                    });
                }
            }, { width: 600, height: "auto" }).render(true);
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