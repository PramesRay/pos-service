// src/services/employeeService.js
import { 
  Branch, 
  Employee, 
  User, 
} from "../model/model.js";
import { NotFoundException } from "../../exception/not.found.exception.js";
import { UnauthorizedException } from "../../exception/unauthorized.exception.js";

import admin from '../service/firebase.js';
import shiftService from "./shift.js";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { sequelize } from "../../infrastructure/database/mysql.js";
import { Sequelize } from "sequelize";

const getOne = async (uid) => {
  // Cari employee berdasarkan UID
  const employee = await Employee.findOne({
    where: { uid },
    include: [
      {model: Branch, as: "branch", attributes: ["id", "name"]},
      {model: User, as: "user"},
    ],
  });

  if (!employee) {
    throw new NotFoundException("Employee not found");
  } else if (!employee.role) {
    throw new UnauthorizedException("Account not verified yet");
  }
  
  let shift_emp = null;
  try {
    shift_emp = await shiftService.getCurrentEmployeeShift(employee);
  } catch {
    shift_emp = null;
  }
  
  const role = employee.role ?? null;
  const isAdminOwner = role === "admin" || role === "pemilik";
  const opRoles = ["gudang", "kasir", "dapur"];
  const branch = isAdminOwner || opRoles.includes(role) ? (shift_emp ? shift_emp.branch : employee.branch) : null;

  let shift_op = null;
  if (opRoles.includes(role) && branch?.id) {
    try {
      if (role === "gudang") {
        shift_op = await shiftService.getCurrentWarehouseShift(branch.id);
      } else if (role === "kasir") {
        shift_op = await shiftService.getCurrentCashierShift(branch.id);
      } else if (role === "dapur") {
        shift_op = await shiftService.getCurrentKitchenShift(branch.id);
      }
    } catch {
      shift_op = null;
    }
  }

  return {
    id: employee.id,
    uid: employee.uid,
    name: employee.name,
    user: employee.user,
    role,
    email: employee.email,
    assigned_branch: employee.branch,
    activity: {
      shift_emp: shift_emp,
      shift_op: shift_op,
      is_active: !!shift_emp && !shift_emp.end,
      branch,
      last_active: shift_emp ? shift_emp.end ?? shift_emp.start : null,
    },
    meta: {
      created_at: employee.createdAt,
      updated_at: employee.updatedAt,
    },
  };
};

const getAll = async (branchId) => {
  const where = {};

  if (branchId !== null && branchId !== undefined) {
    where.fk_branch_id = branchId;
  }

  const employees = await Employee.findAll({
    where,
    include: [
      {model: Branch, as: "branch", attributes: ["id", "name"]},
      {model: User, as: "user"},
    ],
    order: [["role", "ASC"], ["name", "ASC"]]
  });
  return Promise.all(
    employees.map(async (employee) => {
      let shift_emp = null;
      try {
        shift_emp = await shiftService.getCurrentEmployeeShift(employee);
      } catch {
        shift_emp = null;
      }
      
      const role = employee.role ?? null;
      const isAdminOwner = role === "admin" || role === "pemilik";
      const opRoles = ["gudang", "kasir", "dapur"];
      const branch = isAdminOwner || opRoles.includes(role) ? (shift_emp ? shift_emp.branch : employee.branch) : null;

      let shift_op = null;
      if (opRoles.includes(role) && branch?.id) {
        try {
          if (role === "gudang") {
            shift_op = await shiftService.getCurrentWarehouseShift(branch.id);
          } else if (role === "kasir") {
            shift_op = await shiftService.getCurrentCashierShift(branch.id);
          } else if (role === "dapur") {
            shift_op = await shiftService.getCurrentKitchenShift(branch.id);
          }
        } catch {
          shift_op = null;
        }
      }

      return {
        id: employee.id,
        uid: employee.uid,
        name: employee.name,
        role,
        email: employee.email,
        assigned_branch: employee.branch,
        activity: {
          shift_emp: shift_emp,
          shift_op: shift_op,
          is_active: !!shift_emp && !shift_emp.end,
          branch,
          last_active: shift_emp ? shift_emp.end ?? shift_emp.start : null,
        },
        meta: {
          created_at: employee.createdAt,
          updated_at: employee.updatedAt,
        },
      };
    })
  );
}

