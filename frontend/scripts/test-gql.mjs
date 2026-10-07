const query = `
query ProductDetails($slug: String!, $channel: String!, $languageCode: LanguageCodeEnum!) {
  product(slug: $slug, channel: $channel) {
    id
    name
    translation(languageCode: $languageCode) {
      name
    }
    variants {
      id
      name
      pricing {
        price {
          gross {
            amount
            currency
          }
        }
      }
    }
    pricing {
      priceRange {
        start {
          gross {
            amount
            currency
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
  body: JSON.stringify({
    query,
    variables: { slug: 'apple-juice', channel: 'channel-vnd', languageCode: 'VI' }
  })
});
const data = await res.json();
console.log('Result for channel-vnd:', JSON.stringify(data, null, 2));

const resUsd = await fetch('http://localhost:8000/graphql/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query,
    variables: { slug: 'apple-juice', channel: 'default-channel', languageCode: 'EN' }
  })
});
const dataUsd = await resUsd.json();
console.log('Result for default-channel:', JSON.stringify(dataUsd, null, 2));
