const express = require('express');
const bodyParser = require('body-parser');
const wrapCatch = require('express-catch');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const { getItemList } = require('./utils');

const PORT = 8000;

if (!fs.existsSync('data')) fs.mkdirSync('data');

const fname = () => crypto.randomBytes(32).toString('hex');

const writeData = data => {
    const name = fname();

    fs.writeFileSync(path.resolve('data', name), JSON.stringify(data, null, 4));
};

const server = express();

const middleware = async function(req, res, next) {
    res.set({
        'Access-Control-Allow-Origin': [req.get('origin')],
        'Access-Control-Allow-Credentials': true,
        'Access-Control-Allow-Headers': 'access-control-allow-origin, Content-Type, x-frame-options'
    });
    if (req.method.toLowerCase() === 'options') {
        res.status(200).end();
        return;
    }

    return next();
};

const init = async function() {
    server.use(bodyParser.json({ limit: '5mb' }));
    const router = wrapCatch(server);

    server.use(middleware);

    router.get('/data', async function(req, res) {
        const items = getItemList();

        const style = `<style>table, th, td {border: 1px solid black;}</style>`;

        const tables = fs
            .readdirSync('evaluations')
            .sort()
            .map(file => require(path.resolve('evaluations', file))(items));

        res.send(`${style}${tables.join('<br><br>')}`);
    });

    router.post('/data', async function(req, res) {
        console.log(req.body);
        writeData(req.body);
        res.json({ n: 1 });
    });

    https
        .createServer(
            {
                key: fs.readFileSync('/certs/privkey1.pem'),
                cert: fs.readFileSync('/certs/cert1.pem'),
                ca: fs.readFileSync('/certs/chain1.pem')
            },
            server
        )
        .listen(PORT, () => {
            console.log(`Listening to port ${PORT}`);
        });
    // server.listen(PORT);
};

init();
