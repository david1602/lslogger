const { generateTable, sort } = require('../utils');
const { round } = require('lodash');

module.exports = function(data) {
    const resultStats = Object.keys(data.stats).reduce((obj, key) => {
        obj[key] = {
            count: data.stats[key].length,
            average: data.stats[key].reduce((prev, curr) => prev + curr) / data.stats[key].length,
            max: data.stats[key].reduce((prev, curr) => (prev > curr ? prev : curr))
        };
        return obj;
    }, {});

    const totalStats = Object.keys(resultStats).reduce((prev, curr) => prev + resultStats[curr].count, 0);

    const statTable = generateTable(
        ['stat', 'countLabel', 'average', 'max'],
        Object.keys(resultStats)
            .map(stat => ({
                stat: stat || 'Quantity',
                count: resultStats[stat].count,
                countLabel: `${resultStats[stat].count} (${round((resultStats[stat].count / totalStats) * 100, 2)}%)`,
                average: round(resultStats[stat].average, 4),
                max: resultStats[stat].max
            }))
            .sort(sort('count'))
            .concat({ stat: 'Total', count: totalStats, countLabel: `${totalStats} (100%)`, average: '', max: '' }),
        {
            stat: 'Item stat',
            countLabel: 'Amount of spawns',
            average: 'Average roll',
            max: 'Max Roll'
        },
        'Item Stats:'
    );

    return statTable;
};
