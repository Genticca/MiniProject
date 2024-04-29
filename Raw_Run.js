// --------------------------
// Module Imports
// --------------------------

// 외부 라이브러리
const schedule = require('node-schedule');
const mysql = require('mysql2/promise');
const { AppTokenAuthProvider } = require('@twurple/auth');
const { ApiClient } = require('@twurple/api');

// 내부 기능
const fetchStream = require('./utils/fetchStream.js');
const DateManger = require('./utils/DateManger.js');
const setLiveToEnd = require('./utils/SetLiveToEnd.js');
const { setStreamer, setGames, setIsVtuer } = require('./dataParsers/setBasicInfo.js');
const { setStreamsAlive, setDeadStreams, setNewStreamsDate } = require('./dataParsers/setStreamDate.js');
const setRawStreamData = require('./dataParsers/setRawStreamData.js');
const setLogs = require('./utils/Logers.js');
const { addDayDB } = require('./utils/BuildDB.js');

// DB 및 API 접근 정보
const { StreamRawData, DuplicateChecker, config } = require('./account.json');

// API 라이브러리 정보
const dataClient = new ApiClient({ authProvider : new AppTokenAuthProvider(StreamRawData.id, StreamRawData.secret) });
const checkClient = new ApiClient({ authProvider : new AppTokenAuthProvider(DuplicateChecker.id, DuplicateChecker.secret) });

// 날짜 시간 관리 클래스
const date = new DateManger();

// 시작 문구
console.log(`${date.getNewDate()}, TWT가 감시를 시작합니다.`);

// 1분마다 scheduleJob을 실행
const job = schedule.scheduleJob('*/2 * * * *', async function() {
    try {
        console.time('Task ');
        
        date.setWorkCode(); // 실행마다 DateManger 멤버 변수에 시간 저장
        let start = process.hrtime(); // 작업 시간 기록 시작
        let connect = await mysql.createConnection(config); // mysql 연결
        let stream = await fetchStream(connect, dataClient, date); // Twitch 데이터 수집

        console.log(`\n수집된 데이터 [ ${stream.length} ]개를 반환합니다. ${date.getNewDate()}`);
        
        // DateManger에 저장된 날짜와 매개변수로 받은 날짜를 비교 후
        // 날짜가 맞지 않으면 새로운 테이블 생성
        if(date.setNextDate(new Date())) {
            await addDayDB(connect, date); // 테이블 생성
            await setLiveToEnd(connect, date); // 방송 중인 데이터를 저장된 날짜 테이블에 저장
        };

        // 비동기 실행, 해당 Promise가 끝내기 전까지 뒤의 코드를 실행하지 않음
        await Promise.all([
            setStreamer(connect, stream, date), // 새로운 스트리머 정보 저장
            setGames(connect, stream, date), // 새로운 게임(카테고리) 저장
            setIsVtuer(connect, stream, date), // 새로운 VTuber 저장
            setStreamsAlive(connect, stream, checkClient, date), // 새롭게 켜진 방송을 저장
        ]);

        await Promise.all([
            await setDeadStreams(connect, date), // 수집된 데이터와 저장된 데이터를 비교하여 종료된 방송을 테이블에 저장
            await setNewStreamsDate(connect, stream, date), // 수집된 데이터에 새롭게 켜진 방송을 저장
        ]);

        await Promise.all([
            await setRawStreamData(connect, stream, date), // 수집된 데이터를 테이블에 저장
        ]);

        // DB에 로그 저장
        await setLogs(connect, 0, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), 0, 0, stream.length]);
        connect.end(); // 데이터 베이스 연결 종료
    } catch (err) {
        console.error(date.getNewDate());
        console.error(err);
    } finally {
        console.timeEnd('Task ');
    }
});