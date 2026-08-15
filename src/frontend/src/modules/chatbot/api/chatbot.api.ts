import { apiClient } from '../../../shared/api/apiClient';

export interface ChatMessagePayload {
  message: string;
  clientRequestId: string;
}

export const chatbotApi = {
  sendMessage: async (payload: ChatMessagePayload) => {
    const response = await apiClient.post('/chatbot/message', payload, {
      withCredentials: true, // Required for anonymous session cookies
    });
    return response.data;
  },

  sendMessageStream: async (
    payload: ChatMessagePayload,
    onChunk: (text: string) => void
  ) => {
    const baseUrl = apiClient.defaults.baseURL || 'http://localhost:3000/api/v1';
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/chatbot/message`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      credentials: 'include'
    });

    if (!response.ok) {
      let errorMsg = `Lỗi hệ thống (${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData?.error) errorMsg = errorData.error;
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    if (!response.body) {
      throw new Error('ReadableStream not supported');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep the last incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const parsed = JSON.parse(line.substring(6));
            if (parsed.text) {
              onChunk(parsed.text);
            }
          } catch (e) {
            // ignore partial parse errors
          }
        }
      }
    }
  },

  getHistory: async (page = 1, limit = 50) => {
    // Note: Do not auto-redirect on 401 since it's optionally authenticated
    const response = await apiClient.get(`/chatbot/history?page=${page}&limit=${limit}&t=${Date.now()}`, {
      withCredentials: true,
    });
    return response.data;
  }
};
