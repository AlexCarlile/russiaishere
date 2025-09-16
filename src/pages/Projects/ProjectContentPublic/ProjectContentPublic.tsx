import React from 'react';
import { Model } from '../../../components';
import PCP from './PCP';


export const ProjectContentPublic: React.FC = () => {
    const children = <PCP/>

    return (
        <Model children={children}/>
    )
}