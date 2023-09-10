<div class=" mx-2 hover:text-yellow-200">
    <div class="bg-gray-800 p-2 rounded">
        <div class=" grid md:grid-cols-2 sm:grid-col-1 gap-x-2 text-start">
            <div
                class=" border border-t-0 border-r-0 border-b-0 border-yellow-400 text-base capitalize font-bold p-2"
            >
                <!-- left column  -->

                <div class="flex flex-row items-center gap-3 justify-between">
                    <div class="flex flex-row gap-3 justify-start items-center">
                        <a
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
                                    d="M6.747 4h3.464a.75.75 0 0 1 .102 1.493l-.102.007H6.747a2.25 2.25 0 0 0-2.245 2.095l-.005.155v9.5a2.25 2.25 0 0 0 2.096 2.244l.154.006h9.5a2.25 2.25 0 0 0 2.246-2.096l.005-.154v-.498a.75.75 0 0 1 1.493-.102l.007.102v.498a3.75 3.75 0 0 1-3.551 3.744l-.2.006h-9.5a3.75 3.75 0 0 1-3.745-3.551l-.005-.2v-9.5a3.75 3.75 0 0 1 3.55-3.744l.2-.005h3.464h-3.464Zm7.754 2.544V3.75a.75.75 0 0 1 1.187-.61l.082.068l5.995 5.75c.28.269.305.7.076.998l-.076.085l-5.995 5.752a.75.75 0 0 1-1.262-.435l-.007-.107V12.45l-.32-.007c-2.658-.008-4.93 1.084-6.866 3.302c-.495.567-1.425.131-1.305-.613c.827-5.14 3.599-8.044 8.19-8.558l.301-.03V3.75v2.794Z"
                                /></svg
                            >
                            <slot name="svgName">
                                <span class="">Share</span>
                            </slot>
                        </a>
                        <div class="grid grid-row-3 gap-3">
                            <div class="text-xl">
                                Event : <span
                                    class="text-yellow-400 text-base"
                                    ><slot name="eventName"
                                        >Testing @
                                    </slot></span
                                >
                            </div>
                            <div
                                class="text-gray-500 text-xs flex flex-row gap-1 items-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 64 64"
                                    ><path
                                        fill="currentColor"
                                        d="m48.596 33.421l-16.702-2.748l2.396-1.706l4.011.555l4.006-.555zM38.301 1.858a6.062 6.062 0 0 1 6.062 6.064c0 3.35-2.135 6.064-6.062 6.064a6.065 6.065 0 1 1 0-12.128zm1.509 43.826v14.655a3.31 3.31 0 0 0 6.622 0V45.684a3.312 3.312 0 0 0-6.622 0zm20.282 8.367a1.923 1.923 0 0 1-1.919 1.922H48.021v-9.596h4.391v-9.59c0-1.056.861-1.918 1.918-1.918h3.843c1.056 0 1.919.861 1.919 1.918v17.264zm-21.866 1.921H18.517a1.92 1.92 0 0 1-1.92-1.922V36.786a1.92 1.92 0 0 1 1.92-1.918h3.841c1.059 0 1.92.861 1.92 1.918v9.59h13.948v9.596zM27.848 35.267a3.313 3.313 0 0 0 2.728 3.806l14.459 2.383a3.314 3.314 0 0 0 3.804-2.73a3.307 3.307 0 0 0-2.728-3.803l-14.459-2.385a3.314 3.314 0 0 0-3.804 2.729zm-16.307-18.15c-4.718 0-8.555-3.837-8.555-8.558S6.823 0 11.541 0s8.56 3.839 8.56 8.559c0 4.721-3.842 8.558-8.56 8.558zm0-2.118a6.45 6.45 0 0 0 6.442-6.441c0-3.549-2.893-6.441-6.442-6.441c-3.552 0-6.438 2.892-6.438 6.441a6.445 6.445 0 0 0 6.438 6.441z"
                                    /><path
                                        fill="currentColor"
                                        d="M11.585 9.689a.637.637 0 0 1-.615-.046a.641.641 0 0 1-.288-.444l-.009-4.974a.644.644 0 0 1 1.287 0v3.859l3.299-1.554a.642.642 0 0 1 .857.305a.645.645 0 0 1-.307.857l-4.224 1.996zm26.716 9.121l7.861-1.28v5.526l3.881 2.919c.373.376.222.804.134.925a.664.664 0 0 1-.927.134l-4.898-3.702a2.25 2.25 0 0 0-2.594 3.676l8.369 5.878c.389.274.942.461 1.493.461c.47 0 1.023-.195 1.435-.487c.878-.624 1.201-1.731.903-2.751l-3.108-9.184c-.83-2.282-2.923-4.968-6.067-4.968H31.818c-3.143 0-5.236 2.686-6.067 4.968l-3.108 9.184c-.299 1.02.026 2.128.904 2.751c.409.292.964.487 1.432.487c.554 0 1.108-.186 1.496-.461l8.369-5.878a2.25 2.25 0 0 0-2.594-3.676l-4.901 3.702a.663.663 0 0 1-.925-.134a.734.734 0 0 1 .132-.925s2.632-1.977 3.883-2.919V17.53l7.862 1.281z"
                                    /></svg
                                >
                                <span>
                                    Area : <span
                                        ><slot name="area">normal</slot></span
                                    ></span
                                >
                            </div>
                            <div
                                class="text-gray-500 text-xs flex flex-row gap-1 items-center"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="15"
                                    height="15"
                                    viewBox="0 0 512 512"
                                    ><path
                                        fill="currentColor"
                                        d="M448 183.8v-123A44.66 44.66 0 0 0 403.29 16H280.36a30.62 30.62 0 0 0-21.51 8.89L13.09 270.58a44.86 44.86 0 0 0 0 63.34l117 117a44.84 44.84 0 0 0 63.33 0l245.69-245.61A30.6 30.6 0 0 0 448 183.8ZM352 144a32 32 0 1 1 32-32a32 32 0 0 1-32 32Z"
                                    /><path
                                        fill="currentColor"
                                        d="M496 64a16 16 0 0 0-16 16v127.37L218.69 468.69a16 16 0 1 0 22.62 22.62l262-262A29.84 29.84 0 0 0 512 208V80a16 16 0 0 0-16-16Z"
                                    /></svg
                                >
                                <span>
                                    Cost : nle <span
                                        ><slot name="cost">0</slot></span
                                    ></span
                                >
                            </div>
                        </div>
                    </div>
                    <div class="text-gray-500 flex flex-row gap-1 items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 1792 1824"
                            ><path
                                fill="currentColor"
                                d="M1764 43q33 24 27 64l-256 1536q-5 29-32 45q-14 8-31 8q-11 0-24-5l-527-215l-298 327q-18 21-47 21q-14 0-23-4q-19-7-30-23.5t-11-36.5v-452L40 1115q-37-14-40-55q-3-39 32-59L1696 41q35-21 68 2zm-342 1499l221-1323l-1434 827l336 137l863-639l-478 797z"
                            /></svg
                        >
                        <span
                            >Last Sent : <span
                                ><slot name="lastSent">2000</slot></span
                            ></span
                        >
                    </div>
                </div>
            </div>
            <div
                class=" border border-t-0 border-r-0 border-b-0 border-yellow-400 text-base font-bold p-3"
            >
                <!-- Right column  -->
                <div
                    class="flex flex-row gap-5 text-gray-500 h-full items-center"
                >
                    <!-- /////////////////////////////////////////////////// -->
                    <div class="flex flex-row gap-1 items-center">
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
                        <span
                            >Total Seats : <span
                                ><slot name="totalSeat">0</slot></span
                            ></span
                        >
                    </div>
                    <!-- /////////////////////////////////////////////////////// -->
                    <div class="flex flex-row gap-1 items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            ><path
                                fill="none"
                                stroke="currentColor"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                stroke-width="2"
                                d="m2 12l5.25 5l2.625-3M8 12l5.25 5L22 7m-6 0l-3.5 4"
                            /></svg
                        >
                        <span
                            >Total Verified : <span
                                ><slot name="verified">0</slot></span
                            ></span
                        >
                    </div>
                    <!-- ///////////////////////////////////// -->
                    <div class="flex flex-row gap-1 items-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 256 256"
                            ><path
                                fill="currentColor"
                                d="m213.66 66.34l-40-40A8 8 0 0 0 168 24H88a16 16 0 0 0-16 16v16H56a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h112a16 16 0 0 0 16-16v-16h16a16 16 0 0 0 16-16V72a8 8 0 0 0-2.34-5.66ZM136 192H88a8 8 0 0 1 0-16h48a8 8 0 0 1 0 16Zm0-32H88a8 8 0 0 1 0-16h48a8 8 0 0 1 0 16Zm64 24h-16v-80a8 8 0 0 0-2.34-5.66l-40-40A8 8 0 0 0 136 56H88V40h76.69L200 75.31Z"
                            /></svg
                        >
                        <span
                            >Total Remaining : <span
                                ><slot name="verified">0</slot></span
                            ></span
                        >
                    </div>
                </div>

                <!-- </div> -->
            </div>
        </div>
    </div>
</div>
