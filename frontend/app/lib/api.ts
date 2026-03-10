import { useAuthStore } from "../store/authStore";

//all api call heree
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = useAuthStore.getState().token; // Get token from Zustand store
  // const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "API request failed");
  }

  return response.json();
};

export const login = (email: string, password: string, name: string) => {
  return fetchApi("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
};

export const getJobs = (params?: string) =>
  fetchApi(`/api/jobs${params ? `?${params}` : ""}`);

export const getJobById = (id: number) => fetchApi(`/api/jobs/${id}`);

export const createJob = (jobData: object) =>
  fetchApi("/api/jobs", {
    method: "POST",
    body: JSON.stringify(jobData),
  });

export const updateJob = (id: number, jobData: object) =>
  fetchApi(`/api/jobs/${id}`, {
    method: "PUT",
    body: JSON.stringify(jobData),
  });

export const deleteJob = (id: number) =>
  fetchApi(`/api/jobs/${id}`, {
    method: "DELETE",
  });

// export const updateJobStatus = (id: number, status_id: string) =>
//     fetchApi(`/api/jobs/${id}/status`, {
//         method: 'PATCH',
//         body: JSON.stringify({ status_id }),
//     });

export const updateJobStatus = (id: number, data: object) =>
  fetchApi(`/api/jobs/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

// Materials
export const getMaterials = () => fetchApi("/api/materials");
export const createMaterial = (data: object) =>
  fetchApi("/api/materials", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Statuses
export const getStatuses = () => fetchApi("/api/statuses");

export const createStatus = (data: object) =>
  fetchApi("/api/statuses", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Projects
export const getProjects = () => fetchApi("/api/projects");
export const createProject = (data: object) =>
  fetchApi("/api/projects", {
    method: "POST",
    body: JSON.stringify(data),
  });

// Dashboard
export const getDashboard = () => fetchApi("/api/dashboard");
// ,
//   ,
