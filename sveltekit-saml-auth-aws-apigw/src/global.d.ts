/// <reference types="@sveltejs/kit" />

interface ImportMetaEnv {
  VITE_JWT_SECRET: string;
  VITE_SAML_ENTRY_POINT: string;
  VITE_SAML_CALLBACK_URL: string;
  VITE_SAML_ISSUER: string;
  VITE_SAML_AUDIENCE: string;
  VITE_SAML_CERT: string;
}
