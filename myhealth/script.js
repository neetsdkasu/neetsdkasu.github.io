const LAST_YEAR = 2021;
const LAST_MONTH = 10;

const WEIGHT_LAST_YEAR = LAST_YEAR;
const WEIGHT_LAST_MONTH = LAST_MONTH;
const WEIGHT_OMITS = [[2020,6],[2020,7],[2020,8],[2020,9],[2020,10],[2020,11]];

const WAKEUP_LAST_YEAR = LAST_YEAR;
const WAKEUP_LAST_MONTH = LAST_MONTH;
const WAKEUP_OMITS = [];
const TOBED_LAST_YEAR = LAST_YEAR;
const TOBED_LAST_MONTH = LAST_MONTH;
const TOBED_OMITS = [];
const SLEEP_LAST_YEAR = LAST_YEAR;
const SLEEP_LAST_MONTH = LAST_MONTH;
const SLEEP_OMITS = [];

const INTERRUPT_LAST_YEAR = LAST_YEAR;
const INTERRUPT_LAST_MONTH = LAST_MONTH;
const INTERRUPT_OMITS = [];
const EARLYTEMP_LAST_YEAR = LAST_YEAR;
const EARLYTEMP_LAST_MONTH = LAST_MONTH;
const EARLYTEMP_OMITS = [];
const NORMALTEMP_LAST_YEAR = LAST_YEAR;
const NORMALTEMP_LAST_MONTH = LAST_MONTH;
const NORMALTEMP_OMITS = [];

const DINNER_LAST_YEAR = 2020;
const DINNER_LAST_MONTH = 5;
const DINNER_OMITS = [];

function leadingZeros(z, n) {
    return ("0".repeat(z) + n.toString()).slice(-z);
}

function parseData(csv) {
    const rows = csv.trim().split(/\n+/).slice(1).map(line => {
        const tokens = line.split(",");
        const ymd = tokens[0].split("-").map(t => parseInt(t));
        const date = new Date();
        date.setFullYear(ymd[0], ymd[1]-1, ymd[2]);
        return {
            date: date,
            value: parseFloat(tokens[1].trim())
        };
    });

    let minValue = 1e9;
    let maxValue = -1e9;
    let sum = 0;

    for (let i = 0; i < rows.length; i++) {
        minValue = Math.min(minValue, rows[i].value);
        maxValue = Math.max(maxValue, rows[i].value);
        sum += rows[i].value;
    }

    const average = sum / rows.length;

    return {
        rows: rows,
        min: minValue,
        max: maxValue,
        average: average
    };
}

function drawGraph(canvas, data) {
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let d = 1; d <= 32; d++) {
        const x0 = d * canvas.width / 33;
        ctx.beginPath();
        if (d % 5 == 0) {
            ctx.strokeStyle = "gray";
        } else {
            ctx.strokeStyle = "lightgray";
        }
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, canvas.height);
        ctx.closePath();
        ctx.stroke();
        if (d % 5 == 0) {
            ctx.strokeText(`${d}`, x0, 10);
        }
    }

    const rows = data.rows;
    const scale = data.max - data.min;
    const offset = 5;
    const height = canvas.height - offset * 2;

    ctx.strokeStyle = "blue";
    ctx.beginPath();
    for (let i = 1; i < rows.length; i++) {
        const x0 = rows[i].date.getDate() * canvas.width / 33;
        const y0 = (rows[i].value - data.min) * height / scale;
        const x1 = rows[i-1].date.getDate() * canvas.width / 33;
        const y1 = (rows[i-1].value - data.min) * height / scale;
        ctx.moveTo(x0, height - y0 + offset);
        ctx.lineTo(x1, height - y1 + offset);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = "magenta";
    ctx.fillStyle = "black";
    for (let i = 0; i < rows.length; i++) {
        const x0 = rows[i].date.getDate() * canvas.width / 33;
        const y0 = (rows[i].value - data.min) * height / scale;
        ctx.fillRect(x0 - 3, (height - y0) - 3 + offset, 5, 5);
        if (y0 * 2 < height) {
            ctx.strokeText(`${rows[i].value}`, x0, (height - y0) + offset);
        } else {
            ctx.strokeText(`${rows[i].value}`, x0, (height - y0) + 10 + offset);
        }
    }
}

