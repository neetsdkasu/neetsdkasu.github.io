"use strict";
/* script */
class Lib {
    static parseInt(s) {
        const n = parseInt(s);
        return isNaN(n) ? null : n;
    }
    static bsearch(count, isLow) {
        let low = 0;
        let high = count;
        while (low + 1 < high) {
            const mid = (low + high) >>> 1;
            if (isLow(mid)) {
                low = mid;
            }
            else {
                high = mid;
            }
        }
        return isLow(low) ? low : -1;
    }
    static withDefault(m, k, d) {
        return m.has(k) ? m.get(k) : d;
    }
}
/* CP補正値（ネット調べ） */
const CPM = [
    0.094,
    0.16639787,
    0.21573247,
    0.25572005,
    0.29024988,
    0.3210876,
    0.34921268,
    0.3752356,
    0.39956728,
    0.4225,
    0.44310755,
    0.4627984,
    0.48168495,
    0.49985844,
    0.51739395,
    0.5343543,
    0.5507927,
    0.5667545,
    0.5822789,
    0.5974,
    0.6121573,
    0.6265671,
    0.64065295,
    0.65443563,
    0.667934,
    0.6811649,
    0.69414365,
    0.7068842,
    0.7193991,
    0.7317,
    0.7377695,
    0.74378943,
    0.74976104,
    0.7556855,
    0.76156384,
    0.76739717,
    0.7731865,
    0.77893275,
    0.784637,
    0.7903,
    0.7953,
    0.8003,
    0.8053,
    0.8103,
    0.8153,
    0.8203,
    0.8253,
    0.8303,
    0.8353,
    0.8403,
    0.8453,
    0.8503,
    0.8553,
    0.8603,
    0.8653 // Lv 55.0
];
/* レベルアップコスト（ネット調べ） */
const LVUPCOST = [
    [200, 1, 0],
    [200, 2, 0],
    [200, 1, 0],
    [200, 1, 0],
    [400, 1, 0],
    [400, 1, 0],
    [400, 1, 0],
    [400, 1, 0],
    [600, 1, 0],
    [600, 1, 0],
    [600, 1, 0],
    [600, 1, 0],
    [800, 1, 0],
    [800, 1, 0],
    [800, 1, 0],
    [800, 1, 0],
    [1000, 1, 0],
    [1000, 1, 0],
    [1000, 1, 0],
    [1000, 1, 0],
    [1300, 2, 0],
    [1300, 2, 0],
    [1300, 2, 0],
    [1300, 2, 0],
    [1600, 2, 0],
    [1600, 2, 0],
    [1600, 2, 0],
    [1600, 2, 0],
    [1900, 2, 0],
    [1900, 2, 0],
    [1900, 2, 0],
    [1900, 2, 0],
    [2200, 2, 0],
    [2200, 2, 0],
    [2200, 2, 0],
    [2200, 2, 0],
    [2500, 2, 0],
    [2500, 2, 0],
    [2500, 2, 0],
    [2500, 2, 0],
    [3000, 3, 0],
    [3000, 3, 0],
    [3000, 3, 0],
    [3000, 3, 0],
    [3500, 3, 0],
    [3500, 3, 0],
    [3500, 3, 0],
    [3500, 3, 0],
    [4000, 3, 0],
    [4000, 3, 0],
    [4000, 4, 0],
    [4000, 4, 0],
    [4500, 4, 0],
    [4500, 4, 0],
    [4500, 4, 0],
    [4500, 4, 0],
    [5000, 4, 0],
    [5000, 4, 0],
    [5000, 4, 0],
    [5000, 4, 0],
    [6000, 6, 0],
    [6000, 6, 0],
    [6000, 6, 0],
    [6000, 6, 0],
    [7000, 8, 0],
    [7000, 8, 0],
    [7000, 8, 0],
    [7000, 8, 0],
    [8000, 10, 0],
    [8000, 10, 0],
    [8000, 10, 0],
    [8000, 10, 0],
    [9000, 12, 0],
    [9000, 12, 0],
    [9000, 12, 0],
    [9000, 12, 0],
    [10000, 15, 0],
    [10000, 15, 0],
    [10000, 0, 10],
    [10000, 0, 10],
    [11000, 0, 10],
    [11000, 0, 10],
    [11000, 0, 12],
    [11000, 0, 12],
    [12000, 0, 12],
    [12000, 0, 12],
    [12000, 0, 15],
    [12000, 0, 15],
    [13000, 0, 15],
    [13000, 0, 15],
    [13000, 0, 17],
    [13000, 0, 17],
    [14000, 0, 17],
    [14000, 0, 17],
    [14000, 0, 20],
    [14000, 0, 20],
    [15000, 0, 20],
    [15000, 0, 20] // Lv 49.5 -> Lv 50.0
];
/* レベルアップコストの累積（自分で記録した）
 * ネット調べの累積と一致しないので自分でちまちま記録した
 * 累積のほしのすなが700ほどズレる謎
 */
