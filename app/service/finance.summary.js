import {CashierShiftCashIn, CashierShiftCashOut, Branch, OrderPayment, Order, RefundItem, OrderItem} from "../model/model.js";
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js";
import tz from "dayjs/plugin/timezone.js";
import {Op, Sequelize} from "sequelize";
import {sequelize} from "../../infrastructure/database/mysql.js";
import {prefixId} from "../../util/util.js";
import {NotFoundException} from "../../exception/not.found.exception.js";

dayjs.extend(utc);
dayjs.extend(tz);

const ZONE = "Asia/Jakarta";

const fetchFinanceSummary = async (param) => {
    const branchFilter = param.branch_id

    const branch = {
        id: "all",
        name: "Semua Cabang"
    }

    if (branchFilter) {
        const existBranch = await Branch.findByPk(branchFilter)
        if (!existBranch) throw new NotFoundException("branch not found")
        branch.id = prefixId('branch', existBranch.id)
        branch.name = existBranch.name
    }

    const totalIncome = await fetchCurrentMonthIncomes(branchFilter)

    const {totalTodayExpenses, todayChartData} = await fetchTodayExpenses(branchFilter)
    const {totalWeekExpenses, weekChartData} = await fetchWeekExpenses(branchFilter)
    const {totalMonthExpenses, monthChartData} = await fetchMonthExpenses(branchFilter)
    const {totalYearExpenses, yearChartData} = await fetchYearExpenses(branchFilter)

    return {
        branch,
        income: totalIncome,
        expenses: {
            totalExpenses: {
                today: totalTodayExpenses,
                week: totalWeekExpenses,
                month: totalMonthExpenses,
                year: totalYearExpenses,
            },
            chartData: {
                today: todayChartData,
                week: weekChartData,
                month: monthChartData,
                year: yearChartData,
            }
        },
    }
}

export const fetchCurrentMonthIncomes = async (branchFilter) => {
    const monthStart = dayjs().tz(ZONE).startOf("month").toDate();
    const now = dayjs().tz(ZONE).toDate();

    // --- GROSS SALES per branch ---
    let salesPerBranch = await OrderPayment.findAll({
        attributes: [
        [Sequelize.col("order.fk_branch_id"), "branch_id"],
        [Sequelize.fn("SUM", Sequelize.col("amount")), "gross_sales"],
        ],
        include: [
        {
            model: Order,
            attributes: [],
            required: true,
            where: {
            ...(branchFilter ? { fk_branch_id: branchFilter } : {}),
            },
        },
        ],
        where: {
        status: { [Op.eq]: 'Lunas' },
        createdAt: { [Op.between]: [monthStart, now] },
        },
        group: ["order.fk_branch_id"],
        raw: true,
    });

    if (!Array.isArray(salesPerBranch)) salesPerBranch = [];

    // --- REFUNDS per branch ---
    let refundsPerBranch = [];
    refundsPerBranch = await RefundItem.findAll({
        attributes: [
            [Sequelize.col("orderItem.order.fk_branch_id"), "branch_id"],
            [Sequelize.fn("SUM", Sequelize.col("amount")), "refund_total"],
        ],
        include: [
            {
                model: OrderItem,
                as: 'orderItem', // Specify the alias here
                attributes: [],
                required: true,
                include: [
                    {
                        model: Order,
                        attributes: [],
                        required: true,
                        where: {
                            ...(branchFilter ? { fk_branch_id: branchFilter } : {}),
                        },
                    },
                ],
            },
        ],
        where: {
            createdAt: { [Op.between]: [monthStart, now] },
        },
        group: ["orderItem.order.fk_branch_id"],
        raw: true,
    });

    // Ensure refundsPerBranch is always an array
    if (!Array.isArray(refundsPerBranch)) refundsPerBranch = [];

    // Mapping hasil ke object
    const salesMap = new Map(
        Array.isArray(salesPerBranch)
        ? salesPerBranch.map((r) => [r.branch_id, Number(r.gross_sales)])
        : []
    );
    const refundMap = new Map(
        Array.isArray(refundsPerBranch)
        ? refundsPerBranch.map((r) => [r.branch_id, Number(r.refund_total)])
        : []
    );

    const branchIds = new Set([...salesMap.keys(), ...refundMap.keys()]);
    const perBranch = Array.from(branchIds).map((branchId) => {
        const grossSales = salesMap.get(branchId) ?? 0;
        const refunds = refundMap.get(branchId) ?? 0;
        return {
        branch_id: Number(branchId),
        grossSales,
        refunds,
        netIncome: grossSales - refunds,
        };
    });

    const totals = perBranch.reduce(
        (acc, b) => {
        acc.grossSales += b.grossSales;
        acc.refunds += b.refunds;
        return acc;
        },
        { grossSales: 0, refunds: 0 }
    );

    return {
        period: { start: monthStart, end: now },
        total: {
        grossSales: totals.grossSales,
        refunds: totals.refunds,
        netIncome: totals.grossSales - totals.refunds,
        },
        perBranch,
    };
};

