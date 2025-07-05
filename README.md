# Manga Creator & Viewer

A comprehensive manga creation and viewing system with Electron-based creator app and Flutter-based viewer app.

## Development Servers

Both applications support hot reload for rapid development:

```bash
# Start Creator app (Electron + React)
yarn dev

# Start Viewer app (Flutter for macOS)
cd manga_viewer
flutter run -d macos
```

## Project Structure

```
.
├── app/                    # React frontend for Creator
├── main/                   # Electron main process
├── manga_viewer/           # Flutter viewer application
└── package.json           # Main project configuration
```

## Creator App (Electron + React)

The Creator app allows you to:
- Import manga pages via drag & drop
- Add speech/dialogue data from CSV/TXT files
- Assign speech to specific pages with customizable positions
- Preview your manga with speech overlays
- Export projects as ZIP files

### Running Creator
```bash
# Install dependencies
yarn install

# Development mode with hot reload
yarn dev

# Build for production
yarn build
yarn electron
```

## Viewer App (Flutter)

The Viewer app provides:
- Cross-platform manga reading experience
- Support for creator.json format
- Speech bubble rendering with positioning
- Multi-language support (Japanese/English)

### Running Viewer
```bash
cd manga_viewer

# Install dependencies
flutter pub get

# Run on macOS with hot reload
flutter run -d macos

# Build for release
flutter build macos
```

## Features

### Creator Features
- **Pages Panel**: Drag & drop image management
- **Speech Panel**: Import dialogue from CSV/TXT
- **Preview Panel**: Real-time preview with speech overlays
- **Export**: Package as ZIP with creator.json manifest

### Viewer Features
- **Archive Support**: Load manga from ZIP files
- **Speech Rendering**: Display dialogue at specified positions
- **Language Toggle**: Switch between Japanese and English
- **Smooth Navigation**: Page-by-page reading experience

## Data Format

Projects are exported as ZIP files containing:
- `creator.json`: Manifest with page info, speech data, and positions
- `panels/`: Directory containing page images

Example creator.json structure:
```json
{
  "pages": [
    {
      "id": "unique-id",
      "name": "page1.png",
      "filename": "page_1.png",
      "speechId": "speech-id",
      "speechPos": { "x": 20, "y": 20 }
    }
  ],
  "speechData": [
    {
      "id": "speech-id",
      "ja": "こんにちは",
      "en": "Hello"
    }
  ],
  "language": "ja",
  "version": "1.0.0"
}
```

## Development Tips

- Both apps support hot reload - changes are reflected immediately
- Use `yarn dev` for Creator development
- Use `flutter run` for Viewer development
- Check console logs for debugging information
- Creator saves projects automatically to app data directory