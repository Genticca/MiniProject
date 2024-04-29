const dayjs = require('dayjs');

class DateManger {
    constructor(date) {
        let temp = date ? date : new Date();
        this.setNewDate(date);
    }

    /**
     * this.date를 호출된 날짜, 시간으로 변경
     * @param {ate} date 날짜
     */
    setNewDate(date) {
        let day = date ? date : new Date();
        this.date = dayjs(day).format('YYYY-MM-DD HH:mm:ss');
        this.workCode = 0;
    }

    /**
     * this.date를 매개변수 날짜와 변경
     * @param {date} currentDate 날짜
     * @returns None
     */
    setNextDate(currentDate) {
        let currentFormat = dayjs(currentDate).format('YYYY-MM-DD');
        let thisFormat = dayjs(this.date).format('YYYY-MM-DD');

        if(dayjs(currentFormat).isAfter(thisFormat)) {
            this.date = currentDate;
            return true;
        } else {
            return false;
        }
    }

    /**
     * this.date를 반환된 포맷에 맞춰 반환함
     * @returns YYYYMMDD
     */
    getDatabaseDate() {
        return dayjs(this.date).format('YYYYMMDD');
    }

    /**
     * 현재 날짜와 시간을 반환된 포맷에 맞춰 반환함
     * @returns YYYY-MM-DD HH:mm:ss
     */
    getNewDate() {
        return dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * this.date의 하루 전 날짜를 반환된 포맷에 맞춰 반환함
     * @returns YYYYMMDD
     */
    getMinusDay() {
        return dayjs(this.date).subtract(1, 'day').format('YYYYMMDD');
    }

    /**
     * 매개변수를 반환된 포맷에 맞춰 반환함
     * @param {date} date 날짜
     * @returns YYYY-MM-DD HH:mm:ss
     */
    getDateTime(date) {
        return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * 사용자 지정 포맷으로 날짜를 반환함
     * @param {date} date 날짜
     * @param {String} format 문자열 포맷
     * @returns 날짜가 문자열 포맷으로 변환되어 반환됨
     */
    getCustomFormat(date, format) {
        return dayjs(date).format(format);
    }

    getSame(date, select) {
        return dayjs(date).isSame(select);
    }

    setWorkCode() {
        let add = dayjs(this.date).year();
        add += dayjs(this.date).month();
        add += dayjs(this.date).day();
        add += dayjs(this.date).hour();
        add += dayjs(this.date).minute();

        this.workCode = add;
    }

    getWorkCode() {
        return this.workCode;
    }
}

module.exports = DateManger;