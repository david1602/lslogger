const { generateTable, sort } = require('../utils');
const { round } = require('lodash');

const qualities = ['Wellable / Clean', 'Magical', 'Rare', 'Mystical', 'Angelic', 'Mythical', 'Arcane', 'Legendary', 'Godly', 'Epic', 'Relic', 'Artifact', 'Unique'];

module.exports = function(data) {
    const total = Object.keys(data.quality).reduce((prev, key) => prev + data.quality[key].length, 0);

    const result = Object.keys(data.quality)
        .map(quality => ({
            quality: qualities[quality],
            count: data.quality[quality].length,
            countLabel: `${data.quality[quality].length} (${round((data.quality[quality].length / total) * 100, 2)}%)`,
            averageTier: round(data.quality[quality].reduce((prev, curr) => prev + curr, 0) / data.quality[quality].length, 4)
        }))
        .sort(sort('count'));

    result.push({ quality: 'Total', count: total, countLabel: `${total} (100%)` });

    const table = generateTable(
        ['quality', 'countLabel', 'averageTier', 'averageQuality'],
        result,
        {
            quality: 'Item Quality',
            countLabel: 'Amount of spawns',
            averageTier: 'Average Tier',
            averageQuality: 'Average Quality'
        },
        'Quality:'
    );

    return table;
};
