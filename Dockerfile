FROM apify/actor-node-playwright:latest

COPY . ./

CMD ["node", "main.js"]
