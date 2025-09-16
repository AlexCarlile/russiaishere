import React from 'react';
import { Model } from '../../../components';
import {
  NewsDetailsContent
} from './ExactNews';

export const NewsDetails: React.FC = () => {
  const children = <NewsDetailsContent />
  return (
    <Model children={children}/>  
  )
}
