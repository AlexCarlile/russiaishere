import React from 'react';

export const SubmitButton = ({onClick}) => {
  return (
    <div className='login-btn'>
      <button className="submit-btn btn-reset" onClick={onClick}>Войти</button>
    </div>
  )
}
