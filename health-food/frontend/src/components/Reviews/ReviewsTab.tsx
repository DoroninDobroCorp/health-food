type Review = {
  id: string;
  user: string;
  rating: number; // 1..5
  text: string;
  before: string;
  after: string;
};

const mockReviews: Review[] = [
  {
    id: 'r1',
    user: 'Анна',
    rating: 5,
    text: 'За месяц по плану и блюдам рядом ушла усталость, стало легче придерживаться режима.',
    before: 'Низкий ферритин, слабость',
    after: 'Ферритин вырос, энергии больше',
  },
  {
    id: 'r2',
    user: 'Дмитрий',
    rating: 4,
    text: 'Удобно, что есть список покупок и заведения рядом — не срываюсь, когда нет времени готовить.',
    before: 'Высокий холестерин',
    after: 'Показатели улучшились спустя 6 недель',
  },
  {
    id: 'r3',
    user: 'Марина',
    rating: 5,
    text: 'AI-рецепты по фото реально выручают, когда пустой холодильник.',
    before: 'Дефицит витамина D',
    after: 'D-уровень нормализовался',
  },
];

const StarRating = ({ value }: { value: number }) => (
  <span className="stars">{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
);

const ReviewsTab = () => {
  return (
    <div className="content-wrapper">
      <div className="step-card">
        <div className="step-header">
          <div className="step-number">💬</div>
          <div className="step-info">
            <h2>Отзывы</h2>
            <p>Опыт пользователей до/после. Данные являются демонстрационными.</p>
          </div>
        </div>

        <div className="results-grid-diy">
          {mockReviews.map((r) => (
            <div key={r.id} className="result-card">
              <div className="result-card-content">
                <div className="result-card-header">
                  <h4>{r.user}</h4>
                  <StarRating value={r.rating} />
                </div>
                <p className="result-card-description">{r.text}</p>
                <div className="result-card-tags">
                  <span className="result-card-tag" data-tag="before">До: {r.before}</span>
                  <span className="result-card-tag" data-tag="after">После: {r.after}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsTab;
