// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract PlayerTraderNFT is ERC721Enumerable, Ownable {
    /**
    _baseTokenURI for computing {tokenURI}. If set, the resulting URI
    for each token will be concat. of 'baseURI' and 'tokenID'
     */

    string _baseTokenURI;

    //_price is the price of each NFT
    uint256 public _price = .01 ether;

    //pause the contract in case of emergency
    bool public _paused;

    uint256 public maxTokenIds = 20;

    //max number of tokenIds minted
    uint256 public tokenIds;

    //WhiteList contract instance
    IWhitelist whitelist;

    bool public presaleStarted;
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
    @dev ERC721 constructor takes in 'name' and 'symbol'
    PlayerTraderNFT constructor take sin baseURI to set _baseTokenURI for collection
    and initializes an instance of whitelist interface
    */

    constructor(string memory baseURI, address whiteListContract)
        ERC721("PlayerTraderNFT", "PT")
    {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whiteListContract);
    }

    //starts a presale for whitelisted addresses

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You aren't whitelisted"
        );
        require(tokenIds < maxTokenIds, "No more NFTs available");
        require(msg.value >= _price, "Not enough ether sent");

        tokenIds += 1;

        //_safeMint ensures if address being minted to is contract,
        //it knows how to deal w ERC721 tokens.
        //If address not a contract, works the same way as _mint

        _safeMint(msg.sender, tokenIds);
    }

    //mint after presale ends
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale still ongoing"
        );
        require(tokenIds < maxTokenIds, "No more NFTs available");
        require(msg.value >= _price, "Not enough ether sent");

        tokenIds += 1;

        _safeMint(msg.sender, tokenIds);
    }

    //_baseURI overrides the OZ ERC721 implementation which by default
    //returned an empty string
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    //pause or unpause the contract
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    //withdraw sends all the ether in the contract to owner

    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;

        /**

        Owner.call returns two values, we only want the first

        Empty string at end is there bc with call method,
        you can call an outside function. Here, call is only
        used to send ether to owner.
        */

        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ether");
    }

    //Function to receive ether, msg.data must be empty
    receive() external payable {}

    //Fallback function called when msg.data not empty
    fallback() external payable {}
}
