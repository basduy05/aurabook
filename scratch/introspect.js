async function main() {
  const query = `
    query {
      productType: __type(name: "ProductType") { fields { name } }
      product: __type(name: "Product") { fields { name } }
      variant: __type(name: "ProductVariant") { fields { name } }
      orderLine: __type(name: "OrderLine") { fields { name } }
      order: __type(name: "Order") { fields { name } }
    }
  `;
  const res = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  console.log("Product fields:", data.data?.product?.fields?.map(f => f.name).join(', '));
  console.log("Variant fields:", data.data?.variant?.fields?.map(f => f.name).join(', '));
  console.log("OrderLine fields:", data.data?.orderLine?.fields?.map(f => f.name).join(', '));
  console.log("ProductType fields:", data.data?.productType?.fields?.map(f => f.name).join(', '));
}
main().catch(console.error);
