import ApiClient from './api';

const TOKEN_KEY = 'resend_auth_token';
const USER_KEY = 'resend_auth_user';

export const authService = {
  async login(username: string, password: string) {
    const response = await ApiClient.post('/auth/login', { username, password });
    const { access_token, username: loggedInUser } = response.data;
    
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, loggedInUser);
    
    return response.data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    return localStorage.getItem(USER_KEY);
  },

  isAuthenticated() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
};
