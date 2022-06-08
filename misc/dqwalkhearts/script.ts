//
// DQ-Walk Hearts
//
// author: Leonardone @ NEETSDKASU
//

const DEBUG: boolean = true;

const LocalStoragePath = "dqwalkhearts";

function dialogAlert(msg: string): void {
    document.getElementById("alert_message")!.textContent = msg;
    const dialog = document.getElementById("alert_dialog")! as HTMLDialogElement;
    dialog.showModal();
}

function binarySearch<T>(arr: Array<T>, value: T, less: (value: T, than: T) => boolean): number {
    // バイナリサーチほしいか否か？
    // 多くて数百個程度のデータからfindIndexするわけだが
    // 一回の処理実行で何度findIndexを呼び出すかが、問題だが
    // （おそらく）ネイティブコード(?)実行で高速かもしれない線形探索のfindIndexと
    // JITあるか分からないJavaScriptコードのバイナリサーチ（二分探索）と
    // どっちが速いんだろうか・・・？
    // そもバイナリサーチというやつが難しすぎて実装できないが
    throw "not implemented";
}

function insert<T>(arr: Array<T>, value: T, less: (value: T, than: T) => boolean): number {
    const index = arr.findIndex(e => less(value, e));
    if (index < 0) {
        arr.push(value);
        return arr.length - 1;
    } else {
        arr.splice(index, 0, value);
        return index;
    }
}

enum Rank {
    S_plus = 0,
    S,
    A,
    B,
    C,
    D,
}

enum Color {
    None   = 1 << 0,
    Yellow = 1 << 1,
    Purple = 1 << 2,
    Green  = 1 << 3,
    Red    = 1 << 4,
    Blue   = 1 << 5,
    Rainbow = Yellow | Purple | Green | Red | Blue,
}

interface Status {
    maximumHP: number;
    maximumMP: number;
    power: number;
    defence: number;
    attackMagic: number;
    recoverMagic: number;
    speed: number;
    deftness: number;
}

interface Monster {
    id: number;
    name: string;
    color: Color;
    cost: number;
    hearts: Heart[];
    target: Rank | null;
}

interface Heart extends Status {
    rank: Rank;
    maximumCost: number;
    effects: string;
}

interface Job {
    id: number;
    name: string;
    colors: Color[];
}

const JobPreset: Job[] = [
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
        colors: [Color.Yellow|Color.Red, Color.Rainbow, Color.Red, Color.Red] },
    { id: 202, name: "賢者",
        colors: [Color.Green|Color.Purple, Color.Rainbow, Color.Green|Color.Purple, Color.Green|Color.Purple] },
    { id: 203, name: "レンジャー",
        colors: [Color.Red|Color.Blue, Color.Rainbow, Color.Blue, Color.Blue] },
    { id: 204, name: "魔法戦士",
        colors: [Color.Yellow|Color.Purple, Color.Rainbow, Color.Yellow|Color.Purple, Color.Yellow|Color.Purple] },
    { id: 205, name: "パラディン",
        colors: [Color.Yellow|Color.Green, Color.Rainbow, Color.Yellow, Color.Yellow] },
    { id: 206, name: "スーパースター",
        colors: [Color.Blue|Color.Green, Color.Rainbow, Color.Blue, Color.Green] },
    { id: 207, name: "海賊",
        colors: [Color.Yellow|Color.Blue, Color.Rainbow, Color.Yellow, Color.Blue] },
    { id: 208, name: "まものマスター",
        colors: [Color.Rainbow, Color.Rainbow, Color.Blue|Color.Purple, Color.Blue|Color.Purple] },
];

interface SingleColorInfo {
    color: Color;
    text: string;
    colorName: string;
}

const SingleColorInfoMap: Map<Color, SingleColorInfo> = (() => {
    const m = new Map();
    m.set(Color.Yellow, { color: Color.Yellow, text: "黄(戦)", colorName: "yellow" });
    m.set(Color.Purple, { color: Color.Purple, text: "紫(魔)", colorName: "purple" });
    m.set(Color.Green, { color: Color.Green, text: "緑(僧)", colorName: "green" });
    m.set(Color.Red, { color: Color.Red, text: "赤(武)", colorName: "red" });
    m.set(Color.Blue, { color: Color.Blue, text: "青(盗)", colorName: "blue" });
    return m;
})();

