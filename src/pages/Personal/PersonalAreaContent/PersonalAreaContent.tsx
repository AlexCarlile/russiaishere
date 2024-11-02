import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Avatar, Upload, message, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import Cookies from 'js-cookie';
import axios from 'axios';
import { Info } from './Info';
import { Campaigns } from './Campaigns';

export const PersonalAreaContent = () => {


    return (
        <div>
            <Info />
            <Campaigns/>
        </div>

    );
};