# Defra Form Builder Tool

A form building tool built on the GOV.UK Prototype Kit that allows you to create and manage multi-page forms with various field types. Built with GDS design patterns and Defra styling.

## Features

### Core Features
- Create multi-page forms with an intuitive interface
- Support for multiple field types (text, textarea, radio, checkbox, select, date, etc.)
- Form preview with Previous/Continue navigation
- Custom Defra-styled header

### Technical Features
- Modular JavaScript architecture with reusable components
- Live preview using PreviewManager module with official GDS markup
- Data persistence using StorageManager module and localStorage
- Full GDS component styling and accessibility features

## Quick Start

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Visit `http://localhost:3000` in your browser

## Usage

1. Start at the Pages List (`/pages`)
2. Click "Add new page" to create your first page
3. Add fields to your page using the field type options
4. Configure each field's settings in the question editor
5. See live previews rendered with GDS markup as you make changes
6. Return to the Pages List to manage your pages
7. Use the "Preview form" button to see your complete form

## Architecture

The tool uses a modular JavaScript architecture:

### Core Modules
- **PreviewManager**: Handles real-time field previews using official GDS markup
- **StorageManager**: Manages data persistence and state management

### Supporting Scripts
- **options.js**: Manages field configuration and options
- **pages.js**: Handles page creation and management
- **form-preview.js**: Controls the complete form preview functionality

## Field Types Available

All field types are rendered using official GOV.UK Design System markup and classes.

### Text Inputs
- Text input (`govuk-input`) - Single line text
- Text area (`govuk-textarea`) - Multi-line text
- Email address (`govuk-input`) - With email format validation
- Telephone number (`govuk-input`) - For phone numbers
- Number (`govuk-input`) - For numeric input

### Selection Inputs
- Radio buttons (`govuk-radios`) - Single selection from multiple options
- Checkboxes (`govuk-checkboxes`) - Multiple selections allowed
- Select dropdown (`govuk-select`) - Single selection from a dropdown list

### Special Inputs
- Date input (`govuk-date-input`) - For capturing dates with day/month/year fields
- File upload (`govuk-file-upload`) - For file attachments

## Project Structure

```
app/
├── assets/
│   ├── javascripts/
│   │   ├── modules/                   # Core reusable modules
│   │   │   ├── preview-manager.js     # Field preview with GDS markup
│   │   │   └── storage-manager.js     # Data persistence
│   │   ├── application.js             # Main application entry
│   │   ├── form-preview.js            # Form preview functionality
│   │   ├── options.js                 # Field options management
│   │   └── pages.js                   # Page management
│   └── sass/
│       ├── application.scss           # Main styles
│       └── legacy.scss                # Legacy support
├── views/
│   ├── includes/                      # Reusable view components
│   │   ├── _header.html               # Custom Defra header
│   │   ├── _footer.html               # Custom footer with docs
│   │   └── _option-list.html          # Field options template
│   ├── layouts/
│   │   └── main.html                  # Base layout template
│   ├── pages.html                     # Page list/summary
│   ├── page-create.html               # New page creation
│   ├── page-editor.html               # Page content editor
│   ├── question-editor.html           # Field configuration
│   ├── docs.html                      # Technical documentation
│   └── form-preview.html              # Complete form preview
└── routes.js                          # URL routing
```

## Key Routes

- `/pages` - Main page list and form summary
- `/page-create` - Create a new page
- `/page-editor/[pageId]` - Edit page and manage fields
- `/field-types?pageId=[pageId]` - Choose field type to add
- `/question-editor/new/[type]?pageId=[pageId]` - Create new field
- `/question-editor/[type]/[id]?pageId=[pageId]` - Edit existing field
- `/form-preview` - Preview complete form

## Browser Support

This tool uses modern JavaScript features and the localStorage API. It should work in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Built With

- [GOV.UK Prototype Kit](https://prototype-kit.service.gov.uk/docs/) - The web framework used
- [GOV.UK Design System](https://design-system.service.gov.uk/) - UI components and patterns
- [Node.js](https://nodejs.org/) - Runtime environment
- [Express](https://expressjs.com/) - Web application framework

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- GOV.UK Prototype Kit team
- GOV.UK Design System team
- Defra Digital team
