const express = require('express');
const bodyParser = require('body-parser');
const wrapCatch = require('express-catch');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const https = require('https');
const { getItemList, generateTable, formatTime } = require('./utils');

const PORT = 8000;

if (!fs.existsSync('data')) fs.mkdirSync('data');

const fname = () => crypto.randomBytes(32).toString('hex');

const writeData = data => {
    const name = fname();

    fs.writeFileSync(path.resolve('data', name), JSON.stringify(data, null, 4));
};

if (!fs.existsSync('skilldata')) fs.mkdirSync('skilldata');

const skillFiles = fs.readdirSync('skilldata');

if (skillFiles.length > 0) {
    let aggData = [];

    skillFiles.forEach(filet => {
        const fPath = path.resolve('skilldata', filet);
        const content = fs.readFileSync(fPath, { encoding: 'utf-8' });
        fs.unlinkSync(fPath);

        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) aggData = aggData.concat(parsed);
        else aggData.push(parsed);
    });

    fs.writeFileSync(path.resolve('skilldata', '0'), JSON.stringify(aggData, null, 4));
}

// Read here again, since it should be fewer after cleaning up
let currentSkillNumber = fs.readdirSync('skilldata').length;

const writeSkill = body => {
    if (body && body.item && body.item.item) {
        body.item.item[8] = null;
    }
    fs.writeFileSync(path.resolve('skilldata', `${currentSkillNumber++}`), JSON.stringify(body, null, 4));
}


const server = express();

