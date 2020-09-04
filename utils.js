const fs = require('fs');
const path = require('path');

const archive = [];

const fileLoaded = {};

{
    const files = fs.readdirSync(path.resolve('archivedata'));

    const agg = {};

    files.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.resolve('archivedata', file), { encoding: 'utf-8' }));

        content.forEach(item => {
            const { ts } = item;

            if (!agg[ts]) agg[ts] = [];

            const exists = agg[ts].find(a => Object.keys(a.stats).every(key => a.stats[key] === item.stats[key]));

            if (!exists) agg[ts].push(item);
        });
    });

    Object.keys(agg)
        .reduce((prev, key) => prev.concat(agg[key]), [])
        .forEach(v => archive.push(v));
}
// fs.writeFileSync('data.json', JSON.stringify(archive, null, 4));

exports.getItemList = function (filterFn) {
    const files = fs.readdirSync(path.resolve('data'));

    const agg = {};
    let data = [];


    files.forEach(file => {
        if (fileLoaded[file]) return;


        const content = JSON.parse(fs.readFileSync(path.resolve('data', file), { encoding: 'utf-8' }));

        content.forEach(item => {
            const { ts } = item;

            if (!agg[ts]) agg[ts] = [];

            const exists = agg[ts].find(a => Object.keys(a.stats).every(key => a.stats[key] === item.stats[key]));

            if (!exists) {
                agg[ts].push(item);
                data.push(item);
            }
        });

        fileLoaded[file] = true;
    });

    // const keys = Object.keys(agg);
    // let data = [];

    // keys.forEach(k => agg[k].forEach(r => data.push(r)));

    // let data = Object.keys(agg).reduce((prev, key) => prev.concat(agg[key]), []);

    data.forEach(r => archive.push(r));

    data = archive;

    if ('function' === typeof filterFn) {
        data = data.filter(filterFn);
    }

    const condensedData = data.reduce(
        (agg, item) => {
            // Log stats
            Object.keys(item.stats).forEach(stat => {
                if (!agg.stats[stat]) agg.stats[stat] = [];

                // Max stat by tier
                if (!agg.maxStat[stat])
                    agg.maxStat[stat] = {
                        overall: -1,
                        1: -1,
                        2: -1,
                        3: -1,
                        4: -1,
                        5: -1,
                        6: -1,
                        7: -1,
                        8: -1,
                        9: -1,
                        10: -1,
                        11: -1,
                        12: -1,
                        13: -1,
                        14: -1
                    };

                const statValue = item.stats[stat];

                // If the cached value (initialized at -1)
                // is smaller than the current stat, it's a new maximum for that tier
                if (agg.maxStat[stat][item.tier] < statValue) agg.maxStat[stat][item.tier] = statValue;

                // Same for the overall
                if (agg.maxStat[stat].overall < statValue) agg.maxStat[stat].overall = statValue;

                agg.stats[stat].push(item.stats[stat]);
            });
            // Log tiers
            if (!agg.tiers[item.tier]) agg.tiers[item.tier] = [];
            // Actually just write the quality to the array so we can do an average quality by tier
            agg.tiers[item.tier].push(item.quality);

            // Log item types
            if (!agg.itemType[item.itemType]) agg.itemType[item.itemType] = [];

            // push the tier and quality since that's averages that can be pulled
            agg.itemType[item.itemType].push({
                tier: item.tier,
                quality: item.quality
            });

            if (['warhammer', 'spear', 'longsword', 'battleaxe', 'polearm'].includes(item.itemType)) item.category = 'Heavy Weapons';

            // Log categories
            if (!agg.category[item.category]) agg.category[item.category] = [];

            // push the tier and quality since that's averages that can be pulled
            agg.category[item.category].push({
                tier: item.tier,
                quality: item.quality
            });

            if (!agg.quality[item.quality]) agg.quality[item.quality] = [];

            agg.quality[item.quality].push(item.tier);

            return agg;
        },
        { stats: {}, tiers: {}, quality: {}, itemType: {}, category: {}, maxStat: {} }
    );

    return condensedData;
};

exports.generateTable = (keys, arr, labelMap, title) => {
    return `
    <h2>${title}</h2>
    <table>
        <thead>
            <tr>
                ${keys.map(key => `<td>${labelMap[key]}</td>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${arr.map(record => `<tr>${keys.map(key => `<td>${record[key] || ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
    </table>`;
};

exports.sort = prop => (a, b) => {
    if (a[prop] < b[prop]) return 1;
    if (a[prop] > b[prop]) return -1;
    return 0;
};

exports.formatTime = ms => {
    let seconds = parseInt(ms / 1000, 10);

    const hours = parseInt(seconds / 3600, 10);

    seconds = seconds - hours * 3600;

    const minutes = parseInt(seconds / 60, 10);

    seconds = seconds - minutes * 60;

    const lpad = n => `${n < 10 ? '0' : ''}${n}`;

    return `${lpad(hours)}:${lpad(minutes)}:${lpad(seconds)}`;
};