import api from './api';

export const healthService = {
  async getHealthRecords(elderlyId = null, limit = 30) {
    const params = { limit };
    if (elderlyId) params.elderly_id = elderlyId;
    const res = await api.get('/health-records', { params });
    return res.data;
  },

  async createHealthRecord(data) {
    const res = await api.post('/health-records', data);
    return res.data;
  },

  async getHealthRecord(id) {
    const res = await api.get(`/health-records/${id}`);
    return res.data;
  },
};
