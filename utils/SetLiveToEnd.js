const setLogs = require('./Logers.js');

var setLiveToEnd = async function(connect, date) {
    let result = [];
    let start = process.hrtime();

    try {
        let [rows, fields] = await connect.query(`SELECT idx, id, startDate FROM LiveStreams.CurrentStreams WHERE endDate IS NULL ORDER BY ID`);

        for(let row of rows) {
            result.push([
                row.idx,
                row.id,
                date.getDateTime(row.startDate),
            ])
        }
    } catch (err) {
        console.error(err);
    }

    try {
        let [res, fields] = await connect.query(`INSERT INTO StreamDate.${date.getMinusDay()} (idx, id, startDate) VALUES ?`, [result]);
        await setLogs(connect, 0, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, 0, res.affectedRows]);
    } catch (err) {
        console.error(err);
    }
}

module.exports = setLiveToEnd;