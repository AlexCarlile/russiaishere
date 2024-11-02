import React from 'react';

interface CampaignListProps {
    campaigns: any[];
}

export const ModeratorCampaignList: React.FC<CampaignListProps> = ({ campaigns }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
            {campaigns.map((campaign) => (
                <div key={campaign.id} style={{ width: '300px', border: '1px solid #ccc', padding: '1rem', marginBottom: '1rem' }}>
                    <h3>{campaign.title}</h3>
                    <p>{campaign.description}</p>
                    <p>
                        Дата начала: {new Date(campaign.start_date).toLocaleDateString()}, Дата окончания:{' '}
                        {new Date(campaign.end_date).toLocaleDateString()}
                    </p>
                    <p>Статус: {campaign.approval_status}</p>
                    {campaign.image_url && (
                        <img src={`http://127.0.0.1:5000${campaign.image_url}`} alt={campaign.title} style={{ maxWidth: '100%' }} />
                    )}
                </div>
            ))}
        </div>
    );
};