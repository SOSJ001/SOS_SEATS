<script>
const SessionFromdb = null;
 let signout = ()=>{
    console.log(null);
 }

    import {
        Navbar,
        NavBrand,
        NavHamburger,
        Drawer,
        CloseButton,
        Sidebar,
        SidebarWrapper,
        Modal,
    } from "flowbite-svelte";

    import { sineIn } from "svelte/easing";
    import sosSeats from "../assets/sosSeats.png";
    import { fade, fly } from "svelte/transition";

    let hidden2 = true;
    let backdrop = false;
    let transitionParams = {
        x: -320,
        duration: 200,
        easing: sineIn,
    };
</script>

<Navbar
    navClass="px-1 py-2.5 fixed w-screen z-20 top-0 left-0 border-b bg-gray-800 px-3"
>
    <NavBrand href="/">
        <img src={sosSeats} class=" h-10" alt="SOS SEAT Logo" />
        <!-- <span class="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Flowbite</span> -->
    </NavBrand>
    <div class="flex md:order-2">
        {#if SessionFromdb !== null}
        <a on:click|preventDefault={signout} href="/#/" class="hover:text-yellow-500 text-white bg-yellow-400 rounded-lg px-3 py-2 hover:bg-white">Logout</a>
        {:else}
            <slot name="login" />
            <slot name="signup" />
        {/if}
        <span class="z-60">
            <!-- <svelte:component this={ hidden2? NavHamburger : CloseButton } {props}/> -->
            <NavHamburger
                on:click={() => (hidden2 = false)}
                menuClass="h-6 w-6 shrink-0"
                class="text-white"
            />
        </span>
    </div>

    <!-- TOP NAV -->

    <div
        id="text"
        class=" text-white items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
    >
        <ul
            class="flex flex-col font-medium md:flex-row md:space-x-8 md:mt-0 items-center justify-center"
        >
            {#if SessionFromdb !== null}
                <li out:fade class="nav-item">
                    <a href="/#/dashboard" class="flex gap-1 ">
                        <svg
                            aria-hidden="true"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                            <path
                                d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"
                            />
                        </svg>
                        <span> DASHBOARD </span>
                    </a>
                </li>
            {/if}
            <li class="nav-item">
                <a class="flex gap-1" href="#searchForm"
                    ><svg
                        class=""
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 256 256"
                        ><g transform="translate(256 0) scale(-1 1)"
                            ><g
                                id="galaSearch0"
                                fill="none"
                                stroke="currentColor"
                                stroke-dasharray="none"
                                stroke-miterlimit="4"
                                stroke-width="16"
                                ><path
                                    id="galaSearch1"
                                    stroke-linecap="butt"
                                    stroke-linejoin="miter"
                                    stroke-opacity="1"
                                    d="m 89.074145,145.23139 -68.17345,68.17344"
                                /><path
                                    id="galaSearch2"
                                    stroke-linecap="butt"
                                    stroke-linejoin="miter"
                                    stroke-opacity="1"
                                    d="M 111.27275,167.42999 43.099304,235.60344"
                                /><path
                                    id="galaSearch3"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m 43.099305,235.60344 a 15.696788,15.696788 0 0 1 -22.19861,0"
                                /><path
                                    id="galaSearch4"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="m 20.900695,213.40483 a 15.696788,15.696788 0 0 0 0,22.19861"
                                /><path
                                    id="galaSearch5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M 240.65575,86.483932 A 70.635544,70.635544 0 0 1 170.0202,157.11948 70.635544,70.635544 0 0 1 99.384659,86.483932 70.635544,70.635544 0 0 1 170.0202,15.848389 70.635544,70.635544 0 0 1 240.65575,86.483932 Z"
                                /><path
                                    id="galaSearch6"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-opacity="1"
                                    d="m 89.074145,145.23139 22.198605,22.1986"
                                /><path
                                    id="galaSearch7"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-opacity="1"
                                    d="m 100.17344,156.33068 19.89988,-19.89987"
                                /><path
                                    id="galaSearch8"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    stroke-opacity="1"
                                    d="m 70.126446,164.17908 22.198606,22.1986"
                                /><path
                                    id="galaSearch9"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M 209.26216,86.483936 A 39.241967,39.241967 0 0 1 170.0202,125.7259"
                                /></g
                            ></g
                        ></svg
                    > <span>SEARCH</span></a
                >
            </li>
            <li class="nav-item">
                <a class="flex gap-1" href="#event"
                    ><svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        ><path
                            fill="currentColor"
                            d="M21 17V8H7v9h14m0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V1h2v2h8V1h2v2h1M3 21h14v2H3a2 2 0 0 1-2-2V9h2v12m16-6h-4v-4h4v4Z"
                        /></svg
                    > <span> EVENT</span></a
                >
            </li>
            <li class="nav-item">
                <a class="flex gap-1" href="/#/"
                    ><svg
                        aria-hidden="true"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            fill-rule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clip-rule="evenodd"
                        />
                    </svg> <span> ABOUT US</span></a
                >
            </li>
        </ul>
    </div>
</Navbar>
<!-- TOP NAV ENDS -->

<!-- SIDE NAV -->
<Drawer
    class="bg-gray-800 z-10 md:hidden"
    {backdrop}
    width="w-50"
    transitionType="fly"
    {transitionParams}
    bind:hidden={hidden2}
>
    <div class="flex items-center pt-10 mt-5 mb-5 rounded-full">
        <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
        <hr
            class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded dark:bg-gray-700"
        />
        <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
        <!-- <hr class="w-8 h-8 mx-auto my-8 bg-gray-200 border-0 rounded  dark:bg-gray-700"> -->
        <hr
            class="w-8 h-8 mx-auto bg-gray-200 border-0 rounded dark:bg-gray-700"
        />
        <hr class="w-5 h-1 bg-yellow-400 border-0 dark:bg-gray-700" />
        <CloseButton
            on:click={() => (hidden2 = true)}
            class="border border-solid border-yellow-400 text-white"
        />
    </div>
    <Sidebar asideClass="text-white">
        <SidebarWrapper divClass="overflow-y-auto px-3 rounded">
            <div class="h-full px-3 pb-4 overflow-y-auto bg-dark">
                <ul class="space-y-2 font-medium">
                    {#if SessionFromdb !== null}
                        <li>
                            <a
                                href="/#/dashboard"
                                class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
                            >
                                <svg
                                    aria-hidden="true"
                                    class="w-6 h-6 text-white transition duration-75"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"
                                    />
                                    <path
                                        d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"
                                    />
                                </svg>
                                <span class="ml-3">Dashboard</span>
                            </a>
                        </li>
                    {/if}
                    <li>
                        <a
                            href="#searchForm"
                            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
                        >
                            <svg
                                class=""
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 256 256"
                                ><g transform="translate(256 0) scale(-1 1)"
                                    ><g
                                        id="galaSearch0"
                                        fill="none"
                                        stroke="currentColor"
                                        stroke-dasharray="none"
                                        stroke-miterlimit="4"
                                        stroke-width="16"
                                        ><path
                                            id="galaSearch1"
                                            stroke-linecap="butt"
                                            stroke-linejoin="miter"
                                            stroke-opacity="1"
                                            d="m 89.074145,145.23139 -68.17345,68.17344"
                                        /><path
                                            id="galaSearch2"
                                            stroke-linecap="butt"
                                            stroke-linejoin="miter"
                                            stroke-opacity="1"
                                            d="M 111.27275,167.42999 43.099304,235.60344"
                                        /><path
                                            id="galaSearch3"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="m 43.099305,235.60344 a 15.696788,15.696788 0 0 1 -22.19861,0"
                                        /><path
                                            id="galaSearch4"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="m 20.900695,213.40483 a 15.696788,15.696788 0 0 0 0,22.19861"
                                        /><path
                                            id="galaSearch5"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M 240.65575,86.483932 A 70.635544,70.635544 0 0 1 170.0202,157.11948 70.635544,70.635544 0 0 1 99.384659,86.483932 70.635544,70.635544 0 0 1 170.0202,15.848389 70.635544,70.635544 0 0 1 240.65575,86.483932 Z"
                                        /><path
                                            id="galaSearch6"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-opacity="1"
                                            d="m 89.074145,145.23139 22.198605,22.1986"
                                        /><path
                                            id="galaSearch7"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-opacity="1"
                                            d="m 100.17344,156.33068 19.89988,-19.89987"
                                        /><path
                                            id="galaSearch8"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            stroke-opacity="1"
                                            d="m 70.126446,164.17908 22.198606,22.1986"
                                        /><path
                                            id="galaSearch9"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M 209.26216,86.483936 A 39.241967,39.241967 0 0 1 170.0202,125.7259"
                                        /></g
                                    ></g
                                ></svg
                            >
                            <span class=" ml-3">Search</span>
                        </a>
                    </li>
                    <li>
                        <a
                            href="#event"
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
                            href="/#/"
                            class="flex items-center p-2 text-white rounded-lg hover:bg-yellow-500 hover:text-white"
                        >
                            <svg
                                aria-hidden="true"
                                class="flex-shrink-0 w-6 h-6 text-white transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    fill-rule="evenodd"
                                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                    clip-rule="evenodd"
                                />
                            </svg>
                            <span class="ml-3">About Us</span>
                        </a>
                    </li>
                </ul>
            </div>
        </SidebarWrapper>
    </Sidebar>
</Drawer>

<!-- SIDE NAV ENDS -->

<style>
    #text ul li a {
        color: white;
        /* background-color: white; */
        border-radius: 2rem;
        padding: 7px;
        align-items: center;
    }

    #text ul li a:hover {
        color: #f59e0b;
        /* background-color: white; */
        /* border-width: 1px;
        border-color: #f5de0b; */
        /* border-radius: 2rem; */
        /* padding: 5px; */
    }
</style>
