export function advanceOnEnter(event, nextRef) {
  if (event.key !== "Enter" || !nextRef?.current) {
    return;
  }

  event.preventDefault();
  nextRef.current.focus();
}
