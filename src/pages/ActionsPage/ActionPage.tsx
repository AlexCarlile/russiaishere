import React from 'react';
import { Model } from '../../components';
import { ActionContent } from './ActionContent';

export const ActionPage: React.FC = () => {
    
    const children = <ActionContent />

    return (
        <Model children={children}/>
    )
}
