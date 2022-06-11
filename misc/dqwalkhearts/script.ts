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
    Unset  = 0,
    Omit   = 1 << 0,
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
        const rad = (name: string, value: string) => {
            (elements.namedItem(name) as RadioNodeList).value = value;
        };
        const elem = (name: string, value: string) => {
            (elements.namedItem(name) as HTMLInputElement).value = value;
        };
        elem("add_monster_name", monster.name);
        elem("add_cost", `${monster.cost}`);
        rad("add_color", `${Color[monster.color]}`);
        if (monster.target !== null) {
            rad("add_rank", `${Rank[monster.target]}`);
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
        update(i, "omit",   color & Color.Omit);
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
    const list = obj as unknown[];
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
    const obj: {[key: string]: any} = anyobj; // ここキャストできる理由わからない
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
    const m = obj as Monster; // ここキャストできる理由わからない
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
                return false
            }
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

function makeSimpleScorer(param: keyof Status): Scorer {
    return {
        calc: (color: Color, monster: Monster) => {
            if (monster.target === null) {
                return 0;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target)!;
            if ((color & monster.color) !== 0) {
                return Math.ceil(1.2 * heart[param]);
            } else {
                return heart[param];
            }
        },
    };
}

interface Scorer {
    calc: (color: Color, monster: Monster) => number;
}

interface Target {
    setname: string;
    colors: Color[];
    maximumCost: number;
    scorer: Scorer;
    expr: string;
}

const MaximumHPScorer:    Scorer = makeSimpleScorer("maximumHP");
const MaximumMPScorer:    Scorer = makeSimpleScorer("maximumMP");
const PowerScorer:        Scorer = makeSimpleScorer("power");
const DefenceScorer:      Scorer = makeSimpleScorer("defence");
const AttackMagicScorer:  Scorer = makeSimpleScorer("attackMagic");
const RecoverMagicScorer: Scorer = makeSimpleScorer("recoverMagic");
const SpeedScorer:        Scorer = makeSimpleScorer("speed");
const DeftnessScorer:     Scorer = makeSimpleScorer("deftness");

class ExprParser {
    pos: number;
    chars: string[];

    constructor(expr: string) {
        this.pos = 0;
        this.chars = [...expr];
    }

    skipWhitespaces(): void {
        while (this.pos < this.chars.length) {
            if (this.chars[this.pos].match(/^\s+$/)) {
                this.pos++;
            } else {
                return;
            }
        }
    }

    next(): string | null {
        if (this.pos < this.chars.length) {
            const ch = this.chars[this.pos];
            if (DEBUG) {
                console.log(`next: pos ${this.pos}, ch ${ch}`);
            }
            this.pos++;
            return ch;
        } else {
            if (DEBUG) {
                console.log(`next: pos ${this.pos}, EOF`);
            }
            this.pos++;
            return null;
        }
    }

    back(): void {
        if (this.pos > 0) {
            if (DEBUG) {
                if (this.pos-1 < this.chars.length) {
                    console.log(`back: pos ${this.pos} -> ${this.pos-1}, ch ${this.chars[this.pos-1]}`);
                } else {
                    console.log(`back: pos ${this.pos} -> ${this.pos-1}, EOF`);
                }
            }
            this.pos--;
        } else {
            throw "BUG";
        }
    }

