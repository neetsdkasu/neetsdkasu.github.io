"use strict";
class Game {
    constructor() {
        this.field = new Array(16);
        this.opened = new Array(16);
        for (let y = 0; y < 16; y++) {
            this.field[y] = new Array(16);
            this.opened[y] = new Array(16);
        }
        this.animated = false;
        this.total_mine = 40;
        this.opened_count = 0;
        this.start_time = 0;
        this.running = false;
    }
    newGame() {
        this.animated = false;
        this.running = false;
        this.opened_count = 0;
        this.start_time = 0;
        for (let y = 0; y < 16; y++) {
            this.field[y].fill(0);
            this.opened[y].fill(false);
        }
        const arr = new Array(256);
        for (let i = 0; i < 256; i++) {
            arr[i] = i;
        }
        for (let i = 255; i > 0; i--) {
            const k = Math.floor(Math.random() * (i + 1));
            const t = arr[i];
            arr[i] = arr[k];
            arr[k] = t;
        }
        for (let i = 0; i < this.total_mine; i++) {
            const x = arr[i] & 15;
            const y = arr[i] >> 4;
            this.field[y][x] = -1;
        }
        for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
                if (this.field[y][x] < 0) {
                    continue;
                }
                let cnt = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    const ty = y + dy;
                    if (ty < 0 || 15 < ty) {
                        continue;
                    }
                    for (let dx = -1; dx <= 1; dx++) {
                        const tx = x + dx;
                        if (tx < 0 || 15 < tx) {
                            continue;
                        }
                        if (this.field[ty][tx] < 0) {
                            cnt++;
                        }
                    }
                }
                this.field[y][x] = cnt;
            }
        }
    }
}
const game = new Game();
function newGame() {
    const canvas = document.getElementById("canvas");
    if (!(canvas instanceof HTMLCanvasElement))
        throw "BUG";
    const ctx = canvas.getContext("2d");
    ctx.textAlign = "center";
    ctx.font = "12px fantasy";
    ctx.fillStyle = "#ffa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#992";
    for (let i = 0; i < 50; i++) {
        const x = Math.floor(Math.random() * canvas.width);
        const y = Math.floor(Math.random() * canvas.height);
        const r = Math.ceil(Math.random() * 3);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.stroke();
    }
    game.newGame();
    document.getElementById("mine").textContent = `${game.total_mine}`;
    document.getElementById("unknown").textContent = "256";
    document.getElementById("time").textContent = "0";
}
const deadStatus = {
    x: 0,
    y: 0,
    state: 0,
};
function die() {
    const canvas = document.getElementById("canvas");
    if (!(canvas instanceof HTMLCanvasElement))
        throw "BUG";
    const ctx = canvas.getContext("2d");
    if (deadStatus.state === 0) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(deadStatus.x * 22 + 11, deadStatus.y * 22 + 11, 9, 0, 2 * Math.PI);
        ctx.fill();
    }
    else if (deadStatus.state < 20) {
        ctx.strokeStyle = "white";
        ctx.beginPath();
        let r = Math.random() * Math.PI * 0.5;
        for (let i = 0; i < 6; i++) {
            ctx.moveTo(deadStatus.x * 22 + 11, deadStatus.y * 22 + 11);
            const tx = 1000 * Math.cos(r) + deadStatus.x * 22 + 11;
            const ty = 1000 * Math.sin(r) + deadStatus.y * 22 + 11;
            ctx.lineTo(tx, ty);
            r += (Math.random() * 0.5 + 0.3) * Math.PI;
        }
        ctx.stroke();
    }
    else if (deadStatus.state === 20) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    else if (23 < deadStatus.state) {
        ctx.strokeStyle = "black";
        ctx.font = "30px fantasy";
        ctx.strokeText("D E A D", canvas.width / 2, canvas.height / 2);
        const btn = document.getElementById("newgame");
        if (!(btn instanceof HTMLButtonElement))
            throw "BUG";
        btn.disabled = false;
        return;
    }
    deadStatus.state++;
    window.setTimeout(die, 80);
}
const tiles = [];
function openTile() {
    while (true) {
        if (tiles.length === 0) {
            game.animated = false;
            const btn = document.getElementById("newgame");
            if (!(btn instanceof HTMLButtonElement))
                throw "BUG";
            btn.disabled = false;
            return;
        }
        const index = Math.floor(Math.random() * tiles.length);
        const [x, y] = tiles[index];
        if (index < tiles.length - 1) {
            tiles[index] = tiles.pop();
        }
        else {
            tiles.pop();
        }
        if (y < 0 || 15 < y || x < 0 || 15 < x) {
            continue;
        }
        if (game.opened[y][x]) {
            continue;
        }
        game.opened_count++;
        document.getElementById("unknown").textContent = `${256 - game.opened_count}`;
        game.opened[y][x] = true;
        const canvas = document.getElementById("canvas");
        if (!(canvas instanceof HTMLCanvasElement))
            throw "BUG";
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#772";
        ctx.fillRect(x * 22, y * 22, 22, 22);
        for (let i = 0; i < 2; i++) {
            if (Math.random() < 0.5) {
                ctx.strokeStyle = "#661";
                const r = Math.ceil(Math.random() * 3);
                const rx = r + Math.floor(Math.random() * (22 - 2 * r));
                const ry = r + Math.floor(Math.random() * (22 - 2 * r));
                ctx.beginPath();
                ctx.arc(x * 22 + rx, y * 22 + ry, r, 0, 2 * Math.PI);
                ctx.closePath();
                ctx.stroke();
            }
        }
        if (game.field[y][x] < 0) {
            ctx.fillStyle = "black";
            ctx.beginPath();
            ctx.arc(x * 22 + 11, y * 22 + 11, 9, 0, 2 * Math.PI);
            ctx.fill();
            deadStatus.x = x;
            deadStatus.y = y;
            deadStatus.state = 0;
            game.running = false;
            window.setTimeout(die, 300);
            return;
        }
        else if (game.field[y][x] > 0) {
            ctx.fillStyle = "white";
            ctx.fillText(`${game.field[y][x]}`, x * 22 + 11, y * 22 + 15);
        }
        else {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    tiles.push([x + dx, y + dy]);
                }
            }
        }
        window.requestAnimationFrame(openTile);
        return;
    }
}
function clickTile(x, y) {
    if (game.animated) {
        return;
    }
    const btn = document.getElementById("newgame");
    if (!(btn instanceof HTMLButtonElement))
        throw "BUG";
    btn.disabled = true;
    if (game.opened_count === 0) {
        game.start_time = Date.now();
        game.running = true;
    }
    game.animated = true;
    tiles.push([x, y]);
    openTile();
}
function tick() {
    if (game.running) {
        const t = Math.floor((Date.now() - game.start_time) / 1000);
        document.getElementById("time").textContent = `${t}`;
    }
}
window.addEventListener("load", () => {
    const table = document.getElementById("table");
    for (let row = 0; row < 16; row++) {
        const tr = table.appendChild(document.createElement("tr"));
        for (let col = 0; col < 16; col++) {
            const td = tr.appendChild(document.createElement("td"));
            const btn = td.appendChild(document.createElement("button"));
            btn.classList.add("tile");
            btn.addEventListener("click", () => {
                clickTile(col, row);
            });
        }
    }
    newGame();
    setInterval(tick, 1000);
    document.getElementById("newgame").addEventListener("click", () => {
        if (game.animated && game.running) {
            return;
        }
        newGame();
    });
});
