export const ADMIN_TOKEN_STORAGE_KEY = "kriana_admin_token";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  access_token: string;
  token_type: string;
}

export interface ParentRecord {
  id: string;
  name: string;
  email: string;
  child_name: string;
  grade: string;
  access_enabled: boolean;
}

export interface ParentListResponse {
  parents: ParentRecord[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "";
    try {
      const data = await response.json();
      if (typeof data === "string") {
        message = data;
      } else if (data && typeof data === "object" && "detail" in data) {
        message = String(data.detail);
      } else {
        message = JSON.stringify(data);
      }
    } catch {
      message = await response.text();
    }

    throw new ApiError(message || `Request failed with status ${response.status}`, response.status);
  }

  return response.json() as Promise<T>;
}

export async function adminLogin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AdminLoginResponse>(response);
}

export async function fetchParents(token: string): Promise<ParentListResponse> {
  const response = await fetch(`${API_BASE_URL}/admin/parents`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return parseResponse<ParentListResponse>(response);
}

export async function updateParentAccess(
  token: string,
  parentId: string,
  enabled: boolean,
): Promise<ParentRecord> {
  const response = await fetch(`${API_BASE_URL}/admin/parents/${parentId}/access`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ access_enabled: enabled }),
  });

  return parseResponse<ParentRecord>(response);
}
