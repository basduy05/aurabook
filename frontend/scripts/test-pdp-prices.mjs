const res = await fetch('http://localhost:3000/vi/channel-vnd/products/apple-juice');
const html = await res.text();

const matches = html.match(/>([^<]*[\$₫][^<]*)</g);
console.log('VI/VND Matches:', matches);

const resEn = await fetch('http://localhost:3000/en/default-channel/products/apple-juice');
const htmlEn = await resEn.text();
const matchesEn = htmlEn.match(/>([^<]*[\$₫][^<]*)</g);
console.log('EN/USD Matches:', matchesEn);

const resViUsd = await fetch('http://localhost:3000/vi/default-channel/products/apple-juice');
const htmlViUsd = await resViUsd.text();
const matchesViUsd = htmlViUsd.match(/>([^<]*[\$₫][^<]*)</g);
console.log('VI/USD Matches:', matchesViUsd);
