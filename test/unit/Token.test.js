const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Token", () => {
      let token;
      let owner;
      let account;
      const addressZero = ethers.ZeroAddress;
      const amount = 100;

      beforeEach(async () => {
        const [account1, account2] = await ethers.getSigners();
        owner = account1;
        account = account2;

        const Token = await ethers.getContractFactory("Token");
        token = await Token.deploy();
      });

      describe("constructor", () => {
        it("Total Supply should equal owner balance", async () => {
          let balance = await token.balanceOf(owner.address);
          const totalSupply = await token.totalSupply();

          expect(await balance.toString()).to.equal(totalSupply.toString());
        });

        it("sets the name", async () =>
          expect(await token.name()).to.equal("Token"));

        it("deployment mint", async () => {
          expect(Number(await token.totalSupply())).to.equal(1000);
        });
      });

      describe("Only owner", () => {
        it("pause -account", async () => {
          await expect(token.connect(account).pause())
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(account.address);
        });

        it("pause -owner", async () => {
          await token.connect(owner).pause();
          expect(await token.paused()).to.be.true;
        });

        it("unpause -account", async () => {
          await expect(token.connect(account).unpause())
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(account.address);
        });

        it("unpause -owner", async () => {
          await token.connect(owner).pause();
          await token.connect(owner).unpause();
          expect(await token.paused()).to.be.false;
        });

        it("mint -owner", async () => {
          const beforeTotalSupply = await token.totalSupply();
          await token.connect(owner).mint(owner.address, amount);
          const afterTotalSupply = await token.totalSupply();
          assert.equal(Number(beforeTotalSupply) + amount, afterTotalSupply);
        });

        it("only owner can mint", async () => {
          await expect(token.connect(account).mint(account.address, amount))
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(account.address);
        });
      });

      describe("burnable", () => {
        it("burn works", async () => {
          const beforeOwnerBalance = await token.balanceOf(owner.address);
          await token.connect(owner).burn(amount);
          const afterOwnerBalance = await token.balanceOf(owner.address);
          assert.equal(Number(beforeOwnerBalance) - amount, afterOwnerBalance);
        });

        it("Caller can't be address zero", async () => {
          if (owner.address != addressZero) {
            await token.connect(owner).burn(amount);
          } else {
            await expect(token.connect(owner).burn(amount)).to.be.revertedWith(
              "ERC20: burn from the zero address"
            );
          }
        });

        it("can't burn more than your balance", async () => {
          const exceedsAmount = 1000000;
          const ownerBalance = await token.balanceOf(owner.address);
          if (ownerBalance >= exceedsAmount) {
            token.connect(owner).burn(exceedsAmount);
          } else {
            await expect(token.connect(owner).burn(exceedsAmount))
              .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
              .withArgs(owner.address, ownerBalance, exceedsAmount);
          }
        });

        it("totalSupply should change", async () => {
          const beforeTotalSupply = await token.totalSupply();
          await token.connect(owner).burn(amount);
          const afterTotalSupply = await token.totalSupply();
          assert.equal(Number(beforeTotalSupply) - amount, afterTotalSupply);
        });

        it("burnFrom works -allowance", async () => {
          await token.connect(owner).approve(account.address, amount);
          const beforeAllowance = await token.allowance(
            owner.address,
            account.address
          );
          await token.connect(account).burnFrom(owner.address, amount);
          const allowance = await token.allowance(
            owner.address,
            account.address
          );
          assert.equal(Number(beforeAllowance) - amount, allowance);
        });

        it("burnFrom works -ownerBalance", async () => {
          await token.connect(owner).approve(account.address, amount);
          const beforeOwnerBalance = await token.balanceOf(owner.address);
          await token.connect(account).burnFrom(owner.address, amount);
          const afterOwnerBalance = await token.balanceOf(owner.address);
          assert.equal(Number(beforeOwnerBalance) - amount, afterOwnerBalance);
        });

        it("burnFrom should send error", async () => {
          const allowance = await token.allowance(
            owner.address,
            account.address
          );
          await expect(token.connect(account).burnFrom(owner.address, amount))
            .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
            .withArgs(account.address, allowance, amount);
        });
      });

      describe("allowance", () => {
        it("allowance works", async () => {
          await token.connect(owner).approve(account.address, amount);
          const allowance = await token.allowance(
            owner.address,
            account.address
          );
          assert.equal(amount, allowance);
        });

        it("owner cant be address zero", async () => {
          await token.connect(owner).approve(account.address, amount);
          assert.notEqual(owner.address, addressZero);
        });

        it("spender cant be address zero", async () => {
          await token.connect(owner).approve(account.address, amount);
          assert.notEqual(account.address, addressZero);
        });
      });

      describe("cappable", () => {
        it("cant mint too much", async () => {
          const maxSupply = await token.cap();
          await expect(
            token.connect(owner).mint(owner.address, Number(maxSupply) + 1)
          ).to.be.revertedWithCustomError(token, "ERC20ExceededCap");
        });

        it("mint", async () => {
          const mint = 999_000;
          const beforeOwnerBalance = await token.balanceOf(owner.address);
          await token.connect(owner).mint(owner.address, mint);
          const afterOwnerBalance = await token.balanceOf(owner.address);
          assert.equal(Number(beforeOwnerBalance) + mint, afterOwnerBalance);
        });
      });

      describe("ownership", () => {
        it("transferOwnership works", async () => {
          await token.connect(owner).transferOwnership(account.address);
          const newOwner = await token.owner();
          assert.equal(newOwner, account.address);
        });
        it("new owner cant be address zero", async () => {
          await expect(token.connect(owner).transferOwnership(addressZero))
            .to.be.revertedWithCustomError(token, "OwnableInvalidOwner")
            .withArgs(addressZero);
        });

        it("caller should be owner", async () => {
          await expect(token.connect(account).transferOwnership(addressZero))
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(account.address);
        });

        it("renounceOwnership works", async () => {
          await token.connect(owner).renounceOwnership();
          await expect(token.connect(owner).pause())
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(owner.address);
        });

        it("renounceOwnership should send error", async () => {
          await expect(token.connect(account).renounceOwnership())
            .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
            .withArgs(account.address);
        });
      });

      describe("transfer", () => {
        it("transfer works -accountBalance", async () => {
          const beforeAccountBalance = await token.balanceOf(account.address);
          await token.connect(owner).transfer(account.address, amount);
          const afterAccountBalance = await token.balanceOf(account.address);
          assert.equal(
            Number(beforeAccountBalance) + amount,
            Number(afterAccountBalance)
          );
        });
        it("transfer works -ownerBalance", async () => {
          const beforeOwnerBalance = await token.balanceOf(owner.address);
          await token.connect(owner).transfer(account.address, amount);
          const afterOwnerBalance = await token.balanceOf(owner.address);
          assert.equal(
            Number(beforeOwnerBalance) - amount,
            Number(afterOwnerBalance)
          );
        });
        it("from can't be zero address", async () => {
          await token.connect(owner).transfer(account.address, amount);
          assert.notEqual(owner.address, addressZero);
        });

        it("to can't be zero address", async () => {
          await token.connect(owner).transfer(account.address, amount);
          assert.notEqual(account.address, addressZero);
        });

        it("amount should not bigger than balance", async () => {
          const balance = await token.balanceOf(account.address);

          if (balance >= amount) {
            await token.connect(account).transfer(owner.address, amount);
          } else {
            await expect(token.connect(account).transfer(owner.address, amount))
              .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
              .withArgs(account.address, balance, amount);
          }
        });
      });

      describe("transferFrom", () => {
        it("transferFrom works -accountBalance", async () => {
          await token.connect(owner).approve(account.address, amount);
          const beforeAccountBalance = await token.balanceOf(account.address);
          await token
            .connect(account)
            .transferFrom(owner.address, account.address, amount);
          const afterAccountBalance = await token.balanceOf(account.address);
          assert.equal(
            Number(beforeAccountBalance) + amount,
            Number(afterAccountBalance)
          );
        });
        it("transferFrom works -ownerBalance", async () => {
          await token.connect(owner).approve(account.address, amount);
          const beforeOwnerBalance = await token.balanceOf(owner.address);
          await token
            .connect(account)
            .transferFrom(owner.address, account.address, amount);
          const afterOwnerBalance = await token.balanceOf(owner.address);
          assert.equal(
            Number(beforeOwnerBalance) - amount,
            Number(afterOwnerBalance)
          );
        });
        it("from can't be zero address", async () => {
          await token.connect(owner).approve(account.address, amount);
          await token
            .connect(account)
            .transferFrom(owner.address, account.address, amount);
          assert.notEqual(owner.address, addressZero);
        });

        it("to can't be zero address", async () => {
          await token.connect(owner).approve(account.address, amount);
          await token
            .connect(account)
            .transferFrom(owner.address, account.address, amount);
          assert.notEqual(account.address, addressZero);
        });

        it("amount can't be more than allowance", async () => {
          await token.connect(owner).approve(account.address, amount);
          const allowance = await token.allowance(
            owner.address,
            account.address
          );
          const exceedsAmount = 100000;
          await expect(
            token
              .connect(account)
              .transferFrom(owner.address, account.address, exceedsAmount)
          )
            .to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance")
            .withArgs(account.address, allowance, exceedsAmount);
        });

        it("amount should not bigger than balance", async () => {
          const exceedsAmount = 10000;
          await token.connect(owner).approve(account.address, exceedsAmount);
          const balance = await token.balanceOf(owner.address);

          if (balance >= exceedsAmount) {
            await token
              .connect(account)
              .transferFrom(owner.address, account.address, exceedsAmount);
          } else {
            await expect(
              token
                .connect(account)
                .transferFrom(owner.address, account.address, exceedsAmount)
            )
              .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance")
              .withArgs(owner.address, balance, exceedsAmount);
          }
        });
      });
    });
