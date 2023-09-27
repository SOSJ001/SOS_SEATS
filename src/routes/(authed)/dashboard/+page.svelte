<script>
    import "animate.css";
    import nothing from "$lib/assets/nothing.png";
    import addEventPic from "$lib/assets/addEvent.png";
    import hi from "$lib/assets/hi.png";
    import { Modal } from "flowbite-svelte";
    import { fade, fly } from "svelte/transition";
    import { onMount } from "svelte";
    import TopnavDash from "$lib/components/TopnavDash.svelte";
    import DashboardMenu from "$lib/components/DashboardMenu.svelte";
    import DashboardUtilities from "$lib/components/DashboardUtilities.svelte";
    import DashboardEvent from "$lib/components/DashboardEvent.svelte";

    let Session1 = true;
    let event = false;
    let seat = false;
    let guest = false;
    let addEvent = false;
    let addSeat = false;
    let show = false;
    let Audience = "Private";
    let createEventBtn;
    let createEventBtnstyle;

    let scan = false;


</script>

<div class="bg-gray-700 items-center text-white overflow-x-hidden h-screen">
    <TopnavDash />

    <div class="flex flex-row">
        <div>
            <DashboardMenu bind:seat bind:scan bind:guest bind:event />
        </div>

        <div class=" bg-gray-700 h-screen w-full overflow-hidden">
            <div class=" mt-16 bg-gray-700 h-screen overflow-y-auto pb-16">
                <DashboardUtilities>
                    <svelte:fragment slot="button">
                        <a
                            on:click={() => (scan = true)}
                            href="/dashboard"
                            class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="60"
                                height="60"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M3 6.5A3.5 3.5 0 0 1 6.5 3h1.864a1 1 0 0 1 0 2H6.5A1.5 1.5 0 0 0 5 6.5v1.864a1 1 0 0 1-2 0V6.5ZM14.636 4a1 1 0 0 1 1-1H17.5A3.5 3.5 0 0 1 21 6.5v1.864a1 1 0 1 1-2 0V6.5A1.5 1.5 0 0 0 17.5 5h-1.864a1 1 0 0 1-1-1ZM4 14.636a1 1 0 0 1 1 1V17.5A1.5 1.5 0 0 0 6.5 19h1.864a1 1 0 1 1 0 2H6.5A3.5 3.5 0 0 1 3 17.5v-1.864a1 1 0 0 1 1-1Zm16 0a1 1 0 0 1 1 1V17.5a3.5 3.5 0 0 1-3.5 3.5h-1.864a1 1 0 1 1 0-2H17.5a1.5 1.5 0 0 0 1.5-1.5v-1.864a1 1 0 0 1 1-1ZM12 13a1 1 0 1 0 0-2a1 1 0 0 0 0 2Zm-1.152-6c-.473 0-.906.263-1.118.678L9.242 9h-.575C7.747 9 7 9.596 7 10.5v3.864C7 15.267 7.746 16 8.667 16h6.666c.92 0 1.667-.733 1.667-1.636V10.5c0-.904-.746-1.5-1.667-1.5h-.575l-.488-1.322A1.253 1.253 0 0 0 13.152 7h-2.304ZM12 14a2 2 0 1 1 0-4a2 2 0 0 1 0 4Z"
                                /></svg
                            >
                            <span> Scan </span>
                        </a>
                    </svelte:fragment>

                    <svelte:fragment slot="button2">
                        <a
                            on:click={() => (guest = true)}
                            href="/dashboard"
                            class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="60"
                                height="60"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M7.5 8a3 3 0 1 0 0-6a3 3 0 0 0 0 6ZM2 10.768C2 9.79 2.791 9 3.768 9h4.767A3.981 3.981 0 0 0 8 11a3.99 3.99 0 0 0 1.354 3H8.268a2.77 2.77 0 0 0-2.593 1.796c-1.498-.366-2.427-1.183-2.974-2.093C2 12.536 2 11.336 2 11.127v-.36ZM16 11a3.98 3.98 0 0 0-.535-2h4.767C21.21 9 22 9.791 22 10.768v.36c0 .207 0 1.408-.7 2.575c-.548.91-1.477 1.727-2.975 2.093A2.769 2.769 0 0 0 15.732 14h-1.086A3.99 3.99 0 0 0 16 11Zm3.5-6a3 3 0 1 1-6 0a3 3 0 0 1 6 0Zm-13 11.768C6.5 15.79 7.291 15 8.268 15h7.464c.977 0 1.768.791 1.768 1.768v.36c0 .207 0 1.408-.7 2.575C16.057 20.937 14.613 22 12 22s-4.058-1.063-4.8-2.297c-.7-1.167-.7-2.367-.7-2.576v-.36ZM12 14a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
                                /></svg
                            >
                            <span> Guests </span>
                        </a>
                    </svelte:fragment>

                    <span slot="topLabel2"> SEE </span>
                    <span slot="buttomLabel2"> GUESTS </span>
                    <span slot="svg4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="35"
                            height="35"
                            viewBox="0 0 24 24"
                            ><path
                                fill="currentColor"
                                d="M12.753 2c1.158 0 2.111.875 2.234 2h1.763a2.25 2.25 0 0 1 2.245 2.096L19 6.25v4.924A6.52 6.52 0 0 0 17.5 11V6.25a.75.75 0 0 0-.648-.743L16.75 5.5h-2.132a2.244 2.244 0 0 1-1.865.993H9.247a2.244 2.244 0 0 1-1.865-.992L5.25 5.5a.75.75 0 0 0-.743.648L4.5 6.25v13.505c0 .38.282.693.648.743l.102.007h6.485a6.519 6.519 0 0 0 1.079 1.5H5.25a2.25 2.25 0 0 1-2.245-2.096L3 19.755V6.25a2.25 2.25 0 0 1 2.096-2.245L5.25 4h1.763a2.247 2.247 0 0 1 2.234-2h3.506Zm0 1.5H9.247a.747.747 0 0 0 0 1.493h3.506a.747.747 0 1 0 0-1.493ZM8.25 13.995h3.775A6.47 6.47 0 0 0 11 17.5c0 .34.026.673.076.999H11c-2.528 0-4-.909-4-2.756v-.498c0-.69.56-1.25 1.25-1.25Zm2.75-6a2.5 2.5 0 1 1 0 5a2.5 2.5 0 0 1 0-5ZM23 17.5a5.5 5.5 0 1 0-11 0a5.5 5.5 0 0 0 11 0Zm-5 .5l.001 2.503a.5.5 0 1 1-1 0V18h-2.505a.5.5 0 1 1 0-1H17v-2.5a.5.5 0 1 1 1 0V17h2.503a.5.5 0 1 1 0 1h-2.502Z"
                            /></svg
                        >
                    </span>
                </DashboardUtilities>
                <DashboardUtilities>
                    <!-- left column -->
                    <svelte:fragment slot="button">
                        <a
                            on:click={() => (event = true)}
                            href="/dashboard"
                            class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
                        >
                            <svg
                                class="p-1"
                                xmlns="http://www.w3.org/2000/svg"
                                width="60"
                                height="60"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M21 17V8H7v9h14m0-14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V1h2v2h8V1h2v2h1M3 21h14v2H3a2 2 0 0 1-2-2V9h2v12m16-6h-4v-4h4v4Z"
                                /></svg
                            >
                            <span> Events </span>
                        </a>
                    </svelte:fragment>
                    <span slot="topLabel"> TOTAL </span>
                    <span slot="buttomLabel"> EVENTS </span>
                    <div slot="svg2" class=" text-2xl">
                        <!-- DYBAMIC VALUE -->
                        3
                    </div>

                    <!-- right column -->
                    <svelte:fragment slot="button2">
                        <a
                            on:click={() => (seat = true)}
                            href="/dashboard"
                            class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
                        >
                            <svg
                                class="p-1"
                                xmlns="http://www.w3.org/2000/svg"
                                width="60"
                                height="60"
                                viewBox="0 0 448 512"
                                ><path
                                    fill="currentColor"
                                    d="M248 48v208h48V58.7c23.9 13.8 40 39.7 40 69.3v128h48V128C384 57.3 326.7 0 256 0h-64C121.3 0 64 57.3 64 128v128h48V128c0-29.6 16.1-55.5 40-69.3V256h48V48h48zM48 288c-12.1 0-23.2 6.8-28.6 17.7l-16 32c-5 9.9-4.4 21.7 1.4 31.1S20.9 384 32 384v96c0 17.7 14.3 32 32 32s32-14.3 32-32v-96h256v96c0 17.7 14.3 32 32 32s32-14.3 32-32v-96c11.1 0 21.4-5.7 27.2-15.2s6.4-21.2 1.4-31.1l-16-32c-5.4-10.9-16.5-17.7-28.6-17.7H48z"
                                /></svg
                            >
                            <span> Seats </span>
                        </a>
                    </svelte:fragment>

                    <span slot="topLabel2"> TOTAL </span>
                    <span slot="buttomLabel2"> SEATS </span>
                    <span slot="svg4" class="text-2xl">
                        <!-- DYBAMIC VALUE -->
                        1000
                    </span>

                    <!-- list of event down here -->
                </DashboardUtilities>
                <div
                    class="w-full h-2 mx-2 bg-yellow-400 mt-4 rounded-full mb-2"
                />
                <!-- <hr
                class="w-full h-1 mx-2 mt-4 mb-2 bg-yellow-400 border-0 rounded dark:bg-gray-700"
            /> -->
                <div class=" hover:bg-slate-400 mx-2 rounded items-center">
                    <img
                        class="mx-auto my-auto"
                        src={nothing}
                        alt="nothing here"
                    />
                    <img
                        class=" animate__animated animate__pulse animate__infinite animate__slow mx-auto my-auto"
                        src={addEventPic}
                        alt="nothing here"
                    />
                    <!-- <marquee behavior="" direction=" "> -->
                    <img
                        class=" animate__animated animate__flash animate__slow 2s mx-auto animate__infinite w-25 h-20"
                        src={hi}
                        alt="nothing here"
                    />
                    <!-- </marquee> -->
                </div>
