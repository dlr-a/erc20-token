const { assert, expect } = require("chai");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Token Staging Test", () => {
      let token;
      let owner;
      let account;
      const amount = ethers.parseEther("0.0000000000000001");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const [account1, account2] = await ethers.getSigners();
        owner = account1;
        account = account2;

        const Token = await ethers.getContractFactory("Token");
        token = Token.attach("0x6bC61842C5B45cde649A1a3761E79E80488E5b52");
      });

      it("Staging Test", async () => {
        //PAUSE
        const paused = await token.pause();
        await paused.wait();
        expect(await token.paused()).to.be.true;

        //UNPAUSE
        const unpaused = await token.unpause();
        await unpaused.wait();
        expect(await token.paused()).to.be.false;

        //MINT
        const beforeTotalSupply = await token.totalSupply();
        const mint = await token.mint(owner.address, amount);
        await mint.wait();
        const afterTotalSupply = await token.totalSupply();
        assert.equal(
          Number(beforeTotalSupply) + Number(amount),
          afterTotalSupply
        );

        //BURN
        const beforeTotalSupplyBurn = await token.totalSupply();
        const burn = await token.burn(amount);
        await burn.wait();
        const afterTotalSupplyBurn = await token.totalSupply();
        assert.equal(
          Number(beforeTotalSupplyBurn) - Number(amount),
          afterTotalSupplyBurn
        );

        //APPROVE
        const approve = await token.approve(account.address, amount);
        await approve.wait();
        const allowance = await token.allowance(owner.address, account.address);
        assert.equal(amount, allowance);

        //TRANSFER
        const beforeAccountBalance = await token.balanceOf(account.address);
        const beforeOwnerBalance = await token.balanceOf(owner.address);
        const transfer = await token.transfer(account.address, amount);
        await transfer.wait();
        const afterAccountBalance = await token.balanceOf(account.address);
        const afterOwnerBalance = await token.balanceOf(owner.address);
        assert.equal(
          Number(beforeAccountBalance) + Number(amount),
          Number(afterAccountBalance)
        );
        assert.equal(
          Number(beforeOwnerBalance) - Number(amount),
          Number(afterOwnerBalance)
        );

        //TRANSFERFROM
        const beforeAccountBalanceFrom = await token.balanceOf(account.address);
        const beforeOwnerBalanceFrom = await token.balanceOf(owner.address);
        const transferFrom = await token
          .connect(account)
          .transferFrom(owner.address, account.address, amount);
        await transferFrom.wait();
        const afterAccountBalanceFrom = await token.balanceOf(account.address);
        const afterOwnerBalanceFrom = await token.balanceOf(owner.address);
        assert.equal(
          Number(beforeAccountBalanceFrom) + Number(amount),
          Number(afterAccountBalanceFrom)
        );
        assert.equal(
          Number(beforeOwnerBalanceFrom) - Number(amount),
          Number(afterOwnerBalanceFrom)
        );

        //BURNFROM
        const approvee = await token.approve(account.address, amount);
        await approvee.wait();
        const beforeBurnFromAllowance = await token.allowance(
          owner.address,
          account.address
        );
        const beforeBurnFromOwnerBalance = await token.balanceOf(owner.address);
        const burnFrom = await token
          .connect(account)
          .burnFrom(owner.address, amount);
        await burnFrom.wait();

        const afterBurnFromAllowance = await token.allowance(
          owner.address,
          account.address
        );
        const afterBurnFromOwnerBalance = await token.balanceOf(owner.address);
        assert.equal(
          Number(beforeBurnFromAllowance) - Number(amount),
          Number(afterBurnFromAllowance)
        );
        assert.equal(
          Number(beforeBurnFromOwnerBalance) - Number(amount),
          Number(afterBurnFromOwnerBalance)
        );

        //TRANSFEROWNERSHIP
        const transferOwnership = await token.transferOwnership(
          account.address
        );
        await transferOwnership.wait();
        const newOwnerAccount = await token.owner();
        assert.equal(newOwnerAccount, account.address);

        const transferOwnershipToOwner = await token
          .connect(account)
          .transferOwnership(owner.address);
        await transferOwnershipToOwner.wait();
        const newOwner = await token.owner();
        assert.equal(newOwner, owner.address);
      });
    });
