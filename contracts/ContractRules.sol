pragma solidity 0.5.9;

import "./AccountRules.sol";
import "@openzeppelin/contracts/utils/Arrays.sol";

contract ContractRules{

    mapping(address => bool) private contractBlocked;
    mapping(address => address[]) private contractAdmins;    
    AccountRules accountRules;

    // Declare events
    event ContractAdminAdded(address indexed _contract, address indexed _admin);
    event ContractAdminListAdded(address indexed _contract, address[] _adminList);
    event ContractAdminRemoved(address indexed _contract, address indexed _admin);
    event ContractBlocked(address indexed _contract);
    event ContractUnblocked(address indexed _contract);    
    event ContractRulesRemoved(address indexed _contract);

    constructor (AccountRules _accountRules) public {        
        accountRules = _accountRules;
    }

    function isContractAdmin(address _smartContract, address _admin) public view returns (bool) {
        address[] memory adminList = contractAdmins(_smartContract);
        for (uint256 i = 0; i < adminList.length; i++) {
            if (adminList[i] == _admin) {
                return true;
            }
        }  
    }

    function isContractBlocked(address _contract) public view returns (bool) {
        return contractBlocked[_contract];
    }   

    function addBlock(address _contractToBlock) public {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToBlock, msg.sender),
                "Only account admin or contract admin can block a contract");
        contractBlocked[_contractToBlock] = true;       
        emit ContractBlocked(_contractToBlock);
    }    

    function removeBlock(address _contractToUnblock) public {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToUnblock, msg.sender),
                "Only account admin or contract admin can unblock a contract");        
        contractBlocked[_contractToUnblock] = false;
        emit ContractUnblocked(_contractToUnblock);
    }
 
    function addAdmin(address _newAdmin, address _contractToAdmin) public {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can add admin to a contract");        
        contractAdmins[_contractToAdmin].push(_newAdmin);
        emit ContractAdminAdded(_contractToAdmin, _newAdmin);
    }

    function addAdminList(address[] _newAdminList, address _contractToAdmin) public {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can add adminList to a contract");        
        contractAdmins[_contractToAdmin].push(_newAdminList);
        emit ContractAdminListAdded(_contractToAdmin, _newAdminList);
    }

    function removeAdmin(address _oldAdmin, address _contractToAdmin) public {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can remove admin from a contract");                         
        ArrayUtils.remove(contractAdmins[_contractToAdmin], _oldAdmin);        
        emit ContractAdminRemoved(_contractToAdmin, _oldAdmin);
    } 

    function removeContractRules(address _contract) public  {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can remove the contract management");
        delete contractAdmins[_contract];
        delete contractBlocked[_contract];     
        emit ContractRulesRemoved(_contract);
    }

}    