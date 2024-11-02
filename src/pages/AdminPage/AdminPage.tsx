import React from 'react';
import { Model } from '../../components';
import { AdminContent } from './AdminContent';

export const AdminPage = () => {
    const children = <AdminContent />

    return (
        <Model children={children}/>
    )
}
