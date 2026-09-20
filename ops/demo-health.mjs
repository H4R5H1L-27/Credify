const base = process.env.CREDIFY_API ?? 'http://localhost:4100';
for (const path of ['/health', '/api/v1/demo/principals', '/api/v1/evaluator/contracts', '/api/v1/loans']) {
  const response = await fetch(base + path);
  const body = await response.text();
  console.log(`${response.status} ${path}`);
  console.log(body.slice(0, 1200));
}
