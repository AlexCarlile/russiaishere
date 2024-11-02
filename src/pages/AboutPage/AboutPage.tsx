import React from 'react';
import { Model } from '../../components';
import { AboutContent }  from './AboutContent';

export const AboutPage = () => {
    const children = <AboutContent />
    
    return (
        <Model children={children}/>
    ) 
}
