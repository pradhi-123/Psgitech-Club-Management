const BASE_URL = import.meta.env.VITE_API_URL || "";

const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
};

export const api = {
  get: async (url: string) => {
    const res = await fetch(`${BASE_URL}${url}`, { headers: getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  },
  post: async (url: string, body: any) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  },
  put: async (url: string, body: any) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  }
};
export default api;
