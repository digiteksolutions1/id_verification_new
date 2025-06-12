const router = require("express").Router();

const adminRoutes = require("./adminRoutes");
const clientRoutes = require("./clientRoutes");

router.use("/admin", adminRoutes);
router.use("/client", clientRoutes);

module.exports = router;
