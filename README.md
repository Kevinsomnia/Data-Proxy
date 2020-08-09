## Data Proxy
This acts as a Node.js proxy server that automatically rehosts and forwards data to the client.

Requires Node.js

## Limitations
- Only HTTP server support.
- Only returns JPEG images.

## Roadmap
- Support for common image types other than JPG. PNG transparency support.
- Support for binary data such as audio files.
- Automatically remove stale files (default to 24 hours).

## Installation
- Clone repo
- Install packages: `npm install`
- Run: `node server.js`

## Usage
- Required parameters:
  - `url`: String - Takes in an escaped URL to the target data endpoint.
- Optional parameters:
  - `maxRes`: Integer - Takes in a positive integer that represents the maximum resolution. If either dimension of the image is higher than this value, the response will be downsampled to this value while preserving it's aspect ratio.
    - Default: `16000`
  - `quality`: Integer - Takes in a integer within the range [1, 100] which denotes the compression quality of the image. Lower values will result in lower quality images, but much smaller file sizes.
    - Default: `80`

Example:
- `http://127.0.0.1/?url=https://link.to/image.jpg&maxRes=1920&quality=75`
