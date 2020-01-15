const { generateTable } = require('../utils');

module.exports = function(data) {
    const tableData = Object.keys(data.maxStat).map(stat => {
        Object.keys(data.maxStat[stat]).forEach(t => {
            // Set them to empty strings where we don't have values
            if (data.maxStat[stat][t] === -1) data.maxStat[stat][t] = '';
        });
        return Object.assign({ stat }, data.maxStat[stat]);
    });

    const table = generateTable(
        ['stat', 'overall', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
        tableData,
        {
            stat: 'Magical Stat',
            overall: 'Overall Max',
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
        'Max effect spawns by tier:'
    );

    return table;
};
