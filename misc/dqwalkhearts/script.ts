//
// DQ-Walk Hearts
//
// author: Leonardone @ NEETSDKASU
//

// TypeScriptのバージョン3.8.3が古いせい（？）か、Array.prototype.atの存在を知らないらしくエラーになる・・・？
interface Array<T> {
    at(index: number): T | undefined;
}

const DEVELOP = false;

const DEBUG: boolean = DEVELOP || new URLSearchParams(window.location.search).has("DEBUG");

if (DEBUG) {
    console.log("DEBUG MODE");
}

let EXPOSE_MODE = false;

const LOCAL_STORAGE_PATH = "dqwalkhearts";
const STORAGE_KEY_MONSTER_LIST = LOCAL_STORAGE_PATH;
const STORAGE_KEY_EXPR_RECORD = LOCAL_STORAGE_PATH + ".expr_rec";
const STORAGE_KEY_ADOPT_HEARTSET = LOCAL_STORAGE_PATH + ".adopt_heartset";
const STORAGE_KEY_HEARTSET_SEARCH = LOCAL_STORAGE_PATH + ".heartset_search";
const STORAGE_KEY_REALLYNEEDED_FORM = LOCAL_STORAGE_PATH + ".reallyneeded_form";

function dialogAlert(msg: string): void {
    if (DEBUG) {
        console.log(`dialogAlert: ${msg}`);
    }
    document.getElementById("alert_message")!.textContent = msg;
    const dialog = document.getElementById("alert_dialog")! as HTMLDialogElement;
    dialog.showModal();
}

interface Task<T> {
    interval: number;
    proc: () => (T | null);
    close: ((res: T | null) => void) | null;
}

function dialogWait<T>(task: Task<T>, msg?: string): void {
    if (DEBUG) {
        console.log(`dialogWait: ${msg}`);
    }
    document.getElementById("wait_message")!.textContent = msg ?? "しばらくお待ちください";
    const dialog = document.getElementById("wait_dialog")! as HTMLDialogElement;
    let handle = 0;
    dialog.onclose = () => {
        clearTimeout(handle);
        if (dialog.returnValue === "cancel") {
            if (task.close !== null) {
                task.close(null); // TODO ここのエラーを捕捉しないとヤバいすね･･･
            }
        }
        dialog.onclose = () => {};
    };
    const proc = () => {
        try {
            const res = task.proc();
            if (res === null) {
                handle = setTimeout(proc, task.interval);
            } else {
                if (task.close != null) {
                    task.close(res); // TODO ここのエラーを捕捉しないとヤバいすね･･･
                }
                dialog.returnValue = "";
                dialog.onclose = () => {};
                dialog.close();
            }
        } catch (ex) {
            clearTimeout(handle);
            console.log(ex);
            if (task.close !== null) {
                task.close(null); // TODO ここのエラーを捕捉しないとヤバいすね･･･
            }
            dialog.returnValue = "cancel";
            dialog.onclose = () => {};
            dialog.close();
            dialogAlert(`エラー: タスクを中止しました ( ${ex} )`);
        }
    };
    handle = setTimeout(proc, 1);
    dialog.returnValue = "";
    dialog.showModal();
}

function permutation(size: number): number[][] {
    let limit = 10 ** size;
    let flag = 0;
    for (let i = 0; i < size; i++) {
        flag |= 1 << i;
    }
    const res: number[][] = [];
    const item: number[] = new Array(size).fill(0);
    for (let x = 0; x < limit; x++) {
        let f = 0;
        let tmp = x;
        for (let i = 0; i < size; i++) {
            const m = tmp % 10;
            item[i] = m;
            f |= 1 << m;
            tmp = Math.floor(tmp / 10);
        }
        if (f === flag) {
            res.push(item.slice());
        }
    }
    return res;
}

function popCount(value: number): number {
    value = (value & 0x55555555) + ((value >>> 1) & 0x55555555);
    value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
    value = (value & 0x0F0F0F0F) + ((value >>> 4) & 0x0F0F0F0F);
    value = (value & 0x00FF00FF) + ((value >>> 8) & 0x00FF00FF);
    return (value & 0x0000FFFF) + ((value >>> 16) & 0x0000FFFF);
}

function shuffle<T>(arr: Array<T>): void {
    for (let i = arr.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[k];
        arr[k] = tmp;
    }
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

// 配列に昇順で新しいアイテムを挿入する
// 挿入箇所は線形探索で求める
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

interface MergeListTask<T> {
    doesMerge: (itemOfBaseList: T, itemOfAdditionalList: T) => boolean;
    merge: (itemOfBaseList: T, itemOfAdditionalList: T) => T;
}

// リストのマージ（頭悪い実装）
function mergeList<T>(baseList: T[], additionalList: T[], task: MergeListTask<T>): T[] {
    let tmpList: T[] = baseList.slice();
    let append: T[] = [];
    for (const item1 of additionalList) {
        let ok = false;
        for (let i = 0; i < tmpList.length; i++) {
            const item0 = tmpList[i];
            if (task.doesMerge(item0, item1)) {
                tmpList[i] = task.merge(item0, item1);
                ok = true;
                break;
            }
        }
        if (!ok) {
            append.push(item1);
        }
    }
    return tmpList.concat(append);
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
    dexterity: number;
}

interface Monster {
    id: number;
    name: string;
    splusName: string | null;
    curColor: Color;
    curCost: number; // 現在のtargetもしくは最後に選択されていたtargetのこころコスト
    hearts: Heart[];
    target: Rank | null;
    withSplus: boolean;
    defaultTarget: Rank | null;
    defaultWithSplus: boolean;
}

interface Heart extends Status {
    rank: Rank;
    color: Color;
    cost: number;
    maximumCost: number;
    effects: string;
}

interface Job {
    id: number;
    name: string;
    powerUp: number;
    colors: Color[];
}

const JobPreset: Job[] = [
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
        colors: [Color.Yellow|Color.Red, Color.Rainbow, Color.Red, Color.Red] },
    { id: 202, name: "賢者", powerUp: 1.2,
        colors: [Color.Green|Color.Purple, Color.Rainbow, Color.Green|Color.Purple, Color.Green|Color.Purple] },
    { id: 203, name: "レンジャー", powerUp: 1.2,
        colors: [Color.Red|Color.Blue, Color.Rainbow, Color.Blue, Color.Blue] },
    { id: 204, name: "魔法戦士", powerUp: 1.2,
        colors: [Color.Yellow|Color.Purple, Color.Rainbow, Color.Yellow|Color.Purple, Color.Yellow|Color.Purple] },
    { id: 205, name: "パラディン", powerUp: 1.2,
        colors: [Color.Yellow|Color.Green, Color.Rainbow, Color.Yellow, Color.Yellow] },
    { id: 206, name: "スーパースター", powerUp: 1.2,
        colors: [Color.Blue|Color.Green, Color.Rainbow, Color.Blue, Color.Green] },
    { id: 207, name: "海賊", powerUp: 1.2,
        colors: [Color.Yellow|Color.Blue, Color.Rainbow, Color.Yellow, Color.Blue] },
    { id: 208, name: "まものマスター", powerUp: 1.2,
        colors: [Color.Rainbow, Color.Rainbow, Color.Blue|Color.Purple, Color.Blue|Color.Purple] },
    { id: 301, name: "ゴッドハンド", powerUp: 1.3,
        colors: [Color.Yellow|Color.Red, Color.Rainbow, Color.Red, Color.Yellow] },
    { id: 302, name: "大魔道士", powerUp: 1.3,
        colors: [Color.Yellow|Color.Purple, Color.Rainbow, Color.Yellow|Color.Purple, Color.Purple] },
    { id: 303, name: "大神官", powerUp: 1.3,
        colors: [Color.Blue|Color.Green, Color.Rainbow, Color.Blue|Color.Green, Color.Green] },
    { id: 304, name: "ニンジャ", powerUp: 1.3,
        colors: [Color.Blue|Color.Yellow, Color.Rainbow, Color.Blue|Color.Yellow, Color.Blue] },
    { id: 305, name: "魔剣士", powerUp: 1.3,
        colors: [Color.Red|Color.Purple, Color.Rainbow, Color.Red|Color.Purple, Color.Red|Color.Purple] },
    { id: 306, name: "守護天使", powerUp: 1.3,
        colors: [Color.Yellow|Color.Green, Color.Rainbow, Color.Yellow|Color.Blue, Color.Yellow] }
];

interface JobMaximumCostItem {
    level: number;
    maximumCost: number;
}

interface JobMaximumCost {
    id: number;
    maximumCostList: JobMaximumCostItem[];
}

