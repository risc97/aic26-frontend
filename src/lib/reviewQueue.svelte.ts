export type SingleReviewItem = {
  video_id: string;
  keyframe_id: string;
  answer?: string;
}

export type TrakeReviewItem = {
  video_id: string;
  keyframe_ids: string[];
  answer?: string;
}

export type ReviewItem = SingleReviewItem | TrakeReviewItem;

function isSingleReviewItem(item: ReviewItem): item is SingleReviewItem {
  return 'keyframe_id' in item;
}

function isSameItem(left: ReviewItem, right: ReviewItem): boolean {
  if (left.video_id !== right.video_id) {
    return false;
  }

  if (isSingleReviewItem(left) && isSingleReviewItem(right)) {
    return left.keyframe_id === right.keyframe_id;
  }

  if (!isSingleReviewItem(left) && !isSingleReviewItem(right)) {
    return (
      left.keyframe_ids.length === right.keyframe_ids.length &&
      left.keyframe_ids.every((keyframeId, index) => {
        return keyframeId === right.keyframe_ids[index];
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