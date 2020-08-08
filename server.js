const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const md5 = require('md5');
const app = express();

const PORT = 80;
const STALE_CHECK_INTERVAL = 3600000;   // every hour.

app.use(express.static(path.join(__dirname, 'public')));
deleteStaleImages();

app.get('/', (req, res) => {
    if (req.query.hasOwnProperty('url')) {
        (async () => {
            let url = req.query['url'];
            let hash = md5(url);
            let downloadPath = path.join(__dirname, `public/downloads/${hash}.jpg`);

            await downloadImage(url, downloadPath).then(() => {
                res.sendFile(downloadPath);
                console.log(`Download finished for ${url}! Sent file: ${downloadPath}`);
            }).catch(() => {
                console.log(`Error: ${url} failed to load`);
                res.status(500).send();
            });
        })();
    }
    else {
        res.status(400).send();
    }
})

app.listen(PORT, () => {
    console.log(`Started server on port ${PORT}`);
});

async function downloadImage (url, path) {
    if (!fs.existsSync(path)) {
        // Start downloading.
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

function deleteStaleImages() {
    setTimeout(deleteStaleImages, STALE_CHECK_INTERVAL);
    console.log("running stale check");
}
