const fs = require('fs');
const path = require('path');

exports.getItemList = function(filterFn) {
    const files = fs.readdirSync(path.resolve('data'));

    const agg = {};

    files.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.resolve('data', file), { encoding: 'utf-8' }));

        content.forEach(item => {
            const { ts } = item;

            if (!agg[ts]) agg[ts] = [];

            const exists = agg[ts].find(a => Object.keys(a.stats).every(key => a.stats[key] === item.stats[key]));

            if (!exists) agg[ts].push(item);
        });
    });

    let data = Object.keys(agg).reduce((prev, key) => prev.concat(agg[key]), []);

    if ('function' === typeof filterFn) {
        data = data.filter(filterFn);
    }

    const condensedData = data.reduce(
        (agg, item) => {
            // Log stats
            Object.keys(item.stats).forEach(stat => {
                if (!agg.stats[stat]) agg.stats[stat] = [];

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
        { stats: {}, tiers: {}, quality: {}, itemType: {}, category: {} }
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
