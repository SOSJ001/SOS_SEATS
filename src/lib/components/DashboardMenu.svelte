<script>
  // @ts-nocheck

  import { signout } from "../../routes/serverRoutes";

  import { goto } from "$app/navigation";

  // props for the modals
  export let seat = false;
  export let scan = false;
  export let guest = false;
  export let event = false;
  let logoutBtnStyle;


  let show = false; //to manage the logout button spinner

  // logout functon from the superbase store
  async function logout() {
    logoutBtnStyle.style = "pointer-events: none;";
    show = true; //setting spinner to visible
    await signout();
    goto('/');
  }

  //Props for the modals
</script>

<div
  class="md:flex grow flex-col gap-y-5 overflow-hidden bg-gray-800 px-6 w-64 h-screen hidden"
>
  <nav class="flex flex-1 flex-col mt-16">
    <div class="flex items-center mt-5 mb-5 rounded-full">
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
      <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded" />
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
      <!-- <hr class="w-8 h-8 mx-auto my-8 bg-gray-200 border-0 rounded  "> -->
      <hr class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded" />
      <hr class="w-5 h-1 bg-yellow-400 border-0" />
    </div>
    <div class="h-full px-3 pb-4 overflow-y-auto bg-dark">
      <ul class="space-y-2 font-medium">
        <li>
          <a
            href="/"
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 512 512"
              ><path
                fill="currentColor"
                d="M261.56 101.28a8 8 0 0 0-11.06 0L66.4 277.15a8 8 0 0 0-2.47 5.79L63.9 448a32 32 0 0 0 32 32H192a16 16 0 0 0 16-16V328a8 8 0 0 1 8-8h80a8 8 0 0 1 8 8v136a16 16 0 0 0 16 16h96.06a32 32 0 0 0 32-32V282.94a8 8 0 0 0-2.47-5.79Z"
              /><path
                fill="currentColor"
                d="m490.91 244.15l-74.8-71.56V64a16 16 0 0 0-16-16h-48a16 16 0 0 0-16 16v32l-57.92-55.38C272.77 35.14 264.71 32 256 32c-8.68 0-16.72 3.14-22.14 8.63l-212.7 203.5c-6.22 6-7 15.87-1.34 22.37A16 16 0 0 0 43 267.56L250.5 69.28a8 8 0 0 1 11.06 0l207.52 198.28a16 16 0 0 0 22.59-.44c6.14-6.36 5.63-16.86-.76-22.97Z"
              /></svg
            >
            <span class="ml-3">Home</span>
          </a>
        </li>
        <li>
          <a
            on:click|stopPropagation|preventDefault={() => (scan = true)}
            href=""
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M4 4h6v6H4V4m16 0v6h-6V4h6m-6 11h2v-2h-2v-2h2v2h2v-2h2v2h-2v2h2v3h-2v2h-2v-2h-3v2h-2v-4h3v-1m2 0v3h2v-3h-2M4 20v-6h6v6H4M6 6v2h2V6H6m10 0v2h2V6h-2M6 16v2h2v-2H6m-2-5h2v2H4v-2m5 0h4v4h-2v-2H9v-2m2-5h2v4h-2V6M2 2v4H0V2a2 2 0 0 1 2-2h4v2H2m20-2a2 2 0 0 1 2 2v4h-2V2h-4V0h4M2 18v4h4v2H2a2 2 0 0 1-2-2v-4h2m20 4v-4h2v4a2 2 0 0 1-2 2h-4v-2h4Z"
              /></svg
            >
            <span class=" ml-3">Scan</span>
          </a>
        </li>
        <li>
          <a
            on:click|stopPropagation|preventDefault={() => (guest = true)}
            href=""
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M7.5 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6ZM2 10.768C2 9.79 2.791 9 3.768 9h4.767A3.981 3.981 0 0 0 8 11a3.99 3.99 0 0 0 1.354 3H8.268a2.77 2.77 0 0 0-2.593 1.796c-1.498-.366-2.427-1.183-2.974-2.093C2 12.536 2 11.336 2 11.127v-.36ZM16 11a3.98 3.98 0 0 0-.535-2h4.767C21.21 9 22 9.791 22 10.768v.36c0 .207 0 1.408-.7 2.575c-.548.91-1.477 1.727-2.975 2.093A2.769 2.769 0 0 0 15.732 14h-1.086A3.99 3.99 0 0 0 16 11Zm3.5-6a3 3 0 1 1-6 0a3 3 0 0 1 6 0Zm-13 11.768C6.5 15.79 7.291 15 8.268 15h7.464c.977 0 1.768.791 1.768 1.768v.36c0 .207 0 1.408-.7 2.575C16.057 20.937 14.613 22 12 22s-4.058-1.063-4.8-2.297c-.7-1.167-.7-2.367-.7-2.576v-.36ZM12 14a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
              /></svg
            >
            <span class="ml-3">Guests</span>
          </a>
        </li>
        <li>
          <a
            on:click|stopPropagation|preventDefault={() => (event = true)}
            href=""
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M21 17V8H7v9h14m0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V1h2v2h8V1h2v2h1M3 21h14v2H3a2 2 0 0 1-2-2V9h2v12m16-6h-4v-4h4v4Z"
              /></svg
            >
            <span class="ml-3">Events</span>
          </a>
        </li>
        <li>
          <a
            on:click|stopPropagation|preventDefault={() => (seat = true)}
            href=""
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 448 512"
              ><path
                fill="currentColor"
                d="M248 48v208h48V58.7c23.9 13.8 40 39.7 40 69.3v128h48V128C384 57.3 326.7 0 256 0h-64C121.3 0 64 57.3 64 128v128h48V128c0-29.6 16.1-55.5 40-69.3V256h48V48h48zM48 288c-12.1 0-23.2 6.8-28.6 17.7l-16 32c-5 9.9-4.4 21.7 1.4 31.1S20.9 384 32 384v96c0 17.7 14.3 32 32 32s32-14.3 32-32v-96h256v96c0 17.7 14.3 32 32 32s32-14.3 32-32v-96c11.1 0 21.4-5.7 27.2-15.2s6.4-21.2 1.4-31.1l-16-32c-5.4-10.9-16.5-17.7-28.6-17.7H48z"
              /></svg
            >
            <span class="ml-3">Seats</span>
          </a>
        </li>
        <li>
          <a
            on:click|stopPropagation|preventDefault={logout}
            bind:this={logoutBtnStyle}
            href=""
            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              ><g transform="translate(24 0) scale(-1 1)"
                ><path
                  fill="currentColor"
                  d="M11.25 19a.75.75 0 0 1 .75-.75h6a.25.25 0 0 0 .25-.25V6a.25.25 0 0 0-.25-.25h-6a.75.75 0 0 1 0-1.5h6c.966 0 1.75.784 1.75 1.75v12A1.75 1.75 0 0 1 18 19.75h-6a.75.75 0 0 1-.75-.75Z"
                /><path
                  fill="currentColor"
                  d="M15.612 13.115a1 1 0 0 1-1 1H9.756c-.023.356-.052.71-.086 1.066l-.03.305a.718.718 0 0 1-1.025.578a16.844 16.844 0 0 1-4.885-3.539l-.03-.031a.721.721 0 0 1 0-.998l.03-.031a16.843 16.843 0 0 1 4.885-3.539a.718.718 0 0 1 1.025.578l.03.305c.034.355.063.71.086 1.066h4.856a1 1 0 0 1 1 1v2.24Z"
                /></g
              ></svg
            >
            <span class="ml-3 flex gap-2 items-center">
              <span> Logout</span>{#if show}
                <svg
                  aria-hidden="true"
                  role="status"
                  class="inline w-4 h-4 mr-3 text-yellow-400 animate-spin"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="#E5E7EB"
                  />
                  <path
                    d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                    fill="currentColor"
                  />
                </svg>
              {/if}</span
            >
          </a>
        </li>
      </ul>
    </div>
  </nav>
</div>
