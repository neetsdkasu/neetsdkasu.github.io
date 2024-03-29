"use strict";
const DELTA = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const SIDE_ID = ["top", "right", "bottom", "left"];
const ROW_COUNT = 8;
const COL_COUNT = 8;
const SUM = 10;
const OBSTACLE = SUM + 1;
const DELETED = -1;
function info(text) {
    const msg = document.getElementById("msg");
    if (msg !== null) {
        msg.textContent = text;
    }
}
class HiScore {
    constructor() {
        this.temp = new Map();
    }
    getKey(seed) {
        return `/game/sum10#seed=${seed};hiscore`;
    }
    getScoreFromLS(seed) {
        let hiscore = 0;
        try {
            const key = this.getKey(seed);
            const value = window.localStorage.getItem(key);
            if (value !== null) {
                if (value.match(/^\d+$/)) {
                    hiscore = parseInt(value);
                }
            }
        }
        catch { }
        return hiscore;
    }
    getScore(seed) {
        const hiscoreLS = this.getScoreFromLS(seed);
        const hiscoreTemp = this.temp.get(seed) ?? 0;
        return Math.max(hiscoreLS, hiscoreTemp);
    }
    setScore(seed, score) {
        const oldHiscore = this.getScore(seed);
        if (score <= oldHiscore) {
            return false;
        }
        try {
            const key = this.getKey(seed);
            window.localStorage.setItem(key, `${score}`);
        }
        catch { }
        this.temp.set(seed, score);
        return true;
    }
}
class Game {
    constructor() {
        this.mt = new MersenneTwister();
        this.animated = false;
        this.eraseState = 0;
        this.selectedCount = 0;
        this.sum = 0;
        this.cycle = 0;
        this.score = 0;
        this.hiscore = new HiScore();
        this.seed = 0;
        this.scoreSpan = document.createElement("span");
        this.hiscoreSpan = document.createElement("span");
        this.button = new Array(ROW_COUNT);
        this.field = new Array(ROW_COUNT);
        this.selected = new Array(ROW_COUNT);
        for (let row = 0; row < ROW_COUNT; row++) {
            this.button[row] = new Array(COL_COUNT);
            this.field[row] = new Array(COL_COUNT).fill(0);
            this.selected[row] = new Array(COL_COUNT).fill(false);
            for (let col = 0; col < COL_COUNT; col++) {
                const btn = document.createElement("button");
                btn.textContent = `${row}x${col}`;
                btn.classList.add("cell");
                this.button[row][col] = btn;
                btn.addEventListener("click", () => {
                    this.click(row, col);
                });
            }
        }
    }
    newGame(seed) {
        this.seed = seed;
        this.mt.init_genrand(seed);
        this.animated = false;
        this.eraseState = 0;
        this.selectedCount = 0;
        this.sum = 0;
        this.cycle = 0;
        this.score = 0;
        const hiscore = this.hiscore.getScore(seed);
        this.scoreSpan.textContent = "0";
        this.hiscoreSpan.textContent = `${hiscore}`;
        this.hiscoreSpan.classList.remove("highest");
        for (const id of SIDE_ID) {
            document.getElementById(id).classList.remove("dropside");
        }
        document.getElementById("top").classList.add("dropside");
        const arr = new Array(ROW_COUNT * COL_COUNT).fill(0);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 10; // 0～9のボタン生成
        }
        for (let i = arr.length - 1; 0 < i; i--) {
            const k = Math.floor(this.mt.genrand_real2() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[k];
            arr[k] = tmp;
        }
        for (let row = 0; row < ROW_COUNT; row++) {
            this.selected[row].fill(false);
            for (let col = 0; col < COL_COUNT; col++) {
                this.field[row][col] = arr[row * COL_COUNT + col];
                const btn = this.button[row][col];
                btn.disabled = false;
                btn.textContent = `${this.field[row][col]}`;
                btn.classList.remove("selected");
                btn.classList.remove("deleted");
                btn.classList.remove("moved");
                btn.classList.remove("eleven");
            }
        }
    }
    eraseSelected() {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                if (this.selected[row][col]) {
                    this.selected[row][col] = false;
                    this.field[row][col] = DELETED;
                    const btn = this.button[row][col];
                    btn.classList.replace("selected", "deleted");
                    btn.textContent = "";
                }
            }
        }
        this.score += SUM;
        this.scoreSpan.textContent = `${this.score}`;
        if (this.hiscore.setScore(this.seed, this.score)) {
            this.hiscoreSpan.textContent = `${this.score}`;
            this.hiscoreSpan.classList.add("highest");
        }
    }
    drop() {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                this.button[row][col].classList.remove("moved");
            }
        }
        let count = 0;
        switch (this.cycle) {
            case 0:
                for (let col = 0; col < COL_COUNT; col++) {
                    for (let row = ROW_COUNT - 1; 0 < row; row--) {
                        if (this.field[row][col] !== DELETED) {
                            continue;
                        }
                        count++;
                        this.field[row][col] = this.field[row - 1][col];
                        this.field[row - 1][col] = DELETED;
                        this.button[row][col].classList.add("moved");
                    }
                    if (this.field[0][col] === DELETED) {
                        count++;
                        this.field[0][col] = OBSTACLE;
                        this.button[0][col].classList.add("moved");
                    }
                }
                break;
            case 1:
                for (let row = 0; row < ROW_COUNT; row++) {
                    for (let col = 0; col < COL_COUNT - 1; col++) {
                        if (this.field[row][col] !== DELETED) {
                            continue;
                        }
                        count++;
                        this.field[row][col] = this.field[row][col + 1];
                        this.field[row][col + 1] = DELETED;
                        this.button[row][col].classList.add("moved");
                    }
                    if (this.field[row][COL_COUNT - 1] === DELETED) {
                        count++;
                        this.field[row][COL_COUNT - 1] = OBSTACLE;
                        this.button[row][COL_COUNT - 1].classList.add("moved");
                    }
                }
                break;
            case 2:
                for (let col = 0; col < COL_COUNT; col++) {
                    for (let row = 0; row < ROW_COUNT - 1; row++) {
                        if (this.field[row][col] !== DELETED) {
                            continue;
                        }
                        count++;
                        this.field[row][col] = this.field[row + 1][col];
                        this.field[row + 1][col] = DELETED;
                        this.button[row][col].classList.add("moved");
                    }
                    if (this.field[ROW_COUNT - 1][col] === DELETED) {
                        count++;
                        this.field[ROW_COUNT - 1][col] = OBSTACLE;
                        this.button[ROW_COUNT - 1][col].classList.add("moved");
                    }
                }
                break;
            case 3:
                for (let row = 0; row < ROW_COUNT; row++) {
                    for (let col = COL_COUNT - 1; 0 < col; col--) {
                        if (this.field[row][col] !== DELETED) {
                            continue;
                        }
                        count++;
                        this.field[row][col] = this.field[row][col - 1];
                        this.field[row][col - 1] = DELETED;
                        this.button[row][col].classList.add("moved");
                    }
                    if (this.field[row][0] === DELETED) {
                        count++;
                        this.field[row][0] = OBSTACLE;
                        this.button[row][0].classList.add("moved");
                    }
                }
                break;
        }
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                const f = this.field[row][col];
                const btn = this.button[row][col];
                btn.textContent = `${f}`;
                if (f === DELETED) {
                    btn.classList.add("deleted");
                    btn.classList.remove("moved");
                }
                else {
                    btn.classList.remove("deleted");
                    if (SUM < f) {
                        btn.classList.remove("moved");
                        btn.classList.add("eleven");
                    }
                    else {
                        btn.classList.remove("eleven");
                    }
                }
            }
        }
        return count !== 0;
    }
    doErase() {
        switch (this.eraseState) {
            case 0:
                this.eraseSelected();
                this.eraseState = 1;
                break;
            case 1:
                if (this.drop()) {
                    break;
                }
                this.cycle = (this.cycle + 1) & 3;
                for (const id of SIDE_ID) {
                    document.getElementById(id).classList.remove("dropside");
                }
                document.getElementById(SIDE_ID[this.cycle]).classList.add("dropside");
                this.sum = 0;
                this.selectedCount = 0;
                this.animated = false;
                this.eraseState = 0;
                if (this.isGameOver()) {
                    // TODO
                    info("GAME OVER");
                }
                return;
        }
        this.erase();
    }
    erase() {
        window.setTimeout(() => this.doErase(), 300);
    }
    click(row, col) {
        if (this.animated) {
            return;
        }
        if (SUM < this.field[row][col]) {
            return;
        }
        if (this.button[row][col].classList.toggle("selected")) {
            this.sum += this.field[row][col];
            this.selected[row][col] = true;
            this.selectedCount++;
        }
        else {
            this.sum -= this.field[row][col];
            this.selected[row][col] = false;
            this.selectedCount--;
        }
        if (this.sum !== SUM) {
            return;
        }
        if (this.check()) {
            this.animated = true;
            this.eraseState = 0;
            this.erase();
        }
    }
    dfs(row, col) {
        this.selected[row][col] = false;
        const stack = [[row, col]];
        const recover = [];
        let sum = 0;
        while (0 < stack.length) {
            [row, col] = stack.pop();
            recover.push([row, col]);
            sum += this.field[row][col];
            for (const [dx, dy] of DELTA) {
                const tRow = row + dy;
                const tCol = col + dx;
                if (tRow < 0 || ROW_COUNT <= tRow || tCol < 0 || COL_COUNT <= tCol) {
                    continue;
                }
                if (this.selected[tRow][tCol]) {
                    this.selected[tRow][tCol] = false;
                    stack.push([tRow, tCol]);
                }
            }
        }
        const ok = recover.length === this.selectedCount && sum === SUM;
        for ([row, col] of recover) {
            this.selected[row][col] = true;
        }
        return ok;
    }
    check() {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                if (!this.selected[row][col]) {
                    continue;
                }
                return this.dfs(row, col);
            }
        }
        return false;
    }
    isGameOver() {
        for (let row = 0; row < ROW_COUNT; row++) {
            let s = 0;
            let c0 = 0;
            let c1 = 0;
            for (;;) {
                while (s < SUM && c1 < COL_COUNT) {
                    s += this.field[row][c1];
                    c1++;
                }
                if (s < SUM) {
                    break;
                }
                else if (s === SUM) {
                    return false;
                }
                while (SUM <= s && c0 < c1) {
                    s -= this.field[row][c0];
                    c0++;
                }
            }
        }
        for (let col = 0; col < COL_COUNT; col++) {
            let s = 0;
            let r0 = 0;
            let r1 = 0;
            for (;;) {
                while (s < SUM && r1 < ROW_COUNT) {
                    s += this.field[r1][col];
                    r1++;
                }
                if (s < SUM) {
                    break;
                }
                else if (s === SUM) {
                    return false;
                }
                while (SUM <= s && r0 < r1) {
                    s -= this.field[r0][col];
                    r0++;
                }
            }
        }
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                const f = this.field[row][col];
                if (f < 1 || 5 < f) {
                    continue;
                }
                if (!this.dfsIsGameOver(row, col, f)) {
                    return false;
                }
            }
        }
        return true;
    }
    dfsIsGameOver(row, col, s) {
        this.selected[row][col] = true;
        for (const [dx, dy] of DELTA) {
            const tRow = row + dy;
            const tCol = col + dx;
            if (tRow < 0 || ROW_COUNT <= tRow || tCol < 0 || COL_COUNT <= tCol) {
                continue;
            }
            if (this.selected[tRow][tCol]) {
                continue;
            }
            const ts = s + this.field[tRow][tCol];
            if (ts === SUM) {
                this.selected[row][col] = false;
                return false;
            }
            else if (SUM < ts) {
                continue;
            }
            if (!this.dfsIsGameOver(tRow, tCol, ts)) {
                this.selected[row][col] = false;
                return false;
            }
        }
        this.selected[row][col] = false;
        return true;
    }
}
function start() {
    if (game.animated) {
        return;
    }
    const seedInput = document.getElementById("seed");
    if (seedInput instanceof HTMLInputElement) {
        if (!seedInput.reportValidity()) {
            return;
        }
        const seed = parseInt(seedInput.value);
        game.newGame(seed);
        info("");
    }
}
const game = new Game();
function getSeed() {
    let seed = Math.floor(Math.random() * 100000);
    const params = new URL(window.location.href).searchParams;
    if (params.has("seed")) {
        const value = params.get("seed") ?? "";
        if (value.match(/^\d+$/)) {
            const temp = parseInt(value);
            if (0 <= temp && temp <= 99999) {
                seed = temp;
            }
        }
    }
    return seed;
}
function init() {
    const table = document.getElementById("table");
    for (let row = 0; row < ROW_COUNT; row++) {
        const tr = table.appendChild(document.createElement("tr"));
        for (let col = 0; col < COL_COUNT; col++) {
            const td = tr.appendChild(document.createElement("td"));
            td.appendChild(game.button[row][col]);
        }
    }
    document.getElementById("score").appendChild(game.scoreSpan);
    document.getElementById("hiscore").appendChild(game.hiscoreSpan);
    const seed = getSeed();
    const seedInput = document.getElementById("seed");
    if (seedInput instanceof HTMLInputElement) {
        seedInput.value = `${seed}`;
    }
    document.getElementById("start").addEventListener("click", start);
    game.newGame(seed);
}
init();
