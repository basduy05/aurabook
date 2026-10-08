async function main() {
  const query = `
    query {
      me {
        id
        email
        orders(first: 50) {
          edges {
            node {
              id
              number
              status
              paymentStatus
              created
              lines {
                id
                isShippingRequired
                productName
                variantName
                thumbnail {
                  url
                  alt
                }
                variant {
                  id
                  name
                  product {
                    id
                    name
                    slug
                    thumbnail {
                      url
                      alt
                    }
                    category {
                      id
                      name
                      slug
                    }
                    productType {
                      id
                      name
                      slug
                      isShippingRequired
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  console.log("Result:", JSON.stringify(data, null, 2));
}
main().catch(console.error);
