async function main() {
  const queryProd = `
    query GetProduct {
      product(id: "UHJvZHVjdDoxNDc=", channel: "channel-vnd") {
        id
        name
        slug
        thumbnail { url alt }
        category { name slug }
        productType { name slug isShippingRequired }
      }
    }
  `;
  const resProd = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: queryProd }),
  });
  const prodData = await resProd.json();
  console.log("Product 147:", JSON.stringify(prodData, null, 2));
}
main().catch(console.error);
