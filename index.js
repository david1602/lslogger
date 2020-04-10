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
        const { query } = req;

        const filterFn = value => {
            const conditions = [];

            if (query.minlevel) conditions.push(value.charLevel >= parseInt(query.minlevel, 10));
            if (query.maxlevel) conditions.push(value.charLevel <= parseInt(query.maxlevel, 10));

            if (conditions.length === 0) return true;

            return conditions.every(cond => !!cond);
        };

        const items = getItemList(filterFn);

        const style = `<style>table, th, td {border: 1px solid black;}</style>`;

        const tables = fs
            .readdirSync('evaluations')
            .sort()
            .map(file => require(path.resolve('evaluations', file))(items));

        res.send(`${style}${tables.join('<br><br>')}`);
    });

    router.get('/list', async function(req, res) {
        if (!fs.existsSync('list.txt')) {
            res.status(404).send('Could not find the sale list.');
            return;
        }

        const list = fs.readFileSync('list.txt', { encoding: 'utf-8' });
        res.send(`<pre>
${list}
</pre>`);
    });

    router.post('/data', async function(req, res) {
        // console.log(req.body);
        writeData(req.body);
        res.json({ n: 1 });
    });

    https
        .createServer(
            {
                key: fs.readFileSync('/certs/privkey3.pem'),
                cert: fs.readFileSync('/certs/cert3.pem'),
                ca: fs.readFileSync('/certs/chain3.pem')
            },
            server
        )
        .listen(PORT, () => {
            console.log(`Listening to port ${PORT}`);
        });
    // server.listen(PORT);
};

init();
