# Who Brings What? - Foundry VTT Module

A module for Foundry VTT that allows applying visual weapon effects to character tokens.

## Features

- **Effect Application**: Apply visual weapon effects to selected tokens
- **Image Management**: Interface to add, remove and configure weapon images
- **Flexible Modes**: Choose between allowing multiple effects or just one per token
- **URL Preservation**: Images NEVER break, regardless of the name you give to weapons
- **Custom Configuration**: Configure custom initial names for your images

## Installation

1. Download or clone this repository
2. Place it in the `modules` folder of your Foundry VTT
3. Activate the module in world settings
4. **Important**: Create an `images` folder inside the module folder
5. Place your weapon images in the `images` folder

## File Structure

```
who-brings-what/
├── module.json
├── scripts/
│   └── weapon-effects.js
├── templates/
│   ├── weapon-selection-dialog.html
│   ├── image-manager.html
│   └── effect-manager.html
├── config/
│   └── weapon-names.js
├── images/          <- PUT YOUR IMAGES HERE
│   ├── sword1.png
│   ├── magic-bow.webp
│   └── axe.jpg
└── README.md
```

## Initial Setup

### 1. Add Your Images

Place all weapon image files in the module's `images/` folder. Supported formats:
- `.png`
- `.jpg` / `.jpeg`  
- `.webp`
- `.gif`
- `.svg`

### 2. Configure Initial Names (Optional)

Edit the `config/weapon-names.js` file to define custom names for your images:

```javascript
export const WEAPON_INITIAL_NAMES = {
    "my-ugly-sword.png": "Flaming Sword",
    "bow123.webp": "Legendary Elven Bow",
    "axe-weird-name.jpg": "Berserker's Axe"
};
```

**Important**: 
- The key must be the EXACT filename (including extension)
- The value is the name that will appear in the game
- Files not listed will have automatically generated names
- You can always change names later in the manager

## How to Use

### Apply Weapon Effects

1. **Via Macro**: Create a macro with the code:
   ```javascript
   WhoBringsWhat.showDialog();
   ```

2. **Or call directly in console**:
   ```javascript
   WhoBringsWhat.showDialog();
   ```

3. **Select one or more tokens** on the map
4. **Click on the desired weapon** in the dialog
5. The effect will be applied to the selected tokens

### Manage Images

1. **Via Module Settings**: Go to Settings → Modules → Who Brings What? → "Manage Weapon Images"

2. **Or via macro**:
   ```javascript
   WhoBringsWhat.openImageManager();
   ```

In the manager you can:
- **Edit names** of weapons (only display name, file never changes)
- **Enable/disable** images
- **Add new images**
- **Remove images**
- **Reset to defaults** from the module

### Manage Active Effects

1. **Select ONE token**
2. **Call the manager**:
   ```javascript
   WhoBringsWhat.openEffectManager();
   ```

3. **Or use the button** "Manage Effects" in the main dialog

## Advanced Settings

### Multiple Effects

By default, the module allows multiple weapon effects on the same token. To change:

1. Go to **Settings → Modules → Who Brings What?**
2. Uncheck **"Allow Multiple Effects"**

### Debugging

For debugging and manually reloading images:

```javascript
WhoBringsWhat.reloadImages();
```

## How It Works (Technical)

### Unique Key System

The module uses a special system to **GUARANTEE** that images never break:

1. **Key = Full File Path**: Each image has as unique key the complete file path (e.g., `modules/who-brings-what/images/sword.png`)

2. **URL Always Preserved**: The image URL is always the same as the physical file, regardless of the name the user gives

3. **Customizable Name**: The user can only change the display name, but this doesn't affect the file link

4. **Settings Preservation**: When the module is reloaded, custom settings (names and states) are preserved

### Practical Example

- **Physical file**: `images/awdwadawda.png`
- **System key**: `modules/who-brings-what/images/awdwadawda.png`
- **Display name**: "Flaming Sword" (customizable)
- **URL used**: `modules/who-brings-what/images/awdwadawda.png` (NEVER changes)

## Use Cases

### Scenario 1: Clean Installation
1. Place `ugly-sword.png` in the `images/` folder
2. Configure in `weapon-names.js`: `"ugly-sword.png": "Elegant Sword"`
3. On first load, it will appear as "Elegant Sword"
4. URL will always be `modules/who-brings-what/images/ugly-sword.png`

### Scenario 2: Module Update
1. User already has "Cool Sword" configured
2. Module is updated
3. Name "Cool Sword" is preserved
4. URL continues pointing to the correct file
5. **Image NEVER breaks**

### Scenario 3: File Reorganization
1. If you move files, edit `weapon-names.js` with the new names
2. Reset images in the manager
3. Custom settings are lost, but URLs are updated

## Available Functions

### Global (window.WhoBringsWhat)

- `showDialog()`: Opens the main dialog
- `openImageManager()`: Opens the image manager
- `openEffectManager()`: Opens the effect manager (needs selected token)
- `reloadImages()`: Manually reloads images

### For Macros

```javascript
// Main dialog
WhoBringsWhat.showDialog();

// Manage images
WhoBringsWhat.openImageManager();

// Manage effects (selected token)
WhoBringsWhat.openEffectManager();

// Debug - reload images
WhoBringsWhat.reloadImages();
```

## Troubleshooting

### Images don't appear
1. Check if the `images/` folder exists
2. Check if there are images in the folder
3. Check the console (F12) for errors
4. Try `WhoBringsWhat.reloadImages()`

### Broken images after update
1. **Should not happen** with this system
2. If it happens, check if files still exist
3. Use "Reset Default Images" in the manager

### Strange names
1. Configure `config/weapon-names.js` before first installation
2. Or edit names in the image manager

## Important Notes

- **URLs are permanent**: Once loaded, an image URL never changes
- **Names are flexible**: You can change display names at any time
- **Settings are preserved**: Your customizations survive updates
- **Organization matters**: Keep images in the `images/` folder for better organization

## Contributing

Contributions are welcome! Please maintain the fundamental principle: **Image URLs should never break**.

---

**Version**: 1.0.0  
**Compatibility**: Foundry VTT v10+  
**Author**: [Your Name]