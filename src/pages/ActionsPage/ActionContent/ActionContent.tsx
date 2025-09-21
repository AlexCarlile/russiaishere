import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Tabs, DatePicker } from 'antd';
import { CampaignForm } from '../../Personal';
import { CampaignList } from './CampaignList';
import axios from 'axios';
import Cookies from 'js-cookie';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './Actions.css'

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface User {
    email: string;
    role: string;
}

export const ActionContent: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isJoinModalVisible, setIsJoinModalVisible] = useState(false); // Добавьте состояние для модального окна
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [search, setSearch] = useState<string>('');
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [activeTab, setActiveTab] = useState<string>('current');
    const [user, setUser] = useState<User | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    // Функция для получения всех акций без авторизации
    const fetchCampaigns = async () => {
        try {
            const response = await axios.get('http://1180973-cr87650.tw1.ru/allcampaigns');
            setCampaigns(response.data);
        } catch (error) {
            console.error('Failed to fetch campaigns:', error);
        }
    };

    // Функция для получения данных пользователя с авторизацией
    const fetchUser = async () => {
        const token = Cookies.get('token');
        if (token) {
            try {
                const response = await axios.get('http://1180973-cr87650.tw1.ru/user', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
            }
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
        setIsJoinModalVisible(false); // Закройте модальное окно присоединения
    };

    const handleShowJoinModal = () => {
        setIsJoinModalVisible(true);
    };

    useEffect(() => {
        fetchCampaigns(); // Загружаем акции без токена
        fetchUser(); // Проверяем авторизацию для действий
    }, []);

    useEffect(() => {
        if (!isModalVisible) {
            fetchCampaigns();
            fetchUser();
        }
    }, [isModalVisible]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const handleDateChange = (dates: [Dayjs, Dayjs] | null, dateStrings: [string, string]) => {
        setDateRange(dates);
    };

    const handleTabChange = (key: string) => {
        console.log('Switching to tab:', key);
        setActiveTab(key);
    };

    // const filteredCampaigns = campaigns
    //     .filter(campaign => campaign.approval_status === 'yes')
    //     .filter(campaign => {
    //         const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) || campaign.description.toLowerCase().includes(search.toLowerCase());
    //         const inDateRange = !dateRange || (
    //             dayjs(campaign.start_date).isSameOrAfter(dateRange[0]) && 
    //             dayjs(campaign.end_date).isSameOrBefore(dateRange[1])
    //         );
    //         return matchesSearch && inDateRange;
    //     })
    //     .filter(campaign => {
    //         if (activeTab === 'current') {
    //             return dayjs(campaign.end_date).isSameOrAfter(dayjs());
    //         } else if (activeTab === 'past') {
    //             return dayjs(campaign.end_date).isBefore(dayjs());
    //         }
    //         return true;
    //     })
    //     .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));

    const currentCampaigns = campaigns
    .filter(campaign => campaign.approval_status === 'yes')
    .filter(campaign => dayjs(campaign.end_date).isSameOrAfter(dayjs()))
    .filter(campaign => {
        const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                            campaign.description.toLowerCase().includes(search.toLowerCase());
        const inDateRange = !dateRange || (
        dayjs(campaign.start_date).isSameOrAfter(dateRange[0]) && 
        dayjs(campaign.end_date).isSameOrBefore(dateRange[1])
        );
        return matchesSearch && inDateRange;
    })
    .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));

    const pastCampaigns = campaigns
    .filter(campaign => campaign.approval_status === 'yes')
    .filter(campaign => dayjs(campaign.end_date).isBefore(dayjs()))
    .filter(campaign => {
        const matchesSearch = campaign.title.toLowerCase().includes(search.toLowerCase()) ||
                            campaign.description.toLowerCase().includes(search.toLowerCase());
        const inDateRange = !dateRange || (
        dayjs(campaign.start_date).isSameOrAfter(dateRange[0]) && 
        dayjs(campaign.end_date).isSameOrBefore(dateRange[1])
        );
        return matchesSearch && inDateRange;
    })
    .sort((a, b) => dayjs(b.start_date).diff(dayjs(a.start_date)));


    return (
        <div className='actions-container'>
            <h2 className='actions-info'>Акции</h2>
            
            <Modal
                title="Добавить новую акцию"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                afterClose={fetchCampaigns}
                width={isMobile ? '100vw' : 800}
                style={isMobile ? {
                    top: 0,
                    padding: 0,
                    margin: 0,
                    height: '100vh',
                    maxWidth: '100vw',
                } : {}}
                bodyStyle={isMobile ? {
                    height: 'calc(100vh - 55px)', // высота минус заголовок
                    padding: '0px',
                    overflowY: 'auto',
                } : {}}
                centered={!isMobile}
                closable={true}
            >
                <CampaignForm onClose={() => setIsModalVisible(false)}/>
            </Modal>

            <div className='actions-descr'>
                Присоединяйтесь к&nbsp;команде, участвуйте в&nbsp;акции и&nbsp;занимайте призовые места!
            </div>

            <Input
                placeholder="Поиск по названию или описанию"
                value={search}
                onChange={handleSearchChange}
                style={{ marginBottom: '1rem' }}
            />
            {user && (user.role !== 'участник' && user.role !== 'наставник' && user.role !== '?наставник') ? 
                <Button type="primary" onClick={showModal} style={{ marginBottom: '1rem', paddingTop: '20px', paddingBottom: '20px', backgroundColor: '#EF3124', fontSize: '21px', borderRadius: '48px' }}>
                    Добавить акцию
                </Button> :
                null
            }

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ maxWidth: '100%', width: 'fit-content' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        centered
                        className="tabs-centered"
                        destroyInactiveTabPane={false} // важно: не сбрасывать компоненты
                        items={[
                            {
                            key: 'current',
                            label: 'Текущие акции',
                            children: (
                                <CampaignList
                                campaigns={currentCampaigns}
                                user={user}
                                onJoinButtonClick={handleShowJoinModal}
                                />
                            ),
                            },
                            {
                            key: 'past',
                            label: 'Прошедшие акции',
                            children: (
                                <CampaignList
                                campaigns={pastCampaigns}
                                user={user}
                                onJoinButtonClick={handleShowJoinModal}
                                />
                            ),
                            },
                        ]}
                        />

                </div>
            </div>
        </div>
    );
};

