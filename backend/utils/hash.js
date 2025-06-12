const bcrpt = require("bcryptjs");
const SALT_ROUNDS = 10;

const hash = {
  async hashPassword(password) {
    return await bcrpt.hash(password, SALT_ROUNDS);
  },
  async comparePassword(plaintext, hashText) {
    return await bcrpt.compare(plaintext, hashText);
  },
};

module.exports = hash;