const LVUPCOSTSUM = [
    [200, 1, 0],
    [400, 2, 0],
    [600, 3, 0],
    [800, 4, 0],
    [1200, 5, 0],
    [1600, 6, 0],
    [2000, 7, 0],
    [2400, 8, 0],
    [3000, 9, 0],
    [3600, 10, 0],
    [4200, 11, 0],
    [4800, 12, 0],
    [5400, 13, 0],
    [6200, 14, 0],
    [7000, 15, 0],
    [7800, 16, 0],
    [8600, 17, 0],
    [9600, 18, 0],
    [10600, 19, 0],
    [11600, 20, 0],
    [12900, 22, 0],
    [14200, 24, 0],
    [15500, 26, 0],
    [16800, 28, 0],
    [18100, 30, 0],
    [19700, 32, 0],
    [21300, 34, 0],
    [22900, 36, 0],
    [24800, 38, 0],
    [26700, 40, 0],
    [28600, 42, 0],
    [30500, 44, 0],
    [32700, 46, 0],
    [34900, 48, 0],
    [37100, 50, 0],
    [39300, 52, 0],
    [41800, 54, 0],
    [44300, 56, 0],
    [46800, 58, 0],
    [49300, 60, 0],
    [52300, 63, 0],
    [55300, 66, 0],
    [58300, 69, 0],
    [61300, 72, 0],
    [64800, 75, 0],
    [68300, 78, 0],
    [71800, 81, 0],
    [75300, 84, 0],
    [79300, 87, 0],
    [83300, 90, 0],
    [87300, 94, 0],
    [91300, 98, 0],
    [95800, 102, 0],
    [100300, 106, 0],
    [104800, 110, 0],
    [109300, 114, 0],
    [114300, 118, 0],
    [119300, 122, 0],
    [124300, 126, 0],
    [129300, 130, 0],
    [135300, 136, 0],
    [141300, 142, 0],
    [147300, 148, 0],
    [153300, 154, 0],
    [160300, 162, 0],
    [167300, 170, 0],
    [174300, 178, 0],
    [181300, 186, 0],
    [189300, 196, 0],
    [197300, 206, 0],
    [205300, 216, 0],
    [213300, 226, 0],
    [222300, 238, 0],
    [231300, 250, 0],
    [240300, 262, 0],
    [249300, 274, 0],
    [259300, 289, 0],
    [269300, 304, 0],
    [279300, 304, 10],
    [289300, 304, 20],
    [300300, 304, 30],
    [311300, 304, 40],
    [322300, 304, 52],
    [333300, 304, 64],
    [345300, 304, 76],
    [357300, 304, 88],
    [369300, 304, 103],
    [381300, 304, 118],
    [394300, 304, 133],
    [407300, 304, 148],
    [420300, 304, 165],
    [433300, 304, 182],
    [447300, 304, 199],
    [461300, 304, 216],
    [475300, 304, 236],
    [489300, 304, 256],
    [504300, 304, 276],
    [519300, 304, 296]
];
/* ライトポケモンのレベルアップコスト（自分で記録した）
 * 大半のライトポケモンがこれになるが、一部例外のポケモンがおる謎…
 */
