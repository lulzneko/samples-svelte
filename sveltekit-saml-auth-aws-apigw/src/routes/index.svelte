<script>
  import { signOut as authSignOut } from 'sk-auth/client';
  import { session } from '$app/stores';

  $: user = $session.user;

  function signIn() {
    location.assign('/api/auth/signin/saml?RelayState=/');
  }

  function signOut() {
    authSignOut().then(session.set);
  }
</script>


{#if !user}
  <button on:click="{signIn}">サインイン with SAML</button>
{:else}
  <h2>Hello {user.name} !!</h2>
  <button on:click={signOut}>サインアウト</button>
{/if}
