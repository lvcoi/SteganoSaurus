# SteganoSaurus - Copilot Instructions

## Project Overview

SteganoSaurus is a client-side steganography web application that enables users to hide and reveal secret messages in various formats including emoji, images, PDFs, and EXIF metadata. All processing happens in the browser for maximum privacy and security.

## Tech Stack

- **Framework**: SolidJS (reactive UI library)
- **Language**: JavaScript (JSX)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide Solid
- **Libraries**: piexifjs (EXIF manipulation), Leaflet (map display), @supabase/supabase-js

## Code Style & Conventions

- Use functional components with SolidJS signals for state management
- Follow SolidJS best practices: `createSignal`, `onMount`, `onCleanup`, etc.
- Use JSX syntax for component templates
- Prefer arrow functions for component definitions
- Use const for immutable values, let for reassignments
- Follow the existing code formatting style (2-space indentation)
- Use descriptive variable names (e.g., `encodeEmojiMessage`, `decodeBinaryFromEmoji`)
- Keep components modular and focused on single responsibilities

## File Organization

- `/src/App.jsx` - Main application with tab navigation
- `/src/components/` - Feature components (EmojiSteganography, ImageSteganography, PdfSteganography, ExifSteganography)
- `/src/utils/` - Utility functions and helpers
- Component files should use PascalCase naming (e.g., `EmojiSteganography.jsx`)
- Utility files should use camelCase naming (e.g., `logger.js`)

## Build & Development

- **Development server**: `npm run dev` (starts Vite dev server on port 5173)
- **Production build**: `npm run build` (outputs to `/dist`)
- **Linting**: `npm run lint` (uses ESLint with @eslint/js)
- **Preview production build**: `npm run preview`

## Security Considerations

- All steganography operations MUST be performed client-side only
- Never transmit sensitive data to external servers
- Use secure encoding/decoding algorithms
- Validate all user inputs before processing
- Handle errors gracefully and provide clear user feedback
- Be cautious with file uploads and ensure proper validation
- Use the custom error event system: `window.dispatchEvent(new CustomEvent('steg:error', { detail: { message } }))`

## Component Structure

Each steganography feature component should follow this pattern:
- Use `createSignal` for local state (mode, inputs, outputs, loading states)
- Implement encode and decode functionality separately
- Provide clear UI feedback during processing
- Handle errors with the global error handler
- Use lazy loading for better performance (see App.jsx)
- Include copy-to-clipboard functionality where appropriate

## Styling Guidelines

- Use Tailwind CSS utility classes for styling
- Follow the existing dark theme color scheme (slate/blue gradients)
- Maintain responsive design principles
- Use consistent spacing and padding
- Apply hover effects and transitions for better UX
- Ensure accessibility (proper contrast, keyboard navigation)

## Testing & Validation

- Test all steganography operations with various input sizes
- Verify encoding/decoding round-trips preserve original data
- Test edge cases (empty inputs, large files, special characters)
- Validate browser compatibility
- Ensure error handling works correctly
- Test the client-side only requirement (no network calls for steg operations)

## Dependencies Management

- Keep dependencies up to date but test thoroughly before upgrading
- Avoid adding unnecessary dependencies
- Prefer lightweight libraries
- Document any new dependencies and their purpose

## Documentation

- Update README.md when adding new features
- Include JSDoc comments for complex functions
- Provide clear error messages for users
- Document any cryptographic or encoding algorithms used
