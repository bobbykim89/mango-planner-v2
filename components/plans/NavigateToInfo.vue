<template>
  <div
    class="text-center bg-light-3 dark:bg-dark-3 rounded-md drop-shadow-md px-sm md:px-md py-md"
  >
    <div class="text-warning mb-sm">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        fill="currentColor"
        class="w-md mx-auto"
      >
        <!--! Font Awesome Pro 6.2.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2022 Fonticons, Inc. -->
        <path
          d="M256 512c141.4 0 256-114.6 256-256S397.4 0 256 0S0 114.6 0 256S114.6 512 256 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-144c-17.7 0-32-14.3-32-32s14.3-32 32-32s32 14.3 32 32s-14.3 32-32 32z"
        />
      </svg>
    </div>
    <div class="mb-sm text-lg text-dark-3 dark:text-light-3">
      <p>
        There is no plans made yet, please click on below button to learn more
        information.
      </p>
    </div>
    <NuxtLink to="/info" class="btn btn-warning">Go to Info page</NuxtLink>
  </div>
</template>
