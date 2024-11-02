import React from 'react';
import image1 from '../../../../media/news1.jpg'
import image2 from '../../../../media/news2.jpg'

export const NewsSection = () => {
  return (
    <div className="news-section">
      <h3>Наши новости</h3>
      <div className="news-items">
        <div className="news-item">
          <img src={image1} alt="Новость 1" />
          <p>Дневник Международных умных каникул со «Школой Росатома»...</p>
          <span>22.08.2024</span>
        </div>
        <div className="news-item">
          <img src={image2} alt="Новость 2" />
          <p>В ВДЦ «Орлёнок» завершилась программа...</p>
          <span>08.08.2024</span>
        </div>
      </div>
    </div>
  );
};