const LIGHTLVUPCOSTSUM = [
    [3600, 3, 0],
    [7200, 6, 0],
    [10800, 10, 0],
    [14400, 14, 0],
    [18450, 18, 0],
    [22500, 22, 0],
    [26550, 26, 0],
    [30600, 30, 0],
    [35100, 34, 0],
    [39600, 38, 0],
    [44100, 42, 0],
    [48600, 46, 0],
    [54000, 52, 0],
    [59400, 58, 0],
    [64800, 64, 0],
    [70200, 70, 0],
    [76500, 78, 0],
    [82800, 86, 0],
    [89100, 94, 0],
    [95400, 102, 0],
    [102600, 111, 0],
    [109800, 120, 0],
    [117000, 129, 0],
    [124200, 138, 0],
    [131400, 147, 0],
    [139500, 158, 0],
    [147600, 169, 0],
    [155700, 180, 0],
    [164700, 194, 0],
    [173700, 208, 0],
    [182700, 208, 9],
    [191700, 208, 18],
    [201600, 208, 27],
    [211500, 208, 36],
    [221400, 208, 47],
    [231300, 208, 58],
    [242100, 208, 69],
    [252900, 208, 80],
    [263700, 208, 94],
    [274500, 208, 108],
    [286200, 208, 122],
    [297900, 208, 136],
    [309600, 208, 152],
    [321300, 208, 168],
    [333900, 208, 184],
    [346500, 208, 200],
    [359100, 208, 218],
    [371700, 208, 236],
    [385200, 208, 254],
    [398700, 208, 272]
];
/* ライトポケモン、コスト違いの謎（自分で記録した）
 * 最近リトレーンしたポケモンがこれになる謎？
 * ほしのすな+900と通常アメ+2になる箇所が１か所だけある…唯一の相違点
 * 昔リトレーンしたポケモンはこれにはなってない…
 */
const LIGHTLVUPCOSTSUM_X = [
    [3600, 3, 0],
    [7200, 6, 0],
    [10800, 10, 0],
    [14400, 14, 0],
    [18450, 18, 0],
    [22500, 22, 0],
    [26550, 26, 0],
    [30600, 30, 0],
    [35100, 34, 0],
    [39600, 38, 0],
    [44100, 42, 0],
    [48600, 46, 0],
    [54000, 52, 0],
    [59400, 58, 0],
    [64800, 64, 0],
    [70200, 70, 0],
    [76500, 78, 0],
    [82800, 86, 0],
    [89100, 94, 0],
    [95400, 102, 0],
    [102600, 111, 0],
    [109800, 120, 0],
    [117000, 129, 0],
    [124200, 138, 0],
    [132300, 149, 0],
    [140400, 160, 0],
    [148500, 171, 0],
    [156600, 182, 0],
    [165600, 196, 0],
    [174600, 210, 0],
    [183600, 210, 9],
    [192600, 210, 18],
    [202500, 210, 27],
    [212400, 210, 36],
    [222300, 210, 47],
    [232200, 210, 58],
    [243000, 210, 69],
    [253800, 210, 80],
    [264600, 210, 94],
    [275400, 210, 108],
    [287100, 210, 122],
    [298800, 210, 136],
    [310500, 210, 152],
    [322200, 210, 168],
    [334800, 210, 184],
    [347400, 210, 200],
    [360000, 210, 218],
    [372600, 210, 236],
    [386100, 210, 254],
    [399600, 210, 272]
];
/* ムゲンダイナのレベルアップコスト（自分で記録した）
 * ちょっとだけ強化してしまったのでレベル後半のみ
 * 強化差分は CPは1858から2477まで強化 Lv20.0 ほしのすな-21400 アメ-600 を消費
 * ほしのすなは他のポケモンと同じぽいので
 * Lv 15.0 -> Lv 20.0 の予想は
 * [ 1900, 60, 0], // Lv 15.0 -> Lv 15.5
 * [ 1900, 60, 0], // Lv 15.5 -> Lv 16.0
 * [ 1900, 60, 0], // Lv 16.0 -> Lv 16.5
 * [ 1900, 60, 0],
 * [ 2200, 60, 0], // Lv 17.0 -> Lv 17.5
 * [ 2200, 60, 0],
 * [ 2200, 60, 0], // Lv 18.0 -> Lv 18.5
 * [ 2200, 60, 0],
 * [ 2500, 60, 0], // Lv 19.0 -> Lv 19.5
 * [ 2500, 60, 0], // Lv 19.5 -> Lv 20.0
 */
