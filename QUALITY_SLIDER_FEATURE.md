# WebP Quality Slider Feature

## Overview
Added a quality slider to the Export Dialog that allows users to control the compression quality when exporting images to WebP format.

## User Interface

### Quality Slider
- **Range**: 50-100% (in steps of 5)
- **Default**: 85%
- **Location**: Appears in Export Dialog when "画像をWebPに圧縮" (Compress images to WebP) is checked

### Visual Feedback
- Current quality percentage displayed next to label: "圧縮品質: 85%"
- Quality hint text changes based on selected value:
  - **50-69%**: "低品質 - ファイルサイズ小" (Low quality - Small file size)
  - **70-89%**: "標準品質 - バランス良好" (Standard quality - Good balance)
  - **90-100%**: "高品質 - ファイルサイズ大" (High quality - Large file size)

### Slider Design
- Blue thumb with hover effect
- Smooth slide animation
- Labels showing min (50) and max (100) values
- Disabled state when export is in progress

## Implementation Details

### Components Updated

#### 1. ExportDialog.js
- Added `quality` state with default value of 85
- Added quality control UI that shows when WebP is enabled
- Passes quality parameter to onExport callback

#### 2. ExportDialog.css
- Added styles for quality control container
- Custom slider styling with webkit and moz prefixes
- Smooth slide-down animation when quality control appears

#### 3. App.js
- Updated handleExport to include quality in projectData
- Passes quality parameter to main process

#### 4. export.js (main process)
- Modified sharp WebP conversion to use dynamic quality value
- Falls back to 85 if quality not specified

## Technical Specifications

### Quality Parameter Flow
1. User adjusts slider in ExportDialog → updates local state
2. On export, quality value passed to App.js via onExport callback
3. App.js includes quality in projectData object
4. Main process receives quality via IPC
5. Sharp uses quality value for WebP compression

### Sharp WebP Options
```javascript
sharp(buffer).webp({ quality: quality })
```

## Benefits

1. **File Size Control**: Users can balance between file size and image quality
2. **Flexibility**: Different projects may have different quality requirements
3. **Visual Feedback**: Clear indication of quality level and its impact
4. **Progressive Enhancement**: Feature only appears when relevant (WebP enabled)

## Testing

Created comprehensive tests in `ExportQuality.test.jsx`:
- Quality slider visibility based on WebP checkbox
- Value changes and hint updates
- Export parameter inclusion
- Disabled state during export

All tests passing ✅