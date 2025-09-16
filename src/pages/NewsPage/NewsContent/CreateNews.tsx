import React from 'react';
import { Model } from '../../../components';
import {
  CreateNewsPage
} from './CreateNewsPage';

export const CreateNews: React.FC = () => {
  const children = <CreateNewsPage />
  return (
    <Model children={children}/>  
  )
}
