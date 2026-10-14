export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  email: string;
  fullName: string;
}

export interface StudentRegisterRequest {
  fullName: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface StudentRegisterResponse {
  id: number;
  fullName: string;
  email: string;
  mobileNumber: string;
}