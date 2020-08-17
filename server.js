const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const md5 = require('md5');
const sharp = require('sharp');
const { strategy } = require('sharp');
const app = express();

const PORT = 80;

// Disable image operation caching for lower memory footprint.
sharp.cache(false);

// Auto create the public/downloads folder used for cache.
if (!fs.existsSync(path.join(__dirname, 'public', 'downloads'))) {
    fs.mkdirSync(path.join(__dirname, 'public', 'downloads'), { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    let url = req.query['url'];

    if (url === undefined) {
        returnError(url, res, 400);
        return;
    }

    (async () => {
        let extension = getFileExtension(url).toLowerCase();
        let downloadPath = path.join(__dirname, `public/downloads/${md5(url)}`);

        if (isSupportedImageExtension(extension)) {
            await downloadImage(url, downloadPath).then(() => {
                handleImageResponse(url, req, res, extension, downloadPath);
            }).catch((e) => {
                console.log(e);
                returnError(url, res, 500);
            });
        }
        else {
            // Unsupported file type.
            returnError(url, res, 400);
        }
    })();
})

app.listen(PORT, () => {
    console.log(`Started server on port ${PORT}`);
});

function handleImageResponse(url, req, res, extension, downloadPath) {
    let maxRes = tryParseInt(req.query['maxRes'], 16000);
    let targetQuality = tryParseInt(req.query['quality'], 80);
    let enforceJPEG = req.query.hasOwnProperty('enforceJPEG');

    if (targetQuality < 1 || targetQuality > 100) {
        returnError(url, res, 400);
        return;
    }

    let tmpBuf = [];
    const reader = fs.createReadStream(downloadPath);

    reader.on('data', (d) => {
        tmpBuf.push(d);
    });

    reader.on('error', (err) => {
        console.log(`Reader error: ${err}`);
        returnError(url, res, 500);
    });

    reader.on('end', () => {
        res.header('Cache-Control', 'public, max-age=31557600');
        let finalBuffer = Buffer.concat(tmpBuf);
        const img = sharp(finalBuffer);

        img.metadata().then((info) => {
            if (info.width > maxRes || info.height > maxRes) {
                // Downsample the image
                img.resize(maxRes, maxRes, { fit: 'inside' });
            }
            
            if (enforceJPEG || extension == 'jpg') {
                res.header('Content-Type', 'image/jpeg');
                img.jpeg({ quality: targetQuality });
            }
            else if (extension == 'png') {
                res.header('Content-Type', 'image/png');
                img.png();
            }
            else {
                returnError(url, res, 500);
                return;
            }

            img.pipe(res);
            console.log(`Finished: ${url}`);
        })
        .catch((err) => {
            console.log(err);
            returnError(url, res, 500);
        });
    });
}

async function downloadImage(url, path) {
    if (!fs.existsSync(path)) {
        // Start downloading original file and store to disk.
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        if (response.status != 200) {
            return new Promise((_, reject) => reject());
        }
    
        const writer = fs.createWriteStream(path);
        response.data.pipe(writer);
        
        // Return promise that writes to the target file.
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve())
            writer.on('error', e => {
                reject(e);
            });
        });
    }
    else {
        return new Promise((resolve) => resolve());
    }
}

function returnError(url, res, code) {
    console.log(`Error: ${url} failed to load (code ${code})`);
    res.status(code).send();
}

function tryParseInt(value, defaultValue) {
    let val = parseInt(value);
    return (!isNaN(val)) ? val : defaultValue;
}

function getFileExtension(str) {
    // Efficient way to get file extension: https://stackoverflow.com/a/12900504
    return str.slice((str.lastIndexOf('.') - 1 >>> 0) + 2);
}

function isSupportedImageExtension(ext) {
    // Extension should be lowercase.
    return (ext == 'png' || ext == 'jpg');
}
