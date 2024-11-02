import React from 'react';
import { Model } from '../../components';
import { ProjectsContent } from './ProjectsContent';

export const Projects: React.FC = () => {
    const children = <ProjectsContent/>

    return (
        <Model children={children}/>
    )
}
