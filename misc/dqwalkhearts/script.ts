
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

interface Monster {
    name: string;
    color: Color;
    cost: number;
    hearts: Heart[];
    target: Rank | null;
}

interface Heart {
    rank: Rank;
    maximumHP: number;
    maximumMP: number;
    power: number;
    deffence: number;
    attackMagic: number;
    recoverMagic: number;
    speed: number;
    deftness: number;
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
        colors: [Color.Rainbow, Color.Yellow,  Color.Yellow, Color.None] },
    { id: 102, name: "魔法使い",
        colors: [Color.Rainbow, Color.Purple,  Color.Purple, Color.None] },
    { id: 103, name: "僧侶",
        colors: [Color.Rainbow, Color.Green,   Color.Green,  Color.None] },
    { id: 104, name: "武闘家",
        colors: [Color.Rainbow, Color.Red,     Color.Red,    Color.None] },
    { id: 105, name: "盗賊",
        colors: [Color.Rainbow, Color.Blue,    Color.Blue,   Color.None] },
    { id: 106, name: "踊り子",
        colors: [Color.Rainbow, Color.Blue,    Color.Green,  Color.None] },
    { id: 107, name: "遊び人",
        colors: [Color.Rainbow, Color.Blue,    Color.Purple, Color.None] },
    { id: 201, name: "バトルマスター",
        colors: [Color.Yellow|Color.Red, Color.Rainbow, Color.Red, Color.Red] },
    { id: 202, name: "賢者",
        colors: [Color.Green|Color.Purple, Color.Rainbow, Color.Green|Color.Purple, Color.Green|Color.Purple] },
    { id: 203, name: "レンジャー",
        colors: [Color.Red|Color.Blue, Color.Rainbow, Color.Blue, Color.Red] },
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

function setPreset(job: Job) {
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
}

function dialogAlert(msg: string) {
    document.getElementById("alert_message")!.textContent = msg;
    const dialog = document.getElementById("alert_dialog")! as HTMLDialogElement;
    dialog.showModal();
}

document.getElementById("apply_preset_heartset")!
.addEventListener("click", () => {
    const sel = document.getElementById("preset_heartset") as HTMLSelectElement;
    const value = parseInt(sel.value);
    for (const job of JobPreset) {
        if (job.id === value) {
            setPreset(job);
            return;
        }
    }
    dialogAlert(`Unknown ID: ${value}`);
});