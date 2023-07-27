const { assert, expect } = require("chai");
const { network, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Token Staging Test", () => {
      let token;
      let owner;
      let account;
      let deployer;
      const amount = ethers.parseEther("0.0000000000000001");

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const [account1, account2] = await ethers.getSigners();
        owner = account1;
        account = account2;

        const Token = await ethers.getContractFactory("Token");
        token = await Token.attach(
          "0x59c37C6Dca1a5FB2A852AaF79746F853907cA9F6"
        );
        const address = await token.getAddress();
      });

      it("Staging Test", async () => {
        //PAUSE
        const paused = await token.connect(owner).pause();
        await paused.wait();
        expect(await token.connect(owner).paused()).to.be.true;

        //UNPAUSE
        const unpaused = await token.connect(owner).unpause();
        await unpaused.wait();
        expect(await token.connect(owner).paused()).to.be.false;

        //MINT
        const beforeTotalSupply = await token.totalSupply();
        const mint = await token.connect(owner).mint(owner.address, amount);
        await mint.wait();
        const afterTotalSupply = await token.totalSupply();
        assert.equal(
          Number(beforeTotalSupply) + Number(amount),
          afterTotalSupply
        );

        //BURN
        const beforeTotalSupplyBurn = await token.totalSupply();
        const burn = await token.connect(owner).burn(amount);
        await burn.wait();
        const afterTotalSupplyBurn = await token.totalSupply();
        assert.equal(
          Number(beforeTotalSupplyBurn) - Number(amount),
          afterTotalSupplyBurn
        );

        //APPROVE
        const approve = await token
          .connect(owner)
          .approve(account.address, amount);
        await approve.wait();
        const allowance = await token.allowance(owner.address, account.address);
        assert.equal(amount, allowance);

        //DECREASEALLOWANCE
        const decreaseAmount = 50;
        const decrese = await token
          .connect(owner)
          .decreaseAllowance(account.address, decreaseAmount);
        await decrese.wait();
        const allowanceDecrease = await token.allowance(
          owner.address,
          account.address
        );
        assert.equal(
          Number(amount) - Number(decreaseAmount),
          Number(allowanceDecrease)
        );

        //INCREASEALLOWANCE
        const increaseAmount = 250;
        const increase = await token
          .connect(owner)
          .increaseAllowance(account.address, increaseAmount);
        await increase.wait();
        const allowanceIncrease = await token.allowance(
          owner.address,
          account.address
        );
        assert.equal(
          Number(allowanceDecrease) + Number(increaseAmount),
          Number(allowanceIncrease)
        );

        //TRANSFER
        const beforeAccountBalance = await token.balanceOf(account.address);
        const beforeOwnerBalance = await token.balanceOf(owner.address);
        const transfer = await token
          .connect(owner)
          .transfer(account.address, amount);
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
        const transferOwnership = await token
          .connect(owner)
          .transferOwnership(account.address);
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
