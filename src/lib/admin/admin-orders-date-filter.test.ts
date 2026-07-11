import {
  addIsoDays,
  defaultPaidOrdersDateFilter,
  describePaidDateFilter,
  formatIsoToDdMmYyyy,
  indiaDateRangeToUtcBounds,
  parseDdMmYyyyToIso,
  rangeForPreset,
  resolvePaidOrdersDateFilter,
  startOfWeekMonday,
  todayIsoDateInIndia,
} from "./admin-orders-date-filter";

describe("todayIsoDateInIndia", () => {
  it("returns YYYY-MM-DD", () => {
    expect(todayIsoDateInIndia(new Date("2026-07-11T10:00:00+05:30"))).toBe(
      "2026-07-11",
    );
  });
});

describe("parseDdMmYyyyToIso / formatIsoToDdMmYyyy", () => {
  it("round-trips", () => {
    expect(parseDdMmYyyyToIso("11-07-2026")).toBe("2026-07-11");
    expect(formatIsoToDdMmYyyy("2026-07-11")).toBe("11-07-2026");
  });

  it("rejects invalid dates", () => {
    expect(parseDdMmYyyyToIso("31-02-2026")).toBeNull();
    expect(parseDdMmYyyyToIso("11/07/2026")).toBeNull();
  });
});

describe("resolvePaidOrdersDateFilter", () => {
  const now = new Date("2026-07-11T12:00:00+05:30");

  it("defaults to today when params missing", () => {
    expect(resolvePaidOrdersDateFilter({ now })).toEqual(
      defaultPaidOrdersDateFilter(now),
    );
  });

  it("honors all=1", () => {
    expect(resolvePaidOrdersDateFilter({ all: "1", now })).toEqual({
      allOrders: true,
      fromDate: "",
      toDate: "",
      range: "all",
    });
  });

  it("honors range presets", () => {
    expect(resolvePaidOrdersDateFilter({ range: "yesterday", now })).toEqual({
      allOrders: false,
      fromDate: "2026-07-10",
      toDate: "2026-07-10",
      range: "yesterday",
    });
  });

  it("honors from/to ISO range as custom", () => {
    expect(
      resolvePaidOrdersDateFilter({
        from: "2026-07-01",
        to: "2026-07-10",
        now,
      }),
    ).toEqual({
      allOrders: false,
      fromDate: "2026-07-01",
      toDate: "2026-07-10",
      range: "custom",
    });
  });
});

describe("rangeForPreset", () => {
  const now = new Date("2026-07-11T12:00:00+05:30"); // Saturday

  it("computes week from Monday", () => {
    expect(startOfWeekMonday("2026-07-11")).toBe("2026-07-06");
    expect(rangeForPreset("week", now)).toEqual({
      fromDate: "2026-07-06",
      toDate: "2026-07-11",
    });
  });

  it("computes last month", () => {
    expect(rangeForPreset("last_month", now)).toEqual({
      fromDate: "2026-06-01",
      toDate: "2026-06-30",
    });
  });

  it("computes quarter and year", () => {
    expect(rangeForPreset("quarter", now)).toEqual({
      fromDate: "2026-07-01",
      toDate: "2026-07-11",
    });
    expect(rangeForPreset("year", now)).toEqual({
      fromDate: "2026-01-01",
      toDate: "2026-07-11",
    });
  });
});

describe("addIsoDays", () => {
  it("crosses months", () => {
    expect(addIsoDays("2026-07-01", -1)).toBe("2026-06-30");
  });
});

describe("indiaDateRangeToUtcBounds", () => {
  it("covers a full IST day as UTC instants", () => {
    const bounds = indiaDateRangeToUtcBounds("2026-07-11", "2026-07-11");
    expect(bounds).not.toBeNull();
    expect(bounds!.startUtc.toISOString()).toBe("2026-07-10T18:30:00.000Z");
    expect(bounds!.endExclusiveUtc.toISOString()).toBe(
      "2026-07-11T18:30:00.000Z",
    );
  });
});

describe("describePaidDateFilter", () => {
  it("describes presets and custom ranges", () => {
    expect(
      describePaidDateFilter({
        allOrders: false,
        fromDate: "2026-07-11",
        toDate: "2026-07-11",
        range: "today",
      }),
    ).toBe("Today");
    expect(
      describePaidDateFilter({
        allOrders: true,
        fromDate: "",
        toDate: "",
        range: "all",
      }),
    ).toBe("All orders");
    expect(
      describePaidDateFilter({
        allOrders: false,
        fromDate: "2026-07-01",
        toDate: "2026-07-10",
        range: "custom",
      }),
    ).toBe("01-07-2026 – 10-07-2026");
  });
});
