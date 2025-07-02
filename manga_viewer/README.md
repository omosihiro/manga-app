# Manga Viewer

A minimal Flutter app that views manga from zip files created by the Electron manga creator.

## Features

- Select .zip files using file picker
- Stream and parse creator.json metadata
- Extract and display manga pages in a vertical scroll view
- Show manga title and page count

## Usage

1. Install dependencies:
   ```bash
   flutter pub get
   ```

2. Run the app:
   ```bash
   flutter run
   ```

3. Tap the floating action button to select a .zip file
4. The app will extract and display the manga pages

## Dependencies

- `file_picker`: For selecting zip files
- `archive`: For extracting zip file contents

## File Structure Expected in Zip

```
manga.zip
├── creator.json
└── panels/
    ├── page1.png
    ├── page2.png
    └── ...
```