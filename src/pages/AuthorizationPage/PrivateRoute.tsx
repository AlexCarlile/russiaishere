import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  // children: JSX.Element;
  authorized: boolean | undefined;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ authorized }) => {
  if (authorized === undefined) {
    return null; // или Spinner
  }

  return authorized ? <Outlet /> : <Navigate to="/" replace />;
};
