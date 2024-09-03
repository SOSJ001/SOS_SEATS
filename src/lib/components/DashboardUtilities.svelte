<div class=" mx-2 pt-2 w-full">
  <div class="bg-gray-800 p-2 rounded">
    <div class=" grid md:grid-cols-3 gap-x-2 text-start">
      <!-- left column  -->
      <div
        class=" border border-t-0 border-r-0 border-b-0 border-yellow-400 text-xl font-bold p-3"
      >
        <button
          class="text-white hover:text-yellow-400 text-center focus:text-yellow-300"
        >
          <div class="flex flex-row items-center gap-5">
            <!-- slot here -->
            <slot name="addEvent">
              <button
                class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
              >
                <div class="px-3 py-4 text-5xl">➕</div>
              </button>
            </slot>

            <span>
              <slot name="topLabel1">CREATE</slot> <br />
              <slot name="buttomLabel1">EVENT</slot>
            </span>
          </div>
        </button>
      </div>
      <!-- middle column -->
      <div
        class=" border border-t-0 border-r-0 border-b-0 border-yellow-400 text-xl font-bold p-3"
      >
        <!-- left column  -->
        <button
          class="text-white hover:text-yellow-400 text-center focus:text-yellow-300"
        >
          <div class="flex flex-row items-center gap-5">
            <slot name="button">
              <a
                href="/dashboard"
                class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
              >
                <slot name="svg1">
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
                </slot>
                <slot name="svgName">
                  <span class="">Scan</span>
                </slot>
              </a>
            </slot>

            <span>
              <slot name="topLabel">SCAN</slot> <br />
              <slot name="buttomLabel">INVITES</slot>
            </span>
            <slot name="svg2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="35"
                height="35"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M4 4h6v6H4V4m16 0v6h-6V4h6m-6 11h2v-2h-2v-2h2v2h2v-2h2v2h-2v2h2v3h-2v2h-2v-2h-3v2h-2v-4h3v-1m2 0v3h2v-3h-2M4 20v-6h6v6H4M6 6v2h2V6H6m10 0v2h2V6h-2M6 16v2h2v-2H6m-2-5h2v2H4v-2m5 0h4v4h-2v-2H9v-2m2-5h2v4h-2V6M2 2v4H0V2a2 2 0 0 1 2-2h4v2H2m20-2a2 2 0 0 1 2 2v4h-2V2h-4V0h4M2 18v4h4v2H2a2 2 0 0 1-2-2v-4h2m20 4v-4h2v4a2 2 0 0 1-2 2h-4v-2h4Z"
                /></svg
              >
            </slot>
          </div>
        </button>
      </div>
      <!-- right column  -->
      <div
        class=" border border-t-0 border-r-0 border-b-0 border-yellow-400 text-xl font-bold p-3"
      >
        <!-- Right column  -->
        <button
          class="text-white hover:text-yellow-400 text-center focus:text-yellow-300"
        >
          <div class="flex flex-row items-center gap-5">
            <!-- slot here -->
            <slot name="button2">
              <a
                href="/dashboard"
                class=" text-white text-sm hover:text-yellow-400 text-center bg-gray-700 rounded hover:bg-white focus:text-yellow-400 focus:bg-white"
              >
                <slot name="svg3">
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
                </slot>
                <slot name="svgName2">
                  <span class="">Scan</span>
                </slot>
              </a>
            </slot>
            <span>
              <slot name="topLabel2">SCAN</slot> <br />
              <slot name="buttomLabel2">INVITES</slot>
            </span>
            <slot name="svg4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="35"
                height="35"
                viewBox="0 0 24 24"
                ><path
                  fill="currentColor"
                  d="M4 4h6v6H4V4m16 0v6h-6V4h6m-6 11h2v-2h-2v-2h2v2h2v-2h2v2h-2v2h2v3h-2v2h-2v-2h-3v2h-2v-4h3v-1m2 0v3h2v-3h-2M4 20v-6h6v6H4M6 6v2h2V6H6m10 0v2h2V6h-2M6 16v2h2v-2H6m-2-5h2v2H4v-2m5 0h4v4h-2v-2H9v-2m2-5h2v4h-2V6M2 2v4H0V2a2 2 0 0 1 2-2h4v2H2m20-2a2 2 0 0 1 2 2v4h-2V2h-4V0h4M2 18v4h4v2H2a2 2 0 0 1-2-2v-4h2m20 4v-4h2v4a2 2 0 0 1-2 2h-4v-2h4Z"
                /></svg
              >
            </slot>
          </div>
        </button>
      </div>
    </div>
  </div>
</div>
