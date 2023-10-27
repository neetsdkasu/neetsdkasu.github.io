// TakaraMap Manager
// author: Leonardone @ NEETSDKASU
//
// typescript version 5.2.2

interface Level {
    jobclass: string;
    level: string;
}

interface TakaraMapForm {
    grade: string;
    location: string;
    jobclass: string;
    level: string;
    field: string;
    name: string;
    monster: string[];
    count: string[];
    boss: string;
    special: string[];
    standard: string[];
    metal: string;
}

interface TakaraMap {
    id: number;
    form: TakaraMapForm;
    mark: string;
}

let takaraMapId: number = 0;
let takaraMapList: TakaraMap[] = [];

const STORAGE_KEY_TAKARAMAP_LIST = "takaramap.list";
const STORAGE_KEY_TAKARAMAP_SESSION = "takaramap.session";

interface TakaraMapStorage {
    id: number;
    list: TakaraMap[];
    order: string;
}

function loadData(): void {
    try {
        const json = window.localStorage.getItem(STORAGE_KEY_TAKARAMAP_LIST);
        if (json !== null) {
            const data: TakaraMapStorage = JSON.parse(json);
            takaraMapId = data.id;
            takaraMapList = data.list;
            (document.getElementById("list_order") as HTMLSelectElement).value = data.order;
            sortList();
            updateSuggestion();
            showList();
        }
    } catch (err) {
        console.log(err);
    }
}

function saveData(): void {
    try {
        const order = (document.getElementById("list_order") as HTMLSelectElement).value;
        const data: TakaraMapStorage = {
            id: takaraMapId,
            list: takaraMapList,
            order: order
        };
        const json = JSON.stringify(data);
        window.localStorage.setItem(STORAGE_KEY_TAKARAMAP_LIST, json);
    } catch (err) {
        console.log(err);
    }
}

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

function loadDataFile(): void {
    const files = (document.getElementById("upload_file") as HTMLInputElement).files;
    if (files === null || files.length === 0) {
        alert("ファイルを選択してください");
        return;
    }
    const file = files[0];
    file.text().then( text => {
        const data: TakaraMapStorage = JSON.parse(text);
        takaraMapId = data.id;
        takaraMapList = data.list;
        (document.getElementById("list_order") as HTMLSelectElement).value = data.order;
        sortList();
        updateSuggestion();
        showList();
    }).catch( err => {
        console.log(err);
        alert(`エラー: ${err}`);
    });
}

function getLowLevel(original: Level): Level {
    if (original.jobclass === "2") {
        const lv = parseInt(original.level);
        if (lv >= 30 && lv + 45 <= 90) {
            return {
                jobclass: "1",
                level: `${lv + 45}`
            };
        }
    }
    return original;
}

function compareLevel(a: Level, b: Level): number {
    const lowA = getLowLevel(a);
    const lowB = getLowLevel(b);
    const lvA = lowA.jobclass + lowA.level.padStart(3, "0");
    const lvB = lowB.jobclass + lowB.level.padStart(3, "0");
    return lvA.localeCompare(lvB);
}

function getMonsterCountByGrade(grade: string): string | null {
    let gradeStr = "";

    for (const op of document.getElementById("grade")!.querySelectorAll("option")) {
        if (op.value === grade) {
            gradeStr = op.textContent!;
            break;
        }
    }
    
    switch (gradeStr) {
        case "S+":
            return "4";
        case "S":
            return "3";
        case "A":
            return "2";
        case "C":
            return "1";
        default:
            return null;
    }
}

function updateSuggestion(): void {
    const bossMap: Map<string, number> = new Map();
    const monsterMap: Map<string, number> = new Map();
    const metalMap: Map<string, number> = new Map();

    takaraMapList.forEach(tm => {
        bossMap.set(tm.form.boss, 1);
        tm.form.monster.forEach(mon => monsterMap.set(mon, 1));
        metalMap.set(tm.form.metal, 1);
    });

    const update = (id: string, m: Map<string, number>) => {
        const datalist = document.getElementById(id)!;
        datalist.innerHTML = "";
        Array.from(m.keys()).sort((a, b) => a.localeCompare(b)).forEach(name => {
            datalist.appendChild(document.createElement("option")).value = name;
        });
    };

    update("boss_list", bossMap);
    update("monster_list", monsterMap);
    update("metal_list", metalMap);
}

function deleteTakaraMap(id: number): void {
    const index = takaraMapList.findIndex(tm => tm.id === id);
    if (index < 0) {
        return;
    }
    const list1 = takaraMapList.slice(0, index);
    const list2 = takaraMapList.slice(index);
    takaraMapList = list1.concat(list2);
}

interface FilterParams {
    monster: boolean;
    boss: boolean;
    fieldmonster: boolean;
    targets: string[];
}

