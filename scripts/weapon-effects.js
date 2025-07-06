import { WEAPON_INITIAL_NAMES } from '../config/weapon-names.js';

async function loadModuleImages(forceReset = false) {
    try {
        const module = game.modules.get("who-brings-what");
        if (!module) {
            return {};
        }
        
        let existingSettings = {};
        if (!forceReset) {
            existingSettings = game.settings.get("who-brings-what", "weaponImages") || {};
        }
        
        const possiblePaths = [
            `modules/who-brings-what/images`,
            `${module.path}/images`,
            `modules/${module.id}/images`
        ];
        
        let weaponImages = {};
        let foundImages = false;
        
        for (const imagesPath of possiblePaths) {
            try {
                const browseResult = await FilePicker.browse("data", imagesPath);
                
                if (browseResult && browseResult.files && browseResult.files.length > 0) {
                    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'];
                    
                    for (const filePath of browseResult.files) {
                        const fileName = filePath.split('/').pop();
                        const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
                        
                        if (imageExtensions.includes(fileExtension)) {
                            const key = filePath;
                            const existingImage = !forceReset ? existingSettings[key] : null;
                            
                            let displayName;
                            if (!forceReset && existingImage && existingImage.name) {
                                displayName = existingImage.name;
                            } else if (WEAPON_INITIAL_NAMES[fileName]) {
                                displayName = WEAPON_INITIAL_NAMES[fileName];
                            } else {
                                const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
                                displayName = nameWithoutExt.split(/[-_\s]+/).map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ');
                            }
                            
                            const enabled = (!forceReset && existingImage) ? existingImage.enabled : true;
                            
                            weaponImages[key] = {
                                name: displayName,
                                url: filePath,
                                enabled: enabled,
                                fileName: fileName
                            };
                            
                            foundImages = true;
                        }
                    }
                    
                    if (foundImages) {
                        break;
                    }
                }
            } catch (pathError) {
                continue;
            }
        }
        
        if (!foundImages) {
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
        }
        
        return weaponImages;
        
    } catch (error) {
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

let currentWeaponDialog = null;

Hooks.once('init', async function() {
    game.settings.register("who-brings-what", "weaponImages", {
        name: "Weapon Images",
        hint: "Manage weapon images for the module",
        scope: "world",
        config: false,
        type: Object,
        default: {},
        onChange: settings => {
            if (currentWeaponDialog && currentWeaponDialog.rendered) {
                currentWeaponDialog.close();
                setTimeout(() => {
                    window.WhoBringsWhat.showDialog();
                }, 100);
            }
        }
    });

    game.settings.registerMenu("who-brings-what", "manageImages", {
        name: "Manage Weapon Images",
        label: "Open Manager",
        hint: "Add, remove and configure weapon images",
        icon: "fas fa-cogs",
        type: WeaponImageManager,
        restricted: true
    });
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

        html.find('#add-image').click(this._onAddImage.bind(this));
        html.find('.delete-image').click(this._onDeleteImage.bind(this));
        html.find('.toggle-enabled').change(this._onToggleEnabled.bind(this));
        html.find('#reset-images').click(this._onResetImages.bind(this));
        html.find('#save-settings').click(this._onSave.bind(this));
    }

    async _onAddImage(event) {
        event.preventDefault();
        
        const fp = new FilePicker({
            type: "image",
            callback: async (path) => {
                const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
                
                const key = path;
                const fileName = path.split('/').pop();
                
                if (weaponImages[key]) {
                    ui.notifications.warn(`Image "${fileName}" is already added!`);
                    return;
                }
                
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
            const defaultImages = await loadModuleImages(true);
            await game.settings.set("who-brings-what", "weaponImages", defaultImages);
            this.render();
            ui.notifications.info("Images reset to module defaults! Names restored from configuration.");
        }
    }

    async _onSave(event) {
        event.preventDefault();
        
        const weaponImages = foundry.utils.deepClone(game.settings.get("who-brings-what", "weaponImages"));
        const nameInputs = this.element.find('.image-name-input');
        
        nameInputs.each((index, input) => {
            const key = input.dataset.key;
            const newName = input.value.trim();
            
            if (weaponImages[key] && newName) {
                weaponImages[key].name = newName;
            }
        });
        
        await game.settings.set("who-brings-what", "weaponImages", weaponImages);
        ui.notifications.info("Settings saved!");
        this.close();
    }
}

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
        
        html.find('.delete-effect').click(this._onDeleteEffect.bind(this));
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

function generateStatusId(filePath) {
    const cleanPath = filePath.replace(/[^a-zA-Z0-9]/g, '');
    const hash = btoa(filePath).replace(/[^a-zA-Z0-9]/g, '');
    
    return `wbb-weapon-${hash}`;
}

Hooks.once('ready', async function() {
    const currentWeaponImages = game.settings.get("who-brings-what", "weaponImages");
    if (!currentWeaponImages || Object.keys(currentWeaponImages).length === 0) {
        const defaultImages = await loadModuleImages();
        await game.settings.set("who-brings-what", "weaponImages", defaultImages);
    }
    
    window.WhoBringsWhat = {
        showDialog: async function() {
            const weaponImages = game.settings.get("who-brings-what", "weaponImages");
            const enabledImages = Object.entries(weaponImages)
                .filter(([key, data]) => data.enabled)
                .map(([key, data]) => ({ key, ...data }));

            if (!enabledImages.length) {
                return ui.notifications.warn("No weapon images enabled. Configure in module settings.");
            }

            const template = "modules/who-brings-what/templates/weapon-selection-dialog.html";
            const content = await renderTemplate(template, {
                enabledImages
            });

            if (currentWeaponDialog) {
                currentWeaponDialog.close();
            }

            currentWeaponDialog = new Dialog({
                title: "Who Brings What? - Apply Weapon Effect",
                content,
                buttons: {},
                render: html => {
                    html.find(".weapon-card").on("click", async function () {
                        const tokens = canvas.tokens.controlled;
                        if (!tokens.length) return ui.notifications.warn("Select a token!");

                        const key = $(this).data("key");
                        const weaponName = $(this).data("name");
                        const weaponData = weaponImages[key];
                        
                        const statusId = generateStatusId(key);

                        for (let token of tokens) {
                            const actor = token.actor;

                            const existingEffect = actor.effects.find(e => 
                                e.statuses && e.statuses.has(statusId)
                            );

                            if (existingEffect) {
                                ui.notifications.warn(`Effect "${weaponName}" is already active on this token!`);
                                continue;
                            }

                            await ActiveEffect.create({
                                icon: weaponData.url,
                                label: weaponName,
                                name: weaponName,
                                statuses: [statusId],
                                origin: actor.uuid,
                                flags: { 
                                    "who-brings-what": { 
                                        weaponKey: key,
                                        weaponFileName: weaponData.fileName
                                    }
                                }
                            }, { parent: actor });

                            ui.notifications.info(`Effect "${weaponName}" added to ${actor.name}.`);
                        }
                    });

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

        openImageManager: function() {
            new WeaponImageManager().render(true);
        },

        openEffectManager: function() {
            const tokens = canvas.tokens.controlled;
            if (!tokens.length) return ui.notifications.warn("Select a token!");
            
            if (tokens.length > 1) {
                return ui.notifications.warn("Select only one token to manage effects!");
            }
            
            new EffectManager(tokens[0].actor).render(true);
        },
        
        reloadImages: async function() {
            const defaultImages = await loadModuleImages();
            await game.settings.set("who-brings-what", "weaponImages", defaultImages);
            ui.notifications.info("Images reloaded!");
            return defaultImages;
        }
    };
});