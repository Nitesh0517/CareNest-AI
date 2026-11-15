import api from './api';

export const emergencyService = {
  async getContacts(elderlyId = null) {
    const params = elderlyId ? { elderly_id: elderlyId } : {};
    const res = await api.get('/emergency/contacts', { params });
    return res.data;
  },

  async addContact(data) {
    const res = await api.post('/emergency/contacts', data);
    return res.data;
  },

  async deleteContact(id) {
    const res = await api.delete(`/emergency/contacts/${id}`);
    return res.data;
  },

  async triggerSOS(notes = "Emergency SOS button was pressed by user.") {
    const res = await api.post('/emergency/sos', { notes });
    return res.data;
  },

  async getHistory(elderlyId = null) {
    const params = elderlyId ? { elderly_id: elderlyId } : {};
    const res = await api.get('/emergency/history', { params });
    return res.data;
  },

  async resolveEvent(id, status = 'RESOLVED') {
    const res = await api.put(`/emergency/events/${id}/resolve?status_update=${status}`);
    return res.data;
  },
};
