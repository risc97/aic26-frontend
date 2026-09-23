export type SingleReviewItem = {
  videoId: string;
  frameIndex: number;
  answer?: string;
}

export type TrakeReviewItem = {
  videoId: string;
  frameIndexArray: number[];
  answer?: string;
}

export type ReviewItem = SingleReviewItem | TrakeReviewItem;

export function isSingleReviewItem(item: ReviewItem): item is SingleReviewItem {
  return 'frameIndex' in item;
}

export function isSameItem(left: ReviewItem, right: ReviewItem): boolean {
  if (left.videoId !== right.videoId) {
    return false;
  }

  if (isSingleReviewItem(left) && isSingleReviewItem(right)) {
    return left.frameIndex === right.frameIndex;
  }

  if (!isSingleReviewItem(left) && !isSingleReviewItem(right)) {
    return (
      left.frameIndexArray.length === right.frameIndexArray.length &&
      left.frameIndexArray.every((frameIndex, index) => {
        return frameIndex === right.frameIndexArray[index];
      })
    );
  }

  return false;
}

const RAW_BUFFER_STORAGE_KEY = 'aic_submission_text';

class ReviewQueue {
  items = $state<ReviewItem[]>([]);
  raw = $state<string>("");

  constructor() {
    let temp = localStorage.getItem(RAW_BUFFER_STORAGE_KEY) ?? "";
    let err = this.loadReviewQueue(temp);
  }

  add(item: ReviewItem, answer?: string) {
    this.items.push({ ...item, answer });
    this.serializeReviewQueue();
  }

  addTop(item: ReviewItem, answer?: string) {
    this.items.unshift({ ...item, answer });
    this.serializeReviewQueue();
  }

  remove(item: ReviewItem) {
    this.items = this.items.filter((queued) => !isSameItem(queued, item));
    this.serializeReviewQueue();
  }

  clear() {
    this.items = [];
    this.raw = "";
  }

  private parseCsvLine(line: string): { fields: string[]; quoted: boolean[] } {
    const fields: string[] = [];
    const quoted: boolean[] = [];
    let field = '';
    let insideQuotes = false;
    let fieldWasQuoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];

      if (character === '"') {
        if (insideQuotes && line[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
          fieldWasQuoted = true;
        }
      } else if (character === ',' && !insideQuotes) {
        fields.push(field.trim());
        quoted.push(fieldWasQuoted);
        field = '';
        fieldWasQuoted = false;
      } else {
        field += character;
      }
    }

    fields.push(field.trim());
    quoted.push(fieldWasQuoted);
    return { fields, quoted };
  }

  // this may throw, beware
  parseReviewQueue(rawText: string): { items: ReviewItem[]; error: string } {
    let errString = "";
    let parsedItems: ReviewItem[] = [];
    try {
      parsedItems = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          const { fields, quoted } = this.parseCsvLine(line);
          const videoId = fields[0];

          if (!videoId) {
            throw new Error(`Missing video ID: ${line}`);
          }

          const rest = fields.slice(1);
          const restQuoted = quoted.slice(1);

          // rule: an answer field is identified by having been quoted in the source CSV
          const lastIndex = rest.length - 1;
          const hasAnswer = lastIndex >= 0 && restQuoted[lastIndex];
          const answerField = hasAnswer ? rest[lastIndex] : undefined;

          const frameFields = hasAnswer ? rest.slice(0, -1) : rest;

          const numericFields = frameFields
            .filter((field) => field.length > 0)
            .map((field) => Number(field));

          if (numericFields.some((frameIndex) => !Number.isInteger(frameIndex))) {
            throw new Error(`Invalid frame index: ${line}`);
          }

          if (numericFields.length === 1) {
            return {
              videoId,
              frameIndex: numericFields[0],
              ...(hasAnswer ? { answer: answerField } : {}),
            } satisfies SingleReviewItem;
          }

          if (numericFields.length >= 2) {
            return {
              videoId,
              frameIndexArray: numericFields,
              ...(hasAnswer ? { answer: answerField } : {}),
            } satisfies TrakeReviewItem;
          }

          throw new Error(`Missing frame index: ${line}`);
        });
    } catch (error) {
      if (error instanceof Error) {
        errString = error.message;
      }
    }
    return { items: parsedItems, error: errString };
  }

  // State-mutating load method
  loadReviewQueue(rawText: string): string {
    const { items, error } = this.parseReviewQueue(rawText);
    if (!error) {
      this.items = items;
      this.raw = rawText;
      localStorage.setItem(RAW_BUFFER_STORAGE_KEY, this.raw);
    }
    return error;
  }

  moveToTop(index: number) {
    if (index <= 0 || index >= this.items.length) return;
    const newItems = [...this.items];
    const [item] = newItems.splice(index, 1);
    newItems.unshift(item);
    this.items = newItems;
    this.serializeReviewQueue();
  }

  moveUp(index: number) {
    if (index <= 0 || index >= this.items.length) return;
    const newItems = [...this.items];
    const [item] = newItems.splice(index, 1);
    newItems.splice(index - 1, 0, item);
    this.items = newItems;
    this.serializeReviewQueue();
  }

  moveDown(index: number) {
    if (index < 0 || index >= this.items.length - 1) return;
    const newItems = [...this.items];
    const [item] = newItems.splice(index, 1);
    newItems.splice(index + 1, 0, item);
    this.items = newItems;
    this.serializeReviewQueue();
  }

  removeAt(index: number) {
    if (index < 0 || index >= this.items.length) return;
    const newItems = [...this.items];
    newItems.splice(index, 1);
    this.items = newItems;
    this.serializeReviewQueue();
  }

  private csvEscapeField(value: string): string {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private csvForceQuoteField(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private serializeReviewQueue() {
    this.raw = this.items
      .map((item) => {
        const fields: string[] = [item.videoId];

        if (isSingleReviewItem(item)) {
          fields.push(String(item.frameIndex));
        } else {
          fields.push(...item.frameIndexArray.map((frameIndex) => String(frameIndex)));
        }

        // videoId / frame indices: quote only if needed
        const line = fields.map((f) => this.csvEscapeField(f));

        // answer: always quoted, per the "quoted trailing field = answer" parsing rule
        if (item.answer !== undefined) {
          line.push(this.csvForceQuoteField(item.answer));
        }

        return line.join(',');
      })
      .join('\n');

    localStorage.setItem(RAW_BUFFER_STORAGE_KEY, this.raw);
  }
}

export const reviewQueue = new ReviewQueue();