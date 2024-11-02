import React from 'react'

export const LoginForm = ({title, value, onChange}) => {
    return (
       <div className='form-block'>
            <p>
                {title}
            </p>
            
            <input
                className='form-input'
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
       </div>

    )
}
