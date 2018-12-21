export function isDone(state) {
  return state.done;
}

export function doneOrWait (state) {
  return {
    done: state.done,
    wait: !!state.value
  };
}