const {defaultBuild} = require('./utils/BuildDB.js');
const mysql = require('mysql2/promise.js');
const DateManger = require('./utils/DateManger.js');
const { config } = require('./account.json');

async function run() {
    let connect = await mysql.createConnection(config);
    let date = new DateManger();
    await defaultBuild(connect, date);
    connect.end();
}

run();