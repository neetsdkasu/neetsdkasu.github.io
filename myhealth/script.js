
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

function makeButtonAction(name) {
    return () => {
        const msg = document.querySelector(`#${name}-msg`);
        const sel = document.querySelector(`#${name}-sel`);
        const url = `./${name}${sel.value}.csv`;
        const canvas = document.querySelector(`#${name}-canvas`);
        loadData(url, res => {
            if (res.ok) {
                drawGraph(canvas, res.data);
                msg.textContent = `average = ${Math.floor(res.data.average*1000)/1000}`;
            } else {
                msg.textContent = res.msg;
            }
        });
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
    iterateDays(sy, sm, ey, em, omit, (year, month) => {
        const opt = sel.appendChild(document.createElement("option"));
        opt.value = `${year}${leadingZeros(2, month)}`;
        opt.textContent = `${year}-${leadingZeros(2, month)}`;
        opt.selected = true;
    });
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
    for (const data of dataSet) {
        initSelect(
            data.title,
            data.id,
            data.start_year,
            data.start_month,
            data.end_year,
            data.end_month,
            data.omit,
        );
    }
}

init();
