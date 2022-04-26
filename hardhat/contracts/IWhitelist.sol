// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IWhitelist {
    //saving gas by not having to inherit and deploy entire contract
    function whitelistedAddresses(address) external view returns (bool);
}
