import React from 'react';
import { Model } from '../../../components';
import { CampaignPage } from './CampaignPage/CampaignPage';

export const CampaignDetails: React.FC = () => {
    
    const children = <CampaignPage />

    return (
        <Model children={children}/>
    )
}