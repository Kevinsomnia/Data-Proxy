## Data Proxy
This acts as a Node.js proxy server that automatically rehosts and forwards data to the client. Requested file data is stored in `/public/downloads`.

Features:
- URLs to PNG files will respond with PNG format, otherwise it will use JPG for all other formats.

Requires Node.js

## Limitations
- Only HTTP server support.
- Only tested with JPGs and transparent PNGs. Other image file types may or may not work.

## Roadmap
- Support for binary data such as audio files.
- Automatically remove stale files (default to 24 hours).

## Installation
- Clone repo
- Install packages: `npm install`
- Run: `node server.js`

## Usage
- Required parameters:
  - `url`: String - Takes in an escaped URL to the target data endpoint.
- Image parameters (optional):
  - `maxRes`: Integer - Takes in a positive integer that represents the maximum resolution. If either dimension of the image is higher than this value, the response will be downsampled to this value while preserving it's aspect ratio.
    - Default: `16000`
  - `quality`: Integer - Takes in a integer within the range [1, 100] which denotes the compression quality of the image. Lower values will result in lower quality images, but much smaller file sizes. This option is only applicable to non-PNG files.
    - Default: `80`
  - `enforceJPEG`: Key - Doesn't take a value. If present in the URL, it will enforce returning a JPEG response regardless of file type.

Examples:
- `http://127.0.0.1/?url=https://link.to/image.jpg&maxRes=1920&quality=75`
- `http://127.0.0.1/?url=https://link.to/transparent.png&enforceJPEG`