function getFilterParams(): FilterParams | null {
    const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
    const params: FilterParams = {
        monster: elem("filter_monster").checked,
        boss: elem("filter_boss").checked,
        fieldmonster: elem("filter_fieldmonster").checked,
        targets: elem("filter_targets").value.replaceAll("　", " ").trim().split(/\s+/).filter(s => s !== "")
    };
    if ((!params.monster && !params.boss && !params.fieldmonster) || params.targets.length === 0) {
        return null;
    }
    return params;
}

interface TakaraMapSession {
    filter: FilterParams | null;
}

function loadSession(): void {
    try {
        const json = window.sessionStorage.getItem(STORAGE_KEY_TAKARAMAP_SESSION);
        if (json !== null) {
            const data: TakaraMapSession = JSON.parse(json);
            const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
            if (data.filter !== null) {
                elem("filter_monster").checked = data.filter.monster;
                elem("filter_boss").checked = data.filter.boss;
                elem("filter_fieldmonster").checked = data.filter.fieldmonster;
                elem("filter_targets").value = data.filter.targets.join(" ");
            }
        }
    } catch (err) {
        console.log(err);
    }
}

function saveSession(): void {
    try {
        const data: TakaraMapSession = {
            filter: getFilterParams()
        };
        const json = JSON.stringify(data);
        window.sessionStorage.setItem(STORAGE_KEY_TAKARAMAP_SESSION, json);
    } catch (err) {
        console.log(err);
    }
}

function matchFilter(filter: FilterParams | null, tm: TakaraMap): boolean {
    if (filter === null) {
        return true;
    }
    if (filter.monster && filter.targets.some(t => tm.form.monster.includes(t))) {
        return true;
    }
    if (filter.boss && filter.targets.some(t => tm.form.boss.includes(t))) {
        return true;
    }
    return filter.fieldmonster && filter.targets.some(
            t => tm.form.special.includes(t) || tm.form.standard.includes(t) || tm.form.metal === t);
}

function sortList(): void {
    const order = (document.getElementById("list_order") as HTMLSelectElement).value;
    switch (order) {
        case "register":
            takaraMapList.sort((a, b) => a.id - b.id);
            break;
        case "grade":
            takaraMapList.sort((a, b) => a.form.grade.localeCompare(b.form.grade));
            break;
        case "location":
            takaraMapList.sort((a, b) => a.form.location.localeCompare(b.form.location));
            break;
        case "level":
            takaraMapList.sort((a, b) => compareLevel(a.form, b.form));
            break;
        case "field":
            takaraMapList.sort((a, b) => a.form.field.localeCompare(b.form.field));
            break;
        case "boss":
            takaraMapList.sort((a, b) => a.form.boss.localeCompare(b.form.boss));
            break;
        case "mark":
            takaraMapList.sort((a, b) => a.mark.localeCompare(b.mark));
            break;
        }
}

