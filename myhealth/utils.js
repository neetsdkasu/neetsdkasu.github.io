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

function loadData(url, callback) {
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
        callback({
            ok: true,
            data: data,
            msg: "",
        });
    })
    .catch( err => {
        callback({
            ok: false,
            data: null,
            msg: `${err}`,
        });
    });
}

function iterateDays(sy, sm, ey, em, omit, callback) {
    let year = sy;
    let month = sm;
    while (year < ey || month <= em) {
        let ok = true;
        if (Array.isArray(omit)) {
            for (let i = 0; i < omit.length; i++) {
                if (omit[i][0] === year && omit[i][1] === month) {
                    ok = false;
                    break;
                }
            }
        } else if (typeof omit === "function") {
            if (omit(year, month)) {
                ok = false;
            }
        }
        if (ok) {
            callback(year, month);
        }
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
}