export async function whileXPGHasMoreAwaitEach (xpg, query, fn) {
  let yields = xpg(query);
  let len = yields.length;
  let i = 0;
  if (len === 0) return;
  do {
     for(; i < len; ++i) {
       await fn(yields[i]);
     }
    yields = xpg(query);
  } while (yields.length > 0);
}