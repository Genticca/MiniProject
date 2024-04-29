const setLogs = require('../utils/Logers.js');

/**
 * LiveStreams.CurrentStreams 데이터 수정
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {ApiClient} client DuplicateChecker API Client 기입
 * @param {DateManger} date DateManger 기입
 */
var setStreamsAlive = async function(connect, stream, client, date) {
    // 수집된 데이터와 저장된 데이터를 비교하여 방송 중과 방송 종료를 판단하여 관리하는 기능
    // 수집된 데이터가 100% 조회되지 않을 때가 있어서 별도의 수집 기능을 수행함
    let start = process.hrtime();
    let result = [], ids = new Map(), indexIds = [];

    try {
        // 저장된 방송 중인 데이터를 ID를 기준으로 정렬하여 조회
        let [rows, fields] = await connect.query(`SELECT idx, id, startDate FROM LiveStreams.CurrentStreams WHERE endDate IS NULL ORDER BY ID`);

        for(let row of rows) {
            // 비교를 위해 ID + 일시를 조합하여 하나의 ID로 만들어서 Map에 대입
            let dateKey = row.id + date.getCustomFormat(row.startDate, 'YYYY-MM-DD HH:mm:00');

            // 방송 시작 일시를 비교하기 위한 Map에 데이터 대입
            ids.set(dateKey, {
                idx : row.idx,
                id : row.id,
                startDate : row.startDate,
            })
    
            // 추후 데이터 조회를 위한 배열에 데이터 대입
            indexIds.push(row.id);
        }
    } catch (err) {
        console.error(date.getNewDate());
        console.error(err);
    }

    for(let data of stream) {
        // 수집된 데이터도 ID + 일시를 조합하여 하나의 ID로 만들어서 Map 대입
        let dateKey = data.id + date.getCustomFormat(data.startDate, 'YYYY-MM-DD HH:mm:00');

        // 수집된 데이터에서 ids에 존재하는 데이터 존재 여부 확인
        if(ids.has(dateKey)) {
            // 있을 시 indexIds와 ids에서 삭제
            indexIds.splice(indexIds.indexOf(data.id), 1);
            ids.delete(dateKey);
        }
    }

    let cnt = 0;
    for(let i = 0; i < indexIds.length; i += 100) {
        // API 라이브러리의 기능을 이용하여 indexIds에서 ID를 이용하여 100개씩 방송 여부를 조회
        // 만약 방송이 종료되면 해당 ID의 값은 return되지 않음
        let liveStream = await client.streams.getStreamsByUserIds(
            // 만약 101개일 경우 1개까지 조회하기 위한 코드
            indexIds.slice(i, Math.min(i + 100, indexIds.length))
        );

        for(let data of liveStream) {
            let dateKey = data.userId + date.getCustomFormat(data.startDate, 'YYYY-MM-DD HH:mm:00');

            // 조회한 새로운 데이터를 stream(매개변수)를 주소 참조로 매개변수에 데이터 대입
            if(dateKey) {
                stream.push({
                    id : Number(data.userId),
                    login : data.userName,
                    nickname : data.userDisplayName,
                    viewer : data.viewers,
                    startDate : data.startDate,
                    gameId : Number(data.gameId || 0),
                    gameName : data.gameName || 'Blank',
                    type : data.type,
                    tags : data.tags,
                    title : data.title,
                });
            }

            // 저장된 데이터는 Map에 삭제
            ids.delete(dateKey);
            cnt += 1;
        }
    }

    console.log(`${cnt}명이 새롭게 추가되었습니다.`);

    // ids에서 삭제되지 않은 값을 result에 저장
    ids.forEach((value, key) => {
        result.push([
            value.idx,
            value.id,
            date.getDateTime(value.startDate),
            date.getNewDate(),
        ]);
    });

    if(result.length > 0) {
        try {
            // result에 저장된 데이터를 데이터 베이스에 저장
            let [res, fields] = await connect.query(`INSERT INTO LiveStreams.CurrentStreams (idx, id, startDate, endDate) VALUES ? ON DUPLICATE KEY UPDATE endDate = VALUES(endDate)`, [result]);
            await setLogs(connect, 3, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), ids.size, 0, res.affectedRows / 2]);
            await connect.commit();
        } catch (err) {
            console.error(date.getNewDate());
            console.error(err);
        }
    }
}

/**
 * 종료된 방송을 삭제 및 Data_YYYYMMDD.EndStreamsDate로 이동
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {DateManger} date 지정된 날짜만 기입 (YYYYMMDD)
 */
var setDeadStreams = async function(connect, date) {
    let start = process.hrtime();
    let result = [];

    try {
        // 방송 중인 데이터는 종료 일시가 Null일 경우 방송 중, 값이 있을 경우 방송 종료이다.
        // IS NOT NULL으로 방송 종료가 된 데이터를 조회
        let [rows, fields] = await connect.query(`SELECT idx, id, startDate, endDate FROM LiveStreams.CurrentStreams WHERE endDate IS NOT NULL ORDER BY ID`);

        // 기록할 테이블에 저장하기 위해 배열(Array)에 대입
        for(let row of rows) {
            result.push([
                row.idx,
                row.id,
                row.startDate,
                row.endDate
            ])
        }

        // IS NOT NULL으로 방송 종료된 레코드를 삭제
        let [res, fi] = await connect.query(`DELETE FROM LiveStreams.CurrentStreams WHERE EndDate IS NOT NULL`);
        await setLogs(connect, 4, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), 0, res.affectedRows, 0]);
    } catch (err) {
        console.error(date.getNewDate());
        console.error(err);
    }

    if(result.length > 0) {
        try {
            // result의 값을 데이터 베이스에 저장
            let [res, fields] = await connect.query(`INSERT INTO StreamDate.${date.getDatabaseDate()} (idx, id, startDate, endDate) VALUES ?`, [result]);
            await setLogs(connect, 4, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, 0, res.affectedRows]);
            await connect.commit();
        } catch (err) {
            console.error(date.getNewDate());
            console.error(err);
        }
    }
}

/**
 * Date_YYYYMMDD.EndStreamsDate에 데이터 추가
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {StreamRawData} stream 실시간 방송 정보 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
var setNewStreamsDate = async function(connect, stream, date) {
    let start = process.hrtime();
    let result = [], ids = new Set();

    try {
        // 데이터 베이스에서 방송 중인 데이터를 조회
        let [rows, fields] = await connect.query(`SELECT idx, id, startDate FROM LiveStreams.CurrentStreams WHERE endDate IS NULL ORDER BY ID`);

        for(let row of rows) {
            // Key를 생성
            ids.add(row.id + date.getDateTime(row.startDate));
        }
    } catch (err) {
        console.error(err);
    }

    for(let data of stream) {
        let dateKey = data.id + date.getDateTime(data.startDate);

        // 저장된 데이터와 수집된 데이터의 Key 값을 비교하여 False일 때 result에 저장
        if(!ids.has(dateKey)) {
            result.push([
                data.id,
                data.startDate,
            ]);
            ids.add(dateKey);
        }
    }

    if(result.length > 0) {
        try {
            // result 값을 데이터 베이스에 저장
            let [res, fields] = await connect.query(`INSERT INTO LiveStreams.CurrentStreams (id, startDate) VALUES ?`, [result]);
            await setLogs(connect, 5, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, 0, stream.length]);
            await connect.commit();
        } catch (err) {
            console.error(date.getNewDate());
            console.error(err);
        }
    }
}

module.exports = {
    setStreamsAlive,
    setDeadStreams,
    setNewStreamsDate
}