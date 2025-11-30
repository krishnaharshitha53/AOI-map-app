# UI Design Notes - Figma Matching

## Current Status

The application UI has been implemented with Tailwind CSS, but **needs to be updated to match the Figma design exactly**.

## Components That Need Figma Matching

### 1. Sidebar (`src/components/Sidebar.tsx`)
- **Current**: Basic white sidebar with standard styling
- **Needs**: Match Figma design for:
  - Header styling and typography
  - Button styles (colors, sizes, spacing)
  - Card/AOI display styles
  - Section spacing and borders
  - Icon styles and placement

### 2. Search Bar (`src/components/SearchBar.tsx`)
- **Current**: Standard input with dropdown
- **Needs**: Match Figma design for:
  - Input field styling
  - Search icon placement
  - Dropdown result styling
  - Loading state indicators

### 3. Drawing Controls (`src/components/DrawControls.tsx`)
- **Current**: Basic buttons
- **Needs**: Match Figma design for:
  - Button colors and styles
  - Button sizes and spacing
  - Icon buttons if specified
  - Active/inactive states

### 4. AOI Cards/List
- **Current**: Not implemented as cards
- **Needs**: Create AOI card components matching Figma:
  - Card layout and structure
  - Polygon preview/thumbnail
  - Metadata display (name, area, date)
  - Action buttons (edit, delete)
  - Hover states and interactions

### 5. Map Controls
- **Current**: Leaflet default controls
- **Needs**: Custom controls matching Figma:
  - Zoom buttons styling
  - Fullscreen button (if in design)
  - Layer toggle controls
  - Custom styling for all map controls

## Steps to Match Figma

1. **Extract Design Tokens from Figma**:
   - Colors (primary, secondary, text, background)
   - Typography (font families, sizes, weights, line heights)
   - Spacing (padding, margins, gaps)
   - Border radius values
   - Shadow/elevation values

2. **Update Tailwind Config**:
   ```javascript
   // tailwind.config.js
   theme: {
     extend: {
       colors: {
         // Add Figma color palette
       },
       fontFamily: {
         // Add Figma fonts
       },
       spacing: {
         // Add Figma spacing scale
       }
     }
   }
   ```

3. **Update Component Styles**:
   - Replace generic Tailwind classes with Figma-specific values
   - Add custom CSS for Figma-specific styles
   - Ensure responsive breakpoints match Figma

4. **Add Missing Components**:
   - AOI card component
   - Custom map controls
   - Loading states
   - Empty states

## Figma Design Reference

**Figma URL**: https://www.figma.com/proto/mtvRfVu94PTKLaOkbPmqOX/UI-Design---AOI-Creation?node-id=1-419

## Priority

- **High**: Sidebar, Search Bar, Drawing Controls (core UI)
- **Medium**: AOI Cards, Map Controls (enhanced UX)
- **Low**: Animations, micro-interactions (polish)

## Notes

- Current implementation uses a functional UI that works correctly
- Styling needs refinement to match Figma pixel-perfect
- All functionality is complete; only visual styling needs updates
- Consider using Figma plugins to export design tokens automatically

## Current Implementation Status

✅ **Functional**: All UI components work correctly
⚠️ **Styling**: Needs updates to match Figma design exactly
✅ **Responsive**: Works on all screen sizes
✅ **Accessible**: Basic accessibility implemented

