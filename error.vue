<template>
  <NuxtLayout name="default">
    <section class="min-h-[75vh] flex items-center">
      <div
        class="mx-auto text-center py-md px-xl bg-light-3 dark:bg-dark-3 rounded-md drop-shadow-md text-dark-3 dark:text-light-3"
      >
        <h1 class="text-[4rem] mb-sm font-bold">404</h1>
        <p class="text-[1.5rem] mb-xs">This page doesn't exist</p>
        <NuxtLink
          to="/"
          class="btn btn-dark-3 dark:btn-light-3 text-light-3 dark:text-dark-3"
          >Back to main page</NuxtLink
        >
      </div>
    </section>
  </NuxtLayout>
</template>