function showList(): void {
    const listElem = document.getElementById("map_list")!;
    listElem.innerHTML = "";

    const filter = getFilterParams();

    const bossMap: Map<string, number> = new Map();
    const monsterMap: Map<string, number> = new Map();
    const specialMap: Map<string, number> = new Map();
    const standardMap: Map<string, number> = new Map();
    const metalMap: Map<string, number> = new Map();
    const locationMap: Map<string, number> = new Map();
    const fieldMap: Map<string, number> = new Map();
    const gradeMap: Map<string, number> = new Map();
    const markMap: Map<string, number> = new Map();

    const count = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);

    takaraMapList.forEach(tm => {
        count(bossMap, tm.form.boss);
        tm.form.monster.forEach((mon, i, arr) => {
            if (!arr.slice(0, i).includes(mon)) count(monsterMap, mon);
        });
        tm.form.special.forEach(mon => count(specialMap, mon));
        tm.form.standard.forEach(mon => count(standardMap, mon));
        count(metalMap, tm.form.metal);
        count(locationMap, tm.form.location);
        count(fieldMap, tm.form.field);
        count(gradeMap, tm.form.grade);
        count(markMap, tm.mark);
    });

    const optionSet = (id: string) => {
        const m: Map<string, string> = new Map();
        for (const op of document.getElementById(id)!.querySelectorAll("option")) {
            m.set(op.value, op.textContent!);
        }
        return m;
    };

    const gradeStr = optionSet("grade");
    const locationStr = optionSet("location");
    const jobclassStr = optionSet("jobclass");
    const fieldStr = optionSet("field");

    const markStr: Map<string, string> = new Map();
    for (const op of (document.getElementById("map_item_template") as HTMLTemplateElement).content.querySelectorAll(".item-mark option")) {
        markStr.set((op as HTMLOptionElement).value, op.textContent!);
    }

    const showCount = (clid: string, lid: string, cm: Map<string, number>, nf: (n: string) => string) => {
        const listElem = document.getElementById(clid)!;
        listElem.innerHTML = "";
        for (const op of document.getElementById(lid)!.querySelectorAll("option")) {
            const c = cm.get(op.value) ?? 0;
            const e = listElem.appendChild(document.createElement("span"));
            e.textContent = `${nf(op.value)}:${c}`;
            if (c === 0) {
                e.classList.add("red");
            } else if (c === 1) {
                e.classList.add("blue");
            }
        }
    };

    showCount("grade_count_list", "grade", gradeMap, (n: string) => gradeStr.get(n)!);
    showCount("location_count_list", "location", locationMap, (n: string) => locationStr.get(n)!);
    showCount("field_count_list", "field", fieldMap, (n: string) => fieldStr.get(n)!);
    showCount("monster_count_list", "monster_list", monsterMap, (n: string) => n);
    showCount("boss_count_list", "boss_list", bossMap, (n: string) => n);
    showCount("metal_count_list", "metal_list", metalMap, (n: string) => n);

    const specialCountListElem = document.getElementById("special_count_list")!;
    specialCountListElem.innerHTML = "";
    for (const n of Array.from(specialMap.keys()).sort()) {
        const c = specialMap.get(n) ?? 0;
        const e = specialCountListElem.appendChild(document.createElement("span"));
        e.textContent = `${n === "" ? "-" : n}:${c}`;
        if (monsterMap.has(n) || bossMap.has(n)) e.classList.add("red");
        else if (c === 1) e.classList.add("blue");
    }
 
    const standardCountListElem = document.getElementById("standard_count_list")!;
    standardCountListElem.innerHTML = "";
    for (const n of Array.from(standardMap.keys()).sort()) {
        const c = standardMap.get(n) ?? 0;
        const e = standardCountListElem.appendChild(document.createElement("span"))
        e.textContent = `${n === "" ? "-" : n}:${c}`;
        if (monsterMap.has(n) || bossMap.has(n)) e.classList.add("red");
        else if (c === 1) e.classList.add("blue");
    }

    const markCountListElem = document.getElementById("mark_count_list")!;
    markCountListElem.innerHTML = "";
    for (const v of Array.from(markStr.keys()).sort()) {
        const c = markMap.get(v) ?? 0;
        markCountListElem.appendChild(document.createElement("span")).textContent = `${markStr.get(v)!}:${c}`;
    }

    const highLevelStr = (original: Level) => {
        const lv = parseInt(original.level);
        switch (original.jobclass) {
            case "0":
                return "";
            case "1":
                if (lv < 75) {
                    return "";
                }
                return `(${jobclassStr.get("2")}Lv${lv - 45})`;
            case "2":
                if (lv < 30 || lv + 45 > 90) {
                    return "";
                }
                break;
        }
        return `(${jobclassStr.get(original.jobclass)}Lv${original.level})`;
    };

    const templateElem = document.getElementById("map_item_template") as HTMLTemplateElement;

    takaraMapList.forEach(tm => {

        if (!matchFilter(filter, tm)) {
            return;
        }

        const fragment = templateElem.content.cloneNode(true) as DocumentFragment;
        const elem = (cn: string) => fragment.querySelector(`:scope .item-${cn}`)!;
        const text = (cn: string, t: string) => elem(cn).textContent = t;
        const child = (cn: string) => elem(cn).appendChild(document.createElement("span"));

        (elem("id") as HTMLInputElement).value = `${tm.id}`;

        text("grade", gradeStr.get(tm.form.grade)!);
        text("location", locationStr.get(tm.form.location)!);
        if (locationMap.get(tm.form.location) !== 1) {
            elem("location").classList.add("red");
        }
        const lowLevel = getLowLevel(tm.form);
        text("jobclass", jobclassStr.get(lowLevel.jobclass)!);
        text("level", lowLevel.level);
        text("recomend-note", highLevelStr(tm.form));
        text("field", fieldStr.get(tm.form.field)!);
        text("name", tm.form.name);
        for (let i = 0; i < 3; i++) {
            const m = tm.form.monster[i];
            text(`monster${i+1}`, m);
            if (monsterMap.get(m) === 1) {
                elem(`monster${i+1}`).classList.add("blue");
            }
            text(`monster${i+1}count`, tm.form.count[i]);
        }
        text("boss", tm.form.boss);
        if (bossMap.get(tm.form.boss) === 1) {
            elem("boss").classList.add("blue");
        }
        tm.form.special.forEach(sp => {
            const ch = child("special");
            ch.textContent = sp;
            if (monsterMap.has(sp) || bossMap.has(sp)) {
                ch.classList.add("red");
            } else if (specialMap.get(sp) === 1) {
                ch.classList.add("blue");
            }
        });
        tm.form.standard.forEach(sp => {
            const ch = child("standard");
            ch.textContent = sp;
            if (monsterMap.has(sp) || bossMap.has(sp)) {
                ch.classList.add("red");
            } else if (standardMap.get(sp) === 1) {
                ch.classList.add("blue");
            }
        });
        text("metal", tm.form.metal);
        (elem("mark") as HTMLSelectElement).value = tm.mark;

        const mark = elem("mark") as HTMLSelectElement;
        const button = elem("delete");
        const check = elem("check") as HTMLInputElement;

        listElem.appendChild(fragment);

        mark.addEventListener("change", () => {
            tm.mark = mark.value;
            saveData();
        });

        button.addEventListener("click", () => {
            if (!check.checked) {
                alert("DELにチェックを入れないと削除できません");
                return;
            }
            deleteTakaraMap(tm.id);
            saveData();
            showList();
        });
    });
}


