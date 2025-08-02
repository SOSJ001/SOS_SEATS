<script>
    let date
</script>

<div id="search" class="relative -mt-14 ">
    <div
        id="content"
        class="rounded mx-auto w-3/4 bg-gradient-to-br from-stone-900 via-gray-800 to-slate-700 p-8"
    >
        <form class="text-left">
            <div class="grid grid-cols-1 md:grid-cols-2 items-center">
                <div class="grid grid-cols-1 md:text-left text-center">
                    <span class="text-yellow-400 font-extrabold text-2xl title"
                        >WELCOME TO S.O.S SEATS</span
                    >
                    <span>WHAT ARE YOU LOOKING FOR</span>
                </div>
                <div class=" md:mt-0 mt-5">
                    <div
                        class="md:grid md:grid-cols-3 flex flex-row gap-8 md:gap-0 text-medium justify-center"
                    >
                        <span class="">
                            <span class="pl-1">Movie</span>
                        </span>
                        <span class="">
                            <span class="pl-1">Conferences</span>
                        </span>
                        <span class=" w-full">
                            <span class="pl-1">+ More Events</span>
                        </span>
                    </div>
            <hr class=" w-2/3 h-2 mx-auto my-3 bg-yellow-200 border-0 rounded">

                </div>
            </div>
            <div class="grid gap-2 mb-6 grid-cols-1 md:grid-cols-4 text-white">
                <div class=" md:col-span-1 ">
                    <label
                        for="first_name"
                        class="block mb-2 text-sm font-medium text-white"
                        >SEARCH NOW</label
                    >
                    <input
                        type="text"
                        id="first_name"
                        class="bg-gray-50 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        placeholder="Event Name"
                        required
                    />
                </div>
                <div class="md:col-span-3">
                    <div class="grid gap-2 grid-cols-1 md:grid-cols-3">
                        <div class="md:col-span-1">
                            <label
                                for="venue"
                                class="block mb-2 text-sm font-medium">Venue</label
                            >
                            <select
                                name="venue"
                                id="venue"
                                class="bg-gray-50 border border-gray-300 text-sm text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            >
                                <option value="">Select Venue</option>
                                <option value="venue1">Venue 1</option>
                                <option value="venue2">Venue 2</option>
                                <option value="venue3">Venue 3</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <div class="grid gap-2 grid-cols-2">
                                <div>
                                    <label for="date" class="block mb-2 text-sm font-medium"
                                        >Date</label
                                    >
                                    <input
                                    bind:this={date}
                                        type="date"
                                        id="date"
                                        class="bg-gray-700 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 text-black"
                                        required
                                    />
                                </div>
                                <div>
                                    <label for="city" class="block mb-2 text-sm font-medium"
                                        >City</label
                                    >
                                    <select
                                        name="city"
                                        id="city"
                                        class="bg-gray-50 border border-gray-300 text-sm text-black rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                                    >
                                        <option value="">Select City</option>
                                        <option value="venue1">City 1</option>
                                        <option value="venue2">City 2</option>
                                        <option value="venue3">City 3</option>
                                    </select>
                                </div>
        
                            </div>
                        </div>
                        
                    </div>
                </div>
                
            </div>
            <button
            on:click|preventDefault|stopPropagation={()=>{ }}
            id="button"
                type="submit"
                class="p-2 font-bold text-white bg-yellow-400 hover:bg-yellow-500 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-lg "
                >Search</button
            >
        </form>
    </div>
</div>

<style>
    @import url("https://fonts.googleapis.com/css2?family=Alkatra:wght@600&display=swap");
    .title {
        font-family: "Alkatra", cursive;
    }
    @media (max-width: 662px) {
        #content {
            width: 100%;
        }
    }
    #button{
         justify-self: center;
         width: 100%;
    }
</style>
