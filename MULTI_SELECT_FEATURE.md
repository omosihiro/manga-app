# Multi-Select Feature in Pages Panel

## Overview
The Pages Panel now supports multi-select functionality with keyboard shortcuts and bulk operations toolbar.

## Selection Methods

### 1. **Single Click**
- Clicking on a page selects only that page
- Clears any previous selection

### 2. **Cmd/Ctrl + Click**
- Toggles selection of individual pages
- Add or remove pages from current selection

### 3. **Shift + Click**
- Selects a range of pages
- From the last selected page to the clicked page

### 4. **Cmd/Ctrl + A**
- Selects all pages in the panel

### 5. **Escape**
- Deselects all pages

## Bulk Operations Toolbar

When pages are selected, a toolbar appears with the following operations:

### **↑ Move Up**
- Moves all selected pages up by one position
- Maintains relative order of selected pages
- Disabled if the first page is selected

### **↓ Move Down**
- Moves all selected pages down by one position
- Maintains relative order of selected pages
- Disabled if the last page is selected

### **⎘ Duplicate**
- Creates copies of all selected pages
- Copies are added at the end with " (copy)" suffix

### **🗑 Delete**
- Removes all selected pages
- Can also use Delete/Backspace keys

## Visual Feedback

- Selected pages have a blue border and darker background
- Selection count is displayed in the toolbar
- Interactive elements (dropdowns, buttons) don't trigger selection when clicked

## Drag & Drop with Multi-Select

- Dragging any selected page will move all selected pages together
- Useful for moving multiple pages between groups (Start/Normal/Big)

## Technical Implementation

### State Management
- `selectedPageIds`: Set containing IDs of selected pages
- `lastSelectedId`: Tracks last selected page for shift-click range selection

### Key Functions
- `handlePageClick`: Manages selection logic based on modifier keys
- `removeSelectedPages`: Deletes all selected pages
- `duplicateSelectedPages`: Creates copies of selected pages
- `moveSelectedUp/Down`: Moves selected pages in the order

### CSS Classes
- `.page-item.selected`: Styling for selected pages
- `.selection-toolbar`: Floating toolbar for bulk operations

## Usage Tips

1. Use Cmd+A to quickly select all pages for bulk operations
2. Hold Cmd while clicking to build custom selections
3. Use Shift+Click for contiguous selections
4. The toolbar only appears when pages are selected
5. Keyboard shortcuts work globally in the Pages tab