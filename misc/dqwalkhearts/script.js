"use strict";
//
// DQ-Walk Hearts
//
// author: Leonardone @ NEETSDKASU
//
const DEBUG = true;
const LocalStoragePath = "dqwalkhearts";
function dialogAlert(msg) {
    document.getElementById("alert_message").textContent = msg;
    const dialog = document.getElementById("alert_dialog");
    dialog.showModal();
}
function binarySearch(arr, value, less) {
    // バイナリサーチほしいか否か？
    // 多くて数百個程度のデータからfindIndexするわけだが
    // 一回の処理実行で何度findIndexを呼び出すかが、問題だが
    // （おそらく）ネイティブコード(?)実行で高速かもしれない線形探索のfindIndexと
    // JITあるか分からないJavaScriptコードのバイナリサーチ（二分探索）と
    // どっちが速いんだろうか・・・？
    // そもバイナリサーチというやつが難しすぎて実装できないが
    throw "not implemented";
}
function insert(arr, value, less) {
    const index = arr.findIndex(e => less(value, e));
    if (index < 0) {
        arr.push(value);
        return arr.length - 1;
    }
    else {
        arr.splice(index, 0, value);
        return index;
    }
}
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
    Color[Color["Unset"] = 0] = "Unset";
    Color[Color["Omit"] = 1] = "Omit";
    Color[Color["Yellow"] = 2] = "Yellow";
    Color[Color["Purple"] = 4] = "Purple";
    Color[Color["Green"] = 8] = "Green";
    Color[Color["Red"] = 16] = "Red";
    Color[Color["Blue"] = 32] = "Blue";
    Color[Color["Rainbow"] = 62] = "Rainbow";
})(Color || (Color = {}));
const JobPreset = [
    { id: 101, name: "戦士",
        colors: [Color.Rainbow, Color.Yellow, Color.Yellow, Color.Omit] },
    { id: 102, name: "魔法使い",
        colors: [Color.Rainbow, Color.Purple, Color.Purple, Color.Omit] },
    { id: 103, name: "僧侶",
        colors: [Color.Rainbow, Color.Green, Color.Green, Color.Omit] },
    { id: 104, name: "武闘家",
        colors: [Color.Rainbow, Color.Red, Color.Red, Color.Omit] },
    { id: 105, name: "盗賊",
        colors: [Color.Rainbow, Color.Blue, Color.Blue, Color.Omit] },
    { id: 106, name: "踊り子",
        colors: [Color.Rainbow, Color.Blue, Color.Green, Color.Omit] },
    { id: 107, name: "遊び人",
        colors: [Color.Rainbow, Color.Blue, Color.Purple, Color.Omit] },
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
let monsterNameList = [];
let noStorage = false;
function saveMonsterList() {
    if (noStorage) {
        return;
    }
    try {
        const json = JSON.stringify(monsterList);
        window.localStorage.setItem(LocalStoragePath, json);
    }
    catch (err) {
        noStorage = true;
        console.log(err);
    }
}
function loadMonsterList() {
    if (noStorage) {
        return;
    }
    try {
        const json = window.localStorage.getItem(LocalStoragePath);
        if (json !== null) {
            const list = JSON.parse(json);
            if (isMonsterList(list)) {
                addAllMonsterList(list);
            }
        }
    }
    catch (err) {
        noStorage = true;
        console.log(err);
    }
}
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
    const radios = fragment.querySelectorAll('input.monster-rank');
    const monsterRankRadioName = `monster_${monster.id}_rank`;
    for (const radio of radios) {
        const elm = radio;
        elm.name = monsterRankRadioName;
        if (elm.value === "omit") {
            elm.addEventListener("change", () => {
                monster.target = null;
                showUpdatedHeart(monster, false);
            });
        }
        else {
            const rank = Rank[elm.value];
            elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            elm.addEventListener("change", () => {
                monster.target = rank;
                showUpdatedHeart(monster, false);
            });
        }
    }
    if (monster.target === null) {
        fragment.firstElementChild.classList.add("omit");
        for (const radio of radios) {
            const elm = radio;
            if (elm.value === "omit") {
                elm.checked = true;
            }
        }
        text(".monster-maximumhp", "-");
        text(".monster-maximummp", "-");
        text(".monster-power", "-");
        text(".monster-defence", "-");
        text(".monster-attackmagic", "-");
        text(".monster-recovermagic", "-");
        text(".monster-speed", "-");
        text(".monster-deftness", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
    }
    else {
        const heart = monster.hearts.find(h => h.rank === monster.target);
        for (const radio of radios) {
            const elm = radio;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value];
                elm.checked = rank === heart.rank;
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
    }
    fragment.querySelector("button").addEventListener("click", () => {
        const dialog = document.getElementById("add_heart_dialog");
        const form = dialog.querySelector("form");
        form.reset();
        const elements = form.elements;
        const rad = (name, value) => {
            elements.namedItem(name).value = value;
        };
        const elem = (name, value) => {
            elements.namedItem(name).value = value;
        };
        elem("add_monster_name", monster.name);
        elem("add_cost", `${monster.cost}`);
        rad("add_color", `${Color[monster.color]}`);
        if (monster.target !== null) {
            rad("add_rank", `${Rank[monster.target]}`);
            const h = monster.hearts.find(h => h.rank === monster.target);
            elem("add_maximumhp", `${h.maximumHP}`);
            elem("add_maximummp", `${h.maximumMP}`);
            elem("add_power", `${h.power}`);
            elem("add_defence", `${h.defence}`);
            elem("add_attackmagic", `${h.attackMagic}`);
            elem("add_recovermagic", `${h.recoverMagic}`);
            elem("add_speed", `${h.speed}`);
            elem("add_deftness", `${h.deftness}`);
            elem("add_maximumcost", `${h.maximumCost}`);
            elem("add_effects", `${h.effects}`);
        }
        dialog.showModal();
    });
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
function showUpdatedHeart(monster, reorder) {
    const item = document.getElementById(`monster-${monster.id}`);
    if (reorder) {
        const holder = document.getElementById("heart_list");
        holder.removeChild(item);
        const index = monsterList.findIndex(m => m.id === monster.id);
        if (index + 1 === monsterList.length) {
            holder.appendChild(item);
        }
        else {
            const next = document.getElementById(`monster-${monsterList[index + 1].id}`);
            holder.insertBefore(item, next);
        }
    }
    const text = (cname, value) => {
        const e = item.querySelector(cname);
        e.textContent = `${value}`;
        return e;
    };
    text(".monster-name", monster.name);
    text(".monster-cost", monster.cost);
    const csi = SingleColorInfoMap.get(monster.color);
    const classList = text(".monster-color", csi.text).classList;
    SingleColorInfoMap.forEach((v) => {
        classList.remove(v.colorName);
    });
    classList.add(csi.colorName);
    const radios = item.querySelectorAll('input.monster-rank');
    if (monster.target === null) {
        item.classList.add("omit");
        for (const radio of radios) {
            const elm = radio;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value];
                elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            }
            else {
                elm.checked = true;
            }
        }
        text(".monster-maximumhp", "-");
        text(".monster-maximummp", "-");
        text(".monster-power", "-");
        text(".monster-defence", "-");
        text(".monster-attackmagic", "-");
        text(".monster-recovermagic", "-");
        text(".monster-speed", "-");
        text(".monster-deftness", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
    }
    else {
        item.classList.remove("omit");
        const heart = monster.hearts.find(h => h.rank === monster.target);
        for (const radio of radios) {
            const elm = radio;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value];
                elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
                elm.checked = rank === heart.rank;
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
    }
}
function addMonsterNameList(newName) {
    const item = document.createElement("option");
    item.value = newName;
    const list = document.getElementById("monster_name_list");
    const index = insert(monsterNameList, newName, (n, e) => n < e);
    if (index + 1 === monsterNameList.length) {
        list.appendChild(item);
    }
    else {
        const before = list.children[index];
        list.insertBefore(item, before);
    }
}
function addHeart(newMonster) {
    if (monsterMap.has(newMonster.name)) {
        const monster = monsterMap.get(newMonster.name);
        for (const heart of newMonster.hearts) {
            const index = monster.hearts.findIndex(h => h.rank === heart.rank);
            if (index < 0) {
                monster.hearts.push(heart);
            }
            else {
                monster.hearts[index] = heart;
            }
        }
        monster.target = newMonster.target;
        monster.color = newMonster.color;
        if (monster.cost === newMonster.cost) {
            showUpdatedHeart(monster, false);
        }
        else {
            monster.cost = newMonster.cost;
            monsterList.sort((a, b) => b.cost - a.cost);
            showUpdatedHeart(monster, true);
        }
    }
    else {
        addMonsterNameList(newMonster.name);
        newMonster.id = monsterList.length;
        monsterMap.set(newMonster.name, newMonster);
        insert(monsterList, newMonster, (n, e) => n.cost > e.cost);
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
        update(i, "omit", color & Color.Omit);
    }
    {
        const omit = document.getElementById("heart4_omit").checked;
        const elem = (id) => {
            const e = document.getElementById(id);
            if (omit) {
                e.checked = false;
            }
            e.disabled = omit;
        };
        // querySelectorAll('[id^="heart4_"]:not([id$="_omit"])') でも取れる？
        elem("heart4_yellow");
        elem("heart4_purple");
        elem("heart4_green");
        elem("heart4_red");
        elem("heart4_blue");
    }
}
function isMonsterList(obj) {
    if (!Array.isArray(obj)) {
        console.log("こころリストじゃないJSONファイル");
        console.log(obj);
        return false;
    }
    const list = obj;
    for (const monster of list) {
        if (!isMonster(monster)) {
            return false;
        }
    }
    return true;
}
function isMonster(anyobj) {
    if (typeof anyobj !== "object" || anyobj === null) {
        console.log("オブジェクト型じゃない");
        console.log(anyobj);
        return false;
    }
    const obj = anyobj; // ここキャストできる理由わからない
    const monster1 = {
        id: 0,
        name: "str",
        color: Color.Red,
        cost: 1,
        hearts: [{
                maximumHP: 1,
                maximumMP: 1,
                power: 1,
                defence: 1,
                attackMagic: 1,
                recoverMagic: 1,
                speed: 1,
                deftness: 1,
                rank: Rank.S_plus,
                maximumCost: 1,
                effects: "str",
            }],
        target: Rank.S_plus,
    };
    const monster2 = {
        id: 0,
        name: "str",
        color: Color.Red,
        cost: 1,
        hearts: [],
        target: null,
    };
    for (const param in monster1) {
        if (param in obj === false) {
            console.log(`パラメータが無い ${param}`);
            console.log(obj);
            return false;
        }
        const x = typeof monster1[param];
        const y = monster2[param];
        const value = obj[param];
        if (x !== typeof value && y !== value) {
            console.log(`パラメータの型が一致しない ${param} ${x} ${y}`);
            console.log(value);
            console.log(obj);
            return false;
        }
    }
    const m = obj; // ここキャストできる理由わからない
    if (m.color in Color === false) {
        console.log("Colorに存在しない値が設定されている");
        console.log(obj);
        return false;
    }
    if (m.target !== null && m.target in Rank === false) {
        console.log("Rankに存在しない値が設定されている");
        console.log(obj);
        return false;
    }
    if (!Array.isArray(m.hearts)) {
        console.log("こころの配列がない");
        console.log(obj);
        return false;
    }
    const heart = monster1.hearts[0];
    for (const h of m.hearts) {
        if (typeof h !== "object" || h === null) {
            console.log("オブジェクト型じゃない");
            console.log(h);
            console.log(obj);
            return false;
        }
        for (const param in heart) {
            if (param in h === false) {
                console.log(`パラメータが存在しない ${param}`);
                console.log(h);
                console.log(obj);
                return false;
            }
            const x = typeof heart[param];
            const y = typeof h[param];
            if (x !== y) {
                console.log(`パラメータの型が一致しない ${param} ${x}`);
                console.log(y);
                console.log(h);
                console.log(obj);
                return false;
            }
        }
        if (h.rank in Rank === false) {
            console.log("Rankに存在しない値が設定されている");
            console.log(h);
            console.log(obj);
            return false;
        }
    }
    // ここ以下はたぶん普通はバリデータの役割。型検査の役割じゃないと思う。
    {
        if (m.color === Color.Unset || m.color === Color.Omit || m.color === Color.Rainbow) {
            console.log("こころの色の指定として不正 ${Color[m.color]}");
            console.log(m);
            return false;
        }
        for (let r = Rank.S_plus; r <= Rank.D; r++) {
            let c = 0;
            for (const h of m.hearts) {
                if (h.rank === r) {
                    c++;
                }
            }
            if (c > 1) {
                console.log(`同じRankのこころが複数設定されている ${Rank[r]}`);
                console.log(obj);
                return false;
            }
        }
        if (m.target !== null) {
            if (m.hearts.findIndex(h => h.rank === m.target) < 0) {
                console.log("存在しないRankのこころが選択されている");
                console.log(obj);
                return false;
            }
        }
    }
    return true;
}
function replaceMonsterList(newMonsterList) {
    monsterMap = new Map();
    monsterList = [];
    monsterNameList = [];
    document.getElementById("monster_name_list").innerHTML = "";
    document.getElementById("heart_list").innerHTML = "";
    for (const monster of newMonsterList) {
        addHeart(monster);
    }
}
function addAllMonsterList(list) {
    for (const monster of list) {
        addHeart(monster);
    }
}
function mergeMonsterList(list) {
    for (const monster of list) {
        if (monsterMap.has(monster.name)) {
            const orig = monsterMap.get(monster.name);
            monster.hearts = monster.hearts.filter(h => orig.hearts.findIndex(oh => oh.rank === h.rank) < 0);
            if (monster.hearts.length === 0) {
                continue;
            }
            monster.color = orig.color;
            monster.cost = orig.cost;
            monster.target = orig.target;
        }
        addHeart(monster);
    }
}
function makeSimpleScorer(param) {
    return {
        calc: (color, monster) => {
            if (monster.target === null) {
                return 0;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target);
            if ((color & monster.color) !== 0) {
                return Math.ceil(1.2 * heart[param]);
            }
            else {
                return heart[param];
            }
        },
    };
}
const MaximumHPScorer = makeSimpleScorer("maximumHP");
const MaximumMPScorer = makeSimpleScorer("maximumMP");
const PowerScorer = makeSimpleScorer("power");
const DefenceScorer = makeSimpleScorer("defence");
const AttackMagicScorer = makeSimpleScorer("attackMagic");
const RecoverMagicScorer = makeSimpleScorer("recoverMagic");
const SpeedScorer = makeSimpleScorer("speed");
const DeftnessScorer = makeSimpleScorer("deftness");
class ExprSyntaxError {
    constructor(p, ss) {
        this.pos = p;
        this.strs = ss;
    }
    getMessage() {
        return `おそらく${this.pos}文字目付近に式の誤りがあります。 ${this.strs[0]} @@@ ${this.strs[1]} @@@ ${this.strs[2]}`;
    }
}
class ExprParser {
    constructor(expr) {
        this.pos = 0;
        this.chars = [...expr];
        this.worderr = null;
    }
    skipWhitespaces() {
        while (this.pos < this.chars.length) {
            if (this.chars[this.pos].match(/^\s+$/)) {
                this.pos++;
            }
            else {
                return;
            }
        }
    }
    next() {
        if (this.pos < this.chars.length) {
            const ch = this.chars[this.pos];
            if (DEBUG) {
                console.log(`next: pos ${this.pos}, ch ${ch}`);
            }
            this.pos++;
            return ch;
        }
        else {
            if (DEBUG) {
                console.log(`next: pos ${this.pos}, EOF`);
            }
            this.pos++;
            return null;
        }
    }
    back() {
        if (this.pos > 0) {
            if (DEBUG) {
                if (this.pos - 1 < this.chars.length) {
                    console.log(`back: pos ${this.pos} -> ${this.pos - 1}, ch ${this.chars[this.pos - 1]}`);
                }
                else {
                    console.log(`back: pos ${this.pos} -> ${this.pos - 1}, EOF`);
                }
            }
            this.pos--;
        }
        else {
            throw "BUG";
        }
    }
    minScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const list = [];
        for (;;) {
            const sc = this.parse();
            if (sc === null) {
                return null;
            }
            list.push(sc);
            if (DEBUG) {
                console.log(`min values count ${list.length}`);
            }
            const ch = this.next();
            if (ch === ")") {
                if (DEBUG) {
                    console.log(`min finally values count ${list.length}`);
                }
                return {
                    calc: (c, m) => {
                        let v = list[0].calc(c, m);
                        for (let i = 1; i < list.length; i++) {
                            v = Math.min(v, list[i].calc(c, m));
                        }
                        return v;
                    }
                };
            }
            else if (ch === ",") {
                continue;
            }
            else {
                return null;
            }
        }
    }
    maxScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const list = [];
        for (;;) {
            const sc = this.parse();
            if (sc === null) {
                return null;
            }
            list.push(sc);
            if (DEBUG) {
                console.log(`max values count ${list.length}`);
            }
            const ch = this.next();
            if (ch === ")") {
                if (DEBUG) {
                    console.log(`max finally values count ${list.length}`);
                }
                return {
                    calc: (c, m) => {
                        let v = list[0].calc(c, m);
                        for (let i = 1; i < list.length; i++) {
                            v = Math.max(v, list[i].calc(c, m));
                        }
                        return v;
                    }
                };
            }
            else if (ch === ",") {
                continue;
            }
            else {
                return null;
            }
        }
    }
    nameScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseWord(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            return null;
        }
        if (monsterMap.has(wd)) {
            return {
                calc: (c, m) => m.name === wd ? 1 : 0
            };
        }
        else {
            this.worderr = [pos0, pos1];
            return null;
        }
    }
    getScorer(ch1) {
        const pos0 = this.pos - 1;
        const sci = this.parseInteger(ch1);
        if (sci !== null) {
            return sci;
        }
        const name = this.parseWord(ch1);
        if (name === null) {
            if (DEBUG) {
                console.log(`unknown token ${ch1}`);
            }
            return null;
        }
        if (DEBUG) {
            console.log(`name ${name}`);
        }
        switch (name) {
            case "HP":
                return MaximumHPScorer;
            case "MP":
                return MaximumMPScorer;
            case "PWR":
                return PowerScorer;
            case "DEF":
                return DefenceScorer;
            case "AMG":
                return AttackMagicScorer;
            case "RMG":
                return RecoverMagicScorer;
            case "SPD":
                return SpeedScorer;
            case "DFT":
                return DeftnessScorer;
            case "MAX":
                return this.maxScorer();
            case "MIN":
                return this.minScorer();
            case "NAME":
                return this.nameScorer();
            default:
                if (DEBUG) {
                    console.log(`name ${name} is undefined`);
                }
                this.worderr = [pos0, this.pos];
                return null;
        }
    }
    parseInteger(ch1) {
        if (ch1.match(/^\D+$/)) {
            return null;
        }
        let v = parseInt(ch1);
        for (;;) {
            const ch = this.next();
            if (ch === null || ch.match(/^\D+$/)) {
                this.back();
                if (DEBUG) {
                    console.log(`integer ${v}`);
                }
                return { calc: (c, m) => v };
            }
            v = v * 10 + parseInt(ch);
        }
    }
    parseWord(ch1) {
        if (ch1.match(/^[\d\s\(\)\+\*,]+$/)) {
            return null;
        }
        let w = ch1;
        for (;;) {
            const ch = this.next();
            if (ch === null || ch.match(/^[\s\(\)\+\*,]+$/)) {
                this.back();
                return w;
            }
            w += ch;
        }
    }
    parseValue() {
        this.skipWhitespaces();
        const ch1 = this.next();
        if (ch1 === null) {
            return null;
        }
        if (ch1 === "(") {
            const sc1 = this.parse();
            if (sc1 === null) {
                return null;
            }
            if (this.next() !== ")") {
                return null;
            }
            return sc1;
        }
        else {
            return this.getScorer(ch1);
        }
    }
    err() {
        let pos1;
        let pos2;
        if (this.worderr !== null) {
            pos1 = this.worderr[0];
            pos2 = this.worderr[1];
        }
        else {
            pos1 = Math.max(0, Math.min(this.pos - 1, this.chars.length));
            pos2 = Math.max(0, Math.min(this.pos + 1, this.chars.length));
        }
        const str1 = this.chars.slice(0, pos1).join("");
        const str2 = this.chars.slice(pos1, pos2).join("");
        const str3 = this.chars.slice(pos2).join("");
        return new ExprSyntaxError(this.pos, [str1, str2, str3]);
    }
    parse() {
        const vStack = [];
        const opStack = [];
        for (;;) {
            const sc1 = this.parseValue();
            if (sc1 === null) {
                return null;
            }
            vStack.push(sc1);
            // 古いTypeScriptではopStack.at(-1)が使えない…？
            while (opStack.length > 0 && opStack[opStack.length - 1] === "*") {
                if (DEBUG) {
                    console.log("apply *");
                }
                opStack.pop();
                const t2 = vStack.pop();
                const t1 = vStack.pop();
                vStack.push({
                    calc: (c, m) => {
                        const v1 = t1.calc(c, m);
                        const v2 = t2.calc(c, m);
                        return v1 * v2;
                    }
                });
            }
            this.skipWhitespaces();
            const ch2 = this.next();
            if (ch2 === null || ch2 === ")" || ch2 === ",") {
                this.back();
                while (opStack.length > 0) {
                    const op = opStack.pop();
                    if (DEBUG) {
                        console.log(`apply ${op}`);
                    }
                    const t2 = vStack.pop();
                    const t1 = vStack.pop();
                    if (op === "+") {
                        vStack.push({
                            calc: (c, m) => {
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 + v2;
                            }
                        });
                    }
                    else if (op === "*") {
                        vStack.push({
                            calc: (c, m) => {
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 * v2;
                            }
                        });
                    }
                }
                return vStack.pop();
            }
            else if (ch2 === "+" || ch2 === "*") {
                if (DEBUG) {
                    console.log(`operator ${ch2}`);
                }
                opStack.push(ch2);
            }
            else {
                if (DEBUG) {
                    console.log(`unknown token ${ch2}`);
                }
                return null;
            }
        }
    }
}
function parseExpression(expr) {
    const parser = new ExprParser(expr);
    const sc = parser.parse();
    if (sc === null) {
        throw parser.err();
    }
    else {
        return sc;
    }
}
function inferSetName(colors) {
    if (colors.length < 3 || colors.length > 4) {
        return "カスタム";
    }
    colors = colors.slice();
    if (colors.length === 3) {
        colors.push(Color.Omit);
    }
    colors.sort((a, b) => a - b);
    for (const job of JobPreset) {
        const jc = job.colors.slice().sort((a, b) => a - b);
        if (colors.every((v, i) => jc[i] === v)) {
            return job.name;
        }
    }
    return "カスタム";
}
function parseTarget(elements) {
    const elem = (name) => elements.namedItem(name);
    const target = {
        setname: "",
        colors: [],
        maximumCost: 0,
        scorer: MaximumHPScorer,
        expr: "",
    };
    for (let i = 1; i <= 4; i++) {
        let color = (elem(`heart${i}_yellow`).checked ? Color.Yellow : Color.Unset) |
            (elem(`heart${i}_purple`).checked ? Color.Purple : Color.Unset) |
            (elem(`heart${i}_green`).checked ? Color.Green : Color.Unset) |
            (elem(`heart${i}_red`).checked ? Color.Red : Color.Unset) |
            (elem(`heart${i}_blue`).checked ? Color.Blue : Color.Unset);
        const omit = elem(`heart${i}_omit`);
        if (omit) {
            if (omit.checked) {
                continue;
            }
        }
        target.colors.push(color);
    }
    target.setname = inferSetName(target.colors);
    target.maximumCost = parseInt(elem("heart_maximum_cost").value);
    switch (elem("goal").value) {
        case "maximumhp":
            target.scorer = MaximumHPScorer;
            target.expr = "HP";
            break;
        case "maximummp":
            target.scorer = MaximumMPScorer;
            target.expr = "MP";
            break;
        case "power":
            target.scorer = PowerScorer;
            target.expr = "力";
            break;
        case "defence":
            target.scorer = DefenceScorer;
            target.expr = "守り";
            break;
        case "attackmagic":
            target.scorer = AttackMagicScorer;
            target.expr = "攻魔";
            break;
        case "recovermagic":
            target.scorer = RecoverMagicScorer;
            target.expr = "回魔";
            break;
        case "speed":
            target.scorer = SpeedScorer;
            target.expr = "早さ";
            break;
        case "deftness":
            target.scorer = DeftnessScorer;
            target.expr = "器用";
            break;
        case "expression":
            const expr = elem("expression").value;
            target.scorer = parseExpression(expr);
            target.expr = expr;
            break;
        default:
            throw `Unknown Maximize Target (${elem("goal").value})`;
    }
    document.getElementById("result_setname").textContent = target.setname;
    const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
    for (let i = 0; i < 4; i++) {
        const e = document.getElementById(`result_heart${i + 1}`);
        e.innerHTML = "";
        if (i < target.colors.length) {
            const color = target.colors[i];
            for (const c of COLORS) {
                if ((c & color) === 0) {
                    continue;
                }
                const info = SingleColorInfoMap.get(c);
                const span = e.appendChild(document.createElement("span"));
                span.classList.add(info.colorName);
                span.textContent = info.text;
            }
        }
        else {
            e.textContent = "－";
        }
    }
    document.getElementById("result_maximumcost").textContent = `${target.maximumCost}`;
    document.getElementById("result_goal").textContent = target.expr;
    return target;
}
function calcNumOfBestHeartSet(target) {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    let dp1 = new Array(SET_LEN);
    let dp2 = new Array(SET_LEN);
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, count: 1 };
    for (const monster of monsterList) {
        if (monster.target === null) {
            continue;
        }
        const cost = monster.cost - monster.hearts.find(h => h.rank === monster.target).maximumCost;
        const scores = target.colors.map(c => target.scorer.calc(c, monster));
        for (let s = 0; s < SET_LEN; s++) {
            for (let c = 0; c < COST_LEN; c++) {
                const state1 = dp1[s][c];
                if (state1 === null) {
                    continue;
                }
                const state2 = dp2[s][c];
                if (state2 === null || state1.score > state2.score) {
                    dp2[s][c] = state1;
                }
                else if (state1.score === state2.score) {
                    state2.count += state1.count;
                }
                const c3 = c + cost;
                if (c3 >= COST_LEN) {
                    continue;
                }
                for (let p = 0; p < COUNT; p++) {
                    const s3 = s | (1 << p);
                    if (s === s3) {
                        continue;
                    }
                    const score3 = state1.score + scores[p];
                    const state4 = dp2[s3][c3];
                    if (state4 === null || score3 > state4.score) {
                        dp2[s3][c3] = {
                            score: score3,
                            count: state1.count,
                        };
                    }
                    else if (score3 === state4.score) {
                        state4.count += state1.count;
                    }
                }
            }
        }
        const dp3 = dp1;
        dp1 = dp2;
        dp2 = dp3;
        dp2.forEach(a => a.fill(null));
    }
    let bestScore = 0;
    let bestCount = 0;
    for (const line of dp1) {
        for (const state of line) {
            if (state === null) {
                continue;
            }
            if (state.score > bestScore) {
                bestScore = state.score;
                bestCount = state.count;
            }
            else if (state.score === bestScore) {
                bestCount += state.count;
            }
        }
    }
    return bestCount;
}
function extractHeartSet(stack, tmp, heartSet) {
    tmp[heartSet.pos] = heartSet.monster;
    if (heartSet.subsets.length === 0) {
        stack.push(tmp.slice());
    }
    else {
        for (const subset of heartSet.subsets) {
            extractHeartSet(stack, tmp, subset);
        }
    }
    tmp[heartSet.pos] = null;
}
function searchHeartSet(target) {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    let dp1 = new Array(SET_LEN);
    let dp2 = new Array(SET_LEN);
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, sets: [] };
    for (const monster of monsterList) {
        if (monster.target === null) {
            continue;
        }
        const cost = monster.cost - monster.hearts.find(h => h.rank === monster.target).maximumCost;
        const scores = target.colors.map(c => target.scorer.calc(c, monster));
        for (let s = 0; s < SET_LEN; s++) {
            for (let c = 0; c < COST_LEN; c++) {
                const state1 = dp1[s][c];
                if (state1 === null) {
                    continue;
                }
                const state2 = dp2[s][c];
                if (state2 === null || state1.score > state2.score) {
                    dp2[s][c] = {
                        score: state1.score,
                        sets: state1.sets.slice(),
                    };
                }
                else if (state1.score === state2.score) {
                    state2.sets = state2.sets.concat(state1.sets);
                }
                const c3 = c + cost;
                if (c3 >= COST_LEN) {
                    continue;
                }
                for (let p = 0; p < COUNT; p++) {
                    const s3 = s | (1 << p);
                    if (s === s3) {
                        continue;
                    }
                    const score3 = state1.score + scores[p];
                    const state4 = dp2[s3][c3];
                    if (state4 === null || score3 > state4.score) {
                        dp2[s3][c3] = {
                            score: score3,
                            sets: [{
                                    pos: p,
                                    monster: monster,
                                    subsets: state1.sets.slice(),
                                }],
                        };
                    }
                    else if (score3 === state4.score) {
                        state4.sets.push({
                            pos: p,
                            monster: monster,
                            subsets: state1.sets.slice(),
                        });
                    }
                }
            }
        }
        const dp3 = dp1;
        dp1 = dp2;
        dp2 = dp3;
        dp2.forEach(a => a.fill(null));
    }
    let best = null;
    for (const line of dp1) {
        for (const state of line) {
            if (state === null) {
                continue;
            }
            if (best === null || state.score > best.score) {
                best = state;
            }
            else if (state.score === best.score) {
                best.sets = best.sets.concat(state.sets);
            }
        }
    }
    const result = document.getElementById("result");
    result.innerHTML = "";
    if (best === null || best.sets.length === 0) {
        result.textContent = "見つかりませんでした";
        return;
    }
    const heartSets = [];
    const monsters = new Array(COUNT).fill(null);
    for (const heartSet of best.sets) {
        extractHeartSet(heartSets, monsters, heartSet);
    }
    const template = document.getElementById("result_item");
    const omitDuplicate = new Map();
    for (const heartSet of heartSets) {
        const st = {
            score: 0,
            maximumHP: 0,
            maximumMP: 0,
            power: 0,
            defence: 0,
            attackMagic: 0,
            recoverMagic: 0,
            speed: 0,
            deftness: 0,
            cost: 0,
            maximumCost: 0,
        };
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const m = heartSet[p];
            if (m === null) {
                continue;
            }
            st.score += target.scorer.calc(c, m);
            st.maximumHP += MaximumHPScorer.calc(c, m);
            st.maximumMP += MaximumMPScorer.calc(c, m);
            st.power += PowerScorer.calc(c, m);
            st.defence += DefenceScorer.calc(c, m);
            st.attackMagic += AttackMagicScorer.calc(c, m);
            st.recoverMagic += RecoverMagicScorer.calc(c, m);
            st.speed += SpeedScorer.calc(c, m);
            st.deftness += DeftnessScorer.calc(c, m);
            st.cost += m.cost;
            st.maximumCost += m.hearts.find(h => h.rank === m.target).maximumCost;
        }
        const key = JSON.stringify({ status: st, hearts: heartSet.map(h => h?.id ?? -1).sort() });
        if (omitDuplicate.has(key)) {
            continue;
        }
        omitDuplicate.set(key, true);
        const fragment = template.content.cloneNode(true);
        const text = (cname, value) => {
            const e = fragment.querySelector(cname);
            e.textContent = `${value}`;
            return e;
        };
        text(".result-item-number", `${omitDuplicate.size}`);
        text(".result-item-score", `${st.score}`);
        text(".result-item-cost", `${st.cost} / ${target.maximumCost} + ${st.maximumCost}`);
        text(".result-item-maximumhp", `${st.maximumHP}`);
        text(".result-item-maximummp", `${st.maximumMP}`);
        text(".result-item-power", `${st.power}`);
        text(".result-item-defence", `${st.defence}`);
        text(".result-item-attackmagic", `${st.attackMagic}`);
        text(".result-item-recovermagic", `${st.recoverMagic}`);
        text(".result-item-speed", `${st.speed}`);
        text(".result-item-deftness", `${st.deftness}`);
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const m = heartSet[p];
            if (m === null) {
                continue;
            }
            const h = fragment.querySelector(`.result-item-heart${p + 1}`);
            const info = SingleColorInfoMap.get(m.color);
            const colorSpan = h.appendChild(document.createElement("span"));
            colorSpan.classList.add(info.colorName);
            colorSpan.textContent = info.text;
            h.appendChild(document.createElement("span")).textContent = `${m.cost}`;
            h.appendChild(document.createElement("span")).textContent = m.name;
            h.appendChild(document.createElement("span")).textContent = Rank[m.target].replace("_plus", "+");
            const hsc = h.appendChild(document.createElement("span"));
            hsc.classList.add("result-item-heart-score");
            hsc.textContent = `( スコア: ${target.scorer.calc(c, m)} )`;
            fragment.querySelector(`.result-item-effects${p + 1}`)
                .textContent = m.hearts.find(h => h.rank === m.target).effects;
        }
        result.appendChild(fragment);
    }
    result.insertBefore(document.createElement("div"), result.firstElementChild)
        .textContent = `件数: ${omitDuplicate.size}`;
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
document.getElementById("heart4_omit")
    .addEventListener("change", () => {
    const omit = document.getElementById("heart4_omit").checked;
    const elem = (id) => {
        const e = document.getElementById(id);
        if (omit) {
            e.checked = false;
        }
        e.disabled = omit;
    };
    // querySelectorAll('[id^="heart4_"]:not([id$="_omit"])') でも取れる？
    elem("heart4_yellow");
    elem("heart4_purple");
    elem("heart4_green");
    elem("heart4_red");
    elem("heart4_blue");
});
document.getElementById("add_heart")
    .addEventListener("click", () => {
    const dialog = document.getElementById("add_heart_dialog");
    dialog.querySelector("form").reset();
    dialog.returnValue = "";
    dialog.showModal();
});
document.getElementById("add_monster_name")
    .addEventListener("change", () => {
    const name = document.getElementById("add_monster_name").value;
    if (monsterMap.has(name)) {
        const monster = monsterMap.get(name);
        const dialog = document.getElementById("add_heart_dialog");
        const elements = dialog.querySelector("form").elements;
        elements.namedItem("add_cost").value = `${monster.cost}`;
        elements.namedItem("add_color").value = `${Color[monster.color]}`;
    }
});
document.querySelector('#add_heart_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    const dialog = document.getElementById("add_heart_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
document.getElementById("add_heart_dialog")
    .addEventListener("close", (event) => {
    const dialog = document.getElementById("add_heart_dialog");
    if (dialog.returnValue !== "add") {
        return;
    }
    const elements = dialog.querySelector("form").elements;
    const rad = (name) => elements.namedItem(name).value;
    const str = (name) => elements.namedItem(name).value;
    const noNaN = (v) => isNaN(v) ? 0 : v;
    const num = (name) => noNaN(parseInt(str(name)));
    const rank = Rank[rad("add_rank")];
    const monster = {
        id: 0,
        name: str("add_monster_name"),
        color: Color[rad("add_color")],
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
                rank: rank,
                maximumCost: num("add_maximumcost"),
                effects: str("add_effects"),
            }],
        target: rank,
    };
    addHeart(monster);
    dialogAlert(`${monster.name} ${Rank[monster.hearts[0].rank]} を追加しました`);
    saveMonsterList();
});
document.getElementById("download")
    .addEventListener("click", () => {
    if (monsterList.length === 0) {
        dialogAlert("リストが空だよ");
        return;
    }
    const link = document.getElementById("downloadlink");
    link.hidden = true;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        link.querySelector("a")
            .href = reader.result;
        link.querySelector("span").textContent = `(${new Date()})`;
        link.hidden = false;
    });
    const json = JSON.stringify(monsterList);
    reader.readAsDataURL(new Blob([json]));
});
document.querySelector('#file_load_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    const dialog = document.getElementById("file_load_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
document.getElementById("load_file")
    .addEventListener("click", () => {
    const dialog = document.getElementById("file_load_dialog");
    dialog.querySelector("form").reset();
    dialog.returnValue = "";
    dialog.showModal();
});
document.getElementById("file_load_dialog")
    .addEventListener("close", () => {
    const dialog = document.getElementById("file_load_dialog");
    if (dialog.returnValue !== "load") {
        return;
    }
    const elements = dialog.querySelector("form").elements;
    const file = elements.namedItem("file").files[0];
    const option = elements.namedItem("file_load_option").value;
    file.text().then(text => {
        const list = JSON.parse(text);
        if (!isMonsterList(list)) {
            throw "ファイルフォーマットが不正です！";
        }
        switch (option) {
            case "file_as_newer":
                addAllMonsterList(list);
                break;
            case "file_as_older":
                mergeMonsterList(list);
                break;
            default:
                replaceMonsterList(list);
                break;
        }
        saveMonsterList();
    }).catch(err => {
        dialogAlert(`${err}`);
    });
});
(function () {
    const e = document.getElementById("expression");
    const ge = document.getElementById("goal_expression");
    const f = () => {
        e.required = ge.checked;
    };
    const goals = document.querySelectorAll('#search_heart_dialog input[name="goal"]');
    for (const goal of goals) {
        goal.addEventListener("change", f);
    }
})();
document.querySelector('#search_heart_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    const dialog = document.getElementById("search_heart_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
document.getElementById("search_heart_dialog")
    .addEventListener("close", () => {
    const dialog = document.getElementById("search_heart_dialog");
    if (dialog.returnValue !== "start") {
        return;
    }
    const elements = dialog.querySelector("form").elements;
    try {
        const target = parseTarget(elements);
        const num = calcNumOfBestHeartSet(target);
        if (num > 100) {
            dialogAlert(`該当する件数が多すぎる ${num}`);
            return;
        }
        searchHeartSet(target);
    }
    catch (err) {
        if (err instanceof ExprSyntaxError) {
            dialogAlert(err.getMessage());
        }
        else {
            dialogAlert(`${err}`);
            console.log(err);
        }
    }
});
document.getElementById("search_heart")
    .addEventListener("click", () => {
    const dialog = document.getElementById("search_heart_dialog");
    dialog.showModal();
});
document.getElementById("check_expression")
    .addEventListener("click", () => {
    const dialog = document.getElementById("score_list_dialog");
    const exprSrc = document.getElementById("expression").value;
    const msg = dialog.querySelector(".message");
    const tbody = dialog.querySelector("tbody");
    msg.innerHTML = "";
    tbody.innerHTML = "";
    if (exprSrc.trim().length === 0) {
        msg.textContent = "式がありません";
    }
    else {
        try {
            const expr = parseExpression(exprSrc);
            if (expr === null) {
                throw "おそらく式に誤りがあります";
            }
            for (const m of monsterList) {
                if (m.target === null) {
                    continue;
                }
                const info = SingleColorInfoMap.get(m.color);
                const tr = tbody.appendChild(document.createElement("tr"));
                const c = tr.appendChild(document.createElement("td"));
                c.classList.add(info.colorName);
                c.textContent = info.text;
                tr.appendChild(document.createElement("td")).textContent = `${m.cost}`;
                tr.appendChild(document.createElement("td")).textContent = m.name;
                tr.appendChild(document.createElement("td")).textContent = Rank[m.target].replace("_plus", "+");
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Unset, m)}`;
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(m.color, m)}`;
            }
        }
        catch (err) {
            if (err instanceof ExprSyntaxError) {
                msg.appendChild(document.createElement("span")).textContent = msg.textContent = `おそらく${err.pos + 1}文字目付近に式の誤りがあります。 `;
                ;
                msg.appendChild(document.createElement("br"));
                const code = msg.appendChild(document.createElement("code"));
                code.classList.add("outline");
                code.appendChild(document.createElement("span")).textContent = err.strs[0];
                const span2 = code.appendChild(document.createElement("span"));
                span2.classList.add("error-expression");
                span2.textContent = err.strs[1];
                code.appendChild(document.createElement("span")).textContent = err.strs[2];
            }
            else {
                msg.textContent = `${err}`;
                console.log(err);
            }
        }
    }
    dialog.showModal();
});
(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.has("demo")) {
        noStorage = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
            .then(r => r.json())
            .then(json => {
            if (isMonsterList(json)) {
                addAllMonsterList(json);
            }
        })
            .catch(err => {
            dialogAlert(`${err}`);
            console.log(err);
        });
    }
    else if (params.has("nostorage")) {
        noStorage = true;
    }
    else {
        loadMonsterList();
    }
})();
if (DEBUG) {
    dialogAlert("[DEBUG] OK");
}
