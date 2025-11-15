import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { setUser } from '../features/auth/authSlice';
import { userApi } from '../api/userApi';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, accessToken, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && accessToken) {
        try {
          const userData = await userApi.getProfile();
          dispatch(setUser(userData));
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      }
    };

    // Fetch user profile if authenticated but user data is not loaded yet
    if (isAuthenticated && accessToken && !user) {
      fetchUserProfile();
    }
  }, [isAuthenticated, accessToken, user, dispatch]);

  return { isAuthenticated, user };
};