    getScorer(ch1: string): Scorer | null {
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
            default:
                if (DEBUG) {
                    console.log(`name ${name} is undefined`);
                }
                return null;
        }
    }

    parseInteger(ch1: string): Scorer | null {
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
                return { calc: (c: Color, m: Monster) => v };
            }
            v = v * 10 + parseInt(ch);
        }
    }

    parseWord(ch1: string): string | null {
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

    parseValue(): Scorer | null {
        this.skipWhitespaces();
        const ch1 = this.next();
        if (ch1 === null) {
            return null;
        }
        if (ch1 === "(") {
            const sc1 = this.parse();
            if (this.next() !== ")") {
                return null;
            }
            return sc1;
        } else {
            return this.getScorer(ch1);
        }
    }

    parse(): Scorer | null {
        const vStack: Scorer[] = [];
        const opStack: string[] = [];
        for (;;) {
            const sc1 = this.parseValue();
            if (sc1 === null) {
                return null;
            }
            vStack.push(sc1);
            // 古いTypeScriptではopStack.at(-1)が使えない…？
            while (opStack.length > 0 && opStack[opStack.length-1] === "*") {
                if (DEBUG) {
                    console.log("apply *");
                }
                opStack.pop();
                const t2 = vStack.pop()!;
                const t1 = vStack.pop()!;
                vStack.push({
                    calc: (c: Color, m: Monster) => {
                        const v1 = t1.calc(c, m);
                        const v2 = t2.calc(c, m);
                        return v1 * v2;
                    }
                });
            }
            this.skipWhitespaces();
            const ch2 = this.next();
            if (ch2 === null || ch2 === ")") {
                this.back();
                while (opStack.length > 0) {
                    const op = opStack.pop()!;
                    if (DEBUG) {
                        console.log(`apply ${op}`);
                    }
                    const t2 = vStack.pop()!;
                    const t1 = vStack.pop()!;
                    if (op === "+") {
                        vStack.push({
                            calc: (c: Color, m: Monster) => {
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 + v2;
                            }
                        });
                    } else if (op === "*") {
                        vStack.push({
                            calc: (c: Color, m: Monster) => {
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 * v2;
                            }
                        });
                    }
                }
                return vStack.pop()!;
            } else if (ch2 === "+" || ch2 === "*") {
                if (DEBUG) {
                    console.log(`operator ${ch2}`);
                }
                opStack.push(ch2);
            } else {
                if (DEBUG) {
                    console.log(`unknown token ${ch2}`);
                }
                return null;
            }
        }
    }
}

function parseExpression(expr: string): Scorer {
    const parser = new ExprParser(expr);
    const sc = parser.parse();
    if (sc === null) {
        throw "Expression is not implemented yet";
    } else {
        return sc;
    }
}

function inferSetName(colors: Color[]): string {
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

function parseTarget(elements: HTMLFormControlsCollection): Target {
    const elem = (name: string) => elements.namedItem(name) as (HTMLInputElement | null);
    const target: Target = {
        setname: "",
        colors: [],
        maximumCost: 0,
        scorer: MaximumHPScorer,
        expr: "",
    };
    for (let i = 1; i <= 4; i++) {
        let color: Color =
            (elem(`heart${i}_yellow`)!.checked ? Color.Yellow : Color.Unset) |
            (elem(`heart${i}_purple`)!.checked ? Color.Purple : Color.Unset) |
            (elem(`heart${i}_green` )!.checked ? Color.Green  : Color.Unset) |
            (elem(`heart${i}_red`   )!.checked ? Color.Red    : Color.Unset) |
            (elem(`heart${i}_blue`  )!.checked ? Color.Blue   : Color.Unset);
        const omit = elem(`heart${i}_omit`);
        if (omit) {
            if (omit.checked) {
                continue;
            }
        }
        target.colors.push(color);
    }
    target.setname = inferSetName(target.colors);
    target.maximumCost = parseInt(elem("heart_maximum_cost")!.value);
    switch (elem("goal")!.value) {
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
        const expr = elem("expression")!.value;
        target.scorer = parseExpression(expr);
        target.expr = expr;
        break;
    default:
        throw `Unknown Maximize Target (${elem("goal")!.value})`;
    }
    document.getElementById("result_setname")!.textContent = target.setname;
    const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
    for (let i = 0; i < 4; i++) {
        const e = document.getElementById(`result_heart${i+1}`)!;
        e.innerHTML = "";
        if (i < target.colors.length) {
            const color = target.colors[i];
            for (const c of COLORS) {
                if ((c & color) === 0) {
                    continue;
                }
                const info = SingleColorInfoMap.get(c)!;
                const span = e.appendChild(document.createElement("span"));
                span.classList.add(info.colorName);
                span.textContent = info.text;
            }
        } else {
            e.textContent = "－";
        }
    }
    document.getElementById("result_maximumcost")!.textContent = `${target.maximumCost}`;
    document.getElementById("result_goal")!.textContent = target.expr;
    return target;
}

interface HeartSet {
    pos: number;
    monster: Monster;
    subsets: HeartSet[];
}

interface State {
    score: number;
    sets: HeartSet[];
}

interface NumState {
    score: number;
    count: number;
}

function calcNumOfBestHeartSet(target: Target): number {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    let dp1: (NumState | null)[][] = new Array(SET_LEN);
    let dp2: (NumState | null)[][] = new Array(SET_LEN);
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, count: 1 };
    for (const monster of monsterList) {
        if (monster.target === null) {
            continue;
        }
        const cost = monster.cost - monster.hearts.find(h => h.rank === monster.target)!.maximumCost;
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
                } else if (state1.score === state2.score) {
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
                    } else if (score3 === state4.score) {
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
            } else if (state.score === bestScore) {
                bestCount += state.count;
            }
        }
    }
    return bestCount;
}

