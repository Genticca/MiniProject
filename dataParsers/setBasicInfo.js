const setLogs = require('../utils/Logers.js');

/**
 * Basic_Infrm.Streamer에 스트리머 데이터 추가
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {StreamRawData} stream 실시간 방송 정보 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
var setStreamer = async function(connect, stream, date) {
    // 새로운 스트리머를 저장
    let start = process.hrtime();
    let result = [];

    // 수집된 데이터(Object)를 배열(Array)로 변환
    for(let data of stream) {
        result.push([
            data.id,
            data.login,
            data.nickname,
        ]);
    }

    try {
        // IGNORE으로 중복될 경우 데이터를 저장하지 않음, 단 새로운 데이터는 저장
        let [res, fields] = await connect.query(`INSERT IGNORE INTO BASIC_INFRM.Streamer (ID, Login, NickName) VALUES ?`, [result]);
        await setLogs(connect, 1, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, res.affectedRows, stream.length]);
        await connect.commit();
    } catch (err) {
        console.error(err);
    }
}

/**
 * Basic_Infrm.Games에 게임 데이터 추가
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {StreamRawData} stream 실시간 방송 정보 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
var setGames = async function(connect, stream, date) {
    // 새로운 게임(카테고리)를 저장
    let start = process.hrtime();
    let result = [];

    for(let data of stream) {
        result.push([
            data.gameId,
            data.gameName
        ])
    }

    try {
        let [res, fields] = await connect.query(`INSERT IGNORE INTO BASIC_INFRM.Games (ID, Name) VALUES ?`, [result]);
        await setLogs(connect, 2, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, res.affectedRows, stream.length]);
        await connect.commit();
    } catch (err) {
        console.error(err);
    }
}

/**VTuber 관련 태그를 가지고 있으면 데이터 베이스에 반환합니다.
 * Basic_Infrm.Streamer에 스트리머 데이터 추가
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {StreamRawData} stream 실시간 방송 정보 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
var setIsVtuer = async function(connect, stream, date) {
    // 새로운 VTuber를 저장
    let start = process.hrtime();
    let result = [], ids = new Map(), tag = ['버튜버', 'VTUBER', '브이튜버', '버츄얼', 'V', 'KRVTUBER'];

    for(let data of stream) {
        // 수집된 데이터 중 tags가 Null 혹은 None일 경우 continue
        if(!data.tags) continue;

        // 수집된 데이터의 tags는 배열(Array)으로 map을 이용하여 모든 문자를 대문자로 치환
        let upperTags = data.tags.map(tagItem => tagItem.toUpperCase());

        // 위 tag와 일치하는 데이터가 있으면 result에 수집
        if(tag.some(t => upperTags.includes(t))) {
            result.push([data.id, 1]);
        }
    }

    if(result.length > 0) {
        let [res, fields] = await connect.query(`INSERT IGNORE INTO BASIC_INFRM.IsVtuber (ID, enabled) VALUES ?`, [result]);
        await setLogs(connect, 8, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, res.affectedRows, stream.length]);
        await connect.commit();
    }
}

module.exports = {
    setStreamer,
    setGames,
    setIsVtuer,
}