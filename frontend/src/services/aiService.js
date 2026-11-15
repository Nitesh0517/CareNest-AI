import api from './api';

export const aiService = {
  async chat(message, history = [], userContext = null) {
    const res = await api.post('/ai/chat', {
      message,
      history,
      user_context: userContext,
    });
    return res.data;
  },
};
