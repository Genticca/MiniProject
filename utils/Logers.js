/**
 * LogsData.TaskLogs 및 LogsData.TaskLogDetail으로 로그 반환
 * @param {connect} connect mysql
 * @param {dayjs} date date
 * @param {Array} [col] 데이터 베이스에 넣을 열
 * @param {Array} [value] 데이터 베이스에 넣을 값
 */
var setLogs = async function(connect, code, workCode, [time = 0, insertRow = 0, updateRows = 0, resRows = 0]) {
    let insertNum = null;

    try {
        let [res] = await connect.query(`INSERT INTO LogsData.TaskLogs (Code, WorkCode, Time) VALUES (${code}, ${workCode}, ${time})`);
        insertNum = res.insertId;

        await connect.query(`INSERT INTO LogsData.TaskLogDetail (LogID, InsertRows, UpdateRows, ResRows) VALUES (${insertNum}, ${insertRow}, ${updateRows}, ${resRows})`);
    } catch (err) {
        console.error(err);
    }
}

module.exports = setLogs;