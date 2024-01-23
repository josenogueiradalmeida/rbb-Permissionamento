const AccountRules = artifacts.require('AccountRules.sol');
const ContractRules = artifacts.require('ContractRules.sol');
const AccountIngress = artifacts.require('AccountIngress.sol');
const Admin = artifacts.require('Admin.sol');

const ADMIN='0x61646d696e697374726174696f6e000000000000000000000000000000000000';
//var target = "0xdE3422671D38EcdD7A75702Db7f54d4b30C022Ea".toLowerCase();

contract('Contract Rules', (accounts) => {
  let ingressContract;
  let accountRulesContract;
  let contractRules;
  const [admin, contractAdmin, target, permissionedAccount, anonymous] = accounts;

  beforeEach(async () => {
        
    adminContract          = await Admin.new();
    accountIngressContract = await AccountIngress.new();
    await accountIngressContract.setContractAddress(ADMIN, adminContract.address);
    contractRules          = await ContractRules.new();
    accountRulesContract   = await AccountRules.new(accountIngressContract.address, contractRules.address);
    await contractRules.setAccountRules(accountRulesContract.address, { from: admin });

    //Set permissioned Accounts
    await accountRulesContract.addAccount(admin);
    await accountRulesContract.addAccount(contractAdmin);
    await accountRulesContract.addAccount(permissionedAccount);

    // Set the contractAdmin as admin of target
    await contractRules.addContractAdmin(target, contractAdmin, { from: admin });
  });

  it('should allow transaction when contractAdmin is permitted and target is permitted', async () => {
    const result = await accountRulesContract.transactionAllowed(contractAdmin, target, 0, 0, 0, '0x');
    assert.equal(result, true);
  });

  it('should allow transaction when target contract is not permitted when permission`s admin ', async () => {
    // Block target
    await contractRules.blockContract(target, { from: admin });

    const result = await accountRulesContract.transactionAllowed(admin, target, 0, 0, 0, '0x');
    assert.equal(result, true);
  });

  it('should allow transaction when target contract is not permitted when contract`s admin ', async () => {
    // Block target
    await contractRules.blockContract(target, { from: admin });

    const result = await accountRulesContract.transactionAllowed(contractAdmin, target, 0, 0, 0, '0x');
    assert.equal(result, true);
  });  

  it('should not allow transaction when target contract is not permitted', async () => {
    // Block target
    await contractRules.blockContract(target, { from: admin });

    const result = await accountRulesContract.transactionAllowed(anonymous, target, 0, 0, 0, '0x');
    assert.equal(result, false);
  });


});