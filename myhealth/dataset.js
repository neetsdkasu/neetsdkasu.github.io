const LAST_YEAR = 2021;
const LAST_MONTH = 10;

const dataSet = [
    {
        title: "weight (wake up)",
        id: "weight",
        start_year: 2019,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [[2020,6],[2020,7],[2020,8],[2020,9],[2020,10],[2020,11]],
    },
    {
        title: "wake up",
        id: "wakeup",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "go to bed",
        id: "tobed",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "sleep",
        id: "sleep",
        start_year: 2021,
        start_month: 7,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "interrupt sleep",
        id: "interrupt",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "early body temperature (wake up)",
        id: "earlytemp",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "normal body temperature (wake up)",
        id: "normaltemp",
        start_year: 2021,
        start_month: 9,
        end_year: LAST_YEAR,
        end_month: LAST_MONTH,
        omits: [],
    },
    {
        title: "weight (after dinner)",
        id: "dinner",
        start_year: 2006,
        start_month: 7,
        end_year: 2020,
        end_month: 5,
        omits: function(y, m) {
            return (2006 < y && y < 2019)
                || (y === 2006 && (m < 7 || m > 11))
                || (y === 2019 && m < 9);
        },
    },
];
