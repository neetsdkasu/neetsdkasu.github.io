"use strict";
// DQ-Walk Hearts
// author: Leonardone @ NEETSDKASU
var Rank;
(function (Rank) {
    Rank[Rank["S_plus"] = 0] = "S_plus";
    Rank[Rank["S"] = 1] = "S";
    Rank[Rank["A"] = 2] = "A";
    Rank[Rank["B"] = 3] = "B";
    Rank[Rank["C"] = 4] = "C";
    Rank[Rank["D"] = 5] = "D";
})(Rank || (Rank = {}));
var Color;
(function (Color) {
    Color[Color["None"] = 1] = "None";
    Color[Color["Yellow"] = 2] = "Yellow";
    Color[Color["Purple"] = 4] = "Purple";
    Color[Color["Green"] = 8] = "Green";
    Color[Color["Red"] = 16] = "Red";
    Color[Color["Blue"] = 32] = "Blue";
    Color[Color["Rainbow"] = 62] = "Rainbow";
})(Color || (Color = {}));
const JobPreset = [
    { id: 101, name: "戦士",
        colors: [Color.Rainbow, Color.Yellow, Color.Yellow, Color.None] },
    { id: 102, name: "魔法使い",
        colors: [Color.Rainbow, Color.Purple, Color.Purple, Color.None] },
    { id: 103, name: "僧侶",
        colors: [Color.Rainbow, Color.Green, Color.Green, Color.None] },
    { id: 104, name: "武闘家",
        colors: [Color.Rainbow, Color.Red, Color.Red, Color.None] },
    { id: 105, name: "盗賊",
        colors: [Color.Rainbow, Color.Blue, Color.Blue, Color.None] },
    { id: 106, name: "踊り子",
        colors: [Color.Rainbow, Color.Blue, Color.Green, Color.None] },
    { id: 107, name: "遊び人",
        colors: [Color.Rainbow, Color.Blue, Color.Purple, Color.None] },
    { id: 201, name: "バトルマスター",
        colors: [Color.Yellow | Color.Red, Color.Rainbow, Color.Red, Color.Red] },
    { id: 202, name: "賢者",
        colors: [Color.Green | Color.Purple, Color.Rainbow, Color.Green | Color.Purple, Color.Green | Color.Purple] },
    { id: 203, name: "レンジャー",
        colors: [Color.Red | Color.Blue, Color.Rainbow, Color.Blue, Color.Blue] },
    { id: 204, name: "魔法戦士",
        colors: [Color.Yellow | Color.Purple, Color.Rainbow, Color.Yellow | Color.Purple, Color.Yellow | Color.Purple] },
    { id: 205, name: "パラディン",
        colors: [Color.Yellow | Color.Green, Color.Rainbow, Color.Yellow, Color.Yellow] },
    { id: 206, name: "スーパースター",
        colors: [Color.Blue | Color.Green, Color.Rainbow, Color.Blue, Color.Green] },
    { id: 207, name: "海賊",
        colors: [Color.Yellow | Color.Blue, Color.Rainbow, Color.Yellow, Color.Blue] },
    { id: 208, name: "まものマスター",
        colors: [Color.Rainbow, Color.Rainbow, Color.Blue | Color.Purple, Color.Blue | Color.Purple] },
];
const SingleColorInfoMap = (() => {
    const m = new Map();
    m.set(Color.Yellow, { color: Color.Yellow, text: "黄(戦)", colorName: "yellow" });
    m.set(Color.Purple, { color: Color.Purple, text: "紫(魔)", colorName: "purple" });
    m.set(Color.Green, { color: Color.Green, text: "緑(僧)", colorName: "green" });
    m.set(Color.Red, { color: Color.Red, text: "赤(武)", colorName: "red" });
    m.set(Color.Blue, { color: Color.Blue, text: "青(盗)", colorName: "blue" });
    return m;
})();
let monsterMap = new Map();
let monsterList = [];
function showNewHeart(monster) {
    const template = document.getElementById("heart_list_item");
    const fragment = template.content.cloneNode(true);
    const text = (cname, value) => {
        const e = fragment.querySelector(cname);
        e.textContent = `${value}`;
        return e;
    };
    text(".monster-name", monster.name);
    text(".monster-cost", monster.cost);
    const csi = SingleColorInfoMap.get(monster.color);
    text(".monster-color", csi.text).classList.add(csi.colorName);
    const heart = monster.hearts.find(h => h.rank === monster.target);
    const radios = fragment.querySelectorAll('input.monster-rank');
    const monsterRankRadioName = `monster-rank-${monster.id}`;
    for (const radio of radios) {
        const elm = radio;
        elm.name = monsterRankRadioName;
        if (elm.value === "omit") {
            elm.addEventListener("change", () => {
                monster.target = null;
            });
        }
        else {
            const rank = Rank[elm.value];
            elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            elm.checked = rank === heart.rank;
            elm.addEventListener("change", () => {
                monster.target = rank;
            });
        }
    }
    text(".monster-maximumhp", heart.maximumHP);
    text(".monster-maximummp", heart.maximumMP);
    text(".monster-power", heart.power);
    text(".monster-defence", heart.defence);
    text(".monster-attackmagic", heart.attackMagic);
    text(".monster-recovermagic", heart.recoverMagic);
    text(".monster-speed", heart.speed);
    text(".monster-deftness", heart.deftness);
    text(".monster-maximumcost", heart.maximumCost);
    text(".monster-effects", heart.effects);
    fragment.firstElementChild.id = `monster-${monster.id}`;
    const holder = document.getElementById("heart_list");
    const index = monsterList.findIndex(m => m.id === monster.id);
    if (index + 1 === monsterList.length) {
        holder.appendChild(fragment);
    }
    else {
        const next = document.getElementById(`monster-${monsterList[index + 1].id}`);
        holder.insertBefore(fragment, next);
    }
}
function showUpdatedHeart(monster) {
}
function addHeart(newMonster) {
    if (monsterMap.has(newMonster.name)) {
        const monster = monsterMap.get(newMonster.name);
        for (const heart of monster.hearts) {
            const index = monster.hearts.findIndex(h => h.rank === heart.rank);
            if (index < 0) {
                monster.hearts.push(heart);
            }
            else {
                monster.hearts[index] = heart;
            }
            monster.target = heart.rank;
        }
        monster.hearts.sort((a, b) => a.rank - b.rank);
        monster.color = newMonster.color;
        monster.cost = newMonster.cost;
        showUpdatedHeart(monster);
    }
    else {
        newMonster.id = monsterList.length;
        newMonster.target = newMonster.hearts[0].rank;
        newMonster.hearts.sort((a, b) => a.rank - b.rank);
        monsterMap.set(newMonster.name, newMonster);
        monsterList.push(newMonster);
        monsterList.sort((a, b) => b.cost - a.cost);
        showNewHeart(newMonster);
    }
}
function setPreset(job) {
    function update(n, c, v) {
        const id = `heart${n + 1}_${c}`;
        const elem = document.getElementById(id);
        if (elem) {
            elem.checked = v !== 0;
        }
    }
    for (let i = 0; i < 4; i++) {
        const color = job.colors[i];
        update(i, "yellow", color & Color.Yellow);
        update(i, "purple", color & Color.Purple);
        update(i, "green", color & Color.Green);
        update(i, "red", color & Color.Red);
        update(i, "blue", color & Color.Blue);
        update(i, "omit", color & Color.None);
    }
}
function dialogAlert(msg) {
    document.getElementById("alert_message").textContent = msg;
    const dialog = document.getElementById("alert_dialog");
    dialog.showModal();
}
document.getElementById("preset_heartset")
    .addEventListener("change", () => {
    const sel = document.getElementById("preset_heartset");
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id === value) {
            setPreset(job);
            return;
        }
    }
    dialogAlert(`Unknown ID: ${value}`);
});
document.getElementById("add_heart")
    .addEventListener("click", () => {
    const dialog = document.getElementById("add_heart_dialog");
    dialog.showModal();
});
document.querySelector('#add_heart_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    document.getElementById("add_heart_dialog").close();
});
document.getElementById("add_heart_dialog")
    .addEventListener("close", (event) => {
    const dialog = document.getElementById("add_heart_dialog");
    if (dialog.returnValue !== "add") {
        return;
    }
    const elements = dialog.querySelector("form").elements;
    const str = (name) => elements.namedItem(name).value;
    const noNaN = (v) => isNaN(v) ? 0 : v;
    const num = (name) => noNaN(parseInt(str(name)));
    const monster = {
        id: 0,
        name: str("add_monster_name"),
        color: Color[str("add_color")],
        cost: num("add_cost"),
        hearts: [{
                maximumHP: num("add_maximumhp"),
                maximumMP: num("add_maximummp"),
                power: num("add_power"),
                defence: num("add_defence"),
                attackMagic: num("add_attackmagic"),
                recoverMagic: num("add_recovermagic"),
                speed: num("add_speed"),
                deftness: num("add_deftness"),
                rank: Rank[str("add_rank")],
                maximumCost: num("add_maximumcost"),
                effects: str("add_effects"),
            }],
        target: null,
    };
    addHeart(monster);
});