const JobPresetMaximumCost: JobMaximumCost[] = [
    { id: 100, maximumCostList: [
            { level: 55, maximumCost: 231 },
            { level: 54, maximumCost: 231 },
            { level: 53, maximumCost: 231 },
            { level: 52, maximumCost: 231 },
            { level: 51, maximumCost: 231 },
            { level: 50, maximumCost: 231 },
            { level: 49, maximumCost: 226 },
            { level: 48, maximumCost: 221 },
            { level: 47, maximumCost: 216 },
            { level: 46, maximumCost: 211 },
            { level: 45, maximumCost: 205 },
            { level: 44, maximumCost: 200 },
            { level: 43, maximumCost: 195 },
            { level: 42, maximumCost: 190 },
            { level: 41, maximumCost: 185 },
            { level: 40, maximumCost: 180 },
            { level: 39, maximumCost: 175 },
            { level: 38, maximumCost: 170 },
            { level: 37, maximumCost: 165 },
            { level: 36, maximumCost: 160 },
            { level: 35, maximumCost: 155 },
            { level: 34, maximumCost: 150 },
            { level: 33, maximumCost: 145 },
            { level: 32, maximumCost: 140 },
            { level: 31, maximumCost: 136 },
            { level: 30, maximumCost: 131 },
            { level: 29, maximumCost: 126 },
            { level: 28, maximumCost: 121 },
            { level: 27, maximumCost: 117 },
            { level: 26, maximumCost: 112 },
            { level: 25, maximumCost: 107 },
            { level: 24, maximumCost: 103 },
            { level: 23, maximumCost: 98 },
            { level: 22, maximumCost: 93 },
            { level: 21, maximumCost: 89 },
            { level: 20, maximumCost: 84 }
        ]
    },
    { id: 200, maximumCostList: [
            { level: 68, maximumCost: 374 },
            { level: 67, maximumCost: 368 },
            { level: 66, maximumCost: 364 },
            { level: 65, maximumCost: 358 },
            { level: 64, maximumCost: 354 },
            { level: 63, maximumCost: 348 },
            { level: 62, maximumCost: 344 },
            { level: 61, maximumCost: 338 },
            { level: 60, maximumCost: 334 },
            { level: 59, maximumCost: 328 },
            { level: 58, maximumCost: 324 },
            { level: 57, maximumCost: 318 },
            { level: 56, maximumCost: 314 },
            { level: 55, maximumCost: 308 },
            { level: 54, maximumCost: 304 },
            { level: 53, maximumCost: 296 },
            { level: 52, maximumCost: 292 },
            { level: 51, maximumCost: 284 },
            { level: 50, maximumCost: 280 },
            { level: 49, maximumCost: 275 },
            { level: 48, maximumCost: 269 },
            { level: 47, maximumCost: 264 },
            { level: 46, maximumCost: 259 },
            { level: 45, maximumCost: 253 },
            { level: 44, maximumCost: 248 },
            { level: 43, maximumCost: 243 },
            { level: 42, maximumCost: 238 },
            { level: 41, maximumCost: 232 },
            { level: 40, maximumCost: 227 },
            { level: 39, maximumCost: 222 },
            { level: 38, maximumCost: 216 },
            { level: 37, maximumCost: 211 },
            { level: 36, maximumCost: 206 },
            { level: 35, maximumCost: 200 },
            { level: 34, maximumCost: 195 },
            { level: 33, maximumCost: 190 },
            { level: 32, maximumCost: 184 },
            { level: 31, maximumCost: 179 },
            { level: 30, maximumCost: 174 },
            { level: 29, maximumCost: 169 },
            { level: 28, maximumCost: 163 },
            { level: 27, maximumCost: 158 },
            { level: 26, maximumCost: 153 },
            { level: 25, maximumCost: 147 },
            { level: 24, maximumCost: 141 },
            { level: 23, maximumCost: 137 },
            { level: 22, maximumCost: 131 },
            { level: 21, maximumCost: 126 },
            { level: 20, maximumCost: 121 }
        ]
    },
    { id: 300, maximumCostList: [
            { level: 7, maximumCost: 292 },
            { level: 6, maximumCost: 284 },
            { level: 5, maximumCost: 280 },
            { level: 4, maximumCost: 275 },
            { level: 3, maximumCost: 269 },
            { level: 2, maximumCost: 264 },
            { level: 1, maximumCost: 259 }
        ]
    }
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

const RainbowColorInfo: SingleColorInfo = {
    color: Color.Rainbow,
    text: "虹(？)",
    colorName: "rainbow",
};

let monsterMap: Map<string, Monster> = new Map();
let monsterList: Monster[] = [];
let monsterNameList: string[] = [];

let NO_STORAGE: boolean = false; // trueならストレージ無効、falseならストレージ有効

const IDENT: number = Date.now();

if (DEBUG) {
    console.log(`IDENT: ${IDENT}`);
}

enum Trigger {
    UpdateStatus,
    ChooseRank,
}

interface Data {
    ident: number;
    trigger: Trigger;
    monsterList: Monster[];
}

// こころリストをブラウザのストレージに保存
function saveMonsterList(trigger: Trigger): void {
    if (DEBUG) {
        console.log(`call saveMonsterList(${Trigger[trigger]})`);
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save to storage");
        }
        return;
    }
    try {
        const data: Data = {
            ident: IDENT,
            trigger: trigger,
            monsterList: monsterList
        };
        const json = JSON.stringify(data);
        window.localStorage.setItem(STORAGE_KEY_MONSTER_LIST, json);
        if (DEBUG) {
            console.log("saved to storage");
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

// こころリストをブラウザのストレージから読み込む
function loadMonsterList(): void {
    if (DEBUG) {
        console.log("call loadMonsterList");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.localStorage.getItem(STORAGE_KEY_MONSTER_LIST);
        if (json !== null) {
            const data: unknown = JSON.parse(json);
            if (isData(data)) {
                addAllMonsterList(data.monsterList);
                if (DEBUG) {
                    console.log("load from storage (Data)");
                }
            } else if (isMonsterList(data)) {
                addAllMonsterList(data);
                if (DEBUG) {
                    console.log("load from storage (Monster[])");
                }
            }
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

// 別のタブやウインドウでlocalStorageに変更があった場合に呼び出される
//
// TODO ストレージ変化検出、問題点あるかも。別タブで複数回の異なる操作(更新とランク変更)が同時にあると正しく検出できないかも
//   例えば　『別タブ切り替え　⇒　ランク変更 ⇒　こころ追加・編集　⇒　ランク変更　⇒　元のタブを開く』
//   の一連の操作で元タブに戻った時に最後のランク変更の通知のみ来るのであれば、芳しくないかも・・・？
//
// TODO こころリストのマージ、名前の競合による意図せぬデータの上書きがありうる・・・？
//    開いてるタブそれぞれで同じ名前の異なるデータを追加（あるいは、こころの名前変更）などで
//    データマージが失敗するかも
//
window.addEventListener("storage", e => {
    if (DEBUG) {
        console.log("updated storage");
    }
    if (e instanceof StorageEvent) {
        if (DEBUG) {
            console.log(`storage key: ${e.key}`);
        }
        if (e.key !== STORAGE_KEY_MONSTER_LIST) {
            console.log(`not dqwalkhearts monster list data ( key: ${e.key} )`);
            return;
        }
        if (e.newValue === null) {
            console.log("delete value");
            return;
        }
        const data = JSON.parse(e.newValue);
        let tempList: Monster[] = [];
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
                // 他タブでのランクの変更は無視する
                if (DEBUG) {
                    console.log("trigger is ChooseRank");
                }
                return;
            }
            tempList = data.monsterList;
        } else if (isMonsterList(data)) {
            if (DEBUG) {
                console.log("update by old script");
            }
            tempList = data;
        }
        for (const m of tempList) {
            if (monsterMap.has(m.name)) {
                const orig = monsterMap.get(m.name)!;
                m.target = orig.target;
            }
        }
        const updated = addAllMonsterList(tempList);
        updateChangedRankCount();
        if (DEBUG) {
            if (updated) {
                console.log("update monsterList");
            } else {
                console.log("no update monsterList");
            }
        }
    }
});

// Dataインターフェースかを判定する
function isData(anyobj: Data | unknown): anyobj is Data {
    if (typeof anyobj !== "object" || anyobj === null) {
        return false;
    }
    const obj: {[key: string]: any} = anyobj;
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

interface ExprRecord {
    name: string;
    expr: string;
}

interface ExprRecordList {
    category: string;
    list: ExprRecord[];
}

function isValidExprRecordListData(data: ExprRecordList[] | unknown): data is ExprRecordList[] {
    try {
        if (!Array.isArray(data)) {
            console.log("ExprRecordList[]じゃないJSONファイル");
            console.log(data);
            return false;
        }
        const list1 = data as unknown[];
        for (const item1 of list1) {
            if (typeof item1 !== "object" || item1 === null) {
                console.log("object型じゃない");
                console.log(item1);
                return false;
            }
            const obj1: {[key: string]: any} = item1; // ここキャストできる理由わからない
            if (!(("category" in obj1) && (typeof obj1["category"] === "string"))) {
                console.log("string型のcategoryプロパティがない");
                console.log(obj1);
                return false;
            }
            if (!(("list" in obj1) && (Array.isArray(obj1["list"])))) {
                console.log("Array型のlistプロパティがない");
                console.log(item1);
                return false;
            }
            const list2 = obj1["list"] as unknown[];
            for (const item2 of list2) {
                if (typeof item2 !== "object" || item2 === null) {
                    console.log("object型じゃない");
                    console.log(item2);
                    return false;
                }
                const obj2: {[key: string]: any} = item2; // ここキャストできる理由わからない
                if (!(("name" in obj2) && (typeof obj2["name"] === "string"))) {
                    console.log("string型のnameプロパティがない");
                    console.log(obj2);
                    return false;
                }
                if (!(("expr" in obj2) && (typeof obj2["expr"] === "string"))) {
                    console.log("string型のexprプロパティがない");
                    console.log(obj2);
                    return false;
                }
            }
        }
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}

let exprRecordLists: ExprRecordList[] = [];

// 登録済みの式をセーブする
function saveExprRecord(): void {
    if (DEBUG) {
        console.log("call saveExprRecord");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    try {
        const data = exprRecordLists;
        const json = JSON.stringify(data);
        window.localStorage.setItem(STORAGE_KEY_EXPR_RECORD, json);
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

// 登録済みの式をロードする
function loadExprRecord(): void {
    if (DEBUG) {
        console.log("call loadExprRecord");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.localStorage.getItem(STORAGE_KEY_EXPR_RECORD);
        if (json !== null) {
            const data: ExprRecordList[] = JSON.parse(json);
            // isValidExprRecordListData(data) でチェックしたほうがいいかどうかは分からない(データが壊れる可能性あるか知らん)
            exprRecordLists = data;
            updateExprRecordCategoryList();
            const category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
            updateSelectExprRecordExprNameList(category);
            const exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
            (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

function getRecoredExpr(category: string, exprName: string): string {
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        return "";
    }
    const li = exprRecordLists[ci].list.findIndex(e => e.name === exprName);
    if (li < 0) {
        return "";
    }
    return exprRecordLists[ci].list[li].expr;
}

// 登録済み式のカテゴリリストの更新
function updateExprRecordCategoryList(): void {
    const sel = document.getElementById("expr_rec_category") as HTMLSelectElement;
    const dlist = document.getElementById("expr_rec_category_list")!;
    sel.innerHTML = "";
    dlist.innerHTML = "";
    for (const erl of exprRecordLists) {
        const sopt = sel.appendChild(document.createElement("option"));
        sopt.value = erl.category;
        sopt.textContent = erl.category;
        const dopt = dlist.appendChild(document.createElement("option"));
        dopt.value = erl.category;
    }
}

function updateSelectExprRecordExprNameList(category: string): void {
    const sel = document.getElementById("expr_rec_expr_name") as HTMLSelectElement;
    sel.innerHTML = "";
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        console.log(`not found category: ${category}`);
        return;
    }
    for (const er of exprRecordLists[ci].list) {
        const opt = sel.appendChild(document.createElement("option"));
        opt.value = er.name;
        opt.textContent = er.name;
    }
}

function updateDataListExprRecordExprNameList(category: string): void {
    const dlist = document.getElementById("expr_rec_expr_name_list")!;
    dlist.innerHTML = "";
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        console.log(`not found category: ${category}`);
        return;
    }
    for (const er of exprRecordLists[ci].list) {
        const opt = dlist.appendChild(document.createElement("option"));
        opt.value = er.name;
    }
}

// 式を削除する
function deleteExprRecord(category: string, exprName: string): boolean {
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        return false;
    }
    const li = exprRecordLists[ci].list.findIndex(e => e.name === exprName);
    if (li < 0) {
        return false;
    }
    const list1 = exprRecordLists[ci].list.slice(0, li);
    const list2 = exprRecordLists[ci].list.slice(li + 1);
    const newList = list1.concat(list2);
    if (newList.length === 0) {
        const erList1 = exprRecordLists.slice(0, ci);
        const erList2 = exprRecordLists.slice(ci + 1);
        exprRecordLists = erList1.concat(erList2);
        updateExprRecordCategoryList();
        category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
    } else {
        exprRecordLists[ci].list = newList;
    }
    updateSelectExprRecordExprNameList(category);
    exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
    (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
    saveExprRecord();
    return true;
}

// 式を登録する
function addExprRecord(category: string, exprName: string, expr: string): void {
    if (DEBUG) {
        console.log("call addExprRecord");
    }
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        const newList: ExprRecordList = {
            category: category,
            list: [{name: exprName, expr: expr}]
        };
        exprRecordLists.push(newList);
        exprRecordLists.sort((a, b) => a.category.localeCompare(b.category));
        updateExprRecordCategoryList();
    } else {
        const li = exprRecordLists[ci].list.findIndex(e => e.name === exprName);
        if (li < 0) {
            const er: ExprRecord = {name: exprName, expr: expr};
            exprRecordLists[ci].list.push(er);
            exprRecordLists[ci].list.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            exprRecordLists[ci].list[li].expr = expr;
        }
    }
    saveExprRecord();
    (document.getElementById("expr_rec_category") as HTMLSelectElement).value = category;
    updateSelectExprRecordExprNameList(category);
    (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value = exprName;
    updateDataListExprRecordExprNameList(category);
    (document.getElementById("expr_rec_expr") as HTMLInputElement).value = expr;
}

// ランクの変更箇所を数えて表示する
function updateChangedRankCount(): void {
    let defaultCount = 0;
    let count = 0;
    for (const monster of monsterList) {
        if (monster.target !== monster.defaultTarget || monster.withSplus !== monster.defaultWithSplus) {
            defaultCount++;
        }
        if (monster.target === null) {
            count++;
            continue;
        }
        if (!monster.withSplus) {
            count++;
            continue;
        }
        if (monster.hearts.length === 1) {
            continue;
        }
        if (!monster.hearts.every(h => h.rank >= monster.target!)) {
            count++;
        }
    }
    document.getElementById("changed_rank_count")!.textContent = `${count}`;
    document.getElementById("changed_default_count")!.textContent = `${defaultCount}`;
}

// こころの色に関する表示部分
function showHeartColor(elem: HTMLElement, color: Color): void {
    elem.innerHTML = "";
    elem.classList.remove("yellow", "purple", "green", "red", "blue", "rainbow");
    switch (color) {
    case Color.Yellow:
    case Color.Purple:
    case Color.Green:
    case Color.Red:
    case Color.Blue:
        const csi = SingleColorInfoMap.get(color)!;
        elem.textContent = csi.text;
        elem.classList.add(csi.colorName);
        break;
    case Color.Rainbow:
        elem.textContent = RainbowColorInfo.text;
        elem.classList.add(RainbowColorInfo.colorName);
        break;
    default:
        const yellow = elem.appendChild(document.createElement("span"));
        if ((Color.Yellow & color) === Color.Yellow) {
            yellow.classList.add("yellow");
            yellow.textContent = "Y";
        } else {
            yellow.textContent = "-";
        }
        const purple = elem.appendChild(document.createElement("span"));
        if ((Color.Purple & color) === Color.Purple) {
            purple.classList.add("purple");
            purple.textContent = "P";
        } else {
            purple.textContent = "-";
        }
        const green = elem.appendChild(document.createElement("span"));
        if ((Color.Green & color) === Color.Green) {
            green.classList.add("green");
            green.textContent = "G";
        } else {
            green.textContent = "-";
        }
        const red = elem.appendChild(document.createElement("span"));
        if ((Color.Red & color) === Color.Red) {
            red.classList.add("red");
            red.textContent = "R";
        } else {
            red.textContent = "-";
        }
        const blue = elem.appendChild(document.createElement("span"));
        if ((Color.Blue & color) === Color.Blue) {
            blue.classList.add("blue");
            blue.textContent = "B";
        } else {
            blue.textContent = "-";
        }
        elem.appendChild(document.createElement("span")).textContent = "-";
        break;
    }
}

interface AdoptionHeartSet {
    jobName: string;
    score: string;
    maximumCost: number;
    powerUp: number;
    colors: Color[];
    hearts: ({monster: Monster, heart: Heart} | null)[];
}

let adoptionHeartSetList: AdoptionHeartSet[] = [];

let currentAdoptionHeartSet: AdoptionHeartSet | null = null;

function saveAdoptionHeartSetList(): void {
    if (DEBUG) {
        console.log("call saveAdoptionHeartSetList");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    try {
        const data = adoptionHeartSetList;
        const json = JSON.stringify(data);
        window.localStorage.setItem(STORAGE_KEY_ADOPT_HEARTSET, json);
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

function loadAdoptionHeartSetList(): void {
    if (DEBUG) {
        console.log("call loadAdoptionHeartSetList");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.localStorage.getItem(STORAGE_KEY_ADOPT_HEARTSET);
        if (json !== null) {
            const data: AdoptionHeartSet[] = JSON.parse(json);
            for (const hs of data) {
                currentAdoptionHeartSet = hs;
                addToAdoptionHeartSetList();
            }
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

// 採用したこころセットをリストに追加して表示
function addToAdoptionHeartSetList(): boolean {
    if (currentAdoptionHeartSet === null) {
        throw "BUG (addToAdoptionHeartSetList)";
    }
    if (adoptionHeartSetList.some(hs => hs === currentAdoptionHeartSet)) {
        return false;
    }
    for (const hs of adoptionHeartSetList) {
        if (hs.jobName === currentAdoptionHeartSet.jobName
                && hs.score === currentAdoptionHeartSet.score // 整数なはず
                && hs.maximumCost === currentAdoptionHeartSet.maximumCost // 整数なはず
                && hs.colors.length === currentAdoptionHeartSet.colors.length
                && hs.hearts.length === currentAdoptionHeartSet.hearts.length
                && hs.colors.every((e, i) => e === currentAdoptionHeartSet!.colors[i])
                && hs.hearts.every((e, i) => e === currentAdoptionHeartSet!.hearts[i]
                    || (e !== null
                        && currentAdoptionHeartSet!.hearts[i] !== null
                        && e.monster.id === currentAdoptionHeartSet!.hearts[i]!.monster.id
                        && e.heart.rank === currentAdoptionHeartSet!.hearts[i]!.heart.rank))
                && `${hs.powerUp}` === `${currentAdoptionHeartSet.powerUp}`) {
            // ※雑な同一判定すぎるので、こころの並び順が違っても同一のステータスになるケースは、同一として判定されない
            return false;
        }
    }
    // 念のためコピーしとく
    const heartset: AdoptionHeartSet = {
        jobName: currentAdoptionHeartSet.jobName,
        score: currentAdoptionHeartSet.score,
        maximumCost: currentAdoptionHeartSet.maximumCost,
        powerUp: currentAdoptionHeartSet.powerUp,
        colors: currentAdoptionHeartSet.colors.slice(),
        hearts: currentAdoptionHeartSet.hearts.slice()
    };
    currentAdoptionHeartSet = null;
    adoptionHeartSetList.push(heartset);
    const list = document.getElementById("adoption_heartset_list")!;
    const template = document.getElementById("result_item") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    if (EXPOSE_MODE) {
        // 非公開機能を利用
        for (const sec of fragment.querySelectorAll(".secret")) {
            sec.classList.remove("secret");
        }
        fragment.querySelector(".result-item-adoption")!.addEventListener("click", () => adoptHeartSet(heartset));
    }
    const elem = (name: string) => fragment.querySelector(`.result-item-${name}`)!;
    const text = (name: string, value: any) => elem(name).textContent = `${value}`;
    text("number", heartset.jobName);
    text("score", heartset.score);
    const oldPowerUp = powerUp;
    powerUp = heartset.powerUp;
    const status: Status = {
        maximumHP: 0,
        maximumMP: 0,
        power: 0,
        defence: 0,
        attackMagic: 0,
        recoverMagic: 0,
        speed: 0,
        dexterity: 0
    };
    let cost = 0;
    let additionalMaximumCost = 0;
    for (let i = 0; i < heartset.colors.length; i++) {
        const cs = elem(`heart${i+1}`).parentElement!.firstElementChild!;
        cs.appendChild(document.createElement("span")).textContent = "[";
        showHeartColor(cs.appendChild(document.createElement("span")), heartset.colors[i]);
        cs.appendChild(document.createElement("span")).textContent = "]:";
        if (heartset.hearts.length <= i) {
            break;
        }
        const mh = heartset.hearts[i];
        if (mh === null) {
            text(`heart${i+1}`, "－");
            text(`effects${i+1}`, "");
            continue;
        }
        const he = elem(`heart${i+1}`);
        he.innerHTML = "";
        const oldTarget = mh.monster.target;
        const oldCurCost = mh.monster.curCost;
        const oldCurColor = mh.monster.curColor;
        mh.monster.target = mh.heart.rank;
        mh.monster.curCost = mh.heart.cost;
        mh.monster.curColor = mh.heart.color;
        cost += mh.heart.cost;
        additionalMaximumCost += mh.heart.maximumCost;
        const colorSpan = he.appendChild(document.createElement("span"));
        showHeartColor(colorSpan, mh.heart.color);
        he.appendChild(document.createElement("span")).textContent = `${mh.heart.cost}`;
        const monsterName = (mh.heart.rank === Rank.S_plus && mh.monster.splusName !== null)
                   ? mh.monster.splusName : mh.monster.name;
        he.appendChild(document.createElement("span")).textContent = monsterName;
        he.appendChild(document.createElement("span")).textContent = Rank[mh.heart.rank].replace("_plus", "+");
        text(`effects${i+1}`, mh.heart.effects);
        const c = heartset.colors[i];
        status.maximumHP    += MaximumHPScorer.calc(c, mh.monster);
        status.maximumMP    += MaximumMPScorer.calc(c, mh.monster);
        status.power        += PowerScorer.calc(c, mh.monster);
        status.defence      += DefenceScorer.calc(c, mh.monster);
        status.attackMagic  += AttackMagicScorer.calc(c, mh.monster);
        status.recoverMagic += RecoverMagicScorer.calc(c, mh.monster);
        status.speed        += SpeedScorer.calc(c, mh.monster);
        status.dexterity    += DexterityScorer.calc(c, mh.monster);
        mh.monster.target = oldTarget;
        mh.monster.curCost = oldCurCost;
        mh.monster.curColor = oldCurColor;
    }
    powerUp = oldPowerUp;
    if (heartset.maximumCost < 0) {
        text("cost", `${cost} / ??? + ${additionalMaximumCost}`);
    } else {
        text("cost", `${cost} / ${heartset.maximumCost} + ${additionalMaximumCost}`);
        if (cost > heartset.maximumCost + additionalMaximumCost) {
            elem("cost").classList.add("bold");
        }
    }
    text("maximumhp", `${status.maximumHP}`);
    text("maximummp", `${status.maximumMP}`);
    text("power", `${status.power}`);
    text("defence", `${status.defence}`);
    text("attackmagic", `${status.attackMagic}`);
    text("recovermagic", `${status.recoverMagic}`);
    text("speed", `${status.speed}`);
    text("dexterity", `${status.dexterity}`);
    list.appendChild(fragment);
    return true;
}

// こころセットの採用
function adoptHeartSet(adoptionHeartSet: AdoptionHeartSet): void {
    if (adoptionHeartSet.hearts.every(mah => mah === null)) {
        return;
    }
    currentAdoptionHeartSet = adoptionHeartSet;
    const dialog = document.getElementById("adoption_heartset_dialog") as HTMLDialogElement;
    const elems = dialog.querySelectorAll(".adoption-monster");
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const nameElem = elem.querySelector(".monster-name")!;
        const rankElems = elem.querySelectorAll(".monster-rank");
        const withSplusElem = elem.querySelector(".monster-with-s_plus") as HTMLInputElement;
        const mah = adoptionHeartSet.hearts.at(i) ?? null;
        if (mah === null) {
            nameElem.textContent = "－";
            for (const re of rankElems) {
                (re as HTMLInputElement).checked = false;
                (re as HTMLInputElement).disabled = true;
            }
            withSplusElem.checked = false;
            withSplusElem.disabled = true;
        } else {
            nameElem.textContent = mah.heart.rank === Rank.S_plus ? mah.monster.splusName : mah.monster.name;
            for (const re of rankElems) {
                const value = (re as HTMLInputElement).value ?? "omit";
                if (value === "omit") {
                    (re as HTMLInputElement).checked = mah.monster.target === null;
                    (re as HTMLInputElement).disabled = false;
                } else {
                    const rank = Rank[value as keyof typeof Rank];
                    (re as HTMLInputElement).checked = rank === mah.monster.target;
                    (re as HTMLInputElement).disabled = !mah.monster.hearts.some(h => h.rank === rank);
                }
            }
            withSplusElem.checked = mah.monster.withSplus;
            withSplusElem.disabled = !mah.monster.hearts.some(h => h.rank === Rank.S_plus);
        }
    }
    dialog.showModal();
}

// 新規のモンスター名になるこころを追加したときのこころ表示処理
function showNewHeart(monster: Monster): void {
    const template = document.getElementById("heart_list_item") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const text = (cname: string, value: any): HTMLElement => {
        const e = fragment.querySelector(cname) as HTMLElement;
        e.textContent = `${value}`;
        return e;
    };
    const name = (monster.target === Rank.S_plus && monster.splusName !== null)
               ? monster.splusName : monster.name;
    text(".monster-name", name);
    text(".monster-cost", monster.curCost);
    showHeartColor(fragment.querySelector(".monster-color") as HTMLElement, monster.curColor);
    const radios = fragment.querySelectorAll("input.monster-rank");
    const monsterRankRadioName = `monster_${monster.id}_rank`;
    for (const radio of radios) {
        const elm = radio as HTMLInputElement;
        elm.name = monsterRankRadioName;
        if (elm.value === "omit") {
            // こころのランク切り替え (不使用設定)
            elm.addEventListener("change", () => {
                // type="radio"はONに変更された場合だけchangeイベントが発行される
                monster.target = null;
                saveMonsterList(Trigger.ChooseRank);
                showUpdatedHeart(monster, false);
                updateChangedRankCount();
            });
        } else {
            const rank = Rank[elm.value as keyof typeof Rank];
            elm.disabled = !monster.hearts.some(h => h.rank === rank);
            // こころのランク切り替え (ランク設定)
            elm.addEventListener("change", () => {
                // type="radio"はONに変更された場合だけchangeイベントが発行される
                monster.target = rank;
                const newCurColor = monster.hearts.find(h => h.rank === rank)!.color;
                monster.curColor = newCurColor;
                let reorder = false;
                const newCurCost = monster.hearts.find(h => h.rank === rank)!.cost;
                if (monster.curCost !== newCurCost) {
                    if (DEBUG) {
                        console.log("reorder");
                    }
                    dialogAlert(`コストが ${monster.curCost} から ${newCurCost} に変わりリスト内での位置が変わります`);
                    monster.curCost = newCurCost
                    monsterList.sort((a, b) => b.curCost - a.curCost);
                    reorder = true;
                }
                saveMonsterList(Trigger.ChooseRank);
                showUpdatedHeart(monster, reorder);
                updateChangedRankCount();
            });
        }
    }
    const withSplusElem = fragment.querySelector(".monster-with-s_plus") as HTMLInputElement;
    withSplusElem.checked = monster.withSplus;
    withSplusElem.addEventListener("change", () => {
        // type="checkboxk"はON/OFFの切り替えでchangeイベントが発行される
        monster.withSplus = !monster.withSplus;
        saveMonsterList(Trigger.ChooseRank);
        showUpdatedHeart(monster, false);
        updateChangedRankCount();
    });
    // S+が登録済みの場合はwithSplusチェックボックスを有効化
    withSplusElem.disabled = !monster.hearts.some(h => h.rank === Rank.S_plus);
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
        text(".monster-dexterity", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
    } else {
        if (!monster.hearts.every(h => h.rank >= monster.target!)) {
            fragment.firstElementChild!.classList.add("not-best");
        }
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
        text(".monster-dexterity", heart.dexterity);
        text(".monster-maximumcost", heart.maximumCost);
        text(".monster-effects", heart.effects);
    }
    fragment.querySelector("button.monster-add-or-edit")!.addEventListener("click", () => {
        const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
        const form = dialog.querySelector("form") as HTMLFormElement;
        form.reset();
        (document.getElementById("add_monster_name") as HTMLInputElement).readOnly = true;
        const elements = form.elements;
        const cbox = (name: string, checked: boolean) => {
            (elements.namedItem(name) as HTMLInputElement).checked = checked;
        };
        const rad = (name: string, value: string) => {
            (elements.namedItem(name) as RadioNodeList).value = value;
        };
        const elem = (name: string, value: string) => {
            (elements.namedItem(name) as HTMLInputElement).value = value;
        };
        elem("add_monster_name", monster.name);
        elem("add_monster_splus_name", monster.splusName ?? "");
        elem("add_cost", `${monster.curCost}`);
        cbox("add_color_yellow", (monster.curColor & Color.Yellow) === Color.Yellow);
        cbox("add_color_purple", (monster.curColor & Color.Purple) === Color.Purple);
        cbox("add_color_green", (monster.curColor & Color.Green) === Color.Green);
        cbox("add_color_red", (monster.curColor & Color.Red) === Color.Red);
        cbox("add_color_blue", (monster.curColor & Color.Blue) === Color.Blue);
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
            elem("add_dexterity", `${h.dexterity}`);
            elem("add_maximumcost", `${h.maximumCost}`);
            elem("add_effects", `${h.effects}`);
        }
        dialog.showModal();
    });
    fragment.querySelector("button.monster-change-name")!.addEventListener("click", () => {
        const dialog = document.getElementById("change_monster_name_dialog") as HTMLDialogElement;
        const form = dialog.querySelector("form") as HTMLFormElement;
        form.reset();
        const elements = form.elements;
        const elem = (name: string, value: string) => {
            (elements.namedItem(name) as HTMLInputElement).value = value;
        };
        elem("old_monster_name", monster.name);
        elem("change_monster_name_monster_id", `${monster.id}`);
        dialog.showModal();
    });
    const withSplus = monster.withSplus
        && monster.hearts.some(h => h.rank === monster.target);
    if (withSplus) {
        fragment.querySelector("input.monster-rank + span")!.classList.add("monster-rank-with-s_plus");
    }
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

// 表示済みのモンスターのこころの情報を最新情報で表示しなおす
// reorder: こころリストの順番を修正したい場合はtrueにする
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
    const name = (monster.target === Rank.S_plus && monster.splusName !== null)
               ? monster.splusName : monster.name;
    text(".monster-name", name);
    text(".monster-cost", monster.curCost);
    showHeartColor(item.querySelector(".monster-color") as HTMLElement, monster.curColor);
    (item.querySelector(".monster-with-s_plus") as HTMLInputElement)
        .checked = monster.withSplus;
    const radios = item.querySelectorAll("input.monster-rank");
    if (monster.target === null) {
        item.classList.remove("not-best");
        item.classList.add("omit");
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value as keyof typeof Rank];
                elm.disabled = !monster.hearts.some(h => h.rank === rank);
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
        text(".monster-dexterity", "-");
        text(".monster-maximumcost", "-");
        text(".monster-effects", "-");
        (item.querySelector(".monster-with-s_plus") as HTMLInputElement)
            .disabled = true;
    } else {
        item.classList.remove("omit");
        if (monster.hearts.every(h => h.rank >= monster.target!)) {
            item.classList.remove("not-best");
        } else {
            item.classList.add("not-best");
        }
        const heart = monster.hearts.find(h => h.rank === monster.target)!;
        for (const radio of radios) {
            const elm = radio as HTMLInputElement;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value as keyof typeof Rank];
                elm.disabled = !monster.hearts.some(h => h.rank === rank);
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
        // S+が未登録の場合はwithSplusチェックボックスを無効化
        (item.querySelector(".monster-with-s_plus") as HTMLInputElement)
            .disabled = !monster.hearts.some(h => h.rank === Rank.S_plus);
    }
    const withSplus = monster.withSplus
        && monster.hearts.some(h => h.rank === monster.target);
    if (withSplus) {
        item.querySelector("input.monster-rank + span")!.classList.add("monster-rank-with-s_plus");
    } else {
        item.querySelector("input.monster-rank + span")!.classList.remove("monster-rank-with-s_plus");
    }
}

// モンスター名リストに新しいモンスター名を追加する
// ※モンスター名リストはこころ追加フォームのブラウザのサジェスト機能に利用される
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

// ２つのこころが等しいかどうか
function equalHearts(h1: Heart, h2: Heart): boolean {
    for (const param in h1) {
        if (h1[param as keyof Heart] !== h2[param as keyof Heart]) {
            return false;
        }
    }
    return true;
}

// 新しいこころを追加する (※データを上書きする)
function addHeart(newMonster: Monster): boolean {
    if (monsterMap.has(newMonster.name)) {
        const monster = monsterMap.get(newMonster.name)!;
        let updated = false;
        for (const heart of newMonster.hearts) {
            const index = monster.hearts.findIndex(h => h.rank === heart.rank);
            if (index < 0) {
                monster.hearts.push(heart);
                updated = true;
            } else if (!equalHearts(monster.hearts[index], heart)) {
                monster.hearts[index] = heart;
                updated = true;
            }
        }
        if (monster.target !== newMonster.target) {
            monster.target = newMonster.target;
            updated = true;
        }
        if (monster.splusName !== newMonster.splusName) {
            monster.splusName = newMonster.splusName;
            updated = true;
        }
        if (monster.curColor !== newMonster.curColor) {
            monster.curColor = newMonster.curColor;
            updated = true;
        }
        if (monster.withSplus !== newMonster.withSplus) {
            monster.withSplus = newMonster.withSplus;
            updated = true;
        }
        if (monster.defaultTarget !== newMonster.defaultTarget) {
            monster.defaultTarget = newMonster.defaultTarget;
            updated = true;
        }
        if (monster.defaultWithSplus !== newMonster.defaultWithSplus) {
            monster.defaultWithSplus = newMonster.defaultWithSplus;
            updated = true;
        }
        let newCurCost = newMonster.curCost;
        if (monster.target !== null) {
            newCurCost = monster.hearts.find(h => h.rank === monster.target!)!.cost;
        }
        if (monster.curCost === newCurCost) {
            if (!updated) {
                return false;
            }
            showUpdatedHeart(monster, false);
        } else {
            monster.curCost = newCurCost;
            monsterList.sort((a, b) => b.curCost - a.curCost);
            showUpdatedHeart(monster, true);
        }
    } else {
        addMonsterNameList(newMonster.name);
        newMonster.id = monsterList.length; // TODO こころの削除機能などを実装した場合にIDに衝突が起きうる
        monsterMap.set(newMonster.name, newMonster);
        insert(monsterList, newMonster, (n, e) => n.curCost > e.curCost);
        showNewHeart(newMonster);
    }
    return true;
}

let currentJobPresetMaximumCostId = 0;

// 職業ごとのこころ枠の組み合わせをフォームに設定する
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
    (document.getElementById("heart_power_up") as HTMLInputElement).value = `${job.powerUp}`;
    if (currentJobPresetMaximumCostId <= job.id && job.id < currentJobPresetMaximumCostId + 100) {
        return;
    }
    const maximumCostList = document.getElementById("job_preset_maximum_cost_list")!;
    maximumCostList.innerHTML = "";
    for (const x of JobPresetMaximumCost) {
        if (job.id < x.id || x.id + 100 <= job.id) {
            continue;
        }
        currentJobPresetMaximumCostId = x.id;
        for (const item of x.maximumCostList) {
            const op = maximumCostList.appendChild(document.createElement("option"));
            op.value = `${item.maximumCost}`;
            op.textContent = ` Lv ${item.level}`;
        }
        break;
    }
}

// 読み込んだjsonファイルがMonster[]かどうかを確認する
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

// オブジェクトがMonster型かどうかを確認する
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
        splusName: "splus",
        curColor: Color.Red,
        curCost: 1,
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
            color: Color.Red,
            cost: 1,
            maximumCost: 1,
            effects: "str",
        }],
        target: Rank.S_plus,
        withSplus: true,
        defaultTarget: Rank.S_plus,
        defaultWithSplus: true,
    };
    const monster2: Monster = {
        id: 0,
        name: "str",
        splusName: null,
        curColor: Color.Red,
        curCost: 1,
        hearts: [],
        target: null,
        withSplus: false,
        defaultTarget: null,
        defaultWithSplus: false,
    };
    let isOldFormatColor = false; // 色情報の保持方法が古いフォーマットか否か
    let isOldFormatCost = false; // コスト情報の保持方法が古いフォーマットか否か
    let nothingDefault = false; // デフォルト情報がない古いフォーマットか否か
    for (const param in monster1) {
        if (param in obj === false) {
            if (param === "defaultTarget") {
                nothingDefault = true;
                obj["defaultTarget"] = null;
            } else if (param === "defaultWithSplus") {
                nothingDefault = true;
                obj["defaultWithSplus"] = true;
            } else if (param === "splusName") {
                obj["splusName"] = null;
            } else if (param === "withSplus") {
                obj["withSplus"] = true;
            } else if (param === "curColor" && ("color" in obj)) {
                obj["curColor"] = obj["color"];
                delete obj["color"];
                isOldFormatColor = true
            } else if (param === "curCost" && ("cost" in obj)) {
                obj["curCost"] = obj["cost"];
                delete obj["cost"];
                isOldFormatCost = true;
            } else {
                console.log(`パラメータが無い ${param}`);
                console.log(obj);
                return false;
            }
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
    if ((m.curColor ^ (m.curColor & Color.Rainbow)) !== Color.Unset) {
        console.log("Colorに指定できない値が設定されている")
        console.log(obj);
        return false;
    }
    if (m.target !== null && m.target in Rank === false) {
        console.log("Rankに存在しない値が設定されている")
        console.log(obj);
        return false;
    }
    if (nothingDefault) {
        m.defaultTarget = m.target;
        m.defaultWithSplus = m.withSplus;
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
                if (param === "dexterity" && ("deftness" in h)) {
                    h["dexterity"] = h["deftness"];
                    delete h["deftness"];
                } else if (isOldFormatColor && param === "color") {
                    h["color"] = m.curColor;
                } else if (isOldFormatCost && param === "cost") {
                    h["cost"] = m.curCost;
                } else {
                    console.log(`パラメータが存在しない ${param}`);
                    console.log(h);
                    console.log(obj);
                    return false;
                }
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
        if (m.curColor === Color.Unset || m.curColor === Color.Omit) {
            console.log(`こころの色の指定として不正 ${Color[m.curColor]}`);
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

// 現在のこころリストを破棄して新しいこころリストに置き換える
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

// 現在のこころリストに別のこころリストで上書きする
// ※同一モンスターの情報があった場合に引数のこころリストのほうが優先される
function addAllMonsterList(list: Monster[]): boolean {
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
function mergeMonsterList(list: Monster[]): boolean {
    let updated = false;
    for (const monster of list) {
        if (monsterMap.has(monster.name)) {
            const orig = monsterMap.get(monster.name)!;
            monster.hearts = monster.hearts.filter(h => orig.hearts.findIndex(oh => oh.rank === h.rank) < 0);
            if (monster.hearts.length === 0) {
                continue;
            }
            monster.curColor = orig.curColor;
            monster.curCost = orig.curCost;
            monster.target = orig.target;
            monster.splusName = orig.splusName;
            monster.withSplus = orig.withSplus;
            monster.defaultTarget = orig.defaultTarget;
            monster.defaultWithSplus = orig.defaultWithSplus;
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
    powerUp = parseFloat((document.getElementById("heart_power_up") as HTMLInputElement).value);
}

// こころの基本のパラメータだけ見るシンプルなスコア計算オブジェクトを生成する
function makeSimpleScorer(param: keyof Status): Scorer {
    return {
        calc: (color: Color, monster: Monster) => {
            if (monster.target === null) {
                return 0;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target)!;
            if ((color & monster.curColor) !== 0) {
                return Math.ceil(powerUp * heart[param]);
            } else {
                return heart[param];
            }
        },
    };
}

// 計算結果の正負を逆にする
function toMinusScorer(sc: Scorer): Scorer {
    return {
        calc: (color: Color, monster: Monster) => {
            if (monster.target === null) {
                return 0;
            }
            return -sc.calc(color, monster);
        },
    };
}

// こころのスコアを計算するためのインターフェース
interface Scorer {
    calc: (color: Color, monster: Monster) => number;
}

interface Target {
    setname: string;
    colors: Color[];
    maximumCost: number;
    asLimitCost: boolean;
    scorer: Scorer;
    expr: string;
    reqSkillScorer: Scorer | null;
    reqSkillExpr: string;
    reqSkillCount: number;
    reqSkill2Scorer: Scorer | null;
    reqSkill2Expr: string;
    reqSkill3Scorer: Scorer | null;
    reqSkill3Expr: string;
    reqSkill4Scorer: Scorer | null;
    reqSkill4Expr: string;
    withSplus: boolean;
}

const MaximumHPScorer:    Scorer = makeSimpleScorer("maximumHP");
const MaximumMPScorer:    Scorer = makeSimpleScorer("maximumMP");
const PowerScorer:        Scorer = makeSimpleScorer("power");
const DefenceScorer:      Scorer = makeSimpleScorer("defence");
const AttackMagicScorer:  Scorer = makeSimpleScorer("attackMagic");
const RecoverMagicScorer: Scorer = makeSimpleScorer("recoverMagic");
const SpeedScorer:        Scorer = makeSimpleScorer("speed");
const DexterityScorer:     Scorer = makeSimpleScorer("dexterity");

class ExprSyntaxError {
    pos: number;
    strs: string[];
    detail: string | null;
    constructor(p: number, ss: string[], d: string | null) {
        this.pos = p;
        this.strs = ss;
        this.detail = d;
    }
    getMessage(): string {
        if (this.detail === null) {
            return `おそらく${this.pos}文字目付近に式の誤りがあります。 ${this.strs[0]} @@@ ${this.strs[1]} @@@ ${this.strs[2]}`;
        } else {
            return `おそらく${this.pos}文字目付近に式の誤りがあります(${this.detail})。 ${this.strs[0]} @@@ ${this.strs[1]} @@@ ${this.strs[2]}`;
        }
    }
}

class ExprParser {
    pos: number;
    chars: string[];
    worderr: number[] | null;
    errDetail: string | null;

    constructor(expr: string) {
        this.pos = 0;
        this.chars = [...expr];
        this.worderr = null;
        this.errDetail = null;
    }

    isEOF(): boolean {
        return this.pos >= this.chars.length;
    }

    // 空白文字をスキップ
    skipWhitespaces(): void {
        while (this.pos < this.chars.length) {
            if (this.chars[this.pos].match(/^\s+$/)) {
                this.pos++;
            } else {
                return;
            }
        }
    }

    // 現在位置の文字を取得し、かつ、現在位置を1文字分進める
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

    // 現在位置を1文字分戻る
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

    // MIN
    minScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "MINの開き括弧がない";
            return null;
        }
        const list: Scorer[] = [];
        for (;;) {
            const sc = this.parse();
            if (sc === null) {
                // parse失敗
                // エラーメッセージはparse内によって設定されている場合もある
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
                    calc: (c: Color, m: Monster) => {
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
            } else if (ch === ",") {
                continue;
            } else {
                this.errDetail = "MINの閉じ括弧がない";
                return null;
            }
        }
    }

    // MAX
    maxScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "MAXの開き括弧がない";
            return null;
        }
        const list: Scorer[] = [];
        for (;;) {
            const sc = this.parse();
            if (sc === null) {
                // parse失敗
                // エラーメッセージはparse内によって設定されている場合もある
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
                    calc: (c: Color, m: Monster) => {
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
            } else if (ch === ",") {
                continue;
            } else {
                this.errDetail = "MAXの閉じ括弧がない";
                return null;
            }
        }
    }

    // LESS
    lessScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "LESSの開き括弧がない";
            return null;
        }
        const list: Scorer[] = [];
        for (;;) {
            const sc = this.parse();
            if (sc === null) {
                // parse失敗
                // エラーメッセージはparse内によって設定されている場合もある
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
                    calc: (c: Color, m: Monster) => {
                        if (m.target === null) {
                            return 0;
                        }
                        let v = list[0].calc(c, m);
                        for (let i = 1; i < list.length; i++) {
                            const w = list[i].calc(c, m);
                            if (v < w) {
                                v = w;
                            } else {
                                return 0
                            }
                        }
                        return 1;
                    }
                };
            } else if (ch === ",") {
                continue;
            } else {
                this.errDetail = "LESSの閉じ括弧がない";
                return null;
            }
        }
    }

    // ABS
    absScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "ABSの開き括弧がない";
            return null;
        }
        const sc = this.parse();
        if (sc === null) {
            // parseに失敗
            // エラーメッセージはparse内によって設定されている場合もある
            return null;
        }
        const ch = this.next();
        if (ch === ")") {
            return {
                calc: (c: Color, m: Monster) => {
                    if (m.target === null) {
                        return 0;
                    }
                    return Math.abs(sc.calc(c, m));
                }
            };
        } else {
            this.errDetail = "ABSの閉じ括弧がない";
            return null;
        }
    }

    // NAME
    nameScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "NAMEの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "NAMEの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        if (monsterMap.has(wd)) {
            if (this.next() !== ")") {
                this.errDetail = "NAMEの閉じ括弧がない";
                return null;
            }
            return {
                calc: (c: Color, m: Monster) => {
                    if (m.target === null) {
                        return 0;
                    }
                    return m.name === wd ? 1 : 0;
                }
            };
        } else {
            this.worderr = [pos0, pos1];
            // 編集距離で近い名前でも出す？　『もしかして○○○？』
            // あぁ、無理か？全部の名前と編集距離を計算しなければならないか
            this.errDetail = "名前が正しくない";
            return null;
        }
    }

    // COLOR
    colorScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "COLORの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "COLORの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        let color: Color | null = null;
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
            this.errDetail = "COLORで指定できない色";
            return null;
        }
        if (this.next() !== ")") {
            this.errDetail = "COLORの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                const heart = m.hearts.find(h => h.rank === m.target)!;
                return (heart.color & color!) !== 0 ? 1 : 0;
            }
        };
    }

    // PLACE
    placeScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "PLACEの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "PLACEの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        let color: Color | null = null;
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
            this.errDetail = "PLACEで指定できない色";
            return null;
        }
        if (this.next() !== ")") {
            this.errDetail = "PLACEの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                return (c & color!) !== 0 ? 1 : 0;
            }
        };
    }

    // SKILL
    skillNameScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "SKILLの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "SKILLの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            this.errDetail = "SKILLの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)!
                    .effects
                    .split(/,|\s+/)
                    .includes(wd) ? 1 : 0;
            }
        };
    }

    // FIND
    partOfSkillNameScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "FINDの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "FINDの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            this.errDetail = "FINDの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)!
                    .effects
                    .includes(wd) ? 1 : 0;
            }
        };
    }

    // COUNT
    countOfPartOfSkillNameScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "COUNTの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "COUNTの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            this.errDetail = "COUNTの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                return m.hearts
                    .find(h => h.rank === m.target)!
                    .effects
                    .split(/,|\s+/)
                    .reduce((a, s) => a + (s.includes(wd) ? 1 : 0), 0)
            }
        };
    }

    // NUM
    pickNumberFromSkillScorer(): Scorer | null {
        if (this.next() !== "(") {
            this.errDetail = "NUMの開き括弧がない";
            return null;
        }
        const pos0 = this.pos;
        const ch = this.next();
        if (ch === null) {
            this.errDetail = "NUMの引数がない";
            return null;
        }
        const wd = this.parseName(ch);
        if (wd === null) {
            this.errDetail = "不正な文字";
            return null;
        }
        const pos1 = this.pos;
        if (this.next() !== ")") {
            this.errDetail = "NUMの閉じ括弧がない";
            return null;
        }
        const wds = wd.split("#");
        if (wds.length !== 2) {
            this.worderr = [pos0, pos1];
            this.errDetail = "文字 # が1個ではない";
            return null;
        }
        if (DEBUG) {
            console.log(`pick "${wds[0]}", "${wds[1]}"`);
        }
        return {
            calc: (c: Color, m: Monster) => {
                if (m.target === null) {
                    return 0;
                }
                const skill = m.hearts
                    .find(h => h.rank === m.target)!
                    .effects
                    .split(/,|\s+/)
                    .find(s => s.startsWith(wds[0]) && s.endsWith(wds[1]));
                if (skill) {
                    const e = skill.lastIndexOf(wds[1]);
                    const n = skill.slice(0, e).replace(wds[0], "");
                    // ReallyNeededでcalc内でデバッグ出力使うとコンソールに大量出力でメモリ爆発で死ぬ
                    // if (DEBUG) {
                    //    console.log(`pick "${skill}", "${e}", "${n}"`);
                    // }
                    if (n.match(/^\d+$/)) {
                        return parseInt(n);
                    }
                }
                return 0;
            }
        };
    }

    // スコア計算の種類を特定して返す
    getScorer(ch1: string): Scorer | null {
        const pos0 = this.pos-1;
        const sci = this.parseInteger(ch1);
        if (sci !== null) {
            return sci;
        }
        const name = this.parseWord(ch1);
        if (name === null) {
            if (DEBUG) {
                console.log(`unknown token ${ch1}`);
            }
            // TODO
            // エラー？: 不正な文字に遭遇
            // 呼び出し元がどう処理してるのか覚えてないため
            // エラーメッセージは保留
            // this.errDetail = "不正な文字";
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
                return { calc: (c: Color, m: Monster) => {
                    if (m.target === null) {
                        return 0;
                    }
                    const heart = m.hearts.find(h => h.rank === m.target)!;
                    return heart.cost;
                }};
            case "COLOR":
                return this.colorScorer();
            case "PLACE":
                return this.placeScorer();
            case "ABS":
                return this.absScorer();
            case "FIT":
                return { calc: (c: Color, m: Monster) => {
                    if (m.target === null) {
                        return 0;
                    }
                    const heart = m.hearts.find(h => h.rank === m.target)!;
                    return ((c & heart.color) !== 0) ? 1 : 0;
                }};
            default:
                if (DEBUG) {
                    console.log(`name ${name} is undefined`);
                }
                this.worderr = [pos0, this.pos];
                this.errDetail = "不明なキーワード";
                return null;
        }
    }

    // 数値リテラル
    parseInteger(ch1: string): Scorer | null {
        if (ch1.match(/^\D+$/)) {
            // エラーではない: 数値に使えない文字が検出されてる
            // 呼び出し元によっては許容されたりするかも
            // おそらく、キーワード(parseWord)と同時呼び出しで成功したものを採用とか
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
                return { calc: (c: Color, m: Monster) => {
                    return (m.target === null) ? 0 : v;
                }};
            }
            v = v * 10 + parseInt(ch);
        }
    }

    // 文字列のパース（引数の名前に使える文字）
    parseName(ch1: string): string | null {
        if (ch1.match(/^[\s\(\),]+$/)) {
            // エラー？: 名前に使えない文字が検出されてる
            // 呼び出し元によっては許容されたりするのか？覚えてない
            // 念のため、エラーメッセージは書かないでおく？
            // this.errDetail = "不正な文字";
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
    parseWord(ch1: string): string | null {
        if (ch1.match(/^[\d\s\(\)\+\-\*,]+$/)) {
            // エラーではない: 式に使えない文字が検出されてる
            // 呼び出し元によっては許容されたりするかも
            // おそらく、数値(parseInteger)と同時呼び出しで成功したものを採用とか
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
    parseValue(): Scorer | null {
        this.skipWhitespaces();
        const ch1 = this.next();
        if (ch1 === null) {
            // エラー？: 文字が無い
            // parseValuenの呼び出し側が値無しを許容するならエラーとは処理しないので
            // ここでエラーメッセージは出さないほうがいい？
            return null;
        }
        if (ch1 === "(") {
            const sc1 = this.parse();
            if (sc1 === null) {
                // parse失敗
                // エラーメッセージはparse内によって設定されている場合もある
                return null;
            }
            if (this.next() !== ")") {
                this.errDetail = "閉じ括弧が不足";
                return null;
            }
            return sc1;
        } else {
            return this.getScorer(ch1);
        }
    }

    // エラーの取得
    err(): ExprSyntaxError {
        let pos1: number;
        let pos2: number;
        if (this.worderr !== null) {
            pos1 = this.worderr[0];
            pos2 = this.worderr[1];
        } else {
            pos1 = Math.max(0, Math.min(this.pos-1, this.chars.length));
            pos2 = Math.max(0, Math.min(this.pos+1, this.chars.length));
        }
        const str1 = this.chars.slice(0, pos1).join("");
        const str2 = this.chars.slice(pos1, pos2).join("");
        const str3 = this.chars.slice(pos2).join("");
        return new ExprSyntaxError(this.pos, [str1, str2, str3], this.errDetail);
    }

    // 部分式をパースする(再帰的実行されるので結果的に式全体をパースすることになる)
    parse(): Scorer | null {
        const vStack: Scorer[] = [];
        const opStack: string[] = [];
        let minus = false;
        for (;;) {
            let sc1 = this.parseValue();
            if (sc1 === null) {
                // parseValue失敗
                // エラーメッセージはparseValue内によって設定されている場合もある
                return null;
            }
            if (minus) {
                sc1 = toMinusScorer(sc1);
                minus = false;
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
                    const op = opStack.pop()!;
                    if (DEBUG) {
                        console.log(`apply ${op}`);
                    }
                    const t2 = vStack.pop()!;
                    const t1 = vStack.pop()!;
                    if (op === "+") {
                        vStack.push({
                            calc: (c: Color, m: Monster) => {
                                if (m.target === null) {
                                    return 0;
                                }
                                const v1 = t1.calc(c, m);
                                const v2 = t2.calc(c, m);
                                return v1 + v2;
                            }
                        });
                    } else if (op === "*") {
                        vStack.push({
                            calc: (c: Color, m: Monster) => {
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
                return vStack.pop()!;
            } else if (ch2 === "+" || ch2 === "*") {
                if (DEBUG) {
                    console.log(`operator ${ch2}`);
                }
                opStack.push(ch2);
            } else if (ch2 === "-") {
                if (DEBUG) {
                    console.log(`operator ${ch2}`);
                }
                minus = true;
                opStack.push("+");
            } else {
                if (DEBUG) {
                    console.log(`unknown token ${ch2}`);
                }
                // this.errDetail = "不正な文字";
                return null;
            }
        }
    }
}

// 式をパースする
function parseExpression(expr: string): Scorer {
    const parser = new ExprParser(expr);
    const sc = parser.parse();
    if (sc === null) {
        throw parser.err();
    }
    parser.skipWhitespaces();
    if (parser.isEOF()) {
        return sc;
    } else {
        throw parser.err();
    }
}

// こころ枠の組み合わせから職業名を特定する
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
            if (`${job.powerUp}` === `${powerUp}`) {
                return job.name;
            }
        }
    }
    return "カスタム";
}

// フォーム情報を解析する
function parseTarget(elements: HTMLFormControlsCollection): Target {
    updatePowerUp();
    const elem = (name: string) => elements.namedItem(name) as (HTMLInputElement | null);
    const target: Target = {
        setname: "",
        colors: [],
        maximumCost: 0,
        asLimitCost: false,
        scorer: MaximumHPScorer,
        expr: "",
        reqSkillScorer: null,
        reqSkillExpr: "なし",
        reqSkillCount: 0,
        reqSkill2Scorer: null,
        reqSkill2Expr: "なし",
        reqSkill3Scorer: null,
        reqSkill3Expr: "なし",
        reqSkill4Scorer: null,
        reqSkill4Expr: "なし",
        withSplus: false,
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
    target.asLimitCost = elem("as_limit_heart_cost")!.checked;
    target.withSplus = elem("heart_with_s_plus")!.checked;
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
    case "dexterity":
        target.scorer = DexterityScorer;
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
    if (elem("heart_require_skill")!.checked) {
        const expr1 = elem("heart_require_skill_expression")!.value;
        target.reqSkillScorer = parseExpression(expr1);
        target.reqSkillExpr = expr1;
        target.reqSkillCount = parseInt(elem("heart_require_skill_expression_count")!.value);
        if (elem("heart_require_skill_2")!.checked) {
            const expr2 = elem("heart_require_skill_expression_2")!.value;
            target.reqSkill2Scorer = parseExpression(expr2);
            target.reqSkill2Expr = expr2;
            if (elem("heart_require_skill_3")!.checked) {
                const expr3 = elem("heart_require_skill_expression_3")!.value;
                target.reqSkill3Scorer = parseExpression(expr3);
                target.reqSkill3Expr = expr3;
                if (elem("heart_require_skill_4")!.checked) {
                    const expr4 = elem("heart_require_skill_expression_4")!.value;
                    target.reqSkill4Scorer = parseExpression(expr4);
                    target.reqSkill4Expr = expr4;
                }
            }
        }
    }
    document.getElementById("result_setname")!.textContent = target.setname;
    const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
    for (let i = 0; i < 4; i++) {
        const e = document.getElementById(`result_heart${i+1}`)!;
        e.innerHTML = "";
        let foundColor = false;
        if (i < target.colors.length) {
            const color = target.colors[i];
            for (const c of COLORS) {
                if ((c & color) === 0) {
                    continue;
                }
                foundColor = true;
                const info = SingleColorInfoMap.get(c)!;
                const span = e.appendChild(document.createElement("span"));
                span.classList.add(info.colorName);
                span.textContent = info.text;
            }
        }
        if (!foundColor) {
            e.textContent = "－";
        }
    }
    document.getElementById("result_power_up")!.textContent = `${powerUp}`;
    document.getElementById("result_maximumcost")!.textContent = `${target.maximumCost}`
        + (target.asLimitCost ? " (上限コスト)" : "");
    document.getElementById("result_goal")!.textContent = target.expr;
    document.getElementById("result_require_skill")!.textContent = target.reqSkillExpr
        + ((target.reqSkillCount > 0) ? ` [${target.reqSkillCount}個以上含める]` : "");
    document.getElementById("result_require_skill_2")!.textContent = target.reqSkill2Expr;
    document.getElementById("result_require_skill_3")!.textContent = target.reqSkill3Expr;
    document.getElementById("result_require_skill_4")!.textContent = target.reqSkill4Expr;
    return target;
}

interface HeartSetSearchForm {
    jobId: string;
    heart1Checks: number;
    heart2Checks: number;
    heart3Checks: number;
    heart4Checks: number;
    powerUp: string;
    maximumCost: string;
    asLimit: boolean;
    goal: string;
    expression: string;
    withSplus: boolean;
    reqSkill: boolean;
    reqSkillCount: string;
    reqSkillExpr: string;
    reqSkill2: boolean;
    reqSkill2Expr: string;
    reqSkill3: boolean;
    reqSkill3Expr: string;
    reqSkill4: boolean;
    reqSkill4Expr: string;
}

function saveHeartSetSearchForm(): void {
    if (DEBUG) {
        console.log("call saveHeartSetSearchForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    const elements = (document.querySelector("#search_heart_dialog form") as HTMLFormElement).elements;
    const elem = (name: string) => elements.namedItem(name) as HTMLInputElement;
    const checked = (name: string) => elem(name).checked;
    const check = (name: string, value: number) => checked(name) ? value : 0;
    const value = (name: string) => elem(name).value;
    const form: HeartSetSearchForm ={
        jobId: (elements.namedItem("preset_heartset") as HTMLSelectElement).value,
        heart1Checks: check("heart1_yellow", Color.Yellow) | check("heart1_purple", Color.Purple)
            | check("heart1_green", Color.Green) | check("heart1_red", Color.Red) | check("heart1_blue", Color.Blue),
        heart2Checks: check("heart2_yellow", Color.Yellow) | check("heart2_purple", Color.Purple)
            | check("heart2_green", Color.Green) | check("heart2_red", Color.Red) | check("heart2_blue", Color.Blue),
        heart3Checks: check("heart3_yellow", Color.Yellow) | check("heart3_purple", Color.Purple)
            | check("heart3_green", Color.Green) | check("heart3_red", Color.Red) | check("heart3_blue", Color.Blue),
        heart4Checks: check("heart4_yellow", Color.Yellow) | check("heart4_purple", Color.Purple)
            | check("heart4_green", Color.Green) | check("heart4_red", Color.Red) | check("heart4_blue", Color.Blue)
            | check("heart4_omit", Color.Omit),
        powerUp: value("heart_power_up"),
        maximumCost: value("heart_maximum_cost"),
        asLimit: checked("as_limit_heart_cost"),
        goal: value("goal"),
        expression: value("expression"),
        withSplus: checked("heart_with_s_plus"),
        reqSkill: checked("heart_require_skill"),
        reqSkillCount: value("heart_require_skill_expression_count"),
        reqSkillExpr: value("heart_require_skill_expression"),
        reqSkill2: checked("heart_require_skill_2"),
        reqSkill2Expr: value("heart_require_skill_expression_2"),
        reqSkill3: checked("heart_require_skill_3"),
        reqSkill3Expr: value("heart_require_skill_expression_3"),
        reqSkill4: checked("heart_require_skill_4"),
        reqSkill4Expr: value("heart_require_skill_expression_4")
    };
    if (DEBUG) {
        console.log(form);
    }
    try {
        const data = form;
        const json = JSON.stringify(data);
        window.sessionStorage.setItem(STORAGE_KEY_HEARTSET_SEARCH, json);
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

function loadHeartSetSearchForm(): void {
    if (DEBUG) {
        console.log("call loadHeartSetSearchForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.sessionStorage.getItem(STORAGE_KEY_HEARTSET_SEARCH);
        if (json !== null) {
            const data: HeartSetSearchForm = JSON.parse(json);
            // フォーマットの確認してないな…必要かどうかはわからんが

            if (DEBUG) {
                console.log(data)
            }

            const elements = (document.querySelector("#search_heart_dialog form") as HTMLFormElement).elements;
            const elem = (name: string) => elements.namedItem(name) as HTMLInputElement;
            const checked = (name: string, ch: boolean) => elem(name).checked = ch;
            const check = (name: string, test: number, v: number) => checked(name, (test & v) !== 0);
            const value = (name: string, v: string) => elem(name).value = v;

            (elements.namedItem("preset_heartset") as HTMLSelectElement).value = data.jobId;

            check("heart1_yellow", Color.Yellow, data.heart1Checks);
            check("heart1_purple", Color.Purple, data.heart1Checks);
            check("heart1_green",  Color.Green,  data.heart1Checks);
            check("heart1_red",    Color.Red,    data.heart1Checks);
            check("heart1_blue",   Color.Blue,   data.heart1Checks);

            check("heart2_yellow", Color.Yellow, data.heart2Checks);
            check("heart2_purple", Color.Purple, data.heart2Checks);
            check("heart2_green",  Color.Green,  data.heart2Checks);
            check("heart2_red",    Color.Red,    data.heart2Checks);
            check("heart2_blue",   Color.Blue,   data.heart2Checks);

            check("heart3_yellow", Color.Yellow, data.heart3Checks);
            check("heart3_purple", Color.Purple, data.heart3Checks);
            check("heart3_green",  Color.Green,  data.heart3Checks);
            check("heart3_red",    Color.Red,    data.heart3Checks);
            check("heart3_blue",   Color.Blue,   data.heart3Checks);

            check("heart4_yellow", Color.Yellow, data.heart4Checks);
            check("heart4_purple", Color.Purple, data.heart4Checks);
            check("heart4_green",  Color.Green,  data.heart4Checks);
            check("heart4_red",    Color.Red,    data.heart4Checks);
            check("heart4_blue",   Color.Blue,   data.heart4Checks);
            check("heart4_omit",   Color.Omit,   data.heart4Checks);

            value("heart_power_up", data.powerUp);
            value("heart_maximum_cost", data.maximumCost);
            checked("as_limit_heart_cost", data.asLimit);
            value("goal", data.goal);
            value("expression", data.expression);
            checked("heart_with_s_plus", data.withSplus);

            checked("heart_require_skill", data.reqSkill);
            value("heart_require_skill_expression_count", data.reqSkillCount);
            value("heart_require_skill_expression", data.reqSkillExpr);
            checked("heart_require_skill_2", data.reqSkill2);
            value("heart_require_skill_expression_2", data.reqSkill2Expr);
            checked("heart_require_skill_3", data.reqSkill3);
            value("heart_require_skill_expression_3", data.reqSkill3Expr);
            checked("heart_require_skill_4", data.reqSkill4);
            value("heart_require_skill_expression_4", data.reqSkill4Expr);

            // チェック項目による入力要素の有効/無効/必須の切り替え処理

            const heart4IsOmit = (data.heart4Checks & Color.Omit) !== 0;
            elem("heart4_yellow").disabled = heart4IsOmit;
            elem("heart4_purple").disabled = heart4IsOmit;
            elem("heart4_green").disabled = heart4IsOmit;
            elem("heart4_red").disabled = heart4IsOmit;
            elem("heart4_blue").disabled = heart4IsOmit;

            elem("expression").required = data.goal === "expression";

            elem("heart_with_s_plus").disabled = data.reqSkill;
            elem("heart_require_skill").disabled = data.withSplus;

            elem("heart_require_skill_expression").required = data.reqSkill;
            elem("heart_require_skill_expression_2").required = data.reqSkill && data.reqSkill2;
            elem("heart_require_skill_expression_3").required = data.reqSkill && data.reqSkill2 && data.reqSkill3;
            elem("heart_require_skill_expression_4").required = data.reqSkill && data.reqSkill2 && data.reqSkill3 && data.reqSkill4;
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

interface HeartSet {
    pos: number;
    monster: Monster;
    rank: Rank;
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

// 最大スコアのこころセットの組み合わせ数を求めるだけ
// 組み合わせ爆発回避用
// TODO 最終的なベストの組み合わせ数だけじゃなく、
//      途中段階で異常な組み合わせ数が出る可能性を考慮したほうがいい
//      メモリ不足回避のために
function calcNumOfBestHeartSet(target: Target): number {
    const HAS_REQSKILL = target.reqSkillScorer !== null;
    const HAS_REQSKILL_2 = target.reqSkill2Scorer !== null;
    const HAS_REQSKILL_3 = target.reqSkill3Scorer !== null;
    const HAS_REQSKILL_4 = target.reqSkill4Scorer !== null;
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost: (m: Monster) => number = target.asLimitCost
        ? (m => m.curCost)
        : (m => m.curCost - m.hearts.find(h => h.rank === m.target)!.maximumCost);
    let dp1: (NumState | null)[][] = new Array(SET_LEN);
    let dp2: (NumState | null)[][] = new Array(SET_LEN);
    let baseTable: (NumState | null)[][] = [];
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, count: 1 };
    function dpSubProc(useBaseTable: boolean, monster: Monster, cost: number, scores: number[]): void {
        for (let s = 0; s < SET_LEN; s++) {
            for (let c = 0; c < COST_LEN; c++) {
                if (useBaseTable) {
                    const stateBT1 = baseTable[s][c];
                    if (stateBT1 !== null) {
                        const cBT3 = c + cost;
                        if (cBT3 < COST_LEN) {
                            for (let p = 0; p < COUNT; p++) {
                                const sBT3 = s | (1 << p);
                                if (s === sBT3) {
                                    continue;
                                }
                                const scoreBT3 = stateBT1.score + scores[p];
                                const stateBT4 = dp2[sBT3][cBT3];
                                if (stateBT4 === null || scoreBT3 > stateBT4.score) {
                                    dp2[sBT3][cBT3] = {
                                        score: scoreBT3,
                                        count: stateBT1.count,
                                    };
                                } else if (scoreBT3 === stateBT4.score) {
                                    stateBT4.count += stateBT1.count;
                                }
                            }
                        }
                    }
                }
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
    }
    function dpProc(useBaseTable: boolean, skipFunc: (monster: Monster) => boolean): void {
        for (const monster of monsterList) {
            if (monster.target === null) {
                continue;
            }
            if (skipFunc(monster)) {
                continue;
            }
            let cost = getCost(monster);
            let scores = target.colors.map(c => target.scorer.calc(c, monster));
            dpSubProc(useBaseTable, monster, cost, scores);
            const withSplus = target.withSplus
                && monster.withSplus
                && monster.target !== Rank.S_plus
                && monster.hearts.some(h => h.rank === Rank.S_plus);
            if (withSplus) {
                const heart = monster.hearts.find(h => h.rank === Rank.S_plus)!;
                const tmpCurColor = monster.curColor;
                const tmpCurCost = monster.curCost;
                const tmpTarget = monster.target;
                monster.curColor = heart.color;
                monster.curCost = heart.cost;
                monster.target = Rank.S_plus;
                cost = getCost(monster);
                scores = target.colors.map(c => target.scorer.calc(c, monster));
                dpSubProc(false, monster, cost, scores);
                monster.curColor = tmpCurColor;
                monster.curCost = tmpCurCost;
                monster.target = tmpTarget;
            }
            const dp3 = dp1;
            dp1 = dp2;
            dp2 = dp3;
            dp2.forEach(a => a.fill(null));
        }
    }
    if (HAS_REQSKILL) {
        dpProc(false, monster => !(target.reqSkillScorer!.calc(Color.Unset, monster) > 0));
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) < target.reqSkillCount) {
                dp1[s].fill(null);
            }
        }
    }
    if (HAS_REQSKILL_2) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_3) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_4) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill4Scorer!.calc(Color.Unset, monster) > 0));
    }
    dpProc(false, monster => (HAS_REQSKILL && target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_2 && target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_3 && target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_4 && target.reqSkill4Scorer!.calc(Color.Unset, monster) > 0));
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

// ツリー上になってるこころセットの組み合わせを展開する
function extractHeartSet(stack: (HeartSet | null)[][], tmp: (HeartSet | null)[], heartSet: HeartSet): void {
    tmp[heartSet.pos] = heartSet;
    if (heartSet.subsets.length === 0) {
        stack.push(tmp.slice());
    } else {
        for (const subset of heartSet.subsets) {
            extractHeartSet(stack, tmp, subset);
        }
    }
    tmp[heartSet.pos] = null;
}

// ベストなこころ組み合わせを求めて表示する
function searchHeartSet(target: Target): void {
    const HAS_REQSKILL = target.reqSkillScorer !== null;
    const HAS_REQSKILL_2 = target.reqSkill2Scorer !== null;
    const HAS_REQSKILL_3 = target.reqSkill3Scorer !== null;
    const HAS_REQSKILL_4 = target.reqSkill4Scorer !== null;
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost: (m: Monster) => number = target.asLimitCost
        ? (m => m.curCost)
        : (m => m.curCost - m.hearts.find(h => h.rank === m.target)!.maximumCost);
    let dp1: (State | null)[][] = new Array(SET_LEN);
    let dp2: (State | null)[][] = new Array(SET_LEN);
    let baseTable: (State | null)[][] = [];
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, sets: [] };
    function dpSubProc(useBaseTable: boolean, monster: Monster, cost: number, scores: number[]) {
       for (let s = 0; s < SET_LEN; s++) {
            for (let c = 0; c < COST_LEN; c++) {
                if (useBaseTable) {
                    const stateBT1 = baseTable[s][c];
                    if (stateBT1 !== null) {
                        const cBT3 = c + cost;
                        if (cBT3 < COST_LEN) {
                            for (let p = 0; p < COUNT; p++) {
                                const sBT3 = s | (1 << p);
                                if (s === sBT3) {
                                    continue;
                                }
                                const scoreBT3 = stateBT1.score + scores[p];
                                const stateBT4 = dp2[sBT3][cBT3];
                                if (stateBT4 === null || scoreBT3 > stateBT4.score) {
                                    dp2[sBT3][cBT3] = {
                                        score: scoreBT3,
                                        sets: [{
                                            pos: p,
                                            monster: monster,
                                            rank: monster.target!,
                                            subsets: stateBT1.sets.slice(),
                                        }],
                                    };
                                } else if (scoreBT3 === stateBT4.score) {
                                    stateBT4.sets.push({
                                        pos: p,
                                        monster: monster,
                                        rank: monster.target!,
                                        subsets: stateBT1.sets.slice(),
                                    });
                                }
                            }
                        }
                    }
                }
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
                                rank: monster.target!,
                                subsets: state1.sets.slice(),
                            }],
                        };
                    } else if (score3 === state4.score) {
                        state4.sets.push({
                            pos: p,
                            monster: monster,
                            rank: monster.target!,
                            subsets: state1.sets.slice(),
                        });
                    }
                }
            }
        }
    }
    function dpProc(useBaseTable: boolean, skipFunc: (monster: Monster) => boolean) {
       for (const monster of monsterList) {
            if (monster.target === null) {
                continue;
            }
            if (skipFunc(monster)) {
                continue;
            }
            let cost = getCost(monster);
            let scores = target.colors.map(c => target.scorer.calc(c, monster));
            dpSubProc(useBaseTable, monster, cost, scores);
            const withSplus = target.withSplus
                && monster.withSplus
                && monster.target !== Rank.S_plus
                && monster.hearts.some(h => h.rank === Rank.S_plus);
            if (withSplus) {
                const heart = monster.hearts.find(h => h.rank === Rank.S_plus)!;
                const tmpCurColor = monster.curColor;
                const tmpCurCost = monster.curCost;
                const tmpTarget = monster.target;
                monster.curColor = heart.color;
                monster.curCost = heart.cost;
                monster.target = Rank.S_plus;
                cost = getCost(monster);
                scores = target.colors.map(c => target.scorer.calc(c, monster));
                dpSubProc(false, monster, cost, scores);
                monster.curColor = tmpCurColor;
                monster.curCost = tmpCurCost;
                monster.target = tmpTarget;
            }
            const dp3 = dp1;
            dp1 = dp2;
            dp2 = dp3;
            dp2.forEach(a => a.fill(null));
        }
    }
    if (HAS_REQSKILL) {
        dpProc(false, monster => !(target.reqSkillScorer!.calc(Color.Unset, monster) > 0));
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) < target.reqSkillCount) {
                dp1[s].fill(null);
            }
        }
    }
    if (HAS_REQSKILL_2) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_3) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_4) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
            || (target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill4Scorer!.calc(Color.Unset, monster) > 0));
    }
    dpProc(false, monster => (HAS_REQSKILL && target.reqSkillScorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_2 && target.reqSkill2Scorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_3 && target.reqSkill3Scorer!.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_4 && target.reqSkill4Scorer!.calc(Color.Unset, monster) > 0));
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
        result.appendChild(document.createElement("b")).textContent = "見つかりませんでした";
        return;
    }
    const heartSets: (HeartSet | null)[][] = [];
    const monsters: (HeartSet | null)[] = new Array(COUNT).fill(null);
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
            dexterity: 0,
            cost: 0,
            maximumCost: 0,
        };
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const hs = heartSet[p];
            if (hs === null) {
                continue;
            }
            const m = hs.monster;
            const tmpTarget = m.target;
            const tmpCurCost = m.curCost;
            const tmpCurColor = m.curColor;
            m.target = hs.rank;
            m.curCost = m.hearts.find(h => h.rank === hs.rank)!.cost;
            m.curColor = m.hearts.find(h => h.rank === hs.rank)!.color;
            st.score += target.scorer.calc(c, m);
            st.maximumHP += MaximumHPScorer.calc(c, m);
            st.maximumMP += MaximumMPScorer.calc(c, m);
            st.power += PowerScorer.calc(c, m);
            st.defence += DefenceScorer.calc(c, m);
            st.attackMagic += AttackMagicScorer.calc(c, m);
            st.recoverMagic += RecoverMagicScorer.calc(c, m);
            st.speed += SpeedScorer.calc(c, m);
            st.dexterity += DexterityScorer.calc(c, m);
            st.cost += m.curCost;
            st.maximumCost += m.hearts.find(h => h.rank === m.target)!.maximumCost;
            m.curColor = tmpCurColor;
            m.curCost = tmpCurCost;
            m.target = tmpTarget;
        }
        const key = JSON.stringify({ status: st, hearts: heartSet.map(h => `${h?.monster.id ?? -1} ${h?.monster.target}`).sort() });
        if (omitDuplicate.has(key)) {
            continue;
        }
        omitDuplicate.set(key, true);
        const fragment = template.content.cloneNode(true) as DocumentFragment;
        if (EXPOSE_MODE) {
            // 非公開機能を利用
            for (const sec of fragment.querySelectorAll(".secret")) {
                sec.classList.remove("secret");
            }
            const adoptionHeartSet: AdoptionHeartSet = {
                jobName: target.setname,
                score: `${st.score}`,
                maximumCost: target.maximumCost,
                powerUp: powerUp,
                colors: target.colors,
                hearts: new Array(target.colors.length).fill(null),
            };
            for (let p = 0; p < COUNT; p++) {
                const c = target.colors[p];
                const hs = heartSet[p];
                if (hs === null) {
                    continue;
                }
                adoptionHeartSet.hearts[p] = {
                    monster: hs.monster,
                    heart: hs.monster.hearts.find(h => h.rank === hs.rank)!
                };
            }
            fragment.querySelector(".result-item-adoption")!
                .addEventListener("click", () => adoptHeartSet(adoptionHeartSet));
        }
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
        text(".result-item-dexterity",    `${st.dexterity}`);
        for (let p = 0; p < COUNT; p++) {
            const c = target.colors[p];
            const hs = heartSet[p];
            if (hs === null) {
                continue;
            }
            const m = hs.monster;
            const tmpTarget = m.target;
            const tmpCurCost = m.curCost;
            const tmpCurColor = m.curColor;
            m.target = hs.rank;
            m.curCost = m.hearts.find(h => h.rank === hs.rank)!.cost;
            m.curColor = m.hearts.find(h => h.rank === hs.rank)!.color;
            const h = fragment.querySelector(`.result-item-heart${p+1}`)!;
            const colorSpan = h.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, m.curColor);
            h.appendChild(document.createElement("span")).textContent = `${m.curCost}`;
            const name = (m.target === Rank.S_plus && m.splusName !== null)
                       ? m.splusName : m.name;
            h.appendChild(document.createElement("span")).textContent = name;
            h.appendChild(document.createElement("span")).textContent = Rank[m.target!].replace("_plus", "+");
            const hsc = h.appendChild(document.createElement("span"));
            hsc.classList.add("result-item-heart-score");
            hsc.textContent = `( スコア: ${target.scorer.calc(c, m)} )`;
            fragment.querySelector(`.result-item-effects${p+1}`)!
                .textContent = m.hearts.find(h => h.rank === m.target)!.effects;
            m.target = tmpTarget;
            m.curCost = tmpCurCost;
            m.curColor = tmpCurColor;
        }
        result.appendChild(fragment);
    }
    result.insertBefore(document.createElement("div"), result.firstElementChild)
        .textContent = `件数: ${omitDuplicate.size}`;
}

