async function test() {
  const rPut = await fetch('http://127.0.0.1:3000/api/spotify/liked', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: 'Beggin__M_neskin' })
  });
  console.log('PUT:', rPut.status, await rPut.json());

  const rGet = await fetch('http://127.0.0.1:3000/api/spotify/liked?id=Beggin__M_neskin');
  console.log('GET after PUT:', rGet.status, await rGet.json());

  const rDel = await fetch('http://127.0.0.1:3000/api/spotify/liked?id=Beggin__M_neskin', {
    method: 'DELETE'
  });
  console.log('DELETE:', rDel.status, await rDel.json());

  const rGetAfterDel = await fetch('http://127.0.0.1:3000/api/spotify/liked?id=Beggin__M_neskin');
  console.log('GET after DELETE:', rGetAfterDel.status, await rGetAfterDel.json());
}
test();
