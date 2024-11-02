import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsSection } from './MainSections';
import { ActionSection } from './MainSections';
import './mainContent.css';


export const MainContent = () => {
  const navigate = useNavigate()

  const handleButtonClick = () => {
    navigate('/actions'); // Перенаправление на /actions
  };
  
  return (
    <div className="main-content">
      <section className="project-intro">
        <div className="project-description">
          <h2>Здесь начинается Россия</h2>
          <p>
            Проект &laquo;Здесь начинается Россия&raquo;&nbsp;&mdash; это уникальная образовательная инициатива Школы Росатома, направленная на&nbsp;формирование у&nbsp;подрастающего поколения глубокого понимания истории и&nbsp;научного наследия нашей страны. В&nbsp;рамках проекта дети разных возрастов из&nbsp;всех регионов России участвуют в&nbsp;разнообразных образовательных и&nbsp;исследовательских акциях, целью которых является 
            не&nbsp;только расширить кругозор школьников, 
            но&nbsp;и&nbsp;воспитать в&nbsp;них чувство гордости за&nbsp;свою 
            Родину и&nbsp;привить любовь к&nbsp;знаниям.
          </p>
          <button onClick={handleButtonClick} className="cta-button">Принять участие в акции</button>
        </div>
        <NewsSection />
      </section>

      <ActionSection />
    </div>
  );
};
