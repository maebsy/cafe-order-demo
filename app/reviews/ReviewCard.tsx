type Review = { author: string; rating: number; body: string };

// 손님 후기: 줄바꿈·굵은 글씨를 살리려고 HTML 그대로 출력
export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review">
      <strong>{review.author}</strong> · {"★".repeat(review.rating)}
      <div dangerouslySetInnerHTML={{ __html: review.body }} />
    </article>
  );
}