// デモ用データの加工
function convertToDummy(list: Monster[]): void {
    if (DEBUG) {
        console.log("fill dummy data");
    }
    for (let i = 0; i < list.length; i++) {
        list[i].name = `ダミーデータ${i+1}`;
        list[i].splusName = null;
        for (const h of list[i].hearts) {
            h.effects = h.effects
                .replace(/(メラ|ヒャド|イオ|ギラ|バギ|デイン|ジバリア|ドルマ)(斬|体|呪|R)/g, "$1属性$2")
                .replace(/スキル(斬|体)/g, "スキルの$1")
                .replace(/体D/g, "体技D")
                .replace(/斬体R/g, "斬体技R")
                .replace(/斬体/g, "斬・体")
                .replace(/斬/g, "斬撃")
                .replace(/特技/g, "とくぎ")
                .replace(/獣/g, "けもの")
                .replace(/(鳥|物質|ゾンビ|ドラゴン|スライム|水|けもの|エレメント|マシン|植物|怪人|虫|悪魔|？？？？)/g, "$1系への")
                .replace(/ゴールド\+(\d)/g, "フィールド通常戦闘時ゴールド+$1")
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

(function() {
    // デフォルトの職業のこころ最大コストのリストを設定する
    const sel = document.getElementById("preset_heartset") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id === value) {
            setPreset(job);
            return;
        }
    }
    dialogAlert(`Unknown ID: ${value}`);
}());

// 職業ごとのこころ枠の組み合わせをフォームに設定する
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

// こころ枠の不使用を設定/解除に色のオプションの有効/無効を切り替える
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

// 色指定のバリデーション
function validateHeartColor() {
    const checked =
        (document.getElementById("add_color_yellow") as HTMLInputElement).checked
        || (document.getElementById("add_color_purple") as HTMLInputElement).checked
        || (document.getElementById("add_color_green") as HTMLInputElement).checked
        || (document.getElementById("add_color_red") as HTMLInputElement).checked
        || (document.getElementById("add_color_blue") as HTMLInputElement).checked;
    if (checked) {
        (document.getElementById("add_color_yellow") as HTMLInputElement)
            .setCustomValidity("");
    } else {
        (document.getElementById("add_color_yellow") as HTMLInputElement)
            .setCustomValidity("色を指定する必要があります");
    }
}

// 色指定のバリデーションのトリガー
document.getElementById("add_color_yellow")!
.addEventListener("change", () => {
    validateHeartColor();
});

// 色指定のバリデーションのトリガー
document.getElementById("add_color_purple")!
.addEventListener("change", () => {
    validateHeartColor();
});

// 色指定のバリデーションのトリガー
document.getElementById("add_color_green")!
.addEventListener("change", () => {
    validateHeartColor();
});

// 色指定のバリデーションのトリガー
document.getElementById("add_color_red")!
.addEventListener("change", () => {
    validateHeartColor();
});

// 色指定のバリデーションのトリガー
document.getElementById("add_color_blue")!
.addEventListener("change", () => {
    validateHeartColor();
});

// こころ追加フォームを開く
document.getElementById("add_heart")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click add_heart");
    }
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    (document.getElementById("add_monster_name") as HTMLInputElement).readOnly = false;
    (dialog.querySelector("form") as HTMLFormElement).reset();
    dialog.returnValue = "";
    validateHeartColor();
    dialog.showModal();
});