function loadData(url, canvas, msg) {
    msg.textContent = "";
    fetch(url)
    .then( resp => {
        if (resp.ok) {
            return resp.text();
        } else {
            return Promise.reject(`${resp.status} ${resp.statusText}`);
        }
    })
    .then( csv => {
        const data = parseData(csv);
        drawGraph(canvas, data);
        msg.textContent = `average = ${Math.floor(data.average*1000)/1000}`;
    })
    .catch( err => {
        msg.textContent = `${err}`;
    });
}

function makeButtonAction(name) {
    return () => {
        const msg = document.querySelector(`#${name}-msg`);
        const sel = document.querySelector(`#${name}-sel`);
        const url = `./${name}${sel.value}.csv`;
        const canvas = document.querySelector(`#${name}-canvas`);
        loadData(url, canvas, msg);
    };
}

function initSelect(title, name, sy, sm, ey, em, omit) {
    const main = document.querySelector("main");
    const article = main.appendChild(document.createElement("article"));
    article.appendChild(document.createElement("h4")).textContent = title;
    const div = article.appendChild(document.createElement("div"));
    const sel = div.appendChild(document.createElement("select"));
    sel.name = `${name}-sel`;
    sel.id = `${name}-sel`;
    let year = sy;
    let month = sm;
    while (year < ey || month <= em) {
        let ok = true;
        for (let i = 0; i < omit.length; i++) {
            if (omit[i][0] === year && omit[i][1] === month) {
                ok = false;
                break;
            }
        }
        if (ok) {
            const opt = sel.appendChild(document.createElement("option"));
            opt.value = `${year}${leadingZeros(2, month)}`;
            opt.textContent = `${year}-${leadingZeros(2, month)}`;
            opt.selected = true;
        }
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    const btn = div.appendChild(document.createElement("button"));
    btn.textContent = "show";
    btn.addEventListener("click", makeButtonAction(name));
    const msg = div.appendChild(document.createElement("span"));
    msg.id = `${name}-msg`;
    const canvas = article.appendChild(document.createElement("canvas"));
    canvas.width = 640;
    canvas.height = 240;
    canvas.id = `${name}-canvas`;
}

function init() {
    initSelect("weight (wake up)", "weight", 2019, 9, WEIGHT_LAST_YEAR, WEIGHT_LAST_MONTH, WEIGHT_OMITS);
    initSelect("wake up", "wakeup", 2021, 7, WAKEUP_LAST_YEAR, WAKEUP_LAST_MONTH, WAKEUP_OMITS);
    initSelect("go to bed", "tobed", 2021, 7, TOBED_LAST_YEAR, TOBED_LAST_MONTH, TOBED_OMITS);
    initSelect("sleep", "sleep", 2021, 7, SLEEP_LAST_YEAR, SLEEP_LAST_MONTH, SLEEP_OMITS);
    initSelect("interrupt sleep", "interrupt", 2021, 9, INTERRUPT_LAST_YEAR, INTERRUPT_LAST_MONTH, INTERRUPT_OMITS);
    initSelect("early body temperature (wake up)", "earlytemp", 2021, 9, EARLYTEMP_LAST_YEAR, EARLYTEMP_LAST_MONTH, EARLYTEMP_OMITS);
    initSelect("normal body temperature (wake up)", "normaltemp", 2021, 9, NORMALTEMP_LAST_YEAR, NORMALTEMP_LAST_MONTH, NORMALTEMP_OMITS);
    initSelect("weight (after dinner)", "dinner", 2019, 9, DINNER_LAST_YEAR, DINNER_LAST_MONTH, DINNER_OMITS);
}

init();
