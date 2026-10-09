async function test() {
  const query = `query StorefrontContentPages($channel: String!, $slugs: [String!]!, $languageCode: LanguageCodeEnum!) {
    pages(channel: $channel, where: { slug: { oneOf: $slugs } }, first: 20) {
      edges {
        node {
          id
          title
          slug
          isPublished
          pageType {
            slug
          }
          assignedAttributes {
            attribute {
              slug
            }
            ... on AssignedPlainTextAttribute {
              plainText: value
              plainTextTranslation: translation(languageCode: $languageCode)
            }
            ... on AssignedBooleanAttribute {
              boolean: value
            }
            ... on AssignedNumericAttribute {
              numeric: value
            }
          }
        }
      }
    }
  }`;

  const res = await fetch('http://localhost:8000/graphql/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        channel: 'channel-vnd',
        slugs: [
          'storefront-policy', 'storefront-policy-channel-vnd',
          'storefront-chrome', 'storefront-chrome-channel-vnd',
          'storefront-homepage', 'storefront-homepage-channel-vnd',
          'storefront-products', 'storefront-products-channel-vnd',
          'storefront-cart', 'storefront-cart-channel-vnd',
          'storefront-checkout', 'storefront-checkout-channel-vnd',
        ],
        languageCode: 'VI'
      }
    })
  });
  const data = await res.json();
  console.log('Result edges count:', data.data?.pages?.edges?.length);
  for (const edge of data.data?.pages?.edges || []) {
    console.log(`- [${edge.node.pageType.slug}] ${edge.node.slug}: ${edge.node.title} (attrs: ${edge.node.assignedAttributes.length})`);
  }
}

test().catch(console.error);
