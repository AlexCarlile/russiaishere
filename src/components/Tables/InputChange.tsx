import React, { useState } from 'react';

interface InputChangeProps {
    initialValue: string;
    onUpdate: (newTitle: string) => void;
}

export const InputChange: React.FC<InputChangeProps> = ({ initialValue, onUpdate }) => {
    const [inputValue, setInputValue] = useState(initialValue);
    const [hide, setHide] = useState<boolean>(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setHide(false);
    };

    return (
        <div>
            <input
                value={inputValue}
                onChange={handleChange}
                style={{border: '1px solid blue', borderRadius: '5px'}}
            />
            { !hide ? 
                <button 
                    onClick={() => {
                        onUpdate(inputValue);
                    }}
                >
                    Применить
                </button> : null
            }   
        </div>
    );  
}
