import type { EndpointOutput, Request } from '@sveltejs/kit';
import type { ServerRequest } from '@sveltejs/kit/types/hooks';
import { Profile, SAML } from 'node-saml';
import { CallbackResult, Providers, SvelteKitAuth } from 'sk-auth';

export const auth = new SvelteKitAuth({
  jwtSecret: import.meta.env.VITE_JWT_SECRET,
  providers: [
    new class extends Providers.Provider {

      constructor() {
        super({
          id: 'saml',
          profile(profile: Profile) {
            return { ...profile, provider: 'saml' };
          }
        });
      }

      public async signin({ query, headers }: Request): Promise<EndpointOutput> {
        const relay = query.get('RelayState') ?? '';
        return {
          status: 302,
          headers: {
            Location: await this.saml.getAuthorizeUrlAsync(relay, headers['host'], {})
          }
        };
      }

      public async callback({ query, rawBody }: ServerRequest): Promise<CallbackResult> {
        const params = new URLSearchParams(rawBody?.toString());

        const saml = query.get('SAMLResponse') ?? decodeURIComponent(params.get('SAMLResponse') ?? '');
        let { profile } = await this.saml.validatePostResponseAsync({ SAMLResponse: saml });
        if (this.config.profile) {
          profile = this.config.profile(profile, undefined);
        }

        const relay = query.get('RelayState') ?? decodeURIComponent(params.get('RelayState') ?? '');
        return [ profile, relay ? relay : '/' ];
      }

      private readonly saml = new SAML({
        entryPoint: import.meta.env.VITE_SAML_ENTRY_POINT,
        callbackUrl: import.meta.env.VITE_SAML_CALLBACK_URL,
        issuer: import.meta.env.VITE_SAML_ISSUER,
        audience: import.meta.env.VITE_SAML_AUDIENCE,
        cert: import.meta.env.VITE_SAML_CERT
      });
    }()
  ]
});
