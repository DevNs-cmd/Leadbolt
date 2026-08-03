const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const axiosInstance = {
  async get(url: string, config?: { params?: Record<string, any> }) {
    let fullUrl = `${BASE_URL}${url}`;
    if (config?.params) {
      const searchParams = new URLSearchParams();
      Object.entries(config.params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, String(val));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
      }
    }
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `GET request failed with status ${res.status}`);
    }
    const data = await res.json();
    return { data };
  },

  async post(url: string, body?: any) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `POST request failed with status ${res.status}`);
    }
    const data = await res.json();
    return { data };
  },

  async patch(url: string, body?: any) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `PATCH request failed with status ${res.status}`);
    }
    const data = await res.json();
    return { data };
  },

  async delete(url: string) {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `DELETE request failed with status ${res.status}`);
    }
    let data = null;
    if (res.status !== 204) {
      data = await res.json().catch(() => null);
    }
    return { data };
  },
};
