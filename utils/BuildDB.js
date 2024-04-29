/**
 * 매일 필요한 데이터 베이스를 생성합니다.
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
async function addDayDB(connect, date) {
    try {
        await connect.query(`CREATE TABLE StreamDate.${date.getDatabaseDate()} (IDX INT unsigned NOT NULL AUTO_INCREMENT,ID INT unsigned NOT NULL,StartDate TIMESTAMP NOT NULL,EndDate TIMESTAMP NULL,PRIMARY KEY(IDX),FOREIGN KEY(ID) REFERENCES BASIC_INFRM.Streamer(ID))`);
        console.log(`StreamDate에 ${date.getDatabaseDate()} 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`StreamDate에 ${date.getDatabaseDate()} 테이블이 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE TABLE StreamRawData.${date.getDatabaseDate()}(IDX INT unsigned NOT NULL AUTO_INCREMENT,EndDateID INT unsigned NOT NULL,ID INT unsigned NOT NULL,GameID INT unsigned NOT NULL,Viewer INT unsigned NOT NULL,CreateAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(IDX),FOREIGN KEY(ID) REFERENCES BASIC_INFRM.Streamer(ID))`);
        console.log(`StreamRawData에 ${date.getDatabaseDate()} 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`StreamRawData에 ${date.getDatabaseDate()} 테이블이 이미 존재합니다.`);
        console.error(err);
    }
}

/**
 * 단 한 번의 호출로 TWT의 모든 데이터 베이스를 생성합니다.
 * @param {MySQL/Promise} connect 연결된 MySQL 변수 기입
 * @param {DateManger} date DateManger 변수 기입
 */
async function defaultBuild(connect, date) {
    try {
        await connect.query(`create database StreamRawData default char set UTF8MB4`);
        console.log(`StreamRawData, 생성 완료`);
    } catch (err) {
        console.log(`StreamRawData, 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`create database StreamDate default char set UTF8MB4`);
        console.log(`StreamDate, 생성 완료`);
    } catch (err) {
        console.log(`StreamDate, 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE DATABASE LiveStreams DEFAULT CHAR SET UTF8MB4`);
        console.log(`LiveStreams, 생성 완료`);
    } catch (err) {
        console.log(`LiveStreams, 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE TABLE LiveStreams.CurrentStreams(IDX INT unsigned NOT NULL AUTO_INCREMENT,ID INT unsigned NOT NULL,StartDate TIMESTAMP NOT NULL,EndDate TIMESTAMP NULL,PRIMARY KEY(IDX),FOREIGN KEY(ID) REFERENCES BASIC_INFRM.Streamer(ID))`);
        console.log(`LiveStreams.CurrentStreams 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`LiveStreams.CurrentStreams 테이블이 이미 존재합니다.`);
        console.error(err);
    }

    await addDayDB(connect, date);

    try {
        await connect.query(`CREATE DATABASE TaskCodes DEFAULT CHAR SET UTF8MB4;`);
        console.log(`TaskCodes, 생성 완료`);
    } catch (err) {
        console.log(`TaskCodes, 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE TABLE TaskCodes.NumberCode(ID INT unsigned NOT NULL,Script VARCHAR(50) NOT NULL,PRIMARY KEY(ID))`);
        console.log(`TaskCodes.NumberCode 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`TaskCodes.NumberCode 테이블이 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE DATABASE LogsData DEFAULT CHAR SET UTF8MB4`);
        console.log(`LogsData, 생성 완료`);
    } catch (err) {
        console.log(`LogsData, 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE TABLE LogsData.TaskLogs(IDX INT unsigned NOT NULL AUTO_INCREMENT,Code INT unsigned NOT NULL,Time FLOAT NOT NULL,CreateAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY(IDX),FOREIGN KEY(Code) REFERENCES TaskCodes.NumberCode(ID))`);
        console.log(`LogsData.TaskLogs 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`LogsData.TaskLogs 테이블이 이미 존재합니다.`);
        console.error(err);
    }

    try {
        await connect.query(`CREATE TABLE LogsData.TaskLogDetail(LogID INT unsigned NOT NULL,InsertRows INT unsigned NOT NULL,UpdateRows INT unsigned NOT NULL,ResRows INT unsigned NOT NULL,PRIMARY KEY(LogID),FOREIGN KEY(LogID) REFERENCES TaskLogs(IDX))`);
        console.log(`LogsData.TaskLogDetail 테이블을 생성했습니다.`);
    } catch (err) {
        console.log(`LogsData.TaskLogDetail 테이블이 이미 존재합니다.`);
        console.error(err);
    }
}

module.exports = {
    addDayDB,
    defaultBuild,
}