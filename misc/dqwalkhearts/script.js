"use strict";
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
    Color[Color["Green"] = 4] = "Green";
    Color[Color["Purple"] = 8] = "Purple";
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
    { id: 208, name: "まものマスター",
        colors: [Color.Rainbow, Color.Rainbow, Color.Blue | Color.Purple, Color.Blue | Color.Purple] },
];
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
        update(i, "green", color & Color.Green);
        update(i, "purple", color & Color.Purple);
        update(i, "red", color & Color.Red);
        update(i, "blue", color & Color.Blue);
        update(i, "omit", color & Color.None);
    }
}
document.getElementById("apply_preset_heartset")
    .addEventListener("click", () => {
    const sel = document.getElementById("preset_heartset");
    const value = parseInt(sel.value);
    for (const job of JobPreset) {
        if (job.id === value) {
            alert(`select is ${job.name}`);
            setPreset(job);
            return;
        }
    }
    alert(`Unknown ID: ${value}`);
});
