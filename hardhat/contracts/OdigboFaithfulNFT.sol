// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract OdigboFaithfulNFT is ERC721Enumerable, Ownable {
    string _baseTokenURI;

    // _price is the price of one Odigbo NFT
    uint256 public _price = 0.01 ether;

    // _paused is used to pause the contract in case of an emergency
    bool public _paused;

    // max number of Odigbos
    uint256 public maxTokenIds = 20;

    // total number of tokenIds minted
    uint256 public tokenIds;

    // Whitelist contract instance
    IWhitelist whitelist;

    // boolean to keep track of whether presale staarted or not
    bool public presaleStarted;

    // timestamp for when the presale would end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    /** Constructor for Odigbo takes in the baseURI to set _baseTokenURI for the Collection
     *It also initializes an instance of whitelist interface.
     */
    constructor(string memory baseURI, address whitelistContract)
        ERC721("OdigboFaithfulNFT", "ODF")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;

        presaleEnded = block.timestamp + 5 minutes;
    }

    // @OdigboNFT presaleMint allows a user to mint one NFT per transactiion during presale
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum Odigbo NFT Supply");
        require(msg.value >= _price, "Ether sent is not current");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // allows a user to mint 1 NFT per transactiion after presale has ended
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum OdigboNFT supply");
        require(msg.value >= _price, "ETH sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    // @OdigboNFT _baseURI overrides the openzeppelin ERC721 implementation which by default returned an empty string for the baseURI

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    // @OdigboNFT setPaused makes the contract paused or unpaused
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    // @OdigboNFT sends all ether in the contract to the owner of contract
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // Function to receive Ether. msg.data must not be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