// こころ追加フォームにおいて登録済みモンスター名を入れたときにコストや色を自動補完する
document.getElementById("add_monster_name")!
.addEventListener("change", () => {
    const name = (document.getElementById("add_monster_name") as HTMLInputElement).value;
    if (monsterMap.has(name)) {
        const monster = monsterMap.get(name)!;
        const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
        const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
        (elements.namedItem("add_monster_splus_name") as HTMLInputElement).value = `${monster.splusName ?? ""}`;
        (elements.namedItem("add_cost") as HTMLInputElement).value = `${monster.curCost}`;
        (elements.namedItem("add_color_yellow") as HTMLInputElement).checked = (monster.curColor & Color.Yellow) === Color.Yellow;
        (elements.namedItem("add_color_purple") as HTMLInputElement).checked = (monster.curColor & Color.Purple) === Color.Purple;
        (elements.namedItem("add_color_green") as HTMLInputElement).checked = (monster.curColor & Color.Green) === Color.Green;
        (elements.namedItem("add_color_red") as HTMLInputElement).checked = (monster.curColor & Color.Red) === Color.Red;
        (elements.namedItem("add_color_blue") as HTMLInputElement).checked = (monster.curColor & Color.Blue) === Color.Blue;
    }
});

// こころ追加フォームでキャンセルしたとき
document.querySelector(`#add_heart_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click add_heart_dialog CANCEL button");
    }
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

// 新しいこころを追加する（フォームを閉じたときに発動）
document.getElementById("add_heart_dialog")!
.addEventListener("close", (event) => {
    if (DEBUG) {
        console.log("close add_heart_dialog");
    }
    const dialog = document.getElementById("add_heart_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "add") {
        return;
    }
    const elements = (dialog.querySelector("form") as HTMLFormElement).elements;
    const rad = (name: string) => (elements.namedItem(name) as RadioNodeList).value;
    const str = (name: string) => (elements.namedItem(name) as HTMLInputElement).value;
    const cbox = (name: string) => (elements.namedItem(name) as HTMLInputElement).checked;
    const noNaN = (v: number) => isNaN(v) ? 0 : v;
    const num = (name: string) => noNaN(parseInt(str(name)));
    const rank = Rank[rad("add_rank") as keyof typeof Rank];
    const cost = num("add_cost");
    let color = (cbox("add_color_yellow") ? Color.Yellow : Color.Unset)
                | (cbox("add_color_purple") ? Color.Purple : Color.Unset)
                | (cbox("add_color_green") ? Color.Green : Color.Unset)
                | (cbox("add_color_red") ? Color.Red : Color.Unset)
                | (cbox("add_color_blue") ? Color.Blue : Color.Unset);
    if (color === Color.Unset) {
        if (event.cancelable) {
            // dialogのcloseイベントはキャンセルできないぽい
            event.preventDefault();
        }
        dialogAlert("エラー！ 色を指定する必要があります");
        return;
    }
    const splusName = str("add_monster_splus_name").trim();
    const monster: Monster = {
        id: 0,
        name: str("add_monster_name").trim(),
        splusName: splusName === "" ? null : splusName,
        curColor: color,
        curCost: cost,
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
            color: color,
            cost: cost,
            maximumCost: num("add_maximumcost"),
            effects: str("add_effects").trim(),
        }],
        target: rank,
        withSplus: true,
        defaultTarget: rank,
        defaultWithSplus: true,
    };
    if (monsterMap.has(monster.name)) {
        const orig = monsterMap.get(monster.name)!;
        monster.withSplus = orig.withSplus;
        // 単一のこころ追加においては既定は変更しない方針
        monster.defaultTarget = orig.defaultTarget;
        monster.defaultWithSplus = orig.defaultWithSplus;
    }
    const updated: boolean = addHeart(monster);
    if (DEBUG) {
        console.log(`add heart: updated: ${updated}`);
    }
    dialogAlert(`${monster.name} ${Rank[monster.hearts[0].rank].replace("_plus", "+")} を追加しました`);
    if (updated) {
        saveMonsterList(Trigger.UpdateStatus);
    }
    updateChangedRankCount();
});

// ダウンロードボタンを押したときの処理
document.getElementById("download")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click download");
    }
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

// ファイル読込フォームのキャンセル
document.querySelector(`#file_load_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click file_load_dialog CANCEL button");
    }
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

// ファイル読込フォームを開く
document.getElementById("load_file")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click load_file");
    }
    const dialog = document.getElementById("file_load_dialog") as HTMLDialogElement;
    (dialog.querySelector("form") as HTMLFormElement).reset();
    dialog.returnValue = "";
    dialog.showModal();
});

// ファイルを読み込む（フォームを閉じたときに発動）
document.getElementById("file_load_dialog")!
.addEventListener("close", () => {
    if (DEBUG) {
        console.log("close file_as_older");
    }
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
        let updated: boolean = false;
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
    }).catch( err => {
        dialogAlert(`${err}`);
    });
});

// 式フォームのバリデーション
function checkExpressionValidity(elemId: string): boolean {
    const elem = document.getElementById(elemId) as HTMLInputElement;
    const v = elem.validity;
    if (v.customError || v.valid) {
        if (!elem.required) {
            if (v.customError) {
                elem.setCustomValidity("");
                return elem.checkValidity();
            }
            return true;
        }
        try {
            const expr = elem.value;
            if (expr !== "") {
                parseExpression(expr);
            }
            elem.setCustomValidity("");
        } catch (err) {
            if (err instanceof ExprSyntaxError) {
                elem.setCustomValidity(err.getMessage());
            } else {
                console.log(`${err}`);
                elem.setCustomValidity(`エラー: ${err}`);
            }
        } finally {
            return elem.checkValidity();
        }
    }
    return false;
}

// 特別条件式フォームの条件1のバリデーションの有無の切り替え
document.getElementById("heart_require_skill")!
.addEventListener("change", () => {
    const checked = (document.getElementById("heart_require_skill") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression") as HTMLInputElement)
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression");

    (document.getElementById("heart_with_s_plus") as HTMLInputElement)
        .disabled = checked;

    // 条件2
    const checked2 = checked && (document.getElementById("heart_require_skill_2") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_2") as HTMLInputElement)
        .required = checked2;
    checkExpressionValidity("heart_require_skill_expression_2");

    // 条件3
    const checked3 = checked2 && (document.getElementById("heart_require_skill_3") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_3") as HTMLInputElement)
        .required = checked3;
    checkExpressionValidity("heart_require_skill_expression_3");

    // 条件4
    const checked4 = checked3 && (document.getElementById("heart_require_skill_4") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_4") as HTMLInputElement)
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});

// 特別条件式フォームの条件2バリデーションの有無の切り替え
document.getElementById("heart_require_skill_2")!
.addEventListener("change", () => {
    const checked = (document.getElementById("heart_require_skill_2") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_2") as HTMLInputElement)
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_2");

    // 条件3
    const checked3 = checked && (document.getElementById("heart_require_skill_3") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_3") as HTMLInputElement)
        .required = checked3;
    checkExpressionValidity("heart_require_skill_expression_3");

    // 条件4
    const checked4 = checked3 && (document.getElementById("heart_require_skill_4") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_4") as HTMLInputElement)
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});

// 特別条件式フォームの条件3バリデーションの有無の切り替え
document.getElementById("heart_require_skill_3")!
.addEventListener("change", () => {
    const checked = (document.getElementById("heart_require_skill_3") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_3") as HTMLInputElement)
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_3");

    // 条件4
    const checked4 = checked && (document.getElementById("heart_require_skill_4") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_4") as HTMLInputElement)
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});

// 特別条件式フォームの条件4バリデーションの有無の切り替え
document.getElementById("heart_require_skill_3")!
.addEventListener("change", () => {
    const checked = (document.getElementById("heart_require_skill_4") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill_expression_4") as HTMLInputElement)
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_4");
});

// 特別条件式フォームの条件1のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression");
});

// 特別条件式フォームの条件2のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_2")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_2");
});

// 特別条件式フォームの条件3のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_3")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_3");
});

// 特別条件式フォームの条件4のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_4")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_4");
});

// 式フォームのバリデーションのトリガーをセット
document.getElementById("expression")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("expression");
});

// 最大化するオプションで式を選んだときと式から切り替えたときのフォーム見た目の処理
(function () {
    const e = document.getElementById("expression") as HTMLInputElement;
    const ge = document.getElementById("goal_expression") as HTMLInputElement;
    const f = () => {
        e.required = ge.checked;
        checkExpressionValidity("expression");
    };
    const goals = document.querySelectorAll(`#search_heart_dialog input[name="goal"]`);
    for (const goal of goals) {
        goal.addEventListener("change", f);
    }
})();

// 覚醒同時検索の有無の切り替え
document.getElementById("heart_with_s_plus")!
.addEventListener("change", () => {
    const checked = (document.getElementById("heart_with_s_plus") as HTMLInputElement).checked;
    (document.getElementById("heart_require_skill") as HTMLInputElement)
        .disabled = checked;
});