<DashboardEvent/>
                <!-- <DashboardEvent /> -->
            </div>
        </div>

        <!-- models down here  -->
        {#if event}
            <!-- Event modal below -->
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    title="LIST OF EVENTS"
                    bind:open={event}
                    size="lg"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white "
                >
                    <div class="relative overflow-x-auto shadow-md rounded-lg">
                        <table class="w-full text-sm text-left text-gray-400">
                            <thead
                                class="text-xs uppercase bg-slate-600 text-white"
                            >
                                <tr>
                                    <th scope="col" class="px-6 py-3"> # </th>
                                    <th scope="col" class="px-6 py-3">
                                        Flyer
                                    </th>
                                    <th
                                        scope=" col"
                                        class="whitespace-nowrap px-6 py-3"
                                    >
                                        Event Name
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Date
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Venue
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    class=" border-b border-white bg-gray-800 hover:bg-gray-900"
                                >
                                    <td class="px-6 py-4"> 1 </td>
                                    <th
                                        scope="row"
                                        class="px-6 py-4 font-medium whitespace-nowrap text-white"
                                    >
                                        Apple MacBook Pro 17"
                                    </th>
                                    <td class="px-6 py-4"> SilverSilver"</td>
                                    <td class="px-6 py-4"> Laptop </td>
                                    <td class="px-6 py-4"> Hillstation </td>

                                    <td
                                        class="flex items-center px-6 py-4 space-x-3"
                                    >
                                        <a
                                            on:click|preventDefault|stopPropagation={() => {
                                                console.log("Edit btn");
                                            }}
                                            href="#"
                                            class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                            >Edit</a
                                        >
                                        <a
                                            on:click|preventDefault|stopPropagation={() => {
                                                console.log("Remove btn");
                                            }}
                                            href="#"
                                            class="font-medium text-red-600 dark:text-red-500 hover:underline"
                                            >Remove</a
                                        >
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- add Event button on the event modal below -->
                    <div
                        class=" font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
                    >
                        <span class="hidden md:block"
                            >Customer satisfaction is our GOAL!</span
                        >
                        <span class="md:hidden">Keep Smiling !</span>
                        <a
                            on:click|preventDefault|stopPropagation={() => {
                                event = false;
                                let time = setTimeout(() => {
                                    addEvent = true;
                                    clearTimeout(time);
                                }, 1000);
                            }}
                            href=""
                            class="text-white hover:text-gray-50 px-2 md:p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4z"
                                /></svg
                            >
                            <span class="">Create Event</span>
                        </a>
                    </div>
                </Modal>
            </div>
        {/if}

        {#if seat}
            <!-- seat modal below -->
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    title="LIST OF SEATS"
                    bind:open={seat}
                    size="lg"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white"
                >
                    <div class="relative overflow-x-auto shadow-md rounded-lg">
                        <table class="w-full text-sm text-left text-gray-400">
                            <thead
                                class="text-xs uppercase bg-slate-600 text-white"
                            >
                                <tr>
                                    <th scope="col" class="px-6 py-3"> # </th>
                                    <th
                                        scope="col"
                                        class="whitespace-nowrap px-6 py-3"
                                    >
                                        Event Name
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 whitespace-nowrap"
                                    >
                                        Seat Area
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 whitespace-nowrap"
                                    >
                                        Max Seat
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Description
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Price
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900"
                                >
                                    <td class="px-6 py-4"> 1 </td>
                                    <th
                                        scope="row"
                                        class="px-6 py-4 font-medium whitespace-nowrap text-white"
                                    >
                                        Apple MacBook Pro 17"
                                    </th>
                                    <td class="px-6 py-4"> Silver </td>
                                    <th class="px-6 py-4">
                                        Laptop ggdvcjgsdvcgds</th
                                    >
                                    <td class="px-6 py-4"> Hillstation </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        Nle. 50
                                    </td>

                                    <td class=" items-center px-6 py-4">
                                        <div class="flex gap-3 items-center">
                                            <a
                                                on:click|preventDefault|stopPropagation={() => {
                                                    console.log("Edit btn");
                                                }}
                                                href="#"
                                                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                                >Edit</a
                                            >
                                            <a
                                                on:click|preventDefault|stopPropagation={() => {
                                                    console.log("Remove btn");
                                                }}
                                                href="#"
                                                class="font-medium text-red-600 dark:text-red-500 hover:underline"
                                                >Remove</a
                                            >
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div
                        class=" font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
                    >
                        <span class="hidden md:block"
                            >Customer satisfaction is our GOAL!</span
                        >
                        <span class="md:hidden">Keep Smiling !</span>
                        <a
                            on:click|preventDefault|stopPropagation={() => {
                                seat = false;
                                let time = setTimeout(() => {
                                    addSeat = true;
                                    clearTimeout(time);
                                }, 1000);
                            }}
                            href=""
                            class="text-white hover:text-gray-50 px-2 md:p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                ><path
                                    fill="currentColor"
                                    d="M18 10h-4V6a2 2 0 0 0-4 0l.071 4H6a2 2 0 0 0 0 4l4.071-.071L10 18a2 2 0 0 0 4 0v-4.071L18 14a2 2 0 0 0 0-4z"
                                /></svg
                            >
                            <span class="">Add Seats</span>
                        </a>
                    </div>
                </Modal>
            </div>
        {/if}

        {#if guest}
            <!-- seat modal below -->
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    title="GUESTS"
                    bind:open={guest}
                    size="lg"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white"
                >
                    <div
                        class="  font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-center items-center flex p-2"
                    >
                        <span class="">Show </span>
                        <select
                            id="underline_select"
                            class=" mx-2 text-center py-2.5 px-0 text-sm bg-transparent border-0 border-b-2 appearance-none text-gray-800 border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
                        >
                            <option selected>All</option>
                            <option value="US">United States</option>
                            <option value="CA">Canada</option>
                            <option value="FR">France</option>
                            <option value="DE">Germany</option>
                        </select>

                        <span class="">Guests </span>
                    </div>
                    <div class="relative overflow-auto shadow-md rounded-lg">
                        <table class="w-full text-sm text-left text-gray-400">
                            <thead
                                class="text-xs uppercase bg-slate-600 text-white"
                            >
                                <tr>
                                    <th scope="col" class="px-6 py-3"> # </th>
                                    <th
                                        scope="col"
                                        class="whitespace-nowrap px-6 py-3"
                                    >
                                        Guest Name
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 whitespace-nowrap"
                                    >
                                        Status
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 whitespace-nowrap"
                                    >
                                        Event Name
                                    </th>
                                    <th
                                        scope="col"
                                        class="px-6 py-3 whitespace-nowrap"
                                    >
                                        Shared On
                                    </th>
                                    <th scope="col" class="px-6 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    class=" items-center border-b border-white bg-gray-800 hover:bg-gray-900"
                                >
                                    <td class="px-6 py-4"> 1 </td>
                                    <th
                                        scope="row"
                                        class="px-6 py-4 font-medium whitespace-nowrap text-white"
                                    >
                                        Apple MacBook Pro 17"
                                    </th>
                                    <td class="px-6 py-4"> Silver </td>
                                    <th class="px-6 py-4">
                                        Laptop ggdvcjgsdvcgds</th
                                    >
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        Nle. 50
                                    </td>

                                    <td class=" items-center px-6 py-4">
                                        <div class="flex gap-3 items-center">
                                            <a
                                                on:click|preventDefault|stopPropagation={() => {
                                                    console.log("Download btn");
                                                }}
                                                href="#"
                                                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                                                >Download</a
                                            >
                                            <a
                                                on:click|preventDefault|stopPropagation={() => {
                                                    console.log("Remove btn");
                                                }}
                                                href="#"
                                                class="font-medium text-red-600 dark:text-red-500 hover:underline"
                                                >Remove</a
                                            >
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Modal>
            </div>
        {/if}

        {#if scan}
            <!-- seat modal below -->
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    bind:open={scan}
                    size="sm"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white"
                >
                    <h1>
                        hi there <br /> (this is the scan modal) <br /> maintenance
                        !!
                    </h1>
                </Modal>
            </div>
        {/if}

        <!-- Add event modal below -->
        {#if addEvent}
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    title="CREATE EVENT"
                    bind:open={addEvent}
                    size="sm"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white"
                >
                    <!-- create event foem -->
                    <form class="text-left">
                        <div class=" grid grid-cols-2 gap-2">
                            <div class="mb-3">
                                <label
                                    for="eventName"
                                    class="block mb-2 text-sm font-medium"
                                    >Event Name</label
                                >
                                <input
                                    type="text"
                                    id="eventName"
                                    class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Michael Johnson"
                                    required
                                />
                            </div>
                            <div class="mb-3">
                                <label
                                    for="eventDate"
                                    class="block mb-2 text-sm font-medium"
                                    >Event Date</label
                                >
                                <input
                                    type="date"
                                    id="eventDate"
                                    class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="SOSJ001"
                                    required
                                />
                            </div>
                        </div>
                        <div class="mb-3">
                            <label
                                for="eventVenue"
                                class="block mb-2 text-sm font-medium"
                                >Event venue</label
                            >
                            <input
                                type="text"
                                id="eventVenue"
                                class="text-black bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                placeholder="Hillstation"
                                required
                            />
                        </div>
                        <div class="mb-3">
                            <span class="mb-2 text-sm font-medium"
                                >Audience :</span
                            >
                            <span class="text-yellow-400">
                                {#if Audience === "Private"}
                                    <span in:fade>Only you can share</span>
                                {:else}
                                    <span in:fade
                                        >Public for all and you can share too</span
                                    >
                                {/if}</span
                            >

                            <div
                                class=" flex bg-gray-50 text-black p-3 rounded-lg items-center gap-20 w-full justify-center"
                            >
                                <div
                                    class="flex items-center hover:text-yellow-400"
                                >
                                    <input
                                        bind:group={Audience}
                                        id="default-radio-2"
                                        type="radio"
                                        value="Private"
                                        name="audience"
                                        class="w-4 h-4 text-yellow-400 focus:ring-yellow-400 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
                                    />
                                    <label
                                        for="default-radio-2"
                                        class="ml-2 text-sm font-medium"
                                        >Private</label
                                    >
                                </div>
                                <div
                                    class="flex items-center hover:text-yellow-400"
                                >
                                    <input
                                        bind:group={Audience}
                                        id="default-radio-1"
                                        type="radio"
                                        value="Public"
                                        name="audience"
                                        class="w-4 h-4 text-yellow-400 focus:ring-yellow-400 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
                                    />
                                    <label
                                        for="default-radio-1"
                                        class="ml-2 text-sm font-medium"
                                        >Public</label
                                    >
                                </div>
                            </div>
                        </div>

                        <div class=" mb-3">
                            <label
                                class="block mb-2 text-sm font-medium text-white cursor-pointer hover:text-yellow-400"
                                for="file_input">Upload Flyer/Poster</label
                            >
                            <input
                                class="block w-full text-sm border rounded-lg cursor-pointer text-gray-700 focus:outline-none bg-gray-50 border-gray-50 placeholder-gray-400"
                                aria-describedby="file_input_help"
                                id="file_input"
                                type="file"
                                required
                            />
                            <!-- <p class="mt-1 text-sm text-gray-500 dark:text-gray-300" id="file_input_help">SVG, PNG, JPG or GIF (MAX. 800x400px).</p> -->
                        </div>

                        <!-- create event button below -->
                        <a
                            href=""
                            bind:this={createEventBtnstyle}
                            on:click|preventDefault|once={() => {
                                show = true;
                                createEventBtn.innerText =
                                    "Creating Please Wait.....";
                            }}
                            class="text-center"
                            ><div
                                class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
                            >
                                {#if show}
                                    <svg
                                        aria-hidden="true"
                                        role="status"
                                        class="inline w-4 h-4 mr-3 text-white animate-spin"
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
                                {/if}

                                <span bind:this={createEventBtn}
                                    >Create Event</span
                                >
                            </div>
                        </a>
                    </form>

                    <!-- back button on the add event modal below -->
                    <div
                        class="  font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
                    >
                        <span class="hidden md:block"
                            >Customer satisfaction is our GOAL!</span
                        >
                        <span class="md:hidden">Keep Smiling !</span>
                        <a
                            on:click|preventDefault|stopPropagation={() => {
                                addEvent = false;
                                let time = setTimeout(() => {
                                    event = true;
                                    clearTimeout(time);
                                }, 1000);
                            }}
                            href=""
                            class="text-white hover:text-gray-50 p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="24"
                                viewBox="0 0 32 32"
                                ><path
                                    fill="currentColor"
                                    d="m2.36 11.23l8.31 7.57c.61.56 1.6.12 1.6-.71v-3.63c0-.35.29-.64.64-.64h15.86c.66 0 1.19-.53 1.19-1.19V8.42c0-.66-.53-1.19-1.19-1.19H12.91c-.35 0-.64-.29-.64-.64V2.96c0-.83-.99-1.27-1.6-.71L2.36 9.82a.946.946 0 0 0 0 1.41Zm13.97 17.53l-2.54-6.95c-.16-.49-.62-.81-1.13-.81c-.51 0-.97.32-1.12.79l-2.57 6.98c-.18.48.07 1 .55 1.18c.1.03.21.05.32.05c.37 0 .73-.23.86-.6l.41-1.13c.04.01.08.01.12.01h2.87c.03 0 .07 0 .1-.01l.41 1.12c.18.48.7.73 1.18.55c.47-.17.71-.7.54-1.18Zm-4.54-2.32l.87-2.38l.86 2.38h-1.73Zm-3.56-2.73c0 .53-.15 1.02-.41 1.43a2.7 2.7 0 0 1 1.07 2.15c0 1.38-1.05 2.54-2.4 2.69c-.04.01-.09.02-.13.01c-.06.01-.12.01-.18.01H2.92a.92.92 0 0 1-.92-.93v-7.16c0-.5.41-.91.92-.91h2.6c.1 0 .19 0 .27.01a7.905 7.905 0 0 0 .19.03c1.28.22 2.25 1.34 2.25 2.67Zm-2.7-.87H3.84v1.74h1.68c.48 0 .88-.39.88-.87a.87.87 0 0 0-.87-.87Zm-1.69 3.57v1.74h2.35a.87.87 0 0 0 0-1.74H3.84Zm18.76 1.94a3.308 3.308 0 0 1-6.17-1.66v-2.38c0-1.83 1.48-3.31 3.31-3.31c1.18 0 2.28.64 2.87 1.65c.26.44.1 1-.33 1.26c-.44.26-1 .11-1.26-.33a1.5 1.5 0 0 0-1.28-.74c-.8 0-1.47.66-1.47 1.47v2.38c0 .81.67 1.47 1.47 1.47c.53 0 1.01-.28 1.28-.74c.26-.43.81-.59 1.26-.33c.42.26.58.82.32 1.26Zm4.63-3.48l2.6 3.68c.29.42.2.99-.23 1.29c-.42.29-.99.19-1.28-.22l-2.41-3.42l-.69.69v2.2c0 .51-.41.92-.92.92s-.92-.41-.92-.92v-7.17c0-.51.41-.92.92-.92s.92.41.92.92v2.37l3.01-3.02c.36-.36.94-.36 1.3 0c.36.36.36.94 0 1.3l-2.3 2.3Z"
                                /></svg
                            >
                        </a>
                    </div>
                </Modal>
            </div>
        {/if}
        <!-- Add event modal below -->
        {#if addSeat}
            <div transition:fade>
                <Modal
                    bodyClass="p-2"
                    color="dark"
                    title="ADD SEAT"
                    bind:open={addSeat}
                    size="sm"
                    outsideclose
                    autoclose
                    class="bg-gray-700 text-white"
                >
                    <form class="text-left">
                        <div class=" grid grid-cols-2 gap-2">
                            <div class="mb-3">
                                <label
                                    for="eventName"
                                    class="block mb-2 text-sm font-medium text-white"
                                    >Select An Event</label
                                >
                                <select
                                    id="eventName"
                                    class=" text-center border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option selected>Choose an event</option>
                                    <option value="US">United States</option>
                                    <option value="CA">Canada</option>
                                    <option value="FR">France</option>
                                    <option value="DE">Germany</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label
                                    for="seatArea"
                                    class="block mb-2 text-sm font-medium"
                                    >Seat Area</label
                                >
                                <input
                                    type="text"
                                    id="seatArea"
                                    class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="e.g VIP/Normal/First Class"
                                    required
                                />
                            </div>
                        </div>
                        <div class=" grid grid-cols-2 gap-2">
                            <div class="mb-3">
                                <label
                                    for="maxSeat"
                                    class="block mb-2 text-sm font-medium text-white"
                                    >Max Seat</label
                                >
                                <input
                                    type="number"
                                    min="1"
                                    id="maxSeat"
                                    placeholder="Total Guests"
                                    class=" border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-300 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div class="mb-3">
                                <label
                                    for="ticketPrice"
                                    class="block mb-2 text-sm font-medium"
                                    >Ticket Price</label
                                >
                                <input
                                    type="number"
                                    id="ticketPrice"
                                    min="0"
                                    class="text-white bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 placeholder-gray-500 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                    placeholder="Enter '0' if not for sale"
                                    required
                                />
                            </div>
                        </div>

                        <!-- create event button below -->
                        <a
                            href=""
                            bind:this={createEventBtnstyle}
                            on:click|preventDefault|once={() => {
                                show = true;
                                createEventBtn.innerText =
                                    "Adding Please Wait.....";
                            }}
                            class="text-center"
                            ><div
                                class="flex flex-row text-white bg-yellow-400 hover:bg-yellow-500 hover:text-white focus:ring-4 focus:outline-none focus:ring-yellow-700 font-medium rounded-lg px-5 text-sm py-2.5 justify-center"
                            >
                                {#if show}
                                    <svg
                                        aria-hidden="true"
                                        role="status"
                                        class="inline w-4 h-4 mr-3 text-white animate-spin"
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
                                {/if}

                                <span bind:this={createEventBtn}>Add Seat</span>
                            </div>
                        </a>
                    </form>

                    <!-- back button on the add Seat modal below -->
                    <div
                        class="  font-bold rounded-lg text-xs uppercase bg-white text-gray-800 justify-between items-center flex p-2"
                    >
                        <span class="hidden md:block"
                            >Customer satisfaction is our GOAL!</span
                        >
                        <span class="md:hidden">Keep Smiling !</span>
                        <a
                            on:click|preventDefault|stopPropagation={() => {
                                addSeat = false;
                                let time = setTimeout(() => {
                                    seat = true;
                                    clearTimeout(time);
                                }, 1000);
                            }}
                            href=""
                            class="text-white hover:text-gray-50 p-2 hover:bg-gray-800 bg-gray-700 rounded-2xl flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="40"
                                height="24"
                                viewBox="0 0 32 32"
                                ><path
                                    fill="currentColor"
                                    d="m2.36 11.23l8.31 7.57c.61.56 1.6.12 1.6-.71v-3.63c0-.35.29-.64.64-.64h15.86c.66 0 1.19-.53 1.19-1.19V8.42c0-.66-.53-1.19-1.19-1.19H12.91c-.35 0-.64-.29-.64-.64V2.96c0-.83-.99-1.27-1.6-.71L2.36 9.82a.946.946 0 0 0 0 1.41Zm13.97 17.53l-2.54-6.95c-.16-.49-.62-.81-1.13-.81c-.51 0-.97.32-1.12.79l-2.57 6.98c-.18.48.07 1 .55 1.18c.1.03.21.05.32.05c.37 0 .73-.23.86-.6l.41-1.13c.04.01.08.01.12.01h2.87c.03 0 .07 0 .1-.01l.41 1.12c.18.48.7.73 1.18.55c.47-.17.71-.7.54-1.18Zm-4.54-2.32l.87-2.38l.86 2.38h-1.73Zm-3.56-2.73c0 .53-.15 1.02-.41 1.43a2.7 2.7 0 0 1 1.07 2.15c0 1.38-1.05 2.54-2.4 2.69c-.04.01-.09.02-.13.01c-.06.01-.12.01-.18.01H2.92a.92.92 0 0 1-.92-.93v-7.16c0-.5.41-.91.92-.91h2.6c.1 0 .19 0 .27.01a7.905 7.905 0 0 0 .19.03c1.28.22 2.25 1.34 2.25 2.67Zm-2.7-.87H3.84v1.74h1.68c.48 0 .88-.39.88-.87a.87.87 0 0 0-.87-.87Zm-1.69 3.57v1.74h2.35a.87.87 0 0 0 0-1.74H3.84Zm18.76 1.94a3.308 3.308 0 0 1-6.17-1.66v-2.38c0-1.83 1.48-3.31 3.31-3.31c1.18 0 2.28.64 2.87 1.65c.26.44.1 1-.33 1.26c-.44.26-1 .11-1.26-.33a1.5 1.5 0 0 0-1.28-.74c-.8 0-1.47.66-1.47 1.47v2.38c0 .81.67 1.47 1.47 1.47c.53 0 1.01-.28 1.28-.74c.26-.43.81-.59 1.26-.33c.42.26.58.82.32 1.26Zm4.63-3.48l2.6 3.68c.29.42.2.99-.23 1.29c-.42.29-.99.19-1.28-.22l-2.41-3.42l-.69.69v2.2c0 .51-.41.92-.92.92s-.92-.41-.92-.92v-7.17c0-.51.41-.92.92-.92s.92.41.92.92v2.37l3.01-3.02c.36-.36.94-.36 1.3 0c.36.36.36.94 0 1.3l-2.3 2.3Z"
                                /></svg
                            >
                        </a>
                    </div>
                </Modal>
            </div>
        {/if}
    </div>
</div>
