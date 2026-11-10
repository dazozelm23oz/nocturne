async function test() {
  const r = await fetch('http://127.0.0.1:3000/api/spotify/playback', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ play: true })
  });
  console.log('PLAY response:', r.status, await r.json());

  const rNext = await fetch('http://127.0.0.1:3000/api/spotify/playback', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ next: true })
  });
  console.log('NEXT response:', rNext.status, await rNext.json());
}
test();
