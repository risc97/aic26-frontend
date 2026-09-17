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

function isSingleReviewItem(item: ReviewItem): item is SingleReviewItem {
  return 'frameIdx' in item;
}

function isSameItem(left: ReviewItem, right: ReviewItem): boolean {
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

class ReviewQueue {
  items = $state<ReviewItem[]>([]);

  add(item: ReviewItem, answer?: string) {
    if (this.items.some((queued) => isSameItem(queued, item))) {
      return;
    }

    this.items.push({ ...item, answer });
  }

  addTop(item: ReviewItem, answer?: string) {
    this.remove(item);
    this.items.unshift({ ...item, answer });
  }

  remove(item: ReviewItem) {
    this.items = this.items.filter((queued) => !isSameItem(queued, item));
  }

  clear() {
    this.items = [];
  }
}

export const reviewQueue = new ReviewQueue();