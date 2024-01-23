pragma solidity 0.5.9;

import "./AccountRules.sol";
import "./ContractRulesAdminProxy.sol";

contract ContractRules is ContractRulesAdminProxy {

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

    constructor () public {        
    }

    function setAccountRules(AccountRules _accountRules) public {
        accountRules = AccountRules(_accountRules);
    }

    function getAccountRules() public view returns (address) {
        return address(accountRules);
    }

    modifier isReady() {
        require (address(accountRules) != address(0), "AccountRules contract not set");
        _;
    }

    function isContractAdmin(address _smartContract, address _admin) public view returns (bool) {
        for (uint256 i = 0; i < contractAdmins[_smartContract].length; i++) {
            if (contractAdmins[_smartContract][i] == _admin) {
                return true;
            }
        }  
    }

    function isBlocked (address _contract) public view returns (bool) {
        return contractBlocked[_contract];
    }   

    function blockContract(address _contractToBlock) public isReady {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToBlock, msg.sender),
                "Only account admin or contract admin can block a contract");
        contractBlocked[_contractToBlock] = true;       
        emit ContractBlocked(_contractToBlock);
    }    

    function unblockContract(address _contractToUnblock) public isReady {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToUnblock, msg.sender),
                "Only account admin or contract admin can unblock a contract");        
        contractBlocked[_contractToUnblock] = false;
        emit ContractUnblocked(_contractToUnblock);
    }
 
    function addContractAdmin(address _contractToAdmin, address _newAdmin) public isReady {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can add admin to a contract");        
        require(isBlocked(_contractToAdmin), "Contract is not blocked");        
        contractAdmins[_contractToAdmin].push(_newAdmin);
        emit ContractAdminAdded(_contractToAdmin, _newAdmin);
    }

    function removeContractAdmin(address _contractToAdmin, address _oldAdmin) public isReady {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contractToAdmin, msg.sender),
                "Only account admin or contract admin can remove admin from a contract");                         
    
        for (uint256 i = 0; i < contractAdmins[_contractToAdmin].length; i++) {
            if (contractAdmins[_contractToAdmin][i] == _oldAdmin) {
                contractAdmins[_contractToAdmin][i] = address(0x0); 
            }
        }  
        emit ContractAdminRemoved(_contractToAdmin, _oldAdmin);
    } 

    function removeContractRules(address _contract) public isReady {
        require(accountRules.accountPermitted(msg.sender) 
                || isContractAdmin(_contract, msg.sender),
                "Only account admin or contract admin can remove the contract management");
        delete contractAdmins[_contract];
        delete contractBlocked[_contract];     
        emit ContractRulesRemoved(_contract);
    }

}    