function extractHeartSet(stack: (Monster | null)[][], tmp: (Monster | null)[], heartSet: HeartSet) {
    tmp[heartSet.pos] = heartSet.monster;
    if (heartSet.subsets.length === 0) {
        stack.push(tmp.slice());
    } else {
        for (const subset of heartSet.subsets) {
            extractHeartSet(stack, tmp, subset);
        }
    }
    tmp[heartSet.pos] = null;
}

function searchHeartSet(target: Target): void {
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    let dp1: (State | null)[][] = new Array(SET_LEN);
    let dp2: (State | null)[][] = new Array(SET_LEN);
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, sets: [] };
    for (const monster of monsterList) {
        if (monster.target === null) {
            continue;
        }
        const cost = monster.cost - monster.hearts.find(h => h.rank === monster.target)!.maximumCost;
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
                } else if (state1.score === state2.score) {
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
                    } else if (score3 === state4.score) {
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
    let best: State | null = null;
    for (const line of dp1) {
        for (const state of line) {
            if (state === null) {
                continue;
            }
            if (best === null || state.score > best.score) {
                best = state;
            } else if (state.score === best.score) {
                best.sets = best.sets.concat(state.sets);
            }
        }
    }
    const result = document.getElementById("result")!;
    result.innerHTML = "";
    if (best === null || best.sets.length === 0) {
        result.textContent = "見つかりませんでした";
        return;
    }
    const heartSets: (Monster | null)[][] = [];
    const monsters: (Monster | null)[] = new Array(COUNT).fill(null);
    for (const heartSet of best.sets) {
        extractHeartSet(heartSets, monsters, heartSet);
    }
    const template = document.getElementById("result_item") as HTMLTemplateElement;
    const omitDuplicate: Map<string, boolean> = new Map();
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
            st.maximumCost += m.hearts.find(h => h.rank === m.target)!.maximumCost;
        }
        const key = JSON.stringify({ status: st, hearts: heartSet.map(h => h?.id ?? -1).sort() });
        if (omitDuplicate.has(key)) {
            continue;
        }
        omitDuplicate.set(key, true);
        const fragment = template.content.cloneNode(true) as DocumentFragment;
        const text = (cname: string, value: any): HTMLElement => {
            const e = fragment.querySelector(cname) as HTMLElement;
            e.textContent = `${value}`;
            return e;
        };
        text(".result-item-number",       `${omitDuplicate.size}`);
        text(".result-item-score",        `${st.score}`);
        text(".result-item-cost",         `${st.cost} / ${target.maximumCost} + ${st.maximumCost}`);
        text(".result-item-maximumhp",    `${st.maximumHP}`);
        text(".result-item-maximummp",    `${st.maximumMP}`);
        text(".result-item-power",        `${st.power}`);
        text(".result-item-defence",      `${st.defence}`);
        text(".result-item-attackmagic",  `${st.attackMagic}`);
        text(".result-item-recovermagic", `${st.recoverMagic}`);
        text(".result-item-speed",        `${st.speed}`);
        text(".result-item-deftness",     `${st.deftness}`);
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const m = heartSet[p];
            if (m === null) {
                continue;
            }
            const h = fragment.querySelector(`.result-item-heart${p+1}`)!;
            const info = SingleColorInfoMap.get(m.color)!;
            const colorSpan = h.appendChild(document.createElement("span"));
            colorSpan.classList.add(info.colorName);
            colorSpan.textContent = info.text;
            h.appendChild(document.createElement("span")).textContent = `${m.cost}`;
            h.appendChild(document.createElement("span")).textContent = m.name;
            h.appendChild(document.createElement("span")).textContent = Rank[m.target!];
            const hsc = h.appendChild(document.createElement("span"));
            hsc.classList.add("result-item-heart-score");
            hsc.textContent = `( スコア: ${target.scorer.calc(c, m)} )`;
            fragment.querySelector(`.result-item-effects${p+1}`)!
                .textContent = m.hearts.find(h => h.rank === m.target)!.effects;
        }
        result.appendChild(fragment);
    }
    result.insertBefore(document.createElement("div"), result.firstElementChild)
        .textContent = `件数: ${omitDuplicate.size}`;
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
    dialog.returnValue = "";
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
        (elements.namedItem("add_color") as RadioNodeList).value = `${Color[monster.color]}`;
    }
});