const update = async (uid, data) => {
  const employee = await Employee.findOne({
    where: { uid },
  });

  if (!employee) {
    throw new NotFoundException("Employee not found");
  }

  const { name, role, email, assigned_branch_id } = data;
  // Perbarui data
  await employee.update({
    name: name,
    role: role,
    email: email,
    fk_branch_id: assigned_branch_id,
  });
  return employee;
};

const remove = async (uid) => {
  const employee = await Employee.findOne({
    where: { uid },
  });

  if (!employee) {
    throw new NotFoundException("Employee not found");
  }

  // Hapus data
  const transaction = await sequelize.transaction();
  try {
    await employee.destroy({ transaction });
    // Hapus data user di firebase
    const userRecord = await admin.auth().getUser(uid);
    await admin.auth().deleteUser(userRecord.uid);
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
  
  return true;
};

dayjs.extend(utc);
dayjs.extend(timezone);

const ZONE = globalThis.ZONE || "Asia/Jakarta";

/**
 * Pilihan pembagi rata-rata:
 * - 'active'   : rata-rata hanya pada hari yang punya kehadiran (>0). (default — menghindari angka 0.14)
 * - 'calendar' : rata-rata dibagi jumlah hari kalender (7 untuk minggu, atau jumlah hari bulan tsb).
 */
const AVG_DENOM = "active"; // 'active' | 'calendar'

// ==============================
// Helpers
// ==============================
const toMonday = (d) => d.subtract((d.day() + 6) % 7, "day").startOf("day");

/** Daftar Senin dalam bulan berjalan (MTD), berhenti di Senin minggu sekarang. */
const weekStartsMTD = () => {
  const now = dayjs().tz(ZONE);
  const monthStart = now.startOf("month");
  const firstWeekMonday = toMonday(monthStart);
  const thisWeekMonday = toMonday(now);

  const weekStarts = [];
  let cur = firstWeekMonday;
  while (cur.isBefore(thisWeekMonday) || cur.isSame(thisWeekMonday)) {
    weekStarts.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(7, "day");
  }
  return { weekStarts, monthStart, today: now.startOf("day") };
};

/** Daftar awal bulan YTD hingga bulan berjalan. */
const monthStartsYTD = () => {
  const now = dayjs().tz(ZONE);
  const yearStart = now.startOf("year");
  const arr = [];
  let cur = yearStart;
  while (cur.isBefore(now.startOf("month")) || cur.isSame(now.startOf("month"))) {
    arr.push(cur.format("YYYY-MM-01"));
    cur = cur.add(1, "month");
  }
  return { monthStarts: arr, yearStart, today: now.startOf("day") };
};

/** Enumerasi tanggal [start..end] (inklusif), hasil "YYYY-MM-DD" (zona ZONE). */
const enumerateDays = (start, end) => {
  const out = [];
  let cur = start.startOf("day");
  const last = end.startOf("day");
  while (cur.isBefore(last) || cur.isSame(last)) {
    out.push(cur.format("YYYY-MM-DD"));
    cur = cur.add(1, "day");
  }
  return out;
};

/** Hitung rata-rata dengan mode pembagi. */
const avgWithMode = (values, mode) => {
  const sum = values.reduce((a, b) => a + b, 0);
  if (mode === "active") {
    const denomActive = values.filter((v) => v > 0).length;
    const denom = denomActive || values.length; // fallback ke kalender jika semua 0
    return denom ? sum / denom : 0;
  }
  // calendar
  return values.length ? sum / values.length : 0;
};

// ==============================
// Main
// ==============================
/**
 * Recap kehadiran pegawai dengan output:
 * { current: number, week: number[], month: number[] }
 *
 * - current: jumlah pegawai unik yang hadir HARI INI (interval-overlap).
 * - week   : rata-rata harian per minggu (MTD), dipotong sampai minggu & hari ini.
 * - month  : rata-rata harian per bulan (YTD), bulan berjalan dipotong sampai hari ini.
 *
 * Param:
 *   param.branch_id / branchId (opsional) -> jika ada, return hanya untuk cabang tsb
 *   (jika tidak ada, fungsi menjumlahkan kehadiran lintas cabang dulu baru ambil rata-rata)
 */
export const attendanceSummaryAverages = async (param = {}) => {
  const branchFilter = param?.branch_id ?? param?.branchId ?? undefined;

  // waktu (timezone aware)
  const now = dayjs().tz(ZONE);
  const todayStart = now.startOf("day");
  const todayEnd = todayStart.add(1, "day");
  const zoneOffset = now.format("Z"); // e.g. "+07:00"

  // =========================================
  // CURRENT (hari ini) dengan interval-overlap
  // hadir jika: start < hari_ini_end AND (end IS NULL OR end >= hari_ini_start)
  // =========================================
  const currentRows = await sequelize.query(
    `
      SELECT es.fk_branch_id, COUNT(DISTINCT es.fk_employee_id) AS cnt
      FROM employee_shifts AS es
      WHERE 
        CONVERT_TZ(es.start, '+00:00', :zone) < :todayEnd
        AND (
          es.end IS NULL OR CONVERT_TZ(es.end, '+00:00', :zone) >= :todayStart
        )
        ${branchFilter ? "AND es.fk_branch_id = :bid" : ""}
      GROUP BY es.fk_branch_id
    `,
    {
      replacements: {
        zone: zoneOffset,
        todayStart: todayStart.toDate(),
        todayEnd: todayEnd.toDate(),
        bid: branchFilter,
      },
      type: Sequelize.QueryTypes.SELECT,
    }
  );
  const currentMap = new Map(currentRows.map((r) => [Number(r.fk_branch_id), Number(r.cnt)]));

  // =========================================
  // DAILY MTD (berdasarkan start shift) -> untuk weekly averages
  // =========================================
  const { weekStarts, monthStart, today } = weekStartsMTD();
  const dailyMTDRows = await sequelize.query(
    `
      SELECT 
        es.fk_branch_id,
        DATE(CONVERT_TZ(es.start, '+00:00', :zone)) AS day_local,
        COUNT(DISTINCT es.fk_employee_id) AS cnt
      FROM employee_shifts AS es
      WHERE 
        CONVERT_TZ(es.start, '+00:00', :zone) >= :mstart
        AND CONVERT_TZ(es.start, '+00:00', :zone) < :tend
        ${branchFilter ? "AND es.fk_branch_id = :bid" : ""}
      GROUP BY es.fk_branch_id, day_local
    `,
    {
      replacements: {
        zone: zoneOffset,
        mstart: dayjs(monthStart).tz(ZONE).startOf("day").toDate(),
        tend: todayEnd.toDate(),
        bid: branchFilter,
      },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  // Map MTD: branch -> (date -> headcount)
  const dailyMTDMap = new Map();
  for (const row of dailyMTDRows) {
    const bid = Number(row.fk_branch_id);
    const d = dayjs(row.day_local).format("YYYY-MM-DD");
    const cnt = Number(row.cnt) || 0;
    if (!dailyMTDMap.has(bid)) dailyMTDMap.set(bid, new Map());
    dailyMTDMap.get(bid).set(d, cnt);
  }

  // =========================================
  // DAILY YTD (berdasarkan start shift) -> untuk monthly averages
  // =========================================
  const { monthStarts, yearStart } = monthStartsYTD();
  const dailyYTDRows = await sequelize.query(
    `
      SELECT 
        es.fk_branch_id,
        DATE(CONVERT_TZ(es.start, '+00:00', :zone)) AS day_local,
        COUNT(DISTINCT es.fk_employee_id) AS cnt
      FROM employee_shifts AS es
      WHERE 
        CONVERT_TZ(es.start, '+00:00', :zone) >= :ystart
        AND CONVERT_TZ(es.start, '+00:00', :zone) < :tend
        ${branchFilter ? "AND es.fk_branch_id = :bid" : ""}
      GROUP BY es.fk_branch_id, day_local
    `,
    {
      replacements: {
        zone: zoneOffset,
        ystart: dayjs(yearStart).tz(ZONE).startOf("day").toDate(),
        tend: todayEnd.toDate(),
        bid: branchFilter,
      },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  // Map YTD: branch -> (date -> headcount)
  const dailyYTDMap = new Map();
  for (const row of dailyYTDRows) {
    const bid = Number(row.fk_branch_id);
    const d = dayjs(row.day_local).format("YYYY-MM-DD");
    const cnt = Number(row.cnt) || 0;
    if (!dailyYTDMap.has(bid)) dailyYTDMap.set(bid, new Map());
    dailyYTDMap.get(bid).set(d, cnt);
  }

  // =========================================
  // Builder untuk 1 cabang
  // =========================================
  const buildForBranch = (branchId) => {
    // current
    const current = currentMap.get(branchId) ?? 0;

    // WEEK averages (MTD)
    const week = weekStarts.map((ws) => {
      const weekStart = dayjs(ws).tz(ZONE);
      const weekEnd = weekStart.add(6, "day");
      // clip ke [monthStart..today]
      const startClip = weekStart.isBefore(monthStart) ? monthStart : weekStart;
      const endClip = weekEnd.isAfter(today) ? today : weekEnd;

      if (startClip.isAfter(endClip)) return 0;

      const days = enumerateDays(startClip, endClip);
      const perDayMap = dailyMTDMap.get(branchId) ?? new Map();
      const dailyCounts = days.map((d) => perDayMap.get(d) ?? 0);

      const avg = avgWithMode(dailyCounts, AVG_DENOM);
      return Number(avg.toFixed(2));
    });

    // MONTH averages (YTD)
    const month = monthStarts.map((ms) => {
      const mstart = dayjs(ms).tz(ZONE);
      const mend = mstart.add(1, "month").subtract(1, "day");
      const endClip = mend.isAfter(today) ? today : mend;

      if (mstart.isAfter(endClip)) return 0;

      const days = enumerateDays(mstart, endClip);
      const perDayMap = dailyYTDMap.get(branchId) ?? new Map();
      const dailyCounts = days.map((d) => perDayMap.get(d) ?? 0);

      const avg = avgWithMode(dailyCounts, AVG_DENOM);
      return Number(avg.toFixed(2));
    });

    return { current, week, month };
  };

  // =========================================
  // Return untuk 1 cabang (branchFilter) atau agregat seluruh cabang
  // =========================================
  if (branchFilter) {
    const branch = await Branch.findOne({ where: { id: branchFilter }, attributes: ["id"], raw: true });
    if (!branch) {
      return {
        current: 0,
        week: weekStarts.map(() => 0),
        month: monthStarts.map(() => 0),
      };
    }
    return buildForBranch(branch.id);
  }

  // Agregasi lintas cabang:
  // 1) jumlahkan daily headcount antar cabang → map agregat,
  // 2) hitung rata-rata mingguan/bulanan dari daily agregat.
  const sumDailyMaps = (srcMap) => {
    const agg = new Map(); // day -> total
    for (const [, perDay] of srcMap.entries()) {
      for (const [d, cnt] of perDay.entries()) {
        agg.set(d, (agg.get(d) ?? 0) + cnt);
      }
    }
    return agg;
  };

  const aggDailyMTD = sumDailyMaps(dailyMTDMap);
  const aggDailyYTD = sumDailyMaps(dailyYTDMap);
  dailyMTDMap.set(0, aggDailyMTD);
  dailyYTDMap.set(0, aggDailyYTD);

  // current agregat
  const allBranchIds = await Branch.findAll({ attributes: ["id"], raw: true });
  const totalCurrent = allBranchIds.reduce((acc, b) => acc + (currentMap.get(b.id) ?? 0), 0);
  currentMap.set(0, totalCurrent);

  // build untuk "semua cabang"
  return buildForBranch(0);
};

export default {
  getOne,
  getAll,
  update,
  remove,

  attendanceSummaryAverages,
};