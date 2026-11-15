import api from './api';

export const caregiverService = {
  async getDashboard() {
    const res = await api.get('/caregiver/dashboard');
    return res.data;
  },

  async getElderlyUsers() {
    const res = await api.get('/caregiver/elderly-users');
    return res.data;
  },

  async getElderlyDetails(elderlyId) {
    const res = await api.get(`/caregiver/elderly-users/${elderlyId}`);
    return res.data;
  },

  async linkElderly(email) {
    const res = await api.post('/caregiver/link', { elderly_email: email });
    return res.data;
  },
};
