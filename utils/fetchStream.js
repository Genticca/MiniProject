const setLogs = require('./Logers.js');

function heapify(arr, n, i) {
    let largest = i;
    const left = 2 * i + 1;
    const right = 2 * i + 2;

    if (left < n && arr[left].id > arr[largest].id) {
        largest = left;
    }

    if (right < n && arr[right].id > arr[largest].id) {
        largest = right;
    }

    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        heapify(arr, n, largest);
    }
}

function heapSort(arr) {
    const n = arr.length;

    // Build a max heap
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }

    // One by one extract elements from the heap
    for (let i = n - 1; i >= 0; i--) {
        // Move current root to the end
        [arr[0], arr[i]] = [arr[i], arr[0]];

        // call max heapify on the reduced heap
        heapify(arr, i, 0);
    }
}

// 위는 힙 정렬, 매우 빠름

var fetchStream = async function(connect, client, date) {
    let result = [], ids = new Set(), cursor;
    let start = process.hrtime(), count = 0;
    let data = [];

    // 수집할 때 필요없는 값들
    let blackList = [
        877528035,
        995325604,
        463131102,
        795415349,
        805048452,
        992452904,
        ]

    while(true) {
        try {
            let stream = await client.streams.getStreams({
                // Twitch API 요청 시 값
                'after' : cursor,
                'language' : 'ko',
                'limit' : '100',
            })

            count += stream.data.length;
            cursor = stream.cursor;

            data = stream.data.filter(data => !ids.has(data.userId)).map(data => {
                ids.add(data.userId);

                if(blackList.includes(data.userId)) {
                    return
                }

                return {
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
                }
            });

            result = [...result, ...data];

            if (stream.data[stream.data.length - 1].viewers < 2) break;
        } catch (err) {
            console.error(date.getNewDate());
            console.error(err);
        }
    }

    heapSort(result);
    
    await setLogs(connect, 100, date.getWorkCode(), [process.hrtime(start)[0] + (process.hrtime(start)[1] / 1e9), result.length, 0, count]);
    return result;
}

module.exports = fetchStream;