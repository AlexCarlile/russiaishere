import React, { useState } from 'react';
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
        if (user) {
            // Проверяем, есть ли пользователь в команде
            const response = await fetch(`http://127.0.0.1:5000/checkUserInTeam`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Cookies.get('token')}`,
                },
                body: JSON.stringify({ userId: user.email, campaignId }),

            });

            const data = await response.json();

            if (data.isInTeam) {
                console.log('ID команды:', data.teamId);
                
                // Если пользователь уже в команде, перенаправляем на страницу проекта
                navigate(`/projects/${data.teamId}`); // Переход на страницу проекта с teamId
            }
        }
    };
    
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
            {campaigns.map((campaign) => (
                <div 
                    key={campaign.id} 
                    style={{ width: '300px', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}
                    onClick={() => handleParticipateClick(campaign.id)}
                >
                    <h3>{campaign.title}</h3>
                    <p>{campaign.description}</p>
                    <p>
                        Дата начала: {new Date(campaign.start_date).toLocaleDateString()}, Дата окончания:{' '}
                        {new Date(campaign.end_date).toLocaleDateString()}
                    </p>
                    {/* <p>Статус: {campaign.approval_status}</p> */}
                    {campaign.image_url && (
                        <img src={`http://127.0.0.1:5000${campaign.image_url}`} alt={campaign.title} style={{ maxWidth: '100%' }} />
                    )}
                    <Button onClick={() => handleParticipateClick(campaign.id)}>
                        Посмотреть
                    </Button>
                </div>
            ))}
        </div>
    );
};