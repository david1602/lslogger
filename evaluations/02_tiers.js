const { generateTable, sort } = require('../utils');
const { round } = require('lodash');

module.exports = function(data) {
    const resultTiers = Object.keys(data.tiers).reduce((obj, key) => {
        obj[key] = {
            count: data.tiers[key].length,
            average: data.tiers[key].reduce((prev, curr) => prev + curr) / data.tiers[key].length
        };
        return obj;
    }, {});

    const totalTiers = Object.keys(resultTiers).reduce((prev, tier) => prev + data.tiers[tier].length, 0);

    const tierTable = generateTable(
        ['tier', 'countLabel', 'average'],
        Object.keys(resultTiers)
            .map(tier => ({
                tier,
                count: resultTiers[tier].count,
                countLabel: `${resultTiers[tier].count} (${round((resultTiers[tier].count / totalTiers) * 100, 2)}%)`,
                average: round(resultTiers[tier].average, 4)
            }))
            .sort(sort('count'))
            .concat({
                tier: 'Total',
                countLabel: `${totalTiers} (100%)`,
                average: ''
            }),
        {
            tier: 'Item Tier',
            countLabel: 'Amount of spawns',
            average: 'Average Quality'
        },
        'Item Tiers:'
    );

    return tierTable;
};