function addToList(form: TakaraMapForm): number {
    const id = takaraMapId++;
    takaraMapList.push({
        id: id,
        form: form,
        mark: "0"
    });
    return id;
}

function readForm(): TakaraMapForm {
    const form = document.getElementById("add_form") as HTMLFormElement;
    const elems = form.elements;
    const sel = (name: string) => (elems.namedItem(name) as HTMLSelectElement).value;
    const value = (name: string) => (elems.namedItem(name) as HTMLInputElement).value.trim();

    const takaraMapForm: TakaraMapForm = {
        grade: sel("grade"),
        location: sel("location"),
        jobclass: sel("jobclass"),
        level: value("level"),
        field: sel("field"),
        name: value("name"),
        monster: [value("monster1"), value("monster2"), value("monster3")],
        count: [value("monster1count"), value("monster2count"), value("monster3count")],
        boss: value("boss"),
        special: value("special").replaceAll("　", " ").split(/\s+/),
        standard: value("standard").replaceAll("　", " ").split(/\s+/),
        metal: value("metal"),
    };

    const lowLevel = getLowLevel(takaraMapForm);
    takaraMapForm.jobclass = lowLevel.jobclass;
    takaraMapForm.level = lowLevel.level;

    takaraMapForm.count = takaraMapForm.count.map(c => getMonsterCountByGrade(takaraMapForm.grade) ?? c);

    return takaraMapForm;
}

function clearForm(): void {
    const form = document.getElementById("add_form") as HTMLFormElement;
    form.reset();
}


document.getElementById("open_dialog")!.addEventListener("click", () => {
    const dialog = document.getElementById("add_dialog") as HTMLDialogElement;
    dialog.showModal();
});

document.getElementById("cancel")!.addEventListener("click", () => {
    const dialog = document.getElementById("add_dialog") as HTMLDialogElement;
    dialog.returnValue = "cancel";
    dialog.close();
});

document.getElementById("download")!.addEventListener("click", () => {
    const order = (document.getElementById("list_order") as HTMLSelectElement).value;
    const data: TakaraMapStorage = {
        id: takaraMapId,
        list: takaraMapList,
        order: order
    };
    showDownloadDataLink("download_link", data);
});

document.getElementById("upload")!.addEventListener("click", () => {
    loadDataFile();
});

document.getElementById("add_dialog")!.addEventListener("close", () => {
    const dialog = document.getElementById("add_dialog") as HTMLDialogElement;
    if (dialog.returnValue !== "submit") {
        return;
    }

    const form = readForm();
    const id = addToList(form);
    sortList();
    saveData();
    updateSuggestion();
    showList();
    clearForm();
    for (const elem of document.getElementById("map_list")!.querySelectorAll(":scope .item-id")) {
        if ((elem as HTMLInputElement).value === `${id}`) {
            elem.parentElement!.scrollIntoView();
            break;
        }
    }
});

document.getElementById("grade")!.addEventListener("change", () => {
    const gradeElem = document.getElementById("grade") as HTMLSelectElement;
    const grade = gradeElem.value;
    const count = getMonsterCountByGrade(grade) ?? "1";

    const elem = (id: string) => document.getElementById(id) as HTMLInputElement;
    const value = (id: string, v: string) => elem(id).value = v;

    value("monster1count", count);
    value("monster2count", count);
    value("monster3count", count);
});

document.getElementById("list_order")!.addEventListener("change", () => {
    sortList();
    saveData();
    showList();
});

document.getElementById("filter_monster")!.addEventListener("change", () => {
    showList();
});

document.getElementById("filter_boss")!.addEventListener("change", () => {
    showList();
});

document.getElementById("filter_fieldmonster")!.addEventListener("change", () => {
    showList();
});

document.getElementById("filter_targets")!.addEventListener("change", () => {
    showList();
});

window.addEventListener("pagehide", () => {
    saveSession();
    saveData();
});

window.addEventListener("load", () => {
    loadSession();
    loadData();
});

