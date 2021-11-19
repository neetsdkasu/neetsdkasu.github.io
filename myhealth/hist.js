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
    const list = Array.from(map.entries()).map( kv => [parseFloat(kv[0]), kv[1]]);
    list.sort( (a, b) => a[0] - b[0] );
    console.log(list);
    lockElements(false);
    alert("not implementated!");
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
