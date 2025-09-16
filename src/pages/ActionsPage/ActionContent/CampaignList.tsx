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
    // activeTab: string;
}   

export const CampaignList: React.FC<CampaignListProps> = ({ campaigns, user, onJoinButtonClick }) => {
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '60px', justifyContent: 'space-between'}}>
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
                            // boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            backgroundImage: `url(http://127.0.0.1:5000${campaign.image_url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'flex-end',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate(`/actions/${campaign.id}`)}
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
                                alignItems: 'start'
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
                            {/* <p style={{ fontSize: '12px', margin: '4px 0' }}>
                                Дата начала: {new Date(campaign.start_date).toLocaleDateString()}, Дата окончания:{' '}
                                {new Date(campaign.end_date).toLocaleDateString()}
                            </p> */}
                            {/* {campaign.image_url && <img src={`http://127.0.0.1:5000${campaign.image_url}`} alt={campaign.title} style={{ maxWidth: '100%' }} />} */}
                            {user && (user.role === 'участник' || user.role === 'наставник' || user.role === '?наставник') ? (
                                <Button 
                                    onClick={(e: React.MouseEvent) => 
                                        {
                                            e.stopPropagation(); // 🚫 Остановить всплытие события, чтобы не сработал onClick карточки
                                            handleParticipateClick(campaign.id); // твоя логика участия
                                        }
                                    }
                                    style={{ borderRadius: '24px', marginTop: '8px', backgroundColor: '#fff' }}
                                >
                                    Участвовать
                                </Button>
                            ) : (
                                !user && (
                                    <Button 
                                        onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            navigate('/login');
                                        }}
                                        style={{ borderRadius: '24px', marginTop: '8px', backgroundColor: '#fff' }}
                                    >
                                        Участвовать
                                    </Button>
                            )
                            )}
                        </div>
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
