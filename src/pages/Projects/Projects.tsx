import React from 'react';
import { Model } from '../../components';
import { ProjectsContent } from './ProjectsContent';

interface ProjectsProps {
  winnerPublic?: boolean;
}

export const Projects: React.FC<ProjectsProps> = ({ winnerPublic = false }) => {
    const children = <ProjectsContent/>

    return (
        <Model children={children}/>
    )
}
