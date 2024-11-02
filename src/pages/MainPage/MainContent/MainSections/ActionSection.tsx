import React from 'react';
import { Map } from './Map';

export const ActionSection = () => {
  return (
    <section className="action-section">
      <h2>Присоединяйтесь к команде, участвуйте в акции и занимайте призовые места!</h2>
      <div className="map-container">
        <Map />
      </div>
      <div className="action-description">
        <img src="child-writing.jpg" alt="Акция" />
        <div className="action-text">
          <h3>Федеральная акция «Памятный знак»</h3>
          <p>Начало: 03.09.2024 — Конец: 06.09.2024</p>
          <button>Узнать подробнее</button>
        </div>
      </div>
    </section>
  );
};