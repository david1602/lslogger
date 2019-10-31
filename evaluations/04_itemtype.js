const { generateTable, sort } = require('../utils');
const { round } = require('lodash');

module.exports = function(data) {
    const total = Object.keys(data.itemType).reduce((prev, key) => prev + data.itemType[key].length, 0);

    const result = Object.keys(data.itemType)
        .map(itemType => ({
            itemType,
            count: data.itemType[itemType].length,
            countLabel: `${data.itemType[itemType].length} (${round((data.itemType[itemType].length / total) * 100, 2)}%)`,
            averageTier: round(data.itemType[itemType].reduce((prev, curr) => prev + curr.tier, 0) / data.itemType[itemType].length, 4),
            averageQuality: round(data.itemType[itemType].reduce((prev, curr) => prev + curr.quality, 0) / data.itemType[itemType].length, 4)
        }))
        .sort(sort('count'));

    result.push({ itemType: 'Total', count: total, countLabel: `${total} (100%)` });

    const table = generateTable(
        ['itemType', 'countLabel', 'averageTier', 'averageQuality'],
        result,
        {
            itemType: 'Item Type',
            countLabel: 'Amount of spawns',
            averageTier: 'Average Tier',
            averageQuality: 'Average Quality'
        },
        'Item Types:'
    );

    return table;
};
