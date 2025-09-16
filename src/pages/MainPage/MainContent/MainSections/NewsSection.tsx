import React, { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import '../mainContent.css';

export const NewsSection: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('http://1180973-cr87650.tw1.ru/api/news');
        const filtered = response.data.filter((item: any) => item.status === 'yes');
        setNews(filtered);
        // setNews(response.data);
      } catch (error) {
        console.error('Ошибка при загрузке новостей:', error);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="news-section">
      <h3
        style={{cursor: "pointer"}}
        onClick={() => navigate('/news')}
      >
        Наши новости
      </h3>
      <div className="news-items-vertical">
        {news.map((item) => (
          <div
            key={item.id}
            className="news-item"
            onClick={() => navigate(`/news/${item.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <img
              src={`http://1180973-cr87650.tw1.ru/uploads/news/${item.file}`}
              alt={item.title}
            />
            <p><b>{item.title}</b></p>
            <span>{dayjs(item.date).format('DD.MM.YYYY')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
