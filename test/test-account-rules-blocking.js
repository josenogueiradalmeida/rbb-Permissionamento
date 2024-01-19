const AccountRules = artifacts.require('AccountRules');
const ContractRules = artifacts.require('ContractRules');

contract('AccountRules', (accounts) => {
  let accountRules;
  let contractRules;
  const [admin, sender, target] = accounts;

  beforeEach(async () => {
    accountRules = await AccountRules.new();
    contractRules = await ContractRules.new(accountRules.address);

    // Set the sender and target as admins
    await contractRules.addAdmin(sender, { from: admin });
    await contractRules.addAdmin(target, { from: admin });
  });

  it('should allow transaction when sender is permitted and target is permitted', async () => {
    const result = await accountRules.transactionAllowed(sender, target, 0, 0, 0, '0x');
    assert.equal(result, true);
  });

  it('should not allow transaction when sender is not permitted', async () => {
    // Remove sender from admins
    await contractRules.removeAdmin(sender, { from: admin });

    const result = await accountRules.transactionAllowed(sender, target, 0, 0, 0, '0x');
    assert.equal(result, false);
  });

  it('should not allow transaction when target is not permitted', async () => {
    // Remove target from admins
    await contractRules.removeAdmin(target, { from: admin });

    const result = await accountRules.transactionAllowed(sender, target, 0, 0, 0, '0x');
    assert.equal(result, false);
  });
});