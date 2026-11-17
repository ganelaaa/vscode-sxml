import { SaxesParser } from "saxes";

export interface ElementRange {
  name: string;
  openStart: number; // offset of "<" in the start tag
  openEnd: number; // offset just after ">" in the start tag
  closeStart: number; // offset of "<" in the end tag
  closeEnd: number; // offset just after ">" in the end tag
  selfClosing: boolean;
}

// Every element in the text, innermost first. Returns [] if the text is not well formed.
export function parseElements(text: string): ElementRange[] {
  const parser = new SaxesParser({ position: true });
  const stack: { name: string; openStart: number; openEnd: number }[] = [];
  const elements: ElementRange[] = [];

  parser.on("opentag", (tag) => {
    const openEnd = parser.position;
    // "<" cannot appear inside a start tag, so the last one before ">" starts it.
    const openStart = text.lastIndexOf("<", openEnd - 1);
    stack.push({ name: tag.name, openStart, openEnd });
  });

  parser.on("closetag", (tag) => {
    const open = stack.pop();
    if (!open) return;
    if (tag.isSelfClosing) {
      elements.push({
        ...open,
        closeStart: open.openEnd,
        closeEnd: open.openEnd,
        selfClosing: true,
      });
      return;
    }
    const closeEnd = parser.position;
    const closeStart = text.lastIndexOf("</", closeEnd - 1);
    elements.push({ ...open, closeStart, closeEnd, selfClosing: false });
  });

  try {
    parser.write(text).close();
  } catch {
    return [];
  }
  return elements;
}

// The innermost element whose tags or content contain the offset.
export function findEnclosing(
  elements: ElementRange[],
  offset: number,
): ElementRange | undefined {
  return elements.find((e) => e.openStart < offset && offset < e.closeEnd);
}

// The innermost element whose full range strictly contains [start, end].
export function findParent(
  elements: ElementRange[],
  start: number,
  end: number,
): ElementRange | undefined {
  return elements.find(
    (e) =>
      e.openStart <= start &&
      end <= e.closeEnd &&
      (e.openStart < start || end < e.closeEnd),
  );
}
