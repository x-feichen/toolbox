import { describe, expect, it } from "vitest";
import { csvToJson, jsonToCsv } from "./csv-json";

describe("csvToJson", () => {
  it("parses simple CSV with string values", () => {
    const records = csvToJson("name,age\nTom,18\nJack,20");
    expect(records).toEqual([
      { name: "Tom", age: "18" },
      { name: "Jack", age: "20" },
    ]);
  });

  it("handles quoted fields with commas and escaped quotes", () => {
    const records = csvToJson('name,note\n"Tom, Jr.","said ""hi"""');
    expect(records).toEqual([{ name: "Tom, Jr.", note: 'said "hi"' }]);
  });

  it("handles newlines inside quoted fields", () => {
    const records = csvToJson("name,note\nTom,\"line1\nline2\"");
    expect(records).toEqual([{ name: "Tom", note: "line1\nline2" }]);
  });

  it("handles empty values", () => {
    const records = csvToJson("a,b,c\n1,,3");
    expect(records).toEqual([{ a: "1", b: "", c: "3" }]);
  });

  it("supports CJK and UTF-8", () => {
    const records = csvToJson("名字,城市\n小明,北京");
    expect(records).toEqual([{ 名字: "小明", 城市: "北京" }]);
  });
});

describe("jsonToCsv", () => {
  it("serializes objects with a header row", () => {
    const csv = jsonToCsv('[{"name":"Tom","age":18},{"name":"Jack","age":20}]');
    expect(csv).toBe("name,age\nTom,18\nJack,20");
  });

  it("escapes values containing commas, quotes and newlines", () => {
    const csv = jsonToCsv('[{"note":"a,b \\"c\\""}]');
    expect(csv).toBe('note\n"a,b ""c"""');
  });

  it("unifies columns across records", () => {
    const csv = jsonToCsv('[{"a":1},{"b":2}]');
    expect(csv).toBe("a,b\n1,\n,2");
  });

  it("rejects invalid JSON with a friendly error", () => {
    expect(() => jsonToCsv("{bad")).toThrow("JSON");
  });

  it("rejects non-array JSON", () => {
    expect(() => jsonToCsv('{"a":1}')).toThrow("对象数组");
  });
});

describe("round trip", () => {
  it("csv -> json -> csv is stable for simple data", () => {
    const csv = "name,age\nTom,18\nJack,20";
    expect(jsonToCsv(JSON.stringify(csvToJson(csv)))).toBe(csv);
  });
});
