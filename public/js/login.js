/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */
import axios from 'axios';
import { showAlert } from './alert';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    if (res.data.status === 'success') {
      // const {data} = res.data;
      // ~ use cookies instead
      // localStorage.setItem('token', data.token);
      // localStorage.setItem('user', JSON.stringify(data.user));
      window.setTimeout(() => {
        location.assign('/');
      }, 100);
    } else {
      showAlert('error', res.message);
    }
  } catch (error) {
    showAlert(
      'error',
      error?.response?.data?.message || error.message || 'Something went wrong',
    );
  }
};

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: {
        name,
        email,
        password,
        passwordConfirm,
      },
    });

    if (res.data.status === 'success') {
      window.setTimeout(() => {
        location.assign('/');
      }, 100);
    }
  } catch (error) {
    showAlert(
      'error',
      error?.response?.data?.message || error.message || 'Something went wrong',
    );
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/logout',
    });

    if (res.data.status === 'success')
      window.setTimeout(() => {
        location.assign('/');
      }, 100);
  } catch (err) {
    showAlert('error', 'Error logging out! Try again.');
  }
};
