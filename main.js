import { Actor } from 'apify';

await Actor.init();
const input = await Actor.getInput();

const category = input.category || 'Skirts';

const query = `query ProductsConnection($locales: [String!]!, $mainCategories: [String!]!, $genders: [Gender!], $ageGroups: [AgeGroup!], $marketId: Int, $first: Int!, $imageConfigurations: [ResponsiveImageConfiguration!]!, $includeProfile: Boolean!, $model: Boolean) {
  productsConnection(
    locales: $locales
    mainCategories: $mainCategories
    genders: $genders
    ageGroups: $ageGroups
    marketId: $marketId
    first: $first
    sort: LATEST
    withImage: true
    model: $model
  ) {
    edges {
      node {
        id
        name
        brand { name }
        prints { name }
        materials { name }
        pricesWithCurrencies {
          currency
          range { average }
        }
        images {
          urls { url }
        }
      }
    }
  }
}`;

const variables = {
  locales: ['en-US'],
  mainCategories: [category],
  genders: ['WOMEN'],
  ageGroups: ['ADULTS'],
  marketId: 1,
  first: 50,
  imageConfigurations: [{ width: 624, resize: 'FILL_DOWN' }],
  includeProfile: false,
  model: false,
};

const response = await Actor.fetch('https://api.fashionunited.com/graphql/', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    operationName: 'ProductsConnection',
    variables,
    query,
  }),
});

const json = await response.json();

const products = json.data.productsConnection.edges.map(edge => {
  const node = edge.node;
  return {
    name: node.name,
    brand: node.brand?.name,
    price: node.pricesWithCurrencies?.[0]?.range?.average,
    description: [
      ...(node.materials?.map(m => m.name) || []),
      ...(node.prints?.map(p => p.name) || []),
    ].join(', '),
    image: node.images?.[0]?.urls?.[0]?.url,
  };
});

await Actor.pushData(products);
await Actor.exit();
