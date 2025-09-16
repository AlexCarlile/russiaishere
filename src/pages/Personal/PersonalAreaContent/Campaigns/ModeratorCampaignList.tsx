import React from 'react';
import { CheckCircleFilled, CloseCircleFilled, MinusCircleFilled } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

interface CampaignListProps {
    campaigns: any[];
}

export const ModeratorCampaignList: React.FC<CampaignListProps> = ({ campaigns }) => {
    const navigate = useNavigate();
    const getStatusIndicator = (status: string) => {
        switch (status) {
            case 'yes':
                return {
                    color: '#52c41a',
                    icon: <CheckCircleFilled style={{ color: '#fff' }} />,
                    text: 'Акция одобрена',
                };
            case 'InProcess':
                return {
                    color: '#faad14',
                    icon: <MinusCircleFilled style={{ color: '#fff' }} />,
                    text: 'Акция на проверке',
                };
            case 'no':
                return {
                    color: '#ff4d4f',
                    icon: <CloseCircleFilled style={{ color: '#fff' }} />,
                    text: 'Акция отклонена',
                };
            default:
                return {
                    color: '#d9d9d9',
                    icon: null,
                    text: 'Неизвестный статус',
                };
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '60px',
                justifyContent: 'space-between',
            }}
        >
            {campaigns.map((campaign) => {
                const status = getStatusIndicator(campaign.approval_status);

                return (
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
                        onClick={() => navigate(`/actions/${campaign.id}`)}
                    >
                        {/* Индикатор статуса внутри карточки */}
                        <Tooltip title={status.text}>
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: status.color,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    boxShadow: '0 0 6px rgba(0,0,0,0.2)',
                                    zIndex: 10,
                                }}
                            >
                                {status.icon}
                            </div>
                        </Tooltip>

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
                                Статус: {campaign.approval_status}
                            </p> */}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
