import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

export const NewsDetailsContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [newsItem, setNewsItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewsItem = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:5000/api/news/${id}`);
                setNewsItem(response.data);
            } catch (error) {
                console.error('Ошибка при загрузке новости:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNewsItem();
    }, [id]);

    if (loading) return <div style={{ padding: 32 }}>Загрузка...</div>;
    if (!newsItem) return <div style={{ padding: 32 }}>Новость не найдена</div>;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px' }}>
            <h1>{newsItem.title}</h1>
            <p style={{ color: '#888', fontSize: '14px' }}>
                {dayjs(newsItem.date).format('DD.MM.YYYY')}
            </p>
            <img
                src={`http://127.0.0.1:5000/uploads/news/${newsItem.file}`}
                alt={newsItem.title}
                style={{ width: '100%', borderRadius: '16px', margin: '20px 0' }}
            />
            <div
                dangerouslySetInnerHTML={{ __html: newsItem.text }}
                style={{ fontSize: '16px', lineHeight: '1.6' }}
            />
        </div>
    );
};