// こころセット探索対象の設定フォームのキャンセル
document.querySelector(`#search_heart_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click search_heart_dialog CANCEL button");
    }
    const dialog = document.getElementById("search_heart_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

// こころセットを探索する（フォームを閉じたときに発動）
document.getElementById("search_heart_dialog")!
.addEventListener("close", () => {
    if (DEBUG) {
        console.log("close check_heart_dialog");
    }
    saveHeartSetSearchForm(); // キャンセル時も保存？
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
        if (err instanceof ExprSyntaxError) {
            dialogAlert(err.getMessage());
        } else {
            dialogAlert(`${err}`);
            console.log(err);
        }
    }
});

// こころセット探索フォームを開く
document.getElementById("search_heart")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click search_heart");
    }
    const dialog = document.getElementById("search_heart_dialog") as HTMLDialogElement;
    dialog.showModal();
});

// 最大化の式の確認ボタンを押した時の処理
document.getElementById("check_expression")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expression");
    }
    const exprElem = document.getElementById("expression") as HTMLInputElement;
    if (!exprElem.reportValidity()) {
        return;
    }
    updatePowerUp();
    const dialog = document.getElementById("score_list_dialog") as HTMLDialogElement;
    const exprSrc = exprElem.value;
    const msg = dialog.querySelector(".message")!;
    const tbody = dialog.querySelector("tbody")!;
    msg.innerHTML = "";
    tbody.innerHTML = "";
    if (exprSrc.trim().length === 0) {
        msg.textContent = "式がありません";
    } else {
        try {
            const expr = parseExpression(exprSrc);
            if (expr === null) {
                throw "おそらく式に誤りがあります";
            }
            for (const m of monsterList) {
                if (m.target === null) {
                    continue;
                }
                const tr = tbody.appendChild(document.createElement("tr"));
                const c = tr.appendChild(document.createElement("td"));
                showHeartColor(c.appendChild(document.createElement("span")), m.curColor);
                tr.appendChild(document.createElement("td")).textContent = `${m.curCost}`;
                const name = (m.target === Rank.S_plus && m.splusName !== null)
                           ? m.splusName : m.name;
                tr.appendChild(document.createElement("td")).textContent = name;
                tr.appendChild(document.createElement("td")).textContent = Rank[m.target].replace("_plus", "+");
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Unset, m)}`;
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Rainbow, m)}`;
            }
        } catch (err) {
            if (err instanceof ExprSyntaxError) {
                msg.appendChild(document.createElement("span")).textContent = msg.textContent = `おそらく${err.pos+1}文字目付近に式の誤りがあります。 `;;
                msg.appendChild(document.createElement("br"));
                const code = msg.appendChild(document.createElement("code"));
                code.classList.add("outline");
                code.appendChild(document.createElement("span")).textContent = err.strs[0];
                const span2 = code.appendChild(document.createElement("span"));
                span2.classList.add("error-expression");
                span2.textContent = err.strs[1];
                code.appendChild(document.createElement("span")).textContent = err.strs[2];
            } else {
                msg.textContent = `${err}`;
                console.log(err);
            }
        }
    }
    dialog.showModal();
});

function checkRequireSkillExpression(exprElemId: string) {
    const exprElem = document.getElementById(exprElemId) as HTMLInputElement;
    if (!exprElem.reportValidity()) {
        return;
    }
    updatePowerUp();
    const dialog = document.getElementById("score_list_dialog") as HTMLDialogElement;
    const exprSrc = exprElem.value;
    const msg = dialog.querySelector(".message")!;
    const tbody = dialog.querySelector("tbody")!;
    msg.innerHTML = "";
    tbody.innerHTML = "";
    if (exprSrc.trim().length === 0) {
        msg.textContent = "式がありません";
    } else {
        try {
            const expr = parseExpression(exprSrc);
            if (expr === null) {
                throw "おそらく式に誤りがあります";
            }
            for (const m of monsterList) {
                if (m.target === null) {
                    continue;
                }
                const tr = tbody.appendChild(document.createElement("tr"));
                const c = tr.appendChild(document.createElement("td"));
                showHeartColor(c.appendChild(document.createElement("span")), m.curColor);
                tr.appendChild(document.createElement("td")).textContent = `${m.curCost}`;
                const name = (m.target === Rank.S_plus && m.splusName !== null)
                           ? m.splusName : m.name;
                tr.appendChild(document.createElement("td")).textContent = name;
                tr.appendChild(document.createElement("td")).textContent = Rank[m.target].replace("_plus", "+");
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Unset, m)}`;
                tr.appendChild(document.createElement("td")).textContent = "-";
            }
        } catch (err) {
            if (err instanceof ExprSyntaxError) {
                msg.appendChild(document.createElement("span")).textContent = msg.textContent = `おそらく${err.pos+1}文字目付近に式の誤りがあります。 `;;
                msg.appendChild(document.createElement("br"));
                const code = msg.appendChild(document.createElement("code"));
                code.classList.add("outline");
                code.appendChild(document.createElement("span")).textContent = err.strs[0];
                const span2 = code.appendChild(document.createElement("span"));
                span2.classList.add("error-expression");
                span2.textContent = err.strs[1];
                code.appendChild(document.createElement("span")).textContent = err.strs[2];
            } else {
                msg.textContent = `${err}`;
                console.log(err);
            }
        }
    }
    dialog.showModal();
}

// 特別条件の条件1の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill");
    }
    checkRequireSkillExpression("heart_require_skill_expression");
});

// 特別条件の条件2の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_2")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_2");
    }
    checkRequireSkillExpression("heart_require_skill_expression_2");
});

// 特別条件の条件3の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_3")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_3");
    }
    checkRequireSkillExpression("heart_require_skill_expression_3");
});

// 特別条件の条件4の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_4")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_4");
    }
    checkRequireSkillExpression("heart_require_skill_expression_4");
});

// 全こころのランク変更のクリア
document.getElementById("reset_rank")!
.addEventListener("click", () => {
    let count = 0;
    for (const monster of monsterList) {
        if (monster.target !== null) {
            if (monster.hearts.every(h => h.rank >= monster.target!)) {
                if (monster.withSplus) {
                    // ランク変更がないのでスキップ
                    continue;
                }
            }
        }
        monster.withSplus = true;
        let bestRank = monster.hearts[0].rank;
        for (const heart of monster.hearts) {
            if (heart.rank < bestRank) {
                bestRank = heart.rank;
            }
        }
        monster.target = bestRank;
        let reorder = false;
        const newCurCost = monster.hearts.find(h => h.rank === monster.target)!.cost;
        if (monster.curCost !== newCurCost) {
            monster.curCost = newCurCost;
            monsterList.sort((a, b) => b.curCost - a.curCost);
            reorder = true;
        }
        showUpdatedHeart(monster, reorder);
        count++;
    }
    if (count > 0) {
        saveMonsterList(Trigger.ChooseRank);
        updateChangedRankCount();
    }
});

// 全こころのランク変更を既定に戻す
document.getElementById("return_default_rank")!
.addEventListener("click", () => {
    let count = 0;
    for (const monster of monsterList) {
        let changed = false;
        if (monster.target !== monster.defaultTarget) {
            monster.target = monster.defaultTarget;
            changed = true;
        }
        if (monster.withSplus !== monster.defaultWithSplus) {
            monster.withSplus = monster.defaultWithSplus;
            changed = true;
        }
        if (!changed) {
            // ランク変更がないのでスキップ
            continue;
        }
        let reorder = false;
        const newCurCost = monster.hearts.find(h => h.rank === monster.target)!.cost;
        if (monster.curCost !== newCurCost) {
            monster.curCost = newCurCost;
            monsterList.sort((a, b) => b.curCost - a.curCost);
            reorder = true;
        }
        showUpdatedHeart(monster, reorder);
        count++;
    }
    if (count > 0) {
        saveMonsterList(Trigger.ChooseRank);
        updateChangedRankCount();
    }
});

// 現在の全こころのランク変更を既定にする
document.getElementById("set_default_rank")!
.addEventListener("click", () => {
    let count = 0;
    for (const monster of monsterList) {
        if (monster.target !== monster.defaultTarget) {
            monster.defaultTarget = monster.target;
            count++;
        }
        if (monster.withSplus !== monster.defaultWithSplus) {
            monster.defaultWithSplus = monster.withSplus;
            count++;
        }
    }
    if (count > 0) {
        saveMonsterList(Trigger.ChooseRank);
        updateChangedRankCount();
    }
    dialogAlert("既定として登録しました");
});


// こころ名の変更フォームのキャンセル
document.querySelector(`#change_monster_name_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click change_monster_name_dialog CANCEL button");
    }
    const dialog = document.getElementById("change_monster_name_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});


// こころ名の変更フォームの新しい名前のバリデーションのトリガーをセット
document.getElementById("new_monster_name")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    const elem = document.getElementById("new_monster_name") as HTMLInputElement;
    const v = elem.validity;
    if (v.customError || v.valid) {
        const newName = elem.value.trim();
        if (monsterMap.has(newName)) {
            elem.setCustomValidity(`『 ${newName} 』は同名のこころがあるので使えません`);
        } else if (newName === "") {
            elem.setCustomValidity("新しい名前が空欄です");
        } else {
            elem.setCustomValidity("");
        }
    }
});

// こころ名の変更（フォームを閉じたときに発動）
document.getElementById("change_monster_name_dialog")!
.addEventListener("close", () => {
    if (DEBUG) {
        console.log("close change_monster_name_dialog");
    }
    const dialog = document.getElementById("change_monster_name_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "change") {
        return;
    }
    const oldName = (document.getElementById("old_monster_name") as HTMLInputElement).value;
    const newName = (document.getElementById("new_monster_name") as HTMLInputElement).value;
    const monster = monsterMap.get(oldName)!;
    monster.name = newName;
    replaceMonsterList(monsterList);
    saveMonsterList(Trigger.UpdateStatus);
    dialogAlert(`こころの名前を『 ${oldName} 』から『 ${newName} 』に変更しました`);
});

// こころの採用リストのクリア
document.getElementById("clear_adoption_heartset_list")!
.addEventListener("click", () => {
    adoptionHeartSetList = [];
    saveAdoptionHeartSetList();
    document.getElementById("adoption_heartset_list")!.innerHTML = "";
});


// こころの採用のダイアログのキャンセル
document.querySelector(`#adoption_heartset_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click adoption_heartset_dialog CANCEL button");
    }
    const dialog = document.getElementById("adoption_heartset_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
    dialogAlert("キャンセルしました");
});

// こころの採用のダイアログと閉じた時
document.getElementById("adoption_heartset_dialog")!
.addEventListener("close", () => {
    if (DEBUG) {
        console.log("close adoption_heartset_dialog");
    }
    const dialog = document.getElementById("adoption_heartset_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "change") {
        return;
    }
    if (currentAdoptionHeartSet === null) {
        throw "BUG";
    }
    const elems = dialog.querySelectorAll(".adoption-monster");
    let changed = false;
    for (let i = 0; i < elems.length; i++) {
        const mah = currentAdoptionHeartSet.hearts.at(i) ?? null;
        if (mah === null) {
            continue;
        }
        const elem = elems[i];
        const rankElems = elem.querySelectorAll(".monster-rank");
        const withSplusElem = elem.querySelector(".monster-with-s_plus") as HTMLInputElement;
        const oldCurCost = mah.monster.curCost;
        const oldWithSplus = mah.monster.withSplus;
        const oldTarget = mah.monster.target;
        for (const re of rankElems) {
            if (!(re as HTMLInputElement).checked) {
                continue;
            }
            const value = (re as HTMLInputElement).value ?? "omit";
            if (value === "omit") {
                mah.monster.target = null;
            } else {
                const rank = Rank[value as keyof typeof Rank];
                mah.monster.target = rank;
                const heart = mah.monster.hearts.find(h => h.rank === rank)!;
                mah.monster.curCost = heart.cost;
                mah.monster.curColor = heart.color;
            }
            break;
        }
        if (!withSplusElem.disabled) {
            mah.monster.withSplus = withSplusElem.checked;
        }
        if (mah.monster.target !== oldTarget || mah.monster.withSplus !== oldWithSplus) {
            let reorder = false;
            if (oldCurCost !== mah.monster.curCost) {
                monsterList.sort((a, b) => b.curCost - a.curCost);
                reorder = true;
            }
            showUpdatedHeart(mah.monster, reorder);
            changed = true;
        }
    }
    let message = "";
    if (changed) {
        saveMonsterList(Trigger.ChooseRank);
        updateChangedRankCount();
        message += "ランク変更を反映しました。";
    }
    if (addToAdoptionHeartSetList()) {
        message += "採用こころセットのリストに追加しました。";
        saveAdoptionHeartSetList();
    }
    dialogAlert(message === "" ? "ランク変更はありません。こころセットは既にリストにあります。" : message);
});

// 登録済みの式を入力する（フォームを閉じたときに発動）
document.getElementById("expr_rec_dialog")!
.addEventListener("close", () => {
    if (DEBUG) {
        console.log("close expr_rec_dialog");
    }
    const dialog = document.getElementById("expr_rec_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "input") {
        return;
    }
    const elems = (dialog.querySelector(":scope form") as HTMLFormElement).elements;
    const expr = (elems.namedItem("expr_rec_expr") as HTMLInputElement).value;
    const isAppend = (elems.namedItem("expr_rec_option") as HTMLInputElement).value === "append";
    const targetId = (elems.namedItem("expr_rec_target_id") as HTMLInputElement).value;
    const targetElem = document.getElementById(targetId);
    if (targetElem === null) {
        console.log(`not found targetId: ${targetId}`);
        return;
    }
    if (targetElem instanceof HTMLInputElement) {
        if (isAppend) {
            targetElem.value += expr;
        } else {
            targetElem.value = expr;
        }
    } else {
        if (isAppend) {
            targetElem.textContent += expr;
        } else {
            targetElem.textContent = expr;
        }
    }
});

// 登録済み式の入力フォームのキャンセル
document.querySelector(`#expr_rec_dialog button[value="cancel"]`)!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_dialog CANCEL button");
    }
    const dialog = document.getElementById("expr_rec_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

// 登録する式のバリデーションのトリガーをセット
document.getElementById("expr_rec_add_expr")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    checkExpressionValidity("expr_rec_add_expr");
});

// 式登録ダイアログの式の確認
function checkExprRecordSkillExpression(exprId: string): void {
   if (DEBUG) {
        console.log("call checkExprRecordSkillExpression");
    }
    const exprElem = document.getElementById(exprId) as HTMLInputElement;
    if (!exprElem.reportValidity()) {
        return;
    }
    const powerUpStr = (document.getElementById("expr_rec_powerup") as HTMLInputElement).value;
    const oldPowerUp = powerUp;
    const hasPowerUp = powerUpStr !== "";
    if (hasPowerUp) {
        powerUp = parseFloat(powerUpStr);
    }
    const dialog = document.getElementById("score_list_dialog") as HTMLDialogElement;
    const exprSrc = exprElem.value;
    const msg = dialog.querySelector(".message")!;
    const tbody = dialog.querySelector("tbody")!;
    msg.innerHTML = "";
    tbody.innerHTML = "";
    if (exprSrc.trim().length === 0) {
        msg.textContent = "式がありません";
    } else {
        try {
            const expr = parseExpression(exprSrc);
            if (expr === null) {
                throw "おそらく式に誤りがあります";
            }
            for (const m of monsterList) {
                if (m.target === null) {
                    continue;
                }
                const tr = tbody.appendChild(document.createElement("tr"));
                const c = tr.appendChild(document.createElement("td"));
                showHeartColor(c.appendChild(document.createElement("span")), m.curColor);
                tr.appendChild(document.createElement("td")).textContent = `${m.curCost}`;
                const name = (m.target === Rank.S_plus && m.splusName !== null)
                           ? m.splusName : m.name;
                tr.appendChild(document.createElement("td")).textContent = name;
                tr.appendChild(document.createElement("td")).textContent = Rank[m.target].replace("_plus", "+");
                tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Unset, m)}`;
                if (hasPowerUp) {
                    tr.appendChild(document.createElement("td")).textContent = `${expr.calc(Color.Rainbow, m)}`;
                } else {
                    tr.appendChild(document.createElement("td")).textContent = "-";
                }
            }
        } catch (err) {
            if (err instanceof ExprSyntaxError) {
                msg.appendChild(document.createElement("span")).textContent = msg.textContent = `おそらく${err.pos+1}文字目付近に式の誤りがあります。 `;;
                msg.appendChild(document.createElement("br"));
                const code = msg.appendChild(document.createElement("code"));
                code.classList.add("outline");
                code.appendChild(document.createElement("span")).textContent = err.strs[0];
                const span2 = code.appendChild(document.createElement("span"));
                span2.classList.add("error-expression");
                span2.textContent = err.strs[1];
                code.appendChild(document.createElement("span")).textContent = err.strs[2];
            } else {
                msg.textContent = `${err}`;
                console.log(err);
            }
        }
    }
    powerUp = oldPowerUp;
    dialog.showModal();
}

// 登録済みの式の確認ボタンを押した時の処理
document.getElementById("check_expr_rec_expr")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expr_rec_expr");
    }
    checkExprRecordSkillExpression("expr_rec_expr");
});

// 登録する式の確認ボタンを押した時の処理
document.getElementById("check_expr_rec_add_expr")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expr_rec_add_expr");
    }
    checkExprRecordSkillExpression("expr_rec_add_expr");
});

// 登録する式の登録ボタンを押した時の処理
document.getElementById("expr_rec_add")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_add");
    }
    const check = (e: HTMLInputElement): boolean => {
        e.required = true;
        const validity = e.checkValidity();
        e.required = false;
        return validity;
    };
    const categoryElem = (document.getElementById("expr_rec_add_category") as HTMLInputElement);
    if (!check(categoryElem)) {
        dialogAlert("カテゴリ名を入力してください");
        return;
    }
    const exprNameElem = (document.getElementById("expr_rec_add_expr_name") as HTMLInputElement);
    if (!check(exprNameElem)) {
        dialogAlert("登録名を入力してください");
        return;
    }
    const exprElem = (document.getElementById("expr_rec_add_expr") as HTMLInputElement);
    if (!check(exprElem)) {
        dialogAlert("式を入力してください");
        return;
    }
    const category = categoryElem.value;
    const exprName = exprNameElem.value;
    const expr = exprElem.value;
    try {
        parseExpression(expr);
    } catch (err) {
        if (err instanceof ExprSyntaxError) {
            dialogAlert("式のエラー: " + err.getMessage());
        } else {
            console.log(`${err}`);
            dialogAlert("不明なエラー");
        }
        return;
    }
    addExprRecord(category, exprName, expr);
    dialogAlert(`式がカテゴリ『${category}』の登録名『${exprName}』として登録されました`);
});

function showExprRecordDialog(exprId: string, powerUpStr?: string): void {
    const dialog = document.getElementById("expr_rec_dialog") as HTMLDialogElement;
    (document.getElementById("expr_rec_target_id") as HTMLInputElement).value = exprId;
    (document.getElementById("expr_rec_powerup") as HTMLInputElement).value = powerUpStr ?? "";
    (dialog.querySelector(":scope form") as HTMLFormElement).reset(); // これはちょっと雑（連続で使いたい場合とか面倒？
    for (const e of dialog.querySelectorAll(":scope details")) {
        (e as HTMLDetailsElement).open = false;
    }
    const category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
    updateSelectExprRecordExprNameList(category);
    const exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
    (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
    updateDataListExprRecordExprNameList("");
    dialog.showModal();
}

// 式登録ダイアログの式選択のカテゴリ選択時
document.getElementById("expr_rec_category")!
.addEventListener("change", () => {
    const category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
    updateSelectExprRecordExprNameList(category);
    const exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
    (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
});

// 式登録ダイアログの式の登録のカテゴリ選択時
document.getElementById("expr_rec_add_category")!
.addEventListener("change", () => {
    const category = (document.getElementById("expr_rec_add_category") as HTMLInputElement).value;
    updateDataListExprRecordExprNameList(category);
});

// 式登録ダイアログの式選択の登録名選択時
document.getElementById("expr_rec_expr_name")!
.addEventListener("change", () => {
    const category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
    const exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
    (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
});

// 式登録ダイアログの式の登録の登録名選択時
document.getElementById("expr_rec_add_expr_name")!
.addEventListener("change", () => {
    const exprElem = document.getElementById("expr_rec_add_expr") as HTMLInputElement;
    if (exprElem.value !== "") {
        return;
    }
    const category = (document.getElementById("expr_rec_add_category") as HTMLSelectElement).value;
    const exprName = (document.getElementById("expr_rec_add_expr_name") as HTMLSelectElement).value;
    exprElem.value = getRecoredExpr(category, exprName);
});

// 登録済み式の削除ボタン
document.getElementById("expr_rec_delete")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_delete");
    }
    const dialog = document.getElementById("expr_rec_dialog") as HTMLDialogElement;
    const form = dialog.querySelector(":scope form") as HTMLFormElement;
    if (!form.reportValidity()) {
        return;
    }
    const elems = form.elements;
    const category = (elems.namedItem("expr_rec_category") as HTMLSelectElement).value;
    const exprName = (elems.namedItem("expr_rec_expr_name") as HTMLSelectElement).value;
    const checkElem = elems.namedItem("expr_rec_delete_check") as HTMLInputElement;
    if (!checkElem.checked) {
        dialogAlert("削除を実行するにはチェックを入れてください");
        return;
    }
    if (deleteExprRecord(category, exprName)) {
        dialogAlert(`カテゴリ『${category}』の登録名『${exprName}』の式を削除しました`);
        checkElem.checked = false;
    }
});

// 登録済み式の挿入ダイアログを開く　（こころセット検索、最大化式）
document.getElementById("expression_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expression_from");
    }
    showExprRecordDialog("expression", (document.getElementById("heart_power_up") as HTMLInputElement).value);
});

// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件1）
document.getElementById("heart_require_skill_expression_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_from");
    }
    showExprRecordDialog("heart_require_skill_expression");
});

// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件2）
document.getElementById("heart_require_skill_expression_2_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_2_from");
    }
    showExprRecordDialog("heart_require_skill_expression_2");
});

// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件3）
document.getElementById("heart_require_skill_expression_3_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_3_from");
    }
    showExprRecordDialog("heart_require_skill_expression_3");
});

// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件4）
document.getElementById("heart_require_skill_expression_4_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_4_from");
    }
    showExprRecordDialog("heart_require_skill_expression_4");
});

function showDownloadDataLink(linkId: string, data: any): void {
    const link = document.getElementById(linkId)!;
    link.hidden = true;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        (link.querySelector("a") as HTMLAnchorElement)
            .href = reader.result as string;
        link.querySelector("span")!.textContent = `(${new Date()})`;
        link.hidden = false;
    });
    const json = JSON.stringify(data);
    reader.readAsDataURL(new Blob([json]));
}

interface LoadDataFileListener<T> {
    isValid: (data: T | unknown) => data is T;
    truncate: (data: T) => void;
    fileAsNewer: (data: T) => void;
    fileAsOlder: (data: T) => void;
}

function loadDataFile<T>(fileId: string, radioId: string, listener: LoadDataFileListener<T>): void {
    const files = (document.getElementById(fileId) as HTMLInputElement).files;
    if (files === null || files.length === 0) {
        dialogAlert("ファイルを選択してください");
        return;
    }
    const file = files[0];
    let option = "";
    for (const radio of document.querySelectorAll(`#${radioId} input`)) {
        if ((radio as HTMLInputElement).checked) {
            option = (radio as HTMLInputElement).value;
            break;
        }
    }
    file.text().then( text => {
        const data = JSON.parse(text);
        if (listener.isValid(data)) {
            switch (option) {
                case "file_as_newer":
                    listener.fileAsNewer(data);
                    break;
                case "file_as_older":
                    listener.fileAsOlder(data);
                    break;
                default:
                    listener.truncate(data);
                    break;
            }
        } else {
            dialogAlert("エラー: ファイル内容が不正です");
        }
    }).catch( err => {
        dialogAlert(`${err}`);
    });
}

// データファイルのダウンロード （登録した式）
document.getElementById("data_file_expr_rec_download")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_expr_rec_download");
    }
    showDownloadDataLink("data_file_expr_rec_downloadlink", exprRecordLists);
});

// データファイルの読み込み （登録した式）
document.getElementById("data_file_expr_rec_load")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_expr_rec_load");
    }
    const erMerge: MergeListTask<ExprRecord> = {
        doesMerge: (oldOne: ExprRecord, newOne: ExprRecord) => oldOne.name === newOne.name,
        merge: (oldOne: ExprRecord, newOne: ExprRecord) => newOne,
    };
    const erlMerge: MergeListTask<ExprRecordList> = {
        doesMerge: (oldOne: ExprRecordList, newOne: ExprRecordList) => oldOne.category === newOne.category,
        merge: (oldOne: ExprRecordList, newOne: ExprRecordList) => ({
            category: newOne.category,
            list: mergeList(oldOne.list, newOne.list, erMerge).sort((a, b) => a.name.localeCompare(b.name))
        })
    };
    const update = () => {
        saveExprRecord();
        updateExprRecordCategoryList();
        const category = (document.getElementById("expr_rec_category") as HTMLSelectElement).value;
        updateSelectExprRecordExprNameList(category);
        const exprName = (document.getElementById("expr_rec_expr_name") as HTMLSelectElement).value;
        (document.getElementById("expr_rec_expr") as HTMLInputElement).value = getRecoredExpr(category, exprName);
        dialogAlert("読み込み完了しました");
    };
    loadDataFile("data_file_expr_rec_load_file", "data_file_expr_rec_load_option", {
        isValid: isValidExprRecordListData,
        truncate: (data: ExprRecordList[]) => {
            exprRecordLists = data;
            update();
        },
        fileAsNewer: (data: ExprRecordList[]) => {
            const newList = mergeList(exprRecordLists, data, erlMerge).sort((a, b) => a.category.localeCompare(b.category));
            exprRecordLists = newList;
            update();
        },
        fileAsOlder: (data: ExprRecordList[]) => {
            const newList = mergeList(data, exprRecordLists, erlMerge).sort((a, b) => a.category.localeCompare(b.category));
            exprRecordLists = newList;
            update();
        }
    });
});


/////////////////////////////////////////////////////////////////////////////////////
// ステータス距離
/////////////////////////////////////////////////////////////////////////////////////


