import React from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: JSX.Element;
  authorized: boolean | undefined;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, authorized }) => {
  return authorized ? children : <Navigate to="/login" />;
}
