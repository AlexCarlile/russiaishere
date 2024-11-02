import React from 'react';
import { partners } from './PartnersList';

type PartnerImages = {
    [key: string]: string; // Указываем, что ключи - строки, а значения - строки (URL изображений)
};

const partnersTyped: PartnerImages = partners;

export const PartnersContent = () => {
    return (
        <div className="partners-container">
            <h2 className="partners-title">Партнёры проекта</h2>
            <div>
                {Object.keys(partners).map((key) => (
                    <img key={key} src={partners[key]} alt={key} />
                ))}
            </div>
        </div>
    );
};