import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { TeamModal } from './CreateTeam'; // Импортируем модальное окно для работы с командами
import Cookies from 'js-cookie';

export interface User {
    email: string;
    role: string;
}

interface CampaignListProps {
    campaigns: any[];
    user: User | null;
    onJoinButtonClick: () => void; // Добавьте обработчик клика на кнопку
    activeTab: string;
}   

export const CampaignList: React.FC<CampaignListProps> = ({ campaigns, user, onJoinButtonClick, activeTab  }) => {
    const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
    const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
    const [isCreateTeam, setIsCreateTeam] = useState(true);

    const navigate = useNavigate();

    const handleParticipateClick = async (campaignId: number) => {
        if (!user) {
            // Если пользователь не авторизован, перенаправляем на страницу логина
            navigate('/login');
            return;
        }
        
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
                // Если пользователь уже в команде, показываем модальное окно для продолжения работы
                setSelectedCampaignId(campaignId);
                setIsTeamModalVisible(true);
                // Передаем информацию о том, что пользователь уже в команде
                // Это поможет модальному окну отобразить правильные опции
                setIsCreateTeam(false); // Указываем, что команда уже существует
            } else {
                // Если не в команде, показываем модальное окно для создания команды
                setSelectedCampaignId(campaignId);
                setIsCreateTeam(true); // Указываем, что нужно создать новую команду
                setIsTeamModalVisible(true);
            }

            if (data.isInTeam) {
                console.log('ID команды:', data.teamId);
                
                // Если пользователь уже в команде, перенаправляем на страницу проекта
                navigate(`/projects/${data.teamId}`); // Переход на страницу проекта с teamId
            } else {
                // Если не в команде, показываем модальное окно для создания команды
                setSelectedCampaignId(campaignId);
                setIsCreateTeam(true); // Указываем, что нужно создать новую команду
                setIsTeamModalVisible(true);
            }
        }
    };

    const handleTeamModalClose = () => {
        setIsTeamModalVisible(false);
        setSelectedCampaignId(null);
        setIsCreateTeam(true);
    };

    useEffect (() => {
        console.log(user)
    }, []);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-start', flexWrap: 'wrap', width: '100%' }}>
                {campaigns.map((campaign) => (
                    <div key={campaign.id} style={{ width: '300px', marginRight: '20px' , border: '1px solid #D6E6FF', borderRadius : '48px', padding: '1rem', marginBottom: '1rem', backgroundColor: '#D6E6FF' }}>
                        <h3>{campaign.title}</h3>
                        <p>{campaign.description}</p>
                        <p>
                            Дата начала: {new Date(campaign.start_date).toLocaleDateString()}, Дата окончания:{' '}
                            {new Date(campaign.end_date).toLocaleDateString()}
                        </p>
                        {campaign.image_url && <img src={`http://127.0.0.1:5000${campaign.image_url}`} alt={campaign.title} style={{ maxWidth: '100%' }} />}
                        {(user && (user.role === 'участник' || user.role === 'наставник' || user.role === '?наставник') && activeTab === 'current') ? (
                            <Button onClick={() => handleParticipateClick(campaign.id)}>
                                Участвовать
                            </Button>
                        ) : (
                            !user && activeTab === 'current' && (
                                <Button onClick={() => navigate('/login')}>
                                    Участвовать
                                </Button>
                        )
                        )}
                    </div>
                ))}
            </div>
            {isTeamModalVisible && selectedCampaignId && (
                <TeamModal
                    campaignId={selectedCampaignId}
                    user={user} // Передаем user в TeamModal
                    onClose={handleTeamModalClose}
                    isCreateTeam={isCreateTeam}
                />
            )}
        </div>
    );
};
