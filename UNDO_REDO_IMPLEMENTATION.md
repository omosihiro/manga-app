# Undo/Redo Implementation for Speech Styles

## Summary

The speech style changes are now fully integrated with the undo/redo system in the manga creator application.

## Implementation Details

### 1. **Existing Infrastructure**
- The app already uses `use-undo` package for managing undo/redo state
- Pages state is wrapped with `useUndo` hook in `App.js`
- Speech data has its own separate undo/redo state

### 2. **Speech Style Integration**
- When speech styles are changed in `PagesPanel`, the `updatePageSpeechStyle` function is called
- This function updates the entire pages array and calls `onPagesUpdate`
- `onPagesUpdate` is bound to `setPages` from the useUndo hook
- This automatically adds each style change to the undo history

### 3. **Keyboard Shortcuts**
The following keyboard shortcuts are implemented in `App.js`:

#### Mac:
- **Undo**: `Cmd+Z`
- **Redo**: `Shift+Cmd+Z`

#### Windows/Linux:
- **Undo**: `Ctrl+Z`
- **Redo**: `Ctrl+Y` or `Ctrl+Shift+Z`

### 4. **Context Awareness**
- Shortcuts are context-aware based on the active tab
- When on "ページ" (Pages) tab: undo/redo affects pages (including speech styles)
- When on "セリフ" (Speech) tab: undo/redo affects speech data

### 5. **UI Controls**
- Undo/redo buttons are available in the header
- Buttons show enabled/disabled state based on undo/redo availability
- Japanese labels: "↶ 元に戻す" (Undo) and "↷ やり直す" (Redo)

## What Gets Tracked

All page-related changes are tracked in the undo history, including:
- Adding/removing pages
- Changing page order
- Moving pages between groups (Start/Normal/Big)
- Selecting speech for a page
- **All speech style changes**:
  - Shape (rounded, cloud, sharp, thought)
  - Size (small, medium, large)
  - Color (background color)
  - Border color
  - Tail direction (left, right)
  - Animation (none, fade, slide, bounce, zoom)
- Speech position changes (drag & drop)

## Testing

To test the undo/redo functionality:

1. Add some pages to the project
2. Select a speech ID for a page
3. Change various speech style properties
4. Press `Cmd+Z` (Mac) or `Ctrl+Z` (Windows) to undo changes
5. Press `Shift+Cmd+Z` (Mac) or `Ctrl+Y` (Windows) to redo changes
6. Use the undo/redo buttons in the header

Each style change creates a new undo state, allowing fine-grained control over the editing history.