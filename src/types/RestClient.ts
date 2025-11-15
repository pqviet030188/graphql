export interface RestClient {
  client_id: string;
  client_secret: string;
  grant_type: "client_credentials" | "refresh_token";
}

export interface RestClientWithRefreshToken extends RestClient {
  refresh_token: string;
}
