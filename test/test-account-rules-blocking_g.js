const AdminContract = artifacts.require('Admin.sol');
const RulesContract = artifacts.require('AccountRules.sol');
const IngressContract = artifacts.require('Ingress.sol');
const ContractRules = artifacts.require('ContractRules.sol');
const Admin = artifacts.require('Admin.sol');
const Web3 = require('web3');
const web3 = new Web3();

// Contract keys
const RULES_NAME = "0x72756c6573000000000000000000000000000000000000000000000000000000";
const ADMIN_NAME = "0x61646d696e697374726174696f6e000000000000000000000000000000000000";

contract("Contract permissioning", accounts => {
    let rules, ingress;
    let contractAddr = web3.utils.randomHex(20);
    const [admin, contractAdmin1, contractAdmin2, target, permissionedAccount, anonymous] = accounts;

    beforeEach(async () => {
        ingress = await IngressContract.new();

        adminContract          = await Admin.new();
        await ingress.setContractAddress(ADMIN_NAME, adminContract.address);

        contractRules          = await ContractRules.new();
        rules   = await RulesContract.new(ingress.address, contractRules.address);
        await contractRules.setAccountRules(rules.address, { from: admin });

        contractAddr = target;//override

    });

    it("should return true from isBlocked if the account is blocked", async () => {
        await contractRules.blockContract(contractAddr, { from: accounts[0] });
        assert.equal(await contractRules.isBlocked(contractAddr), true);
    });

    it("should return false from isBlocked if the account is not blocked", async () => {
        assert.equal(await contractRules.isBlocked(contractAddr), false);
    });

    it("should return false when a target (contract) is unblocked after being blocked", async () => {
        await contractRules.blockContract(contractAddr, { from: accounts[0] });
        await contractRules.unblockContract(contractAddr, { from: accounts[0] });
        assert.equal(await contractRules.isBlocked(contractAddr), false);
    });

    it("should return false from isContractAdmin if the account is not an admin", async () => {
        assert.equal(await contractRules.isContractAdmin(contractAddr, permissionedAccount), false);
    });

    it("should return true from isContractAdmin if the account is an admin", async () => {
        await contractRules.blockContract(contractAddr, { from: accounts[0] });
        await contractRules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        assert.equal(await contractRules.isContractAdmin(contractAddr, contractAdmin1), true);
    });

    it("should return false from isContractAdmin if the account was removed from admin", async () => {
        // block contract
        await contractRules.blockContract(contractAddr, { from: accounts[0] });        
        await contractRules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        await contractRules.removeContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        assert.equal(await contractRules.isContractAdmin(contractAddr, contractAdmin1), false);
    });

    it("should not allow adding a contract admin if the contract is not blocked", async () => {
        try {
            await contractRules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
            assert.fail("It should have failed because the contract is not blocked");
        }
        catch (error) {
            assert.equal(error.reason, "Contract is not blocked");
        }
    });

    it('should allow transaction if target is not blocked', async () => {
        // It is a fresh call, so there is no previously blocked contract.
        // accounts[0] was permited in the constructor
        const result = await rules.transactionAllowed(accounts[0], contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(true);
    });

    it('should return false if target (contract) is blocked and sender is not an admin', async () => {
        // Block contract
        await contractRules.blockContract(contractAddr, { from: accounts[0] });
        // There was no admin added, so sender is not an admin.
        // accounts[0] is permited in the constructor
        const result = await rules.transactionAllowed(permissionedAccount, contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(false);
    });

    it('should return true if target (contract) is blocked but sender is an admin', async () => {
        // Block contract
        await contractRules.blockContract(contractAddr, { from: accounts[0] });
        // Sender needs to be permited
        await rules.addAccount(contractAdmin1, { from: accounts[0] });
        // Add admin
        await contractRules.addContractAdmin(contractAddr, contractAdmin1, { from: accounts[0] });
        // Sender is an admin.
        const result = await rules.transactionAllowed(contractAdmin1, contractAddr, 0, 0, 0, '0x');
        expect(result).to.equal(true);
    });

});