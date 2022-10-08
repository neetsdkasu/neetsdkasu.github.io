"use strict";
//
// DQ-Walk Hearts
//
// author: Leonardone @ NEETSDKASU
//
const DEVELOP = false;
const DEBUG = DEVELOP || new URLSearchParams(window.location.search).has("DEBUG");
if (DEBUG) {
    console.log("DEBUG MODE");
}
const LocalStoragePath = "dqwalkhearts";
function dialogAlert(msg) {
    if (DEBUG) {
        console.log(`dialogAlert: ${msg}`);
    }
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
// 配列に昇順で新しいアイテムを挿入する
// 挿入箇所は線形探索で求める
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
    { id: 101, name: "戦士", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Yellow, Color.Yellow, Color.Omit] },
    { id: 102, name: "魔法使い", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Purple, Color.Purple, Color.Omit] },
    { id: 103, name: "僧侶", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Green, Color.Green, Color.Omit] },
    { id: 104, name: "武闘家", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Red, Color.Red, Color.Omit] },
    { id: 105, name: "盗賊", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Blue, Color.Blue, Color.Omit] },
    { id: 106, name: "踊り子", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Blue, Color.Green, Color.Omit] },
    { id: 107, name: "遊び人", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Blue, Color.Purple, Color.Omit] },
    { id: 201, name: "バトルマスター", powerUp: 1.2,
        colors: [Color.Yellow | Color.Red, Color.Rainbow, Color.Red, Color.Red] },
    { id: 202, name: "賢者", powerUp: 1.2,
        colors: [Color.Green | Color.Purple, Color.Rainbow, Color.Green | Color.Purple, Color.Green | Color.Purple] },
    { id: 203, name: "レンジャー", powerUp: 1.2,
        colors: [Color.Red | Color.Blue, Color.Rainbow, Color.Blue, Color.Blue] },
    { id: 204, name: "魔法戦士", powerUp: 1.2,
        colors: [Color.Yellow | Color.Purple, Color.Rainbow, Color.Yellow | Color.Purple, Color.Yellow | Color.Purple] },
    { id: 205, name: "パラディン", powerUp: 1.2,
        colors: [Color.Yellow | Color.Green, Color.Rainbow, Color.Yellow, Color.Yellow] },
    { id: 206, name: "スーパースター", powerUp: 1.2,
        colors: [Color.Blue | Color.Green, Color.Rainbow, Color.Blue, Color.Green] },
    { id: 207, name: "海賊", powerUp: 1.2,
        colors: [Color.Yellow | Color.Blue, Color.Rainbow, Color.Yellow, Color.Blue] },
    { id: 208, name: "まものマスター", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Rainbow, Color.Blue | Color.Purple, Color.Blue | Color.Purple] },
    { id: 301, name: "ゴッドハンド", powerUp: 1.3,
        colors: [Color.Yellow | Color.Red, Color.Rainbow, Color.Red, Color.Yellow] }
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
const RainbowColorInfo = {
    color: Color.Rainbow,
    text: "虹(？)",
    colorName: "rainbow",
};
let monsterMap = new Map();
let monsterList = [];
let monsterNameList = [];
let noStorage = false;
const IDENT = Date.now();
if (DEBUG) {
    console.log(`IDENT: ${IDENT}`);
}
var Trigger;
(function (Trigger) {
    Trigger[Trigger["UpdateStatus"] = 0] = "UpdateStatus";
    Trigger[Trigger["ChooseRank"] = 1] = "ChooseRank";
})(Trigger || (Trigger = {}));
// こころリストをブラウザのストレージに保存
function saveMonsterList(trigger) {
    if (DEBUG) {
        console.log(`call saveMonsterList(${Trigger[trigger]})`);
    }
    if (noStorage) {
        if (DEBUG) {
            console.log("no save to storage");
        }
        return;
    }
    try {
        const data = {
            ident: IDENT,
            trigger: trigger,
            monsterList: monsterList
        };
        const json = JSON.stringify(data);
        window.localStorage.setItem(LocalStoragePath, json);
        if (DEBUG) {
            console.log("saved to storage");
        }
    }
    catch (err) {
        noStorage = true;
        console.log(err);
    }
}
// こころリストをブラウザのストレージから読み込む
function loadMonsterList() {
    if (DEBUG) {
        console.log("call loadMonsterList");
    }
    if (noStorage) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.localStorage.getItem(LocalStoragePath);
        if (json !== null) {
            const data = JSON.parse(json);
            if (isData(data)) {
                addAllMonsterList(data.monsterList);
                if (DEBUG) {
                    console.log("load from storage (Data)");
                }
            }
            else if (isMonsterList(data)) {
                addAllMonsterList(data);
                if (DEBUG) {
                    console.log("load from storage (Monster[])");
                }
            }
        }
    }
    catch (err) {
        noStorage = true;
        console.log(err);
    }
}
// 別のタブやウインドウでlocalStorageに変更があった場合に呼び出される
window.addEventListener("storage", e => {
    if (DEBUG) {
        console.log("updated storage");
    }
    if (e instanceof StorageEvent) {
        if (DEBUG) {
            console.log(`storage key: ${e.key}`);
        }
        if (e.key !== LocalStoragePath) {
            console.log(`not dqwalkhearts data`);
            return;
        }
        if (e.newValue === null) {
            console.log("delete value");
            return;
        }
        const data = JSON.parse(e.newValue);
        let tempList = [];
        if (isData(data)) {
            if (DEBUG) {
                console.log(`ident: ${data.ident} (this window: ${IDENT})`);
            }
            if (data.ident === IDENT) {
                // ここには到達しないはず
                // 到達する場合は、別タブ・別ウインドウでIDENTが同時タイミングで生成されたとき…
                // Date.now()の精度が悪くて、ブラウザ(PC)のパフォーマンスが高速だと、ありうる
                return;
            }
            if (data.trigger === Trigger.ChooseRank) {
                if (DEBUG) {
                    console.log("trigger is ChooseRank");
                }
                return;
            }
            tempList = data.monsterList;
        }
        else if (isMonsterList(data)) {
            if (DEBUG) {
                console.log("update by old script");
            }
            tempList = data;
        }
        for (const m of tempList) {
            if (monsterMap.has(m.name)) {
                const orig = monsterMap.get(m.name);
                m.target = orig.target;
            }
        }
        const updated = addAllMonsterList(tempList);
        if (DEBUG) {
            if (updated) {
                console.log("update monsterList");
            }
            else {
                console.log("no update monsterList");
            }
        }
    }
});
function isData(anyobj) {
    if (typeof anyobj !== "object" || anyobj === null) {
        return false;
    }
    const obj = anyobj;
    if (!(("ident" in obj) && typeof obj["ident"] === "number")) {
        return false;
    }
    if (!(("trigger" in obj) && (obj["trigger"] === Trigger.ChooseRank || obj["trigger"] === Trigger.UpdateStatus))) {
        return false;
    }
    if (!(("monsterList" in obj) && isMonsterList(obj["monsterList"]))) {
        return false;
    }
    return true;
}
function updateChangedRankCount() {
    let count = 0;
    for (const monster of monsterList) {
        if (monster.target === null) {
            count++;
            continue;
        }
        if (monster.hearts.length === 1) {
            continue;
        }
        if (!monster.hearts.every(h => h.rank >= monster.target)) {
            count++;
        }
    }
    document.getElementById("changed_rank_count").textContent = `${count}`;
}
// 新規のモンスター名になるこころを追加したときのこころ表示処理
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
    const csi = (monster.color === Color.Rainbow)
        ? RainbowColorInfo
        : SingleColorInfoMap.get(monster.color);
    text(".monster-color", csi.text).classList.add(csi.colorName);
    const radios = fragment.querySelectorAll('input.monster-rank');
    const monsterRankRadioName = `monster_${monster.id}_rank`;
    for (const radio of radios) {
        const elm = radio;
        elm.name = monsterRankRadioName;
        if (elm.value === "omit") {
            elm.addEventListener("change", () => {
                monster.target = null;
                saveMonsterList(Trigger.ChooseRank);
                showUpdatedHeart(monster, false);
                updateChangedRankCount();
            });
        }
        else {
            const rank = Rank[elm.value];
            elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            elm.addEventListener("change", () => {
                monster.target = rank;
                saveMonsterList(Trigger.ChooseRank);
                showUpdatedHeart(monster, false);
                updateChangedRankCount();
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
        text(".monster-dexterity", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
    }
    else {
        if (!monster.hearts.every(h => h.rank >= monster.target)) {
            fragment.firstElementChild.classList.add("not-best");
        }
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
        text(".monster-dexterity", heart.dexterity);
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
            elem("add_dexterity", `${h.dexterity}`);
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
// 表示済みのモンスターのこころの情報を最新情報で表示しなおす
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
    const csi = (monster.color === Color.Rainbow)
        ? RainbowColorInfo
        : SingleColorInfoMap.get(monster.color);
    const classList = text(".monster-color", csi.text).classList;
    SingleColorInfoMap.forEach((v) => {
        classList.remove(v.colorName);
    });
    classList.remove(RainbowColorInfo.colorName);
    classList.add(csi.colorName);
    const radios = item.querySelectorAll('input.monster-rank');
    if (monster.target === null) {
        item.classList.remove("not-best");
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
        text(".monster-dexterity", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
    }
    else {
        item.classList.remove("omit");
        if (monster.hearts.every(h => h.rank >= monster.target)) {
            item.classList.remove("not-best");
        }
        else {
            item.classList.add("not-best");
        }
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
        text(".monster-dexterity", heart.dexterity);
        text(".monster-maximumcost", heart.maximumCost);
        text(".monster-effects", heart.effects);
    }
}
// モンスター名リストに新しいモンスター名を追加する
// ※モンスター名リストはこころ追加フォームのブラウザのサジェスト機能に利用される
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
// ２つのこころが等しいかどうか
function equalHearts(h1, h2) {
    for (const param in h1) {
        if (h1[param] !== h2[param]) {
            return false;
        }
    }
    return true;
}
// 新しいこころを追加する（情報は上書きされる）
function addHeart(newMonster) {
    if (monsterMap.has(newMonster.name)) {
        const monster = monsterMap.get(newMonster.name);
        let updated = false;
        for (const heart of newMonster.hearts) {
            const index = monster.hearts.findIndex(h => h.rank === heart.rank);
            if (index < 0) {
                monster.hearts.push(heart);
                updated = true;
            }
            else if (!equalHearts(monster.hearts[index], heart)) {
                monster.hearts[index] = heart;
                updated = true;
            }
        }
        if (monster.target !== newMonster.target) {
            monster.target = newMonster.target;
            updated = true;
        }
        if (monster.color !== newMonster.color) {
            monster.color = newMonster.color;
            updated = true;
        }
        if (monster.cost === newMonster.cost) {
            if (!updated) {
                return false;
            }
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
    return true;
}
// 職業ごとのこころ枠の組み合わせをフォームに設定する
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
    document.getElementById("heart_power_up").value = `${job.powerUp}`;
}
// 読み込んだjsonファイルがMonster[]かどうかを確認する
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
// オブジェクトがMonster型かどうかを確認する
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
                dexterity: 1,
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
                if (param === "dexterity" && ("deftness" in h)) {
                    h["dexterity"] = h["deftness"];
                    delete h["deftness"];
                }
                else {
                    console.log(`パラメータが存在しない ${param}`);
                    console.log(h);
                    console.log(obj);
                    return false;
                }
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
        if (m.color === Color.Unset || m.color === Color.Omit) {
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
// 現在のこころリストを破棄して新しいこころリストに置き換える
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
// 現在のこころリストに別のこころリストで上書きする
// ※同一モンスターの情報があった場合に引数のこころリストのほうが優先される
function addAllMonsterList(list) {
    let updated = false;
    for (const monster of list) {
        if (addHeart(monster)) {
            updated = true;
        }
    }
    if (DEBUG) {
        console.log(`addAllMonsterList: updated: ${updated}`);
    }
    return updated;
}
// 現在のこころリストに別のこころリストをマージする
// ※同一モンスターの情報があった場合に現在のこころリストのほうが優先される
function mergeMonsterList(list) {
    let updated = false;
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
        if (addHeart(monster)) {
            updated = true;
        }
    }
    if (DEBUG) {
        console.log(`mergeMonsterList: updated: ${updated}`);
    }
    return updated;
}
let powerUp = 1.2;
function updatePowerUp() {
    powerUp = parseFloat(document.getElementById("heart_power_up").value);
}
// こころの基本のパラメータだけ見るシンプルなスコア計算オブジェクトを生成する
function makeSimpleScorer(param) {
    return {
        calc: (color, monster) => {
            if (monster.target === null) {
                return 0;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target);
            if ((color & monster.color) !== 0) {
                return Math.ceil(powerUp * heart[param]);
            }
            else {
                return heart[param];
            }
        },
    };
}
// 計算結果の正負を逆にする
function toMinusScorer(sc) {
    return {
        calc: (color, monster) => {
            if (monster.target === null) {
                return 0;
            }
            return -sc.calc(color, monster);
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
const DexterityScorer = makeSimpleScorer("dexterity");
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
    isEOF() {
        return this.pos >= this.chars.length;
    }
    // 空白文字をスキップ
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
    // 現在位置の文字を取得し、かつ、現在位置を1文字分進める
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
    // 現在位置を1文字分戻る
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
    // MIN
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
                        if (m.target === null) {
                            return 0;
                        }
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
    // MAX
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
                        if (m.target === 0) {
                            return 0;
                        }
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
    // LESS
    lessScorer() {
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
                console.log(`less values count ${list.length}`);
            }
            const ch = this.next();
            if (ch === ")") {
                if (DEBUG) {
                    console.log(`less finally values count ${list.length}`);
                }
                return {
                    calc: (c, m) => {
                        if (m.target === null) {
                            return 0;
                        }
                        let v = list[0].calc(c, m);
                        for (let i = 1; i < list.length; i++) {
                            const w = list[i].calc(c, m);
                            if (v < w) {
                                v = w;
                            }
                            else {
                                return 0;
                            }
                        }
                        return 1;
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
    // ABS
    absScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const sc = this.parse();
        if (sc === null) {
            return null;
        }
        const ch = this.next();
        if (ch === ")") {
            return {
                calc: (c, m) => {
                    if (m.target === null) {
                        return 0;
                    }
                    return Math.abs(sc.calc(c, m));
                }
            };
        }
        else {
            return null;
        }
    }
    // NAME
    nameScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (monsterMap.has(wd)) {
            if (this.next() !== ")") {
                return null;
            }
            return {
                calc: (c, m) => {
                    if (m.target === null) {
                        return 0;
                    }
                    return m.name === wd ? 1 : 0;
                }
            };
        }
        else {
            this.worderr = [pos0, pos1];
            return null;
        }
    }
    // COLOR
    colorScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        let color = null;
        for (const info of SingleColorInfoMap.values()) {
            if (info.text.startsWith(wd)) {
                color = info.color;
                break;
            }
        }
        if (RainbowColorInfo.text.startsWith(wd)) {
            color = RainbowColorInfo.color;
        }
        if (color === null) {
            this.worderr = [pos0, pos1];
            return null;
        }
        if (this.next() !== ")") {
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                return m.color === color ? 1 : 0;
            }
        };
    }
    // SKILL
    skillNameScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)
                    .effects
                    .split(/,|\s+/)
                    .includes(wd) ? 1 : 0;
            }
        };
    }
    // FIND
    partOfSkillNameScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)
                    .effects
                    .includes(wd) ? 1 : 0;
            }
        };
    }
    // COUNT
    countOfPartOfSkillNameScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)
                    .effects
                    .split(/,|\s+/)
                    .reduce((a, s) => a + (s.includes(wd) ? 1 : 0), 0);
            }
        };
    }
    // NUM
    pickNumberFromSkillScorer() {
        if (this.next() !== "(") {
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            return null;
        }
        const wds = wd.split("#");
        if (wds.length !== 2) {
            this.worderr = [pos0, pos1];
            return null;
        }
        if (DEBUG) {
            console.log(`pick "${wds[0]}", "${wds[1]}"`);
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                const skill = m.hearts
                    .find(h => h.rank === m.target)
                    .effects
                    .split(/,|\s+/)
                    .find(s => s.startsWith(wds[0]) && s.endsWith(wds[1]));
                if (skill) {
                    const e = skill.lastIndexOf(wds[1]);
                    const n = skill.slice(0, e).replace(wds[0], "");
                    if (DEBUG) {
                        console.log(`pick "${skill}", "${e}", "${n}"`);
                    }
                    if (n.match(/^\d+$/)) {
                        return parseInt(n);
                    }
                }
                return 0;
            }
        };
    }
    // スコア計算の種類を特定して返す
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
            case "DEX":
                return DexterityScorer;
            case "MAX":
                return this.maxScorer();
            case "MIN":
                return this.minScorer();
            case "NAME":
                return this.nameScorer();
            case "SKILL":
                return this.skillNameScorer();
            case "FIND":
                return this.partOfSkillNameScorer();
            case "COUNT":
                return this.countOfPartOfSkillNameScorer();
            case "NUM":
                return this.pickNumberFromSkillScorer();
            case "LESS":
                return this.lessScorer();
            case "COST":
                return { calc: (c, m) => {
                        return (m.target === null) ? 0 : m.cost;
                    } };
            case "COLOR":
                return this.colorScorer();
            case "ABS":
                return this.absScorer();
            case "FIT":
                return { calc: (c, m) => {
                        if (m.target === null) {
                            return 0;
                        }
                        return ((c & m.color) !== 0) ? 1 : 0;
                    } };
            default:
                if (DEBUG) {
                    console.log(`name ${name} is undefined`);
                }
                this.worderr = [pos0, this.pos];
                return null;
        }
    }
    // 数値リテラル
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
                return { calc: (c, m) => {
                        return (m.target === null) ? 0 : v;
                    } };
            }
            v = v * 10 + parseInt(ch);
        }
    }
    // 文字列のパース（引数の名前に使える文字）
    parseName(ch1) {
        if (ch1.match(/^[\s\(\),]+$/)) {
            return null;
        }
        let w = ch1;
        for (;;) {
            const ch = this.next();
            if (ch === null || ch.match(/^[\s\(\),]+$/)) {
                this.back();
                return w;
            }
            w += ch;
        }
    }
    // 文字列のパース（式に使える文字）
    parseWord(ch1) {
        if (ch1.match(/^[\d\s\(\)\+\-\*,]+$/)) {
            return null;
        }
        let w = ch1;
        for (;;) {
            const ch = this.next();
            if (ch === null || ch.match(/^[\s\(\)\+\-\*,]+$/)) {
                this.back();
                return w;
            }
            w += ch;
        }
    }
    // 何らかの値（数値や関数）
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
    // エラーの取得
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
    // 部分式をパースする(再帰的実行されるので結果的に式全体をパースすることになる)
    parse() {
        const vStack = [];
        const opStack = [];
        let minus = false;
        for (;;) {
            let sc1 = this.parseValue();
            if (sc1 === null) {
                return null;
            }
            if (minus) {
                sc1 = toMinusScorer(sc1);
                minus = false;
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
                        if (m.target === null) {
                            return 0;
                        }
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
                                if (m.target === null) {
                                    return 0;
                                }
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 + v2;
                            }
                        });
                    }
                    else if (op === "*") {
                        vStack.push({
                            calc: (c, m) => {
                                if (m.target === null) {
                                    return 0;
                                }
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
            else if (ch2 === "-") {
                if (DEBUG) {
                    console.log(`operator ${ch2}`);
                }
                minus = true;
                opStack.push("+");
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
// 式をパースする
function parseExpression(expr) {
    const parser = new ExprParser(expr);
    const sc = parser.parse();
    if (sc === null) {
        throw parser.err();
    }
    parser.skipWhitespaces();
    if (parser.isEOF()) {
        return sc;
    }
    else {
        throw parser.err();
    }
}
// こころ枠の組み合わせから職業名を特定する
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
            if (`${job.powerUp}` === `${powerUp}`) {
                return job.name;
            }
        }
    }
    return "カスタム";
}
// フォーム情報を解析する
function parseTarget(elements) {
    updatePowerUp();
    const elem = (name) => elements.namedItem(name);
    const target = {
        setname: "",
        colors: [],
        maximumCost: 0,
        asLimitCost: false,
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
    target.asLimitCost = elem("as_limit_heart_cost").checked;
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
        case "dexterity":
            target.scorer = DexterityScorer;
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
    document.getElementById("result_power_up").textContent = `${powerUp}`;
    document.getElementById("result_maximumcost").textContent = `${target.maximumCost}`;
    document.getElementById("result_goal").textContent = target.expr;
    return target;
}
// 最大スコアのこころセットの組み合わせ数を求めるだけ
// 組み合わせ爆発回避用
// TODO 最終的なベストの組み合わせ数だけじゃなく、
//      途中段階で異常な組み合わせ数が出る可能性を考慮したほうがいい
//      メモリ不足回避のために
function calcNumOfBestHeartSet(target) {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost = target.asLimitCost
        ? (m => m.cost)
        : (m => m.cost - m.hearts.find(h => h.rank === m.target).maximumCost);
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
        const cost = getCost(monster);
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
// ツリー上になってるこころセットの組み合わせを展開する
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
// ベストなこころ組み合わせを求めて表示する
function searchHeartSet(target) {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost = target.asLimitCost
        ? (m => m.cost)
        : (m => m.cost - m.hearts.find(h => h.rank === m.target).maximumCost);
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
        const cost = getCost(monster);
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
            dexterity: 0,
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
            st.dexterity += DexterityScorer.calc(c, m);
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
        text(".result-item-dexterity", `${st.dexterity}`);
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const m = heartSet[p];
            if (m === null) {
                continue;
            }
            const h = fragment.querySelector(`.result-item-heart${p + 1}`);
            const info = (m.color === Color.Rainbow)
                ? RainbowColorInfo
                : SingleColorInfoMap.get(m.color);
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
// デモ用データの加工
function convertToDummy(list) {
    if (DEBUG) {
        console.log("fill dummy data");
    }
    for (let i = 0; i < list.length; i++) {
        list[i].name = `ダミーデータ${i + 1}`;
        for (const h of list[i].hearts) {
            h.effects = h.effects
                .replace(/(メラ|ヒャド|イオ|ギラ|バギ|デイン|ジバリア|ドルマ)(斬|体|呪|R)/g, "$1属性$2")
                .replace(/スキル(斬|体)/g, "スキルの$1")
                .replace(/体D/g, "体技D")
                .replace(/斬体R/g, "斬体技R")
                .replace(/斬体/g, "斬・体")
                .replace(/斬/g, "斬撃")
                .replace(/(鳥|物質|ゾンビ|ドラゴン|スライム|水|けもの|エレメント|マシン|植物|怪人|虫|悪魔|？？？？)/g, "$1系への")
                .replace(/回復\+(\d)/g, "回復効果+$1")
                .replace(/P(\d+)回復/g, "Pを$1回復する")
                .replace(/呪文/g, "じゅもん")
                .replace(/全状態異常/g, "すべての状態異常")
                .replace(/悪状態変化/g, "悪い状態変化")
                .replace(/最大(HP|MP)/g, "さいだい$1")
                .replace(/戦闘時/g, "戦闘時の")
                .replace(/道具/g, "どうぐ")
                .replace(/D/g, "ダメージ")
                .replace(/R/g, "耐性");
        }
    }
}
/////////////////////////////////////////////////////////////////////////////////////
// 職業ごとのこころ枠の組み合わせをフォームに設定する
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
// こころ枠の不使用を設定/解除に色のオプションの有効/無効を切り替える
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
// こころ追加フォームを開く
document.getElementById("add_heart")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click add_heart");
    }
    const dialog = document.getElementById("add_heart_dialog");
    dialog.querySelector("form").reset();
    dialog.returnValue = "";
    dialog.showModal();
});
// こころ追加フォームにおいて登録済みモンスター名を入れたときにコストや色を自動補完する
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
// こころ追加フォームでキャンセルしたとき
document.querySelector('#add_heart_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click add_heart_dialog CANCEL button");
    }
    const dialog = document.getElementById("add_heart_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
// 新しいこころを追加する（フォームを閉じたときに発動）
document.getElementById("add_heart_dialog")
    .addEventListener("close", (event) => {
    if (DEBUG) {
        console.log("close add_heart_dialog");
    }
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
        name: str("add_monster_name").trim(),
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
                dexterity: num("add_dexterity"),
                rank: rank,
                maximumCost: num("add_maximumcost"),
                effects: str("add_effects").trim(),
            }],
        target: rank,
    };
    const updated = addHeart(monster);
    if (DEBUG) {
        console.log(`add heart: updated: ${updated}`);
    }
    dialogAlert(`${monster.name} ${Rank[monster.hearts[0].rank]} を追加しました`);
    if (updated) {
        saveMonsterList(Trigger.UpdateStatus);
    }
    updateChangedRankCount();
});
// ダウンロードボタンを押したときの処理
document.getElementById("download")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click download");
    }
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
// ファイル読込フォームのキャンセル
document.querySelector('#file_load_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click file_load_dialog CANCEL button");
    }
    const dialog = document.getElementById("file_load_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
// ファイル読込フォームを開く
document.getElementById("load_file")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click load_file");
    }
    const dialog = document.getElementById("file_load_dialog");
    dialog.querySelector("form").reset();
    dialog.returnValue = "";
    dialog.showModal();
});
// ファイルを読み込む（フォームを閉じたときに発動）
document.getElementById("file_load_dialog")
    .addEventListener("close", () => {
    if (DEBUG) {
        console.log("close file_as_older");
    }
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
        let updated = false;
        switch (option) {
            case "file_as_newer":
                updated = addAllMonsterList(list);
                break;
            case "file_as_older":
                updated = mergeMonsterList(list);
                break;
            default:
                replaceMonsterList(list);
                updated = true;
                break;
        }
        if (updated) {
            saveMonsterList(Trigger.UpdateStatus);
        }
        updateChangedRankCount();
    }).catch(err => {
        dialogAlert(`${err}`);
    });
});
// 最大化するオプションで式を選んだときと式から切り替えたときのフォーム見た目の処理
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
// こころセット探索対象の設定フォームのキャンセル
document.querySelector('#search_heart_dialog button[value="cancel"]')
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click search_heart_dialog CANCEL button");
    }
    const dialog = document.getElementById("search_heart_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
// こころセットを探索する（フォームを閉じたときに発動）
document.getElementById("search_heart_dialog")
    .addEventListener("close", () => {
    if (DEBUG) {
        console.log("close check_heart_dialog");
    }
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
// こころセット探索フォームを開く
document.getElementById("search_heart")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click search_heart");
    }
    const dialog = document.getElementById("search_heart_dialog");
    dialog.showModal();
});
// 式の確認ボタンを押した時の処理
document.getElementById("check_expression")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expression");
    }
    updatePowerUp();
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
                const info = (m.color === Color.Rainbow)
                    ? RainbowColorInfo
                    : SingleColorInfoMap.get(m.color);
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
/////////////////////////////////////////////////////////////////////////////////////
// ステータス近距離を求める
document.getElementById("calc_status_distance").addEventListener("click", () => {
    const tbody = document.getElementById("status_distance_tbody");
    tbody.innerHTML = "";
    if (monsterList.length === 0) {
        dialogAlert("こころが１個もないよ");
        return;
    }
    function isUpward(m, target) {
        return m.maximumHP <= target.maximumHP
            && m.maximumMP <= target.maximumMP
            && m.power <= target.power
            && m.defence <= target.defence
            && m.attackMagic <= target.attackMagic
            && m.recoverMagic <= target.recoverMagic
            && m.speed <= target.speed
            && m.dexterity <= target.dexterity
            && (m.maximumHP < target.maximumHP
                || m.maximumMP < target.maximumMP
                || m.power < target.power
                || m.defence < target.defence
                || m.attackMagic < target.attackMagic
                || m.recoverMagic < target.recoverMagic
                || m.speed < target.speed
                || m.dexterity < target.dexterity);
    }
    function euclidean(m1, m2) {
        return Math.sqrt(Math.pow(m1.maximumHP - m2.maximumHP, 2)
            + Math.pow(m1.maximumMP - m2.maximumMP, 2)
            + Math.pow(m1.power - m2.power, 2)
            + Math.pow(m1.defence - m2.defence, 2)
            + Math.pow(m1.attackMagic - m2.attackMagic, 2)
            + Math.pow(m1.recoverMagic - m2.recoverMagic, 2)
            + Math.pow(m1.speed - m2.speed, 2)
            + Math.pow(m1.dexterity - m2.dexterity, 2));
    }
    function manhattan(m1, m2) {
        return Math.abs(m1.maximumHP - m2.maximumHP)
            + Math.abs(m1.maximumMP - m2.maximumMP)
            + Math.abs(m1.power - m2.power)
            + Math.abs(m1.defence - m2.defence)
            + Math.abs(m1.attackMagic - m2.attackMagic)
            + Math.abs(m1.recoverMagic - m2.recoverMagic)
            + Math.abs(m1.speed - m2.speed)
            + Math.abs(m1.dexterity - m2.dexterity);
    }
    for (let a = 0; a < monsterList.length; a++) {
        let upwardMinCost = { monster: null, distance: 9999999 };
        let upwardEuclidean = { monster: null, distance: 9999999 };
        let upwardManhattan = { monster: null, distance: 9999999 };
        let downwardEuclidean = { monster: null, distance: 9999999 };
        let downwardManhattan = { monster: null, distance: 9999999 };
        let nearestEuclidean = { monster: null, distance: 9999999 };
        let nearestManhattan = { monster: null, distance: 9999999 };
        const m1 = monsterList[a];
        if (m1.target === null) {
            continue;
        }
        const h1 = m1.hearts.find(h => h.rank === m1.target);
        for (let b = 0; b < monsterList.length; b++) {
            if (a === b) {
                continue;
            }
            const m2 = monsterList[b];
            if (m2.target === null) {
                continue;
            }
            const h2 = m2.hearts.find(h => h.rank === m2.target);
            let ed = euclidean(h1, h2);
            let md = manhattan(h1, h2);
            if (isUpward(h1, h2)) {
                const cd = (m2.cost - h2.maximumCost) - (m1.cost - h1.maximumCost);
                if (cd < upwardMinCost.distance) {
                    upwardMinCost.monster = m2;
                    upwardMinCost.distance = cd;
                }
                if (ed < upwardEuclidean.distance) {
                    upwardEuclidean.monster = m2;
                    upwardEuclidean.distance = ed;
                }
                if (md < upwardManhattan.distance) {
                    upwardManhattan.monster = m2;
                    upwardManhattan.distance = md;
                    ;
                }
            }
            if (isUpward(h2, h1)) {
                if (ed < downwardEuclidean.distance) {
                    downwardEuclidean.monster = m2;
                    downwardEuclidean.distance = ed;
                }
                if (md < downwardManhattan.distance) {
                    downwardManhattan.monster = m2;
                    downwardManhattan.distance = md;
                    ;
                }
            }
            if (ed < nearestEuclidean.distance) {
                nearestEuclidean.monster = m2;
                nearestEuclidean.distance = ed;
            }
            if (md < nearestManhattan.distance) {
                nearestManhattan.monster = m2;
                nearestManhattan.distance = md;
            }
        }
        const tr = tbody.appendChild(document.createElement("tr"));
        const targetTd = tr.appendChild(document.createElement("td"));
        const targetSpan = targetTd.appendChild(document.createElement("span"));
        const targetInfo = m1.color === Color.Rainbow
            ? RainbowColorInfo
            : SingleColorInfoMap.get(m1.color);
        targetSpan.classList.add(targetInfo.colorName);
        targetSpan.textContent = targetInfo.text;
        targetTd.appendChild(document.createElement("span")).textContent =
            `${m1.cost} ${m1.name} ${Rank[m1.target]}`;
        function append(ds) {
            const td = tr.appendChild(document.createElement("td"));
            if (ds.monster === null) {
                td.textContent = "－";
                return;
            }
            const info = ds.monster.color === Color.Rainbow
                ? RainbowColorInfo
                : SingleColorInfoMap.get(ds.monster.color);
            const span = td.appendChild(document.createElement("span"));
            span.classList.add(info.colorName);
            span.textContent = info.text;
            td.appendChild(document.createElement("span")).textContent =
                `${ds.monster.cost} ${ds.monster.name} ${Rank[ds.monster.target]} (${Math.ceil(ds.distance)})`;
        }
        append(upwardMinCost);
        append(upwardEuclidean);
        append(upwardManhattan);
        append(downwardEuclidean);
        append(downwardManhattan);
        append(nearestEuclidean);
        append(nearestManhattan);
    }
});
/////////////////////////////////////////////////////////////////////////////////////
class DamageToolData {
    constructor(name) {
        this.damageRating = 0;
        this.count = 0;
        this.attackPower = 0;
        this.attackMagic = 0;
        this.zangeki = 0;
        this.taigi = 0;
        this.jumon = 0;
        this.typeA = 0;
        this.typeB = 0;
        this.typeC = 0;
        this.typeAZangeki = 0;
        this.typeBZangeki = 0;
        this.typeCZangeki = 0;
        this.typeATaigi = 0;
        this.typeBTaigi = 0;
        this.typeCTaigi = 0;
        this.typeAJumon = 0;
        this.typeBJumon = 0;
        this.typeCJumon = 0;
        this.monsterX = 0;
        this.monsterY = 0;
        this.monsterZ = 0;
        this.name = name;
    }
}
const damageToolUtil = {
    heartsetCount: 0,
    skillCount: 0,
    nextHeartsetCount: () => {
        damageToolUtil.heartsetCount++;
        return damageToolUtil.heartsetCount;
    },
    nextSkillCount: () => {
        damageToolUtil.skillCount++;
        return damageToolUtil.skillCount;
    },
    getNonheart: () => {
        const res = new DamageToolData("");
        const form = document.getElementById("damage_nonheart");
        const value = (n) => {
            const v = parseInt(form.querySelector(`input[name="${n}"]`).value);
            return Number.isNaN(v) ? 0 : v;
        };
        const value100 = (n) => value(n) / 100;
        res.attackPower = value("damage_nonheart_attack_power");
        res.attackMagic = value("damage_nonheart_attack_magic");
        res.zangeki = value100("damage_nonheart_zangeki");
        res.taigi = value100("damage_nonheart_taigi");
        res.jumon = value100("damage_nonheart_jumon");
        res.typeA = value100("damage_nonheart_type_a");
        res.typeB = value100("damage_nonheart_type_b");
        res.typeC = value100("damage_nonheart_type_c");
        res.typeAZangeki = value100("damage_nonheart_type_a_zangeki");
        res.typeBZangeki = value100("damage_nonheart_type_b_zangeki");
        res.typeCZangeki = value100("damage_nonheart_type_c_zangeki");
        res.typeATaigi = value100("damage_nonheart_type_a_taigi");
        res.typeBTaigi = value100("damage_nonheart_type_b_taigi");
        res.typeCTaigi = value100("damage_nonheart_type_c_taigi");
        res.typeAJumon = value100("damage_nonheart_type_a_jumon");
        res.typeBJumon = value100("damage_nonheart_type_b_jumon");
        res.typeCJumon = value100("damage_nonheart_type_c_jumon");
        res.monsterX = value100("damage_nonheart_monster_x");
        res.monsterY = value100("damage_nonheart_monster_y");
        res.monsterZ = value100("damage_nonheart_monster_z");
        return res;
    },
    getHeartsetList: () => {
        const res = [];
        const heartsetList = document.getElementById("damage_heartset_list").querySelectorAll(".damage_heartset");
        for (const heartset of heartsetList) {
            const elem = (n) => heartset.querySelector(`input[name="${n}"]`);
            if (!elem("damage_heart_use").checked) {
                continue;
            }
            const value = (n) => {
                const v = parseInt(elem(n).value);
                return Number.isNaN(v) ? 0 : v;
            };
            const value100 = (n) => value(n) / 100;
            const data = new DamageToolData(elem("damage_heart_name").value);
            data.attackPower = value("damage_heart_attack_power");
            data.attackMagic = value("damage_heart_attack_magic");
            data.zangeki = value100("damage_heart_zangeki");
            data.taigi = value100("damage_heart_taigi");
            data.jumon = value100("damage_heart_jumon");
            data.typeA = value100("damage_heart_type_a");
            data.typeB = value100("damage_heart_type_b");
            data.typeC = value100("damage_heart_type_c");
            data.typeAZangeki = value100("damage_heart_type_a_zangeki");
            data.typeBZangeki = value100("damage_heart_type_b_zangeki");
            data.typeCZangeki = value100("damage_heart_type_c_zangeki");
            data.typeATaigi = value100("damage_heart_type_a_taigi");
            data.typeBTaigi = value100("damage_heart_type_b_taigi");
            data.typeCTaigi = value100("damage_heart_type_c_taigi");
            data.typeAJumon = value100("damage_heart_type_a_jumon");
            data.typeBJumon = value100("damage_heart_type_b_jumon");
            data.typeCJumon = value100("damage_heart_type_c_jumon");
            data.monsterX = value100("damage_heart_monster_x");
            data.monsterY = value100("damage_heart_monster_y");
            data.monsterZ = value100("damage_heart_monster_z");
            res.push(data);
        }
        return res;
    },
    getSkillSetList: () => {
        const res = [];
        const skillList = document.getElementById("damage_skill_list").querySelectorAll(".damage_skill");
        for (const skill of skillList) {
            const elem = (n) => skill.querySelector(`input[name="${n}"]`);
            if (!elem("damage_skill_use").checked) {
                continue;
            }
            const value = (n) => {
                const v = parseInt(elem(n).value);
                return Number.isNaN(v) ? 0 : v;
            };
            const selValue = (n) => skill.querySelector(`select[name="${n}"]`).value;
            const data = new DamageToolData(elem("damage_skill_name").value);
            const skillAttackBase = selValue("damage_skill_attack_base");
            if (skillAttackBase === "攻撃力") {
                data.attackPower = 1;
            }
            else if (skillAttackBase === "攻撃魔力") {
                data.attackMagic = 1;
            }
            else {
                data.attackPower = 1;
                data.attackMagic = 1;
            }
            data.damageRating = value("damage_skill_damage_rating") / 100;
            data.count = value("damage_skill_count");
            const skillForm = selValue("damage_skill_form");
            if (skillForm === "斬撃") {
                data.zangeki = 1;
            }
            else if (skillForm === "体技") {
                data.taigi = 1;
            }
            else {
                data.jumon = 1;
            }
            const skillType = selValue("damage_skill_type");
            if (skillType === "属性A") {
                data.typeA = 1;
                data.typeAZangeki = data.zangeki;
                data.typeATaigi = data.taigi;
                data.typeAJumon = data.jumon;
            }
            else if (skillType === "属性B") {
                data.typeB = 1;
                data.typeBZangeki = data.zangeki;
                data.typeBTaigi = data.taigi;
                data.typeBJumon = data.jumon;
            }
            else if (skillType === "属性C") {
                data.typeC = 1;
                data.typeCZangeki = data.zangeki;
                data.typeCTaigi = data.taigi;
                data.typeCJumon = data.jumon;
            }
            /*
                const skillMonster = selValue("damage_skill_monster");
                if (skillMonster === "系統X") {
                    data.monsterX = 1;
                } else if (skillMonster === "系統Y") {
                    data.monsterY = 1;
                } else if (skillMonster === "系統Z") {
                    data.monsterZ = 1;
                }
            */
            res.push(data);
        }
        return res;
    },
};
// ダメージ計算のこころセット追加
document.getElementById("add_damage_heartset").addEventListener("click", () => {
    const template = document.getElementById("damage_heartset_list_item");
    const fragment = template.content.cloneNode(true);
    const name = fragment.querySelector(`input[name="damage_heart_name"]`);
    name.value = `こころセット${damageToolUtil.nextHeartsetCount()}`;
    document.getElementById("damage_heartset_list").appendChild(fragment);
});
// ダメージ計算のスキル追加
document.getElementById("add_damage_skill").addEventListener("click", () => {
    const template = document.getElementById("damage_skill_list_item");
    const fragment = template.content.cloneNode(true);
    const name = fragment.querySelector(`input[name="damage_skill_name"]`);
    name.value = `スキル${damageToolUtil.nextSkillCount()}`;
    document.getElementById("damage_skill_list").appendChild(fragment);
});
// ダメージ計算
document.getElementById("calc_damages").addEventListener("click", () => {
    const result = document.getElementById("damage_result");
    result.innerHTML = "";
    const nonHeart = damageToolUtil.getNonheart();
    const heartsetList = damageToolUtil.getHeartsetList();
    const skillList = damageToolUtil.getSkillSetList();
    const list = [
        {
            title: "系統なし",
            calc: (heartset) => 1
        },
        {
            title: "系統X",
            calc: (heartset) => 1 + nonHeart.monsterX + heartset.monsterX
        },
        {
            title: "系統Y",
            calc: (heartset) => 1 + nonHeart.monsterY + heartset.monsterY
        },
        {
            title: "系統Z",
            calc: (heartset) => 1 + nonHeart.monsterZ + heartset.monsterZ
        }
    ];
    for (const m of list) {
        const nonDetails = result.appendChild(document.createElement("details"));
        nonDetails.classList.add("outline");
        nonDetails.appendChild(document.createElement("summary")).textContent = m.title;
        for (let defence = 0; defence <= 1000; defence += 100) {
            const det = nonDetails.appendChild(document.createElement("details"));
            det.classList.add("outline");
            const header = det.appendChild(document.createElement("summary"));
            header.classList.add("small");
            header.textContent = `守備力 ${defence}`;
            const table = det.appendChild(document.createElement("table"));
            const theadTr = table.appendChild(document.createElement("thead"))
                .appendChild(document.createElement("tr"));
            theadTr.appendChild(document.createElement("th"));
            theadTr.appendChild(document.createElement("th")).textContent = "通常攻撃";
            for (const skill of skillList) {
                theadTr.appendChild(document.createElement("th")).textContent = skill.name;
            }
            const tbody = table.appendChild(document.createElement("tbody"));
            for (const heartset of heartsetList) {
                const tr = tbody.appendChild(document.createElement("tr"));
                tr.appendChild(document.createElement("th")).textContent = heartset.name;
                const baseDamage = Math.max(0, Math.floor((nonHeart.attackPower + heartset.attackPower) / 2 - defence / 4));
                let td = tr.appendChild(document.createElement("td"));
                td.classList.add("textright");
                td.textContent = `${Math.floor(baseDamage * m.calc(heartset))}`;
                for (const skill of skillList) {
                    const attack = skill.attackPower * (nonHeart.attackPower + heartset.attackPower) +
                        skill.attackMagic * (nonHeart.attackMagic + heartset.attackMagic);
                    const skillBaseDamage = Math.max(0, Math.floor(attack / 2 - (1 - skill.jumon) * defence / 4));
                    const damage = skillBaseDamage *
                        skill.damageRating *
                        (1 + skill.zangeki * (nonHeart.zangeki + heartset.zangeki)) *
                        (1 + skill.taigi * (nonHeart.taigi + heartset.taigi)) *
                        (1 + skill.jumon * (nonHeart.jumon + heartset.jumon)) *
                        (1 + skill.typeA * (nonHeart.typeA + heartset.typeA) +
                            skill.typeAZangeki * (nonHeart.typeAZangeki + heartset.typeAZangeki) +
                            skill.typeATaigi * (nonHeart.typeATaigi + heartset.typeATaigi) +
                            skill.typeAJumon * (nonHeart.typeAJumon + heartset.typeAJumon)) *
                        (1 + skill.typeB * (nonHeart.typeB + heartset.typeB) +
                            skill.typeBZangeki * (nonHeart.typeBZangeki + heartset.typeBZangeki) +
                            skill.typeBTaigi * (nonHeart.typeBTaigi + heartset.typeBTaigi) +
                            skill.typeBJumon * (nonHeart.typeBJumon + heartset.typeBJumon)) *
                        (1 + skill.typeC * (nonHeart.typeC + heartset.typeC) +
                            skill.typeCZangeki * (nonHeart.typeCZangeki + heartset.typeCZangeki) +
                            skill.typeCTaigi * (nonHeart.typeCTaigi + heartset.typeCTaigi) +
                            skill.typeCJumon * (nonHeart.typeCJumon + heartset.typeCJumon)) *
                        m.calc(heartset);
                    td = tr.appendChild(document.createElement("td"));
                    td.classList.add("textright");
                    td.textContent = `${Math.max(0, Math.floor(damage) * skill.count)}`;
                }
            }
        }
    }
});
/////////////////////////////////////////////////////////////////////////////////////
// ページのURLのパラメータの処理
(function () {
    const params = new URLSearchParams(window.location.search);
    if (DEBUG) {
        console.log(`page URL parameters: ${params}`);
    }
    if (params.has("expose")) {
        // 非公開機能を利用
        if (DEBUG) {
            console.log("expose secrets");
        }
        const secrets = document.querySelectorAll(".secret");
        for (const sec of secrets) {
            sec.classList.remove("secret");
        }
    }
    if (params.has("online")) {
        // テスト用データのリストを使用、ローカルストレージの利用なし
        if (DEBUG) {
            console.log("load online data");
        }
        noStorage = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
            .then(r => r.json())
            .then(json => {
            if (isMonsterList(json)) {
                addAllMonsterList(json);
                updateChangedRankCount();
            }
        })
            .catch(err => {
            dialogAlert(`${err}`);
            console.log(err);
        });
    }
    else if (params.has("demo")) {
        // デモ用データのリストを使用、ローカルストレージの利用なし
        if (DEBUG) {
            console.log("load demo data");
        }
        noStorage = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
            .then(r => r.json())
            .then(json => {
            if (isMonsterList(json)) {
                convertToDummy(json);
                addAllMonsterList(json);
                updateChangedRankCount();
            }
        })
            .catch(err => {
            dialogAlert(`${err}`);
            console.log(err);
        });
    }
    else if (params.has("nostorage")) {
        // 初期リストなし、ローカルストレージの利用もなし
        if (DEBUG) {
            console.log("no storage mode");
        }
        noStorage = true;
    }
    else {
        // ローカルストレージのリストを利用
        loadMonsterList();
        updateChangedRankCount();
    }
})();
// デバッグモードであることの確認
if (DEBUG) {
    dialogAlert("[DEBUG] OK");
}