document.querySelector('#add_heart_dialog button[value="cancel"]')!
.addEventListener("click", () => {
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

document.getElementById("add_heart_dialog")!
.addEventListener("close", (event) => {
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "add") {
        return;
    }
    const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
    const rad = (name: string) => (elements.namedItem(name) as RadioNodeList).value;
    const str = (name: string) => (elements.namedItem(name) as HTMLInputElement).value;
    const noNaN = (v: number) => isNaN(v) ? 0 : v;
    const num = (name: string) => noNaN(parseInt(str(name)));
    const rank = Rank[rad("add_rank") as keyof typeof Rank];
    const monster: Monster = {
        id: 0,
        name: str("add_monster_name"),
        color: Color[rad("add_color") as keyof typeof Color],
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
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

document.getElementById("load_file")!
.addEventListener("click", () => {
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    (dialog.querySelector("form") as HTMLFormElement).reset();
    dialog.returnValue = "";
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
    const e = document.getElementById("expression") as HTMLInputElement;
    const ge = document.getElementById("goal_expression") as HTMLInputElement;
    const f = () => {
        e.required = ge.checked;
    };
    const goals = document.querySelectorAll('#search_heart_dialog input[name="goal"]');
    for (const goal of goals) {
        goal.addEventListener("change", f);
    }
})();

document.querySelector('#search_heart_dialog button[value="cancel"]')!
.addEventListener("click", () => {
    const dialog = document.getElementById("search_heart_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

document.getElementById("search_heart_dialog")!
.addEventListener("close", () => {
    const dialog = document.getElementById("search_heart_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "start") {
        return;
    }
    const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
    try {
        const target = parseTarget(elements);
        const num = calcNumOfBestHeartSet(target);
        if (num > 100) {
            dialogAlert(`該当する件数が多すぎる ${num}`);
            return;
        }
        searchHeartSet(target);
    } catch (err) {
        dialogAlert(err);
        console.log(err);
    }
});

document.getElementById("search_heart")!
.addEventListener("click", () => {
    const dialog = document.getElementById("search_heart_dialog") as HTMLDialogElement;
    dialog.showModal();
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
