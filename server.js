const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const md5 = require('md5');
const sharp = require('sharp');
const app = express();

const PORT = 80;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    let url = req.query['url'];

    if (url === undefined) {
        returnError(url, res, 400);
        return;
    }

    (async () => {
        let hash = md5(url);
        let filename = `${hash}.jpg`
        let downloadPath = path.join(__dirname, `public/downloads/${filename}`);

        await downloadImage(url, downloadPath).then(() => {
            let maxRes = tryParseInt(req.query['maxRes'], 16000);
            let targetQuality = tryParseInt(req.query['quality'], 80);

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
                res.header('Content-Type', 'image/jpeg');
                let finalBuffer = Buffer.concat(tmpBuf);
                const img = sharp(finalBuffer);

                img.metadata().then((info) => {
                    if (info.width > maxRes || info.height > maxRes) {
                        // Downsample the image
                        img.resize(maxRes, maxRes, { fit: 'inside' });
                    }

                    img.jpeg({ quality: targetQuality });
                    img.pipe(res);
                    console.log(`Finished: ${url} => ${filename}`);
                })
                .catch((err) => {
                    console.log(err);
                    returnError(url, res, 500);
                });

            });
        }).catch(() => {
            returnError(url, res, 500);
        });
    })();
})

app.listen(PORT, () => {
    console.log(`Started server on port ${PORT}`);
});

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
    console.log(`Error: ${url} failed to load`);
    res.status(code).send();
}

function tryParseInt(value, defaultValue) {
    let val = parseInt(value);
    return (!isNaN(val)) ? val : defaultValue;
}
