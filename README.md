# Defra Form Builder Tool

A form building tool built on the GOV.UK Prototype Kit that allows you to create and manage multi-page forms with various field types. Built with GDS design patterns and Defra styling.

## Features

- Create multi-page forms with an intuitive interface
- Support for multiple field types (text, textarea, radio, checkbox, select, date, etc.)
- Live preview of fields as you build them
- Form preview with Previous/Continue navigation
- Custom Defra-styled header
- Data persistence using localStorage
- Full GDS component styling

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
4. Configure each field's settings and preview how it will look
5. Return to the Pages List to manage your pages
6. Use the "Preview form" button to see your complete form

## Field Types Available

### Text Inputs
- Text input - Single line text
- Text area - Multi-line text
- Email address - With email format validation
- Telephone number - For phone numbers
- Number - For numeric input

### Selection Inputs
- Radio buttons - Single selection from multiple options
- Checkboxes - Multiple selections allowed
- Select dropdown - Single selection from a dropdown list

### Special Inputs
- Date input - For capturing dates
- File upload - For file attachments

## Project Structure

```
app/
├── assets/
│   ├── javascripts/
│   │   ├── application.js
│   │   ├── form-preview.js
│   │   ├── options.js
│   │   └── pages.js
│   └── sass/
│       ├── application.scss
│       └── legacy.scss
├── views/
│   ├── includes/
│   │   ├── _header.html
│   │   └── _option-list.html
│   ├── layouts/
│   │   └── main.html
│   ├── pages.html
│   ├── page-create.html
│   ├── page-editor.html
│   ├── question-editor.html
│   └── form-preview.html
└── routes.js
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
