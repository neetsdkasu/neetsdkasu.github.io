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
const LIMIT_OF_HEARTEST = 300;
let EXPOSE_MODE = false;
const LOCAL_STORAGE_PATH = "dqwalkhearts";
const STORAGE_KEY_MONSTER_LIST = LOCAL_STORAGE_PATH;
const STORAGE_KEY_EXPR_RECORD = LOCAL_STORAGE_PATH + ".expr_rec";
const STORAGE_KEY_ADOPT_HEARTSET = LOCAL_STORAGE_PATH + ".adopt_heartset";
const STORAGE_KEY_HEARTSET_SEARCH = LOCAL_STORAGE_PATH + ".heartset_search";
const STORAGE_KEY_REALLYNEEDED_FORM = LOCAL_STORAGE_PATH + ".reallyneeded_form";
const STORAGE_KEY_DAMAGETOOL2_FORM = LOCAL_STORAGE_PATH + ".damagetool2_form";
const STORAGE_KEY_MANUAL_HEAERTSET_FORM = LOCAL_STORAGE_PATH + ".manual_heartset_form";
function dialogAlert(msg) {
    if (DEBUG) {
        console.log(`dialogAlert: ${msg}`);
    }
    document.getElementById("alert_message").textContent = msg;
    const dialog = document.getElementById("alert_dialog");
    dialog.showModal();
}
function dialogWait(task, msg) {
    if (DEBUG) {
        console.log(`dialogWait: ${msg}`);
    }
    document.getElementById("wait_message").textContent = msg ?? "しばらくお待ちください";
    const dialog = document.getElementById("wait_dialog");
    let handle = 0;
    dialog.onclose = () => {
        clearTimeout(handle);
        if (dialog.returnValue === "cancel") {
            if (task.close !== null) {
                task.close(null); // TODO ここのエラーを捕捉しないとヤバいすね･･･
            }
        }
        dialog.onclose = () => { };
    };
    const proc = () => {
        try {
            const res = task.proc();
            if (res === null) {
                handle = setTimeout(proc, task.interval);
            }
            else {
                if (task.close != null) {
                    task.close(res); // TODO ここのエラーを捕捉しないとヤバいすね･･･
                }
                dialog.returnValue = "";
                dialog.onclose = () => { };
                dialog.close();
            }
        }
        catch (ex) {
            clearTimeout(handle);
            console.log(ex);
            if (task.close !== null) {
                task.close(null); // TODO ここのエラーを捕捉しないとヤバいすね･･･
            }
            dialog.returnValue = "cancel";
            dialog.onclose = () => { };
            dialog.close();
            dialogAlert(`エラー: タスクを中止しました ( ${ex} )`);
        }
    };
    handle = setTimeout(proc, 1);
    dialog.returnValue = "";
    dialog.showModal();
}
function permutation(size) {
    let limit = 10 ** size;
    let flag = 0;
    for (let i = 0; i < size; i++) {
        flag |= 1 << i;
    }
    const res = [];
    const item = new Array(size).fill(0);
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
function popCount(value) {
    value = (value & 0x55555555) + ((value >>> 1) & 0x55555555);
    value = (value & 0x33333333) + ((value >>> 2) & 0x33333333);
    value = (value & 0x0F0F0F0F) + ((value >>> 4) & 0x0F0F0F0F);
    value = (value & 0x00FF00FF) + ((value >>> 8) & 0x00FF00FF);
    return (value & 0x0000FFFF) + ((value >>> 16) & 0x0000FFFF);
}
function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const k = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[k];
        arr[k] = tmp;
    }
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
// リストのマージ（頭悪い実装）
function mergeList(baseList, additionalList, task) {
    let tmpList = baseList.slice();
    let append = [];
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
var Rank;
(function (Rank) {
    Rank[Rank["S_plus"] = 0] = "S_plus";
    Rank[Rank["S"] = 1] = "S";
    Rank[Rank["A"] = 2] = "A";
    Rank[Rank["B"] = 3] = "B";
    Rank[Rank["C"] = 4] = "C";
    Rank[Rank["D"] = 5] = "D";
    Rank[Rank["X"] = 6] = "X";
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
        colors: [Color.Yellow | Color.Red, Color.Rainbow, Color.Red, Color.Yellow] },
    { id: 302, name: "大魔道士", powerUp: 1.3,
        colors: [Color.Yellow | Color.Purple, Color.Rainbow, Color.Yellow | Color.Purple, Color.Purple] },
    { id: 303, name: "大神官", powerUp: 1.3,
        colors: [Color.Blue | Color.Green, Color.Rainbow, Color.Blue | Color.Green, Color.Green] },
    { id: 304, name: "ニンジャ", powerUp: 1.3,
        colors: [Color.Blue | Color.Yellow, Color.Rainbow, Color.Blue | Color.Yellow, Color.Blue] },
    { id: 305, name: "魔剣士", powerUp: 1.3,
        colors: [Color.Red | Color.Purple, Color.Rainbow, Color.Red | Color.Purple, Color.Red | Color.Purple] },
    { id: 306, name: "守護天使", powerUp: 1.3,
        colors: [Color.Yellow | Color.Green, Color.Rainbow, Color.Yellow | Color.Blue, Color.Yellow] }
];
const JobPresetMaximumCost = [
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
            { level: 69, maximumCost: 378 },
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
            { level: 24, maximumCost: 378 },
            { level: 23, maximumCost: 374 },
            { level: 22, maximumCost: 368 },
            { level: 21, maximumCost: 364 },
            { level: 20, maximumCost: 358 },
            { level: 19, maximumCost: 354 },
            { level: 18, maximumCost: 348 },
            { level: 17, maximumCost: 344 },
            { level: 16, maximumCost: 338 },
            { level: 15, maximumCost: 334 },
            { level: 14, maximumCost: 328 },
            { level: 13, maximumCost: 324 },
            { level: 12, maximumCost: 318 },
            { level: 11, maximumCost: 314 },
            { level: 10, maximumCost: 308 },
            { level: 9, maximumCost: 304 },
            { level: 8, maximumCost: 296 },
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
let NO_STORAGE = false; // trueならストレージ無効、falseならストレージ有効
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
    if (NO_STORAGE) {
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
        window.localStorage.setItem(STORAGE_KEY_MONSTER_LIST, json);
        if (DEBUG) {
            console.log("saved to storage");
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
// こころリストをブラウザのストレージから読み込む
function loadMonsterList() {
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
                // 他タブでのランクの変更は無視する
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
        updateChangedRankCount();
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
// Dataインターフェースかを判定する
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
function isValidExprRecordListData(data) {
    try {
        if (!Array.isArray(data)) {
            console.log("ExprRecordList[]じゃないJSONファイル");
            console.log(data);
            return false;
        }
        const list1 = data;
        for (const item1 of list1) {
            if (typeof item1 !== "object" || item1 === null) {
                console.log("object型じゃない");
                console.log(item1);
                return false;
            }
            const obj1 = item1; // ここキャストできる理由わからない
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
            const list2 = obj1["list"];
            for (const item2 of list2) {
                if (typeof item2 !== "object" || item2 === null) {
                    console.log("object型じゃない");
                    console.log(item2);
                    return false;
                }
                const obj2 = item2; // ここキャストできる理由わからない
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
    }
    catch (err) {
        console.log(err);
        return false;
    }
}
let exprRecordLists = [];
// 登録済みの式をセーブする
function saveExprRecord() {
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
// 登録済みの式をロードする
function loadExprRecord() {
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
            const data = JSON.parse(json);
            // isValidExprRecordListData(data) でチェックしたほうがいいかどうかは分からない(データが壊れる可能性あるか知らん)
            exprRecordLists = data;
            updateExprRecordCategoryList();
            const category = document.getElementById("expr_rec_category").value;
            updateSelectExprRecordExprNameList(category);
            const exprName = document.getElementById("expr_rec_expr_name").value;
            document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function getRecoredExpr(category, exprName) {
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
function updateExprRecordCategoryList() {
    const sel = document.getElementById("expr_rec_category");
    const dlist = document.getElementById("expr_rec_category_list");
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
function updateSelectExprRecordExprNameList(category) {
    const sel = document.getElementById("expr_rec_expr_name");
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
function updateDataListExprRecordExprNameList(category) {
    const dlist = document.getElementById("expr_rec_expr_name_list");
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
function deleteExprRecord(category, exprName) {
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
        category = document.getElementById("expr_rec_category").value;
    }
    else {
        exprRecordLists[ci].list = newList;
    }
    updateSelectExprRecordExprNameList(category);
    exprName = document.getElementById("expr_rec_expr_name").value;
    document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
    saveExprRecord();
    return true;
}
// 式を登録する
function addExprRecord(category, exprName, expr) {
    if (DEBUG) {
        console.log("call addExprRecord");
    }
    const ci = exprRecordLists.findIndex(e => e.category === category);
    if (ci < 0) {
        const newList = {
            category: category,
            list: [{ name: exprName, expr: expr }]
        };
        exprRecordLists.push(newList);
        exprRecordLists.sort((a, b) => a.category.localeCompare(b.category));
        updateExprRecordCategoryList();
    }
    else {
        const li = exprRecordLists[ci].list.findIndex(e => e.name === exprName);
        if (li < 0) {
            const er = { name: exprName, expr: expr };
            exprRecordLists[ci].list.push(er);
            exprRecordLists[ci].list.sort((a, b) => a.name.localeCompare(b.name));
        }
        else {
            exprRecordLists[ci].list[li].expr = expr;
        }
    }
    saveExprRecord();
    document.getElementById("expr_rec_category").value = category;
    updateSelectExprRecordExprNameList(category);
    document.getElementById("expr_rec_expr_name").value = exprName;
    updateDataListExprRecordExprNameList(category);
    document.getElementById("expr_rec_expr").value = expr;
}
// ランクの変更箇所を数えて表示する
function updateChangedRankCount() {
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
        if (!monster.hearts.every(h => h.rank >= monster.target)) {
            count++;
        }
    }
    document.getElementById("changed_rank_count").textContent = `${count}`;
    document.getElementById("changed_default_count").textContent = `${defaultCount}`;
}
// こころの色に関する表示部分
function showHeartColor(elem, color) {
    elem.innerHTML = "";
    elem.classList.remove("yellow", "purple", "green", "red", "blue", "rainbow");
    switch (color) {
        case Color.Yellow:
        case Color.Purple:
        case Color.Green:
        case Color.Red:
        case Color.Blue:
            const csi = SingleColorInfoMap.get(color);
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
            }
            else {
                yellow.textContent = "-";
            }
            const purple = elem.appendChild(document.createElement("span"));
            if ((Color.Purple & color) === Color.Purple) {
                purple.classList.add("purple");
                purple.textContent = "P";
            }
            else {
                purple.textContent = "-";
            }
            const green = elem.appendChild(document.createElement("span"));
            if ((Color.Green & color) === Color.Green) {
                green.classList.add("green");
                green.textContent = "G";
            }
            else {
                green.textContent = "-";
            }
            const red = elem.appendChild(document.createElement("span"));
            if ((Color.Red & color) === Color.Red) {
                red.classList.add("red");
                red.textContent = "R";
            }
            else {
                red.textContent = "-";
            }
            const blue = elem.appendChild(document.createElement("span"));
            if ((Color.Blue & color) === Color.Blue) {
                blue.classList.add("blue");
                blue.textContent = "B";
            }
            else {
                blue.textContent = "-";
            }
            elem.appendChild(document.createElement("span")).textContent = "-";
            break;
    }
}
let adoptionHeartSetList = [];
let currentAdoptionHeartSet = null;
function saveAdoptionHeartSetList() {
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function loadAdoptionHeartSetList() {
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
            const data = JSON.parse(json);
            for (const hs of data) {
                // MonsterとHeartのインスタンス参照の設定しなおし
                for (let i = 0; i < hs.hearts.length; i++) {
                    const hm = hs.hearts[i];
                    if (hm === null) {
                        continue;
                    }
                    if (!monsterMap.has(hm.monster.name)) {
                        continue;
                    }
                    hm.monster = monsterMap.get(hm.monster.name);
                    const rank = hm.heart.rank;
                    const hi = hm.monster.hearts.findIndex(h => h.rank === rank);
                    if (hi >= 0) {
                        hm.heart = hm.monster.hearts[hi];
                    }
                    hs.hearts[i] = hm;
                }
                currentAdoptionHeartSet = hs;
                addToAdoptionHeartSetList();
            }
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function removeAdaptionHeartSet(heartset) {
    const index = adoptionHeartSetList.findIndex(hs => hs === heartset);
    if (index < 0) {
        console.log(`not found in adoptionHeartSetList: ${heartset}`);
        console.log("FAILED REMVOE ADOPTION-HEART-SET");
        return;
    }
    const list = document.getElementById("adoption_heartset_list");
    const items = list.querySelectorAll(":scope > .outline");
    try {
        list.removeChild(items[index]);
        const ahsList1 = adoptionHeartSetList.slice(0, index);
        const ahsList2 = adoptionHeartSetList.slice(index + 1);
        adoptionHeartSetList = ahsList1.concat(ahsList2);
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_ADOPTION_LIST, adoptionHeartSetList);
        saveAdoptionHeartSetList();
        dialogAlert("採用リストからこころセットを１つ除去しました");
    }
    catch (err) {
        console.log(err);
        console.log("FAILED REMVOE ADOPTION-HEART-SET");
    }
}
// 採用したこころセットをリストに追加して表示
function addToAdoptionHeartSetList() {
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
            && hs.colors.every((e, i) => e === currentAdoptionHeartSet.colors[i])
            && hs.hearts.every((e, i) => e === currentAdoptionHeartSet.hearts[i]
                || (e !== null
                    && currentAdoptionHeartSet.hearts[i] !== null
                    && e.monster.id === currentAdoptionHeartSet.hearts[i].monster.id
                    && e.heart.rank === currentAdoptionHeartSet.hearts[i].heart.rank))
            && `${hs.powerUp}` === `${currentAdoptionHeartSet.powerUp}`) {
            // ※雑な同一判定すぎるので、こころの並び順が違っても同一のステータスになるケースは、同一として判定されない
            return false;
        }
    }
    // 念のためコピーしとく
    const heartset = {
        jobName: currentAdoptionHeartSet.jobName,
        score: currentAdoptionHeartSet.score,
        maximumCost: currentAdoptionHeartSet.maximumCost,
        powerUp: currentAdoptionHeartSet.powerUp,
        colors: currentAdoptionHeartSet.colors.slice(),
        hearts: currentAdoptionHeartSet.hearts.slice() // 不安だが、たぶんシャローコピーで大丈夫ぽい
    };
    currentAdoptionHeartSet = null;
    adoptionHeartSetList.push(heartset);
    setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_ADOPTION_LIST, adoptionHeartSetList);
    const list = document.getElementById("adoption_heartset_list");
    const template = document.getElementById("result_item");
    const fragment = template.content.cloneNode(true);
    if (EXPOSE_MODE) {
        // 非公開機能を利用
        for (const sec of fragment.querySelectorAll(".secret")) {
            sec.classList.remove("secret");
        }
        const btn = fragment.querySelector(".result-item-adoption");
        btn.textContent = "こころリストのランク変更";
        btn.addEventListener("click", () => adoptHeartSet(heartset));
    }
    const buttons = fragment.querySelector(".buttons");
    const delBtn = buttons.insertBefore(document.createElement("button"), buttons.querySelector(".result-item-adoption"));
    delBtn.type = "button";
    delBtn.textContent = "採用リストから除去";
    delBtn.addEventListener("click", () => removeAdaptionHeartSet(heartset));
    const elem = (name) => fragment.querySelector(`.result-item-${name}`);
    const text = (name, value) => elem(name).textContent = `${value}`;
    text("number", heartset.jobName);
    text("score", heartset.score);
    const oldPowerUp = powerUp;
    powerUp = heartset.powerUp;
    const status = {
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
        const cs = elem(`heart${i + 1}`).parentElement.firstElementChild;
        cs.appendChild(document.createElement("span")).textContent = "[";
        showHeartColor(cs.appendChild(document.createElement("span")), heartset.colors[i]);
        cs.appendChild(document.createElement("span")).textContent = "]:";
        if (heartset.hearts.length <= i) {
            break;
        }
        const mh = heartset.hearts[i];
        if (mh === null) {
            text(`heart${i + 1}`, "－");
            text(`effects${i + 1}`, "");
            continue;
        }
        const he = elem(`heart${i + 1}`);
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
        text(`effects${i + 1}`, mh.heart.effects);
        const c = heartset.colors[i];
        status.maximumHP += MaximumHPScorer.calc(c, mh.monster);
        status.maximumMP += MaximumMPScorer.calc(c, mh.monster);
        status.power += PowerScorer.calc(c, mh.monster);
        status.defence += DefenceScorer.calc(c, mh.monster);
        status.attackMagic += AttackMagicScorer.calc(c, mh.monster);
        status.recoverMagic += RecoverMagicScorer.calc(c, mh.monster);
        status.speed += SpeedScorer.calc(c, mh.monster);
        status.dexterity += DexterityScorer.calc(c, mh.monster);
        mh.monster.target = oldTarget;
        mh.monster.curCost = oldCurCost;
        mh.monster.curColor = oldCurColor;
    }
    powerUp = oldPowerUp;
    if (heartset.maximumCost < 0) {
        text("cost", `${cost} / ??? + ${additionalMaximumCost}`);
    }
    else {
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
function adoptHeartSet(adoptionHeartSet) {
    if (adoptionHeartSet.hearts.every(mah => mah === null)) {
        return;
    }
    currentAdoptionHeartSet = adoptionHeartSet;
    const dialog = document.getElementById("adoption_heartset_dialog");
    const elems = dialog.querySelectorAll(".adoption-monster");
    for (let i = 0; i < elems.length; i++) {
        const elem = elems[i];
        const nameElem = elem.querySelector(".monster-name");
        const rankElems = elem.querySelectorAll(".monster-rank");
        const withSplusElem = elem.querySelector(".monster-with-s_plus");
        const mah = adoptionHeartSet.hearts.at(i) ?? null;
        if (mah === null) {
            nameElem.textContent = "－";
            for (const re of rankElems) {
                re.checked = false;
                re.disabled = true;
            }
            withSplusElem.checked = false;
            withSplusElem.disabled = true;
        }
        else {
            nameElem.textContent = mah.heart.rank === Rank.S_plus ? mah.monster.splusName : mah.monster.name;
            for (const re of rankElems) {
                const value = re.value ?? "omit";
                if (value === "omit") {
                    re.checked = mah.monster.target === null;
                    re.disabled = false;
                }
                else {
                    const rank = Rank[value];
                    re.checked = rank === mah.monster.target;
                    re.disabled = !mah.monster.hearts.some(h => h.rank === rank);
                }
            }
            withSplusElem.checked = mah.monster.withSplus;
            withSplusElem.disabled = !mah.monster.hearts.some(h => h.rank === Rank.S_plus);
        }
    }
    dialog.showModal();
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
    const name = (monster.target === Rank.S_plus && monster.splusName !== null)
        ? monster.splusName : monster.name;
    text(".monster-name", name);
    text(".monster-cost", monster.curCost);
    showHeartColor(fragment.querySelector(".monster-color"), monster.curColor);
    const radios = fragment.querySelectorAll("input.monster-rank");
    const monsterRankRadioName = `monster_${monster.id}_rank`;
    for (const radio of radios) {
        const elm = radio;
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
        }
        else {
            const rank = Rank[elm.value];
            elm.disabled = !monster.hearts.some(h => h.rank === rank);
            // こころのランク切り替え (ランク設定)
            elm.addEventListener("change", () => {
                // type="radio"はONに変更された場合だけchangeイベントが発行される
                monster.target = rank;
                const newCurColor = monster.hearts.find(h => h.rank === rank).color;
                monster.curColor = newCurColor;
                let reorder = false;
                const newCurCost = monster.hearts.find(h => h.rank === rank).cost;
                if (monster.curCost !== newCurCost) {
                    if (DEBUG) {
                        console.log("reorder");
                    }
                    dialogAlert(`コストが ${monster.curCost} から ${newCurCost} に変わりリスト内での位置が変わります`);
                    monster.curCost = newCurCost;
                    monsterList.sort((a, b) => b.curCost - a.curCost);
                    reorder = true;
                }
                saveMonsterList(Trigger.ChooseRank);
                showUpdatedHeart(monster, reorder);
                updateChangedRankCount();
            });
        }
    }
    const withSplusElem = fragment.querySelector(".monster-with-s_plus");
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
    fragment.querySelector("button.monster-add-or-edit").addEventListener("click", () => {
        const dialog = document.getElementById("add_heart_dialog");
        const form = dialog.querySelector("form");
        form.reset();
        document.getElementById("add_monster_name").readOnly = true;
        const elements = form.elements;
        const cbox = (name, checked) => {
            elements.namedItem(name).checked = checked;
        };
        const rad = (name, value) => {
            elements.namedItem(name).value = value;
        };
        const elem = (name, value) => {
            elements.namedItem(name).value = value;
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
    fragment.querySelector("button.monster-change-name").addEventListener("click", () => {
        const dialog = document.getElementById("change_monster_name_dialog");
        const form = dialog.querySelector("form");
        form.reset();
        const elements = form.elements;
        const elem = (name, value) => {
            elements.namedItem(name).value = value;
        };
        elem("old_monster_name", monster.name);
        elem("change_monster_name_monster_id", `${monster.id}`);
        dialog.showModal();
    });
    const withSplus = monster.withSplus
        && monster.hearts.some(h => h.rank === monster.target);
    if (withSplus) {
        fragment.querySelector("input.monster-rank + span").classList.add("monster-rank-with-s_plus");
    }
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
// reorder: こころリストの順番を修正したい場合はtrueにする
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
    const name = (monster.target === Rank.S_plus && monster.splusName !== null)
        ? monster.splusName : monster.name;
    text(".monster-name", name);
    text(".monster-cost", monster.curCost);
    showHeartColor(item.querySelector(".monster-color"), monster.curColor);
    item.querySelector(".monster-with-s_plus")
        .checked = monster.withSplus;
    const radios = item.querySelectorAll("input.monster-rank");
    if (monster.target === null) {
        item.classList.remove("not-best");
        item.classList.add("omit");
        for (const radio of radios) {
            const elm = radio;
            if (elm.value !== "omit") {
                const rank = Rank[elm.value];
                elm.disabled = !monster.hearts.some(h => h.rank === rank);
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
        item.querySelector(".monster-with-s_plus")
            .disabled = true;
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
        item.querySelector(".monster-with-s_plus")
            .disabled = !monster.hearts.some(h => h.rank === Rank.S_plus);
    }
    const withSplus = monster.withSplus
        && monster.hearts.some(h => h.rank === monster.target);
    if (withSplus) {
        item.querySelector("input.monster-rank + span").classList.add("monster-rank-with-s_plus");
    }
    else {
        item.querySelector("input.monster-rank + span").classList.remove("monster-rank-with-s_plus");
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
// 新しいこころを追加する (※データを上書きする)
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
            newCurCost = monster.hearts.find(h => h.rank === monster.target).cost;
        }
        if (monster.curCost === newCurCost) {
            if (!updated) {
                return false;
            }
            showUpdatedHeart(monster, false);
        }
        else {
            monster.curCost = newCurCost;
            monsterList.sort((a, b) => b.curCost - a.curCost);
            showUpdatedHeart(monster, true);
        }
    }
    else {
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
    if (currentJobPresetMaximumCostId <= job.id && job.id < currentJobPresetMaximumCostId + 100) {
        return;
    }
    const maximumCostList = document.getElementById("job_preset_maximum_cost_list");
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
    const monster2 = {
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
            }
            else if (param === "defaultWithSplus") {
                nothingDefault = true;
                obj["defaultWithSplus"] = true;
            }
            else if (param === "splusName") {
                obj["splusName"] = null;
            }
            else if (param === "withSplus") {
                obj["withSplus"] = true;
            }
            else if (param === "curColor" && ("color" in obj)) {
                obj["curColor"] = obj["color"];
                delete obj["color"];
                isOldFormatColor = true;
            }
            else if (param === "curCost" && ("cost" in obj)) {
                obj["curCost"] = obj["cost"];
                delete obj["cost"];
                isOldFormatCost = true;
            }
            else {
                console.log(`パラメータが無い ${param}`);
                console.log(obj);
                return false;
            }
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
    if ((m.curColor ^ (m.curColor & Color.Rainbow)) !== Color.Unset) {
        console.log("Colorに指定できない値が設定されている");
        console.log(obj);
        return false;
    }
    if (m.target !== null && m.target in Rank === false) {
        console.log("Rankに存在しない値が設定されている");
        console.log(obj);
        return false;
    }
    if (nothingDefault) {
        m.defaultTarget = m.target;
        m.defaultWithSplus = m.withSplus;
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
                else if (isOldFormatColor && param === "color") {
                    h["color"] = m.curColor;
                }
                else if (isOldFormatCost && param === "cost") {
                    h["cost"] = m.curCost;
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
            if ((color & monster.curColor) !== 0) {
                // TOOD 色一致は端数切り上げでいいの？
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
    constructor(p, ss, d) {
        this.pos = p;
        this.strs = ss;
        this.detail = d;
    }
    getMessage() {
        if (this.detail === null) {
            return `おそらく${this.pos}文字目付近に式の誤りがあります。 ${this.strs[0]} @@@ ${this.strs[1]} @@@ ${this.strs[2]}`;
        }
        else {
            return `おそらく${this.pos}文字目付近に式の誤りがあります(${this.detail})。 ${this.strs[0]} @@@ ${this.strs[1]} @@@ ${this.strs[2]}`;
        }
    }
}
class ExprParser {
    constructor(expr) {
        this.pos = 0;
        this.chars = [...expr];
        this.worderr = null;
        this.errDetail = null;
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
            this.errDetail = "MINの開き括弧がない";
            return null;
        }
        const list = [];
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
                this.errDetail = "MINの閉じ括弧がない";
                return null;
            }
        }
    }
    // MAX
    maxScorer() {
        if (this.next() !== "(") {
            this.errDetail = "MAXの開き括弧がない";
            return null;
        }
        const list = [];
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
                this.errDetail = "MAXの閉じ括弧がない";
                return null;
            }
        }
    }
    // LESS
    lessScorer() {
        if (this.next() !== "(") {
            this.errDetail = "LESSの開き括弧がない";
            return null;
        }
        const list = [];
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
                this.errDetail = "LESSの閉じ括弧がない";
                return null;
            }
        }
    }
    // ABS
    absScorer() {
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
                calc: (c, m) => {
                    if (m.target === null) {
                        return 0;
                    }
                    return Math.abs(sc.calc(c, m));
                }
            };
        }
        else {
            this.errDetail = "ABSの閉じ括弧がない";
            return null;
        }
    }
    // NAME
    nameScorer() {
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
            // 編集距離で近い名前でも出す？　『もしかして○○○？』
            // あぁ、無理か？全部の名前と編集距離を計算しなければならないか
            this.errDetail = "名前が正しくない";
            return null;
        }
    }
    // COLOR
    colorScorer() {
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
            this.errDetail = "COLORで指定できない色";
            return null;
        }
        if (this.next() !== ")") {
            this.errDetail = "COLORの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                const heart = m.hearts.find(h => h.rank === m.target);
                return (heart.color & color) !== 0 ? 1 : 0;
            }
        };
    }
    // PLACE
    placeScorer() {
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
            this.errDetail = "PLACEで指定できない色";
            return null;
        }
        if (this.next() !== ")") {
            this.errDetail = "PLACEの閉じ括弧がない";
            return null;
        }
        return {
            calc: (c, m) => {
                if (m.target === null) {
                    return 0;
                }
                return (c & color) !== 0 ? 1 : 0;
            }
        };
    }
    // SKILL
    skillNameScorer() {
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
                return { calc: (c, m) => {
                        if (m.target === null) {
                            return 0;
                        }
                        const heart = m.hearts.find(h => h.rank === m.target);
                        return heart.cost;
                    } };
            case "COLOR":
                return this.colorScorer();
            case "PLACE":
                return this.placeScorer();
            case "ABS":
                return this.absScorer();
            case "FIT":
                return { calc: (c, m) => {
                        if (m.target === null) {
                            return 0;
                        }
                        const heart = m.hearts.find(h => h.rank === m.target);
                        return ((c & heart.color) !== 0) ? 1 : 0;
                    } };
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
    parseInteger(ch1) {
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
    parseWord(ch1) {
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
    parseValue() {
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
        return new ExprSyntaxError(this.pos, [str1, str2, str3], this.errDetail);
    }
    // 部分式をパースする(再帰的実行されるので結果的に式全体をパースすることになる)
    parse() {
        const vStack = [];
        const opStack = [];
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
                // this.errDetail = "不正な文字";
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
    target.withSplus = elem("heart_with_s_plus").checked;
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
    if (elem("heart_require_skill").checked) {
        const expr1 = elem("heart_require_skill_expression").value;
        target.reqSkillScorer = parseExpression(expr1);
        target.reqSkillExpr = expr1;
        target.reqSkillCount = parseInt(elem("heart_require_skill_expression_count").value);
        if (elem("heart_require_skill_2").checked) {
            const expr2 = elem("heart_require_skill_expression_2").value;
            target.reqSkill2Scorer = parseExpression(expr2);
            target.reqSkill2Expr = expr2;
            if (elem("heart_require_skill_3").checked) {
                const expr3 = elem("heart_require_skill_expression_3").value;
                target.reqSkill3Scorer = parseExpression(expr3);
                target.reqSkill3Expr = expr3;
                if (elem("heart_require_skill_4").checked) {
                    const expr4 = elem("heart_require_skill_expression_4").value;
                    target.reqSkill4Scorer = parseExpression(expr4);
                    target.reqSkill4Expr = expr4;
                }
            }
        }
    }
    document.getElementById("result_setname").textContent = target.setname;
    const COLORS = [Color.Yellow, Color.Purple, Color.Green, Color.Red, Color.Blue];
    for (let i = 0; i < 4; i++) {
        const e = document.getElementById(`result_heart${i + 1}`);
        e.innerHTML = "";
        let foundColor = false;
        if (i < target.colors.length) {
            const color = target.colors[i];
            for (const c of COLORS) {
                if ((c & color) === 0) {
                    continue;
                }
                foundColor = true;
                const info = SingleColorInfoMap.get(c);
                const span = e.appendChild(document.createElement("span"));
                span.classList.add(info.colorName);
                span.textContent = info.text;
            }
        }
        if (!foundColor) {
            e.textContent = "－";
        }
    }
    document.getElementById("result_power_up").textContent = `${powerUp}`;
    document.getElementById("result_maximumcost").textContent = `${target.maximumCost}`
        + (target.asLimitCost ? " (上限コスト)" : "");
    document.getElementById("result_goal").textContent = target.expr;
    document.getElementById("result_require_skill").textContent = target.reqSkillExpr
        + ((target.reqSkillCount > 0) ? ` [${target.reqSkillCount}個以上含める]` : "");
    document.getElementById("result_require_skill_2").textContent = target.reqSkill2Expr;
    document.getElementById("result_require_skill_3").textContent = target.reqSkill3Expr;
    document.getElementById("result_require_skill_4").textContent = target.reqSkill4Expr;
    return target;
}
function saveHeartSetSearchForm() {
    if (DEBUG) {
        console.log("call saveHeartSetSearchForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    const elements = document.querySelector("#search_heart_dialog form").elements;
    const elem = (name) => elements.namedItem(name);
    const checked = (name) => elem(name).checked;
    const check = (name, value) => checked(name) ? value : 0;
    const value = (name) => elem(name).value;
    const form = {
        jobId: elements.namedItem("preset_heartset").value,
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function loadHeartSetSearchForm() {
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
            const data = JSON.parse(json);
            // フォーマットの確認してないな…必要かどうかはわからんが
            if (DEBUG) {
                console.log(data);
            }
            const elements = document.querySelector("#search_heart_dialog form").elements;
            const elem = (name) => elements.namedItem(name);
            const checked = (name, ch) => elem(name).checked = ch;
            const check = (name, test, v) => checked(name, (test & v) !== 0);
            const value = (name, v) => elem(name).value = v;
            elements.namedItem("preset_heartset").value = data.jobId;
            check("heart1_yellow", Color.Yellow, data.heart1Checks);
            check("heart1_purple", Color.Purple, data.heart1Checks);
            check("heart1_green", Color.Green, data.heart1Checks);
            check("heart1_red", Color.Red, data.heart1Checks);
            check("heart1_blue", Color.Blue, data.heart1Checks);
            check("heart2_yellow", Color.Yellow, data.heart2Checks);
            check("heart2_purple", Color.Purple, data.heart2Checks);
            check("heart2_green", Color.Green, data.heart2Checks);
            check("heart2_red", Color.Red, data.heart2Checks);
            check("heart2_blue", Color.Blue, data.heart2Checks);
            check("heart3_yellow", Color.Yellow, data.heart3Checks);
            check("heart3_purple", Color.Purple, data.heart3Checks);
            check("heart3_green", Color.Green, data.heart3Checks);
            check("heart3_red", Color.Red, data.heart3Checks);
            check("heart3_blue", Color.Blue, data.heart3Checks);
            check("heart4_yellow", Color.Yellow, data.heart4Checks);
            check("heart4_purple", Color.Purple, data.heart4Checks);
            check("heart4_green", Color.Green, data.heart4Checks);
            check("heart4_red", Color.Red, data.heart4Checks);
            check("heart4_blue", Color.Blue, data.heart4Checks);
            check("heart4_omit", Color.Omit, data.heart4Checks);
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
            const maximumCostList = document.getElementById("job_preset_maximum_cost_list");
            maximumCostList.innerHTML = "";
            const jobId = parseInt(data.jobId);
            for (const x of JobPresetMaximumCost) {
                if (jobId < x.id || x.id + 100 <= jobId) {
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
// 最大スコアのこころセットの組み合わせ数を求めるだけ
// 組み合わせ爆発回避用
// TODO 最終的なベストの組み合わせ数だけじゃなく、
//      途中段階で異常な組み合わせ数が出る可能性を考慮したほうがいい
//      メモリ不足回避のために
function calcNumOfBestHeartSet(target) {
    const HAS_REQSKILL = target.reqSkillScorer !== null;
    const HAS_REQSKILL_2 = target.reqSkill2Scorer !== null;
    const HAS_REQSKILL_3 = target.reqSkill3Scorer !== null;
    const HAS_REQSKILL_4 = target.reqSkill4Scorer !== null;
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost = target.asLimitCost
        ? (m => m.curCost)
        : (m => m.curCost - m.hearts.find(h => h.rank === m.target).maximumCost);
    let dp1 = new Array(SET_LEN);
    let dp2 = new Array(SET_LEN);
    let baseTable = [];
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, count: 1 };
    function dpSubProc(useBaseTable, monster, cost, scores) {
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
                                }
                                else if (scoreBT3 === stateBT4.score) {
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
    }
    function dpProc(useBaseTable, skipFunc) {
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
                const heart = monster.hearts.find(h => h.rank === Rank.S_plus);
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
        dpProc(false, monster => !(target.reqSkillScorer.calc(Color.Unset, monster) > 0));
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
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill2Scorer.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_3) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill3Scorer.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_4) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill3Scorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill4Scorer.calc(Color.Unset, monster) > 0));
    }
    dpProc(false, monster => (HAS_REQSKILL && target.reqSkillScorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_2 && target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_3 && target.reqSkill3Scorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_4 && target.reqSkill4Scorer.calc(Color.Unset, monster) > 0));
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
    tmp[heartSet.pos] = heartSet;
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
    const HAS_REQSKILL = target.reqSkillScorer !== null;
    const HAS_REQSKILL_2 = target.reqSkill2Scorer !== null;
    const HAS_REQSKILL_3 = target.reqSkill3Scorer !== null;
    const HAS_REQSKILL_4 = target.reqSkill4Scorer !== null;
    const OFFSET = 10;
    const COUNT = target.colors.length;
    const SET_LEN = 1 << COUNT;
    const COST_LEN = target.maximumCost + 1 + OFFSET;
    const getCost = target.asLimitCost
        ? (m => m.curCost)
        : (m => m.curCost - m.hearts.find(h => h.rank === m.target).maximumCost);
    let dp1 = new Array(SET_LEN);
    let dp2 = new Array(SET_LEN);
    let baseTable = [];
    for (let i = 0; i < SET_LEN; i++) {
        dp1[i] = new Array(COST_LEN).fill(null);
        dp2[i] = new Array(COST_LEN).fill(null);
    }
    dp1[0][OFFSET] = { score: 0, sets: [] };
    function dpSubProc(useBaseTable, monster, cost, scores) {
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
                                                rank: monster.target,
                                                subsets: stateBT1.sets.slice(),
                                            }],
                                    };
                                }
                                else if (scoreBT3 === stateBT4.score) {
                                    stateBT4.sets.push({
                                        pos: p,
                                        monster: monster,
                                        rank: monster.target,
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
                                    rank: monster.target,
                                    subsets: state1.sets.slice(),
                                }],
                        };
                    }
                    else if (score3 === state4.score) {
                        state4.sets.push({
                            pos: p,
                            monster: monster,
                            rank: monster.target,
                            subsets: state1.sets.slice(),
                        });
                    }
                }
            }
        }
    }
    function dpProc(useBaseTable, skipFunc) {
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
                const heart = monster.hearts.find(h => h.rank === Rank.S_plus);
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
        dpProc(false, monster => !(target.reqSkillScorer.calc(Color.Unset, monster) > 0));
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
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill2Scorer.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_3) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill3Scorer.calc(Color.Unset, monster) > 0));
    }
    if (HAS_REQSKILL_4) {
        for (let s = 0; s < SET_LEN; s++) {
            if (popCount(s) === COUNT) {
                dp1[s].fill(null);
            }
        }
        baseTable = dp1.map(a => a.slice());
        dp1.forEach(a => a.fill(null));
        dpProc(true, monster => (target.reqSkillScorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
            || (target.reqSkill3Scorer.calc(Color.Unset, monster) > 0)
            || !(target.reqSkill4Scorer.calc(Color.Unset, monster) > 0));
    }
    dpProc(false, monster => (HAS_REQSKILL && target.reqSkillScorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_2 && target.reqSkill2Scorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_3 && target.reqSkill3Scorer.calc(Color.Unset, monster) > 0)
        || (HAS_REQSKILL_4 && target.reqSkill4Scorer.calc(Color.Unset, monster) > 0));
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
        result.appendChild(document.createElement("b")).textContent = "見つかりませんでした";
        return;
    }
    const heartSets = [];
    const monsters = new Array(COUNT).fill(null);
    for (const heartSet of best.sets) {
        extractHeartSet(heartSets, monsters, heartSet);
    }
    const template = document.getElementById("result_item");
    const omitDuplicate = new Map();
    const dt2AdoptionHeartsetList = [];
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
            m.curCost = m.hearts.find(h => h.rank === hs.rank).cost;
            m.curColor = m.hearts.find(h => h.rank === hs.rank).color;
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
            st.maximumCost += m.hearts.find(h => h.rank === m.target).maximumCost;
            m.curColor = tmpCurColor;
            m.curCost = tmpCurCost;
            m.target = tmpTarget;
        }
        const key = JSON.stringify({ status: st, hearts: heartSet.map(h => `${h?.monster.id ?? -1} ${h?.monster.target}`).sort() });
        if (omitDuplicate.has(key)) {
            continue;
        }
        omitDuplicate.set(key, true);
        const fragment = template.content.cloneNode(true);
        if (EXPOSE_MODE) {
            // 非公開機能を利用
            for (const sec of fragment.querySelectorAll(".secret")) {
                sec.classList.remove("secret");
            }
            const adoptionHeartSet = {
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
                    heart: hs.monster.hearts.find(h => h.rank === hs.rank)
                };
            }
            dt2AdoptionHeartsetList.push(adoptionHeartSet);
            fragment.querySelector(".result-item-adoption")
                .addEventListener("click", () => adoptHeartSet(adoptionHeartSet));
        }
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
            const hs = heartSet[p];
            if (hs === null) {
                continue;
            }
            const m = hs.monster;
            const tmpTarget = m.target;
            const tmpCurCost = m.curCost;
            const tmpCurColor = m.curColor;
            m.target = hs.rank;
            m.curCost = m.hearts.find(h => h.rank === hs.rank).cost;
            m.curColor = m.hearts.find(h => h.rank === hs.rank).color;
            const h = fragment.querySelector(`.result-item-heart${p + 1}`);
            const colorSpan = h.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, m.curColor);
            h.appendChild(document.createElement("span")).textContent = `${m.curCost}`;
            const name = (m.target === Rank.S_plus && m.splusName !== null)
                ? m.splusName : m.name;
            h.appendChild(document.createElement("span")).textContent = name;
            h.appendChild(document.createElement("span")).textContent = Rank[m.target].replace("_plus", "+");
            const hsc = h.appendChild(document.createElement("span"));
            hsc.classList.add("result-item-heart-score");
            hsc.textContent = `( スコア: ${target.scorer.calc(c, m)} )`;
            fragment.querySelector(`.result-item-effects${p + 1}`)
                .textContent = m.hearts.find(h => h.rank === m.target).effects;
            m.target = tmpTarget;
            m.curCost = tmpCurCost;
            m.curColor = tmpCurColor;
        }
        result.appendChild(fragment);
    }
    result.insertBefore(document.createElement("div"), result.firstElementChild)
        .textContent = `件数: ${omitDuplicate.size}`;
    setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_SEARCH_RESULTS, dt2AdoptionHeartsetList);
}
// デモ用データの加工
function convertToDummy(list) {
    if (DEBUG) {
        console.log("fill dummy data");
    }
    for (let i = 0; i < list.length; i++) {
        list[i].name = `ダミーデータ${i + 1}`;
        list[i].splusName = null;
        for (const h of list[i].hearts) {
            h.effects = h.effects
                .replace(/受けるHP回復/g, "受けるスキル道具HP回復")
                .replace(/ホイミHP回復/g, "戦闘時ホイミHP回復")
                .replace(/終了(HP|MP)/g, "戦闘終了時$1")
                .replace(/ターン(HP|MP)/g, "ターン開始時$1")
                .replace(/(メラ|ヒャド|イオ|ギラ|バギ|デイン|ジバリア|ドルマ)(斬|体|呪|R)/g, "$1属性$2")
                .replace(/スキル(斬|体)/g, "スキルの$1")
                .replace(/体D/g, "体技D")
                .replace(/斬体R/g, "斬体技R")
                .replace(/斬体/g, "斬・体")
                .replace(/斬/g, "斬撃")
                .replace(/特技/g, "とくぎ")
                .replace(/獣(D|R)/g, "けもの$1")
                .replace(/(鳥|物質|ゾンビ|ドラゴン|スライム|水|けもの|エレメント|マシン|植物|怪人|虫|悪魔|？？？？)(D|R)/g, "$1系への$2")
                .replace(/ゴールド\+(\d)/g, "フィールド通常戦闘時ゴールド+$1")
                .replace(/経験値\+(\d)/g, "フィールド通常戦闘時経験値+$1")
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
function showHeartsetViewDialog(heartset, comment) {
    const dialog = document.getElementById("heartset_view_dialog");
    document.getElementById("heartset_view_dialog_comment").textContent = comment ?? "";
    const oldPowerUp = powerUp;
    powerUp = heartset.powerUp;
    const res = document.getElementById("heartset_view_dialog_view");
    const elem = (name) => res.querySelector(`.result-item-${name}`);
    const text = (name, value) => elem(name).textContent = `${value}`;
    if (res.children.length === 0) {
        const template = document.getElementById("result_item");
        const fragment = template.content.cloneNode(true);
        if (EXPOSE_MODE) {
            for (const sec of fragment.querySelectorAll(".secret")) {
                sec.classList.remove("secret");
            }
        }
        res.appendChild(fragment);
    }
    elem("adoption").addEventListener("click", () => adoptHeartSet(heartset));
    elem("number").textContent = heartset.jobName;
    elem("score").textContent = heartset.score;
    const maximumCost = heartset.maximumCost;
    const status = {
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
    for (let i = 0; i < 4; i++) {
        const mh = heartset.hearts.at(i) ?? null;
        if (mh === null) {
            text(`heart${i + 1}`, "－");
            text(`effects${i + 1}`, "");
            continue;
        }
        const name = mh.monster.name;
        if (!monsterMap.has(name)) {
            text(`heart${i + 1}`, "");
            text(`effects${i + 1}`, "");
            continue;
        }
        const monster = monsterMap.get(name);
        const oldCurCost = monster.curCost;
        const oldCurColor = monster.curColor;
        const oldTarget = monster.target;
        monster.curCost = mh.heart.cost;
        monster.curColor = mh.heart.color;
        monster.target = mh.heart.rank;
        const he = elem(`heart${i + 1}`);
        he.innerHTML = "";
        if (monster.target === null) {
            he.appendChild(document.createElement("span")).textContent = "------";
            he.appendChild(document.createElement("span")).textContent = "--";
            he.appendChild(document.createElement("span")).textContent = monster.name;
            he.appendChild(document.createElement("span")).textContent = "(ランク未指定)";
            text(`effects${i + 1}`, "");
            monster.curCost = oldCurCost;
            monster.curColor = oldCurColor;
            monster.target = oldTarget;
            continue;
        }
        const heart = monster.hearts.find(h => h.rank === monster.target);
        cost += heart.cost;
        additionalMaximumCost += heart.maximumCost;
        const colorSpan = he.appendChild(document.createElement("span"));
        showHeartColor(colorSpan, heart.color);
        he.appendChild(document.createElement("span")).textContent = `${heart.cost}`;
        const monsterName = (heart.rank === Rank.S_plus && monster.splusName !== null)
            ? monster.splusName : monster.name;
        he.appendChild(document.createElement("span")).textContent = monsterName;
        he.appendChild(document.createElement("span")).textContent = Rank[heart.rank].replace("_plus", "+");
        text(`effects${i + 1}`, heart.effects);
        const c = heartset.colors.at(i) ?? Color.Unset;
        status.maximumHP += MaximumHPScorer.calc(c, monster);
        status.maximumMP += MaximumMPScorer.calc(c, monster);
        status.power += PowerScorer.calc(c, monster);
        status.defence += DefenceScorer.calc(c, monster);
        status.attackMagic += AttackMagicScorer.calc(c, monster);
        status.recoverMagic += RecoverMagicScorer.calc(c, monster);
        status.speed += SpeedScorer.calc(c, monster);
        status.dexterity += DexterityScorer.calc(c, monster);
        monster.curCost = oldCurCost;
        monster.curColor = oldCurColor;
        monster.target = oldTarget;
    }
    if (isNaN(maximumCost)) {
        text("cost", `${cost} / ??? + ${additionalMaximumCost}`);
        elem("cost").classList.remove("bold");
    }
    else {
        text("cost", `${cost} / ${maximumCost} + ${additionalMaximumCost}`);
        elem("cost").classList.remove("bold");
        if (cost > maximumCost + additionalMaximumCost) {
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
    powerUp = oldPowerUp;
    dialog.showModal();
}
(function () {
    // デフォルトの職業のこころ最大コストのリストを設定する
    const sel = document.getElementById("preset_heartset");
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
// 色指定のバリデーション
function validateHeartColor() {
    const checked = document.getElementById("add_color_yellow").checked
        || document.getElementById("add_color_purple").checked
        || document.getElementById("add_color_green").checked
        || document.getElementById("add_color_red").checked
        || document.getElementById("add_color_blue").checked;
    if (checked) {
        document.getElementById("add_color_yellow")
            .setCustomValidity("");
    }
    else {
        document.getElementById("add_color_yellow")
            .setCustomValidity("色を指定する必要があります");
    }
}
// 色指定のバリデーションのトリガー
document.getElementById("add_color_yellow")
    .addEventListener("change", () => {
    validateHeartColor();
});
// 色指定のバリデーションのトリガー
document.getElementById("add_color_purple")
    .addEventListener("change", () => {
    validateHeartColor();
});
// 色指定のバリデーションのトリガー
document.getElementById("add_color_green")
    .addEventListener("change", () => {
    validateHeartColor();
});
// 色指定のバリデーションのトリガー
document.getElementById("add_color_red")
    .addEventListener("change", () => {
    validateHeartColor();
});
// 色指定のバリデーションのトリガー
document.getElementById("add_color_blue")
    .addEventListener("change", () => {
    validateHeartColor();
});
// こころ追加フォームを開く
document.getElementById("add_heart")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click add_heart");
    }
    const dialog = document.getElementById("add_heart_dialog");
    document.getElementById("add_monster_name").readOnly = false;
    dialog.querySelector("form").reset();
    dialog.returnValue = "";
    validateHeartColor();
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
        elements.namedItem("add_monster_splus_name").value = `${monster.splusName ?? ""}`;
        elements.namedItem("add_cost").value = `${monster.curCost}`;
        elements.namedItem("add_color_yellow").checked = (monster.curColor & Color.Yellow) === Color.Yellow;
        elements.namedItem("add_color_purple").checked = (monster.curColor & Color.Purple) === Color.Purple;
        elements.namedItem("add_color_green").checked = (monster.curColor & Color.Green) === Color.Green;
        elements.namedItem("add_color_red").checked = (monster.curColor & Color.Red) === Color.Red;
        elements.namedItem("add_color_blue").checked = (monster.curColor & Color.Blue) === Color.Blue;
    }
});
// こころ追加フォームでキャンセルしたとき
document.querySelector(`#add_heart_dialog button[value="cancel"]`)
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
    const cbox = (name) => elements.namedItem(name).checked;
    const noNaN = (v) => isNaN(v) ? 0 : v;
    const num = (name) => noNaN(parseInt(str(name)));
    const rank = Rank[rad("add_rank")];
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
    const monster = {
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
        const orig = monsterMap.get(monster.name);
        monster.withSplus = orig.withSplus;
        // 単一のこころ追加においては既定は変更しない方針
        monster.defaultTarget = orig.defaultTarget;
        monster.defaultWithSplus = orig.defaultWithSplus;
    }
    const updated = addHeart(monster);
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
document.querySelector(`#file_load_dialog button[value="cancel"]`)
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
// 式フォームのバリデーション
function checkExpressionValidity(elemId) {
    const elem = document.getElementById(elemId);
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
        }
        catch (err) {
            if (err instanceof ExprSyntaxError) {
                elem.setCustomValidity(err.getMessage());
            }
            else {
                console.log(`${err}`);
                elem.setCustomValidity(`エラー: ${err}`);
            }
        }
        finally {
            return elem.checkValidity();
        }
    }
    return false;
}
// 特別条件式フォームの条件1のバリデーションの有無の切り替え
document.getElementById("heart_require_skill")
    .addEventListener("change", () => {
    const checked = document.getElementById("heart_require_skill").checked;
    document.getElementById("heart_require_skill_expression")
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression");
    document.getElementById("heart_with_s_plus")
        .disabled = checked;
    // 条件2
    const checked2 = checked && document.getElementById("heart_require_skill_2").checked;
    document.getElementById("heart_require_skill_expression_2")
        .required = checked2;
    checkExpressionValidity("heart_require_skill_expression_2");
    // 条件3
    const checked3 = checked2 && document.getElementById("heart_require_skill_3").checked;
    document.getElementById("heart_require_skill_expression_3")
        .required = checked3;
    checkExpressionValidity("heart_require_skill_expression_3");
    // 条件4
    const checked4 = checked3 && document.getElementById("heart_require_skill_4").checked;
    document.getElementById("heart_require_skill_expression_4")
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});
// 特別条件式フォームの条件2バリデーションの有無の切り替え
document.getElementById("heart_require_skill_2")
    .addEventListener("change", () => {
    const checked = document.getElementById("heart_require_skill_2").checked;
    document.getElementById("heart_require_skill_expression_2")
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_2");
    // 条件3
    const checked3 = checked && document.getElementById("heart_require_skill_3").checked;
    document.getElementById("heart_require_skill_expression_3")
        .required = checked3;
    checkExpressionValidity("heart_require_skill_expression_3");
    // 条件4
    const checked4 = checked3 && document.getElementById("heart_require_skill_4").checked;
    document.getElementById("heart_require_skill_expression_4")
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});
// 特別条件式フォームの条件3バリデーションの有無の切り替え
document.getElementById("heart_require_skill_3")
    .addEventListener("change", () => {
    const checked = document.getElementById("heart_require_skill_3").checked;
    document.getElementById("heart_require_skill_expression_3")
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_3");
    // 条件4
    const checked4 = checked && document.getElementById("heart_require_skill_4").checked;
    document.getElementById("heart_require_skill_expression_4")
        .required = checked4;
    checkExpressionValidity("heart_require_skill_expression_4");
});
// 特別条件式フォームの条件4バリデーションの有無の切り替え
document.getElementById("heart_require_skill_3")
    .addEventListener("change", () => {
    const checked = document.getElementById("heart_require_skill_4").checked;
    document.getElementById("heart_require_skill_expression_4")
        .required = checked;
    checkExpressionValidity("heart_require_skill_expression_4");
});
// 特別条件式フォームの条件1のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression");
});
// 特別条件式フォームの条件2のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_2")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_2");
});
// 特別条件式フォームの条件3のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_3")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_3");
});
// 特別条件式フォームの条件4のバリデーションのトリガーをセット
document.getElementById("heart_require_skill_expression_4")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("heart_require_skill_expression_4");
});
// 式フォームのバリデーションのトリガーをセット
document.getElementById("expression")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("expression");
});
// 最大化するオプションで式を選んだときと式から切り替えたときのフォーム見た目の処理
(function () {
    const e = document.getElementById("expression");
    const ge = document.getElementById("goal_expression");
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
document.getElementById("heart_with_s_plus")
    .addEventListener("change", () => {
    const checked = document.getElementById("heart_with_s_plus").checked;
    document.getElementById("heart_require_skill")
        .disabled = checked;
});
// こころセット探索対象の設定フォームのキャンセル
document.querySelector(`#search_heart_dialog button[value="cancel"]`)
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
    saveHeartSetSearchForm(); // キャンセル時も保存？
    const dialog = document.getElementById("search_heart_dialog");
    if (dialog.returnValue !== "start") {
        return;
    }
    const elements = dialog.querySelector("form").elements;
    try {
        const target = parseTarget(elements);
        const num = calcNumOfBestHeartSet(target);
        if (num > LIMIT_OF_HEARTEST) {
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
// 最大化の式の確認ボタンを押した時の処理
document.getElementById("check_expression")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expression");
    }
    const exprElem = document.getElementById("expression");
    if (!exprElem.reportValidity()) {
        return;
    }
    updatePowerUp();
    const dialog = document.getElementById("score_list_dialog");
    const exprSrc = exprElem.value;
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
function checkRequireSkillExpression(exprElemId) {
    const exprElem = document.getElementById(exprElemId);
    if (!exprElem.reportValidity()) {
        return;
    }
    updatePowerUp();
    const dialog = document.getElementById("score_list_dialog");
    const exprSrc = exprElem.value;
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
}
// 特別条件の条件1の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill");
    }
    checkRequireSkillExpression("heart_require_skill_expression");
});
// 特別条件の条件2の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_2")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_2");
    }
    checkRequireSkillExpression("heart_require_skill_expression_2");
});
// 特別条件の条件3の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_3")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_3");
    }
    checkRequireSkillExpression("heart_require_skill_expression_3");
});
// 特別条件の条件4の式の確認ボタンを押した時の処理
document.getElementById("check_require_skill_4")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_require_skill_4");
    }
    checkRequireSkillExpression("heart_require_skill_expression_4");
});
// 全こころのランク変更のクリア
document.getElementById("reset_rank")
    .addEventListener("click", () => {
    let count = 0;
    for (const monster of monsterList) {
        if (monster.target !== null) {
            if (monster.hearts.every(h => h.rank >= monster.target)) {
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
        const newCurCost = monster.hearts.find(h => h.rank === monster.target).cost;
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
document.getElementById("return_default_rank")
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
        const newCurCost = monster.hearts.find(h => h.rank === monster.target).cost;
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
document.getElementById("set_default_rank")
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
document.querySelector(`#change_monster_name_dialog button[value="cancel"]`)
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click change_monster_name_dialog CANCEL button");
    }
    const dialog = document.getElementById("change_monster_name_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
// こころ名の変更フォームの新しい名前のバリデーションのトリガーをセット
document.getElementById("new_monster_name")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    const elem = document.getElementById("new_monster_name");
    const v = elem.validity;
    if (v.customError || v.valid) {
        const newName = elem.value.trim();
        if (monsterMap.has(newName)) {
            elem.setCustomValidity(`『 ${newName} 』は同名のこころがあるので使えません`);
        }
        else if (newName === "") {
            elem.setCustomValidity("新しい名前が空欄です");
        }
        else {
            elem.setCustomValidity("");
        }
    }
});
// こころ名の変更（フォームを閉じたときに発動）
document.getElementById("change_monster_name_dialog")
    .addEventListener("close", () => {
    if (DEBUG) {
        console.log("close change_monster_name_dialog");
    }
    const dialog = document.getElementById("change_monster_name_dialog");
    if (dialog.returnValue !== "change") {
        return;
    }
    const oldName = document.getElementById("old_monster_name").value;
    const newName = document.getElementById("new_monster_name").value;
    const monster = monsterMap.get(oldName);
    monster.name = newName;
    replaceMonsterList(monsterList);
    saveMonsterList(Trigger.UpdateStatus);
    dialogAlert(`こころの名前を『 ${oldName} 』から『 ${newName} 』に変更しました`);
});
// こころの採用リストのクリア
document.getElementById("clear_adoption_heartset_list")
    .addEventListener("click", () => {
    adoptionHeartSetList = [];
    saveAdoptionHeartSetList();
    document.getElementById("adoption_heartset_list").innerHTML = "";
});
// こころの採用のダイアログのキャンセル
document.querySelector(`#adoption_heartset_dialog button[value="cancel"]`)
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click adoption_heartset_dialog CANCEL button");
    }
    const dialog = document.getElementById("adoption_heartset_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
    dialogAlert("キャンセルしました");
});
// こころの採用のダイアログと閉じた時
document.getElementById("adoption_heartset_dialog")
    .addEventListener("close", () => {
    if (DEBUG) {
        console.log("close adoption_heartset_dialog");
    }
    const dialog = document.getElementById("adoption_heartset_dialog");
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
        const withSplusElem = elem.querySelector(".monster-with-s_plus");
        const oldCurCost = mah.monster.curCost;
        const oldWithSplus = mah.monster.withSplus;
        const oldTarget = mah.monster.target;
        for (const re of rankElems) {
            if (!re.checked) {
                continue;
            }
            const value = re.value ?? "omit";
            if (value === "omit") {
                mah.monster.target = null;
            }
            else {
                const rank = Rank[value];
                mah.monster.target = rank;
                const heart = mah.monster.hearts.find(h => h.rank === rank);
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
document.getElementById("expr_rec_dialog")
    .addEventListener("close", () => {
    if (DEBUG) {
        console.log("close expr_rec_dialog");
    }
    const dialog = document.getElementById("expr_rec_dialog");
    if (dialog.returnValue !== "input") {
        return;
    }
    const elems = dialog.querySelector(":scope form").elements;
    const expr = elems.namedItem("expr_rec_expr").value;
    const isAppend = elems.namedItem("expr_rec_option").value === "append";
    const targetId = elems.namedItem("expr_rec_target_id").value;
    const targetElem = document.getElementById(targetId);
    if (targetElem === null) {
        console.log(`not found targetId: ${targetId}`);
        return;
    }
    if (targetElem instanceof HTMLInputElement) {
        if (isAppend) {
            targetElem.value += expr;
        }
        else {
            targetElem.value = expr;
        }
    }
    else {
        if (isAppend) {
            targetElem.textContent += expr;
        }
        else {
            targetElem.textContent = expr;
        }
    }
});
// 登録済み式の入力フォームのキャンセル
document.querySelector(`#expr_rec_dialog button[value="cancel"]`)
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_dialog CANCEL button");
    }
    const dialog = document.getElementById("expr_rec_dialog");
    dialog.returnValue = "cancel";
    dialog.close();
});
// 登録する式のバリデーションのトリガーをセット
document.getElementById("expr_rec_add_expr")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    checkExpressionValidity("expr_rec_add_expr");
});
// 式登録ダイアログの式の確認
function checkExprRecordSkillExpression(exprId) {
    if (DEBUG) {
        console.log("call checkExprRecordSkillExpression");
    }
    const exprElem = document.getElementById(exprId);
    if (!exprElem.reportValidity()) {
        return;
    }
    const powerUpStr = document.getElementById("expr_rec_powerup").value;
    const oldPowerUp = powerUp;
    const hasPowerUp = powerUpStr !== "";
    if (hasPowerUp) {
        powerUp = parseFloat(powerUpStr);
    }
    const dialog = document.getElementById("score_list_dialog");
    const exprSrc = exprElem.value;
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
                }
                else {
                    tr.appendChild(document.createElement("td")).textContent = "-";
                }
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
    powerUp = oldPowerUp;
    dialog.showModal();
}
// 登録済みの式の確認ボタンを押した時の処理
document.getElementById("check_expr_rec_expr")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expr_rec_expr");
    }
    checkExprRecordSkillExpression("expr_rec_expr");
});
// 登録する式の確認ボタンを押した時の処理
document.getElementById("check_expr_rec_add_expr")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click check_expr_rec_add_expr");
    }
    checkExprRecordSkillExpression("expr_rec_add_expr");
});
// 登録する式の登録ボタンを押した時の処理
document.getElementById("expr_rec_add")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_add");
    }
    const check = (e) => {
        e.required = true;
        const validity = e.checkValidity();
        e.required = false;
        return validity;
    };
    const categoryElem = document.getElementById("expr_rec_add_category");
    if (!check(categoryElem)) {
        dialogAlert("カテゴリ名を入力してください");
        return;
    }
    const exprNameElem = document.getElementById("expr_rec_add_expr_name");
    if (!check(exprNameElem)) {
        dialogAlert("登録名を入力してください");
        return;
    }
    const exprElem = document.getElementById("expr_rec_add_expr");
    if (!check(exprElem)) {
        dialogAlert("式を入力してください");
        return;
    }
    const category = categoryElem.value;
    const exprName = exprNameElem.value;
    const expr = exprElem.value;
    try {
        parseExpression(expr);
    }
    catch (err) {
        if (err instanceof ExprSyntaxError) {
            dialogAlert("式のエラー: " + err.getMessage());
        }
        else {
            console.log(`${err}`);
            dialogAlert("不明なエラー");
        }
        return;
    }
    addExprRecord(category, exprName, expr);
    dialogAlert(`式がカテゴリ『${category}』の登録名『${exprName}』として登録されました`);
});
function showExprRecordDialog(exprId, powerUpStr) {
    const dialog = document.getElementById("expr_rec_dialog");
    document.getElementById("expr_rec_target_id").value = exprId;
    document.getElementById("expr_rec_powerup").value = powerUpStr ?? "";
    dialog.querySelector(":scope form").reset(); // これはちょっと雑（連続で使いたい場合とか面倒？
    for (const e of dialog.querySelectorAll(":scope details")) {
        e.open = false;
    }
    const category = document.getElementById("expr_rec_category").value;
    updateSelectExprRecordExprNameList(category);
    const exprName = document.getElementById("expr_rec_expr_name").value;
    document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
    updateDataListExprRecordExprNameList("");
    dialog.showModal();
}
// 式登録ダイアログの式選択のカテゴリ選択時
document.getElementById("expr_rec_category")
    .addEventListener("change", () => {
    const category = document.getElementById("expr_rec_category").value;
    updateSelectExprRecordExprNameList(category);
    const exprName = document.getElementById("expr_rec_expr_name").value;
    document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
});
// 式登録ダイアログの式の登録のカテゴリ選択時
document.getElementById("expr_rec_add_category")
    .addEventListener("change", () => {
    const category = document.getElementById("expr_rec_add_category").value;
    updateDataListExprRecordExprNameList(category);
});
// 式登録ダイアログの式選択の登録名選択時
document.getElementById("expr_rec_expr_name")
    .addEventListener("change", () => {
    const category = document.getElementById("expr_rec_category").value;
    const exprName = document.getElementById("expr_rec_expr_name").value;
    document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
});
// 式登録ダイアログの式の登録の登録名選択時
document.getElementById("expr_rec_add_expr_name")
    .addEventListener("change", () => {
    const exprElem = document.getElementById("expr_rec_add_expr");
    if (exprElem.value !== "") {
        return;
    }
    const category = document.getElementById("expr_rec_add_category").value;
    const exprName = document.getElementById("expr_rec_add_expr_name").value;
    exprElem.value = getRecoredExpr(category, exprName);
});
// 登録済み式の削除ボタン
document.getElementById("expr_rec_delete")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expr_rec_delete");
    }
    const dialog = document.getElementById("expr_rec_dialog");
    const form = dialog.querySelector(":scope form");
    if (!form.reportValidity()) {
        return;
    }
    const elems = form.elements;
    const category = elems.namedItem("expr_rec_category").value;
    const exprName = elems.namedItem("expr_rec_expr_name").value;
    const checkElem = elems.namedItem("expr_rec_delete_check");
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
document.getElementById("expression_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click expression_from");
    }
    showExprRecordDialog("expression", document.getElementById("heart_power_up").value);
});
// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件1）
document.getElementById("heart_require_skill_expression_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_from");
    }
    showExprRecordDialog("heart_require_skill_expression");
});
// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件2）
document.getElementById("heart_require_skill_expression_2_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_2_from");
    }
    showExprRecordDialog("heart_require_skill_expression_2");
});
// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件3）
document.getElementById("heart_require_skill_expression_3_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_3_from");
    }
    showExprRecordDialog("heart_require_skill_expression_3");
});
// 登録済み式の挿入ダイアログを開く　（こころセット検索、条件4）
document.getElementById("heart_require_skill_expression_4_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click heart_require_skill_expression_4_from");
    }
    showExprRecordDialog("heart_require_skill_expression_4");
});
/////////////////////////////////////////////////////////////////////////////////////
// データのダウンロード
/////////////////////////////////////////////////////////////////////////////////////
function showDownloadDataLink(linkId, data) {
    const link = document.getElementById(linkId);
    link.hidden = true;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
        link.querySelector("a")
            .href = reader.result;
        link.querySelector("span").textContent = `(${new Date()})`;
        link.hidden = false;
    });
    const json = JSON.stringify(data);
    reader.readAsDataURL(new Blob([json]));
}
function loadDataFile(fileId, radioId, listener) {
    const files = document.getElementById(fileId).files;
    if (files === null || files.length === 0) {
        dialogAlert("ファイルを選択してください");
        return;
    }
    const file = files[0];
    let option = "";
    for (const radio of document.querySelectorAll(`#${radioId} input`)) {
        if (radio.checked) {
            option = radio.value;
            break;
        }
    }
    file.text().then(text => {
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
        }
        else {
            dialogAlert("エラー: ファイル内容が不正です");
        }
    }).catch(err => {
        dialogAlert(`${err}`);
    });
}
// データファイルのダウンロード （登録した式）
document.getElementById("data_file_expr_rec_download")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_expr_rec_download");
    }
    showDownloadDataLink("data_file_expr_rec_downloadlink", exprRecordLists);
});
// データファイルの読み込み （登録した式）
document.getElementById("data_file_expr_rec_load")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_expr_rec_load");
    }
    const erMerge = {
        doesMerge: (oldOne, newOne) => oldOne.name === newOne.name,
        merge: (oldOne, newOne) => newOne,
    };
    const erlMerge = {
        doesMerge: (oldOne, newOne) => oldOne.category === newOne.category,
        merge: (oldOne, newOne) => ({
            category: newOne.category,
            list: mergeList(oldOne.list, newOne.list, erMerge).sort((a, b) => a.name.localeCompare(b.name))
        })
    };
    const update = () => {
        saveExprRecord();
        updateExprRecordCategoryList();
        const category = document.getElementById("expr_rec_category").value;
        updateSelectExprRecordExprNameList(category);
        const exprName = document.getElementById("expr_rec_expr_name").value;
        document.getElementById("expr_rec_expr").value = getRecoredExpr(category, exprName);
        dialogAlert("読み込み完了しました");
    };
    loadDataFile("data_file_expr_rec_load_file", "data_file_expr_rec_load_option", {
        isValid: isValidExprRecordListData,
        truncate: (data) => {
            exprRecordLists = data;
            update();
        },
        fileAsNewer: (data) => {
            const newList = mergeList(exprRecordLists, data, erlMerge).sort((a, b) => a.category.localeCompare(b.category));
            exprRecordLists = newList;
            update();
        },
        fileAsOlder: (data) => {
            const newList = mergeList(data, exprRecordLists, erlMerge).sort((a, b) => a.category.localeCompare(b.category));
            exprRecordLists = newList;
            update();
        }
    });
});
// データファイルのダウンロード （ダメージの目安の計算（斬撃・体技）のこころセット取り込み設定）
document.getElementById("data_file_damagetool2_import_setting_download")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_damagetool2_import_setting_download");
    }
    const data = {
        importSettingForm: getDT2ImportSettingForm(),
        memoExprZokuseiZantai: DT2MemoExprImportZokuseiZantai,
        memoExprZokuseiJumon: DT2MemoExprImportZokuseiJumon,
        memoExprZokuseiZokusei: DT2MemoExprImportZokuseiZokusei,
        memoExprMonsterRate: DT2MemoExprImportMonsterRate
    };
    showDownloadDataLink("data_file_damagetool2_import_setting_downloadlink", data);
});
// データファイルの読み込み （ダメージの目安の計算（斬撃・体技）のこころセット取り込み設定）
document.getElementById("data_file_damagetool2_import_setting_load")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click data_file_damagetool2_import_setting_load");
    }
    const merge = (newer, older) => {
        if (newer.powerExpr === "") {
            newer.powerExpr = older.powerExpr;
        }
        if (newer.attackMagicExpr === "") {
            newer.attackMagicExpr = older.attackMagicExpr;
        }
        if (newer.skillZangekiExpr === "") {
            newer.skillZangekiExpr = older.skillZangekiExpr;
        }
        if (newer.skillTaigiExpr === "") {
            newer.skillTaigiExpr = older.skillTaigiExpr;
        }
        if (newer.skillZantaiExpr === "") {
            newer.skillZantaiExpr = older.skillZantaiExpr;
        }
        if (newer.jumonExpr === "") {
            newer.jumonExpr = older.jumonExpr;
        }
        if (newer.zenzokuseiExpr === "") {
            newer.zenzokuseiExpr = older.zenzokuseiExpr;
        }
        for (let i = 0; i < 4; i++) {
            if (newer.zokuseiZantaiExpr[i] === "") {
                newer.zokuseiZantaiExpr[i] = older.zokuseiZantaiExpr[i];
            }
            if (newer.zokuseiJumonExpr[i] === "") {
                newer.zokuseiJumonExpr[i] = older.zokuseiJumonExpr[i];
            }
            if (newer.zokuseiZokuseiExpr[i] === "") {
                newer.zokuseiZokuseiExpr[i] = older.zokuseiZokuseiExpr[i];
            }
            if (newer.monsterExpr[i] === "") {
                newer.monsterExpr[i] = older.monsterExpr[i];
            }
            if (i < 3 && newer.spskillExpr[i] === "") {
                newer.spskillExpr[i] = older.spskillExpr[i];
            }
        }
        fillDT2ImportSettingForm(newer);
    };
    loadDataFile("data_file_damagetool2_import_setting_load_file", "data_file_damagetool2_import_setting_load_option", {
        isValid: isValidDT2EternalFormData,
        truncate: (data) => {
            fillDT2ImportSettingForm(data.importSettingForm);
            const copy = (src, dst) => src.forEach((e, i) => dst[i] = e);
            copy(data.memoExprZokuseiZantai, DT2MemoExprImportZokuseiZantai);
            copy(data.memoExprZokuseiJumon, DT2MemoExprImportZokuseiJumon);
            copy(data.memoExprZokuseiZokusei, DT2MemoExprImportZokuseiZokusei);
            copy(data.memoExprMonsterRate, DT2MemoExprImportMonsterRate);
            dialogAlert("読み込み完了しました");
        },
        fileAsNewer: (data) => {
            const form = getDT2ImportSettingForm();
            merge(data.importSettingForm, form);
            const copy = (src, dst) => src.forEach((e, i) => { if (e !== "")
                dst[i] = e; });
            copy(data.memoExprZokuseiZantai, DT2MemoExprImportZokuseiZantai);
            copy(data.memoExprZokuseiJumon, DT2MemoExprImportZokuseiJumon);
            copy(data.memoExprZokuseiZokusei, DT2MemoExprImportZokuseiZokusei);
            copy(data.memoExprMonsterRate, DT2MemoExprImportMonsterRate);
            dialogAlert("読み込み完了しました");
        },
        fileAsOlder: (data) => {
            const form = getDT2ImportSettingForm();
            merge(form, data.importSettingForm);
            const copy = (src, dst) => src.forEach((e, i) => { if (dst[i] === "")
                dst[i] = e; });
            copy(data.memoExprZokuseiZantai, DT2MemoExprImportZokuseiZantai);
            copy(data.memoExprZokuseiJumon, DT2MemoExprImportZokuseiJumon);
            copy(data.memoExprZokuseiZokusei, DT2MemoExprImportZokuseiZokusei);
            copy(data.memoExprMonsterRate, DT2MemoExprImportMonsterRate);
            dialogAlert("読み込み完了しました");
        }
    });
});
/////////////////////////////////////////////////////////////////////////////////////
// ステータス距離
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
                const cd = (m2.curCost - h2.maximumCost) - (m1.curCost - h1.maximumCost);
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
        showHeartColor(targetSpan, m1.curColor);
        const name1 = (m1.target === Rank.S_plus && m1.splusName !== null)
            ? m1.splusName : m1.name;
        targetTd.appendChild(document.createElement("span")).textContent =
            `${m1.curCost} ${name1} ${Rank[m1.target].replace("_plus", "+")}`;
        function append(ds) {
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
                `${ds.monster.curCost} ${name} ${Rank[ds.monster.target].replace("_plus", "+")} (${Math.ceil(ds.distance)})`;
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
    const list = document.getElementById("damage_heartset_list");
    list.appendChild(fragment);
    // list.insertBefore(fragment, list.firstChild);
});
// ダメージ計算のスキル追加
document.getElementById("add_damage_skill").addEventListener("click", () => {
    const template = document.getElementById("damage_skill_list_item");
    const fragment = template.content.cloneNode(true);
    const name = fragment.querySelector(`input[name="damage_skill_name"]`);
    name.value = `スキル${damageToolUtil.nextSkillCount()}`;
    const list = document.getElementById("damage_skill_list");
    list.appendChild(fragment);
    // list.insertBefore(fragment, list.firstChild);
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
function saveRNForm() {
    if (DEBUG) {
        console.log("call saveRNForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    const sel = (id) => document.getElementById(id).value;
    const elem = (id) => document.getElementById(id);
    const checked = (id) => elem(id).checked;
    const value = (id) => elem(id).value;
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
    const checks = [];
    const params = [];
    for (const key of keys) {
        checks.push(checked(`reallyneeded_${key}`));
        const list = [];
        for (const pKey of paramKeys) {
            list.push(value(`reallyneeded_${key}_${pKey}`));
        }
        params.push(list);
    }
    const exprs = [];
    for (let i = 1; i <= 8; i++) {
        exprs.push(value(`reallyneeded_expr${i}_expr`));
    }
    const form = {
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function loadRNForm() {
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
            const data = JSON.parse(json);
            // フォーマットの確認してないな…必要かどうかはわからんが
            if (DEBUG) {
                console.log(data);
            }
            const sel = (id, v) => document.getElementById(id).value = v;
            const elem = (id) => document.getElementById(id);
            const checked = (id, ch) => elem(id).checked = ch;
            const value = (id, v) => elem(id).value = v;
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
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
const RN_MAX_BEST_LEN = 20;
const RN_BEST_REF_EXPR_COUNT = 6;
const RNBestRefExprScores = new Array(RN_BEST_REF_EXPR_COUNT).fill(0);
const RNBestRefExprPenalties = new Array(RN_BEST_REF_EXPR_COUNT).fill(Number.MAX_VALUE);
const RNBestRefExprBonuses = new Array(RN_BEST_REF_EXPR_COUNT).fill(0);
const RNBestRefExprHeartsets = new Array(RN_BEST_REF_EXPR_COUNT).fill(null);
const RNHeartsetResults = new Array(RN_MAX_BEST_LEN).fill(null);
function updateRNBestRefExpr(i, heartset, score) {
    const isBest = heartset.penalty < RNBestRefExprPenalties[i]
        || (heartset.penalty === RNBestRefExprPenalties[i]
            && (score > RNBestRefExprScores[i]
                || (score === RNBestRefExprScores[i] && heartset.bonus > RNBestRefExprBonuses[i])));
    if (isBest) {
        RNBestRefExprPenalties[i] = heartset.penalty;
        RNBestRefExprBonuses[i] = heartset.bonus;
        RNBestRefExprScores[i] = score;
    }
    return isBest;
}
// ReallyNeededのこころセット表示
function showRNHeartset(target, heartsets) {
    const res = document.getElementById("reallyneeded_result");
    let items = res.querySelectorAll(":scope > div.outline");
    for (let pos = 0; pos < heartsets.length; pos++) {
        const heartset = heartsets[pos];
        if (pos >= items.length) {
            const template = document.getElementById("result_item");
            const fragment = template.content.cloneNode(true);
            if (EXPOSE_MODE) { // 常に真な気がするが
                for (const sec of fragment.querySelectorAll(".secret")) {
                    sec.classList.remove("secret");
                }
            }
            res.appendChild(fragment);
            items = res.querySelectorAll(":scope > div.outline");
        }
        const item = items[pos];
        const elem = (name) => item.querySelector(`.result-item-${name}`);
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
        const status = {
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
                elem(`heart${i + 1}`).innerHTML = "";
                elem(`effects${i + 1}`).textContent = "";
                continue;
            }
            const tmpRank = h.monster.target;
            h.monster.target = h.heart.rank;
            const he = elem(`heart${i + 1}`);
            he.innerHTML = "";
            const colorSpan = he.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, h.heart.color);
            he.appendChild(document.createElement("span")).textContent = `${h.heart.cost}`;
            const name = (h.heart.rank === Rank.S_plus && h.monster.splusName !== null)
                ? h.monster.splusName : h.monster.name;
            he.appendChild(document.createElement("span")).textContent = name;
            he.appendChild(document.createElement("span")).textContent = Rank[h.heart.rank].replace("_plus", "+");
            elem(`effects${i + 1}`).textContent = h.heart.effects;
            const c = target.job.colors[i];
            status.maximumHP += MaximumHPScorer.calc(c, h.monster);
            status.maximumMP += MaximumMPScorer.calc(c, h.monster);
            status.power += PowerScorer.calc(c, h.monster);
            status.defence += DefenceScorer.calc(c, h.monster);
            status.attackMagic += AttackMagicScorer.calc(c, h.monster);
            status.recoverMagic += RecoverMagicScorer.calc(c, h.monster);
            status.speed += SpeedScorer.calc(c, h.monster);
            status.dexterity += DexterityScorer.calc(c, h.monster);
            for (let z = 0; z < statusValues.length; z++) {
                statusValues[z] += target.scoreres[z].scorer.calc(c, h.monster);
            }
            h.monster.target = tmpRank;
        }
        elem("maximumhp").textContent = `${status.maximumHP}`;
        elem("maximummp").textContent = `${status.maximumMP}`;
        elem("power").textContent = `${status.power}`;
        elem("defence").textContent = `${status.defence}`;
        elem("attackmagic").textContent = `${status.attackMagic}`;
        elem("recovermagic").textContent = `${status.recoverMagic}`;
        elem("speed").textContent = `${status.speed}`;
        elem("dexterity").textContent = `${status.dexterity}`;
        let scoreStr = `penalty: ${heartset.penalty}, bonus: ${heartset.bonus}`;
        const refMonster = {
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
        const hasRefExprBest = new Array(RN_BEST_REF_EXPR_COUNT).fill(false);
        if (target.useRefExpr) {
            const refScore = target.refExpr.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値1: ${refScore}`;
            hasRefExprBest[0] = updateRNBestRefExpr(0, heartset, refScore);
        }
        if (target.useRefExpr2) {
            const refScore2 = target.refExpr2.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値2: ${refScore2}`;
            hasRefExprBest[1] = updateRNBestRefExpr(1, heartset, refScore2);
        }
        if (target.useRefExpr3) {
            const refScore3 = target.refExpr3.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値3: ${refScore3}`;
            hasRefExprBest[2] = updateRNBestRefExpr(2, heartset, refScore3);
        }
        if (target.useRefExpr4) {
            const refScore4 = target.refExpr4.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値4: ${refScore4}`;
            hasRefExprBest[3] = updateRNBestRefExpr(3, heartset, refScore4);
        }
        if (target.useRefExpr5) {
            const refScore5 = target.refExpr5.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値5: ${refScore5}`;
            hasRefExprBest[4] = updateRNBestRefExpr(4, heartset, refScore5);
        }
        if (target.useRefExpr6) {
            const refScore6 = target.refExpr6.calc(Color.Unset, refMonster);
            scoreStr += `, 参考値6: ${refScore6}`;
            hasRefExprBest[5] = updateRNBestRefExpr(5, heartset, refScore6);
        }
        elem("score").textContent = scoreStr;
        if (EXPOSE_MODE) {
            const adoptionHeartSet = {
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
            RNHeartsetResults[pos] = adoptionHeartSet;
            const adoptor = () => adoptHeartSet(adoptionHeartSet);
            elem("adoption").onclick = adoptor;
            if (hasRefExprBest[0]) {
                RNBestRefExprHeartsets[0] = adoptionHeartSet;
                const refexpr1BestElem = document.getElementById("reallyneeded_refexpr_best");
                refexpr1BestElem.innerHTML = "";
                const reb1Elem = refexpr1BestElem.appendChild(item.cloneNode(true));
                reb1Elem.querySelector(":scope .result-item-number").textContent = "参考値1ベスト";
                reb1Elem.querySelector(":scope .result-item-adoption").onclick = adoptor;
            }
            for (let i = 1; i < RN_BEST_REF_EXPR_COUNT; i++) {
                if (hasRefExprBest[i]) {
                    RNBestRefExprHeartsets[i] = adoptionHeartSet;
                    const refexprBestElem = document.getElementById(`reallyneeded_refexpr${i + 1}_best`);
                    refexprBestElem.innerHTML = "";
                    const rebElem = refexprBestElem.appendChild(item.cloneNode(true));
                    rebElem.querySelector(":scope .result-item-number").textContent = `参考値${i + 1}ベスト`;
                    rebElem.querySelector(".result-item-adoption").onclick = adoptor;
                }
            }
        }
    }
}
// ReallyNeededのこころセットのスコア計算
function calcRNHeartsetScore(target, heartset) {
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
function searchRNHeartsetSA(target) {
    const oldPowerUp = powerUp;
    powerUp = target.job.powerUp;
    const perm = permutation(target.setSize);
    const copy = (hs) => {
        const res = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests = [];
    const update = (state) => {
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
        if (bests.length < RN_MAX_BEST_LEN) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const hIndexes = Array.from({ length: target.setSize }, () => new Array(heartList.length));
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
            }
            else {
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
        let h = null;
        const hhi = hhIndexes[pos];
        if (hhi >= heartList.length) {
            hhIndexes[pos] = 0;
            if (currentState.hearts[pos] === null) {
                return null;
            }
        }
        else {
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
        }
        else if (tmpBetter.penalty > currentState.penalty) {
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
            used[currentState.hearts[pos].monster.id] = false;
        }
        if (tmpBetter.hearts[pos] !== null) {
            used[tmpBetter.hearts[pos].monster.id] = true;
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
    const close = (res) => {
        powerUp = oldPowerUp;
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS, RNHeartsetResults.filter(hs => hs !== null));
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS, RNBestRefExprHeartsets);
    };
    const task = {
        interval: 1,
        proc: proc,
        close: close
    };
    dialogWait(task, "探索中です･･･");
}
// ReallyNeededのこころセットを探索する (Hill Climbing)
function searchRNHeartsetHC(target) {
    const oldPowerUp = powerUp;
    powerUp = target.job.powerUp;
    const perm = permutation(target.setSize);
    const copy = (hs) => {
        const res = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests = [];
    const update = (state) => {
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
        if (bests.length < RN_MAX_BEST_LEN) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const hIndexes = Array.from({ length: target.setSize }, () => new Array(heartList.length));
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
            }
            else {
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
        let h = null;
        const hhi = hhIndexes[pos];
        if (hhi >= heartList.length) {
            hhIndexes[pos] = 0;
            if (currentState.hearts[pos] === null) {
                return null;
            }
        }
        else {
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
        }
        else if (tmpBetter.penalty > currentState.penalty) {
            return null;
        }
        noChange = false;
        if (currentState.hearts[pos] !== null) {
            used[currentState.hearts[pos].monster.id] = false;
        }
        if (tmpBetter.hearts[pos] !== null) {
            used[tmpBetter.hearts[pos].monster.id] = true;
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
    const close = (res) => {
        powerUp = oldPowerUp;
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS, RNHeartsetResults.filter(hs => hs !== null));
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS, RNBestRefExprHeartsets);
    };
    const task = {
        interval: 1,
        proc: proc,
        close: close
    };
    dialogWait(task, "探索中です･･･");
}
// ReallyNeededのこころセットを探索する (Hill Climbing with Greedy)
function searchRNHeartsetHCG(target) {
    const oldPowerUp = powerUp;
    powerUp = target.job.powerUp;
    const perm = permutation(target.setSize);
    const copy = (hs) => {
        const res = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests = [];
    const update = (state) => {
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
        if (bests.length < RN_MAX_BEST_LEN) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart = {
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
                }
                else {
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
                        || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
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
                }
                else {
                    noChange++;
                }
                return null;
            }
            throw "BUG in HC (used)";
        }
        let tmpBest = null;
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
                    || (tmpState.penalty === tmpBetter.penalty && tmpState.bonus > tmpBetter.bonus)) {
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
                    currentState = copy(currentState);
                    showRNHeartset(target, bests);
                }
            }
        }
        else {
            noChange++;
        }
        return null;
    };
    const close = (res) => {
        powerUp = oldPowerUp;
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS, RNHeartsetResults.filter(hs => hs !== null));
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS, RNBestRefExprHeartsets);
    };
    const task = {
        interval: 1,
        proc: proc,
        close: close
    };
    dialogWait(task, "探索中です･･･");
}
// ReallyNeededのこころセットを探索する (Greedy)
function searchRNHeartsetGr(target) {
    const oldPowerUp = powerUp;
    powerUp = target.job.powerUp;
    const perm = permutation(target.setSize);
    const copy = (hs) => {
        const res = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests = [];
    const update = (state) => {
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
        if (bests.length < RN_MAX_BEST_LEN) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart = {
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
                    }
                    else {
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
            }
            else {
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
    const close = (res) => {
        powerUp = oldPowerUp;
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS, RNHeartsetResults.filter(hs => hs !== null));
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS, RNBestRefExprHeartsets);
    };
    const task = {
        interval: 1,
        proc: proc,
        close: close
    };
    dialogWait(task, "探索中です･･･");
}
// ReallyNeededのこころセットを探索する (Brute Force)
function searchRNHeartsetBF(target) {
    const oldPowerUp = powerUp;
    powerUp = target.job.powerUp;
    const perm = permutation(target.setSize);
    const copy = (hs) => {
        const res = {
            hearts: hs.hearts.slice(),
            order: hs.order,
            penalty: hs.penalty,
            bonus: hs.bonus,
            cost: hs.cost
        };
        return res;
    };
    let currentState = {
        hearts: new Array(target.setSize).fill(null),
        order: perm[0],
        penalty: 0,
        bonus: 0,
        cost: 0
    };
    calcRNHeartsetScore(target, currentState);
    const bests = [];
    const update = (state) => {
        let changed = false;
        if (bests.length > 0) {
            if (state.penalty > bests[bests.length - 1].penalty) {
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
        if (bests.length < RN_MAX_BEST_LEN) {
            bests.push(state);
            changed = true;
        }
        return changed;
    };
    const heartList = [];
    let maxID = 0;
    for (const m of monsterList) {
        if (m.target === null) {
            continue;
        }
        maxID = Math.max(maxID, m.id);
        const heart = {
            monster: m,
            heart: m.hearts.find(h => h.rank === m.target)
        };
        heartList.push(heart);
        if (m.withSplus && m.target !== Rank.S_plus) {
            const sph = m.hearts.find(h => h.rank === Rank.S_plus);
            if (sph) {
                const spHeart = {
                    monster: m,
                    heart: sph
                };
                heartList.push(spHeart);
            }
        }
    }
    const used = new Array(maxID + 1).fill(false);
    const pairs = [];
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
    };
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
    };
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
    const close = (res) => {
        powerUp = oldPowerUp;
        if (res === null) {
            dialogAlert("探索を中止しました");
        }
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS, RNHeartsetResults.filter(hs => hs !== null));
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS, RNBestRefExprHeartsets);
    };
    const task = {
        interval: 1,
        proc: proc,
        close: close
    };
    dialogWait(task, "探索中です･･･");
}
function setRNJob() {
    const sel = document.getElementById("reallyneeded_job");
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        const maximumCostList = document.getElementById("reallyneeded_job_preset_maximum_cost_list");
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
            const e = document.getElementById(`reallyneeded_heart${i + 1}`);
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c);
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            if (!foundColor) {
                e.textContent = "－";
            }
        }
        document.getElementById("reallyneeded_power_up").textContent = `${job.powerUp}`;
        return;
    }
    dialogAlert(`Unknown ID: ${value}`);
}
// ReallyNeededのこころセット探索フォームにて
// 職業ごとのこころ枠の組み合わせをフォームに設定する
document.getElementById("reallyneeded_job").addEventListener("change", () => {
    setRNJob();
});
let currentReallyneededJobPresetMaximumCostId = 0;
// ReallyNeededのこころセット探索フォームにて
// 初期値の職業のこころ枠の組み合わせをフォームに設定する
(function () {
    const sel = document.getElementById("reallyneeded_job");
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        if (job.id < currentReallyneededJobPresetMaximumCostId || currentReallyneededJobPresetMaximumCostId + 100 <= job.id) {
            const maximumCostList = document.getElementById("reallyneeded_job_preset_maximum_cost_list");
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
            const e = document.getElementById(`reallyneeded_heart${i + 1}`);
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c);
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            if (!foundColor) {
                e.textContent = "－";
            }
        }
        document.getElementById("reallyneeded_power_up").textContent = `${job.powerUp}`;
        return;
    }
})();
// ReallyNeededのこころセット探索開始ボタン
document.getElementById("reallyneeded_start").addEventListener("click", () => {
    saveRNForm();
    const elem = (id) => document.getElementById(id);
    const num = (id) => {
        const x = parseInt(elem(id).value ?? "0");
        return isNaN(x) ? 0 : x;
    };
    const jobId = num("reallyneeded_job");
    const job = JobPreset.find(x => x.id === jobId);
    // Color.Omitは末尾にのみ存在することが前提
    const setSize = job.colors.reduce((acc, c) => c !== Color.Omit ? acc + 1 : acc, 0);
    const maximumCost = num("reallyneeded_heart_maximum_cost");
    const asLimitCost = elem("reallyneeded_as_limit_heart_cost").checked;
    if (maximumCost < 1) {
        dialogAlert("こころ最大コストを設定してください");
        return;
    }
    const costCoCo = {
        quadratic: num("reallyneeded_heart_maximum_cost_hp2"),
        linear: num("reallyneeded_heart_maximum_cost_hp1"),
        constant: num("reallyneeded_heart_maximum_cost_hpc")
    };
    if (costCoCo.quadratic < 1 && costCoCo.linear < 1 && costCoCo.constant < 1) {
        dialogAlert("コスト高ペナを設定してください");
        return;
    }
    const useRefExpr = elem("reallyneeded_refexpr").checked;
    let refExpr = null;
    if (useRefExpr) {
        const refExprSrc = elem("reallyneeded_refexpr_expr").value ?? "";
        try {
            refExpr = parseExpression(refExprSrc);
        }
        catch (ex) {
            dialogAlert(`参考値1の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const useRefExpr2 = elem("reallyneeded_refexpr2").checked;
    let refExpr2 = null;
    if (useRefExpr2) {
        const refExpr2Src = elem("reallyneeded_refexpr2_expr").value ?? "";
        try {
            refExpr2 = parseExpression(refExpr2Src);
        }
        catch (ex) {
            dialogAlert(`参考値2の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const useRefExpr3 = elem("reallyneeded_refexpr3").checked;
    let refExpr3 = null;
    if (useRefExpr3) {
        const refExpr3Src = elem("reallyneeded_refexpr3_expr").value ?? "";
        try {
            refExpr3 = parseExpression(refExpr3Src);
        }
        catch (ex) {
            dialogAlert(`参考値3の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const useRefExpr4 = elem("reallyneeded_refexpr4").checked;
    let refExpr4 = null;
    if (useRefExpr4) {
        const refExpr4Src = elem("reallyneeded_refexpr4_expr").value ?? "";
        try {
            refExpr4 = parseExpression(refExpr4Src);
        }
        catch (ex) {
            dialogAlert(`参考値4の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const useRefExpr5 = elem("reallyneeded_refexpr5").checked;
    let refExpr5 = null;
    if (useRefExpr5) {
        const refExpr5Src = elem("reallyneeded_refexpr5_expr").value ?? "";
        try {
            refExpr5 = parseExpression(refExpr5Src);
        }
        catch (ex) {
            dialogAlert(`参考値5の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const useRefExpr6 = elem("reallyneeded_refexpr6").checked;
    let refExpr6 = null;
    if (useRefExpr6) {
        const refExpr6Src = elem("reallyneeded_refexpr6_expr").value ?? "";
        try {
            refExpr6 = parseExpression(refExpr6Src);
        }
        catch (ex) {
            dialogAlert(`参考値6の式にエラー: ${ex.getMessage()}`);
            return;
        }
    }
    const target = {
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
    const targetList = [
        { name: "maximumhp", scorer: MaximumHPScorer, refName: "HP", refSetter: (h, v) => h.maximumHP = v },
        { name: "maximummp", scorer: MaximumMPScorer, refName: "MP", refSetter: (h, v) => h.maximumMP = v },
        { name: "power", scorer: PowerScorer, refName: "PWR", refSetter: (h, v) => h.power = v },
        { name: "defence", scorer: DefenceScorer, refName: "DEF", refSetter: (h, v) => h.defence = v },
        { name: "attackmagic", scorer: AttackMagicScorer, refName: "AMG", refSetter: (h, v) => h.attackMagic = v },
        { name: "recovermagic", scorer: RecoverMagicScorer, refName: "RMG", refSetter: (h, v) => h.recoverMagic = v },
        { name: "speed", scorer: SpeedScorer, refName: "SPD", refSetter: (h, v) => h.speed = v },
        { name: "dexterity", scorer: DexterityScorer, refName: "DEX", refSetter: (h, v) => h.dexterity = v },
        { name: "expr1", scorer: null, refName: "式A", refSetter: (h, v) => h.effects += ` 式A${v} ` },
        { name: "expr2", scorer: null, refName: "式B", refSetter: (h, v) => h.effects += ` 式B${v} ` },
        { name: "expr3", scorer: null, refName: "式C", refSetter: (h, v) => h.effects += ` 式C${v} ` },
        { name: "expr4", scorer: null, refName: "式D", refSetter: (h, v) => h.effects += ` 式D${v} ` },
        { name: "expr5", scorer: null, refName: "式E", refSetter: (h, v) => h.effects += ` 式E${v} ` },
        { name: "expr6", scorer: null, refName: "式F", refSetter: (h, v) => h.effects += ` 式F${v} ` },
        { name: "expr7", scorer: null, refName: "式G", refSetter: (h, v) => h.effects += ` 式G${v} ` },
        { name: "expr8", scorer: null, refName: "式H", refSetter: (h, v) => h.effects += ` 式H${v} ` }
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
            }
            catch (ex) {
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
    document.getElementById("reallyneeded_result").innerHTML = "";
    RNBestRefExprScores.fill(0);
    RNBestRefExprPenalties.fill(Number.MAX_VALUE);
    RNBestRefExprBonuses.fill(0);
    RNBestRefExprHeartsets.fill(null);
    RNHeartsetResults.fill(null);
    document.getElementById("reallyneeded_refexpr_best").innerHTML = "";
    document.getElementById("reallyneeded_refexpr2_best").innerHTML = "";
    document.getElementById("reallyneeded_refexpr3_best").innerHTML = "";
    document.getElementById("reallyneeded_refexpr4_best").innerHTML = "";
    document.getElementById("reallyneeded_refexpr5_best").innerHTML = "";
    document.getElementById("reallyneeded_refexpr6_best").innerHTML = "";
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
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式A）
document.getElementById("reallyneeded_expr1_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr1_from");
    }
    showExprRecordDialog("reallyneeded_expr1_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式B）
document.getElementById("reallyneeded_expr2_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr2_from");
    }
    showExprRecordDialog("reallyneeded_expr2_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式C）
document.getElementById("reallyneeded_expr3_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr3_from");
    }
    showExprRecordDialog("reallyneeded_expr3_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式D）
document.getElementById("reallyneeded_expr4_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr4_from");
    }
    showExprRecordDialog("reallyneeded_expr4_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式E）
document.getElementById("reallyneeded_expr5_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr5_from");
    }
    showExprRecordDialog("reallyneeded_expr5_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式F）
document.getElementById("reallyneeded_expr6_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr6_from");
    }
    showExprRecordDialog("reallyneeded_expr6_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式G）
document.getElementById("reallyneeded_expr7_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr7_from");
    }
    showExprRecordDialog("reallyneeded_expr7_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、式H）
document.getElementById("reallyneeded_expr8_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_expr8_from");
    }
    showExprRecordDialog("reallyneeded_expr8_expr", document.getElementById("reallyneeded_power_up").textContent ?? "");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式1）
document.getElementById("reallyneeded_refexpr_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr_from");
    }
    showExprRecordDialog("reallyneeded_refexpr_expr");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式2）
document.getElementById("reallyneeded_refexpr2_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr2_from");
    }
    showExprRecordDialog("reallyneeded_refexpr2_expr");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式3）
document.getElementById("reallyneeded_refexpr3_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr3_from");
    }
    showExprRecordDialog("reallyneeded_refexpr3_expr");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式4）
document.getElementById("reallyneeded_refexpr4_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr4_from");
    }
    showExprRecordDialog("reallyneeded_refexpr4_expr");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式5）
document.getElementById("reallyneeded_refexpr5_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr5_from");
    }
    showExprRecordDialog("reallyneeded_refexpr5_expr");
});
// 登録済み式の挿入ダイアログを開く　（特殊なこころセット検索、参考式6）
document.getElementById("reallyneeded_refexpr6_from")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click reallyneeded_refexpr6_from");
    }
    showExprRecordDialog("reallyneeded_refexpr6_expr");
});
/////////////////////////////////////////////////////////////////////////////////////
// マニュアルこころセット
/////////////////////////////////////////////////////////////////////////////////////
const manualAdoptionHeartSet = {
    jobName: "",
    score: "－",
    maximumCost: 0,
    powerUp: 0,
    colors: [],
    hearts: []
};
function showManualHeartset() {
    const sel = document.getElementById("manualset_job");
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
        const res = document.getElementById("manualset_result");
        const elem = (name) => res.querySelector(`.result-item-${name}`);
        const text = (name, value) => elem(name).textContent = `${value}`;
        if (res.children.length === 0) {
            const template = document.getElementById("result_item");
            const fragment = template.content.cloneNode(true);
            if (EXPOSE_MODE) {
                for (const sec of fragment.querySelectorAll(".secret")) {
                    sec.classList.remove("secret");
                }
                fragment.querySelector(".result-item-adoption")
                    .addEventListener("click", () => adoptHeartSet(manualAdoptionHeartSet));
            }
            res.appendChild(fragment);
            elem("number").parentElement.hidden = true;
            elem("score").parentElement.hidden = true;
        }
        const maximumCost = parseInt(document.getElementById("manualset_heart_maximum_cost").value ?? "0");
        const asLimitCost = document.getElementById("manualset_as_limit_heart_cost").checked;
        const status = {
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
            const t = document.getElementById(`manualset_heart${i + 1}_name`);
            if (t.disabled) {
                text(`heart${i + 1}`, "－");
                text(`effects${i + 1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const name = t.value;
            if (!monsterMap.has(name)) {
                text(`heart${i + 1}`, "");
                text(`effects${i + 1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const monster = monsterMap.get(name);
            const he = elem(`heart${i + 1}`);
            he.innerHTML = "";
            if (monster.target === null) {
                he.appendChild(document.createElement("span")).textContent = "------";
                he.appendChild(document.createElement("span")).textContent = "--";
                he.appendChild(document.createElement("span")).textContent = monster.name;
                he.appendChild(document.createElement("span")).textContent = "(ランク未指定)";
                text(`effects${i + 1}`, "");
                manualAdoptionHeartSet.hearts.push(null);
                continue;
            }
            const heart = monster.hearts.find(h => h.rank === monster.target);
            manualAdoptionHeartSet.hearts.push({ monster: monster, heart: heart });
            cost += heart.cost;
            additionalMaximumCost += heart.maximumCost;
            const colorSpan = he.appendChild(document.createElement("span"));
            showHeartColor(colorSpan, heart.color);
            he.appendChild(document.createElement("span")).textContent = `${heart.cost}`;
            const monsterName = (heart.rank === Rank.S_plus && monster.splusName !== null)
                ? monster.splusName : monster.name;
            he.appendChild(document.createElement("span")).textContent = monsterName;
            he.appendChild(document.createElement("span")).textContent = Rank[heart.rank].replace("_plus", "+");
            text(`effects${i + 1}`, heart.effects);
            const c = job.colors[i];
            status.maximumHP += MaximumHPScorer.calc(c, monster);
            status.maximumMP += MaximumMPScorer.calc(c, monster);
            status.power += PowerScorer.calc(c, monster);
            status.defence += DefenceScorer.calc(c, monster);
            status.attackMagic += AttackMagicScorer.calc(c, monster);
            status.recoverMagic += RecoverMagicScorer.calc(c, monster);
            status.speed += SpeedScorer.calc(c, monster);
            status.dexterity += DexterityScorer.calc(c, monster);
        }
        if (isNaN(maximumCost)) {
            text("cost", `${cost} / ??? + ${additionalMaximumCost}`);
            elem("cost").classList.remove("bold");
            manualAdoptionHeartSet.maximumCost = -1;
        }
        else {
            text("cost", `${cost} / ${maximumCost} + ${additionalMaximumCost}`);
            elem("cost").classList.remove("bold");
            if (asLimitCost) {
                if (cost > maximumCost) {
                    elem("cost").classList.add("bold");
                }
            }
            else if (cost > maximumCost + additionalMaximumCost) {
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
        setDT2ImportHeartsetList(DT2_KEY_IMPORT_TARGET_MANUALSET, [{
                jobName: manualAdoptionHeartSet.jobName,
                score: manualAdoptionHeartSet.score,
                maximumCost: manualAdoptionHeartSet.maximumCost,
                powerUp: manualAdoptionHeartSet.powerUp,
                colors: manualAdoptionHeartSet.colors.slice(),
                hearts: manualAdoptionHeartSet.hearts.slice() // シャローコピーで大丈夫ぽい
            }]);
        return;
    }
}
// マニュアルこころセットのフォームにて
// こころ枠1のこころが変更された場合の処理
document.getElementById("manualset_heart1_name")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    showManualHeartset();
});
// マニュアルこころセットのフォームにて
// こころ枠2のこころが変更された場合の処理
document.getElementById("manualset_heart2_name")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    showManualHeartset();
});
// マニュアルこころセットのフォームにて
// こころ枠3のこころが変更された場合の処理
document.getElementById("manualset_heart3_name")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    showManualHeartset();
});
// マニュアルこころセットのフォームにて
// こころ枠4のこころが変更された場合の処理
document.getElementById("manualset_heart4_name")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    showManualHeartset();
});
// マニュアルこころセットのフォームにて
// こころ最大コストが変更された場合の処理
document.getElementById("manualset_heart_maximum_cost")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("input", () => {
    showManualHeartset();
});
// マニュアルこころセットのフォームにて
// こころ最大コストの扱いが変更された場合の処理
document.getElementById("manualset_as_limit_heart_cost")
    // .addEventListener("blur", () => {
    // .addEventListener("focusout", () => {
    .addEventListener("change", () => {
    showManualHeartset();
});
let currentManualsetJobPresetMaximumCostId = 0;
function setManualsetJobPreset() {
    const sel = document.getElementById("manualset_job");
    const value = parseInt(sel.value ?? "0");
    for (const job of JobPreset) {
        if (job.id !== value) {
            continue;
        }
        if (job.id < currentManualsetJobPresetMaximumCostId || currentManualsetJobPresetMaximumCostId + 100 <= job.id) {
            const maximumCostList = document.getElementById("manualset_job_preset_maximum_cost_list");
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
            const e = document.getElementById(`manualset_heart${i + 1}`);
            e.innerHTML = "";
            let foundColor = false;
            if (i < job.colors.length) {
                const color = job.colors[i];
                for (const c of COLORS) {
                    if ((c & color) === 0) {
                        continue;
                    }
                    foundColor = true;
                    const info = SingleColorInfoMap.get(c);
                    const span = e.appendChild(document.createElement("span"));
                    span.classList.add(info.colorName);
                    span.textContent = info.text;
                }
            }
            const t = document.getElementById(`manualset_heart${i + 1}_name`);
            if (!foundColor) {
                e.textContent = "－";
                t.disabled = true;
            }
            else {
                t.disabled = false;
            }
        }
        document.getElementById("manualset_power_up").textContent = `${job.powerUp}`;
        return true;
    }
    return false;
}
// マニュアルこころセットのフォームにて
// 職業ごとのこころ枠の組み合わせをフォームに設定する
document.getElementById("manualset_job").addEventListener("change", () => {
    if (setManualsetJobPreset()) {
        showManualHeartset();
    }
    else {
        dialogAlert("Error");
    }
});
// マニュアルこころセットのフォームにて
// 初期値の職業のこころ枠の組み合わせをフォームに設定する
(function () {
    setManualsetJobPreset();
})();
// マニュアルこころセットのフォームをブラウザのセッションストレージに保存
function saveManualHeartsetForm() {
    if (DEBUG) {
        console.log("call saveManualHeartsetForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save to storage");
        }
        return;
    }
    try {
        const checked = (id) => document.getElementById(id).checked;
        const value = (id) => document.getElementById(id).value;
        const sel = (id) => document.getElementById(id).value;
        const data = {
            jobId: sel("manualset_job"),
            hearts: [
                value("manualset_heart1_name"),
                value("manualset_heart2_name"),
                value("manualset_heart3_name"),
                value("manualset_heart4_name")
            ],
            maximuCost: value("manualset_heart_maximum_cost"),
            asLimit: checked("manualset_as_limit_heart_cost")
        };
        const json = JSON.stringify(data);
        window.sessionStorage.setItem(STORAGE_KEY_MANUAL_HEAERTSET_FORM, json);
        if (DEBUG) {
            console.log("saved to storage");
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
// マニュアルこころセットのフォームをブラウザのセッションストレージから読み込む
function loadManualHeartsetForm() {
    if (DEBUG) {
        console.log("call saveManualHeartsetForm");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.sessionStorage.getItem(STORAGE_KEY_MANUAL_HEAERTSET_FORM);
        if (json !== null) {
            const checked = (id, c) => document.getElementById(id).checked = c;
            const value = (id, v) => document.getElementById(id).value = v;
            const sel = (id, v) => document.getElementById(id).value = v;
            const data = JSON.parse(json);
            sel("manualset_job", data.jobId);
            value("manualset_heart1_name", data.hearts[0]);
            value("manualset_heart2_name", data.hearts[1]);
            value("manualset_heart3_name", data.hearts[2]);
            value("manualset_heart4_name", data.hearts[3]);
            value("manualset_heart_maximum_cost", data.maximuCost);
            checked("manualset_as_limit_heart_cost", data.asLimit);
            if (setManualsetJobPreset()) {
                showManualHeartset();
            }
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
/////////////////////////////////////////////////////////////////////////////////////
// ダメージ計算ツール（雑） v2
/////////////////////////////////////////////////////////////////////////////////////
const DT2_ZOKUSEI_KIND_MAX = 8;
const DT2_MONSTER_KIND_MAX = 17;
const DT2_KEY_IMPORT_TARGET_SEARCH_RESULTS = "search-results";
const DT2_KEY_IMPORT_TARGET_MANUALSET = "manualset";
const DT2_KEY_IMPORT_TARGET_ADOPTION_LIST = "adoption-list";
const DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS = "reallyneeded-results";
const DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS = "reallyneeded-bests";
const DT2_ZOKUSEI_KIND_NAME_BY_ID = ["", "メラ", "ギラ", "ヒャド", "バギ", "デイン", "ジバリア", "イオ", "ドルマ"];
const DT2_MONSTER_KIND_NAME_BY_ID = [
    "", "スライム", "けもの", "ドラゴン", "虫", "鳥",
    "植物", "物質", "マシン", "ゾンビ", "悪魔",
    "エレメント", "怪人", "水", "？？？？",
    "特定モンスターX", "特定モンスターY", "特定モンスターZ"
];
let DT2SkillId = 0;
let DT2HeartsetStatusId = 0;
let DT2NonHeartsetStatusId = 0;
const DT2UniqCalcPair = new Map();
const DT2HeartsetListReference = new Map();
const DT2HeartsetByStatusId = new Map();
const DT2MemoExprImportZokuseiZantai = new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill("");
const DT2MemoExprImportZokuseiJumon = new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill("");
const DT2MemoExprImportZokuseiZokusei = new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill("");
const DT2MemoExprImportMonsterRate = new Array(DT2_MONSTER_KIND_MAX + 1).fill("");
function updateDT2ImportTargetIdOption() {
    const key = document.getElementById("damagetool2_zantai_heartset_target").value;
    const list = DT2HeartsetListReference.get(key) ?? [];
    const targetIdElem = document.getElementById("damagetool2_zantai_heartset_target_id");
    targetIdElem.innerHTML = "";
    if (list.length === 0 || list.every(hs => hs === null)) {
        const opt0 = targetIdElem.appendChild(document.createElement("option"));
        opt0.value = "-1";
        opt0.textContent = "-";
        return;
    }
    if (key === DT2_KEY_IMPORT_TARGET_MANUALSET) {
        const opt0 = targetIdElem.appendChild(document.createElement("option"));
        opt0.value = "0";
        opt0.textContent = "*";
        return;
    }
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item === null) {
            continue;
        }
        const opt = targetIdElem.appendChild(document.createElement("option"));
        opt.value = `${i}`;
        switch (key) {
            case DT2_KEY_IMPORT_TARGET_SEARCH_RESULTS:
                opt.textContent = `候補: ${i + 1}`;
                break;
            case DT2_KEY_IMPORT_TARGET_ADOPTION_LIST:
                opt.textContent = `[${i + 1} / ${list.length}] 候補: ${item.jobName}`;
                break;
            case DT2_KEY_IMPORT_TARGET_REALLYNEEDED_RESULTS:
                opt.textContent = `候補: ${i + 1} / ${list.length}`;
                break;
            case DT2_KEY_IMPORT_TARGET_REALLYNEEDED_BESTS:
                opt.textContent = `参考値${i + 1}`;
                break;
        }
    }
}
document.getElementById("damagetool2_zantai_heartset_target")
    .addEventListener("change", () => updateDT2ImportTargetIdOption());
function setDT2ImportHeartsetList(key, list) {
    DT2HeartsetListReference.set(key, list);
    const targetSel = document.getElementById("damagetool2_zantai_heartset_target").value;
    if (targetSel === key) {
        updateDT2ImportTargetIdOption();
    }
}
function makeDT2CalcPairKey(hsId, nhsId) {
    return `${hsId}-${nhsId}`;
}
function getDT2ImportSettingForm() {
    const sel = (id) => document.getElementById(id).value;
    const value = (id) => document.getElementById(id).value;
    const checked = (id) => document.getElementById(id).checked;
    const form = {
        powerUse: checked("damagetool2_zantai_import_power_use"),
        powerExpr: value("damagetool2_zantai_import_power_expr"),
        attackMagicUse: checked("damagetool2_zantai_import_attackmagic_use"),
        attackMagicExpr: value("damagetool2_zantai_import_attackmagic_expr"),
        skillZangekiUse: checked("damagetool2_zantai_import_skill_zangeki_use"),
        skillZangekiExpr: value("damagetool2_zantai_import_skill_zangeki_expr"),
        skillTaigiUse: checked("damagetool2_zantai_import_skill_taigi_use"),
        skillTaigiExpr: value("damagetool2_zantai_import_skill_taigi_expr"),
        skillZantaiUse: checked("damagetool2_zantai_import_skill_zantai_use"),
        skillZantaiExpr: value("damagetool2_zantai_import_skill_zantai_expr"),
        jumonUse: checked("damagetool2_zantai_import_jumon_use"),
        jumonExpr: value("damagetool2_zantai_import_jumon_expr"),
        zenzokuseiUse: checked("damagetool2_zantai_import_zenzokusei_use"),
        zenzokuseiExpr: value("damagetool2_zantai_import_zenzokusei_expr"),
        zokuseiKind: [
            sel("damagetool2_zantai_import_zokusei1_kind"),
            sel("damagetool2_zantai_import_zokusei2_kind"),
            sel("damagetool2_zantai_import_zokusei3_kind"),
            sel("damagetool2_zantai_import_zokusei4_kind")
        ],
        zokuseiZantaiUse: [
            checked("damagetool2_zantai_import_zokusei1_zantai_use"),
            checked("damagetool2_zantai_import_zokusei2_zantai_use"),
            checked("damagetool2_zantai_import_zokusei3_zantai_use"),
            checked("damagetool2_zantai_import_zokusei4_zantai_use")
        ],
        zokuseiZantaiExpr: [
            value("damagetool2_zantai_import_zokusei1_zantai_expr"),
            value("damagetool2_zantai_import_zokusei2_zantai_expr"),
            value("damagetool2_zantai_import_zokusei3_zantai_expr"),
            value("damagetool2_zantai_import_zokusei4_zantai_expr")
        ],
        zokuseiJumonUse: [
            checked("damagetool2_zantai_import_zokusei1_jumon_use"),
            checked("damagetool2_zantai_import_zokusei2_jumon_use"),
            checked("damagetool2_zantai_import_zokusei3_jumon_use"),
            checked("damagetool2_zantai_import_zokusei4_jumon_use")
        ],
        zokuseiJumonExpr: [
            value("damagetool2_zantai_import_zokusei1_jumon_expr"),
            value("damagetool2_zantai_import_zokusei2_jumon_expr"),
            value("damagetool2_zantai_import_zokusei3_jumon_expr"),
            value("damagetool2_zantai_import_zokusei4_jumon_expr")
        ],
        zokuseiZokuseiUse: [
            checked("damagetool2_zantai_import_zokusei1_zokusei_use"),
            checked("damagetool2_zantai_import_zokusei2_zokusei_use"),
            checked("damagetool2_zantai_import_zokusei3_zokusei_use"),
            checked("damagetool2_zantai_import_zokusei4_zokusei_use")
        ],
        zokuseiZokuseiExpr: [
            value("damagetool2_zantai_import_zokusei1_zokusei_expr"),
            value("damagetool2_zantai_import_zokusei2_zokusei_expr"),
            value("damagetool2_zantai_import_zokusei3_zokusei_expr"),
            value("damagetool2_zantai_import_zokusei4_zokusei_expr")
        ],
        monsterUse: [
            checked("damagetool2_zantai_import_monster1_use"),
            checked("damagetool2_zantai_import_monster2_use"),
            checked("damagetool2_zantai_import_monster3_use"),
            checked("damagetool2_zantai_import_monster4_use")
        ],
        monsterKind: [
            sel("damagetool2_zantai_import_monster1_kind"),
            sel("damagetool2_zantai_import_monster2_kind"),
            sel("damagetool2_zantai_import_monster3_kind"),
            sel("damagetool2_zantai_import_monster4_kind")
        ],
        monsterExpr: [
            value("damagetool2_zantai_import_monster1_expr"),
            value("damagetool2_zantai_import_monster2_expr"),
            value("damagetool2_zantai_import_monster3_expr"),
            value("damagetool2_zantai_import_monster4_expr")
        ],
        spskillUse: [
            checked("damagetool2_zantai_import_spskill1_use"),
            checked("damagetool2_zantai_import_spskill2_use"),
            checked("damagetool2_zantai_import_spskill3_use")
        ],
        spskillExpr: [
            value("damagetool2_zantai_import_spskill1_expr"),
            value("damagetool2_zantai_import_spskill2_expr"),
            value("damagetool2_zantai_import_spskill3_expr")
        ]
    };
    return form;
}
function fillDT2ImportSettingForm(form) {
    const sel = (id, v) => document.getElementById(id).value = v;
    const value = (id, v) => document.getElementById(id).value = v;
    const checked = (id, c) => document.getElementById(id).checked = c;
    checked("damagetool2_zantai_import_power_use", form.powerUse);
    value("damagetool2_zantai_import_power_expr", form.powerExpr);
    checked("damagetool2_zantai_import_attackmagic_use", form.attackMagicUse);
    value("damagetool2_zantai_import_attackmagic_expr", form.attackMagicExpr);
    checked("damagetool2_zantai_import_skill_zangeki_use", form.skillZangekiUse);
    value("damagetool2_zantai_import_skill_zangeki_expr", form.skillZangekiExpr);
    checked("damagetool2_zantai_import_skill_taigi_use", form.skillTaigiUse);
    value("damagetool2_zantai_import_skill_taigi_expr", form.skillTaigiExpr);
    checked("damagetool2_zantai_import_skill_zantai_use", form.skillZantaiUse);
    value("damagetool2_zantai_import_skill_zantai_expr", form.skillZantaiExpr);
    checked("damagetool2_zantai_import_jumon_use", form.jumonUse);
    value("damagetool2_zantai_import_jumon_expr", form.jumonExpr);
    checked("damagetool2_zantai_import_zenzokusei_use", form.zenzokuseiUse);
    value("damagetool2_zantai_import_zenzokusei_expr", form.zenzokuseiExpr);
    sel("damagetool2_zantai_import_zokusei1_kind", form.zokuseiKind[0]);
    sel("damagetool2_zantai_import_zokusei2_kind", form.zokuseiKind[1]);
    sel("damagetool2_zantai_import_zokusei3_kind", form.zokuseiKind[2]);
    sel("damagetool2_zantai_import_zokusei4_kind", form.zokuseiKind[3]);
    checked("damagetool2_zantai_import_zokusei1_zantai_use", form.zokuseiZantaiUse[0]);
    checked("damagetool2_zantai_import_zokusei2_zantai_use", form.zokuseiZantaiUse[1]);
    checked("damagetool2_zantai_import_zokusei3_zantai_use", form.zokuseiZantaiUse[2]);
    checked("damagetool2_zantai_import_zokusei4_zantai_use", form.zokuseiZantaiUse[3]);
    value("damagetool2_zantai_import_zokusei1_zantai_expr", form.zokuseiZantaiExpr[0]);
    value("damagetool2_zantai_import_zokusei2_zantai_expr", form.zokuseiZantaiExpr[1]);
    value("damagetool2_zantai_import_zokusei3_zantai_expr", form.zokuseiZantaiExpr[2]);
    value("damagetool2_zantai_import_zokusei4_zantai_expr", form.zokuseiZantaiExpr[3]);
    checked("damagetool2_zantai_import_zokusei1_jumon_use", form.zokuseiJumonUse[0]);
    checked("damagetool2_zantai_import_zokusei2_jumon_use", form.zokuseiJumonUse[1]);
    checked("damagetool2_zantai_import_zokusei3_jumon_use", form.zokuseiJumonUse[2]);
    checked("damagetool2_zantai_import_zokusei4_jumon_use", form.zokuseiJumonUse[3]);
    value("damagetool2_zantai_import_zokusei1_jumon_expr", form.zokuseiJumonExpr[0]);
    value("damagetool2_zantai_import_zokusei2_jumon_expr", form.zokuseiJumonExpr[1]);
    value("damagetool2_zantai_import_zokusei3_jumon_expr", form.zokuseiJumonExpr[2]);
    value("damagetool2_zantai_import_zokusei4_jumon_expr", form.zokuseiJumonExpr[3]);
    checked("damagetool2_zantai_import_zokusei1_zokusei_use", form.zokuseiZokuseiUse[0]);
    checked("damagetool2_zantai_import_zokusei2_zokusei_use", form.zokuseiZokuseiUse[1]);
    checked("damagetool2_zantai_import_zokusei3_zokusei_use", form.zokuseiZokuseiUse[2]);
    checked("damagetool2_zantai_import_zokusei4_zokusei_use", form.zokuseiZokuseiUse[3]);
    value("damagetool2_zantai_import_zokusei1_zokusei_expr", form.zokuseiZokuseiExpr[0]);
    value("damagetool2_zantai_import_zokusei2_zokusei_expr", form.zokuseiZokuseiExpr[1]);
    value("damagetool2_zantai_import_zokusei3_zokusei_expr", form.zokuseiZokuseiExpr[2]);
    value("damagetool2_zantai_import_zokusei4_zokusei_expr", form.zokuseiZokuseiExpr[3]);
    checked("damagetool2_zantai_import_monster1_use", form.monsterUse[0]);
    checked("damagetool2_zantai_import_monster2_use", form.monsterUse[1]);
    checked("damagetool2_zantai_import_monster3_use", form.monsterUse[2]);
    checked("damagetool2_zantai_import_monster4_use", form.monsterUse[3]);
    sel("damagetool2_zantai_import_monster1_kind", form.monsterKind[0]);
    sel("damagetool2_zantai_import_monster2_kind", form.monsterKind[1]);
    sel("damagetool2_zantai_import_monster3_kind", form.monsterKind[2]);
    sel("damagetool2_zantai_import_monster4_kind", form.monsterKind[3]);
    value("damagetool2_zantai_import_monster1_expr", form.monsterExpr[0]);
    value("damagetool2_zantai_import_monster2_expr", form.monsterExpr[1]);
    value("damagetool2_zantai_import_monster3_expr", form.monsterExpr[2]);
    value("damagetool2_zantai_import_monster4_expr", form.monsterExpr[3]);
    checked("damagetool2_zantai_import_spskill1_use", form.spskillUse[0]);
    checked("damagetool2_zantai_import_spskill2_use", form.spskillUse[1]);
    checked("damagetool2_zantai_import_spskill3_use", form.spskillUse[2]);
    value("damagetool2_zantai_import_spskill1_expr", form.spskillExpr[0]);
    value("damagetool2_zantai_import_spskill2_expr", form.spskillExpr[1]);
    value("damagetool2_zantai_import_spskill3_expr", form.spskillExpr[2]);
}
function isValidDT2ImportSettingForm(data) {
    if (typeof data !== "object" || data === null) {
        console.log("object型じゃない");
        console.log(data);
        return false;
    }
    const obj1 = data; // TSでここキャストできる理由わからない(JS的には意味の無い代入だな、型情報があるわけじゃないし)
    const listSingleField = [
        "power", "attackMagic",
        "skillZangeki", "skillTaigi", "skillZantai",
        "jumon", "zenzokusei"
    ];
    for (const field of listSingleField) {
        const b = field + "Use";
        if (!(b in obj1) || typeof obj1[b] !== "boolean") {
            return false;
        }
        const s = field + "Expr";
        if (!(s in obj1) || typeof obj1[s] !== "string") {
            return false;
        }
    }
    const listArrayField = [
        ["zokuseiZantai", 4], ["zokuseiJumon", 4], ["zokuseiZokusei", 4],
        ["monster", 4], ["spskill", 3]
    ];
    for (const field of listArrayField) {
        const b = field[0] + "Use";
        if (!(b in obj1) || !Array.isArray(obj1[b])) {
            return false;
        }
        else {
            const list = obj1[b];
            if (list.length !== field[1] || !list.every(x => typeof x === "boolean")) {
                return false;
            }
        }
        const s = field[0] + "Expr";
        if (!(s in obj1) || !Array.isArray(obj1[s])) {
            return false;
        }
        else {
            const list = obj1[s];
            if (list.length !== field[1] || !list.every(x => typeof x === "string")) {
                return false;
            }
        }
    }
    const listKindField = [["zokuseiKind", DT2_ZOKUSEI_KIND_MAX], ["monsterKind", DT2_MONSTER_KIND_MAX]];
    for (const field of listKindField) {
        const f = field[0];
        if (!(f in obj1) || !Array.isArray(obj1[f])) {
            return false;
        }
        const list = obj1[f];
        if (list.length !== 4 || !list.every(x => typeof x === "string")) {
            return false;
        }
        if (!list.map(s => parseInt(s)).every(n => !isNaN(n) && 1 <= n && n <= field[1])) {
            return false;
        }
    }
    return true;
}
function updateDT2MemoExpr(form) {
    let updated = false;
    for (let i = 0; i < form.zokuseiKind.length; i++) {
        const zk = parseInt(form.zokuseiKind[i]);
        if (form.zokuseiZantaiUse[i]) {
            const expr = form.zokuseiZantaiExpr[i].trim();
            if (expr.length > 0) {
                const oldExpr = DT2MemoExprImportZokuseiZantai[zk];
                if (oldExpr !== expr) {
                    DT2MemoExprImportZokuseiZantai[zk] = expr;
                    updated = true;
                }
            }
        }
        if (form.zokuseiJumonUse[i]) {
            const expr = form.zokuseiJumonExpr[i].trim();
            if (expr.length > 0) {
                const oldExpr = DT2MemoExprImportZokuseiJumon[zk];
                if (oldExpr !== expr) {
                    DT2MemoExprImportZokuseiJumon[zk] = expr;
                    updated = true;
                }
            }
        }
        if (form.zokuseiZokuseiUse[i]) {
            const expr = form.zokuseiZokuseiExpr[i].trim();
            if (expr.length > 0) {
                const oldExpr = DT2MemoExprImportZokuseiZokusei[zk];
                if (oldExpr !== expr) {
                    DT2MemoExprImportZokuseiZokusei[zk] = expr;
                    updated = true;
                }
            }
        }
    }
    for (let i = 0; i < form.monsterKind.length; i++) {
        if (!form.monsterUse[i]) {
            continue;
        }
        const mk = parseInt(form.monsterKind[i]);
        const oldExpr = DT2MemoExprImportMonsterRate[mk];
        const expr = form.monsterExpr[i].trim();
        if (expr.length > 0 && oldExpr !== expr) {
            DT2MemoExprImportMonsterRate[mk] = expr;
            updated = true;
        }
    }
    return updated;
}
function getDT2StatusFormList(listId) {
    if (DEBUG) {
        console.log(`call getDT2StatusFormList(${listId})`);
    }
    const list = document.getElementById(listId);
    const items = list.querySelectorAll(":scope > .outline");
    const result = [];
    for (const item of items) {
        const sel = (cn) => item.querySelector(`:scope .${cn}`).value;
        const value = (cn) => item.querySelector(`:scope .${cn}`).value;
        const form = {
            id: item.querySelector(":scope .damagetool2-zantai-set-id").textContent ?? "",
            name: value("damagetool2-zantai-set-name"),
            power: value("damagetool2-zantai-set-power"),
            attackMagic: value("damagetool2-zantai-set-attackmagic"),
            skillZan: value("damagetool2-zantai-set-skill-zangeki"),
            skillTai: value("damagetool2-zantai-set-skill-taigi"),
            skillZantai: value("damagetool2-zantai-set-skill-zantai"),
            jumon: value("damagetool2-zantai-set-jumon"),
            zenzokusei: value("damagetool2-zantai-set-zenzokusei"),
            zokuseiKind: [
                sel("damagetool2-zantai-set-zokusei1-kind"),
                sel("damagetool2-zantai-set-zokusei2-kind"),
                sel("damagetool2-zantai-set-zokusei3-kind"),
                sel("damagetool2-zantai-set-zokusei4-kind")
            ],
            zokuseiZantai: [
                value("damagetool2-zantai-set-zokusei1-zantai"),
                value("damagetool2-zantai-set-zokusei2-zantai"),
                value("damagetool2-zantai-set-zokusei3-zantai"),
                value("damagetool2-zantai-set-zokusei4-zantai")
            ],
            zokuseiJumon: [
                value("damagetool2-zantai-set-zokusei1-jumon"),
                value("damagetool2-zantai-set-zokusei2-jumon"),
                value("damagetool2-zantai-set-zokusei3-jumon"),
                value("damagetool2-zantai-set-zokusei4-jumon")
            ],
            zokuseiZokusei: [
                value("damagetool2-zantai-set-zokusei1-zokusei"),
                value("damagetool2-zantai-set-zokusei2-zokusei"),
                value("damagetool2-zantai-set-zokusei3-zokusei"),
                value("damagetool2-zantai-set-zokusei4-zokusei")
            ],
            monsterKind: [
                sel("damagetool2-zantai-set-monster1-kind"),
                sel("damagetool2-zantai-set-monster2-kind"),
                sel("damagetool2-zantai-set-monster3-kind"),
                sel("damagetool2-zantai-set-monster4-kind")
            ],
            monsterRate: [
                value("damagetool2-zantai-set-monster1-rate"),
                value("damagetool2-zantai-set-monster2-rate"),
                value("damagetool2-zantai-set-monster3-rate"),
                value("damagetool2-zantai-set-monster4-rate")
            ],
            spskill: [
                value("damagetool2-zantai-set-spskill1"),
                value("damagetool2-zantai-set-spskill2"),
                value("damagetool2-zantai-set-spskill3")
            ]
        };
        result.push(form);
    }
    return result;
}
function parseDT2StatusForms(formList) {
    const result = [];
    const toInt = (s) => {
        const n = parseInt(s);
        return isNaN(n) ? 0 : n;
    };
    for (const form of formList) {
        const zokuseiKind = form.zokuseiKind.map(toInt);
        const monsterKind = form.monsterKind.map(toInt);
        const zokuseiF = (arr, v, i) => {
            arr[zokuseiKind[i]] += toInt(v);
            return arr;
        };
        const monsterF = (arr, v, i) => {
            arr[monsterKind[i]] += toInt(v);
            return arr;
        };
        const status = {
            id: form.id,
            name: form.name,
            power: toInt(form.power),
            attackMagic: toInt(form.attackMagic),
            skillZan: toInt(form.skillZan),
            skillTai: toInt(form.skillTai),
            skillZantai: toInt(form.skillZantai),
            jumon: toInt(form.jumon),
            zenzokusei: toInt(form.zenzokusei),
            zokuseiZantai: form.zokuseiZantai.reduce(zokuseiF, new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0)),
            zokuseiJumon: form.zokuseiJumon.reduce(zokuseiF, new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0)),
            zokuseiZokusei: form.zokuseiZokusei.reduce(zokuseiF, new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0)),
            monsterRate: form.monsterRate.reduce(monsterF, new Array(DT2_MONSTER_KIND_MAX + 1).fill(0)),
            spskill: [0].concat(form.spskill.map(toInt))
        };
        result.push(status);
    }
    return result;
}
function putDT2StatusFormList(targetIsNonHeartSet, formList) {
    const listId = targetIsNonHeartSet
        ? "damagetool2_zantai_non_heartset_status_list"
        : "damagetool2_zantai_heartset_status_list";
    const list = document.getElementById(listId);
    const calcPairSelId = targetIsNonHeartSet
        ? "damagetool2_zantai_calc_pair_from_non_heartset"
        : "damagetool2_zantai_calc_pair_from_heartset";
    const calcPairSel = document.getElementById(calcPairSelId);
    for (const form of formList) {
        const template = document.getElementById("damagetool2_zantai_set_template");
        const fragment = template.content.cloneNode(true);
        const sel = (cn, value) => fragment.querySelector(`:scope .${cn}`).value = value;
        const value = (cn, value) => fragment.querySelector(`:scope .${cn}`).value = value;
        fragment.querySelector(":scope .damagetool2-zantai-set-id").textContent = form.id;
        value("damagetool2-zantai-set-name", form.name);
        value("damagetool2-zantai-set-power", form.power);
        value("damagetool2-zantai-set-attackmagic", form.attackMagic);
        value("damagetool2-zantai-set-skill-zangeki", form.skillZan);
        value("damagetool2-zantai-set-skill-taigi", form.skillTai);
        value("damagetool2-zantai-set-skill-zantai", form.skillZantai);
        value("damagetool2-zantai-set-jumon", form.jumon);
        value("damagetool2-zantai-set-zenzokusei", form.zenzokusei);
        sel("damagetool2-zantai-set-zokusei1-kind", form.zokuseiKind[0]);
        sel("damagetool2-zantai-set-zokusei2-kind", form.zokuseiKind[1]);
        sel("damagetool2-zantai-set-zokusei3-kind", form.zokuseiKind[2]);
        sel("damagetool2-zantai-set-zokusei4-kind", form.zokuseiKind[3]);
        value("damagetool2-zantai-set-zokusei1-zantai", form.zokuseiZantai[0]);
        value("damagetool2-zantai-set-zokusei2-zantai", form.zokuseiZantai[1]);
        value("damagetool2-zantai-set-zokusei3-zantai", form.zokuseiZantai[2]);
        value("damagetool2-zantai-set-zokusei4-zantai", form.zokuseiZantai[3]);
        value("damagetool2-zantai-set-zokusei1-jumon", form.zokuseiJumon[0]);
        value("damagetool2-zantai-set-zokusei2-jumon", form.zokuseiJumon[1]);
        value("damagetool2-zantai-set-zokusei3-jumon", form.zokuseiJumon[2]);
        value("damagetool2-zantai-set-zokusei4-jumon", form.zokuseiJumon[3]);
        value("damagetool2-zantai-set-zokusei1-zokusei", form.zokuseiZokusei[0]);
        value("damagetool2-zantai-set-zokusei2-zokusei", form.zokuseiZokusei[1]);
        value("damagetool2-zantai-set-zokusei3-zokusei", form.zokuseiZokusei[2]);
        value("damagetool2-zantai-set-zokusei4-zokusei", form.zokuseiZokusei[3]);
        sel("damagetool2-zantai-set-monster1-kind", form.monsterKind[0]);
        sel("damagetool2-zantai-set-monster2-kind", form.monsterKind[1]);
        sel("damagetool2-zantai-set-monster3-kind", form.monsterKind[2]);
        sel("damagetool2-zantai-set-monster4-kind", form.monsterKind[3]);
        value("damagetool2-zantai-set-monster1-rate", form.monsterRate[0]);
        value("damagetool2-zantai-set-monster2-rate", form.monsterRate[1]);
        value("damagetool2-zantai-set-monster3-rate", form.monsterRate[2]);
        value("damagetool2-zantai-set-monster4-rate", form.monsterRate[3]);
        value("damagetool2-zantai-set-spskill1", form.spskill[0]);
        value("damagetool2-zantai-set-spskill2", form.spskill[1]);
        value("damagetool2-zantai-set-spskill3", form.spskill[2]);
        list.appendChild(fragment);
        const opt = calcPairSel.appendChild(document.createElement("option"));
        opt.value = form.id;
        opt.textContent = form.name;
        const cnCpStatusId = targetIsNonHeartSet
            ? "damagetool2-zantai-calc-pair-non-heartset-status-id"
            : "damagetool2-zantai-calc-pair-heartset-status-id";
        const cnCpStatusName = targetIsNonHeartSet
            ? "damagetool2-zantai-calc-pair-non-heartset-status-name"
            : "damagetool2-zantai-calc-pair-heartset-status-name";
        const nameElem = list.lastElementChild.querySelector(":scope .damagetool2-zantai-set-name");
        nameElem.addEventListener("input", () => {
            opt.textContent = nameElem.value;
            const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
            const cpItems = cpList.querySelectorAll(":scope > .outline");
            for (const item of cpItems) {
                const cpId = item.querySelector(`:scope .${cnCpStatusId}`).textContent;
                if (cpId === opt.value) {
                    item.querySelector(`:scope .${cnCpStatusName}`).textContent = nameElem.value;
                }
            }
        });
        if (DT2HeartsetByStatusId.has(form.id)) {
            const heartset = DT2HeartsetByStatusId.get(form.id);
            const viewButton = nameElem.parentElement.parentElement.appendChild(document.createElement("button"));
            viewButton.classList.add("small");
            viewButton.textContent = "こころセットの確認";
            viewButton.addEventListener("click", () => {
                showHeartsetViewDialog(heartset, `セット名: ${nameElem.value}`);
            });
        }
    }
}
function getDT2SkillFormList() {
    const list = document.getElementById("damagetool2_zantai_skill_list");
    const items = list.querySelectorAll(":scope > .outline");
    const result = [];
    for (const item of items) {
        const sel = (cn) => item.querySelector(`:scope .${cn}`).value;
        const value = (cn) => item.querySelector(`:scope .${cn}`).value;
        const checked = (cn) => item.querySelector(`:scope .${cn}`).checked;
        const form = {
            name: value("damagetool2-zantai-skill-name"),
            spskill: sel("damagetool2-zantai-skill-spskill"),
            restrictMonsterUse: checked("damagetool2-zantai-skill-restrict-monster-use"),
            restrictMonsterKind: sel("damagetool2-zantai-skill-restrict-monster-kind"),
            restrictMonsterIsOnly: sel("damagetool2-zantai-skill-restrict-monster-is-only"),
            attackUse: [
                checked("damagetool2-zantai-skill-attack1-use"),
                checked("damagetool2-zantai-skill-attack2-use"),
                checked("damagetool2-zantai-skill-attack3-use"),
                checked("damagetool2-zantai-skill-attack4-use"),
                checked("damagetool2-zantai-skill-attack5-use")
            ],
            attackKind: [
                sel("damagetool2-zantai-skill-attack1-kind"),
                sel("damagetool2-zantai-skill-attack2-kind"),
                sel("damagetool2-zantai-skill-attack3-kind"),
                sel("damagetool2-zantai-skill-attack4-kind"),
                sel("damagetool2-zantai-skill-attack5-kind")
            ],
            attackType: [
                sel("damagetool2-zantai-skill-attack1-type"),
                sel("damagetool2-zantai-skill-attack2-type"),
                sel("damagetool2-zantai-skill-attack3-type"),
                sel("damagetool2-zantai-skill-attack4-type"),
                sel("damagetool2-zantai-skill-attack5-type")
            ],
            attackRate: [
                value("damagetool2-zantai-skill-attack1-rate"),
                value("damagetool2-zantai-skill-attack2-rate"),
                value("damagetool2-zantai-skill-attack3-rate"),
                value("damagetool2-zantai-skill-attack4-rate"),
                value("damagetool2-zantai-skill-attack5-rate")
            ],
            attackRepeat: [
                value("damagetool2-zantai-skill-attack1-repeat"),
                value("damagetool2-zantai-skill-attack2-repeat"),
                value("damagetool2-zantai-skill-attack3-repeat"),
                value("damagetool2-zantai-skill-attack4-repeat"),
                value("damagetool2-zantai-skill-attack5-repeat")
            ],
            idReference: value("damagetool2-zantai-skill-id-reference")
        };
        result.push(form);
    }
    return result;
}
function parseDT2SkillForms(formList) {
    const result = [];
    const toInt = (s) => {
        const n = parseInt(s);
        return isNaN(n) ? 0 : n;
    };
    for (const form of formList) {
        const skill = {
            name: form.name,
            spskill: toInt(form.spskill),
            restrictMonsterUse: form.restrictMonsterUse,
            restrictMonsterKind: toInt(form.restrictMonsterKind),
            restrictMonsterIsOnly: form.restrictMonsterIsOnly === "1",
            attackUse: form.attackUse,
            attackKind: form.attackKind.map(toInt),
            attackType: form.attackType.map(toInt),
            attackRate: form.attackRate.map(toInt),
            attackRepeat: form.attackRepeat.map(toInt),
            idReference: form.idReference.split(/\s+/).filter(s => s.length !== 0)
        };
        result.push(skill);
    }
    return result;
}
function putDT2SkillFormList(formList) {
    const list = document.getElementById("damagetool2_zantai_skill_list");
    for (const form of formList) {
        const template = document.getElementById("damagetool2_zantai_skill_template");
        const fragment = template.content.cloneNode(true);
        const sel = (cn, v) => fragment.querySelector(`:scope .${cn}`).value = v;
        const value = (cn, v) => fragment.querySelector(`:scope .${cn}`).value = v;
        const checked = (cn, b) => fragment.querySelector(`:scope .${cn}`).checked = b;
        value("damagetool2-zantai-skill-name", form.name);
        sel("damagetool2-zantai-skill-spskill", form.spskill);
        checked("damagetool2-zantai-skill-restrict-monster-use", form.restrictMonsterUse);
        sel("damagetool2-zantai-skill-restrict-monster-kind", form.restrictMonsterKind);
        sel("damagetool2-zantai-skill-restrict-monster-is-only", form.restrictMonsterIsOnly);
        checked("damagetool2-zantai-skill-attack1-use", form.attackUse[0]);
        checked("damagetool2-zantai-skill-attack2-use", form.attackUse[1]);
        checked("damagetool2-zantai-skill-attack3-use", form.attackUse[2]);
        checked("damagetool2-zantai-skill-attack4-use", form.attackUse[3]);
        checked("damagetool2-zantai-skill-attack5-use", form.attackUse[4]);
        sel("damagetool2-zantai-skill-attack1-kind", form.attackKind[0]);
        sel("damagetool2-zantai-skill-attack2-kind", form.attackKind[1]);
        sel("damagetool2-zantai-skill-attack3-kind", form.attackKind[2]);
        sel("damagetool2-zantai-skill-attack4-kind", form.attackKind[3]);
        sel("damagetool2-zantai-skill-attack5-kind", form.attackKind[4]);
        sel("damagetool2-zantai-skill-attack1-type", form.attackType[0]);
        sel("damagetool2-zantai-skill-attack2-type", form.attackType[1]);
        sel("damagetool2-zantai-skill-attack3-type", form.attackType[2]);
        sel("damagetool2-zantai-skill-attack4-type", form.attackType[3]);
        sel("damagetool2-zantai-skill-attack5-type", form.attackType[4]);
        value("damagetool2-zantai-skill-attack1-rate", form.attackRate[0]);
        value("damagetool2-zantai-skill-attack2-rate", form.attackRate[1]);
        value("damagetool2-zantai-skill-attack3-rate", form.attackRate[2]);
        value("damagetool2-zantai-skill-attack4-rate", form.attackRate[3]);
        value("damagetool2-zantai-skill-attack5-rate", form.attackRate[4]);
        value("damagetool2-zantai-skill-attack1-repeat", form.attackRepeat[0]);
        value("damagetool2-zantai-skill-attack2-repeat", form.attackRepeat[1]);
        value("damagetool2-zantai-skill-attack3-repeat", form.attackRepeat[2]);
        value("damagetool2-zantai-skill-attack4-repeat", form.attackRepeat[3]);
        value("damagetool2-zantai-skill-attack5-repeat", form.attackRepeat[4]);
        value("damagetool2-zantai-skill-id-reference", form.idReference);
        list.appendChild(fragment);
    }
}
function getDT2ExpandedCalcPairList() {
    const hsList = getDT2StatusFormList("damagetool2_zantai_heartset_status_list");
    const nhsList = getDT2StatusFormList("damagetool2_zantai_non_heartset_status_list");
    const list = document.getElementById("damagetool2_zantai_calc_pair_list");
    const items = list.querySelectorAll(":scope > .outline");
    const result = [];
    if (items.length === 0) {
        for (const hs of hsList) {
            for (const nhs of nhsList) {
                const pair = {
                    heartsetStatusId: hs.id,
                    heartsetStatusName: hs.name,
                    nonHeartsetStatusId: nhs.id,
                    nonHeartsetStatusName: nhs.name
                };
                result.push(pair);
            }
        }
        return result;
    }
    const dup = new Map();
    for (const item of items) {
        const text = (cn) => (item.querySelector(`:scope .${cn}`).textContent ?? "");
        const hsId = text("damagetool2-zantai-calc-pair-heartset-status-id");
        const hsName = text("damagetool2-zantai-calc-pair-heartset-status-name");
        const nhsId = text("damagetool2-zantai-calc-pair-non-heartset-status-id");
        const nhsName = text("damagetool2-zantai-calc-pair-non-heartset-status-name");
        const keyX = makeDT2CalcPairKey(hsId, nhsId);
        if (dup.has(keyX)) {
            continue;
        }
        if (hsId === "*" && nhsId === "*") {
            for (const hs of hsList) {
                for (const nhs of nhsList) {
                    const key = makeDT2CalcPairKey(hs.id, nhs.id);
                    if (!dup.has(key)) {
                        const pair = {
                            heartsetStatusId: hs.id,
                            heartsetStatusName: hs.name,
                            nonHeartsetStatusId: nhs.id,
                            nonHeartsetStatusName: nhs.name
                        };
                        result.push(pair);
                        dup.set(key, true);
                    }
                }
            }
        }
        else if (hsId === "*") {
            for (const hs of hsList) {
                const key = makeDT2CalcPairKey(hs.id, nhsId);
                if (!dup.has(key)) {
                    const pair = {
                        heartsetStatusId: hs.id,
                        heartsetStatusName: hs.name,
                        nonHeartsetStatusId: nhsId,
                        nonHeartsetStatusName: nhsName
                    };
                    result.push(pair);
                    dup.set(key, true);
                }
            }
        }
        else if (nhsId === "*") {
            for (const nhs of nhsList) {
                const key = makeDT2CalcPairKey(hsId, nhs.id);
                if (!dup.has(key)) {
                    const pair = {
                        heartsetStatusId: hsId,
                        heartsetStatusName: hsName,
                        nonHeartsetStatusId: nhs.id,
                        nonHeartsetStatusName: nhs.name
                    };
                    result.push(pair);
                    dup.set(key, true);
                }
            }
        }
        else {
            const pair = {
                heartsetStatusId: hsId,
                heartsetStatusName: hsName,
                nonHeartsetStatusId: nhsId,
                nonHeartsetStatusName: nhsName
            };
            result.push(pair);
        }
        dup.set(keyX, true);
    }
    return result;
}
function getDT2RawCalcPairList() {
    const list = document.getElementById("damagetool2_zantai_calc_pair_list");
    const items = list.querySelectorAll(":scope > .outline");
    const result = [];
    for (const item of items) {
        const text = (cn) => (item.querySelector(`:scope .${cn}`).textContent ?? "");
        const hsId = text("damagetool2-zantai-calc-pair-heartset-status-id");
        const hsName = text("damagetool2-zantai-calc-pair-heartset-status-name");
        const nhsId = text("damagetool2-zantai-calc-pair-non-heartset-status-id");
        const nhsName = text("damagetool2-zantai-calc-pair-non-heartset-status-name");
        const pair = {
            heartsetStatusId: hsId,
            heartsetStatusName: hsName,
            nonHeartsetStatusId: nhsId,
            nonHeartsetStatusName: nhsName
        };
        result.push(pair);
    }
    return result;
}
function putDT2RawCalcPairList(calcPairList) {
    const list = document.getElementById("damagetool2_zantai_calc_pair_list");
    for (const item of calcPairList) {
        const hsId = item.heartsetStatusId;
        const hsName = item.heartsetStatusName;
        const nhsId = item.nonHeartsetStatusId;
        const nhsName = item.nonHeartsetStatusName;
        const key = makeDT2CalcPairKey(hsId, nhsId);
        DT2UniqCalcPair.set(key, true);
        const template = document.getElementById("damagetool2_zantai_calc_pair_template");
        const fragment = template.content.cloneNode(true);
        const text = (cn, t) => fragment.querySelector(`:scope .${cn}`).textContent = t;
        text("damagetool2-zantai-calc-pair-heartset-status-id", hsId);
        text("damagetool2-zantai-calc-pair-heartset-status-name", hsName);
        text("damagetool2-zantai-calc-pair-non-heartset-status-id", nhsId);
        text("damagetool2-zantai-calc-pair-non-heartset-status-name", nhsName);
        list.appendChild(fragment);
    }
}
function getDT2DamgeupRateFormList() {
    const result = [];
    const list = document.getElementById("damagetool2_zantai_damageup_rate_list");
    const items = list.querySelectorAll(":scope > .outline");
    for (const item of items) {
        const sel = (cn) => item.querySelector(`:scope .${cn}`).value;
        const value = (cn) => item.querySelector(`:scope .${cn}`).value;
        const form = {
            zan: value("damagetool2-zantai-damageup-rate-zangeki"),
            tai: value("damagetool2-zantai-damageup-rate-taigi"),
            zantai: value("damagetool2-zantai-damageup-rate-zantai"),
            zokuseiKind: [
                sel("damagetool2-zantai-damageup-rate-zokusei1-kind"),
                sel("damagetool2-zantai-damageup-rate-zokusei2-kind"),
                sel("damagetool2-zantai-damageup-rate-zokusei3-kind"),
                sel("damagetool2-zantai-damageup-rate-zokusei4-kind")
            ],
            zokuseiRate: [
                value("damagetool2-zantai-damageup-rate-zokusei1-rate"),
                value("damagetool2-zantai-damageup-rate-zokusei2-rate"),
                value("damagetool2-zantai-damageup-rate-zokusei3-rate"),
                value("damagetool2-zantai-damageup-rate-zokusei4-rate")
            ],
            monsterKind: [
                sel("damagetool2-zantai-damageup-rate-monster1-kind"),
                sel("damagetool2-zantai-damageup-rate-monster2-kind"),
                sel("damagetool2-zantai-damageup-rate-monster3-kind"),
                sel("damagetool2-zantai-damageup-rate-monster4-kind")
            ],
            monsterRate: [
                value("damagetool2-zantai-damageup-rate-monster1-rate"),
                value("damagetool2-zantai-damageup-rate-monster2-rate"),
                value("damagetool2-zantai-damageup-rate-monster3-rate"),
                value("damagetool2-zantai-damageup-rate-monster4-rate")
            ],
            idReference: value("damagetool2-zantai-damageup-rate-id-reference")
        };
        result.push(form);
    }
    return result;
}
function parseDt2DamgeupRateForms(formList) {
    const result = [];
    const toInt = (s, d) => {
        const n = parseInt(s);
        return isNaN(n) ? d : n;
    };
    for (const form of formList) {
        const rate = {
            zan: toInt(form.zan, 100) - 100,
            tai: toInt(form.tai, 100) - 100,
            zantai: toInt(form.zantai, 100) - 100,
            zokuseiRate: form.zokuseiKind.reduce((a, k, i) => {
                a[toInt(k, 0)] += toInt(form.zokuseiRate[i], 100) - 100;
                return a;
            }, new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0)),
            monsterRate: form.monsterKind.reduce((a, k, i) => {
                a[toInt(k, 0)] += toInt(form.monsterRate[i], 100) - 100;
                return a;
            }, new Array(DT2_MONSTER_KIND_MAX + 1).fill(0)),
            idReference: form.idReference.split(/\s+/).filter(s => s.length !== 0)
        };
        result.push(rate);
    }
    return result;
}
function getDT2DamageupRate(list, hsId, nhsId) {
    const result = {
        zan: 0,
        tai: 0,
        zantai: 0,
        zokuseiRate: new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0),
        monsterRate: new Array(DT2_MONSTER_KIND_MAX + 1).fill(0),
        idReference: []
    };
    for (const dmupRate of list) {
        if ((dmupRate.idReference.length !== 0)
            && !dmupRate.idReference.includes(hsId)
            && !dmupRate.idReference.includes(nhsId)) {
            continue;
        }
        result.zan += dmupRate.zan;
        result.tai += dmupRate.tai;
        result.zantai += dmupRate.zantai;
        for (let i = 0; i < result.zokuseiRate.length; i++) {
            result.zokuseiRate[i] += dmupRate.zokuseiRate[i];
        }
        for (let i = 0; i < result.monsterRate.length; i++) {
            result.monsterRate[i] += dmupRate.monsterRate[i];
        }
    }
    return result;
}
function putDT2DamgeupRateFormList(formList) {
    const list = document.getElementById("damagetool2_zantai_damageup_rate_list");
    for (const form of formList) {
        const template = document.getElementById("damagetool2_zantai_damageup_rate_template");
        const fragment = template.content.cloneNode(true);
        const sel = (cn, v) => fragment.querySelector(`:scope .${cn}`).value = v;
        const value = (cn, v) => fragment.querySelector(`:scope .${cn}`).value = v;
        value("damagetool2-zantai-damageup-rate-zangeki", form.zan);
        value("damagetool2-zantai-damageup-rate-taigi", form.tai);
        value("damagetool2-zantai-damageup-rate-zantai", form.zantai);
        sel("damagetool2-zantai-damageup-rate-zokusei1-kind", form.zokuseiKind[0]);
        sel("damagetool2-zantai-damageup-rate-zokusei2-kind", form.zokuseiKind[1]);
        sel("damagetool2-zantai-damageup-rate-zokusei3-kind", form.zokuseiKind[2]);
        sel("damagetool2-zantai-damageup-rate-zokusei4-kind", form.zokuseiKind[3]);
        value("damagetool2-zantai-damageup-rate-zokusei1-rate", form.zokuseiRate[0]);
        value("damagetool2-zantai-damageup-rate-zokusei2-rate", form.zokuseiRate[1]);
        value("damagetool2-zantai-damageup-rate-zokusei3-rate", form.zokuseiRate[2]);
        value("damagetool2-zantai-damageup-rate-zokusei4-rate", form.zokuseiRate[3]);
        sel("damagetool2-zantai-damageup-rate-monster1-kind", form.monsterKind[0]);
        sel("damagetool2-zantai-damageup-rate-monster2-kind", form.monsterKind[1]);
        sel("damagetool2-zantai-damageup-rate-monster3-kind", form.monsterKind[2]);
        sel("damagetool2-zantai-damageup-rate-monster4-kind", form.monsterKind[3]);
        value("damagetool2-zantai-damageup-rate-monster1-rate", form.monsterRate[0]);
        value("damagetool2-zantai-damageup-rate-monster2-rate", form.monsterRate[1]);
        value("damagetool2-zantai-damageup-rate-monster3-rate", form.monsterRate[2]);
        value("damagetool2-zantai-damageup-rate-monster4-rate", form.monsterRate[3]);
        value("damagetool2-zantai-damageup-rate-id-reference", form.idReference);
        list.appendChild(fragment);
    }
}
function getDT2CalcSettingForm() {
    const sel = (id) => document.getElementById(id).value;
    const value = (id) => document.getElementById(id).value;
    const checked = (id) => document.getElementById(id).checked;
    const result = {
        wrZan: value("damagetool2_zantai_calc_setting_weak_resist_zan"),
        wrTai: value("damagetool2_zantai_calc_setting_weak_resist_tai"),
        wrZantai: value("damagetool2_zantai_calc_setting_weak_resist_zantai"),
        wrZokuseiKind: [
            sel("damagetool2_zantai_calc_setting_weak_resist_zokusei1_kind"),
            sel("damagetool2_zantai_calc_setting_weak_resist_zokusei2_kind"),
            sel("damagetool2_zantai_calc_setting_weak_resist_zokusei3_kind"),
            sel("damagetool2_zantai_calc_setting_weak_resist_zokusei4_kind")
        ],
        wrZokuseiRate: [
            value("damagetool2_zantai_calc_setting_weak_resist_zokusei1_rate"),
            value("damagetool2_zantai_calc_setting_weak_resist_zokusei2_rate"),
            value("damagetool2_zantai_calc_setting_weak_resist_zokusei3_rate"),
            value("damagetool2_zantai_calc_setting_weak_resist_zokusei4_rate")
        ],
        targetMonsterKind: sel("damagetool2_zantai_calc_target_monster"),
        showNormalAttack: checked("damagetool2_zantai_calc_setting_show_normal_attack")
    };
    return result;
}
function parseDT2CalcSettingForm(form) {
    const toInt = (s, d) => {
        const n = parseInt(s);
        return isNaN(n) ? d : n;
    };
    const result = {
        wrZan: toInt(form.wrZan, 100) - 100,
        wrTai: toInt(form.wrTai, 100) - 100,
        wrZantai: toInt(form.wrZantai, 100) - 100,
        wrZokuseiRate: form.wrZokuseiKind.reduce((a, k, i) => {
            a[toInt(k, 0)] += toInt(form.wrZokuseiRate[i], 100) - 100;
            return a;
        }, new Array(DT2_ZOKUSEI_KIND_MAX + 1).fill(0)),
        targetMonsterKind: toInt(form.targetMonsterKind, 0),
        showNormalAttack: form.showNormalAttack
    };
    return result;
}
function putDT2CalcSettingForm(form) {
    const sel = (id, v) => document.getElementById(id).value = v;
    const value = (id, v) => document.getElementById(id).value = v;
    const checked = (id, c) => document.getElementById(id).checked = c;
    value("damagetool2_zantai_calc_setting_weak_resist_zan", form.wrZan);
    value("damagetool2_zantai_calc_setting_weak_resist_tai", form.wrTai);
    value("damagetool2_zantai_calc_setting_weak_resist_zantai", form.wrZantai);
    sel("damagetool2_zantai_calc_setting_weak_resist_zokusei1_kind", form.wrZokuseiKind[0]);
    sel("damagetool2_zantai_calc_setting_weak_resist_zokusei2_kind", form.wrZokuseiKind[1]);
    sel("damagetool2_zantai_calc_setting_weak_resist_zokusei3_kind", form.wrZokuseiKind[2]);
    sel("damagetool2_zantai_calc_setting_weak_resist_zokusei4_kind", form.wrZokuseiKind[3]);
    value("damagetool2_zantai_calc_setting_weak_resist_zokusei1_rate", form.wrZokuseiRate[0]);
    value("damagetool2_zantai_calc_setting_weak_resist_zokusei2_rate", form.wrZokuseiRate[1]);
    value("damagetool2_zantai_calc_setting_weak_resist_zokusei3_rate", form.wrZokuseiRate[2]);
    value("damagetool2_zantai_calc_setting_weak_resist_zokusei4_rate", form.wrZokuseiRate[3]);
    sel("damagetool2_zantai_calc_target_monster", form.targetMonsterKind);
    checked("damagetool2_zantai_calc_setting_show_normal_attack", form.showNormalAttack);
}
const DT2_SESSION_STORAGE_KEY = STORAGE_KEY_DAMAGETOOL2_FORM + "-session";
const DT2_ETERNAL_STORAGE_KEY = STORAGE_KEY_DAMAGETOOL2_FORM + "-eternal";
function isValidDT2EternalFormData(data) {
    if (typeof data !== "object" || data === null) {
        console.log("object型じゃない");
        console.log(data);
        return false;
    }
    const obj1 = data; // ここキャストできる理由わからない
    if (!("memoExprZokuseiZantai" in obj1) || !Array.isArray(obj1["memoExprZokuseiZantai"])) {
        return false;
    }
    else {
        const list = obj1["memoExprZokuseiZantai"];
        if (list.length !== DT2_ZOKUSEI_KIND_MAX + 1) {
            return false;
        }
        if (!list.every(s => typeof s === "string")) {
            return false;
        }
    }
    if (!("memoExprZokuseiJumon" in obj1) || !Array.isArray(obj1["memoExprZokuseiJumon"])) {
        return false;
    }
    else {
        const list = obj1["memoExprZokuseiJumon"];
        if (list.length !== DT2_ZOKUSEI_KIND_MAX + 1) {
            return false;
        }
        if (!list.every(s => typeof s === "string")) {
            return false;
        }
    }
    if (!("memoExprZokuseiZokusei" in obj1) || !Array.isArray(obj1["memoExprZokuseiZokusei"])) {
        return false;
    }
    else {
        const list = obj1["memoExprZokuseiZokusei"];
        if (list.length !== DT2_ZOKUSEI_KIND_MAX + 1) {
            return false;
        }
        if (!list.every(s => typeof s === "string")) {
            return false;
        }
    }
    if (!("memoExprMonsterRate" in obj1) || !Array.isArray(obj1["memoExprMonsterRate"])) {
        return false;
    }
    else {
        const list = obj1["memoExprMonsterRate"];
        if (list.length !== DT2_MONSTER_KIND_MAX + 1) {
            return false;
        }
        if (!list.every(s => typeof s === "string")) {
            return false;
        }
    }
    if (!("importSettingForm" in obj1) || (typeof obj1["importSettingForm"] !== "object") || obj1["importSettingForm"] === null) {
        return false;
    }
    if (isValidDT2ImportSettingForm(obj1["importSettingForm"])) {
        return true;
    }
    else {
        return false;
    }
    return true;
}
function saveSessionDamageTool2Form() {
    if (DEBUG) {
        console.log("call saveSessionDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    try {
        const statusIdAndHeartsetList = Array.from(DT2HeartsetByStatusId);
        const data = {
            heartsetStatusFormList: getDT2StatusFormList("damagetool2_zantai_heartset_status_list"),
            nonHeartsetStatusFormList: getDT2StatusFormList("damagetool2_zantai_non_heartset_status_list"),
            skillFormList: getDT2SkillFormList(),
            damageupRateFormList: getDT2DamgeupRateFormList(),
            rawCalcPairList: getDT2RawCalcPairList(),
            calcSettingForm: getDT2CalcSettingForm(),
            skillId: DT2SkillId,
            heartsetStatusId: DT2HeartsetStatusId,
            nonHeartsetStatusId: DT2NonHeartsetStatusId,
            statusIdAndHeartsetList: statusIdAndHeartsetList
        };
        const json = JSON.stringify(data);
        window.sessionStorage.setItem(DT2_SESSION_STORAGE_KEY, json);
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function loadSessionDamageTool2Form() {
    if (DEBUG) {
        console.log("call loadSessionDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.sessionStorage.getItem(DT2_SESSION_STORAGE_KEY);
        if (json !== null) {
            const data = JSON.parse(json);
            data.statusIdAndHeartsetList.forEach(item => {
                const id = item[0];
                const ahs = item[1];
                for (let i = 0; i < ahs.hearts.length; i++) {
                    const mh = ahs.hearts[i];
                    if (mh === null) {
                        continue;
                    }
                    if (monsterMap.has(mh.monster.name)) {
                        mh.monster = monsterMap.get(mh.monster.name);
                    }
                    const rank = mh.heart.rank;
                    const heart = mh.monster.hearts.find(h => h.rank === rank);
                    if (heart) {
                        mh.heart = heart;
                    }
                }
                DT2HeartsetByStatusId.set(id, ahs);
            });
            DT2SkillId = data.skillId;
            DT2HeartsetStatusId = data.heartsetStatusId;
            DT2NonHeartsetStatusId = data.nonHeartsetStatusId;
            putDT2StatusFormList(false, data.heartsetStatusFormList);
            putDT2StatusFormList(true, data.nonHeartsetStatusFormList);
            putDT2SkillFormList(data.skillFormList);
            putDT2DamgeupRateFormList(data.damageupRateFormList);
            putDT2RawCalcPairList(data.rawCalcPairList);
            putDT2CalcSettingForm(data.calcSettingForm);
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function saveEternalDamageTool2Form() {
    if (DEBUG) {
        console.log("call saveEternalDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    try {
        const data = {
            importSettingForm: getDT2ImportSettingForm(),
            memoExprZokuseiZantai: DT2MemoExprImportZokuseiZantai,
            memoExprZokuseiJumon: DT2MemoExprImportZokuseiJumon,
            memoExprZokuseiZokusei: DT2MemoExprImportZokuseiZokusei,
            memoExprMonsterRate: DT2MemoExprImportMonsterRate
        };
        const json = JSON.stringify(data);
        window.localStorage.setItem(DT2_ETERNAL_STORAGE_KEY, json);
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function loadEternalDamageTool2Form() {
    if (DEBUG) {
        console.log("call loadEternalDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    try {
        const json = window.localStorage.getItem(DT2_ETERNAL_STORAGE_KEY);
        if (json !== null) {
            const data = JSON.parse(json);
            fillDT2ImportSettingForm(data.importSettingForm);
            // forEachじゃなくconst解除すればいいだけでは？
            data.memoExprZokuseiZantai.forEach((expr, i) => DT2MemoExprImportZokuseiZantai[i] = expr);
            data.memoExprZokuseiJumon.forEach((expr, i) => DT2MemoExprImportZokuseiJumon[i] = expr);
            data.memoExprZokuseiZokusei.forEach((expr, i) => DT2MemoExprImportZokuseiZokusei[i] = expr);
            data.memoExprMonsterRate.forEach((expr, i) => DT2MemoExprImportMonsterRate[i] = expr);
        }
    }
    catch (err) {
        NO_STORAGE = true;
        console.log(err);
    }
}
function saveDamageTool2Form() {
    if (DEBUG) {
        console.log("call saveDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no save from storage");
        }
        return;
    }
    saveSessionDamageTool2Form();
    saveEternalDamageTool2Form();
}
function loadDamageTool2Form() {
    if (DEBUG) {
        console.log("call loadDamageTool2Form");
    }
    if (NO_STORAGE) {
        if (DEBUG) {
            console.log("no load from storage");
        }
        return;
    }
    loadSessionDamageTool2Form();
    loadEternalDamageTool2Form();
}
(function () {
    const list = [
        "damagetool2_zantai_import_power_expr",
        "damagetool2_zantai_import_attackmagic_expr",
        "damagetool2_zantai_import_skill_zangeki_expr",
        "damagetool2_zantai_import_skill_taigi_expr",
        "damagetool2_zantai_import_skill_zantai_expr",
        "damagetool2_zantai_import_jumon_expr",
        "damagetool2_zantai_import_zenzokusei_expr",
        "damagetool2_zantai_import_zokusei1_zantai_expr",
        "damagetool2_zantai_import_zokusei2_zantai_expr",
        "damagetool2_zantai_import_zokusei3_zantai_expr",
        "damagetool2_zantai_import_zokusei4_zantai_expr",
        "damagetool2_zantai_import_zokusei1_jumon_expr",
        "damagetool2_zantai_import_zokusei2_jumon_expr",
        "damagetool2_zantai_import_zokusei3_jumon_expr",
        "damagetool2_zantai_import_zokusei4_jumon_expr",
        "damagetool2_zantai_import_zokusei1_zokusei_expr",
        "damagetool2_zantai_import_zokusei2_zokusei_expr",
        "damagetool2_zantai_import_zokusei3_zokusei_expr",
        "damagetool2_zantai_import_zokusei4_zokusei_expr",
        "damagetool2_zantai_import_monster1_expr",
        "damagetool2_zantai_import_monster2_expr",
        "damagetool2_zantai_import_monster3_expr",
        "damagetool2_zantai_import_monster4_expr",
        "damagetool2_zantai_import_spskill1_expr",
        "damagetool2_zantai_import_spskill2_expr",
        "damagetool2_zantai_import_spskill3_expr"
    ];
    for (const id of list) {
        (function (exprId, buttonId) {
            document.getElementById(buttonId)
                .addEventListener("click", () => {
                if (DEBUG) {
                    console.log(`click ${buttonId} Button`);
                }
                showExprRecordDialog(exprId);
            });
        })(id, id + "_from");
    }
})();
(function () {
    for (let i = 1; i <= 4; i++) {
        (function (kindId, zantaiId, jumonId, zokuseiId) {
            document.getElementById(kindId)
                .addEventListener("change", () => {
                const kind = parseInt(document.getElementById(kindId).value);
                const elem = (id) => document.getElementById(id);
                if (DT2MemoExprImportZokuseiZantai[kind].length !== 0) {
                    const elem = document.getElementById(zantaiId);
                    const expr = elem.value.trim();
                    if (expr.length === 0 || !expr.includes(DT2_ZOKUSEI_KIND_NAME_BY_ID[kind])) {
                        elem.value = DT2MemoExprImportZokuseiZantai[kind];
                    }
                }
                if (DT2MemoExprImportZokuseiJumon[kind].length !== 0) {
                    const elem = document.getElementById(jumonId);
                    const expr = elem.value.trim();
                    if (expr.length === 0 || !expr.includes(DT2_ZOKUSEI_KIND_NAME_BY_ID[kind])) {
                        elem.value = DT2MemoExprImportZokuseiJumon[kind];
                    }
                }
                if (DT2MemoExprImportZokuseiZokusei[kind].length !== 0) {
                    const elem = document.getElementById(zokuseiId);
                    const expr = elem.value.trim();
                    if (expr.length === 0 || !expr.includes(DT2_ZOKUSEI_KIND_NAME_BY_ID[kind])) {
                        elem.value = DT2MemoExprImportZokuseiZokusei[kind];
                    }
                }
            });
        })(`damagetool2_zantai_import_zokusei${i}_kind`, `damagetool2_zantai_import_zokusei${i}_zantai_expr`, `damagetool2_zantai_import_zokusei${i}_jumon_expr`, `damagetool2_zantai_import_zokusei${i}_zokusei_expr`);
    }
})();
(function () {
    for (let i = 1; i <= 4; i++) {
        (function (kindId, rateId) {
            document.getElementById(kindId)
                .addEventListener("change", () => {
                const kind = parseInt(document.getElementById(kindId).value);
                const elem = (id) => document.getElementById(id);
                if (DT2MemoExprImportMonsterRate[kind].length !== 0) {
                    const elem = document.getElementById(rateId);
                    const expr = elem.value.trim();
                    if (expr.length === 0 || !expr.includes(DT2_MONSTER_KIND_NAME_BY_ID[kind])) {
                        elem.value = DT2MemoExprImportMonsterRate[kind];
                    }
                }
            });
        })(`damagetool2_zantai_import_monster${i}_kind`, `damagetool2_zantai_import_monster${i}_expr`);
    }
})();
// こころセット由来のインポート用ステータスの追加
document.getElementById("damagetool2_zantai_add_heartset_status_from_heartset")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_heartset_status_from_heartset Button");
    }
    const form = getDT2ImportSettingForm();
    const targetSel = document.getElementById("damagetool2_zantai_heartset_target");
    const target = targetSel.value;
    const targetIdSel = document.getElementById("damagetool2_zantai_heartset_target_id");
    const targetId = parseInt(targetIdSel.value);
    const basename = `${targetSel.selectedOptions[0].textContent}-${targetIdSel.selectedOptions[0].textContent}`;
    const heartsetList = DT2HeartsetListReference.get(target) ?? [];
    if (heartsetList.length === 0 || targetId < 0 || heartsetList.length <= targetId) {
        dialogAlert("候補がありません");
        return;
    }
    const heartset = heartsetList[targetId];
    if (heartset === null) {
        dialogAlert("候補がありません");
        return;
    }
    const calc = (scorer) => {
        let score = 0;
        const oldPowerUp = powerUp;
        powerUp = heartset.powerUp;
        for (let i = 0; i < heartset.colors.length; i++) {
            const frameColor = heartset.colors[i];
            if (frameColor === Color.Unset || frameColor === Color.Omit) {
                continue;
            }
            if (heartset.hearts.length <= i) {
                break;
            }
            const mh = heartset.hearts[i];
            if (mh === null) {
                continue;
            }
            const oldCurColor = mh.monster.curColor;
            const oldCurCost = mh.monster.curCost;
            const oldTarget = mh.monster.target;
            mh.monster.curColor = mh.heart.color;
            mh.monster.curCost = mh.heart.cost;
            mh.monster.target = mh.heart.rank;
            score += scorer.calc(frameColor, mh.monster);
            mh.monster.curColor = oldCurColor;
            mh.monster.curCost = oldCurCost;
            mh.monster.target = oldTarget;
        }
        powerUp = oldPowerUp;
        return score;
    };
    const template = document.getElementById("damagetool2_zantai_set_template");
    const fragment = template.content.cloneNode(true);
    const setsel = (cn, value) => fragment.querySelector(`:scope .${cn}`).value = value;
    setsel("damagetool2-zantai-set-zokusei1-kind", form.zokuseiKind[0]);
    setsel("damagetool2-zantai-set-zokusei2-kind", form.zokuseiKind[1]);
    setsel("damagetool2-zantai-set-zokusei3-kind", form.zokuseiKind[2]);
    setsel("damagetool2-zantai-set-zokusei4-kind", form.zokuseiKind[3]);
    setsel("damagetool2-zantai-set-monster1-kind", form.monsterKind[0]);
    setsel("damagetool2-zantai-set-monster2-kind", form.monsterKind[1]);
    setsel("damagetool2-zantai-set-monster3-kind", form.monsterKind[2]);
    setsel("damagetool2-zantai-set-monster4-kind", form.monsterKind[3]);
    const fill = (enabled, expr, inputCN, title) => {
        if (!enabled) {
            return true;
        }
        try {
            const scorer = parseExpression(expr);
            const score = calc(scorer);
            fragment.querySelector(`:scope .damagetool2-zantai-set-${inputCN}`).value = `${score}`;
            return true;
        }
        catch (err) {
            if (err instanceof ExprSyntaxError) {
                dialogAlert(`${title}の式にエラー: ${err.getMessage()}`);
            }
            else {
                dialogAlert(`${title}の式にエラー: ${err}`);
            }
            console.log(err);
            return false;
        }
    };
    const ok = fill(form.powerUse, form.powerExpr, "power", "力")
        && fill(form.attackMagicUse, form.attackMagicExpr, "attackmagic", "攻魔")
        && fill(form.skillZangekiUse, form.skillZangekiExpr, "skill-zangeki", "斬D")
        && fill(form.skillTaigiUse, form.skillTaigiExpr, "skill-taigi", "体D")
        && fill(form.skillZantaiUse, form.skillZantaiExpr, "skill-zantai", "斬体D")
        && fill(form.jumonUse, form.jumonExpr, "jumon", "呪文D")
        && fill(form.zenzokuseiUse, form.zenzokuseiExpr, "zenzokusei", "全属性D")
        && fill(form.zokuseiZantaiUse[0], form.zokuseiZantaiExpr[0], "zokusei1-zantai", "属性1-斬体D")
        && fill(form.zokuseiZantaiUse[1], form.zokuseiZantaiExpr[1], "zokusei2-zantai", "属性2-斬体D")
        && fill(form.zokuseiZantaiUse[2], form.zokuseiZantaiExpr[2], "zokusei3-zantai", "属性3-斬体D")
        && fill(form.zokuseiZantaiUse[3], form.zokuseiZantaiExpr[3], "zokusei4-zantai", "属性4-斬体D")
        && fill(form.zokuseiJumonUse[0], form.zokuseiJumonExpr[0], "zokusei1-jumon", "属性1-呪文D")
        && fill(form.zokuseiJumonUse[1], form.zokuseiJumonExpr[1], "zokusei2-jumon", "属性2-呪文D")
        && fill(form.zokuseiJumonUse[2], form.zokuseiJumonExpr[2], "zokusei3-jumon", "属性3-呪文D")
        && fill(form.zokuseiJumonUse[3], form.zokuseiJumonExpr[3], "zokusei4-jumon", "属性4-呪文D")
        && fill(form.zokuseiZokuseiUse[0], form.zokuseiZokuseiExpr[0], "zokusei1-zokusei", "属性1-属性D")
        && fill(form.zokuseiZokuseiUse[1], form.zokuseiZokuseiExpr[1], "zokusei2-zokusei", "属性2-属性D")
        && fill(form.zokuseiZokuseiUse[2], form.zokuseiZokuseiExpr[2], "zokusei3-zokusei", "属性3-属性D")
        && fill(form.zokuseiZokuseiUse[3], form.zokuseiZokuseiExpr[3], "zokusei4-zokusei", "属性4-属性D")
        && fill(form.monsterUse[0], form.monsterExpr[0], "monster1-rate", "モンスター系統1")
        && fill(form.monsterUse[1], form.monsterExpr[1], "monster2-rate", "モンスター系統2")
        && fill(form.monsterUse[2], form.monsterExpr[2], "monster3-rate", "モンスター系統3")
        && fill(form.monsterUse[3], form.monsterExpr[3], "monster4-rate", "モンスター系統4")
        && fill(form.spskillUse[0], form.spskillExpr[0], "spskill1", "特定スキル1")
        && fill(form.spskillUse[1], form.spskillExpr[1], "spskill2", "特定スキル2")
        && fill(form.spskillUse[2], form.spskillExpr[2], "spskill3", "特定スキル3");
    if (!ok) {
        return;
    }
    if (updateDT2MemoExpr(form)) {
        saveEternalDamageTool2Form();
    }
    DT2HeartsetStatusId++;
    const id = `A${DT2HeartsetStatusId}`;
    const name = `[${id}]${basename}`;
    const sel = document.getElementById("damagetool2_zantai_calc_pair_from_heartset");
    const opt = sel.firstElementChild.nextElementSibling === null
        ? sel.appendChild(document.createElement("option"))
        : sel.insertBefore(document.createElement("option"), sel.firstElementChild.nextElementSibling);
    opt.value = id;
    opt.textContent = name;
    fragment.querySelector(":scope .damagetool2-zantai-set-id").textContent = id;
    fragment.querySelector(":scope .damagetool2-zantai-set-name").value = name;
    const list = document.getElementById("damagetool2_zantai_heartset_status_list");
    list.insertBefore(fragment, list.firstElementChild);
    const nameElem = list.firstElementChild.querySelector(":scope .damagetool2-zantai-set-name");
    nameElem.addEventListener("input", () => {
        opt.textContent = nameElem.value;
        const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
        const cpItems = cpList.querySelectorAll(":scope > .outline");
        for (const item of cpItems) {
            const cpId = item.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-id").textContent;
            if (cpId === id) {
                item.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-name").textContent = nameElem.value;
            }
        }
    });
    const viewButton = nameElem.parentElement.parentElement.appendChild(document.createElement("button"));
    viewButton.classList.add("small");
    viewButton.textContent = "こころセットの確認";
    viewButton.addEventListener("click", () => {
        showHeartsetViewDialog(heartset, `セット名: ${nameElem.value}`);
    });
    DT2HeartsetByStatusId.set(id, heartset);
    list.scrollTop = 0;
    if (DEBUG) {
        console.log(`added Status from Heartset: ID: ${id}, NAME: ${name}, HEARTSET: ${heartset}`);
    }
});
// こころセット由来の手入力用ステータスの追加
document.getElementById("damagetool2_zantai_add_heartset_status_by_manual")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_heartset_status_by_manual Button");
    }
    const template = document.getElementById("damagetool2_zantai_set_template");
    const fragment = template.content.cloneNode(true);
    DT2HeartsetStatusId++;
    const id = `A${DT2HeartsetStatusId}`;
    const name = `[${id}]こころセット`;
    const sel = document.getElementById("damagetool2_zantai_calc_pair_from_heartset");
    const opt = sel.firstElementChild.nextElementSibling === null
        ? sel.appendChild(document.createElement("option"))
        : sel.insertBefore(document.createElement("option"), sel.firstElementChild.nextElementSibling);
    opt.value = id;
    opt.textContent = name;
    fragment.querySelector(":scope .damagetool2-zantai-set-id").textContent = id;
    fragment.querySelector(":scope .damagetool2-zantai-set-name").value = name;
    const list = document.getElementById("damagetool2_zantai_heartset_status_list");
    list.insertBefore(fragment, list.firstElementChild);
    const nameElem = list.firstElementChild.querySelector(":scope .damagetool2-zantai-set-name");
    nameElem.addEventListener("input", () => {
        opt.textContent = nameElem.value;
        const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
        const cpItems = cpList.querySelectorAll(":scope > .outline");
        for (const item of cpItems) {
            const cpId = item.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-id").textContent;
            if (cpId === id) {
                item.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-name").textContent = nameElem.value;
            }
        }
    });
    list.scrollTop = 0;
    if (DEBUG) {
        console.log(`added empty Status: ID: ${id}, NAME: ${name}`);
    }
});
// こころセット由来のステータスリストの削除
document.getElementById("damagetool2_zantai_clear_heartset_status_list")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_clear_heartset_status_list Button");
    }
    document.getElementById("damagetool2_zantai_heartset_status_list").innerHTML = "";
    const sel = document.getElementById("damagetool2_zantai_calc_pair_from_heartset");
    sel.innerHTML = "";
    const opt = sel.appendChild(document.createElement("option"));
    opt.value = "*";
    opt.textContent = "*";
    const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
    const cpItems = cpList.querySelectorAll(":scope > .outline");
    const removes = [];
    for (const cpItem of cpItems) {
        const hsId = cpItem.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-id").textContent ?? "";
        if (hsId === "*") {
            continue;
        }
        const nhsId = cpItem.querySelector(":scope .damagetool2-zantai-calc-pair-non-heartset-status-id").textContent ?? "";
        const key = makeDT2CalcPairKey(hsId, nhsId);
        DT2UniqCalcPair.delete(key);
        removes.push(cpItem);
    }
    for (const cpItem of removes) {
        cpList.removeChild(cpItem);
    }
    DT2HeartsetByStatusId.clear();
});
// こころセット以外のステータスの追加
document.getElementById("damagetool2_zantai_add_non_heartset_status")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_non_heartset_status Button");
    }
    const template = document.getElementById("damagetool2_zantai_set_template");
    const fragment = template.content.cloneNode(true);
    DT2NonHeartsetStatusId++;
    const id = `B${DT2NonHeartsetStatusId}`;
    const name = `[${id}]こころ以外`;
    const sel = document.getElementById("damagetool2_zantai_calc_pair_from_non_heartset");
    const opt = sel.firstElementChild.nextElementSibling === null
        ? sel.appendChild(document.createElement("option"))
        : sel.insertBefore(document.createElement("option"), sel.firstElementChild.nextElementSibling);
    opt.value = id;
    opt.textContent = name;
    fragment.querySelector(":scope .damagetool2-zantai-set-id").textContent = id;
    fragment.querySelector(":scope .damagetool2-zantai-set-name").value = name;
    const list = document.getElementById("damagetool2_zantai_non_heartset_status_list");
    list.insertBefore(fragment, list.firstElementChild);
    const nameElem = list.firstElementChild.querySelector(":scope .damagetool2-zantai-set-name");
    nameElem.addEventListener("input", () => {
        opt.textContent = nameElem.value;
        const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
        const cpItems = cpList.querySelectorAll(":scope > .outline");
        for (const item of cpItems) {
            const cpId = item.querySelector(":scope .damagetool2-zantai-calc-pair-non-heartset-status-id").textContent;
            if (cpId === id) {
                item.querySelector(":scope .damagetool2-zantai-calc-pair-non-heartset-status-name").textContent = nameElem.value;
            }
        }
    });
    list.scrollTop = 0;
    if (DEBUG) {
        console.log(`added empty Status: ID: ${id}, NAME: ${name}`);
    }
});
// こころセット以外のステータスリストの削除
document.getElementById("damagetool2_zantai_clear_non_heartset")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_clear_non_heartset Button");
    }
    document.getElementById("damagetool2_zantai_non_heartset_status_list").innerHTML = "";
    const sel = document.getElementById("damagetool2_zantai_calc_pair_from_non_heartset");
    sel.innerHTML = "";
    const opt = sel.appendChild(document.createElement("option"));
    opt.value = "*";
    opt.textContent = "*";
    const cpList = document.getElementById("damagetool2_zantai_calc_pair_list");
    const cpItems = cpList.querySelectorAll(":scope > .outline");
    const removes = [];
    for (const cpItem of cpItems) {
        const nhsId = cpItem.querySelector(":scope .damagetool2-zantai-calc-pair-non-heartset-status-id").textContent ?? "";
        if (nhsId === "*") {
            continue;
        }
        const hsId = cpItem.querySelector(":scope .damagetool2-zantai-calc-pair-heartset-status-id").textContent ?? "";
        const key = makeDT2CalcPairKey(hsId, nhsId);
        DT2UniqCalcPair.delete(key);
        removes.push(cpItem);
    }
    for (const cpItem of removes) {
        cpList.removeChild(cpItem);
    }
});
// スキルの追加
document.getElementById("damagetool2_zantai_add_skill")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_skill Button");
    }
    const template = document.getElementById("damagetool2_zantai_skill_template");
    const fragment = template.content.cloneNode(true);
    DT2SkillId++;
    const id = DT2SkillId;
    fragment.querySelector(".damagetool2-zantai-skill-name").value = `スキル${id}`;
    const list = document.getElementById("damagetool2_zantai_skill_list");
    list.insertBefore(fragment, list.firstElementChild);
    list.scrollTop = 0;
});
// スキルリストの削除
document.getElementById("damagetool2_zantai_clear_skill_list")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_clear_skill_list Button");
    }
    document.getElementById("damagetool2_zantai_skill_list").innerHTML = "";
});
// ダメージアップ倍率の追加
document.getElementById("damagetool2_zantai_add_damageup_rate")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_damageup_rate Button");
    }
    const template = document.getElementById("damagetool2_zantai_damageup_rate_template");
    const fragment = template.content.cloneNode(true);
    const list = document.getElementById("damagetool2_zantai_damageup_rate_list");
    list.insertBefore(fragment, list.firstElementChild);
    list.scrollTop = 0;
});
// ダメージアップ倍率リストの削除
document.getElementById("damagetool2_zantai_clear_damageup_rate_list")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_clear_damageup_rate_list Button");
    }
    document.getElementById("damagetool2_zantai_damageup_rate_list").innerHTML = "";
});
// 計算組み合わせの追加
document.getElementById("damagetool2_zantai_add_calc_pair")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_add_calc_pair Button");
    }
    const sel1 = document.getElementById("damagetool2_zantai_calc_pair_from_heartset");
    const hsId = sel1.value;
    const hsName = sel1.selectedOptions[0].textContent ?? "";
    const sel2 = document.getElementById("damagetool2_zantai_calc_pair_from_non_heartset");
    const nhsId = sel2.value;
    const nhsName = sel2.selectedOptions[0].textContent ?? "";
    const key = makeDT2CalcPairKey(hsId, nhsId);
    if (DT2UniqCalcPair.has(key)) {
        dialogAlert("既に存在します");
        return;
    }
    DT2UniqCalcPair.set(key, true);
    const template = document.getElementById("damagetool2_zantai_calc_pair_template");
    const fragment = template.content.cloneNode(true);
    const text = (cn, t) => fragment.querySelector(`:scope .${cn}`).textContent = t;
    text("damagetool2-zantai-calc-pair-heartset-status-id", hsId);
    text("damagetool2-zantai-calc-pair-heartset-status-name", hsName);
    text("damagetool2-zantai-calc-pair-non-heartset-status-id", nhsId);
    text("damagetool2-zantai-calc-pair-non-heartset-status-name", nhsName);
    const list = document.getElementById("damagetool2_zantai_calc_pair_list");
    list.insertBefore(fragment, list.firstElementChild);
    list.scrollTop = 0;
});
// 計算組み合わせリストの削除
document.getElementById("damagetool2_zantai_clear_calc_pair_list")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_clear_calc_pair_list Button");
    }
    document.getElementById("damagetool2_zantai_calc_pair_list").innerHTML = "";
    DT2UniqCalcPair.clear();
});
// 計算する
document.getElementById("damagetool2_zantai_calc")
    .addEventListener("click", () => {
    if (DEBUG) {
        console.log("click damagetool2_zantai_calc Button");
    }
    const resultElem = document.getElementById("damagetool2_zantai_calc_result");
    resultElem.innerHTML = "";
    resultElem.scrollTop = 0;
    const calcSetting = parseDT2CalcSettingForm(getDT2CalcSettingForm());
    const targetMonsterKind = calcSetting.targetMonsterKind;
    const statusMap = new Map();
    for (const hs of parseDT2StatusForms(getDT2StatusFormList("damagetool2_zantai_heartset_status_list"))) {
        statusMap.set(hs.id, hs);
    }
    for (const nhs of parseDT2StatusForms(getDT2StatusFormList("damagetool2_zantai_non_heartset_status_list"))) {
        statusMap.set(nhs.id, nhs);
    }
    const skillList = parseDT2SkillForms(getDT2SkillFormList());
    const damageupRateList = parseDt2DamgeupRateForms(getDT2DamgeupRateFormList());
    const calcPairList = getDT2ExpandedCalcPairList();
    // TODO 端数は切捨てでいいの？
    const baseDamage = (p, d) => Math.max(0, Math.floor(p / 2) - Math.floor(d / 4));
    for (let defence = 0; defence <= 2000; defence += 100) {
        const defDetails = document.createElement("details");
        defDetails.appendChild(document.createElement("summary")).textContent = `守備力 ${defence}`;
        const table = defDetails.appendChild(document.createElement("table"));
        const header = table.appendChild(document.createElement("thead")).appendChild(document.createElement("tr"));
        header.appendChild(document.createElement("th")).textContent = "こころセット";
        header.appendChild(document.createElement("th")).textContent = "こころ以外";
        header.appendChild(document.createElement("th")).textContent = "攻撃増0";
        header.appendChild(document.createElement("th")).textContent = "攻撃増1";
        header.appendChild(document.createElement("th")).textContent = "攻撃増2";
        header.appendChild(document.createElement("th")).textContent = "攻撃増3";
        const tbody = table.appendChild(document.createElement("tbody"));
        if (calcSetting.showNormalAttack) {
            const normalAttackHeader = tbody.appendChild(document.createElement("tr")).appendChild(document.createElement("th"));
            normalAttackHeader.colSpan = 6;
            normalAttackHeader.textContent = "通常攻撃";
            for (const cp of calcPairList) {
                const tr = tbody.appendChild(document.createElement("tr"));
                tr.appendChild(document.createElement("td")).textContent = cp.heartsetStatusName;
                tr.appendChild(document.createElement("td")).textContent = cp.nonHeartsetStatusName;
                const st1 = statusMap.get(cp.heartsetStatusId);
                const st2 = statusMap.get(cp.nonHeartsetStatusId);
                const mr = (100 + st1.monsterRate[targetMonsterKind] + st2.monsterRate[targetMonsterKind]) / 100;
                tr.appendChild(document.createElement("td")).textContent = `${Math.floor(mr * baseDamage(st1.power + st2.power, defence))}`;
                tr.appendChild(document.createElement("td")).textContent = `${Math.floor(mr * baseDamage(Math.floor((st1.power + st2.power) * 1.2), defence))}`;
                tr.appendChild(document.createElement("td")).textContent = `${Math.floor(mr * baseDamage(Math.floor((st1.power + st2.power) * 1.4), defence))}`;
                tr.appendChild(document.createElement("td")).textContent = `${Math.floor(mr * baseDamage(Math.floor((st1.power + st2.power) * 1.6), defence))}`;
            }
        }
        for (const skill of skillList) {
            if (skill.restrictMonsterUse
                && (skill.restrictMonsterIsOnly !== (skill.restrictMonsterKind === targetMonsterKind))) {
                continue;
            }
            const isAll = skill.idReference.length === 0;
            if (!(isAll || skill.idReference.some(id => statusMap.has(id)))) {
                continue;
            }
            const skillHeader = tbody.appendChild(document.createElement("tr")).appendChild(document.createElement("th"));
            skillHeader.colSpan = 6;
            skillHeader.textContent = skill.name;
            for (const cp of calcPairList) {
                if (!(isAll || skill.idReference.includes(cp.heartsetStatusId) || skill.idReference.includes(cp.nonHeartsetStatusId))) {
                    continue;
                }
                const dmupRate = getDT2DamageupRate(damageupRateList, cp.heartsetStatusId, cp.nonHeartsetStatusId);
                const tr = tbody.appendChild(document.createElement("tr"));
                tr.appendChild(document.createElement("td")).textContent = cp.heartsetStatusName;
                tr.appendChild(document.createElement("td")).textContent = cp.nonHeartsetStatusName;
                const st1 = statusMap.get(cp.heartsetStatusId);
                const st2 = statusMap.get(cp.nonHeartsetStatusId);
                for (let pwrup = 100; pwrup <= 160; pwrup += 20) {
                    let damage = 0;
                    for (let i = 0; i < skill.attackUse.length; i++) {
                        if (!skill.attackUse[i]) {
                            continue;
                        }
                        // TODO 各計算の端数は切捨てでいいの？
                        const isZan = (skill.attackType[i] & 1) === 0;
                        const isMix = skill.attackType[i] >= 2;
                        const pwr = Math.floor((st1.power + st2.power) * pwrup / 100)
                            + (isMix ? (st1.attackMagic + st2.attackMagic) : 0);
                        const bd = baseDamage(pwr, defence);
                        let d = Math.max(0, Math.floor(bd * skill.attackRate[i] / 100));
                        const sk = (st1.skillZantai + st2.skillZantai)
                            + (isZan ? (st1.skillZan + st2.skillZan) : (st1.skillTai + st2.skillTai))
                            + (isMix ? (st1.jumon + st2.jumon) : 0);
                        const skup = (isZan ? dmupRate.zan : dmupRate.tai) + dmupRate.zantai;
                        d = Math.max(0, Math.floor(d * (100 + Math.floor(sk * (100 + skup) / 100)) / 100));
                        const k = skill.attackKind[i];
                        const zk = (k === 0 ? 0 : (st1.zenzokusei + st2.zenzokusei))
                            + (st1.zokuseiZantai[k] + st2.zokuseiZantai[k])
                            + (isMix ? (st1.zokuseiJumon[k] + st2.zokuseiJumon[k]) : 0)
                            + (st1.zokuseiZokusei[k] + st2.zokuseiZokusei[k]);
                        d = Math.max(0, Math.floor(d * (100 + Math.floor(zk * (100 + dmupRate.zokuseiRate[k]) / 100)) / 100));
                        const mr = (st1.monsterRate[targetMonsterKind] + st2.monsterRate[targetMonsterKind]);
                        d = Math.max(0, Math.floor(d * (100 + Math.floor(mr * (100 + dmupRate.monsterRate[targetMonsterKind]) / 100)) / 100));
                        const sp = (st1.spskill[skill.spskill] + st2.spskill[skill.spskill]);
                        d = Math.max(0, Math.floor(d * (100 + sp) / 100));
                        d = Math.max(0, Math.floor(d * (100 + (isZan ? calcSetting.wrZan : calcSetting.wrTai) + calcSetting.wrZantai) / 100));
                        d = Math.max(0, Math.floor(d * (100 + calcSetting.wrZokuseiRate[k]) / 100));
                        damage += Math.max(0, d * skill.attackRepeat[i]);
                    }
                    tr.appendChild(document.createElement("td")).textContent = `${damage}`;
                }
            }
        }
        resultElem.appendChild(defDetails);
        resultElem.appendChild(document.createElement("hr"));
    }
});
/////////////////////////////////////////////////////////////////////////////////////
//
/////////////////////////////////////////////////////////////////////////////////////
window.addEventListener("pagehide", () => {
    saveHeartSetSearchForm();
    saveRNForm();
    saveDamageTool2Form();
    saveManualHeartsetForm();
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
        NO_STORAGE = true;
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
        NO_STORAGE = true;
    }
    else {
        // ローカルストレージのリストを利用
        loadMonsterList();
        updateChangedRankCount();
        loadExprRecord();
        loadAdoptionHeartSetList();
        loadHeartSetSearchForm();
        loadRNForm();
        loadDamageTool2Form();
        loadManualHeartsetForm();
    }
})();
// デバッグモードであることの確認
if (DEBUG) {
    dialogAlert("[DEBUG] OK");
}
