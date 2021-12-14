<script>
  import { signOut as authSignOut } from 'sk-auth/client';
  import { session } from '$app/stores';

  $: user = $session.user;

  function signIn() {
    location.assign('/api/auth/signin/google?redirect=/');
  }

  function signOut() {
    authSignOut().then(session.set);
  }
</script>


{#if !user}
  <button on:click="{signIn}">サインイン with Google</button>
{:else}
  <h2>Hello {user.name} !!</h2>
  <p><img src={user.picture} alt="{user.name} icon" /></p>
  <button on:click={signOut}>サインアウト</button>
{/if}
