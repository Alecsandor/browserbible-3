# Book Headers System for BSB 1688

This system implements decorative book headers (antete decorative) for the Biblia Șerban Cantacuzino (1688), matching the authentic manuscript style.

## Features

The book header system adds ornamental bands and styled titles at the beginning of biblical books, replicating the visual hierarchy found in the original 1688 manuscript.

### Components

1. **Decorative Ornament**: Horizontal ornamental band (like the one shown in 2 Corinthians)
2. **Styled Title**: Centered, uppercase title with period-appropriate typography

## Configuration

Configure book headers in the Bible's `info.json` file:

```json
{
  "bookHeaders": {
    "enabled": true,
    "basePath": "content/media/images/headers/",
    "books": {
      "C2": {
        "ornament": "2cor-header-ornament.png",
        "title": "CĂTRĂ CORINTHEANI CARTE TRIMISĂ A DOUA",
        "alt": "Antet decorativ pentru a doua epistolă către Corinteni",
        "description": "Ornament și titlu din manuscrisul Biblia Șerban Cantacuzino (1688)"
      }
    }
  }
}
```

### Configuration Properties

- **enabled**: Boolean to enable/disable book headers
- **basePath**: Directory path for header ornament images
- **books**: Object containing per-book configurations
- **ornament**: Filename of the ornamental band image
- **title**: Custom title text (overrides USFM title if specified)
- **alt**: Alt text for accessibility
- **description**: Tooltip description

## Image Specifications

### Header Ornaments
- **Format**: PNG with transparency preferred
- **Recommended width**: 300-500px
- **Style**: Horizontal ornamental bands matching 1688 manuscript
- **Location**: `app/content/media/images/headers/`

## CSS Classes

The system generates the following HTML structure:

```html
<div class="book-header">
  <div class="book-header-ornament">
    <img src="..." alt="..." title="..." />
  </div>
  <div class="book-header-title">BOOK TITLE</div>
</div>
```

### CSS Classes Used

- `.book-header` - Main container
- `.book-header-ornament` - Ornament image container  
- `.book-header-title` - Title text styling

## Responsive Behavior

Headers scale appropriately across devices:

- **Desktop**: Full size ornaments and titles
- **Tablet**: 85% scale with adjusted spacing
- **Mobile**: 80% scale with compact layout
- **Print**: Optimized for print media

## Theme Adaptation

Book headers automatically adapt to app themes:

- **Default**: Clean, high contrast
- **Sepia**: Warm, aged manuscript appearance
- **Dark**: Inverted colors with reduced opacity

## Typography

The title uses period-appropriate fonts:
- Primary: Times New Roman (serif)
- Fallback: Book Antiqua, serif
- Style: Bold, uppercase, with letter-spacing
- Size: Responsive (1.8em desktop, 1.3em mobile)

## Usage Examples

### Adding Header for New Book
```json
"MT": {
  "ornament": "matthew-header-ornament.png",
  "title": "EVANGHELIA DUPĂ MATEI",
  "alt": "Antet decorativ pentru Evanghelia după Matei",
  "description": "Ornament și titlu din Biblia Șerban Cantacuzino (1688)"
}
```

### Using Default USFM Title
```json
"MK": {
  "ornament": "mark-header-ornament.png",
  "alt": "Antet decorativ pentru Evanghelia după Marcu"
}
```
(When `title` is omitted, the original USFM title is used)

## Implementation Details

1. **Positioning**: Headers appear before the main title (`mt` element)
2. **Integration**: Seamlessly replaces default title styling when configured
3. **Fallback**: Books without header configuration use standard title styling
4. **Performance**: Images are optimized and cached by the browser

## File Naming Convention

Header ornaments should follow the pattern:
- `{book-identifier}-header-ornament.png`
- Example: `2cor-header-ornament.png`, `1cor-header-ornament.png`

## Adding New Headers

1. Create ornament image matching specifications
2. Save to `app/content/media/images/headers/`
3. Add configuration to `info.json`
4. Regenerate Bible with `node tools/generate.js -v BSB`
