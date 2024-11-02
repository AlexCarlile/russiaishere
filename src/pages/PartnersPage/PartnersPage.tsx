import React from 'react';
import { Model } from '../../components';
import { PartnersContent }  from './PartnersContent';
import './partners.css';

export const PartnersPage = () => {
    const children = <PartnersContent />
    
    return (
        <Model children={children}/>
    ) 
}
