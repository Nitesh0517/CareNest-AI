import api from './api';

export const medicationService = {
  async getMedications(elderlyId = null) {
    const params = elderlyId ? { elderly_id: elderlyId } : {};
    const res = await api.get('/medications', { params });
    return res.data;
  },

  async getMedication(id) {
    const res = await api.get(`/medications/${id}`);
    return res.data;
  },

  async createMedication(data) {
    const res = await api.post('/medications', data);
    return res.data;
  },

  async updateMedication(id, data) {
    const res = await api.put(`/medications/${id}`, data);
    return res.data;
  },

  async deleteMedication(id) {
    const res = await api.delete(`/medications/${id}`);
    return res.data;
  },

  async getTodaySchedule(elderlyId = null) {
    const params = elderlyId ? { elderly_id: elderlyId } : {};
    const res = await api.get('/medication-logs/today', { params });
    return res.data;
  },

  async recordLog(logData) {
    const res = await api.post('/medication-logs', logData);
    return res.data;
  },

  async getLogs(elderlyId = null, days = 7) {
    const params = { days };
    if (elderlyId) params.elderly_id = elderlyId;
    const res = await api.get('/medication-logs', { params });
    return res.data;
  },

  async getAdherence(elderlyId = null, days = 7) {
    const params = { days };
    if (elderlyId) params.elderly_id = elderlyId;
    const res = await api.get('/medication-logs/adherence', { params });
    return res.data;
  },
};