const LVUPCOSTSUM_M = [
    [1900 - 21400, 60 - 600, 0],
    [3800 - 21400, 120 - 600, 0],
    [5700 - 21400, 180 - 600, 0],
    [7600 - 21400, 240 - 600, 0],
    [9800 - 21400, 300 - 600, 0],
    [12000 - 21400, 360 - 600, 0],
    [14200 - 21400, 420 - 600, 0],
    [16400 - 21400, 480 - 600, 0],
    [18900 - 21400, 540 - 600, 0],
    [21400 - 21400, 600 - 600, 0],
    [2500, 60, 0],
    [5000, 120, 0],
    [8000, 210, 0],
    [11000, 300, 0],
    [14000, 390, 0],
    [17000, 480, 0],
    [20500, 570, 0],
    [24000, 660, 0],
    [27500, 750, 0],
    [31000, 840, 0],
    [35000, 930, 0],
    [39000, 1020, 0],
    [43000, 1140, 0],
    [47000, 1260, 0],
    [51500, 1380, 0],
    [56000, 1500, 0],
    [60500, 1620, 0],
    [65000, 1740, 0],
    [70000, 1860, 0],
    [75000, 1980, 0],
    [80000, 2100, 0],
    [85000, 2220, 0],
    [91000, 2395, 0],
    [97000, 2570, 0],
    [103000, 2745, 0],
    [109000, 2920, 0],
    [116000, 3145, 0],
    [123000, 3370, 0],
    [130000, 3595, 0],
    [137000, 3820, 0],
    [145000, 4120, 0],
    [153000, 4420, 0],
    [161000, 4720, 0],
    [169000, 5020, 0],
    [178000, 5395, 0],
    [187000, 5770, 0],
    [196000, 6145, 0],
    [205000, 6520, 0],
    [215000, 7410, 0],
    [225000, 8300, 0],
    [235000, 8300, 100],
    [245000, 8300, 200],
    [256000, 8300, 300],
    [267000, 8300, 400],
    [278000, 8300, 600],
    [289000, 8300, 800],
    [301000, 8300, 1000],
    [313000, 8300, 1200],
    [325000, 8300, 1600],
    [337000, 8300, 2000],
    [350000, 8300, 2400],
    [363000, 8300, 2800],
    [376000, 8300, 3435],
    [389000, 8300, 4070],
    [403000, 8300, 4705],
    [417000, 8300, 5340],
    [431000, 8300, 6230],
    [445000, 8300, 7120],
    [460000, 8300, 8010],
    [475000, 8300, 8900]
].map(e => [e[0] + 21400, e[1] + 600, e[2]]);
const T00_NORMAL = "ノーマル";
const T01_FIRE = "ほのお";
const T02_WATER = "みず";
const T03_GRASS = "くさ";
const T04_ELECTRIC = "でんき";
const T05_ICE = "こおり";
const T06_FIGHTING = "かくとう";
const T07_POISON = "どく";
const T08_GROUND = "じめん";
const T09_FLYING = "ひこう";
const T10_PSYCHIC = "エスパー";
const T11_BUG = "むし";
const T12_ROCK = "いわ";
const T13_GHOST = "ゴースト";
const T14_DRAGON = "ドラゴン";
const T15_DARK = "あく";
const T16_STEEL = "はがね";
const T17_FAIRY = "フェアリー";
const TYPELIST = [
    T00_NORMAL,
    T01_FIRE,
    T02_WATER,
    T03_GRASS,
    T04_ELECTRIC,
    T05_ICE,
    T06_FIGHTING,
    T07_POISON,
    T08_GROUND,
    T09_FLYING,
    T10_PSYCHIC,
    T11_BUG,
    T12_ROCK,
    T13_GHOST,
    T14_DRAGON,
    T15_DARK,
    T16_STEEL,
    T17_FAIRY
];
const TYPE_EFFECTIVENESS = new Map([
    [T00_NORMAL, new Map([
            [T12_ROCK, -1], [T13_GHOST, -2], [T16_STEEL, -1]
        ])],
    [T01_FIRE, new Map([
            [T01_FIRE, -1], [T02_WATER, -1], [T03_GRASS, 1],
            [T05_ICE, 1], [T11_BUG, 1], [T12_ROCK, -1],
            [T14_DRAGON, -1], [T16_STEEL, 1]
        ])],
    [T02_WATER, new Map([
            [T01_FIRE, 1], [T02_WATER, -1], [T03_GRASS, -1],
            [T08_GROUND, 1], [T12_ROCK, 1], [T14_DRAGON, -1]
        ])],
    [T03_GRASS, new Map([
            [T01_FIRE, -1], [T02_WATER, 1], [T03_GRASS, -1],
            [T07_POISON, -1], [T08_GROUND, 1], [T09_FLYING, -1],
            [T11_BUG, -1], [T12_ROCK, 1], [T14_DRAGON, -1],
            [T16_STEEL, -1]
        ])],
    [T04_ELECTRIC, new Map([
            [T02_WATER, 1], [T03_GRASS, -1], [T04_ELECTRIC, -1],
            [T08_GROUND, -2], [T09_FLYING, 1], [T14_DRAGON, -1]
        ])],
    [T05_ICE, new Map([
            [T01_FIRE, -1], [T02_WATER, -1], [T03_GRASS, 1],
            [T05_ICE, -1], [T08_GROUND, 1], [T09_FLYING, 1],
            [T14_DRAGON, 1], [T16_STEEL, -1]
        ])],
    [T06_FIGHTING, new Map([
            [T00_NORMAL, 1], [T05_ICE, 1], [T07_POISON, -1],
            [T09_FLYING, -1], [T10_PSYCHIC, -1], [T11_BUG, -1],
            [T12_ROCK, 1], [T13_GHOST, -2], [T15_DARK, 1],
            [T16_STEEL, 1], [T17_FAIRY, -1]
        ])],
    [T07_POISON, new Map([
            [T03_GRASS, 1], [T07_POISON, -1], [T08_GROUND, -1],
            [T12_ROCK, -1], [T13_GHOST, -1], [T16_STEEL, -2],
            [T17_FAIRY, 1]
        ])],
    [T08_GROUND, new Map([
            [T01_FIRE, 1], [T03_GRASS, -1], [T04_ELECTRIC, 1],
            [T07_POISON, 1], [T09_FLYING, -2], [T11_BUG, -1],
            [T12_ROCK, 1], [T16_STEEL, 1]
        ])],
    [T09_FLYING, new Map([
            [T03_GRASS, 1], [T04_ELECTRIC, -1], [T06_FIGHTING, 1],
            [T11_BUG, 1], [T12_ROCK, -1], [T16_STEEL, -1]
        ])],
    [T10_PSYCHIC, new Map([
            [T06_FIGHTING, 1], [T07_POISON, 1], [T10_PSYCHIC, -1],
            [T15_DARK, -2], [T16_STEEL, -1]
        ])],
    [T11_BUG, new Map([
            [T01_FIRE, -1], [T03_GRASS, 1], [T06_FIGHTING, -1],
            [T07_POISON, -1], [T09_FLYING, -1], [T10_PSYCHIC, 1],
            [T13_GHOST, -1], [T15_DARK, 1], [T16_STEEL, -1],
            [T17_FAIRY, -1]
        ])],
    [T12_ROCK, new Map([
            [T01_FIRE, 1], [T05_ICE, 1], [T06_FIGHTING, -1],
            [T08_GROUND, -1], [T09_FLYING, 1], [T11_BUG, 1],
            [T16_STEEL, -1]
        ])],
    [T13_GHOST, new Map([
            [T00_NORMAL, -2], [T10_PSYCHIC, 1], [T13_GHOST, 1],
            [T15_DARK, -1]
        ])],
    [T14_DRAGON, new Map([
            [T14_DRAGON, 1], [T16_STEEL, -1], [T17_FAIRY, -2]
        ])],
    [T15_DARK, new Map([
            [T06_FIGHTING, -1], [T10_PSYCHIC, 1], [T13_GHOST, 1],
            [T15_DARK, -1], [T17_FAIRY, -1]
        ])],
    [T16_STEEL, new Map([
            [T01_FIRE, -1], [T02_WATER, -1], [T04_ELECTRIC, -1],
            [T05_ICE, 1], [T12_ROCK, 1], [T16_STEEL, -1],
            [T17_FAIRY, 1]
        ])],
    [T17_FAIRY, new Map([
            [T01_FIRE, -1], [T06_FIGHTING, 1], [T07_POISON, -1],
            [T14_DRAGON, 1], [T15_DARK, 1], [T16_STEEL, -1]
        ])]
]);
function typeEffectiveness(type1, type2, attackType) {
    const m = TYPE_EFFECTIVENESS.get(attackType);
    if (type1 === type2) {
        return Lib.withDefault(m, type1, 0);
    }
    else {
        return Lib.withDefault(m, type1, 0) + Lib.withDefault(m, type2, 0);
    }
}
const W00_SUNNY_CLEAR = "晴れ/快晴";
const W01_RAINY = "雨";
const W02_PARTLY_CLOUDY = "ときどき曇り";
const W03_CLOUDY = "曇り";
const W04_WINDY = "風";
const W05_SNOW = "雪";
const W06_FOG = "霧";
const WEATHER_BOOST_LIST = [
    [W00_SUNNY_CLEAR, [T01_FIRE, T03_GRASS, T08_GROUND]],
    [W01_RAINY, [T02_WATER, T04_ELECTRIC, T11_BUG]],
    [W02_PARTLY_CLOUDY, [T00_NORMAL, T12_ROCK]],
    [W03_CLOUDY, [T06_FIGHTING, T07_POISON, T17_FAIRY]],
    [W04_WINDY, [T09_FLYING, T10_PSYCHIC, T14_DRAGON]],
    [W05_SNOW, [T05_ICE, T16_STEEL]],
    [W06_FOG, [T13_GHOST, T15_DARK]]
];
const WEATHER_BOOST_MAP = WEATHER_BOOST_LIST.reduce((acc, e) => {
    acc.set(e[0], e[1]);
    e[1].forEach(t => acc.set(t, [e[0]]));
    return acc;
}, new Map());
const monsters = [];
function calcAttack(mon) {
    const f = Math.floor(mon.level) - 1;
    const c = Math.ceil(mon.level) - 1;
    if (f === c) {
        return Math.floor((mon.attackBase + mon.attackUniq) * CPM[f]);
    }
    else {
        const cpm = Math.sqrt((CPM[f] * CPM[f] + CPM[c] * CPM[c]) / 2);
        return Math.floor((mon.attackBase + mon.attackBase) * cpm);
    }
}
function addList(mon) {
    const ul = document.getElementById("pokemon_list");
    const li = ul.appendChild(document.createElement("li"));
    const attack = calcAttack(mon);
    li.textContent = `${mon.name} [${mon.types}] Lv:${mon.level} こうげき:${attack} わざ:[${mon.attacks.map(e => `(${e.type}:${e.value})`)}]`;
    monsters.push(mon);
}
function addPokemon() {
    const form = document.getElementById("add_form");
    const el = (name) => form.elements.namedItem(name).value;
    const mon = {
        name: el("name"),
        types: el("type1") === el("type2") ? [el("type1")] : [el("type1"), el("type2")],
        level: Lib.parseInt(el("level")),
        attackBase: Lib.parseInt(el("attack_base")),
        attackUniq: Lib.parseInt(el("attack_uniq")),
        attacks: [
            { type: el("attack1_type"), value: Lib.parseInt(el("attack1_value")) ?? -1 },
            { type: el("attack2_type"), value: Lib.parseInt(el("attack2_value")) ?? -1 },
            { type: el("attack3_type"), value: Lib.parseInt(el("attack3_value")) ?? -1 },
            { type: el("attack4_type"), value: Lib.parseInt(el("attack4_value")) ?? -1 },
            { type: el("attack5_type"), value: Lib.parseInt(el("attack5_value")) ?? -1 }
        ].filter(e => e.value >= 0),
    };
    addList(mon);
    form.reset();
}
function inferLevel() {
    const form = document.getElementById("add_form");
    const elm = (name) => form.elements.namedItem(name);
    const light = elm("light").checked;
    const candy = Lib.parseInt(elm("candy").value) ?? 0;
    const candyXL = Lib.parseInt(elm("candy_xl").value) ?? 0;
    // console.log(`candy:${candy}, candyXL:${candyXL}`);
    const search = (arr) => {
        return Lib.bsearch(arr.length, (i) => {
            const diff1 = arr.at(-1)[1] - arr[i][1];
            const diff2 = arr.at(-1)[2] - arr[i][2];
            return diff2 >= candyXL && diff1 >= candy;
        });
    };
    const isMatch = (arr, index) => {
        const diff1 = arr.at(-1)[1] - (index < 0 ? 0 : arr[index][1]);
        const diff2 = arr.at(-1)[2] - (index < 0 ? 0 : arr[index][2]);
        return diff2 === candyXL && diff1 === candy;
    };
    let level2 = 100;
    if (light) {
        const index1 = search(LIGHTLVUPCOSTSUM);
        const index2 = search(LIGHTLVUPCOSTSUM_X);
        if (isMatch(LIGHTLVUPCOSTSUM, index1)) {
            level2 -= LIGHTLVUPCOSTSUM.length - (index1 + 1);
        }
        else if (isMatch(LIGHTLVUPCOSTSUM_X, index2)) {
            level2 -= LIGHTLVUPCOSTSUM_X.length - (index2 + 1);
        }
        else {
            // unknown
            return;
        }
    }
    else {
        const index1 = search(LVUPCOSTSUM);
        const index2 = search(LVUPCOSTSUM_M);
        if (isMatch(LVUPCOSTSUM, index1)) {
            level2 -= LVUPCOSTSUM.length - (index1 + 1);
        }
        else if (isMatch(LVUPCOSTSUM_M, index2)) {
            level2 -= LVUPCOSTSUM_M.length - (index2 + 1);
        }
        else {
            // unknown
            return;
        }
    }
    elm("level").value = `${level2 / 2}`;
}
function calcRanking() {
    const form = document.getElementById("calc_form");
    const el = (name) => form.elements.namedItem(name).value;
    const elm = (name) => form.elements.namedItem(name);
    const type1 = el("type1");
    const type2 = el("type2");
    const useSpecialWeather = elm("use_special_weather").checked;
    const weather = useSpecialWeather ? el("weather") : "-";
    const info = document.getElementById("target_info");
    const ranking = document.getElementById("ranking");
    ranking.innerHTML = "";
    info.textContent = `タイプ:[${type1 === type2 ? [type1] : [type1, type2]}] 天候: ${weather}`;
    const items = [];
    if (useSpecialWeather) {
        monsters.forEach(mon => {
            const ATK = calcAttack(mon);
            mon.attacks.forEach(attack => {
                const boost = WEATHER_BOOST_MAP.get(attack.type)[0] === weather;
                const attackType = TYPE_EFFECTIVENESS.get(attack.type);
                const te = typeEffectiveness(type1, type2, attack.type);
                const effectiveness = Math.floor(Math.pow(1.6, te) * 10000) / 10000;
                const typeMatch = mon.types.includes(attack.type);
                items.push({
                    value: attack.value * ATK * (boost ? 1.2 : 1.0) * (typeMatch ? 1.2 : 1.0) * effectiveness,
                    weather: boost ? weather : "-",
                    monster: mon,
                    attack: attack,
                    effectiveness: effectiveness
                });
            });
        });
    }
    else {
        monsters.forEach(mon => {
            const ATK = calcAttack(mon);
            mon.attacks.forEach(attack => {
                const boostWeather = WEATHER_BOOST_MAP.get(attack.type)[0];
                const attackType = TYPE_EFFECTIVENESS.get(attack.type);
                const te = typeEffectiveness(type1, type2, attack.type);
                const effectiveness = Math.floor(Math.pow(1.6, te) * 10000) / 10000;
                const typeMatch = mon.types.includes(attack.type);
                items.push({
                    value: attack.value * ATK * 1.2 * (typeMatch ? 1.2 : 1.0) * effectiveness,
                    weather: boostWeather,
                    monster: mon,
                    attack: attack,
                    effectiveness: effectiveness
                });
                items.push({
                    value: attack.value * ATK * (typeMatch ? 1.2 : 1.0) * effectiveness,
                    weather: "-",
                    monster: mon,
                    attack: attack,
                    effectiveness: effectiveness
                });
            });
        });
    }
    items.sort((a, b) => b.value - a.value);
    for (let i = 0; i < Math.min(30, items.length); i++) {
        const item = items[i];
        const li = ranking.appendChild(document.createElement("li"));
        li.textContent = `${Math.floor(item.value)} [${item.weather[0]}]
            ${item.monster.name} Lv:${item.monster.level}
            わざ:(${item.attack.type}:${item.attack.value})
            効果:${item.effectiveness}`;
    }
}
document.getElementById("add_button").addEventListener("click", () => {
    const dialog = document.getElementById("add_form_dialog");
    const cancel = dialog.querySelector(".cancel");
    const form = document.getElementById("add_form");
    if (!(cancel.onclick)) {
        cancel.onclick = () => dialog.close();
    }
    if (!(dialog.onsubmit)) {
        dialog.onsubmit = () => addPokemon();
    }
    const candy = form.elements.namedItem("candy");
    if (!(candy.oninput)) {
        candy.oninput = () => inferLevel();
    }
    const candyXL = form.elements.namedItem("candy_xl");
    if (!(candyXL.oninput)) {
        candyXL.oninput = () => inferLevel();
    }
    const light = form.elements.namedItem("light");
    if (!(light.oninput)) {
        light.oninput = () => inferLevel();
    }
    dialog.showModal();
});
document.getElementById("calc_button").addEventListener("click", () => {
    const dialog = document.getElementById("calc_form_dialog");
    const cancel = dialog.querySelector(".cancel");
    if (!(cancel.onclick)) {
        cancel.onclick = () => dialog.close();
    }
    if (!(dialog.onsubmit)) {
        dialog.onsubmit = () => calcRanking();
    }
    dialog.showModal();
});
document.querySelectorAll(".types").forEach(e => {
    TYPELIST.forEach(t => {
        const opt = e.appendChild(document.createElement("option"));
        opt.value = t;
        opt.textContent = t;
    });
});
document.querySelectorAll(".weathers").forEach(e => {
    WEATHER_BOOST_LIST.forEach(t => {
        const opt = e.appendChild(document.createElement("option"));
        opt.value = t[0];
        opt.textContent = t[0];
    });
});
function loadMonsterSample() {
    fetch("./pokego/monstersample.json")
        .then(b => b.json())
        .then(json => {
        const samples = json;
        samples.forEach(mon => addList(mon));
    })
        .catch(err => {
        console.log(`${err}`);
        console.log(err);
    });
}
(function () {
    const params = new URLSearchParams(location.search);
    if (params.has("sample")) {
        loadMonsterSample();
    }
})();
