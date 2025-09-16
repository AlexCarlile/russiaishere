import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CampaignForm } from './CampaignForm';
import { ParticipantCampaignList } from './ParticipantCampaignList';
import { ModeratorCampaignList } from './ModeratorCampaignList';
import axios from 'axios';
import Cookies from 'js-cookie';
import './CampaignStats.css'

interface Campaign {
    id: number;
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    approval_status: string;
    team_members: { user_id: number; name: string }[];  // Учитываем, что в команде есть члены
    image_url?: string;  // Поле может быть необязательным
}



export const Campaigns: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [user, setUser] = useState<any | null>(null)
    const [userCampaigns, setUserCampaigns] = useState<any[]>([]); // Состояние для кампаний пользователя
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState<{ total: number; completed: number; won: number } | null>(null);

    const fetchCampaigns = async () => {
        try {
            const token = Cookies.get('token');
            
            // Получаем данные пользователя
            const userResponse = await axios.get('http://127.0.0.1:5000/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setUser(userResponse.data);
        
            // Проверяем наличие userId и передаём его на сервер
        const userId = userResponse.data.email; // Предполагается, что id находится в userResponse.data
        if (userId) {
            const campaignsResponse = await axios.post('http://127.0.0.1:5000/selectedcampaigns', {
                userId: userId, // Используем userId вместо user.email
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const responseData = campaignsResponse.data;

            if (responseData.campaigns && responseData.stats) {
                // для участника / наставника
                setUserCampaigns(responseData.campaigns);
                setStats(responseData.stats);
            } else {
                // для модератора (возвращается просто список кампаний)
                setUserCampaigns(responseData);
                setStats(null);
            }
        } else {
            console.error('User ID is not available');
        }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    useEffect(() => {
        const handleResize = () => {
        setIsMobile(window.innerWidth <= 430); // или нужный breakpoint
    };

    handleResize(); // сразу проверить
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        fetchCampaigns(); // Загружаем кампании при монтировании компонента
        console.log('!!!!!', stats)
    }, []);

    useEffect(() => {
        console.log(user)
    }, [user]);

    function getTimesLabel(n: number): string {
        if (n % 100 >= 11 && n % 100 <= 14) return 'раз';
        const lastDigit = n % 10;
        if (lastDigit === 1) return 'раз';
        if (lastDigit >= 2 && lastDigit <= 4) return 'раза';
        return 'раз';
    }

    function getCampaignWord(n: number): string {
        if (n % 100 >= 11 && n % 100 <= 14) return 'акций';
        const lastDigit = n % 10;
        if (lastDigit === 1) return 'акцию';
        if (lastDigit >= 2 && lastDigit <= 4) return 'акции';
        return 'акций';
    }

    return (
        <div>
            {user && (user.role !== 'участник' && user.role !== 'наставник' && user.role !== '?наставник') ? (  // Отображаем раздел только если пользователь имеет нужную роль
                <div style={{display: 'flex', flexDirection: 'column'}}>
                    <h2 className='campaign-title'>Мои созданные акции</h2>
                    <Button type="primary" onClick={showModal} style={{ marginBottom: '1rem', paddingTop: '20px', paddingBottom: '20px', backgroundColor: '#EF3124', fontSize: '21px', borderRadius: '48px' }}>
                        Добавить акцию
                    </Button>
                    <Modal
                        title="Добавить новую акцию"
                        open={isModalVisible}
                        onCancel={handleCancel}
                        footer={null}
                        afterClose={fetchCampaigns}
                        width={isMobile ? '100vw' : 800}       // ширина на всю ширину экрана на мобилке
                        style={isMobile ? {
                            top: 0,
                            padding: 0,
                            maxWidth: '100vw',
                            height: '100vh', 
                            margin: '0',                    // высота окна = 100% высоты вьюпорта
                        } : {}}
                        bodyStyle={isMobile ? {
                            height: 'calc(100vh - 55px)',       // -55px для учёта высоты заголовка (примерно)
                            padding: '0px',
                            overflowY: 'auto',                   // скролл внутри тела, если контента много
                        } : {}}
                        centered={!isMobile}
                        closable={true}
                    >
                        <CampaignForm onClose={() => setIsModalVisible(false)}/>
                    </Modal>
                    <ModeratorCampaignList campaigns={userCampaigns} /> {/* Отображаем только кампании пользователя */}
                </div>
            ) : (
                <div>
                    {user && (user.role === 'участник' || user.role === 'наставник' || user.role === '?наставник') && stats && (
                        <div className="stats-container">
                            <div className="stats-block">
                                <p className="stats-label">Вы участвовали в акциях</p>
                                <div className="stats-value">{stats.total} {getTimesLabel(stats.total)}</div>
                            </div>
                            <div className="stats-block">
                                <p className="stats-label">Вы прошли до конца</p>
                                <div className="stats-value">{stats.completed} {getCampaignWord(stats.completed)}</div>
                            </div>
                            <div className="stats-block">
                                <p className="stats-label">Вы победили</p>
                                <div className="stats-value">{stats.won} {getTimesLabel(stats.won)}</div>
                            </div>
                        </div>
                    )}
                    <h2 className='campaign-title'>Мои проекты</h2>
                    <ParticipantCampaignList user={user} campaigns={userCampaigns} />  { /* Если роль "участник", показываем только его кампании*/ }
                </div>
                
            )}
        </div>
    );
};