let monsterMap: Map<string, Monster> = new Map();
let monsterList: Monster[] = [];
let monsterNameList: string[] = [];

let noStorage: boolean = false;

function saveMonsterList(): void {
    if (noStorage) {
        return;
    }
    try {
        const json = JSON.stringify(monsterList);
        window.localStorage.setItem(LocalStoragePath, json);
    } catch (err) {
        noStorage = true;
        console.log(err);
    }
}

function loadMonsterList(): void {
    if (noStorage) {
        return;
    }
    try {
        const json = window.localStorage.getItem(LocalStoragePath);
        if (json !== null) {
            const list: unknown = JSON.parse(json);
            if (isMonsterList(list)) {
                addAllMonsterList(list);
            }
        }
    } catch (err) {
        noStorage = true;
        console.log(err);
    }
}

function showNewHeart(monster: Monster): void {
    const template = document.getElementById("heart_list_item") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const text = (cname: string, value: any): HTMLElement => {
        const e = fragment.querySelector(cname) as HTMLElement;
        e.textContent = `${value}`;
        return e;
    };
    text(".monster-name", monster.name);
    text(".monster-cost", monster.cost);
    const csi = SingleColorInfoMap.get(monster.color)!;
    text(".monster-color", csi.text).classList.add(csi.colorName);
    const radios = fragment.querySelectorAll('input.monster-rank');
    const monsterRankRadioName = `monster_${monster.id}_rank`;
    for (const radio of radios) {
        const elm = radio as HTMLInputElement;
        elm.name = monsterRankRadioName;
        if (elm.value === "omit") {
            elm.addEventListener("change", () => {
                monster.target = null;
                showUpdatedHeart(monster, false);
            });
        } else {
            const rank = Rank[elm.value as keyof typeof Rank];
            elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            elm.addEventListener("change", () => {
                monster.target = rank;
                showUpdatedHeart(monster, false);
            });
        }
    }
    if (monster.target === null) {
        fragment.firstElementChild!.classList.add("omit");
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
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
    } else {
        const heart = monster.hearts.find(h => h.rank === monster.target)!;
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value as keyof typeof Rank];
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
    fragment.querySelector("button")!.addEventListener("click", () => {
        const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
        const form = dialog.querySelector("form") as HTMLFormElement;
        form.reset();
        const elements = form.elements;
        const elem = (name: string, value: string) => {
            (elements.namedItem(name) as HTMLInputElement).value = value;
        };
        elem("add_monster_name", monster.name);
        elem("add_cost", `${monster.cost}`);
        elem("add_color", `${Color[monster.color]}`);
        if (monster.target !== null) {
            elem("add_rank", `${Rank[monster.target]}`);
            const h = monster.hearts.find(h => h.rank === monster.target)!;
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
    fragment.firstElementChild!.id = `monster-${monster.id}`;
    const holder = document.getElementById("heart_list")!;
    const index = monsterList.findIndex(m => m.id === monster.id);
    if (index + 1 === monsterList.length) {
        holder.appendChild(fragment);
    } else {
        const next = document.getElementById(`monster-${monsterList[index+1].id}`);
        holder.insertBefore(fragment, next);
    }
}

function showUpdatedHeart(monster: Monster, reorder: boolean): void {
    const item = document.getElementById(`monster-${monster.id}`)!;
    if (reorder) {
        const holder = document.getElementById("heart_list")!;
        holder.removeChild(item);
        const index = monsterList.findIndex(m => m.id === monster.id);
        if (index + 1 === monsterList.length) {
            holder.appendChild(item);
        } else {
            const next = document.getElementById(`monster-${monsterList[index+1].id}`);
            holder.insertBefore(item, next);
        }
    }
    const text = (cname: string, value: any): HTMLElement => {
        const e = item.querySelector(cname) as HTMLElement;
        e.textContent = `${value}`;
        return e;
    };
    text(".monster-name", monster.name);
    text(".monster-cost", monster.cost);
    const csi = SingleColorInfoMap.get(monster.color)!;
    const classList = text(".monster-color", csi.text).classList;
    SingleColorInfoMap.forEach( (v) => {
        classList.remove(v.colorName);
    });
    classList.add(csi.colorName);
    const radios = item.querySelectorAll('input.monster-rank');
    if (monster.target === null) {
        item.classList.add("omit");
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value as keyof typeof Rank];
                elm.disabled = monster.hearts.findIndex(h => h.rank === rank) < 0;
            } else {
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
    } else {
        item.classList.remove("omit");
        const heart = monster.hearts.find(h => h.rank === monster.target)!;
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value as keyof typeof Rank];
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

function addMonsterNameList(newName: string): void {
    const item = document.createElement("option");
    item.value = newName;
    const list = document.getElementById("monster_name_list")!;
    const index = insert(monsterNameList, newName, (n, e) => n < e);
    if (index + 1 === monsterNameList.length) {
        list.appendChild(item);
    } else {
        const before = list.children[index];
        list.insertBefore(item, before);
    }
}

function addHeart(newMonster: Monster): void {
    if (monsterMap.has(newMonster.name)) {
        const monster = monsterMap.get(newMonster.name)!;
        for (const heart of newMonster.hearts) {
            const index = monster.hearts.findIndex(h => h.rank === heart.rank);
            if (index < 0) {
                monster.hearts.push(heart);
            } else {
                monster.hearts[index] = heart;
            }
        }
        monster.target = newMonster.target;
        monster.color = newMonster.color;
        if (monster.cost === newMonster.cost) {
            showUpdatedHeart(monster, false);
        } else {
            monster.cost = newMonster.cost;
            monsterList.sort((a, b) => b.cost - a.cost);
            showUpdatedHeart(monster, true);
        }
    } else {
        addMonsterNameList(newMonster.name);
        newMonster.id = monsterList.length;
        monsterMap.set(newMonster.name, newMonster);
        insert(monsterList, newMonster, (n, e) => n.cost > e.cost);
        showNewHeart(newMonster);
    }
}

function setPreset(job: Job): void {
    function update(n: number, c: string, v: number): void {
        const id = `heart${n+1}_${c}`;
        const elem = document.getElementById(id);
        if (elem) {
            (elem as HTMLInputElement).checked = v !== 0;
        }
    }
    for (let i = 0; i < 4; i++) {
        const color = job.colors[i];
        update(i, "yellow", color & Color.Yellow);
        update(i, "purple", color & Color.Purple);
        update(i, "green",  color & Color.Green);
        update(i, "red",    color & Color.Red);
        update(i, "blue",   color & Color.Blue);
        update(i, "omit",   color & Color.None);
    }
    {
        const omit = (document.getElementById("heart4_omit") as HTMLInputElement).checked;
        const elem = (id: string) => {
            const e = document.getElementById(id) as HTMLInputElement;
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

function isMonsterList(obj: Monster[] | unknown): obj is Monster[] {
    if (!Array.isArray(obj)) {
        console.log("こころリストじゃないJSONファイル");
        console.log(obj);
        return false;
    }
    const list = obj as (Monster | unknown)[];
    for (const monster of list) {
        if (!isMonster(monster)) {
            return false;
        }
    }
    return true
}

function isMonster(anyobj: Monster | unknown): anyobj is Monster {
    if (typeof anyobj !== "object" || anyobj === null) {
        console.log("オブジェクト型じゃない");
        console.log(anyobj);
        return false;
    }
    const obj: {[index: string]: any} = anyobj;
    const monster1: Monster = {
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
    const monster2: Monster = {
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
        const x = typeof monster1[param as keyof Monster];
        const y = monster2[param as keyof Monster];
        const value = obj[param];
        if (x !== typeof value && y !== value) {
            console.log(`パラメータの型が一致しない ${param} ${x} ${y}`);
            console.log(value);
            console.log(obj);
            return false;
        }
    }
    const m = obj as Monster;
    if (m.color in Color === false) {
        console.log("Colorに存在しない値が設定されている")
        console.log(obj);
        return false;
    }
    if (m.target !== null && m.target in Rank === false) {
        console.log("Rankに存在しない値が設定されている")
        console.log(obj);
        return false;
    }
    if (!Array.isArray(m.hearts)) {
        console.log("こころの配列がない")
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
            const x = typeof heart[param as keyof Heart];
            const y = typeof h[param as keyof Heart];
            if (x !== y) {
                console.log(`パラメータの型が一致しない ${param} ${x}`);
                console.log(y);
                console.log(h);
                console.log(obj);
                return false;
            }
        }
        if (h.rank in Rank === false) {
            console.log("Rankに存在しない値が設定されている")
            console.log(h);
            console.log(obj);
            return false;
        }
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
            return false
        }
    }
    return true;
}

function replaceMonsterList(newMonsterList: Monster[]): void {
    monsterMap = new Map();
    monsterList = [];
    monsterNameList = [];
    document.getElementById("monster_name_list")!.innerHTML = "";
    document.getElementById("heart_list")!.innerHTML = "";
    for (const monster of newMonsterList) {
        addHeart(monster);
    }
}

function addAllMonsterList(list: Monster[]): void {
    for (const monster of list) {
        addHeart(monster);
    }
}

function mergeMonsterList(list: Monster[]): void {
    for (const monster of list) {
        if (monsterMap.has(monster.name)) {
            const orig = monsterMap.get(monster.name)!;
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

document.getElementById("preset_heartset")!
.addEventListener("change", () => {
    const sel = document.getElementById("preset_heartset") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id === value) {
            setPreset(job);
            return;
        }
    }
    dialogAlert(`Unknown ID: ${value}`);
});

document.getElementById("heart4_omit")!
.addEventListener("change", () => {
    const omit = (document.getElementById("heart4_omit") as HTMLInputElement).checked;
    const elem = (id: string) => {
        const e = document.getElementById(id) as HTMLInputElement;
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

document.getElementById("add_heart")!
.addEventListener("click", () => {
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    (dialog.querySelector("form") as HTMLFormElement).reset();
    dialog.showModal();
});

document.getElementById("add_monster_name")!
.addEventListener("change", () => {
    const name = (document.getElementById("add_monster_name") as HTMLInputElement).value;
    if (monsterMap.has(name)) {
        const monster = monsterMap.get(name)!;
        const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
        const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
        (elements.namedItem("add_cost") as HTMLInputElement).value = `${monster.cost}`;
        (elements.namedItem("add_color") as HTMLInputElement).value = `${Color[monster.color]}`;
    }
});

document.querySelector('#add_heart_dialog button[value="cancel"]')!
.addEventListener("click", () => {
    (document.getElementById("add_heart_dialog") as HTMLDialogElement).close();
});

document.getElementById("add_heart_dialog")!
.addEventListener("close", (event) => {
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "add") {
        return;
    }
    const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
    const str = (name: string) => (elements.namedItem(name) as HTMLInputElement).value;
    const noNaN = (v: number) => isNaN(v) ? 0 : v;
    const num = (name: string) => noNaN(parseInt(str(name)));
    const rank = Rank[str("add_rank") as keyof typeof Rank];
    const monster: Monster = {
        id: 0,
        name: str("add_monster_name"),
        color: Color[str("add_color") as keyof typeof Color],
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
    saveMonsterList();
});

document.getElementById("download")!
.addEventListener("click", () => {
    if (monsterList.length === 0) {
        dialogAlert("リストが空だよ");
        return;
    }
    const link = document.getElementById("downloadlink")!;
    link.hidden = true;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        (link.querySelector("a") as HTMLAnchorElement)
            .href = reader.result as string;
        link.querySelector("span")!.textContent = `(${new Date()})`;
        link.hidden = false;
    });
    const json = JSON.stringify(monsterList);
    reader.readAsDataURL(new Blob([json]));
});

document.querySelector('#file_load_dialog button[value="cancel"]')!
.addEventListener("click", () => {
    (document.getElementById("file_load_dialog") as HTMLDialogElement).close();
});

document.getElementById("load_file")!
.addEventListener("click", () => {
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    (dialog.querySelector("form") as HTMLFormElement).reset();
    dialog.showModal();
});

document.getElementById("file_load_dialog")!
.addEventListener("close", () => {
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "load") {
        return;
    }
    const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
    const file = (elements.namedItem("file") as HTMLInputElement).files![0];
    const option = (elements.namedItem("file_load_option") as HTMLInputElement).value;
    file.text().then( text => {
        const list: unknown = JSON.parse(text);
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
    }).catch( err => {
        dialogAlert(`${err}`);
    });
});

(function () {
    const params = new URLSearchParams(window.location.search);
    if (params.has("demo")) {
        noStorage = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
        .then(r => r.json())
        .then( json => {
            if (isMonsterList(json)) {
                addAllMonsterList(json);
            }
        })
        .catch(err => {
            dialogAlert(`${err}`);
            console.log(err);
        });
    } else if (params.has("nostorage")) {
        noStorage = true;
    } else {
        loadMonsterList();
    }
})();

if (DEBUG) {
    dialogAlert("[DEBUG] OK");
}
