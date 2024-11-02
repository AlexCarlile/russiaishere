import React from 'react';

export const CheckboxForm = ({ checked, onChange }) => {
  return (

    <div className="checkbox flex">
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
        />
        <p>
          Запомнить меня на этом компьютере
        </p>
    </div>
  )
}
