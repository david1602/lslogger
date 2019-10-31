const { generateTable, sort } = require('../utils');
const { round } = require('lodash');

module.exports = function(data) {
    const total = Object.keys(data.category).reduce((prev, key) => prev + data.category[key].length, 0);

    const resultCategories = Object.keys(data.category)
        .map(category => ({
            category,
            count: data.category[category].length,
            countLabel: `${data.category[category].length} (${round((data.category[category].length / total) * 100, 2)}%)`,
            averageTier: round(data.category[category].reduce((prev, curr) => prev + curr.tier, 0) / data.category[category].length, 4),
            averageQuality: round(data.category[category].reduce((prev, curr) => prev + curr.quality, 0) / data.category[category].length, 4)
        }))
        .sort(sort('count'));

    resultCategories.push({ category: 'Total', count: total, countLabel: `${total} (100%)` });

    const table = generateTable(
        ['category', 'countLabel', 'averageTier', 'averageQuality'],
        resultCategories,
        {
            category: 'Item Category',
            countLabel: 'Amount of spawns',
            averageTier: 'Average Tier',
            averageQuality: 'Average Quality'
        },
        'Item Categories:'
    );

    return table;
};
