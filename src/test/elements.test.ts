import * as assert from "assert";
import { parseElements, findEnclosing } from "../services/elements";

suite("parseElements", () => {
  test("reports offsets for a nested element", () => {
    const text = "<a><b>x</b></a>";
    const b = parseElements(text).find((e) => e.name === "b")!;
    assert.strictEqual(text.slice(b.openStart, b.openEnd), "<b>");
    assert.strictEqual(text.slice(b.closeStart, b.closeEnd), "</b>");
  });

  test("handles '>' inside an attribute value", () => {
    const text = '<a href="1>2">t</a>';
    const a = parseElements(text)[0]!;
    assert.strictEqual(text.slice(a.openStart, a.openEnd), '<a href="1>2">');
  });

  test("reports a self closing element", () => {
    const text = "<a><br/></a>";
    const br = parseElements(text).find((e) => e.name === "br")!;
    assert.strictEqual(br.selfClosing, true);
    assert.strictEqual(text.slice(br.openStart, br.closeEnd), "<br/>");
  });

  test("offsets stay correct after an emoji", () => {
    const text = "<a>😀<b>x</b></a>";
    const b = parseElements(text).find((e) => e.name === "b")!;
    assert.strictEqual(text.slice(b.openStart, b.openEnd), "<b>");
    assert.strictEqual(text.slice(b.closeStart, b.closeEnd), "</b>");
  });

  test("returns nothing for malformed XML", () => {
    assert.deepStrictEqual(parseElements("<a></b>"), []);
  });
});

suite("findEnclosing", () => {
  const text = '<test att="val">some text</test>';
  const elements = parseElements(text);

  test("cursor in text finds the element", () => {
    assert.strictEqual(
      findEnclosing(elements, text.indexOf("text"))?.name,
      "test",
    );
  });

  test("cursor in an attribute value finds the element", () => {
    assert.strictEqual(
      findEnclosing(elements, text.indexOf("al"))?.name,
      "test",
    );
  });

  test("cursor outside every element finds nothing", () => {
    assert.strictEqual(findEnclosing(elements, text.length), undefined);
  });
});