const fetchTodayExpenses = async (branchFilter) => {
    const todayStart = dayjs().tz(ZONE).startOf("day");
    const todayEnd = todayStart.add(1, "day");

    const cashierShiftExpenses = await sequelize.query(
        `
            SELECT co.amount, co.createdAt
            FROM cashier_shift_cash_outs as co
                     JOIN cashier_shifts as cs ON cs.id = co.fk_cashier_shift_id
            WHERE co.createdAt BETWEEN :startDate AND :endDate
                ${branchFilter ? "AND fk_branch_id = :branchFilter" : ""}
        `,
        {
            replacements: {
                startDate: todayStart.toDate(),
                endDate: todayEnd.toDate(),
                branchFilter: branchFilter
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    )

    const expenses = []
    expenses.push(...cashierShiftExpenses.map((expense) => {
        return {
            amount: expense.amount, time: new Date(expense.createdAt), category: 'Kas Keluar'
        }
    }))

    if (!branchFilter) {
        const fundRequestExpenses = await sequelize.query(
            `
                SELECT SUM(ii.purchase_price * fri.quantity) AS amount, fr.createdAt
                FROM fund_requests as fr
                         JOIN fund_requests_item as fri ON fr.id = fri.fk_fund_request_id
                         JOIN inventory_items as ii ON fri.fk_inventory_item_id = ii.id
                WHERE fr.status in ('Disetujui', 'Beberapa Disetujui')
                  AND fri.status = 'Disetujui'
                  AND fr.createdAt >= :startDate
                  AND fr.createdAt < :endDate
                GROUP BY fr.createdAt;`,
            {
                replacements: {
                    startDate: todayStart.toDate(),
                    endDate: todayEnd.toDate()
                },
                type: sequelize.QueryTypes.SELECT,
            }
        )

        expenses.push(...fundRequestExpenses.map((expense) => {
            return {
                amount: expense.amount, time: new Date(expense.createdAt), category: 'Permintaan Dana'
            }
        }))
    }

    const sortedExpenses = expenses.sort(
        (a, b) => a.time.getTime() - b.time.getTime()
    );

    console.log(sortedExpenses)

    const format = (date) => {
        return date.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        })
    }

    const categories = [
        ...new Set(sortedExpenses.map((expense) => format(expense.time)))
    ];


    const cashOutMap = new Map(
        sortedExpenses
            .filter((expense) => expense.category === 'Kas Keluar')
            .map((expense) => [format(expense.time), expense.amount])
    )

    const fundRequestMap = new Map(
        sortedExpenses
            .filter((expense) => expense.category === 'Permintaan Dana')
            .map((expense) => [format(expense.time), expense.amount])
    )

    const chartData = {
        categories,
        series: [
            {name: "Kas Keluar", data: categories.map((time) => (cashOutMap.get(time) ?? 0))},
            {name: "Permintaan Dana", data: categories.map((time) => (fundRequestMap.get(time) ?? 0))}
        ]
    }

    const totalExpenses = sortedExpenses.reduce((acc, expense) => acc + expense.amount, 0)

    return {
        totalTodayExpenses: totalExpenses,
        todayChartData: chartData,
    }
}