const middleware = async function (req, res, next) {
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

const init = async function () {
    server.use(bodyParser.json({ limit: '5mb' }));
    const router = wrapCatch(server);

    server.use(middleware);

    router.get('/data', async function (req, res) {
        const { query } = req;

        const filterFn = value => {
            const conditions = [];

            if (query.minlevel) conditions.push(value.charLevel >= parseInt(query.minlevel, 10));
            if (query.maxlevel) conditions.push(value.charLevel <= parseInt(query.maxlevel, 10));

            if (conditions.length === 0) return true;

            return conditions.every(cond => !!cond);
        };

        const items = getItemList(filterFn);

        const style = `<style>
        th, td {
            border: 1px solid black;
            padding: 5px;
        }

        table {
            border-collapse: collapse;
        }
        </style>`;

        const tables = fs
            .readdirSync('evaluations')
            .sort()
            .map(file => require(path.resolve('evaluations', file))(items));

        res.send(`${style}${tables.join('<br><br>')}`);
    });

    router.post('/data', async function (req, res) {
        // console.log(req.body);
        writeData(req.body);
        res.json({ n: 1 });
    });

    router.post('/skill', async function (req, res) {
        const { body } = req;

        writeSkill(body);

        res.json({ success: true });
    });

    router.get('/skill', async function (req, res) {
        const skillFiles = fs.readdirSync('skilldata');


        if (skillFiles.length > 0) {
            let aggData = [];

            const SUM = arr => arr.reduce((prev, curr) => prev + curr, 0);
            const AVG = arr => SUM(arr) / arr.length;

            skillFiles.forEach(filet => {
                const fPath = path.resolve('skilldata', filet);
                const content = fs.readFileSync(fPath, { encoding: 'utf-8' });

                const parsed = JSON.parse(content);

                if (Array.isArray(parsed)) aggData = aggData.concat(parsed);
                else aggData.push(parsed);
            });

            const dataBasis = aggData.reduce((agg, record) => {
                const { char, item, duration, profs, skillType } = record;
                const { tier, quality, itemType, category, stats } = item;

                if (!agg[char]) agg[char] = {};

                if (!agg[char][skillType]) agg[char][skillType] = {
                    duration: { overall: [] },
                    profs: { overall: [] },
                    quality: { overall: [] },
                    itemCount: { overall: 0 }
                };

                const obj = agg[char][skillType];

                const initProp = (prop, value) => {
                    if (!obj[prop][tier]) obj[prop][tier] = [];
                    obj[prop][tier].push(value);
                    obj[prop].overall.push(value);
                }

                if (duration) initProp('duration', duration);
                if (profs) initProp('profs', profs);
                if (quality) initProp('quality', quality);

                if (!obj.itemCount[tier]) obj.itemCount[tier] = 0;

                obj.itemCount[tier]++;
                obj.itemCount.overall++;


                return agg;
            }, {})

            const style = `<style>
            th, td {
                border: 1px solid black;
                padding: 5px;
            }

            table {
                border-collapse: collapse;
            }
            </style>`;

            const chars = Object.keys(dataBasis);

            const tables = [];

            chars.forEach(char => {
                tables.push(`<h1>${char}</h1>`)

                const skills = Object.keys(dataBasis[char]);

                skills.forEach(skill => {
                    // Handle duration
                    const durationTiers = Object.keys(dataBasis[char][skill].duration).reduce((prev, tier) => {
                        prev[tier] = formatTime(SUM(dataBasis[char][skill].duration[tier]))
                        return prev;
                    }, { title: 'Total duration' })

                    const avgDurationTiers = Object.keys(dataBasis[char][skill].duration).reduce((prev, tier) => {
                        prev[tier] = formatTime(AVG(dataBasis[char][skill].duration[tier]))
                        return prev;
                    }, { title: 'Average duration' })


                    // Handle profs
                    const profsTiers = Object.keys(dataBasis[char][skill].profs).reduce((prev, tier) => {
                        prev[tier] = SUM(dataBasis[char][skill].profs[tier])
                        return prev;
                    }, { title: 'Total profs' })

                    const avgProfsTiers = Object.keys(dataBasis[char][skill].profs).reduce((prev, tier) => {
                        prev[tier] = AVG(dataBasis[char][skill].profs[tier]).toFixed(2)
                        return prev;
                    }, { title: 'Average profs' })

                    // Handle quality
                    const avgQualityTiers = Object.keys(dataBasis[char][skill].quality).reduce((prev, tier) => {
                        prev[tier] = AVG(dataBasis[char][skill].quality[tier]).toFixed(2)
                        return prev;
                    }, { title: 'Average Quality' })

                    // Item count
                    const itemCount = Object.keys(dataBasis[char][skill].itemCount).reduce((prev, tier) => {
                        prev[tier] = dataBasis[char][skill].itemCount[tier]
                        return prev;
                    }, { title: 'Item Count' })


                    // Handle count

                    tables.push(generateTable(
                        ['title', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', 'overall'],
                        [
                            durationTiers, avgDurationTiers, profsTiers, avgProfsTiers, avgQualityTiers, itemCount
                        ],
                        {
                            title: '',
                            overall: 'Overall',
                            1: 'I (1)',
                            2: 'II (2)',
                            3: 'III (3)',
                            4: 'IV (4)',
                            5: 'V (5)',
                            6: 'VI (6)',
                            7: 'VII (7)',
                            8: 'VIII (8)',
                            9: 'IX (9)',
                            10: 'X (10)',
                            11: 'XI (11)',
                            12: 'XII (12)',
                            13: 'XIII (13)',
                            14: 'XIV (14)'
                        },
                        skill

                    ))


                })

            })

            res.send(`${style}${tables.join('<br>')}
            
            <br><br><pre>${JSON.stringify(dataBasis, null, 4)}</pre>`);

            return;
        }

        res.send('There is no data available.');
    })

    server.use('/pics', express.static('pics'));

    router.get('/mobs', async function (req, res) {
        const file = fs.readFileSync('./index.html', { encoding: 'utf-8' });

        res.send(file);
    })

    // https
    //     .createServer(
    //         {
    //             key: fs.readFileSync('/certs/privkey3.pem'),
    //             cert: fs.readFileSync('/certs/cert3.pem'),
    //             ca: fs.readFileSync('/certs/chain3.pem')
    //         },
    //         server
    //     )
    //     .listen(PORT, () => {
    //         console.log(`Listening to port ${PORT}`);
    //     });
    server.listen(PORT, function () {
        console.log(`Listening to port ${PORT}`);
    });
};

init();
