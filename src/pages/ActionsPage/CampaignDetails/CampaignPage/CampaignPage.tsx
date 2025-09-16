import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { TeamModal } from '../../ActionContent/CreateTeam';
import Cookies from 'js-cookie';
import axios from 'axios';
import { useAuth } from '../../../../store'; 

interface Campaign {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
  winner_announcement_date?: string;
  full_description: string;
  rules: string;
}

interface User {
    email: string;
    role: string;
}

export const CampaignPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [isCreateTeam, setIsCreateTeam] = useState(true);
  const { userRole, isLoading } = useAuth(); 

  // Функция для получения данных пользователя с авторизацией
  const fetchUser = async () => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const response = await axios.get('http://127.0.0.1:5000/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
  };

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!id) return;

      try {
        const token = Cookies.get('token'); // сюда перенесли!
        const headers: any = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`http://127.0.0.1:5000/campaigns/${id}`, {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          throw new Error(`Ошибка ${response.status}`);
        }

        const data: Campaign = await response.json();
        setCampaign(data);
      } catch (error) {
        console.error('Ошибка при загрузке кампании:', error);
        setCampaign(null);
      }
    };

    fetchCampaign();
    fetchUser();
  }, [id]);


  const handleParticipateClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/checkUserInTeam`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ userId: user.email, campaignId: campaign?.id }),
      });

      const data = await response.json();

      if (data.isInTeam) {
        navigate(`/projects/${data.teamId}`);
      } else {
        setSelectedCampaignId(campaign?.id || null);
        setIsCreateTeam(true);
        setIsTeamModalVisible(true);
      }
    } catch (err) {
      console.error('Ошибка при проверке команды:', err);
    }
  };

  if (!campaign) return <div>Загрузка...</div>;

  // Проверяем роль: если модератор или админ — кнопку не показываем
  const isAllowedToParticipate = userRole !== 'админ' && userRole !== 'модератор';


  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Верхний баннер */}
      <div
        style={{
          backgroundImage: `url(http://127.0.0.1:5000${campaign.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '32px',
          height: '450px',
          position: 'relative',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            backgroundColor: '#f44336',
            color: '#fff',
            padding: '24px',
            borderRadius: '24px',
            margin: '24px',
            maxWidth: '600px',
          }}
        >
          <h2 style={{ margin: 0 }}>{campaign.title}</h2>
          <p>{new Date(campaign.start_date).toLocaleDateString()} – {new Date(campaign.end_date).toLocaleDateString()}</p>
          <p>{campaign.description}</p>
          {campaign.winner_announcement_date && (
            <p>Победители будут объявлены: <b>{new Date(campaign.winner_announcement_date).toLocaleDateString()}</b></p>
          )}
        </div>
      </div>

      {/* Контент: Описание и правила */}
      <div style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
        {/* Описание */}
        <div style={{ flex: 1, backgroundColor: '#f2f6ff', padding: '24px', borderRadius: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Описание</h3>
          <p>
            {/* Для создания эскиза памятного знака мало просто нарисовать красивую картинку — важно понять, какие глубокие смыслы он должен передавать... */}
            {campaign.full_description}
          </p>
          {/* Здесь может быть полное описание, если оно приходит с бэкенда */}
          {isAllowedToParticipate && (
            <Button
              type="primary"
              style={{ marginTop: '24px', borderRadius: '24px', backgroundColor: '#f44336' }}
              onClick={handleParticipateClick}
            >
              Принять участие в акции
            </Button>
          )}
        </div>

        {/* Правила */}
        <div style={{ flex: 1, backgroundColor: '#F5F7F9', padding: '24px', borderRadius: '24px' }}>
          {campaign?.rules}
          {/* <h3 style={{ marginBottom: '16px' }}>Правила участия</h3>
          <ol style={{ paddingLeft: '20px' }}>
            <li><b>Регистрация участников</b> — школьники и наставники регистрируются на портале.</li>
            <li><b>Создание проектной группы</b> — формируется группа из наставника и школьников.</li>
            <li><b>Изучение материалов</b> — нужно изучить материалы по истории и культуре.</li>
            <li><b>Заполнение отчётности</b> — оформляется концепт, загружаются материалы и проект.</li>
          </ol> */}
        </div>
      </div>

      {/* Кнопка "Назад" */}
      <div style={{ textAlign: 'center' }}>
        <Button
          onClick={() => navigate('/actions')}
          style={{ borderRadius: '24px', backgroundColor: '#f44336', color: '#fff' }}
        >
          К списку акций
        </Button>
      </div>
      {isTeamModalVisible && selectedCampaignId && (
        <TeamModal
          campaignId={selectedCampaignId}
          user={user}
          onClose={() => setIsTeamModalVisible(false)}
          isCreateTeam={isCreateTeam}
        />
      )}
    </div>
  );
};
