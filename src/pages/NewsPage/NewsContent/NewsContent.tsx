import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

export const NewsContent: React.FC = () => {
    const [news, setNews] = useState<any[]>([]);
    const navigate = useNavigate();

    const fetchNews = async () => {
        try {
            const response = await axios.get('http://1180973-cr87650.tw1.ru/api/news');
            const filtered = response.data.filter((item: any) => item.status === 'yes');
            setNews(filtered);
        } catch (error) {
            console.error('Ошибка при загрузке новостей:', error);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    return (
        <div className='actions-container'>
            <h2 className='actions-info'>Новости проекта</h2>
            <div className='actions-descr'>
                Оставайтесь в курсе самых последних новостей нашего проекта!
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between', marginTop: '32px' }}>
                {news.map((item) => (
                    <div 
                        key={item.id}
                        style={{
                            position: 'relative',
                            width: '620px',
                            height: '450px',
                            borderRadius: '32px',
                            overflow: 'hidden',
                            backgroundColor: '#f0f0f0',
                            backgroundImage: `url(http://1180973-cr87650.tw1.ru/uploads/news/${item.file})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'flex-end',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/news/${item.id}`)}
                    >
                        <div
                            style={{
                                backgroundColor: '#f44336',
                                color: '#fff',
                                padding: '1rem',
                                borderRadius: '24px',
                                margin: '1rem',
                                minWidth: '80%',
                                minHeight: '20%',
                                maxWidth: 'calc(100% - 2rem)',
                                width: '80%',
                                boxSizing: 'border-box',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 'bold' }}>{item.title}</h3>
                                <p style={{ fontSize: '14px', marginTop: '0.5rem', maxHeight: '4.5em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    <b>{dayjs(item.date).format('DD.MM.YYYY')}</b>
                                </p>
                            </div>
                            <p style={{ fontSize: '12px', opacity: 0.8 }}>
                                Нажмите, чтобы читать полностью
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
