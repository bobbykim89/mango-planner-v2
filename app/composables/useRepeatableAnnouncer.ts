const NBSP = ' '

/**
 * Polite screen-reader announcements through Nuxt's announcer, also when a
 * message repeats the last one: identical text wouldn't change the live region,
 * so screen readers would stay silent (#40). A repeat toggles a trailing
 * no-break space, which changes the text without changing what is read.
 */
export const useRepeatableAnnouncer = () => {
  const announcer = useAnnouncer()
  return (message: string) => {
    announcer.polite(
      announcer.message.value === message ? message + NBSP : message,
    )
  }
}
