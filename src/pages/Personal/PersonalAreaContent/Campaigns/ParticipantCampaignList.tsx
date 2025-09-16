import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import Cookies from 'js-cookie';

export interface User {
  email: string;
  role: string;
}

interface CampaignListProps {
  user: User | null;
  campaigns: any[];
}

export const ParticipantCampaignList: React.FC<CampaignListProps> = ({ user, campaigns }) => {
  const navigate = useNavigate();

  const handleParticipateClick = async (campaignId: number) => {
    if (!user) return;

    try {
        const response = await fetch(`http://127.0.0.1:5000/checkUserInTeam`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Cookies.get('token')}`,
        },
        body: JSON.stringify({ userId: user.email, campaignId }),
        });

        const data = await response.json();

        if (data.isInTeam && data.teamId) {
            const selectedCampaign = campaigns.find(c => c.id === campaignId); // Найдём нужную кампанию

            navigate(`/projects/${data.teamId}`, {
             // 👈 передаём изображение
        });
        }
    } catch (error) {
        console.error("Ошибка при проверке команды:", error);
    }
    };


  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'center' }}>
      {campaigns.map((campaign) => (
        <div
          key={campaign.id}
          style={{
            position: 'relative',
            width: '620px',
            height: '450px',
            borderRadius: '32px',
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
            backgroundImage: `url(http://127.0.0.1:5000${campaign.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'flex-end',
            cursor: 'pointer',
          }}
          onClick={() => handleParticipateClick(campaign.id)}
        >
          <div
            style={{
                backgroundColor: '#f44336',
                color: '#fff',
                padding: '1rem',
                borderRadius: '24px',
                margin: '1rem',
                minWidth: '80%',
                minHeight: '50%',
                maxWidth: 'calc(100% - 2rem)',
                width: '80%',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                alignItems: 'start',
                cursor: 'pointer'
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontWeight: 'bold' }}>{campaign.title}</h3>
              <p style={{ fontSize: '12px', margin: '4px 0', fontWeight: '700' }}>
                {new Date(campaign.start_date).toLocaleDateString()} — {' '}
                {new Date(campaign.end_date).toLocaleDateString()}
              </p>
            </div>
            <p>{campaign.description}</p>
            
            {(user?.role === 'участник' || user?.role === 'наставник' || user?.role === '?наставник') && (
              <Button
                onClick={(e) => {
                  e.stopPropagation(); // чтобы не сработал переход по карточке
                  handleParticipateClick(campaign.id);
                }}
                style={{ borderRadius: '24px', marginTop: '8px', backgroundColor: '#fff' }}
              >
                Перейти к проекту
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
