const setLogs = require('../utils/Logers.js');

/**
 * Date_YYYYMMDD에 새로운 데이터 기입
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {StreamRawData} stream 실시간 방송 정보 변수 기입
 * @param {DateManger} date DateManger 기입
 */
var setRawStreamData = async function(connect, stream, date) {
    // 수집된 데이터를 테이블에 저장
    let start = process.hrtime();
    let result = [], ids = new Map();

    try {
        // 현재 방송 중인 데이터를 ID를 기준으로 정렬하여 조회
        let [rows, fields] = await connect.query(`SELECT idx, id, startDate FROM LiveStreams.CurrentStreams WHERE endDate IS NULL ORDER BY ID`);
        
        // 비교를 위하여 Map에 대입
        for(let row of rows) {
            ids.set(row.id, {
                idx : row.idx,
                startDate : date.getDateTime(row.startDate),
            });
        }
    } catch (err) {
        console.error(date.getNewDate());
        console.error(err);
    }

    for(let data of stream) {
        // 수집된 데이터 ID와 저장된 데이터 ID를 Map 내장 함수 has를 이용하여 여부 확인
        if(ids.has(data.id)) {
            let selectDate = ids.get(data.id);

            // 수집된 데이터와 저장된 데이터의 방송 시작 일시가 똑같으면 result 대입
            if(date.getSame(data.startDate, selectDate.startDate)) {
                result.push([
                    selectDate.idx,
                    data.id,
                    data.gameId,
                    data.viewer,
                ])
            } else {
                console.error(date.getNewDate());
                console.error(`등록되지 않은 값 : ${data.id}, ${data.startDate}`);
            }
        } else {
            console.error(date.getNewDate());
            console.error(`등록되지 않은 값 : ${data.id}, ${data.startDate}`);
        }
    }

    if(result.length > 0) {
        try {
            let [res, fields] = await connect.query(`INSERT INTO StreamRawData.${date.getDatabaseDate()} (EndDateID, ID, GameID, Viewer) VALUES ?`, [result]);
            await setLogs(connect, 6, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, 0, stream.length]);
            await connect.commit();
        } catch (err) {
            console.error(date.getNewDate());
            console.error(err);
        }
    }
}

module.exports = setRawStreamData;