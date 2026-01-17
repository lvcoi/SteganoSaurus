# 🦕 SteganoSaurus

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![SolidJS](https://img.shields.io/badge/SolidJS-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

> Hide messages in plain sight with secure client-side steganography

SteganoSaurus is a powerful web-based steganography tool that allows you to encode and decode secret messages hidden within various digital formats. All processing happens directly in your browser - your data never leaves your device.

## ✨ Features

- 🎭 **Emoji Steganography** - Hide messages in emoji sequences using zero-width characters
- 🖼️ **Image Steganography** - Encode secret messages into images using LSB (Least Significant Bit) technique
- 📄 **PDF Steganography** - Conceal data within PDF documents
- 🏷️ **EXIF Data Manipulation** - Hide information in image metadata
- 🔒 **100% Client-Side** - No server processing, complete privacy
- 🎨 **Beautiful UI** - Modern, responsive design with Tailwind CSS
- ⚡ **Lightning Fast** - Built with Vite for optimal performance

## 📸 Screenshots

Add a screenshot or short GIF to showcase the UI. Place it at `docs/screenshot.png` (or update the path below).

![SteganoSaurus UI](docs/screenshot.png)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/SteganoSaurus.git
cd SteganoSaurus
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 📖 Usage

### Emoji Steganography
1. Type your secret message
2. Choose or enter cover emoji
3. Click "Encode" to hide your message
4. Share the encoded emoji - it looks normal!
5. Use "Decode" to reveal hidden messages

### Image Steganography
1. Upload an image file
2. Enter your secret message
3. Click "Encode" to hide the message in the image
4. Download the modified image
5. Use the "Decode" tab to extract messages from images

### PDF Steganography
1. Upload a PDF document
2. Add your hidden data
3. Encode and download the modified PDF
4. Decode to extract hidden information

### EXIF Data
1. Upload an image
2. Add custom metadata
3. Save the image with embedded EXIF data
4. View or extract EXIF information from any image

## 🛠️ Tech Stack

- **Frontend**: SolidJS with JavaScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide Solid
- **Maps**: Leaflet (EXIF GPS preview)
- **EXIF**: piexifjs
- **Database**: Supabase (optional, future features)

## 🔒 Security

- All steganography operations are performed client-side
- No data is transmitted to external servers
- Your messages and files remain private
- Uses industry-standard steganographic algorithms

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🧭 Roadmap

- Add drag-and-drop for image/PDF uploads
- Export/import presets for EXIF metadata
- Provide shareable, encrypted message bundles

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This tool is intended for educational and legitimate purposes only. Users are responsible for complying with applicable laws and regulations when using steganography techniques.

## 🙏 Acknowledgments

- [SolidJS](https://www.solidjs.com/) for the reactive UI library
- [Vite](https://vitejs.dev/) for the blazing fast build tool
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Lucide](https://lucide.dev/) for the beautiful icon set

---

<div align="center">
  Made with ❤️ by the SteganoSaurus team
</div>
