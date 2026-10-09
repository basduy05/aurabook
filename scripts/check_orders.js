async function test() {
  const loginRes = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'mutation { tokenCreate(email: "admin@example.com", password: "admin") { token } }'
    })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.tokenCreate?.token;

  const oRes = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({
      query: `query {
        orders(first: 20) {
          totalCount
          edges {
            node {
              id
              number
              status
              chargeStatus
              paymentStatus
              channel {
                slug
              }
              total {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }`
    })
  });
  console.log('Orders query result:', JSON.stringify(await oRes.json(), null, 2));
}

test().catch(console.error);
