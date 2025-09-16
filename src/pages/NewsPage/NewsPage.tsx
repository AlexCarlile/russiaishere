import React from 'react';
import { Model } from '../../components';
import {
  NewsContent
} from './NewsContent';

export const NewsPage: React.FC = () => {
  const children = <NewsContent />
  return (
    <Model children={children}/>  
  )
}
