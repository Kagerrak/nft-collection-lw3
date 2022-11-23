// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

// Base URI + TokenID
// Base URI = https: //example.com/
// tokenID = 1

// tokenURI => https:://example.com/1

export default function handler(req, res) {
  const tokenId = req.query.tokenId;
  const image_url =
    "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

  const name = `Crypto Dev #${tokenId}`;
  const description = "CryptoDevs is an NFT collection for Web3 Developers.";
  const image = `${image_url}${Number(tokenId) - 1}.svg`;

  return res.json({
    name: name,
    description: description,
    image: image,
  });
}
