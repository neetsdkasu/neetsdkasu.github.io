function lockElements(lock) {
    const ids = [
        "target",
        "start",
        "end",
        "show",
    ];
    for (const id of ids) {
        document.getElementById(id).disabled = lock;
    }
}

function drawHistogram(map) {
    let power = 0;
    for (const key of map.keys()) {
        const ds = key.split(".");
        if (ds.length > 1) {
            power = Math.max(power, ds[1].length);
        }
    }
    const pow = Math.pow(10, power);
    const list = Array.from(map.entries())
        .map( kv => ({ x: Math.floor(parseFloat(kv[0]) * pow), f: kv[1] }) );
    list.sort( (a, b) => a.x - b.x );
    // Statistics
    let sum = 0;
    let count = 0;
    for (let i = 0; i < list.length; i++) {
        sum += list[i].x * list[i].f;
        count += list[i].f;
    }
    let average = sum / count;
    document.getElementById("avg").textContent = `${average / pow}`;
    sum = 0;
    for (let i = 0; i < list.length; i++) {
        sum += Math.pow(list[i].x - average, 2) * list[i].f;
    }
    let sd = Math.sqrt(sum / Math.max(1, (count - 1)));
    document.getElementById("sd").textContent = `${sd / pow}`;
    // Histogram
    let width = list[list.length-1].x - list[0].x;
    for (let i = 1; i < list.length; i++) {
        width = Math.min(width, list[i].x - list[i-1].x);
    }
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "gray";
    ctx.beginPath();
    ctx.moveTo(0, 200);
    ctx.lineTo(canvas.width, 200);
    ctx.closePath();
    ctx.stroke();
    ctx.strokeStyle = "black";
    for (let i = 0; i < list.length; i++) {
        const x = (list[i].x - list[0].x) * 5;
        const h = 5 * list[i].f;
        const y = 200 - h;
        ctx.strokeRect(x, y, 5, h);
    }
    // console.log(list);
    lockElements(false);
}

function load(list, map) {
    if (list.length === 0) {
        drawHistogram(map);
        return;
    }
    const url = list.pop();
    loadData(url, res => {
        if (res.ok) {
            for (const item of res.data.rows) {
                const key = `${item.value}`;
                if (map.has(key)) {
                    map.set(key, map.get(key) + 1);
                } else {
                    map.set(key, 1);
                }
            }
            load(list, map);
        } else {
            lockElements(false);
            alert(res.msg);
        }
    });
}

function showHistogram() {
    lockElements(true);
    const target = document.getElementById("target");
    const index = parseInt(target.value);
    const data = dataSet[index];
    const bounds = [
        document.getElementById("start").value,
        document.getElementById("end").value,
    ];
    const list = [];
    iterateDays(
        data.start_year,
        data.start_month,
        data.end_year,
        data.end_month,
        data.omit,
        (year, month) => {
            const csv = csvFileName(data.id, year, month);
            if (bounds[0] <= csv && csv <= bounds[1]) {
                list.push(csv);
            }
        }
    );
    load(list, new Map());
}

function resetBounds() {
    const target = document.getElementById("target");
    const index = parseInt(target.value);
    const data = dataSet[index];
    const bounds = [
        document.getElementById("start"),
        document.getElementById("end"),
    ];
    for (const b of bounds) {
        while (b.childElementCount > 0) {
            b.lastElementChild.remove();
        }
    }
    iterateDays(
        data.start_year,
        data.start_month,
        data.end_year,
        data.end_month,
        data.omit,
        (year, month) => {
            for (const b of bounds) {
                const opt = b.appendChild(document.createElement("option"));
                opt.value = csvFileName(data.id, year, month);
                opt.textContent = `${year}-${leadingZeros(2, month)}`;
            }
        }
    );
}

function init() {
    const target = document.getElementById("target");
    for (let i = 0; i < dataSet.length; i++) {
        const opt = target.appendChild(document.createElement("option"));
        opt.value = i;
        opt.textContent = dataSet[i].title;
        opt.checked = i === 0;
    }
    target.addEventListener("change", resetBounds);
    resetBounds();
    document.getElementById("show").addEventListener("click", showHistogram);
}

init();
