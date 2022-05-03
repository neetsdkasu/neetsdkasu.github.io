const LAST_YEAR = 2022;
const LAST_MONTH = 4;

function csvFileName(id, year, month) {
    return `${id}${year}${leadingZeros(2, month)}.csv`;
}

const dataSet = [
    {
        title: "weight (wake up)",
        id: "weight",
        unit: "kg",
        start_year: 2019,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [[2020,6],[2020,7],[2020,8],[2020,9],[2020,10],[2020,11]],
    },
    {
        title: "wake up",
        id: "wakeup",
        unit: "hour",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "go to bed",
        id: "tobed",
        unit: "hour",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "sleep",
        id: "sleep",
        unit: "hours",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "interrupt sleep",
        id: "interrupt",
        unit: "",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "early body temperature (wake up)",
        id: "earlytemp",
        unit: "degrees Celsius",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "normal body temperature (wake up)",
        id: "normaltemp",
        unit: "degrees Celsius",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "normal body temperature (evening)",
        id: "evening",
        unit: "degrees Celsius",
        start_year: 2021,
        start_month: 11,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omit: [],
    },
    {
        title: "weight (after dinner)",
        id: "dinner",
        unit: "kg",
        start_year: 2006,
        start_month: 7,
        end_year: 2020,
        end_month: 5,
        omit: function(y, m) {
            return (2006 < y && y < 2019)
                || (y === 2006 && (m < 7 || m > 11))
                || (y === 2019 && m < 9);
        },
    },
];
