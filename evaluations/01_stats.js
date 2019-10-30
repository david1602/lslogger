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
        ['stat', 'count', 'average', 'max'],
        Object.keys(resultStats)
            .map(stat => ({
                stat: stat || 'Quantity',
                count: resultStats[stat].count,
                average: round(resultStats[stat].average, 4),
                max: resultStats[stat].max
            }))
            .sort(sort('count'))
            .concat({ stat: 'Total', count: totalStats, average: '', max: '' }),
        {
            stat: 'Item stat',
            count: 'Amount of spawns',
            average: 'Average roll',
            max: 'Max Roll'
        },
        'Item Stats:'
    );

    return statTable;
};
