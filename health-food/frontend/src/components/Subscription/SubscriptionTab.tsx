const plans = [
  {
    id: 'basic',
    name: 'Базовая',
    price: '₽0',
    period: '/мес',
    features: [
      'Подбор рецептов (DIY)',
      'Рекомендации витаминов',
      'Список покупок',
    ],
    cta: 'Начать',
    highlighted: false,
  },
  {
    id: 'premium',
    name: 'Премиум',
    price: '₽499',
    period: '/мес',
    features: [
      'Заведения рядом (персональный скоринг)',
      'AI-рецепты по фото содержимого',
      'Поддержка диет и аллергий',
    ],
    cta: 'Оформить',
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₽999',
    period: '/мес',
    features: [
      'Индивидуальный план на неделю',
      'Еженедельный прогресс-отчет',
      'Приоритетная поддержка',
    ],
    cta: 'Связаться',
    highlighted: false,
  },
];

const SubscriptionTab = () => {
  return (
    <div className="content-wrapper">
      <div className="step-card">
        <div className="step-header">
          <div className="step-number">📦</div>
          <div className="step-info">
            <h2>Подписка</h2>
            <p>Выберите план, который поможет быстрее достигать целей по анализам.</p>
          </div>
        </div>

        <div className="results-grid-diy">
          {plans.map((p) => (
            <div key={p.id} className={`result-card ${p.highlighted ? 'primary' : ''}`}>
              <div className="result-card-content">
                <div className="result-card-header">
                  <h4>{p.name}</h4>
                  <span className="price">{p.price}<small>{p.period}</small></span>
                </div>
                <ul className="feature-list">
                  {p.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
              </div>
              <div className="result-card-right-col">
                <button className="btn btn-primary btn-sm">{p.cta}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionTab;