const fetchWeekExpenses = async (branchFilter) => {
    const today = dayjs().tz(ZONE).startOf("day");

    const toMonSunIndex = (jsDay) => (jsDay + 6) % 7;

    const dow = today.day();
    const daysFromMonday = toMonSunIndex(dow);
    const weekStart = today.subtract(daysFromMonday, "day");
    const weekEnd = weekStart.add(7, "day");

    const cashierShiftExpenses = await sequelize.query(
        `
            SELECT co.amount, co.createdAt
            FROM cashier_shift_cash_outs as co
                     JOIN cashier_shifts as cs ON cs.id = co.fk_cashier_shift_id
            WHERE co.createdAt BETWEEN :startDate AND :endDate
                ${branchFilter ? "AND fk_branch_id = :branchFilter" : ""}
        `,
        {
            replacements: {
                startDate: weekStart.toDate(),
                endDate: weekEnd.toDate(),
                branchFilter: branchFilter
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    )


    const expenses = [];
    expenses.push(
        ...cashierShiftExpenses.map((e) => ({
            amount: Number(e.amount) || 0,
            time: new Date(e.createdAt),
            category: "Kas Keluar",
        }))
    );


    if (!branchFilter) {
        const fundRequestRows = await sequelize.query(
            `
                SELECT fr.id,
                       SUM(ii.purchase_price * fri.quantity) AS amount,
                       fr.createdAt
                FROM fund_requests AS fr
                         JOIN fund_requests_item AS fri ON fr.id = fri.fk_fund_request_id
                         JOIN inventory_items AS ii ON fri.fk_inventory_item_id = ii.id
                WHERE fr.status IN ('Disetujui', 'Beberapa Disetujui')
                  AND fri.status = 'Disetujui'
                  AND fr.createdAt >= :startDate
                  AND fr.createdAt < :endDate
                GROUP BY fr.id, fr.createdAt;
            `,
            {
                replacements: {
                    startDate: weekStart.toDate(),
                    endDate: weekEnd.toDate(),
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        expenses.push(
            ...fundRequestRows.map((r) => ({
                amount: Number(r.amount) || 0,
                time: new Date(r.createdAt),
                category: "Permintaan Dana",
            }))
        );
    }


    const categories = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
    const kasKeluarByDay = Array(7).fill(0);
    const permintaanDanaByDay = Array(7).fill(0);

    for (const exp of expenses) {
        const jsDay = exp.time.getDay();
        const idx = toMonSunIndex(jsDay);
        if (exp.category === "Kas Keluar") {
            kasKeluarByDay[idx] += exp.amount;
        } else if (exp.category === "Permintaan Dana") {
            permintaanDanaByDay[idx] += exp.amount;
        }
    }


    const chartData = {
        categories,
        series: [
            {name: "Kas Keluar", data: kasKeluarByDay},
            {name: "Permintaan Dana", data: permintaanDanaByDay},
        ],
    };


    const totalWeekExpenses =
        kasKeluarByDay.reduce((a, b) => a + b, 0) +
        permintaanDanaByDay.reduce((a, b) => a + b, 0);

    return {
        totalWeekExpenses,
        weekChartData: chartData,
    };
};

const fetchMonthExpenses = async (branchFilter) => {
    const monthStart = dayjs().tz(ZONE).startOf("month");
    const monthEnd = monthStart.add(1, "month");

    const cashierShiftExpenses = await sequelize.query(
        `
            SELECT co.amount, co.createdAt
            FROM cashier_shift_cash_outs as co
                     JOIN cashier_shifts as cs ON cs.id = co.fk_cashier_shift_id
            WHERE co.createdAt BETWEEN :startDate AND :endDate
                ${branchFilter ? "AND fk_branch_id = :branchFilter" : ""}
        `,
        {
            replacements: {
                startDate: monthStart.toDate(),
                endDate: monthEnd.toDate(),
                branchFilter: branchFilter
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    )

    const expenses = [];
    expenses.push(
        ...cashierShiftExpenses.map((e) => ({
            amount: Number(e.amount) || 0,
            time: new Date(e.createdAt),
            category: "Kas Keluar",
        }))
    );

    if (!branchFilter) {
        const fundRequestRows = await sequelize.query(
            `
                SELECT fr.id,
                       SUM(ii.purchase_price * fri.quantity) AS amount,
                       fr.createdAt
                FROM fund_requests AS fr
                         JOIN fund_requests_item AS fri ON fr.id = fri.fk_fund_request_id
                         JOIN inventory_items AS ii ON fri.fk_inventory_item_id = ii.id
                WHERE fr.status IN ('Disetujui', 'Beberapa Disetujui')
                  AND fri.status = 'Disetujui'
                  AND fr.createdAt >= :startDate
                  AND fr.createdAt < :endDate
                GROUP BY fr.id, fr.createdAt;
            `,
            {
                replacements: {
                    startDate: monthStart.toDate(),
                    endDate: monthEnd.toDate(),
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        expenses.push(
            ...fundRequestRows.map((r) => ({
                amount: Number(r.amount) || 0,
                time: new Date(r.createdAt),
                category: "Permintaan Dana",
            }))
        );
    }

    const categories = ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4"];
    const kasKeluarBuckets = [0, 0, 0, 0];
    const permintaanDanaBuckets = [0, 0, 0, 0];

    const bucketIndex = (d) => {
        const day = d.getDate();
        if (day <= 7) return 0;
        if (day <= 14) return 1;
        if (day <= 21) return 2;
        return 3;
    };

    for (const exp of expenses) {
        const idx = bucketIndex(exp.time);
        if (exp.category === "Kas Keluar") {
            kasKeluarBuckets[idx] += exp.amount;
        } else if (exp.category === "Permintaan Dana") {
            permintaanDanaBuckets[idx] += exp.amount;
        }
    }

    const chartData = {
        categories,
        series: [
            {name: "Kas Keluar", data: kasKeluarBuckets},
            {name: "Permintaan Dana", data: permintaanDanaBuckets},
        ],
    };

    const totalMonthExpenses =
        kasKeluarBuckets.reduce((a, b) => a + b, 0) +
        permintaanDanaBuckets.reduce((a, b) => a + b, 0);

    return {
        totalMonthExpenses,
        monthChartData: chartData,
    };
};

const fetchYearExpenses = async (branchFilter) => {
    const yearStart = dayjs().tz(ZONE).startOf("year");
    const yearEnd = yearStart.add(1, "year");

    const cashOutRows = await sequelize.query(
        `
            SELECT co.amount, co.createdAt
            FROM cashier_shift_cash_outs as co
                     JOIN cashier_shifts as cs ON cs.id = co.fk_cashier_shift_id
            WHERE co.createdAt BETWEEN :startDate AND :endDate
                ${branchFilter ? "AND fk_branch_id = :branchFilter" : ""}
        `,
        {
            replacements: {
                startDate: yearStart.toDate(),
                endDate: yearEnd.toDate(),
                branchFilter: branchFilter
            },
            type: Sequelize.QueryTypes.SELECT,
        }
    )

    const expenses = [];
    expenses.push(
        ...cashOutRows.map((e) => ({
            amount: Number(e.amount) || 0,
            time: new Date(e.createdAt),
            category: "Kas Keluar",
        }))
    );

    if (!branchFilter) {
        const fundRequestRows = await sequelize.query(
            `
                SELECT fr.id,
                       SUM(ii.purchase_price * fri.quantity) AS amount,
                       fr.createdAt
                FROM fund_requests AS fr
                         JOIN fund_requests_item AS fri ON fr.id = fri.fk_fund_request_id
                         JOIN inventory_items AS ii ON fri.fk_inventory_item_id = ii.id
                WHERE fr.status IN ('Disetujui', 'Beberapa Disetujui')
                  AND fri.status = 'Disetujui'
                  AND fr.createdAt >= :startDate
                  AND fr.createdAt < :endDate
                GROUP BY fr.id, fr.createdAt;
            `,
            {
                replacements: {
                    startDate: yearStart.toDate(),
                    endDate: yearEnd.toDate(),
                },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        expenses.push(
            ...fundRequestRows.map((r) => ({
                amount: Number(r.amount) || 0,
                time: new Date(r.createdAt),
                category: "Permintaan Dana",
            }))
        );
    }

    const categories = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const fundRequestByMonth = Array(12).fill(0);
    const cashOutByMonth = Array(12).fill(0);

    for (const exp of expenses) {
        const m = exp.time.getMonth();
        if (exp.category === "Permintaan Dana") {
            fundRequestByMonth[m] += exp.amount;
        } else if (exp.category === "Kas Keluar") {
            cashOutByMonth[m] += exp.amount;
        }
    }

    const yearChartData = {
        categories,
        series: [
            {name: "Kas Keluar", data: cashOutByMonth},
            {name: "Permintaan Dana", data: fundRequestByMonth},
        ],
    };

    const totalYearExpenses =
        fundRequestByMonth.reduce((a, b) => a + b, 0) +
        cashOutByMonth.reduce((a, b) => a + b, 0);

    return {
        totalYearExpenses,
        yearChartData,
    };
};

export default {
    fetchFinanceSummary,
}