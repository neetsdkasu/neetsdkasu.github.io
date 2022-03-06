
const DELTA = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const SIDE_ID = ["top", "right", "bottom", "left"];
const ROW_COUNT = 8;
const COL_COUNT = 8;
const SUM = 10;
const OBSTACLE = SUM+1;

class Game {
    mt: MersenneTwister;
    button: Array<Array<HTMLButtonElement>>;
    field: Array<Array<number>>;
    selected: Array<Array<boolean>>;
    selectedCount: number;
    sum: number;
    score: number;
    scoreSpan: HTMLSpanElement;
    animated: boolean;
    eraseState: number;
    cycle: number;

    constructor() {
        this.mt = new MersenneTwister();
        this.animated = false;
        this.eraseState = 0;
        this.selectedCount = 0;
        this.sum = 0;
        this.cycle = 0;
        this.score = 0;
        this.scoreSpan = document.createElement("span");
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

    newGame(seed: number): void {
        this.mt.init_genrand(seed);
        this.animated = false;
        this.eraseState = 0;
        this.selectedCount = 0;
        this.sum = 0;
        this.cycle = 0;
        this.score = 0;
        this.scoreSpan.textContent = "0";
        for (const id of SIDE_ID) {
            document.getElementById(id)!.classList.remove("dropside");
        }
        document.getElementById("top")!.classList.add("dropside");
        const arr: Array<number> = new Array(ROW_COUNT*COL_COUNT).fill(0);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = i % 10; // 0～9のボタン生成
        }
        for (let i = arr.length-1; 0 < i; i--) {
            const k = Math.floor(this.mt.genrand_real2() * (i+1));
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

    eraseSelected(): void {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                if (this.selected[row][col]) {
                    this.selected[row][col] = false;
                    this.field[row][col] = -1;
                    const btn = this.button[row][col];
                    btn.classList.replace("selected", "deleted");
                    btn.textContent = "";
                }
            }
        }
        this.score += SUM;
        this.scoreSpan.textContent = `${this.score}`;
    }

    drop(): boolean {
        for (let row = 0; row < ROW_COUNT; row++) {
            for (let col = 0; col < COL_COUNT; col++) {
                this.button[row][col].classList.remove("moved");
            }
        }
        let count = 0;
        switch (this.cycle) {
        case 0:
            for (let col = 0; col < COL_COUNT; col++) {
                for (let row = ROW_COUNT-1; 0 < row; row--) {
                    if (0 <= this.field[row][col]) {
                        continue;
                    }
                    count++;
                    this.field[row][col] = this.field[row-1][col];
                    this.field[row-1][col] = -1;
                    this.button[row][col].classList.add("moved");
                }
                if (this.field[0][col] < 0) {
                    count++;
                    this.field[0][col] = OBSTACLE;
                    this.button[0][col].classList.add("moved");
                }
            }
            break;
        case 1:
            for (let row = 0; row < ROW_COUNT; row++) {
                for (let col = 0; col < COL_COUNT-1; col++) {
                    if (0 <= this.field[row][col]) {
                        continue;
                    }
                    count++;
                    this.field[row][col] = this.field[row][col+1];
                    this.field[row][col+1] = -1;
                    this.button[row][col].classList.add("moved");
                }
                if (this.field[row][COL_COUNT-1] < 0) {
                    count++;
                    this.field[row][COL_COUNT-1] = OBSTACLE;
                    this.button[row][COL_COUNT-1].classList.add("moved");
                }
            }
            break;
        case 2:
            for (let col = 0; col < COL_COUNT; col++) {
                for (let row = 0; row < ROW_COUNT-1; row++) {
                    if (0 <= this.field[row][col]) {
                        continue;
                    }
                    count++;
                    this.field[row][col] = this.field[row+1][col];
                    this.field[row+1][col] = -1;
                    this.button[row][col].classList.add("moved");
                }
                if (this.field[ROW_COUNT-1][col] < 0) {
                    count++;
                    this.field[ROW_COUNT-1][col] = OBSTACLE;
                    this.button[ROW_COUNT-1][col].classList.add("moved");
                }
            }
            break;
        case 3:
            for (let row = 0; row < ROW_COUNT; row++) {
                for (let col = COL_COUNT-1; 0 < col; col--) {
                    if (0 <= this.field[row][col]) {
                        continue;
                    }
                    count++;
                    this.field[row][col] = this.field[row][col-1];
                    this.field[row][col-1] = -1;
                    this.button[row][col].classList.add("moved");
                }
                if (this.field[row][0] < 0) {
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
                if (f < 0) {
                    btn.classList.add("deleted");
                    btn.classList.remove("moved");
                } else {
                    btn.classList.remove("deleted");
                    if (SUM < f) {
                        btn.classList.remove("moved");
                        btn.classList.add("eleven");
                    } else {
                        btn.classList.remove("eleven");
                    }
                }
            }
        }
        return count !== 0;
    }

    doErase(): void {
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
                document.getElementById(id)!.classList.remove("dropside");
            }
            document.getElementById(SIDE_ID[this.cycle])!.classList.add("dropside");
            this.sum = 0;
            this.selectedCount = 0;
            this.animated = false;
            this.eraseState = 0;
            if (this.isGameOver()) {
                // TODO
            }
            return;
        }
        this.erase();
    }

    erase(): void {
        window.setTimeout(() => this.doErase(), 300);
    }

    click(row: number, col: number): void {
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
        } else {
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

    dfs(row: number, col: number): boolean {
        this.selected[row][col] = false;
        const stack = [[row, col]];
        const recover = [];
        let sum = 0;
        while (0 < stack.length) {
            [row, col] = stack.pop()!;
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

    check(): boolean {
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

    isGameOver(): boolean {

        // TODO

        return false;
    }
}

function start() {
    if (game.animated) {
        return;
    }
    const seedInput = document.getElementById("seed")!;
    if (seedInput instanceof HTMLInputElement) {
        const seed = parseInt(seedInput.value);
        game.newGame(seed);
    }
}

const game = new Game();

function init() {
    const table = document.getElementById("table")!;
    for (let row = 0; row < ROW_COUNT; row++) {
        const tr = table.appendChild(document.createElement("tr"));
        for (let col = 0; col < COL_COUNT; col++) {
            const td = tr.appendChild(document.createElement("td"));
            td.appendChild(game.button[row][col]);
        }
    }
    document.getElementById("score")!.appendChild(game.scoreSpan);
    const seed = Math.floor(Math.random() * 100000);
    const seedInput = document.getElementById("seed")!;
    if (seedInput instanceof HTMLInputElement) {
        seedInput.value = `${seed}`;
    }
    document.getElementById("start")!.addEventListener("click", start);
    game.newGame(seed);
}


init();
