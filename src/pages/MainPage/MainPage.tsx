import React from 'react';
import { Model } from '../../components';
import {
  MainContent
} from './MainContent';

export const MainPage: React.FC = () => {
  const children = <MainContent />
  return (
    <Model children={children}/>  
  )
}
