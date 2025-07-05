# Manga Viewer Test Instructions

Since Flutter requires Xcode command line tools for macOS development, here's how to test the manga viewer app:

## Prerequisites

1. Install Xcode command line tools:
   ```bash
   xcode-select --install
   ```

2. Or install full Xcode from the App Store

## Running the App

Once Xcode tools are installed:

```bash
cd /Users/tomonaganao/electron-react-app/manga_viewer
flutter run
```

## What the App Does

1. **Main Screen**: Shows an empty state with instructions
2. **File Selection**: Tap the floating action button (folder icon) to select a .zip file
3. **Zip Processing**: The app will:
   - Extract the zip file
   - Parse `creator.json` for metadata
   - Load images from the `panels/` directory
4. **Display**: Shows manga pages in a vertical scrollable list

## Testing with Your Electron App

1. Create a manga in your Electron app
2. Export it as a .zip file
3. Open that .zip in this Flutter viewer
4. You should see all your manga pages displayed vertically

## Features Implemented

- ✅ File picker integration
- ✅ Zip file extraction using archive package
- ✅ JSON parsing for metadata
- ✅ Image loading and display
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive layout