import React from 'react';
import { Model } from '../../components';
import { PersonalAreaContent } from './PersonalAreaContent';

export const PersonalArea: React.FC = () => {
    const children = <PersonalAreaContent/>

    return (
        <Model children={children}/>
    )
}