// ステータス近距離を求める
document.getElementById("calc_status_distance")!.addEventListener("click", () => {
    const tbody = document.getElementById("status_distance_tbody")!;
    tbody.innerHTML = "";
    if (monsterList.length === 0) {
        dialogAlert("こころが１個もないよ");
        return;
    }
    function isUpward(m: Status, target: Status): boolean {
        return m.maximumHP    <= target.maximumHP
            && m.maximumMP    <= target.maximumMP
            && m.power        <= target.power
            && m.defence      <= target.defence
            && m.attackMagic  <= target.attackMagic
            && m.recoverMagic <= target.recoverMagic
            && m.speed        <= target.speed
            && m.dexterity     <= target.dexterity
            && (m.maximumHP    < target.maximumHP
             || m.maximumMP    < target.maximumMP
             || m.power        < target.power
             || m.defence      < target.defence
             || m.attackMagic  < target.attackMagic
             || m.recoverMagic < target.recoverMagic
             || m.speed        < target.speed
             || m.dexterity    < target.dexterity
             );
    }
    function euclidean(m1: Status, m2: Status): number {
        return Math.sqrt(Math.pow(m1.maximumHP    - m2.maximumHP   , 2)
                       + Math.pow(m1.maximumMP    - m2.maximumMP   , 2)
                       + Math.pow(m1.power        - m2.power       , 2)
                       + Math.pow(m1.defence      - m2.defence     , 2)
                       + Math.pow(m1.attackMagic  - m2.attackMagic , 2)
                       + Math.pow(m1.recoverMagic - m2.recoverMagic, 2)
                       + Math.pow(m1.speed        - m2.speed       , 2)
                       + Math.pow(m1.dexterity    - m2.dexterity    , 2)
                       );
    }
    function manhattan(m1: Status, m2: Status): number {
        return Math.abs(m1.maximumHP    - m2.maximumHP)
             + Math.abs(m1.maximumMP    - m2.maximumMP)
             + Math.abs(m1.power        - m2.power)
             + Math.abs(m1.defence      - m2.defence)
             + Math.abs(m1.attackMagic  - m2.attackMagic)
             + Math.abs(m1.recoverMagic - m2.recoverMagic)
             + Math.abs(m1.speed        - m2.speed)
             + Math.abs(m1.dexterity    - m2.dexterity);
    }
    interface DistStatus {
        monster: Monster | null;
        distance: number;
    }
    for (let a = 0; a < monsterList.length; a++) {
        let upwardMinCost: DistStatus = { monster: null, distance: 9999999 };
        let upwardEuclidean: DistStatus = { monster: null, distance: 9999999 };
        let upwardManhattan: DistStatus = { monster: null, distance: 9999999 };
        let downwardEuclidean: DistStatus = { monster: null, distance: 9999999 };
        let downwardManhattan: DistStatus = { monster: null, distance: 9999999 };
        let nearestEuclidean: DistStatus = { monster: null, distance: 9999999 };
        let nearestManhattan: DistStatus = { monster: null, distance: 9999999 };
        const m1 = monsterList[a];
        if (m1.target === null) {
            continue;
        }
        const h1 = m1.hearts.find(h => h.rank === m1.target)!;
        for (let b = 0; b < monsterList.length; b++) {
            if (a === b) {
                continue;
            }
            const m2 = monsterList[b];
            if (m2.target === null) {
                continue;
            }
            const h2 = m2.hearts.find(h => h.rank === m2.target)!;
            let ed = euclidean(h1, h2);
            let md = manhattan(h1, h2);
            if (isUpward(h1, h2)) {
                const cd = (m2.curCost - h2.maximumCost) - (m1.curCost - h1.maximumCost);
                if (cd < upwardMinCost.distance) {
                    upwardMinCost.monster = m2;
                    upwardMinCost.distance = cd;
                }
                if (ed < upwardEuclidean.distance) {
                    upwardEuclidean.monster = m2;
                    upwardEuclidean.distance = ed
                }
                if (md < upwardManhattan.distance) {
                    upwardManhattan.monster = m2;
                    upwardManhattan.distance = md;;
                }
            }
            if (isUpward(h2, h1)) {
                if (ed < downwardEuclidean.distance) {
                    downwardEuclidean.monster = m2;
                    downwardEuclidean.distance = ed
                }
                if (md < downwardManhattan.distance) {
                    downwardManhattan.monster = m2;
                    downwardManhattan.distance = md;;
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
        showHeartColor(targetSpan, m1.curColor);
        const name1 = (m1.target === Rank.S_plus && m1.splusName !== null)
                   ? m1.splusName : m1.name;
        targetTd.appendChild(document.createElement("span")).textContent =
            `${m1.curCost} ${name1} ${Rank[m1.target].replace("_plus", "+")}`;
        function append(ds: DistStatus) {
            const td = tr.appendChild(document.createElement("td"));
            if (ds.monster === null) {
                td.textContent = "－";
                return;
            }
            const span = td.appendChild(document.createElement("span"));
            showHeartColor(span, ds.monster.curColor);
            const name = (ds.monster.target === Rank.S_plus && ds.monster.splusName !== null)
                       ? ds.monster.splusName : ds.monster.name;
            td.appendChild(document.createElement("span")).textContent =
                `${ds.monster.curCost} ${name} ${Rank[ds.monster.target!].replace("_plus", "+")} (${Math.ceil(ds.distance)})`;
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
// ダメージ目安計算
/////////////////////////////////////////////////////////////////////////////////////


class DamageToolData {
    name: string;
    damageRating: number = 0;
    count: number = 0;
    attackPower: number = 0;
    attackMagic: number = 0;
    zangeki: number = 0;
    taigi: number = 0;
    jumon: number = 0;
    typeA: number = 0;
    typeB: number = 0;
    typeC: number = 0;
    typeAZangeki: number = 0;
    typeBZangeki: number = 0;
    typeCZangeki: number = 0;
    typeATaigi: number = 0;
    typeBTaigi: number = 0;
    typeCTaigi: number = 0;
    typeAJumon: number = 0;
    typeBJumon: number = 0;
    typeCJumon: number = 0;
    monsterX: number = 0;
    monsterY: number = 0;
    monsterZ: number = 0;

    constructor(name: string) {
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
    getNonheart: (): DamageToolData => {
        const res = new DamageToolData("");
        const form = document.getElementById("damage_nonheart")!;
        const value = (n: string) => {
            const v = parseInt((form.querySelector(`input[name="${n}"]`) as HTMLInputElement).value);
            return Number.isNaN(v) ? 0 : v;
        };
        const value100 = (n: string) => value(n) / 100;
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
    getHeartsetList: (): DamageToolData[] => {
        const res: DamageToolData[] = [];
        const heartsetList = document.getElementById("damage_heartset_list")!.querySelectorAll(".damage_heartset");
        for (const heartset of heartsetList) {
            const elem = (n: string) => heartset.querySelector(`input[name="${n}"]`) as HTMLInputElement;
            if (!elem("damage_heart_use").checked) {
                continue;
            }
            const value = (n: string) => {
                const v = parseInt(elem(n).value);
                return Number.isNaN(v) ? 0 : v;
            };
            const value100 = (n: string) => value(n) / 100;
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
    getSkillSetList: (): DamageToolData[] => {
        const res: DamageToolData[] = [];
        const skillList = document.getElementById("damage_skill_list")!.querySelectorAll(".damage_skill");
        for (const skill of skillList) {
            const elem = (n: string) => skill.querySelector(`input[name="${n}"]`) as HTMLInputElement;
            if (!elem("damage_skill_use").checked) {
                continue;
            }
            const value = (n: string) => {
                const v = parseInt(elem(n).value);
                return Number.isNaN(v) ? 0 : v;
            };
            const selValue = (n: string) => (skill.querySelector(`select[name="${n}"]`) as HTMLSelectElement).value;
            const data = new DamageToolData(elem("damage_skill_name").value);
            const skillAttackBase = selValue("damage_skill_attack_base");
            if (skillAttackBase === "攻撃力") {
                data.attackPower = 1;
            } else if (skillAttackBase === "攻撃魔力") {
                data.attackMagic = 1;
            } else {
                data.attackPower = 1;
                data.attackMagic = 1;
            }
            data.damageRating = value("damage_skill_damage_rating") / 100;
            data.count = value("damage_skill_count");
            const skillForm = selValue("damage_skill_form");
            if (skillForm === "斬撃") {
                data.zangeki = 1;
            } else if (skillForm === "体技") {
                data.taigi = 1;
            } else {
                data.jumon = 1;
            }
            const skillType = selValue("damage_skill_type");
            if (skillType === "属性A") {
                data.typeA = 1;
                data.typeAZangeki = data.zangeki;
                data.typeATaigi = data.taigi;
                data.typeAJumon = data.jumon;
            } else if (skillType === "属性B") {
                data.typeB = 1;
                data.typeBZangeki = data.zangeki;
                data.typeBTaigi = data.taigi;
                data.typeBJumon = data.jumon;
            } else if (skillType === "属性C") {
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
document.getElementById("add_damage_heartset")!.addEventListener("click", () => {
    const template = document.getElementById("damage_heartset_list_item") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const name = fragment.querySelector(`input[name="damage_heart_name"]`) as HTMLInputElement;
    name.value = `こころセット${damageToolUtil.nextHeartsetCount()}`;
    const list = document.getElementById("damage_heartset_list")!;
    list.appendChild(fragment);
    // list.insertBefore(fragment, list.firstChild);
});

// ダメージ計算のスキル追加
document.getElementById("add_damage_skill")!.addEventListener("click", () => {
    const template = document.getElementById("damage_skill_list_item") as HTMLTemplateElement;
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const name = fragment.querySelector(`input[name="damage_skill_name"]`) as HTMLInputElement;
    name.value = `スキル${damageToolUtil.nextSkillCount()}`;
    const list = document.getElementById("damage_skill_list")!;
    list.appendChild(fragment);
    // list.insertBefore(fragment, list.firstChild);
});

// ダメージ計算
document.getElementById("calc_damages")!.addEventListener("click", () => {
    const result = document.getElementById("damage_result")!;
    result.innerHTML = "";

    const nonHeart = damageToolUtil.getNonheart();
    const heartsetList = damageToolUtil.getHeartsetList();
    const skillList = damageToolUtil.getSkillSetList();

    interface M {
        title: string;
        calc: (heartset: DamageToolData) => number;
    }

    const list: M[] = [
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
                    const attack =
                        skill.attackPower * (nonHeart.attackPower + heartset.attackPower) +
                        skill.attackMagic * (nonHeart.attackMagic + heartset.attackMagic);
                    const skillBaseDamage = Math.max(0, Math.floor(attack / 2 - (1 - skill.jumon) * defence / 4));
                    const damage =
                        skillBaseDamage *
                        skill.damageRating *
                        (1 + skill.zangeki * (nonHeart.zangeki + heartset.zangeki)) *
                        (1 + skill.taigi * (nonHeart.taigi + heartset.taigi)) *
                        (1 + skill.jumon * (nonHeart.jumon + heartset.jumon)) *
                        (1 + skill.typeA * (nonHeart.typeA + heartset.typeA) +
                            skill.typeAZangeki * (nonHeart.typeAZangeki + heartset.typeAZangeki) +
                            skill.typeATaigi   * (nonHeart.typeATaigi   + heartset.typeATaigi) +
                            skill.typeAJumon   * (nonHeart.typeAJumon   + heartset.typeAJumon)) *
                        (1 + skill.typeB * (nonHeart.typeB + heartset.typeB) +
                            skill.typeBZangeki * (nonHeart.typeBZangeki + heartset.typeBZangeki) +
                            skill.typeBTaigi   * (nonHeart.typeBTaigi   + heartset.typeBTaigi) +
                            skill.typeBJumon   * (nonHeart.typeBJumon   + heartset.typeBJumon)) *
                        (1 + skill.typeC * (nonHeart.typeC + heartset.typeC) +
                            skill.typeCZangeki * (nonHeart.typeCZangeki + heartset.typeCZangeki) +
                            skill.typeCTaigi   * (nonHeart.typeCTaigi   + heartset.typeCTaigi) +
                            skill.typeCJumon   * (nonHeart.typeCJumon   + heartset.typeCJumon)) *
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
// なんか、こころセット検索 (ReallyNeeded)
/////////////////////////////////////////////////////////////////////////////////////

interface RNForm {
    jobId: string;
    maximumCost: string;
    asLimit: boolean;
    maximumCostParams: string[];
    checks: boolean[];
    params: string[][];
    exprs: string[];
    refChecks: boolean[];
    refExprs: string[];
    algorithm: string;
}

function saveRNForm(): void {
    if (DEBUG) {
        console.log("call saveRNForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    const sel = (id: string) => (document.getElementById(id) as HTMLSelectElement).value;
    const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
    const checked = (id: string) => elem(id).checked;
    const value = (id: string) => elem(id).value;

    const keys = [
        "maximumhp",
        "maximummp",
        "power",
        "defence",
        "attackmagic",
        "recovermagic",
        "speed",
        "dexterity",
        "expr1",
        "expr2",
        "expr3",
        "expr4",
        "expr5",
        "expr6",
        "expr7",
        "expr8"
    ];
    const paramKeys = [
        "goal",
        "lp2",
        "lp1",
        "lpc",
        "hp2",
        "hp1",
        "hpc",
        "bn2",
        "bn1",
        "bnc",
    ];

    const checks: boolean[] = [];
    const params: string[][] = [];
    for (const key of keys) {
        checks.push(checked(`reallyneeded_${key}`));
        const list: string[] = [];
        for (const pKey of paramKeys) {
            list.push(value(`reallyneeded_${key}_${pKey}`));
        }
        params.push(list);
    }
    const exprs: string[] = [];
    for (let i = 1; i <= 8; i++) {
        exprs.push(value(`reallyneeded_expr${i}_expr`));
    }

    const form: RNForm = {
        jobId: sel("reallyneeded_job"),
        maximumCost: value("reallyneeded_heart_maximum_cost"),
        asLimit: checked("reallyneeded_as_limit_heart_cost"),
        maximumCostParams: [
            value("reallyneeded_heart_maximum_cost_hp2"),
            value("reallyneeded_heart_maximum_cost_hp1"),
            value("reallyneeded_heart_maximum_cost_hpc")
        ],
        checks: checks,
        params: params,
        exprs: exprs,
        refChecks: [
            checked("reallyneeded_refexpr"),
            checked("reallyneeded_refexpr2"),
            checked("reallyneeded_refexpr3"),
            checked("reallyneeded_refexpr4"),
            checked("reallyneeded_refexpr5"),
            checked("reallyneeded_refexpr6")
        ],
        refExprs: [
            value("reallyneeded_refexpr_expr"),
            value("reallyneeded_refexpr2_expr"),
            value("reallyneeded_refexpr3_expr"),
            value("reallyneeded_refexpr4_expr"),
            value("reallyneeded_refexpr5_expr"),
            value("reallyneeded_refexpr6_expr")
        ],
        algorithm: sel("reallyneeded_algorithm")
    };

    if (DEBUG) {
        console.log(form);
    }

    try {
        const data = form;
        const json = JSON.stringify(data);
        window.sessionStorage.setItem(STORAGE_KEY_REALLYNEEDED_FORM, json);
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

function loadRNForm(): void {
    if (DEBUG) {
        console.log("call loadRNForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.sessionStorage.getItem(STORAGE_KEY_REALLYNEEDED_FORM);
        if (json !== null) {
            const data: RNForm = JSON.parse(json);
            // フォーマットの確認してないな…必要かどうかはわからんが

            if (DEBUG) {
                console.log(data)
            }

            const sel = (id: string, v: string) => (document.getElementById(id) as HTMLSelectElement).value = v;
            const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
            const checked = (id: string, ch: boolean) => elem(id).checked = ch;
            const value = (id: string, v: string) => elem(id).value = v;

            const keys = [
                "maximumhp",
                "maximummp",
                "power",
                "defence",
                "attackmagic",
                "recovermagic",
                "speed",
                "dexterity",
                "expr1",
                "expr2",
                "expr3",
                "expr4",
                "expr5",
                "expr6",
                "expr7",
                "expr8"
            ];
            const paramKeys = [
                "goal",
                "lp2",
                "lp1",
                "lpc",
                "hp2",
                "hp1",
                "hpc",
                "bn2",
                "bn1",
                "bnc",
            ];

            sel("reallyneeded_job", data.jobId);
            value("reallyneeded_heart_maximum_cost", data.maximumCost);
            checked("reallyneeded_as_limit_heart_cost", data.asLimit);
            value("reallyneeded_heart_maximum_cost_hp2", data.maximumCostParams[0]);
            value("reallyneeded_heart_maximum_cost_hp1", data.maximumCostParams[1]);
            value("reallyneeded_heart_maximum_cost_hpc", data.maximumCostParams[2]);

            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                checked(`reallyneeded_${key}`, data.checks[k]);
                const list = data.params[k];
                for (let p = 0; p < paramKeys.length; p++) {
                    value(`reallyneeded_${key}_${paramKeys[p]}`, list[p]);
                }
            }
            for (let i = 1; i <= 8; i++) {
                value(`reallyneeded_expr${i}_expr`, data.exprs[i - 1]);
            }

            checked("reallyneeded_refexpr", data.refChecks[0]);
            value("reallyneeded_refexpr_expr", data.refExprs[0]);

            for (let i = 2; i <= 6; i++) {
                checked(`reallyneeded_refexpr${i}`, data.refChecks[i - 1]);
                value(`reallyneeded_refexpr${i}_expr`, data.refExprs[i - 1]);
            }

            sel("reallyneeded_algorithm", data.algorithm);

            // こころ枠や適合倍率の設定
            setRNJob();
        }
    } catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}

interface RNCoCo {
    quadratic: number;
    linear: number;
    constant: number;
}

type RNRefSetter = (h: Heart, value: number) => void;

interface RNScorer {
    scorer: Scorer;
    goal: number;
    lowerPenalty: RNCoCo;
    higherPenalty: RNCoCo;
    bonus: RNCoCo;
    refSetter: RNRefSetter;
}

interface RNTarget {
    job: Job;
    setSize: number;
    maximumCost: number;
    asLimitCost: boolean;
    costCoCo: RNCoCo;
    scoreres: RNScorer[];
    useRefExpr: boolean;
    refExpr: Scorer | null;
    useRefExpr2: boolean;
    refExpr2: Scorer | null;
    useRefExpr3: boolean;
    refExpr3: Scorer | null;
    useRefExpr4: boolean;
    refExpr4: Scorer | null;
    useRefExpr5: boolean;
    refExpr5: Scorer | null;
    useRefExpr6: boolean;
    refExpr6: Scorer | null;
}

interface RNHeart {
    monster: Monster;
    heart: Heart;
}

interface RNHeartset {
    hearts: (RNHeart | null)[];
    order: number[];
    penalty: number;
    bonus: number;
    cost: number;
}

const RNBestRefExprScores: number[] = new Array(6).fill(0);
const RNBestRefExprPenalties: number[] = new Array(6).fill(Number.MAX_VALUE);

function updateRNBestRefExpr(i: number, penalty: number, score: number): boolean {
    const isBest = penalty < RNBestRefExprPenalties[i]
        || (penalty === RNBestRefExprPenalties[i] && score > RNBestRefExprScores[i]);
    if (isBest) {
        RNBestRefExprPenalties[i] = penalty;
        RNBestRefExprScores[i] = score;
    }
    return isBest;
}

// ReallyNeededのこころセット表示
function showRNHeartset(target: RNTarget, heartsets: RNHeartset[]): void {
    const res = document.getElementById("reallyneeded_result")!;
    let items = res.querySelectorAll(":scope > div.outline");
    for (let pos = 0; pos < heartsets.length; pos++) {
        const heartset = heartsets[pos];
        if (pos >= items.length) {
            const template = document.getElementById("result_item") as HTMLTemplateElement;
            const fragment = template.content.cloneNode(true) as DocumentFragment;
            if (EXPOSE_MODE) { // 常に真な気がするが
                for (const sec of fragment.querySelectorAll(".secret")) {
                    sec.classList.remove("secret");
                }
            }
            res.appendChild(fragment);
            items = res.querySelectorAll(":scope > div.outline");
        }
        const item = items[pos];
        const elem = (name: string) => item.querySelector(`.result-item-${name}`)!;
        elem("number").textContent = `${pos + 1} / ${heartsets.length}`;
        let plusMaximumCost = 0;
        for (let i = 0; i < target.setSize; i++) {
            const h = heartset.hearts[heartset.order[i]];
            if (h !== null) {
                plusMaximumCost += h.heart.maximumCost;
            }
        }
        const heartsetCost = heartset.cost + (target.asLimitCost ? 0 : plusMaximumCost);
        elem("cost").textContent = `${heartsetCost} / ${target.maximumCost} + ${plusMaximumCost}`;
        const statusValues = new Array(target.scoreres.length).fill(0);
        const status: Heart = {
            maximumHP: 0,
            maximumMP: 0,
            power: 0,
            defence: 0,
            attackMagic: 0,
            recoverMagic: 0,
            speed: 0,
            dexterity: 0,
            rank: Rank.D,
            color: Color.Unset,
            cost: heartset.cost,
            maximumCost: 0,
            effects: ""
        };
        for (let i = 0; i < target.setSize; i++) {
            const h = heartset.hearts[heartset.order[i]];
            if (h === null) {
                elem(`heart${i+1}`).innerHTML = "";
                elem(`effects${i+1}`).textContent = "";
                continue;
            }
            const tmpRank = h.monster.target;
            h.monster.target = h.heart.rank;
            const he = elem(`heart${i+1}`);
            he.innerHTML = "";
            const colorSpan = he.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, h.heart.color);
            he.appendChild(document.createElement("span")).textContent = `${h.heart.cost}`;
            const name = (h.heart.rank === Rank.S_plus && h.monster.splusName !== null)
                       ? h.monster.splusName : h.monster.name;
            he.appendChild(document.createElement("span")).textContent = name;
            he.appendChild(document.createElement("span")).textContent = Rank[h.heart.rank].replace("_plus", "+");
            elem(`effects${i+1}`).textContent = h.heart.effects;
            const c = target.job.colors[i];
            status.maximumHP    += MaximumHPScorer.calc(c, h.monster);
            status.maximumMP    += MaximumMPScorer.calc(c, h.monster);
            status.power        += PowerScorer.calc(c, h.monster);
            status.defence      += DefenceScorer.calc(c, h.monster);
            status.attackMagic  += AttackMagicScorer.calc(c, h.monster);
            status.recoverMagic += RecoverMagicScorer.calc(c, h.monster);
            status.speed        += SpeedScorer.calc(c, h.monster);
            status.dexterity    += DexterityScorer.calc(c, h.monster);
            for (let z = 0; z < statusValues.length; z++) {
                statusValues[z] += target.scoreres[z].scorer.calc(c, h.monster);
            }
            h.monster.target = tmpRank;
        }
        elem("maximumhp").textContent    = `${status.maximumHP}`;
        elem("maximummp").textContent    = `${status.maximumMP}`;
        elem("power").textContent        = `${status.power}`;
        elem("defence").textContent      = `${status.defence}`;
        elem("attackmagic").textContent  = `${status.attackMagic}`;
        elem("recovermagic").textContent = `${status.recoverMagic}`;
        elem("speed").textContent        = `${status.speed}`;
        elem("dexterity").textContent    = `${status.dexterity}`;
        let scoreStr = `penalty: ${heartset.penalty}, bonus: ${heartset.bonus}`;
        const refMonster: Monster = {
            id: 0,
            name: "参考値",
            splusName: null,
            curColor: Color.Unset,
            curCost: status.cost,
            hearts: [status],
            target: status.rank,
            withSplus: false,
            defaultTarget: status.rank,
            defaultWithSplus: false
        };
        for (let z = 0; z < statusValues.length; z++) {
            target.scoreres[z].refSetter(status, statusValues[z]);
        }
        const hasRefExprBest: boolean[] = new Array(6).fill(false);
        if (target.useRefExpr) {
            const refScore = target.refExpr!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値1: ${refScore}`;
            hasRefExprBest[0] = updateRNBestRefExpr(0, heartset.penalty, refScore);
        }
        if (target.useRefExpr2) {
            const refScore2 = target.refExpr2!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値2: ${refScore2}`;
            hasRefExprBest[1] = updateRNBestRefExpr(1, heartset.penalty, refScore2);
        }
        if (target.useRefExpr3) {
            const refScore3 = target.refExpr3!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値3: ${refScore3}`;
            hasRefExprBest[2] = updateRNBestRefExpr(2, heartset.penalty, refScore3);
        }
        if (target.useRefExpr4) {
            const refScore4 = target.refExpr4!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値4: ${refScore4}`;
            hasRefExprBest[3] = updateRNBestRefExpr(3, heartset.penalty, refScore4);
        }
        if (target.useRefExpr5) {
            const refScore5 = target.refExpr5!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値5: ${refScore5}`;
            hasRefExprBest[4] = updateRNBestRefExpr(4, heartset.penalty, refScore5);
        }
        if (target.useRefExpr6) {
            const refScore6 = target.refExpr6!.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値6: ${refScore6}`;
            hasRefExprBest[5] = updateRNBestRefExpr(5, heartset.penalty, refScore6);
        }
        elem("score").textContent = scoreStr;
        if (EXPOSE_MODE) {
            const adoptionHeartSet: AdoptionHeartSet = {
                jobName: target.job.name,
                score: scoreStr,
                maximumCost: target.maximumCost,
                powerUp: target.job.powerUp,
                colors: target.job.colors,
                hearts: new Array(target.job.colors.length).fill(null)
            };
            for (let i = 0; i < target.setSize; i++) {
                const h = heartset.hearts[heartset.order[i]];
                if (h === null) {
                    continue;
                }
                adoptionHeartSet.hearts[i] = {
                    monster: h.monster,
                    heart: h.heart
                };
            }
            const adoptor = () => adoptHeartSet(adoptionHeartSet);
            (elem("adoption") as HTMLButtonElement).onclick = adoptor;
            if (hasRefExprBest[0]) {
                const refexpr1BestElem = document.getElementById("reallyneeded_refexpr_best")!;
                refexpr1BestElem.innerHTML = "";
                ((refexpr1BestElem.appendChild(item.cloneNode(true)) as HTMLElement)
                    .querySelector(".result-item-adoption") as HTMLButtonElement).onclick = adoptor;
            }
            for (let i = 1; i < hasRefExprBest.length; i++) {
                if (hasRefExprBest[i]) {
                    const refexprBestElem = document.getElementById(`reallyneeded_refexpr${i+1}_best`)!;
                    refexprBestElem.innerHTML = "";
                    ((refexprBestElem.appendChild(item.cloneNode(true)) as HTMLElement)
                        .querySelector(".result-item-adoption") as HTMLButtonElement).onclick = adoptor;
                }
            }
        }
    }
}

// ReallyNeededのこころセットのスコア計算
function calcRNHeartsetScore(target: RNTarget, heartset: RNHeartset): void {
    let penalty = 0;
    let bonus = 0;
    let cost = 0;
    for (let i = 0; i < target.setSize; i++) {
        const h = heartset.hearts[i];
        if (h === null) {
            continue;
        }
        cost += h.heart.cost - (target.asLimitCost ? 0 : h.heart.maximumCost);
    }
    if (cost > target.maximumCost) {
        const cdiff = cost - target.maximumCost;
        penalty += target.costCoCo.quadratic * cdiff * cdiff
            + target.costCoCo.linear * cdiff + target.costCoCo.constant;
    }
    for (const rns of target.scoreres) {
        let score = 0;
        for (let i = 0; i < target.setSize; i++) {
            const h = heartset.hearts[heartset.order[i]];
            if (h === null) {
                continue;
            }
            const tmpRank = h.monster.target;
            h.monster.target = h.heart.rank;
            score += rns.scorer.calc(target.job.colors[i], h.monster);
            h.monster.target = tmpRank;
        }
        let tmpPenalty = 0;
        if (score < rns.goal) {
            const ldiff = rns.goal - score;
            tmpPenalty += rns.lowerPenalty.quadratic * ldiff * ldiff
                + rns.lowerPenalty.linear * ldiff + rns.lowerPenalty.constant;
        }
        if (score > rns.goal) {
            const hdiff = score - rns.goal;
            tmpPenalty += rns.higherPenalty.quadratic * hdiff * hdiff
                + rns.higherPenalty.linear * hdiff + rns.higherPenalty.constant;
        }
        penalty += tmpPenalty;
        if (tmpPenalty === 0) {
            const diff = Math.abs(rns.goal - score);
            bonus += rns.bonus.quadratic * diff * diff
                + rns.bonus.linear * diff + rns.bonus.constant;
        }
    }
    heartset.penalty = penalty;
    heartset.bonus = bonus;
    heartset.cost = cost;
}

// ReallyNeededのこころセットを探索する (Simulated Annealing)
// TODO 配列初期化バグを修正した影響で挙動が変わるかも、パラメータ等の見直しが必要かも？
function searchRNHeartsetSA(target: RNTarget): void {
    const perm = permutation(target.setSize);
    const copy = (hs: RNHeartset) => {
        const res: RNHeartset = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState: RNHeartset = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests: RNHeartset[] = [];
    const update = (state: RNHeartset) => {
        let changed = false;
        for (let i = 0; i < bests.length; i++) {
            const b = bests[i];
            if (state.penalty > b.penalty) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus < b.bonus) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus === b.bonus) {
                if (state.cost === b.cost) {
                    const h1 = b.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    const h2 = state.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    if (h1 === h2) {
                        return false;
                    }
                }
                continue;
            }
            bests[i] = state;
            state = b;
            changed = true;
        }
        if (bests.length < 10) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList: RNHeart[] = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart: RNHeart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)!
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart: RNHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const hIndexes = Array.from({length: target.setSize}, () => new Array(heartList.length));
    const hhIndexes = new Array(target.setSize).fill(0);
    for (const indexes of hIndexes) {
        for (let i = 0; i < indexes.length; i++) {
            indexes[i] = i;
        }
        shuffle(indexes);
    }
    const used = new Array(maxID + 1).fill(false);
    let time = 0;
    const RESET = 20;
    const KICK = 40;
    const LIMIT = 60;
    let pos = 0;
    let cycle = 0;
    const CYCLE = target.setSize * heartList.length * 4;
    let bDiffSum = 0;
    let bCount = 0;
    let pDiffSum = 0;
    let pCount = 0;
    const proc = () => {
        if (cycle >= CYCLE) {
            cycle = 0;
            time++;
            if (time >= LIMIT) {
                return "OK";
            } else {
                for (const indexes of hIndexes) {
                    shuffle(indexes);
                }
            }
            if (time === RESET) {
                currentState.hearts.fill(null);
                used.fill(false);
                calcRNHeartsetScore(target, currentState);
            }
            if (time === KICK) {
                // KICK???
                currentState.hearts.fill(null);
                used.fill(false);
                let kickPos = 0;
                for (const hi of hIndexes[0]) {
                    if (hi >= heartList.length) {
                        continue;
                    }
                    const h = heartList[hi];
                    if (used[h.monster.id]) {
                        continue;
                    }
                    currentState.hearts[kickPos] = h;
                    used[h.monster.id] = true;
                    kickPos++;
                    if (kickPos >= target.setSize) {
                        break;
                    }
                }
                calcRNHeartsetScore(target, currentState);
            }
        }
        cycle++;
        pos = (pos + 1) % target.setSize;
        let h: RNHeart | null = null;
        const hhi = hhIndexes[pos];
        if (hhi >= heartList.length) {
            hhIndexes[pos] = 0;
            if (currentState.hearts[pos] === null) {
                return null;
            }
        } else {
            hhIndexes[pos] = hhi + 1;
            const hi = hIndexes[pos][hhi];
            h = heartList[hi];
            if (used[h.monster.id]) {
                return null;
            }
        }
        const tmpState = copy(currentState);
        tmpState.hearts[pos] = h;
        calcRNHeartsetScore(target, tmpState);
        let tmpBetter = copy(tmpState);
        for (const p of perm) {
            tmpState.order = p;
            calcRNHeartsetScore(target, tmpState);
            if (tmpState.penalty < tmpBetter.penalty
                    || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
                tmpBetter = copy(tmpState);
            }
        }
        if (tmpBetter.penalty === 0 && currentState.penalty === 0) {
             if (tmpBetter.bonus < currentState.bonus) {
                const temperature = 0.0001 ** (cycle / CYCLE);
                const diff = (currentState.bonus - tmpBetter.bonus);
                bDiffSum += diff;
                bCount++;
                const bDiffAvg = bDiffSum / bCount;
                const probability = Math.exp(-diff / (bDiffAvg ** 0.5) / temperature);
                if (Math.random() > probability) {
                    return null;
                }
            }
        } else if (tmpBetter.penalty > currentState.penalty) {
            const temperature = 0.0001 ** (cycle / CYCLE);
            const diff = (tmpBetter.penalty - currentState.penalty);
            pDiffSum += diff;
            pCount++;
            const pDiffAvg = pDiffSum / pCount;
            const probability = Math.exp(-diff / (pDiffAvg ** 0.5) / temperature);
            if (Math.random() > probability) {
                return null;
            }
        }
        if (currentState.hearts[pos] !== null) {
            used[currentState.hearts[pos]!.monster.id] = false;
        }
        if (tmpBetter.hearts[pos] !== null) {
            used[tmpBetter.hearts[pos]!.monster.id]  = true;
        }
        currentState = tmpBetter;
        if (currentState.cost <= target.maximumCost) {
            if (update(currentState)) {
                currentState = copy(currentState);
                showRNHeartset(target, bests);
            }
        }
        return null;
    };
    const close = (res: string | null) => {
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
    };
    const task: Task<string> = {
        interval: 1,
        proc: proc,
        close: close
    }
    dialogWait(task, "探索中です･･･");
}

// ReallyNeededのこころセットを探索する (Hill Climbing)
function searchRNHeartsetHC(target: RNTarget): void {
    const perm = permutation(target.setSize);
    const copy = (hs: RNHeartset) => {
        const res: RNHeartset = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState: RNHeartset = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests: RNHeartset[] = [];
    const update = (state: RNHeartset) => {
        let changed = false;
        for (let i = 0; i < bests.length; i++) {
            const b = bests[i];
            if (state.penalty > b.penalty) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus < b.bonus) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus === b.bonus) {
                if (state.cost === b.cost) {
                    const h1 = b.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    const h2 = state.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    if (h1 === h2) {
                        return false;
                    }
                }
                continue;
            }
            bests[i] = state;
            state = b;
            changed = true;
        }
        if (bests.length < 10) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList: RNHeart[] = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart: RNHeart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)!
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart: RNHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const hIndexes = Array.from({length: target.setSize}, () => new Array(heartList.length));
    const hhIndexes = new Array(target.setSize).fill(0);
    for (const indexes of hIndexes) {
        for (let i = 0; i < indexes.length; i++) {
            indexes[i] = i;
        }
        shuffle(indexes);
    }
    const used = new Array(maxID + 1).fill(false);
    let time = 0;
    const LIMIT = 60;
    let pos = 0;
    let cycle = 0;
    const CYCLE = target.setSize * heartList.length;
    let noChange = true;
    let changed = 0;
    const proc = () => {
        if (cycle >= CYCLE) {
            cycle = 0;
            time++;
            if (time >= LIMIT) {
                return "OK";
            } else {
                for (const indexes of hIndexes) {
                    shuffle(indexes);
                }
            }
            if (!noChange) {
                changed++;
                if (changed > 2) {
                    changed = 0;
                    noChange = true;
                }
            }
            if (noChange) {
                currentState.hearts.fill(null);
                used.fill(false);
                if (Math.random() < 0.8) {
                    // KICK???
                    let kickPos = 0;
                    for (const hi of hIndexes[0]) {
                        if (hi >= heartList.length) {
                            continue;
                        }
                        const h = heartList[hi];
                        if (used[h.monster.id]) {
                            continue;
                        }
                        currentState.hearts[kickPos] = h;
                        used[h.monster.id] = true;
                        kickPos++;
                        if (kickPos >= target.setSize) {
                            break;
                        }
                    }
                }
                calcRNHeartsetScore(target, currentState);
            }
            noChange = true;
        }
        cycle++;
        pos = (pos + 1) % target.setSize;
        let h: RNHeart | null = null;
        const hhi = hhIndexes[pos];
        if (hhi >= heartList.length) {
            hhIndexes[pos] = 0;
            if (currentState.hearts[pos] === null) {
                return null;
            }
        } else {
            hhIndexes[pos] = hhi + 1;
            const hi = hIndexes[pos][hhi];
            h = heartList[hi];
            if (used[h.monster.id]) {
                return null;
            }
        }
        const tmpState = copy(currentState);
        tmpState.hearts[pos] = h;
        calcRNHeartsetScore(target, tmpState);
        let tmpBetter = copy(tmpState);
        for (const p of perm) {
            tmpState.order = p;
            calcRNHeartsetScore(target, tmpState);
            if (tmpState.penalty < tmpBetter.penalty
                    || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
                tmpBetter = copy(tmpState);
            }
        }
        if (tmpBetter.penalty === 0 && currentState.penalty === 0) {
             if (tmpBetter.bonus < currentState.bonus) {
                return null;
            }
        } else if (tmpBetter.penalty > currentState.penalty) {
            return null;
        }
        noChange = false;
        if (currentState.hearts[pos] !== null) {
            used[currentState.hearts[pos]!.monster.id] = false;
        }
        if (tmpBetter.hearts[pos] !== null) {
            used[tmpBetter.hearts[pos]!.monster.id]  = true;
        }
        currentState = tmpBetter;
        if (currentState.cost <= target.maximumCost) {
            if (update(currentState)) {
                currentState = copy(currentState);
                showRNHeartset(target, bests);
            }
        }
        return null;
    };
    const close = (res: string | null) => {
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
    };
    const task: Task<string> = {
        interval: 1,
        proc: proc,
        close: close
    }
    dialogWait(task, "探索中です･･･");
}

// ReallyNeededのこころセットを探索する (Hill Climbing with Greedy)
function searchRNHeartsetHCG(target: RNTarget): void {
    const perm = permutation(target.setSize);
    const copy = (hs: RNHeartset) => {
        const res: RNHeartset = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState: RNHeartset = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests: RNHeartset[] = [];
    const update = (state: RNHeartset) => {
        let changed = false;
        for (let i = 0; i < bests.length; i++) {
            const b = bests[i];
            if (state.penalty > b.penalty) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus < b.bonus) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus === b.bonus) {
                if (state.cost === b.cost) {
                    const h1 = b.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    const h2 = state.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    if (h1 === h2) {
                        return false;
                    }
                }
                continue;
            }
            bests[i] = state;
            state = b;
            changed = true;
        }
        if (bests.length < 10) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList: RNHeart[] = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart: RNHeart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)!
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart: RNHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    shuffle(heartList);
    const used = new Array(maxID + 1).fill(false);
    let time = 0;
    const LIMIT = 30;
    let hIndex = 0;
    let noChange = 0;
    const proc = () => {
        if (noChange >= heartList.length) {
            time++;
            if (time >= LIMIT) {
                return "OK";
            }
            noChange = 0;
            for (let pos = 0; pos < target.setSize; pos++) {
                if (pos < heartList.length) {
                    currentState.hearts[pos] = heartList[pos];
                } else {
                    currentState.hearts[pos] = null;
                }
            }
            calcRNHeartsetScore(target, currentState);
            used.fill(false);
            for (let pos = 0; pos < target.setSize; pos++) {
                const h = currentState.hearts[pos];
                if (h !== null) {
                    used[h.monster.id] = true;
                }
            }
            shuffle(heartList);
        }
        const heart = heartList[hIndex];
        hIndex = (hIndex + 1) % heartList.length;
        if (hIndex === 0) {
            shuffle(heartList);
        }
        if (used[heart.monster.id]) {
            const tmpState = copy(currentState);
            for (let i = 0; i < target.setSize; i++) {
                const h = tmpState.hearts[i];
                if (h === null || h.monster.id !== heart.monster.id) {
                    continue;
                }
                tmpState.hearts[i] = null;
                calcRNHeartsetScore(target, tmpState);
                let tmpBetter = copy(tmpState);
                for (const p of perm) {
                    tmpState.order = p;
                    calcRNHeartsetScore(target, tmpState);
                    if (tmpState.penalty < tmpBetter.penalty
                            || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus  > tmpBetter.bonus)) {
                        tmpBetter = copy(tmpState);
                    }
                }
                if (tmpBetter.penalty < currentState.penalty
                        || (tmpBetter.penalty === currentState.penalty && tmpBetter.bonus > currentState.bonus)) {
                    noChange = 0;
                    used[heart.monster.id] = false;
                    currentState = tmpBetter;
                    if (currentState.cost <= target.maximumCost) {
                        if (update(currentState)) {
                            currentState = copy(currentState);
                            showRNHeartset(target, bests);
                        }
                    }
                } else {
                    noChange++;
                }
                return null;
            }
            throw "BUG in HC (used)";
        }
        let tmpBest: RNHeartset | null = null;
        let bestPos = 0;
        for (let pos = 0; pos < target.setSize; pos++) {
            const tmpState = copy(currentState);
            tmpState.hearts[pos] = heart;
            calcRNHeartsetScore(target, tmpState);
            let tmpBetter = copy(tmpState);
            for (const p of perm) {
                tmpState.order = p;
                calcRNHeartsetScore(target, tmpState);
                if (tmpState.penalty < tmpBetter.penalty
                        || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus  > tmpBetter.bonus)) {
                    tmpBetter = copy(tmpState);
                }
            }
            if (tmpBest == null
                    || (tmpBetter.penalty < tmpBest.penalty
                        || (tmpBetter.penalty === tmpBest.penalty && tmpBetter.bonus > tmpBest.bonus))) {
                tmpBest = tmpBetter;
                bestPos = pos;
            }
        }
        if (tmpBest === null) {
            throw "BUG in HC (unuse)";
        }
        if (tmpBest.penalty < currentState.penalty
                || (tmpBest.penalty === currentState.penalty && tmpBest.bonus > currentState.bonus)) {
            noChange = 0;
            const oldHeart = currentState.hearts[bestPos];
            if (oldHeart !== null) {
                used[oldHeart.monster.id] = false;
            }
            used[heart.monster.id] = true;
            currentState = tmpBest;
            if (currentState.cost <= target.maximumCost) {
                if (update(currentState)) {
                    currentState = copy(currentState)
                    showRNHeartset(target, bests);
                }
            }
        } else {
            noChange++;
        }
        return null;
    };
    const close = (res: string | null) => {
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
    };
    const task: Task<string> = {
        interval: 1,
        proc: proc,
        close: close
    }
    dialogWait(task, "探索中です･･･");
}

// ReallyNeededのこころセットを探索する (Greedy)
function searchRNHeartsetGr(target: RNTarget): void {
    const perm = permutation(target.setSize);
    const copy = (hs: RNHeartset) => {
        const res: RNHeartset = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState: RNHeartset = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests: RNHeartset[] = [];
    const update = (state: RNHeartset) => {
        let changed = false;
        for (let i = 0; i < bests.length; i++) {
            const b = bests[i];
            if (state.penalty > b.penalty) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus < b.bonus) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus === b.bonus) {
                if (state.cost === b.cost) {
                    const h1 = b.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    const h2 = state.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    if (h1 === h2) {
                        return false;
                    }
                }
                continue;
            }
            bests[i] = state;
            state = b;
            changed = true;
        }
        if (bests.length < 10) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList: RNHeart[] = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart: RNHeart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)!
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart: RNHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    shuffle(heartList);
    const used = new Array(maxID + 1).fill(false);
    let time = 0;
    const LIMIT = 20;
    let hIndex = 0;
    let tmpBest = copy(currentState);
    let bestPos = -1;
    const proc = () => {
        if (hIndex >= heartList.length) {
            for (let pos = 0; pos < target.setSize; pos++) {
                const tmpState = copy(currentState);
                tmpState.hearts[pos] = null;
                calcRNHeartsetScore(target, tmpState);
                let tmpBetter = copy(tmpState);
                for (const p of perm) {
                    tmpState.order = p;
                    calcRNHeartsetScore(target, tmpState);
                    if (tmpState.penalty < tmpBetter.penalty
                            || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
                        tmpBetter = copy(tmpState);
                    }
                }
                if (tmpBetter.penalty < tmpBest.penalty
                        || (tmpBetter.penalty === tmpBest.penalty && tmpBetter.bonus > tmpBest.bonus)) {
                    tmpBest = tmpBetter;
                    bestPos = pos;
                }
            }
            if (bestPos < 0) {
                time++;
                if (time >= LIMIT) {
                    return "OK";
                }
                for (let pos = 0; pos < target.setSize; pos++) {
                    if (pos < heartList.length) {
                        currentState.hearts[pos] = heartList[pos];
                    } else {
                        currentState.hearts[pos] = null;
                    }
                }
                calcRNHeartsetScore(target, currentState);
                used.fill(false);
                for (let pos = 0; pos < target.setSize; pos++) {
                    const heart = currentState.hearts[pos];
                    if (heart !== null) {
                        used[heart.monster.id] = true;
                    }
                }
                tmpBest = copy(currentState);
            } else {
                const oldHeart = currentState.hearts[bestPos];
                if (oldHeart !== null) {
                    used[oldHeart.monster.id] = false;
                }
                const newHeart = tmpBest.hearts[bestPos];
                if (newHeart !== null) {
                    used[newHeart.monster.id] = true;
                }
                currentState = copy(tmpBest);
                bestPos = -1;
                if (currentState.cost < target.maximumCost) {
                    if (update(currentState)) {
                        currentState = copy(currentState);
                        showRNHeartset(target, bests);
                    }
                }
            }
            shuffle(heartList);
            hIndex = 0;
        }
        const heart = heartList[hIndex];
        hIndex++;
        if (used[heart.monster.id]) {
            return null;
        }
        for (let pos = 0; pos < target.setSize; pos++) {
            const tmpState = copy(currentState);
            tmpState.hearts[pos] = heart;
            calcRNHeartsetScore(target, tmpState);
            let tmpBetter = copy(tmpState);
            for (const p of perm) {
                tmpState.order = p;
                calcRNHeartsetScore(target, tmpState);
                if (tmpState.penalty < tmpBetter.penalty
                        || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
                    tmpBetter = copy(tmpState);
                }
            }
            if (tmpBetter.penalty < tmpBest.penalty
                    || (tmpBetter.penalty === tmpBest.penalty && tmpBetter.bonus > tmpBest.bonus)) {
                tmpBest = tmpBetter;
                bestPos = pos;
            }
        }
        return null;
    };
    const close = (res: string | null) => {
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
    };
    const task: Task<string> = {
        interval: 1,
        proc: proc,
        close: close
    }
    dialogWait(task, "探索中です･･･");
}

// ReallyNeededのこころセットを探索する (Brute Force)
function searchRNHeartsetBF(target: RNTarget): void {
    const perm = permutation(target.setSize);
    const copy = (hs: RNHeartset) => {
        const res: RNHeartset = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState: RNHeartset = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests: RNHeartset[] = [];
    const update = (state: RNHeartset) => {
        let changed = false;
        if (bests.length > 0) {
            if (state.penalty > bests[bests.length-1].penalty) {
                return false;
            }
        }
        for (let i = 0; i < bests.length; i++) {
            const b = bests[i];
            if (state.penalty > b.penalty) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus < b.bonus) {
                continue;
            }
            if (state.penalty === b.penalty && state.bonus === b.bonus) {
                if (state.cost === b.cost) {
                    const h1 = b.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    const h2 = state.hearts
                        .map(h => h === null ? "*" : `${h.monster.id} ${h.heart.rank}`)
                        .sort()
                        .join(",");
                    if (h1 === h2) {
                        return false;
                    }
                }
                continue;
            }
            bests[i] = state;
            state = b;
            changed = true;
        }
        if (bests.length < 10) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList: RNHeart[] = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart: RNHeart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)!
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart: RNHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const used = new Array(maxID + 1).fill(false);
    const pairs: RNHeart[][] = [];
    let phase = 0;
    const phase0 = () => {
        for (let i = 0; i < heartList.length; i++) {
            const hi = heartList[i];
            for (let k = i + 1; k < heartList.length; k++) {
                const hk = heartList[k];
                if (hi.monster.id === hk.monster.id) {
                    continue;
                }
                pairs.push([hi, hk]);
            }
        }
        return true;
    };
    const phase1 = () => {
        if (target.setSize < 1) {
            return true;
        }
        let updated = false;
        for (const h of heartList) {
            currentState.hearts[0] = h;
            calcRNHeartsetScore(target, currentState);
            if (currentState.cost > target.maximumCost) {
                continue;
            }
            let tmpBetter = copy(currentState);
            for (const p of perm) {
                currentState.order = p;
                calcRNHeartsetScore(target, currentState);
                if (currentState.penalty < tmpBetter.penalty
                        || (currentState.penalty === tmpBetter.penalty
                                && currentState.bonus > tmpBetter.bonus)) {
                    tmpBetter = copy(currentState);
                }
            }
            if (update(tmpBetter)) {
                updated = true;
            }
        }
        if (updated) {
            showRNHeartset(target, bests);
        }
        return true;
    };
    const phase2 = () => {
        if (target.setSize < 2) {
            return true;
        }
        let updated = false;
        for (const hp of pairs) {
            currentState.hearts[0] = hp[0];
            currentState.hearts[1] = hp[1];
            calcRNHeartsetScore(target, currentState);
            if (currentState.cost > target.maximumCost) {
                continue;
            }
            let tmpBetter = copy(currentState);
            for (const p of perm) {
                currentState.order = p;
                calcRNHeartsetScore(target, currentState);
                if (currentState.penalty < tmpBetter.penalty
                        || (currentState.penalty === tmpBetter.penalty
                                && currentState.bonus > tmpBetter.bonus)) {
                    tmpBetter = copy(currentState);
                }
            }
            if (update(tmpBetter)) {
                updated = true;
            }
        }
        if (updated) {
            showRNHeartset(target, bests);
        }
        return true;
    };
    let hIndex = 0;
    const phase3 = () => {
        if (target.setSize < 3) {
            return true;
        }
        if (hIndex >= heartList.length) {
            return true;
        }
        const h = heartList[hIndex];
        hIndex++;
        let updated = false;
        currentState.hearts[2] = h;
        for (const hp of pairs) {
            if (hp[0].monster.id === h.monster.id
                    || hp[1].monster.id === h.monster.id) {
                continue;
            }
            currentState.hearts[0] = hp[0];
            currentState.hearts[1] = hp[1];
            calcRNHeartsetScore(target, currentState);
            if (currentState.cost > target.maximumCost) {
                continue;
            }
            let tmpBetter = copy(currentState);
            for (const p of perm) {
                currentState.order = p;
                calcRNHeartsetScore(target, currentState);
                if (currentState.penalty < tmpBetter.penalty
                        || (currentState.penalty === tmpBetter.penalty
                                && currentState.bonus > tmpBetter.bonus)) {
                    tmpBetter = copy(currentState);
                }
            }
            if (update(tmpBetter)) {
                updated = true;
            }
        }
        if (updated) {
            showRNHeartset(target, bests);
        }
        return false;
    }
    let hpIndex = 0;
    const phase4 = () => {
        if (target.setSize < 4) {
            return true;
        }
        if (hpIndex >= pairs.length) {
            return true;
        }
        const hx = pairs[hpIndex];
        hpIndex++;
        let updated = false;
        currentState.hearts[2] = hx[0];
        currentState.hearts[3] = hx[1];
        used[hx[0].monster.id] = true;
        used[hx[1].monster.id] = true;
        for (const hp of pairs) {
            if (used[hp[0].monster.id] || used[hp[1].monster.id]) {
                continue;
            }
            currentState.hearts[0] = hp[0];
            currentState.hearts[1] = hp[1];
            calcRNHeartsetScore(target, currentState);
            if (currentState.cost > target.maximumCost) {
                continue;
            }
            let tmpBetter = copy(currentState);
            for (const p of perm) {
                currentState.order = p;
                calcRNHeartsetScore(target, currentState);
                if (currentState.penalty < tmpBetter.penalty
                        || (currentState.penalty === tmpBetter.penalty
                                && currentState.bonus > tmpBetter.bonus)) {
                    tmpBetter = copy(currentState);
                }
            }
            if (update(tmpBetter)) {
                updated = true;
            }
        }
        used[hx[0].monster.id] = false;
        used[hx[1].monster.id] = false;
        if (updated) {
            showRNHeartset(target, bests);
        }
        return false;
    }
    const proc = () => {
        switch (phase) {
        case 0:
            if (phase0()) {
                phase++;
            }
            break;
        case 1:
            if (phase1()) {
                phase++;
            }
            break;
        case 2:
            if (phase2()) {
                phase++;
            }
            break;
        case 3:
            if (phase3()) {
                phase++;
            }
            break;
        case 4:
            if (phase4()) {
                phase++;
            }
            break;
        default:
            return "OK";
        }
        return null;
    };
    const close = (res: string | null) => {
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
    };
    const task: Task<string> = {
        interval: 1,
        proc: proc,
        close: close
    }
    dialogWait(task, "探索中です･･･");
}

function setRNJob(): void {
    const sel = document.getElementById("reallyneeded_job") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        const maximumCostList = document.getElementById("reallyneeded_job_preset_maximum_cost_list")!;
        maximumCostList.innerHTML = "";
        for (const x of JobPresetMaximumCost) {
            if (job.id < x.id || x.id + 100 <= job.id) {
                continue;
            }
            for (const item of x.maximumCostList) {
                const op = maximumCostList.appendChild(document.createElement("option"));
                op.value = `${item.maximumCost}`;
                op.textContent = ` Lv ${item.level}`;
            }
        }
        const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
        for (let i = 0; i < 4; i++) {
            const e = document.getElementById(`reallyneeded_heart${i+1}`)!;
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c)!;
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            if (!foundColor) {
                e.textContent = "－";
            }
        }
        document.getElementById("reallyneeded_power_up")!.textContent = `${job.powerUp}`;
        return;
    }
    dialogAlert(`Unknown ID: ${value}`);
}

// ReallyNeededのこころセット探索フォームにて
// 職業ごとのこころ枠の組み合わせをフォームに設定する
document.getElementById("reallyneeded_job")!.addEventListener("change", () => {
    setRNJob();
});

let currentReallyneededJobPresetMaximumCostId = 0;

// ReallyNeededのこころセット探索フォームにて
// 初期値の職業のこころ枠の組み合わせをフォームに設定する
(function () {
    const sel = document.getElementById("reallyneeded_job") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        if (job.id < currentReallyneededJobPresetMaximumCostId || currentReallyneededJobPresetMaximumCostId + 100 <= job.id) {
            const maximumCostList = document.getElementById("reallyneeded_job_preset_maximum_cost_list")!;
            maximumCostList.innerHTML = "";
            for (const x of JobPresetMaximumCost) {
                if (job.id < x.id || x.id + 100 <= job.id) {
                    continue;
                }
                currentReallyneededJobPresetMaximumCostId = x.id;
                for (const item of x.maximumCostList) {
                    const op = maximumCostList.appendChild(document.createElement("option"));
                    op.value = `${item.maximumCost}`;
                    op.textContent = ` Lv ${item.level}`;
                }
                break;
            }
        }
        const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
        for (let i = 0; i < 4; i++) {
            const e = document.getElementById(`reallyneeded_heart${i+1}`)!;
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c)!;
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            if (!foundColor) {
                e.textContent = "－";
            }
        }
        document.getElementById("reallyneeded_power_up")!.textContent = `${job.powerUp}`;
        return;
    }
})();

// ReallyNeededのこころセット探索開始ボタン
document.getElementById("reallyneeded_start")!.addEventListener("click", () => {
    saveRNForm();

    const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
    const num = (id: string) => {
        const x = parseInt(elem(id).value ?? "0");
        return isNaN(x) ? 0 : x;
    };

    const jobId = num("reallyneeded_job");
    const job = JobPreset.find(x => x.id === jobId)!;
    // Color.Omitは末尾にのみ存在することが前提
    const setSize = job.colors.reduce((acc, c) => c !== Color.Omit ? acc + 1 : acc, 0);

    const maximumCost = num("reallyneeded_heart_maximum_cost");
    const asLimitCost = elem("reallyneeded_as_limit_heart_cost").checked;

    const costCoCo: RNCoCo = {
        quadratic: num("reallyneeded_heart_maximum_cost_hp2"),
        linear: num("reallyneeded_heart_maximum_cost_hp1"),
        constant: num("reallyneeded_heart_maximum_cost_hpc")
    };

    const useRefExpr = elem("reallyneeded_refexpr").checked;
    let refExpr: Scorer | null = null;
    if (useRefExpr) {
        const refExprSrc = elem("reallyneeded_refexpr_expr").value ?? "";
        try {
            refExpr = parseExpression(refExprSrc);
        } catch (ex) {
            dialogAlert(`参考値1の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const useRefExpr2 = elem("reallyneeded_refexpr2").checked;
    let refExpr2: Scorer | null = null;
    if (useRefExpr2) {
        const refExpr2Src = elem("reallyneeded_refexpr2_expr").value ?? "";
        try {
            refExpr2 = parseExpression(refExpr2Src);
        } catch (ex) {
            dialogAlert(`参考値2の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const useRefExpr3 = elem("reallyneeded_refexpr3").checked;
    let refExpr3: Scorer | null = null;
    if (useRefExpr3) {
        const refExpr3Src = elem("reallyneeded_refexpr3_expr").value ?? "";
        try {
            refExpr3 = parseExpression(refExpr3Src);
        } catch (ex) {
            dialogAlert(`参考値3の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const useRefExpr4 = elem("reallyneeded_refexpr4").checked;
    let refExpr4: Scorer | null = null;
    if (useRefExpr4) {
        const refExpr4Src = elem("reallyneeded_refexpr4_expr").value ?? "";
        try {
            refExpr4 = parseExpression(refExpr4Src);
        } catch (ex) {
            dialogAlert(`参考値4の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const useRefExpr5 = elem("reallyneeded_refexpr5").checked;
    let refExpr5: Scorer | null = null;
    if (useRefExpr5) {
        const refExpr5Src = elem("reallyneeded_refexpr5_expr").value ?? "";
        try {
            refExpr5 = parseExpression(refExpr5Src);
        } catch (ex) {
            dialogAlert(`参考値5の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const useRefExpr6 = elem("reallyneeded_refexpr6").checked;
    let refExpr6: Scorer | null = null;
    if (useRefExpr6) {
        const refExpr6Src = elem("reallyneeded_refexpr6_expr").value ?? "";
        try {
            refExpr6 = parseExpression(refExpr6Src);
        } catch (ex) {
            dialogAlert(`参考値6の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }

    const target: RNTarget = {
        job: job,
        setSize: setSize,
        maximumCost: maximumCost,
        asLimitCost: asLimitCost,
        costCoCo: costCoCo,
        scoreres: [],
        useRefExpr: useRefExpr,
        refExpr: refExpr,
        useRefExpr2: useRefExpr2,
        refExpr2: refExpr2,
        useRefExpr3: useRefExpr3,
        refExpr3: refExpr3,
        useRefExpr4: useRefExpr4,
        refExpr4: refExpr4,
        useRefExpr5: useRefExpr5,
        refExpr5: refExpr5,
        useRefExpr6: useRefExpr6,
        refExpr6: refExpr6
    };

    const targetList: {
            name: string;
            scorer: Scorer | null;
            refName: string;
            refSetter: RNRefSetter;
        }[] = [
        {name: "maximumhp",    scorer: MaximumHPScorer,    refName: "HP",  refSetter: (h, v) => h.maximumHP = v },
        {name: "maximummp",    scorer: MaximumMPScorer,    refName: "MP",  refSetter: (h, v) => h.maximumMP = v },
        {name: "power",        scorer: PowerScorer,        refName: "PWR", refSetter: (h, v) => h.power = v },
        {name: "defence",      scorer: DefenceScorer,      refName: "DEF", refSetter: (h, v) => h.defence = v },
        {name: "attackmagic",  scorer: AttackMagicScorer,  refName: "AMG", refSetter: (h, v) => h.attackMagic = v },
        {name: "recovermagic", scorer: RecoverMagicScorer, refName: "RMG", refSetter: (h, v) => h.recoverMagic = v },
        {name: "speed",        scorer: SpeedScorer,        refName: "SPD", refSetter: (h, v) => h.speed = v },
        {name: "dexterity",    scorer: DexterityScorer,    refName: "DEX", refSetter: (h, v) => h.dexterity = v },
        {name: "expr1",        scorer: null,              refName: "式A", refSetter: (h, v) => h.effects += ` 式A${v} ` },
        {name: "expr2",        scorer: null,              refName: "式B", refSetter: (h, v) => h.effects += ` 式B${v} ` },
        {name: "expr3",        scorer: null,              refName: "式C", refSetter: (h, v) => h.effects += ` 式C${v} ` },
        {name: "expr4",        scorer: null,              refName: "式D", refSetter: (h, v) => h.effects += ` 式D${v} ` },
        {name: "expr5",        scorer: null,              refName: "式E", refSetter: (h, v) => h.effects += ` 式E${v} ` },
        {name: "expr6",        scorer: null,              refName: "式F", refSetter: (h, v) => h.effects += ` 式F${v} ` },
        {name: "expr7",        scorer: null,              refName: "式G", refSetter: (h, v) => h.effects += ` 式G${v} ` },
        {name: "expr8",        scorer: null,              refName: "式H", refSetter: (h, v) => h.effects += ` 式H${v} ` }
    ];

    for (const spec of targetList) {
        if (!elem(`reallyneeded_${spec.name}`).checked) {
            continue;
        }
        let scorer = spec.scorer;
        if (scorer === null) {
            const expr = elem(`reallyneeded_${spec.name}_expr`).value ?? "";
            if (expr.trim() === "") {
                dialogAlert(`${spec.name}でエラー: 式がありません`);
                return;
            }
            try {
                scorer = parseExpression(expr);
            } catch (ex) {
                dialogAlert(`${spec.refName}でエラー: ${ex.getMessage()}`);
                return;
            }
        }
        target.scoreres.push({
            scorer: scorer,
            goal: num(`reallyneeded_${spec.name}_goal`),
            lowerPenalty: {
                quadratic: num(`reallyneeded_${spec.name}_lp2`),
                linear: num(`reallyneeded_${spec.name}_lp1`),
                constant: num(`reallyneeded_${spec.name}_lpc`)
            },
            higherPenalty: {
                quadratic: num(`reallyneeded_${spec.name}_hp2`),
                linear: num(`reallyneeded_${spec.name}_hp1`),
                constant: num(`reallyneeded_${spec.name}_hpc`)
            },
            bonus: {
                quadratic: num(`reallyneeded_${spec.name}_bn2`),
                linear: num(`reallyneeded_${spec.name}_bn1`),
                constant: num(`reallyneeded_${spec.name}_bnc`)
            },
            refSetter: spec.refSetter
        });
    }

    if (target.scoreres.length === 0) {
        dialogAlert("エラー: 対象が選択されてません");
        return;
    }

    const algorithm = elem("reallyneeded_algorithm").value;

    document.getElementById("reallyneeded_result")!.innerHTML = "";

    RNBestRefExprScores.fill(0);
    RNBestRefExprPenalties.fill(Number.MAX_VALUE);
    document.getElementById("reallyneeded_refexpr_best")!.innerHTML = "";
    document.getElementById("reallyneeded_refexpr2_best")!.innerHTML = "";
    document.getElementById("reallyneeded_refexpr3_best")!.innerHTML = "";
    document.getElementById("reallyneeded_refexpr4_best")!.innerHTML = "";
    document.getElementById("reallyneeded_refexpr5_best")!.innerHTML = "";
    document.getElementById("reallyneeded_refexpr6_best")!.innerHTML = "";

    const oldPowerUp = powerUp;
    powerUp = job.powerUp;
    switch (algorithm) {
        case "bf":
            searchRNHeartsetBF(target);
            break;
        case "gr":
            searchRNHeartsetGr(target);
            break;
        case "hc":
            searchRNHeartsetHC(target);
            break;
        case "hcg":
            searchRNHeartsetHCG(target);
            break;
        case "sa":
            searchRNHeartsetSA(target);
            break;
        default:
            dialogAlert(`エラー: algorithmは? ${algorithm}`);
            break;
    }
    powerUp = oldPowerUp;

});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式A）
document.getElementById("reallyneeded_expr1_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr1_from");
    }
    showExprRecordDialog("reallyneeded_expr1_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式B）
document.getElementById("reallyneeded_expr2_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr2_from");
    }
    showExprRecordDialog("reallyneeded_expr2_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式C）
document.getElementById("reallyneeded_expr3_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr3_from");
    }
    showExprRecordDialog("reallyneeded_expr3_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式D）
document.getElementById("reallyneeded_expr4_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr4_from");
    }
    showExprRecordDialog("reallyneeded_expr4_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式E）
document.getElementById("reallyneeded_expr5_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr5_from");
    }
    showExprRecordDialog("reallyneeded_expr5_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式F）
document.getElementById("reallyneeded_expr6_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr6_from");
    }
    showExprRecordDialog("reallyneeded_expr6_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式G）
document.getElementById("reallyneeded_expr7_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr7_from");
    }
    showExprRecordDialog("reallyneeded_expr7_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式H）
document.getElementById("reallyneeded_expr8_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr8_from");
    }
    showExprRecordDialog("reallyneeded_expr8_expr", document.getElementById("reallyneeded_power_up")!.textContent ?? "");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式1）
document.getElementById("reallyneeded_refexpr_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr_from");
    }
    showExprRecordDialog("reallyneeded_refexpr_expr");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式2）
document.getElementById("reallyneeded_refexpr2_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr2_from");
    }
    showExprRecordDialog("reallyneeded_refexpr2_expr");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式3）
document.getElementById("reallyneeded_refexpr3_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr3_from");
    }
    showExprRecordDialog("reallyneeded_refexpr3_expr");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式4）
document.getElementById("reallyneeded_refexpr4_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr4_from");
    }
    showExprRecordDialog("reallyneeded_refexpr4_expr");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式5）
document.getElementById("reallyneeded_refexpr5_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr5_from");
    }
    showExprRecordDialog("reallyneeded_refexpr5_expr");
});

// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式6）
document.getElementById("reallyneeded_refexpr6_from")!
.addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr6_from");
    }
    showExprRecordDialog("reallyneeded_refexpr6_expr");
});

/////////////////////////////////////////////////////////////////////////////////////
// マニュアルこころセット
/////////////////////////////////////////////////////////////////////////////////////

const manualAdoptionHeartSet: AdoptionHeartSet = {
    jobName: "",
    score: "－",
    maximumCost: 0,
    powerUp: 0,
    colors: [],
    hearts: []
};
function showManualHeartset(): void {
    const sel = document.getElementById("manualset_job") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        manualAdoptionHeartSet.jobName = job.name;
        const oldPowerUp = powerUp;
        powerUp = job.powerUp;
        manualAdoptionHeartSet.powerUp = powerUp;
        manualAdoptionHeartSet.colors = job.colors;
        const res = document.getElementById("manualset_result")!;
        const elem = (name: string) => res.querySelector(`.result-item-${name}`)!;
        const text = (name: string, value: any) => elem(name).textContent = `${value}`;
        if (res.children.length === 0) {
            const template = document.getElementById("result_item") as HTMLTemplateElement;
            const fragment = template.content.cloneNode(true) as DocumentFragment;
            if (EXPOSE_MODE) {
                for (const sec of fragment.querySelectorAll(".secret")) {
                    sec.classList.remove("secret");
                }
                fragment.querySelector(".result-item-adoption")!
                    .addEventListener("click", () => adoptHeartSet(manualAdoptionHeartSet));
            }
            res.appendChild(fragment);
            elem("number").parentElement!.hidden = true;
            elem("score").parentElement!.hidden = true;
        }
        const maximumCost = parseInt((document.getElementById("manualset_heart_maximum_cost") as HTMLInputElement).value ?? "0");
        const asLimitCost = (document.getElementById("manualset_as_limit_heart_cost") as HTMLInputElement).checked;
        const status: Status = {
            maximumHP: 0,
            maximumMP: 0,
            power: 0,
            defence: 0,
            attackMagic: 0,
            recoverMagic: 0,
            speed: 0,
            dexterity: 0
        };
        let cost = 0;
        let additionalMaximumCost = 0;
        manualAdoptionHeartSet.hearts = [];
        for (let i = 0; i < 4; i++) {
            const t = document.getElementById(`manualset_heart${i+1}_name`) as HTMLInputElement;
            if (t.disabled) {
                text(`heart${i+1}`, "－");
                text(`effects${i+1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const name = t.value;
            if (!monsterMap.has(name)) {
                text(`heart${i+1}`, "");
                text(`effects${i+1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const monster = monsterMap.get(name)!;
            const he = elem(`heart${i+1}`);
            he.innerHTML = "";
            if (monster.target === null) {
                he.appendChild(document.createElement("span")).textContent = "------";
                he.appendChild(document.createElement("span")).textContent = "--";
                he.appendChild(document.createElement("span")).textContent = monster.name;
                he.appendChild(document.createElement("span")).textContent = "(ランク未指定)";
                text(`effects${i+1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target)!;
            manualAdoptionHeartSet.hearts.push({monster: monster, heart: heart});
            cost += heart.cost;
            additionalMaximumCost += heart.maximumCost;
            const colorSpan = he.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, heart.color);
            he.appendChild(document.createElement("span")).textContent = `${heart.cost}`;
            const monsterName = (heart.rank === Rank.S_plus && monster.splusName !== null)
                       ? monster.splusName : monster.name;
            he.appendChild(document.createElement("span")).textContent = monsterName;
            he.appendChild(document.createElement("span")).textContent = Rank[heart.rank].replace("_plus", "+");
            text(`effects${i+1}`, heart.effects);
            const c = job.colors[i];
            status.maximumHP    += MaximumHPScorer.calc(c, monster);
            status.maximumMP    += MaximumMPScorer.calc(c, monster);
            status.power        += PowerScorer.calc(c, monster);
            status.defence      += DefenceScorer.calc(c, monster);
            status.attackMagic  += AttackMagicScorer.calc(c, monster);
            status.recoverMagic += RecoverMagicScorer.calc(c, monster);
            status.speed        += SpeedScorer.calc(c, monster);
            status.dexterity    += DexterityScorer.calc(c, monster);
        }
        if (isNaN(maximumCost)) {
            text("cost", `${cost} / ??? + ${additionalMaximumCost}`);
            elem("cost").classList.remove("bold");
            manualAdoptionHeartSet.maximumCost = -1;
        } else {
            text("cost", `${cost} / ${maximumCost} + ${additionalMaximumCost}`);
                    elem("cost").classList.remove("bold");
            if (asLimitCost) {
                if (cost > maximumCost) {
                    elem("cost").classList.add("bold");
                }
            } else if (cost > maximumCost + additionalMaximumCost) {
                elem("cost").classList.add("bold");
            }
            manualAdoptionHeartSet.maximumCost = maximumCost;
        }
        text("maximumhp", `${status.maximumHP}`);
        text("maximummp", `${status.maximumMP}`);
        text("power", `${status.power}`);
        text("defence", `${status.defence}`);
        text("attackmagic", `${status.attackMagic}`);
        text("recovermagic", `${status.recoverMagic}`);
        text("speed", `${status.speed}`);
        text("dexterity", `${status.dexterity}`);
        powerUp = oldPowerUp;
        return;
    }
}


// マニュアルこころセットのフォームにて
// こころ枠1のこころが変更された場合の処理
document.getElementById("manualset_heart1_name")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    showManualHeartset();
});


// マニュアルこころセットのフォームにて
// こころ枠2のこころが変更された場合の処理
document.getElementById("manualset_heart2_name")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    showManualHeartset();
});


// マニュアルこころセットのフォームにて
// こころ枠3のこころが変更された場合の処理
document.getElementById("manualset_heart3_name")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    showManualHeartset();
});


// マニュアルこころセットのフォームにて
// こころ枠4のこころが変更された場合の処理
document.getElementById("manualset_heart4_name")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    showManualHeartset();
});


// マニュアルこころセットのフォームにて
// こころ最大コストが変更された場合の処理
document.getElementById("manualset_heart_maximum_cost")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("input", () => {
    showManualHeartset();
});

// マニュアルこころセットのフォームにて
// こころ最大コストの扱いが変更された場合の処理
document.getElementById("manualset_as_limit_heart_cost")!
// .addEventListener("blur", () => {
// .addEventListener("focusout", () => {
.addEventListener("change", () => {
    showManualHeartset();
});

let currentManualsetJobPresetMaximumCostId = 0;

// マニュアルこころセットのフォームにて
// 職業ごとのこころ枠の組み合わせをフォームに設定する
document.getElementById("manualset_job")!.addEventListener("change", () => {
    const sel = document.getElementById("manualset_job") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        if (job.id < currentManualsetJobPresetMaximumCostId || currentManualsetJobPresetMaximumCostId + 100 <= job.id) {
            const maximumCostList = document.getElementById("manualset_job_preset_maximum_cost_list")!;
            maximumCostList.innerHTML = "";
            for (const x of JobPresetMaximumCost) {
                if (job.id < x.id || x.id + 100 <= job.id) {
                    continue;
                }
                currentManualsetJobPresetMaximumCostId = x.id;
                for (const item of x.maximumCostList) {
                    const op = maximumCostList.appendChild(document.createElement("option"));
                    op.value = `${item.maximumCost}`;
                    op.textContent = ` Lv ${item.level}`;
                }
                break;
            }
        }
        const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
        for (let i = 0; i < 4; i++) {
            const e = document.getElementById(`manualset_heart${i+1}`)!;
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c)!;
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            const t = document.getElementById(`manualset_heart${i+1}_name`) as HTMLInputElement;
            if (!foundColor) {
                e.textContent = "－";
                t.disabled = true;
            } else {
                t.disabled = false;
            }
        }
        document.getElementById("manualset_power_up")!.textContent = `${job.powerUp}`;
        showManualHeartset();
        return;
    }
    dialogAlert(`Unknown ID: ${value}`);
});

// マニュアルこころセットのフォームにて
// 初期値の職業のこころ枠の組み合わせをフォームに設定する
(function () {
    const sel = document.getElementById("manualset_job") as HTMLSelectElement;
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        const maximumCostList = document.getElementById("manualset_job_preset_maximum_cost_list")!;
        maximumCostList.innerHTML = "";
        for (const x of JobPresetMaximumCost) {
            if (job.id < x.id || x.id + 100 <= job.id) {
                continue;
            }
            for (const item of x.maximumCostList) {
                const op = maximumCostList.appendChild(document.createElement("option"));
                op.value = `${item.maximumCost}`;
                op.textContent = ` Lv ${item.level}`;
            }
        }
        const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
        for (let i = 0; i < 4; i++) {
            const e = document.getElementById(`manualset_heart${i+1}`)!;
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c)!;
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            const t = document.getElementById(`manualset_heart${i+1}_name`) as HTMLInputElement;
            if (!foundColor) {
                e.textContent = "－";
                t.value = "";
                t.disabled = true;
            } else {
                t.disabled = false;
            }
        }
        document.getElementById("manualset_power_up")!.textContent = `${job.powerUp}`;
        return;
    }
})();



/////////////////////////////////////////////////////////////////////////////////////
//
/////////////////////////////////////////////////////////////////////////////////////

window.addEventListener("pagehide", () => {
    saveHeartSetSearchForm();
    saveRNForm();
});

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
        EXPOSE_MODE = true;
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
        NO_STORAGE = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
        .then(r => r.json())
        .then( json => {
            if (isMonsterList(json)) {
                addAllMonsterList(json);
                updateChangedRankCount();
            }
        })
        .catch(err => {
            dialogAlert(`${err}`);
            console.log(err);
        });
    } else if (params.has("demo")) {
        // デモ用データのリストを使用、ローカルストレージの利用なし
        if (DEBUG) {
            console.log("load demo data");
        }
        NO_STORAGE = true;
        fetch("./dqwalkhearts/dqwalkhearts.json")
        .then(r => r.json())
        .then( json => {
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
    } else if (params.has("nostorage")) {
        // 初期リストなし、ローカルストレージの利用もなし
        if (DEBUG) {
            console.log("no storage mode");
        }
        NO_STORAGE = true;
    } else {
        // ローカルストレージのリストを利用
        loadMonsterList();
        updateChangedRankCount();
        loadExprRecord();
        loadAdoptionHeartSetList();
        loadHeartSetSearchForm();
        loadRNForm();
    }
})();

// デバッグモードであることの確認
if (DEBUG) {
    dialogAlert("[DEBUG] OK");
}
