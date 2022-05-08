export default function handler(req, res) {
  // get the tokenId from the query params
  const tokenId = req.query.tokenId;

  // Extract images from github directly
  const image_url = "https://raw.githubusercontent.com/dev3Nigerian/NFT-Collection/main/odigbonft-app/public/OdigboNFT/"

  res.status(200).json({
    name: "OdigboNFT #" + tokenId,
    description: "OdigboNFT is a collection for friends of Odigbo",
    image: image_url + tokenId + ".jpg",
  });

}